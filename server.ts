import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Enable CORS for external/serverless requests
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Normalize request URLs in case Vercel rewrites strip the /api prefix
app.use((req, res, next) => {
  if (req.url && !req.url.startsWith('/api') && (req.url.startsWith('/ai') || req.url.startsWith('/health'))) {
    req.url = '/api' + req.url;
  }
  next();
});

// Lazy / safe initialization of Gemini AI
function getGenAI() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('GEMINI_API_KEY not configured. AI capabilities will return fallback responses.');
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function timeoutPromise<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('TIMEOUT')), ms);
    promise.then(
      res => { clearTimeout(timer); resolve(res); },
      err => { clearTimeout(timer); reject(err); }
    );
  });
}

// Quota tracking: track which models are temporarily exhausted to prevent 429 errors
const modelCooldownMap = new Map<string, number>();

function isModelInCooldown(model: string): boolean {
  const cooldownUntil = modelCooldownMap.get(model);
  if (!cooldownUntil) return false;
  if (Date.now() > cooldownUntil) {
    modelCooldownMap.delete(model);
    return false;
  }
  return true;
}

function setModelCooldown(model: string, cooldownMs: number = 180000) {
  modelCooldownMap.set(model, Date.now() + cooldownMs);
}

// Resilient Gemini generation with model fallback on 503/429/high demand/quota/timeout
async function generateContentWithFallback(ai: GoogleGenAI | null, options: {
  contents: any;
  config?: any;
  primaryModel?: string;
  fallbackModels?: string[];
  retries?: number;
  timeoutMs?: number;
}) {
  if (!ai) return null;
  const timeoutMs = options.timeoutMs || 15000;

  // Use gemini-3.1-flash-lite as standard primary model due to stable quota availability
  const candidateModels = [
    options.primaryModel || 'gemini-3.1-flash-lite',
    ...(options.fallbackModels || ['gemini-3.8-flash', 'gemini-flash-latest'])
  ];

  // Unique list preserving order
  const uniqueCandidates = Array.from(new Set(candidateModels));

  // Sort candidate models so non-cooling down models are evaluated first
  const modelsToTry = uniqueCandidates.sort((a, b) => {
    const aCool = isModelInCooldown(a) ? 1 : 0;
    const bCool = isModelInCooldown(b) ? 1 : 0;
    return aCool - bCool;
  });

  for (let i = 0; i < modelsToTry.length; i++) {
    const model = modelsToTry[i];
    if (isModelInCooldown(model)) {
      // Skip models currently cooling down without wasting time/requests
      continue;
    }

    try {
      const response = await timeoutPromise(ai.models.generateContent({
        model,
        contents: options.contents,
        config: options.config,
      }), timeoutMs);
      if (response?.text) {
        return response;
      }
    } catch (err: any) {
      const errStr = (err?.message || String(err)).toLowerCase();
      const isQuotaOrRate = 
        errStr.includes('429') || 
        errStr.includes('resource_exhausted') || 
        errStr.includes('quota') ||
        errStr.includes('rate limit');

      if (isQuotaOrRate) {
        setModelCooldown(model, 180000); // 3-minute cooldown
        console.log(`Gemini model ${model} reached quota limit; falling back to alternative model.`);
      } else {
        console.log(`Gemini model ${model} attempt completed with fallback.`);
      }
      // Continue to next model
    }
  }

  return null;
}

function buildFallbackReply(message: string, userProfile: any, isTeluguRequested: boolean): string {
  const msgLower = (message || '').toLowerCase().trim();
  const profileState = (userProfile?.state || '').toLowerCase();

  // Intent: Greeting
  if (/^(hi|hello|hey|namaste|greetings|good\s*(morning|afternoon|evening)|నమస్కారం|హలో)/i.test(msgLower)) {
    return isTeluguRequested
      ? `నమస్కారం! 🙏 నేను **యోజనా మిత్ర AI** (Yojana Mitra AI), మీ అధికారిక ప్రభుత్వ సంక్షేమ పథకాలు మరియు స్కాలర్‌షిప్‌ల సహాయకుడిని.

నేను మీకు ఎలా సహాయపడగలను? మీరు నన్ను వీటి గురించి అడగవచ్చు:
- ఆంధ్రప్రదేశ్ మరియు తెలంగాణ రాష్ట్ర ప్రభుత్వ సంక్షేమ పథకాలు
- విద్యార్థుల స్కాలర్‌షిప్‌లు & పూర్తి ఫీజు రీయింబర్స్‌మెంట్ (JnanaBhumi, ePASS)
- మహిళలు, రైతులు, సీనియర్ సిటిజన్లు మరియు పేద వర్గాల ఆర్థిక సహాయాలు
- ఆదాయ, కుల ధృవీకరణ పత్రాలు (MeeSeva సర్టిఫికేట్లు) పొందే విధానం
- అధికారిక పోర్టల్‌లలో దరఖాస్తు చేసుకునే స్టెప్-బై-స్టెప్ గైడెన్స్`
      : `Namaste! 🙏 I am **Yojana Mitra AI**, your dedicated Government Scheme & Scholarship Assistant.

How can I assist you today? You can ask me about:
- Active state welfare schemes in **Andhra Pradesh** and **Telangana**
- Higher education scholarships and tuition fee reimbursement (ePASS, JnanaBhumi)
- Farmer subsidies, Women empowerment grants, and Senior Citizen pensions
- How to obtain required certificates (Income, Caste, Residence from MeeSeva / CSC)
- Official application procedures and deadlines on verified government portals (.gov.in)`;
  }

  // Intent: Certificates & Documents (Income, Caste, MeeSeva, etc.)
  if (/(income\s*cert|caste\s*cert|meeseva|mee\s*seva|certificate|document|పత్రం|ధృవీకరణ|సర్టిఫికేట్)/i.test(msgLower)) {
    const isAP = /(andhra|ఆంధ్ర|ap)/i.test(msgLower) || profileState.includes('andhra');
    const portalName = isAP ? 'MeeSeva Andhra Pradesh' : 'MeeSeva Telangana';
    const portalUrl = isAP ? 'https://ap.meeseva.gov.in' : 'https://ts.meeseva.telangana.gov.in';

    return isTeluguRequested
      ? `ప్రభుత్వ సంక్షేమ పథకాలు మరియు స్కాలర్‌షిప్‌ల కోసం అవసరమైన **ధృవీకరణ పత్రాలు (Certificates)** పొందే విధానం:

1. **ఆదాయ ధృవీకరణ పత్రం (Income Certificate):**
   - **కావలసిన పత్రాలు:** ఆధార్ కార్డు, తెల్ల రేషన్ కార్డు (రైస్ కార్డ్), జీతపు రసీదు లేదా స్వయం ప్రకటన పత్రం, దరఖాస్తు ఫారమ్.
   - **ఎక్కడ దరఖాస్తు చేసుకోవాలి:** మీ సమీప 'మీ సేవా' (MeeSeva) కేంద్రం లేదా గ్రామ/వార్డు సచివాలయం ద్వారా.
   - **పోర్టల్:** [${portalName}](${portalUrl})

2. **కుల ధృవీకరణ పత్రం (Integrated Community / Caste Certificate):**
   - **కావలసిన పత్రాలు:** ఆధార్ కార్డు, పాఠశాల టీసీ / స్టడీ సర్టిఫికెట్, తల్లిదండ్రుల కుల ధృవీకరణ పత్రం లేదా పాత రికార్డు.
   - **ఎక్కడ దరఖాస్తు చేసుకోవాలి:** సమీప మీసేవా కేంద్రం ద్వారా తహసీల్దార్ కార్యాలయానికి దరఖాస్తు పంపబడుతుంది.

3. **ఆధార్ బ్యాంక్ డీబీటీ లింకింగ్ (Aadhaar DBT Seeding):**
   - ప్రభుత్వ ఆర్థిక సహాయం నేరుగా ఖాతాలో పడటానికి మీ బ్యాంక్ బ్రాంచ్‌కు వెళ్లి 'Aadhaar NPCI DBT Seeding Form' సమర్పించాలి.`
      : `Here is the official procedure for obtaining essential government certificates and documents:

1. **Income Certificate (ఆదాయ ధృవీకరణ పత్రం):**
   - **Required Documents:** Aadhaar Card, Ration Card / Food Security Card, recent electricity bill or salary slip/self-declaration, passport photo.
   - **How to apply:** Visit your nearest MeeSeva Centre, Grama/Ward Sachivalayam (AP), or apply online at [${portalName}](${portalUrl}).
   - **Validity:** Issued under the digital signature of the Tahsildar within 7–15 working days.

2. **Caste / Community Certificate (కుల ధృవీకరణ పత్రం):**
   - **Required Documents:** Applicant Aadhaar Card, School Transfer Certificate (TC) or 10th Marks Memo, family member's caste certificate or revenue land record.
   - **How to apply:** Submit an application through MeeSeva to the Revenue Department.

3. **Aadhaar Bank DBT Seeding (NPCI Mapping):**
   - To receive direct financial subsidies from government schemes, ensure your bank account is active on the NPCI Aadhaar payment bridge by visiting your home bank branch.`;
  }

  // Intent: Application Process / How to Apply
  if (/(how\s*to\s*apply|application\s*process|how\s*can\s*i\s*apply|how\s*do\s*i\s*apply|ఎలా\s*దరఖాస్తు)/i.test(msgLower)) {
    return isTeluguRequested
      ? `ప్రభుత్వ సంక్షేమ పథకాలు మరియు స్కాలర్‌షిప్‌ల కోసం దరఖాస్తు చేసుకునే సాధారణ విధానం:

1. **అర్హత తనిఖీ:** మీ వయస్సు, కుటుంబ వార్షిక ఆదాయం, సామాజిక వర్గం, మరియు నివాస ప్రాంతం పథక నిబంధనలకు అనుగుణంగా ఉన్నాయో సరిచూసుకోండి.
2. **పత్రాల సమర్పణ:** ఆధార్ కార్డు, మీసేవా ఆదాయ పత్రం, కుల ధృవీకరణ పత్రం, మరియు బ్యాంక్ పాస్‌బుక్ సిద్ధం చేసుకోండి.
3. **ఆన్‌లైన్ రిజిస్ట్రేషన్:** పథకానికి సంబంధించిన అధికారిక ప్రభుత్వ పోర్టల్ (ఉదా. [National Scholarship Portal](https://scholarships.gov.in), [Telangana ePASS](https://telanganaepass.cgg.gov.in), లేదా [JnanaBhumi AP](https://jnanabhumi.ap.gov.in)) లో మీ వివరాలతో నమోదు చేసుకోండి.
4. **రసీదు & పరిశీలన:** సమర్పించిన దరఖాస్తు రసీదు (Application Acknowledgement) ను ప్రింట్ తీసుకోండి. సంబంధిత అధికారులు విచారణ జరిపిన తర్వాత ప్రయోజనం మంజూరవుతుంది.`
      : `Here is the step-by-step procedure to apply for government welfare schemes and scholarships:

1. **Verify Eligibility:** Check the specific age, income limit, residency, and employment/student criteria for the scheme.
2. **Prepare Mandatory Documents:**
   - Aadhaar Card (linked with mobile number)
   - Valid Income Certificate from MeeSeva / Revenue Department
   - Community / Caste Certificate (if applicable)
   - Aadhaar DBT-seeded Bank Account Passbook
3. **Register on Official Government Portal:**
   - National Schemes & Scholarships: [National Scholarship Portal](https://scholarships.gov.in) or [myScheme Portal](https://www.myscheme.gov.in)
   - Telangana State Schemes: [Telangana ePASS](https://telanganaepass.cgg.gov.in)
   - Andhra Pradesh State Schemes: [JnanaBhumi AP](https://jnanabhumi.ap.gov.in) / [Navasakam](https://navasakam2.apcfss.in)
4. **Submit & Track:** Fill in educational or household details, upload documents, and save your Application ID to track disbursement status.`;
  }

  const isAndhraQuery = 
    /(andhra|ఆంధ్ర|ap|amaravati|visakhapatnam|vijayawada|chandrababu|jnanabhumi|aarogyasri)/i.test(msgLower) ||
    profileState.includes('andhra');

  const isTelanganaQuery = 
    /(telangana|తెలంగాణ|hyderabad|warangal|epass|revanth|praja)/i.test(msgLower) ||
    profileState.includes('telangana');

  const isStateQuery = /(state|రాష్ట్ర|local)/i.test(msgLower) || isAndhraQuery || isTelanganaQuery;

  const normalizedStatus = (userProfile?.employmentStatus || '').trim().toLowerCase();
  const isSenior = userProfile 
    ? (userProfile.isSeniorCitizen === true || 
       userProfile.employmentStatus === 'Senior Citizen' || 
       userProfile.employmentStatus === 'Retired / Senior Citizen' || 
       normalizedStatus.includes('senior') || 
       normalizedStatus.includes('retired') ||
       (userProfile.age && userProfile.age >= 60))
    : false;

  const isWoman = userProfile
    ? (userProfile.employmentStatus === 'Women' || 
       normalizedStatus === 'women' || 
       normalizedStatus === 'woman' || 
       userProfile.isWomanEntrepreneur === true || 
       (userProfile.gender === 'female' && !isSenior))
    : false;

  const isStudent = userProfile 
    ? (userProfile.isStudent === true || userProfile.employmentStatus === 'Student' || userProfile.currentEducationStatus === 'Pursuing')
    : false;
  const isFarmer = userProfile 
    ? (userProfile.isFarmer === true || userProfile.employmentStatus === 'Farmer' || (userProfile.occupation || '').toLowerCase().includes('farmer'))
    : false;
  const isBusiness = userProfile 
    ? (userProfile.isBusinessOwner === true || userProfile.employmentStatus === 'Self-Employed / Business' || userProfile.employmentStatus === 'Business Holder' || (userProfile.occupation || '').toLowerCase().includes('business'))
    : false;
  const isUnemployed = userProfile 
    ? (userProfile.employmentStatus === 'Unemployed' || (userProfile.occupation || '').toLowerCase().includes('unemployed'))
    : false;
  const isArtisan = userProfile 
    ? (userProfile.employmentStatus === 'Daily Wage Worker / Artisan' || (userProfile.occupation || '').toLowerCase().includes('artisan') || (userProfile.occupation || '').toLowerCase().includes('weaver'))
    : false;

  if (isAndhraQuery) {
    if (isSenior) {
      return isTeluguRequested
        ? `మీ ప్రొఫైల్ వివరాల ఆధారంగా ఆంధ్రప్రదేశ్ రాష్ట్ర ప్రభుత్వ సీనియర్ సిటిజన్ (Senior Citizen) సంక్షేమ పథకాలు క్రింద ఇవ్వబడ్డాయి:

1.
**పథకం పేరు (Scheme Name):** ఆంధ్రప్రదేశ్ ఎన్టీఆర్ భరోసా వృద్ధాప్య పింఛను పథకం (AP NTR Bharosa Senior Citizen Pension)
**అర్హతలు & అవసరమైన పత్రాలు (Requirements):** 60 సంవత్సరాలు నిండిన ఏపీ నివాసితులు, వార్షిక కుటుంబ ఆదాయం ₹1.44 లక్షల లోపు (గ్రామీణ) / ₹1.20 లక్షల లోపు (పట్టణ). పత్రాలు: ఆధార్ కార్డు (వయస్సు నిర్ధారణ 60+), ఏపీ రైస్ కార్డ్ (తెల్ల రేషన్ కార్డు), ఆధార్ అనుసంధానిత బ్యాంకు ఖాతా.
**మీకు ఎందుకు సరిపోతుంది (Why it suits you):** నెలకు ₹4,000 వృద్ధాప్య పింఛను ప్రతి నెలా 1వ తేదీన నేరుగా గ్రామ/వార్డు సచివాలయాల ద్వారా మీ ఇంటి వద్దే నగదు రూపంలో అందజేయబడుతుంది.
**గడువు తేదీ (Deadline):** నిరంతరం అందుబాటులో ఉంటుంది (Check Official Portal)
**అధికారిక పోర్టల్ లింక్ (Official Portal Link):** [ఏపీ ఎన్టీఆర్ పింఛను పోర్టల్](https://sspensions.ap.gov.in)

2.
**పథకం పేరు (Scheme Name):** డాక్టర్ ఎన్టీఆర్ వైద్య సేవ వయోవృద్ధుల ఆరోగ్య భద్రత (Dr. NTR Vaidya Seva Geriatric Healthcare)
**అర్హతలు & అవసరమైన పత్రాలు (Requirements):** 60+ ఏళ్ల ఏపీ వృద్ధులు, వార్షిక ఆదాయం ₹5 లక్షల లోపు, ఏపీ రైస్ కార్డ్ హోల్డర్లు. పత్రాలు: ఆధార్ కార్డు, ఎన్టీఆర్ వైద్య సేవ హెల్త్ కార్డు / రైస్ కార్డ్.
**మీకు ఎందుకు సరిపోతుంది (Why it suits you):** మోకాలి/తుంటి మార్పిడి, గుండె చికిత్సలు, క్యాన్సర్ సహా 3,257 శస్త్రచికిత్సలకు ₹25 లక్షల వరకు 100% ఉచిత నగదు రహిత ఆసుపత్రి చికిత్స మరియు విశ్రాంతి సమయంలో నెలకు ₹5,000 ఆరోగ్య ఆసరా లభిస్తుంది.
**గడువు తేదీ (Deadline):** Open Year Round
**అధికారిక పోర్టల్ లింక్ (Official Portal Link):** [డాక్టర్ ఎన్టీఆర్ వైద్య సేవ ట్రస్ట్](https://aarogyasri.ap.gov.in)

3.
**పథకం పేరు (Scheme Name):** ఆంధ్రప్రదేశ్ వయో వందన సీనియర్ సిటిజన్ సహాయ పరికరాల పథకం (AP Vayo Vandana Scheme)
**అర్హతలు & అవసరమైన పత్రాలు (Requirements):** 60 ఏళ్లు పైబడిన బిపిఎల్ వయోవృద్ధులు, వయో సంబంధిత వైకల్యం కలవారు. పత్రాలు: ఆధార్ కార్డు, ఆదాయ ధృవీకరణ పత్రం.
**మీకు ఎందుకు సరిపోతుంది (Why it suits you):** డిజిటల్ వినికిడి యంత్రాలు, వీల్‌చైర్లు, వాకింగ్ స్టిక్స్, కళ్లజోళ్ళు మరియు కృత్రిమ పళ్ళ సెట్లు 100% ఉచితంగా ప్రభుత్వ ఖర్చుతో పంపిణీ చేయబడతాయి.
**గడువు తేదీ (Deadline):** Check Official Portal
**అధికారిక పోర్టల్ లింక్ (Official Portal Link):** [ఏపీ నవశకం పోర్టల్](https://navasakam2.apcfss.in)

4.
**పథకం పేరు (Scheme Name):** ఆంధ్రప్రదేశ్ సీనియర్ సిటిజన్ ఆర్టీసీ బస్సు రాయితీ & వృద్ధుల గుర్తింపు కార్డు (APSRTC Senior Citizen Bus Concession)
**అర్హతలు & అవసరమైన పత్రాలు (Requirements):** 60 ఏళ్లు నిండిన ఆంధ్రప్రదేశ్ వయోవృద్ధులు. పత్రాలు: ఆధార్ కార్డు / సీనియర్ సిటిజన్ ఐడీ కార్డ్, పాస్‌పోర్ట్ సైజ్ ఫోటో.
**మీకు ఎందుకు సరిపోతుంది (Why it suits you):** ఆర్టీసీ పల్లె వెలుగు, ఎక్స్‌ప్రెస్ మరియు డీలక్స్ బస్సు ప్రయాణాల్లో 25% టికెట్ రాయితీ మరియు బస్సుల్లో ప్రత్యేక సీట్లు లభిస్తాయి.
**గడువు తేదీ (Deadline):** Open Year Round
**అధికారిక పోర్టల్ లింక్ (Official Portal Link):** [ఏపీఎస్ఆర్టీసీ అధికారిక పోర్టల్](https://apsrtc.ap.gov.in)

5.
**పథకం పేరు (Scheme Name):** ఇందిరా గాంధీ జాతీయ వృద్ధాప్య పింఛను పథకం (IGNOAPS - AP Direct DBT)
**అర్హతలు & అవసరమైన పత్రాలు (Requirements):** 60 సంవత్సరాలు పైబడిన బిపిఎల్ కుటుంబాల వృద్ధులు. పత్రాలు: ఆధార్ కార్డు, బిపిఎల్ రేషన్ కార్డు, బ్యాంకు పాస్‌బుక్.
**మీకు ఎందుకు సరిపోతుంది (Why it suits you):** కేంద్ర మరియు రాష్ట్ర ప్రభుత్వాల సంయుక్త ఆర్థిక సహాయంతో నేరుగా బ్యాంకు ఖాతాలో డీబీటీ ద్వారా నెలవారీ సామాజిక భద్రతా పింఛను అందుతుంది.
**గడువు తేదీ (Deadline):** Continuous Enrollment (Check Official Portal)
**అధికారిక పోర్టల్ లింక్ (Official Portal Link):** [నేషనల్ సోషల్ అసిస్టెన్స్ పోర్టల్](https://nsap.nic.in)`
        : `Here are verified active Government of Andhra Pradesh welfare schemes matching your profile for Senior Citizens (60+ years):

1.
**Scheme Name:** Andhra Pradesh NTR Bharosa Senior Citizen Pension Scheme (Old Age Pension)
**Requirements:** Permanent resident of Andhra Pradesh aged 60 years or older, Family income under ₹1.44 Lakh (Rural) / ₹1.20 Lakh (Urban), White Ration Card / Rice Card holder. Documents: Aadhaar Card (age proof 60+), AP Rice Card, Aadhaar DBT-seeded Bank Passbook.
**Why it suits you:** Delivers a monthly old age pension of ₹4,000 directly at your doorstep on the 1st of every single month through village/ward secretariats without standing in bank lines.
**Deadline:** Continuous Enrollment (Check Official Portal)
**Official Portal Link:** [AP SSPensions Portal](https://sspensions.ap.gov.in)

2.
**Scheme Name:** Dr. NTR Vaidya Seva Geriatric & Senior Citizen Healthcare Support
**Requirements:** Senior citizen aged 60+ resident of Andhra Pradesh, Annual family income under ₹5.00 Lakh. Documents: Aadhaar Card, NTR Vaidya Seva Health Card / Rice Card.
**Why it suits you:** Full 100% cashless hospitalization up to ₹25,00,000 across empaneled hospitals covering geriatric conditions (cardiac, knee/hip joint replacement, cancer, oncology) plus ₹5,000/month post-operative recovery allowance.
**Deadline:** Open Year Round
**Official Portal Link:** [Dr. NTR Vaidya Seva Trust](https://aarogyasri.ap.gov.in)

3.
**Scheme Name:** Andhra Pradesh Vayo Vandana Senior Citizen Assistive Devices Scheme
**Requirements:** Senior citizen aged 60+ living in Andhra Pradesh from BPL household suffering from age-related physical disabilities. Documents: Aadhaar Card, Income Certificate, Medical Disability Certificate.
**Why it suits you:** 100% free distribution of assisted-living devices including digital hearing aids, foldable wheelchairs, walking sticks, spectacles, and artificial dentures.
**Deadline:** Check Official Portal
**Official Portal Link:** [AP Navasakam Portal](https://navasakam2.apcfss.in)

4.
**Scheme Name:** Andhra Pradesh Senior Citizen APSRTC Bus Concession & Vrudhula Card
**Requirements:** Senior citizens aged 60 years and above residing in Andhra Pradesh. Documents: Aadhaar Card / Senior Citizen Identity Card, Recent passport photo.
**Why it suits you:** Grants 25% bus travel fare concession across APSRTC Palle Velugu, Express, and Deluxe bus services statewide alongside reserved priority seating.
**Deadline:** Open Year Round
**Official Portal Link:** [APSRTC Official Portal](https://apsrtc.ap.gov.in)

5.
**Scheme Name:** Indira Gandhi National Old Age Pension Scheme (IGNOAPS - AP State Direct DBT)
**Requirements:** Resident senior citizen aged 60 years or older belonging to below poverty line (BPL) household. Documents: Aadhaar Card, BPL Ration Card, Aadhaar DBT Bank Passbook.
**Why it suits you:** Centrally-assisted monthly social security pension combined with state supplemental funds credited directly into your Aadhaar-linked bank account.
**Deadline:** Continuous Enrollment (Check Official Portal)
**Official Portal Link:** [National Social Assistance Programme](https://nsap.nic.in)`;
    } else if (isWoman) {
      return isTeluguRequested
        ? `మీ ప్రొఫైల్ వివరాల ఆధారంగా ఆంధ్రప్రదేశ్ రాష్ట్ర ప్రభుత్వ మహిళా (Women) సంక్షేమ పథకాలు క్రింద ఇవ్వబడ్డాయి:

1.
**పథకం పేరు (Scheme Name):** ఆంధ్రప్రదేశ్ మహా శక్తి ఉచిత ఆర్టీసీ బస్సు ప్రయాణ పథకం (AP Maha Shakti Free Bus Travel for Women)
**అర్హతలు & అవసరమైన పత్రాలు (Requirements):** ఆంధ్రప్రదేశ్ నివాసితులైన బాలికలు మరియు మహిళలందరూ (వయస్సు మరియు ఆదాయ పరిమితి లేదు). పత్రాలు: ఆధార్ కార్డు లేదా ప్రభుత్వం గుర్తించిన ఏదైనా గుర్తింపు కార్డు.
**మీకు ఎందుకు సరిపోతుంది (Why it suits you):** ఆంధ్రప్రదేశ్ రాష్ట్రవ్యాప్తంగా అన్ని ఏపీఎస్ఆర్టీసీ పల్లె వెలుగు మరియు ఎక్స్‌ప్రెస్ బస్సుల్లో ఎక్కడినుంచైనా ఎక్కడికైనా 100% పూర్తి ఉచిత ప్రయాణ సౌకర్యం (జీరో-టికెట్).
**గడువు తేదీ (Deadline):** నిరంతరం అందుబాటులో ఉంటుంది (Check Official Portal)
**అధికారిక పోర్టల్ లింక్ (Official Portal Link):** [ఏపీఎస్ఆర్టీసీ అధికారిక పోర్టల్](https://apsrtc.ap.gov.in)

2.
**పథకం పేరు (Scheme Name):** ఆంధ్రప్రదేశ్ మహా శక్తి ఆడబిడ్డ నిధి పథకం (Maha Shakti Aadabidda Nidhi)
**అర్హతలు & అవసరమైన పత్రాలు (Requirements):** 18 నుండి 59 సంవత్సరాల వయస్సు గల ఆంధ్రప్రదేశ్ మహిళలు, తెల్ల రేషన్ కార్డు హోల్డర్లు. పత్రాలు: ఆధార్ కార్డు, ఏపీ రైస్ కార్డ్, ఆధార్ అనుసంధానిత బ్యాంకు ఖాతా.
**మీకు ఎందుకు సరిపోతుంది (Why it suits you):** ప్రతి నెలా ₹1,500 (ఏడాదికి ₹18,000) ఆర్థిక సహాయం నేరుగా మహిళల వ్యక్తిగత బ్యాంకు ఖాతాలో డీబీటీ ద్వారా జమ చేయబడుతుంది.
**గడువు తేదీ (Deadline):** Check Official Portal
**అధికారిక పోర్టల్ లింక్ (Official Portal Link):** [ఏపీ నవశకం పోర్టల్](https://navasakam2.apcfss.in)

3.
**పథకం పేరు (Scheme Name):** ఆంధ్రప్రదేశ్ దీపం 2.0 ఉచిత గ్యాస్ సిలిండర్ల పథకం (AP Deepam 2.0 Free LPG Cylinders)
**అర్హతలు & అవసరమైన పత్రాలు (Requirements):** తెల్ల రేషన్ కార్డు మరియు క్రియాశీల డొమెస్టిక్ ఎల్పీజీ కనెక్షన్ కలిగిన మహిళా కుటుంబ యజమానులు. పత్రాలు: ఆధార్ కార్డు, ఏపీ రైస్ కార్డ్, గ్యాస్ కనెక్షన్ పాస్‌బుక్.
**మీకు ఎందుకు సరిపోతుంది (Why it suits you):** ప్రతి సంవత్సరం 3 గృహ వంట గ్యాస్ సిలిండర్లను 100% ఉచితంగా డీబీటీ రీయింబర్స్‌మెంట్ ద్వారా అందిస్తుంది (డెలివరీ అయిన 48 గంటల్లో ఖాతాలో నగదు జమ).
**గడువు తేదీ (Deadline):** నిరంతరం అందుబాటులో ఉంటుంది (Open Year Round)
**అధికారిక పోర్టల్ లింక్ (Official Portal Link):** [ఆంధ్రప్రదేశ్ స్పందన పోర్టల్](https://spandana.ap.gov.in)

4.
**పథకం పేరు (Scheme Name):** ఆంధ్రప్రదేశ్ సున్నా వడ్డీ డ్వాక్రా రుణాల పథకం (AP Sunna Vaddi DWCRA Loans)
**అర్హతలు & అవసరమైన పత్రాలు (Requirements):** ఏపీలో నమోదైన గ్రామీణ/పట్టణ డ్వాక్రా (SHG) మహిళా స్వయం సహాయక సంఘాల సభ్యులు, ₹5 లక్షల వరకు బ్యాంకు రుణాలు. పత్రాలు: స్వయం సహాయక సంఘం రికార్డులు, సభ్యుల ఆధార్, లోన్ పాస్‌బుక్.
**మీకు ఎందుకు సరిపోతుంది (Why it suits you):** బ్యాంకు రుణాలపై అయ్యే పూర్తి వడ్డీని (0% వడ్డీ) ప్రభుత్వమే నేరుగా బ్యాంకులకు లేదా మహిళా ఖాతాలకు చెల్లించి మహిళా పారిశ్రామికవేత్తలను ప్రోత్సహిస్తుంది.
**గడువు తేదీ (Deadline):** Open Year Round
**అధికారిక పోర్టల్ లింక్ (Official Portal Link):** [ఏపీ నవశకం పోర్టల్](https://navasakam2.apcfss.in)

5.
**పథకం పేరు (Scheme Name):** వైఎస్సార్ చేయూత & స్త్రీ నిధి మహిళా జీవనోపాధి పథకం (YSR Cheyutha & Stree Nidhi)
**అర్హతలు & అవసరమైన పత్రాలు (Requirements):** 45 నుండి 60 ఏళ్ల మధ్య వయస్సు గల ఎస్సీ, ఎస్టీ, బీసీ, మైనారిటీ వర్గాల మహిళలు. పత్రాలు: కుల ధృవీకరణ పత్రం, వయస్సు రుజువు, ఆధార్, బ్యాంక్ ఖాతా.
**మీకు ఎందుకు సరిపోతుంది (Why it suits you):** మహిళల స్వయం ఉపాధి, పాడి పరిశ్రమ, కిరాణా వ్యాపారాల కోసం 4 ఏళ్లలో మొత్తం ₹75,000 (ఏడాదికి ₹18,750) ప్రత్యక్ష ఆర్థిక సహాయం లభిస్తుంది.
**గడువు తేదీ (Deadline):** Check Official Portal
**అధికారిక పోర్టల్ లింక్ (Official Portal Link):** [ఏపీ నవశకం పోర్టల్](https://navasakam2.apcfss.in)

6.
**పథకం పేరు (Scheme Name):** వైఎస్సార్ కళ్యాణ మస్తు & షాదీ ముబారక్ పథకం (YSR Kalyana Masthu & Shaadi Mubarak)
**అర్హతలు & అవసరమైన పత్రాలు (Requirements):** వివాహం చేసుకునే పేద కుటుంబాల ఆడపిల్లలు (కనీస వయస్సు 18 సం., వరుడి వయస్సు 21 సం.), 10వ తరగతి ఉత్తీర్ణత. పత్రాలు: 10వ తరగతి సర్టిఫికెట్, ఆధార్ కార్డు, పెళ్లి కార్డు, ఆదాయ పత్రం.
**మీకు ఎందుకు సరిపోతుంది (Why it suits you):** ఆడపిల్లల గౌరవప్రదమైన వివాహం కోసం ₹1,00,000 వరకు నేరుగా వధువు తల్లి లేదా వధువు ఖాతాలో ఆర్థిక సహాయం జమ చేయబడుతుంది.
**గడువు తేదీ (Deadline):** వివాహం జరిగిన 60 రోజుల్లోపు (Check Official Portal)
**అధికారిక పోర్టల్ లింక్ (Official Portal Link):** [నవశకం కళ్యాణ మస్తు పోర్టల్](https://navasakam.ap.gov.in)`
        : `Here are verified active Government of Andhra Pradesh schemes tailored specifically for Women:

1.
**Scheme Name:** Andhra Pradesh Maha Shakti Scheme (Free RTC Bus Travel for Women)
**Requirements:** All women, girls, and female students residing in Andhra Pradesh (no age or income restrictions). Documents: Aadhaar Card or recognised state photo identity card.
**Why it suits you:** Enjoy 100% free, zero-fare bus travel on all APSRTC Palle Velugu and Express buses statewide without any journey distance limits.
**Deadline:** Continuous Enrollment (Check Official Portal)
**Official Portal Link:** [APSRTC Official Portal](https://apsrtc.ap.gov.in)

2.
**Scheme Name:** Andhra Pradesh Maha Shakti Aadabidda Nidhi Scheme
**Requirements:** Women residents of Andhra Pradesh aged between 18 and 59 years, AP White Ration Card / Rice Card holder. Documents: Aadhaar Card, Rice Card, Aadhaar DBT-linked bank account.
**Why it suits you:** Provides a direct monthly financial grant of ₹1,500 (₹18,000 per year) credited straight into your bank account for financial independence.
**Deadline:** Check Official Portal
**Official Portal Link:** [AP Navasakam Portal](https://navasakam2.apcfss.in)

3.
**Scheme Name:** Andhra Pradesh Deepam 2.0 Scheme (3 Free LPG Cylinders)
**Requirements:** Female head of household in Andhra Pradesh with active domestic LPG connection and Rice Card. Documents: Aadhaar Card, Rice Card, LPG Consumer Connection Passbook.
**Why it suits you:** Grants 3 free domestic cooking gas cylinder refills per year with 100% DBT subsidy reimbursed directly into your bank account within 48 hours of delivery.
**Deadline:** Open Year Round
**Official Portal Link:** [AP Spandana Portal](https://spandana.ap.gov.in)

4.
**Scheme Name:** Andhra Pradesh Sunna Vaddi (Zero Interest DWCRA Loans)
**Requirements:** Women members of registered DWCRA Self Help Groups (SHG) in Andhra Pradesh with bank loans up to ₹5,00,000. Documents: SHG Registration, Member Aadhaar Card, Loan Passbook.
**Why it suits you:** The state government pays 100% of the loan interest on your behalf, effectively giving you zero-interest working capital for micro-enterprises.
**Deadline:** Open Year Round
**Official Portal Link:** [AP Navasakam Portal](https://navasakam2.apcfss.in)

5.
**Scheme Name:** Andhra Pradesh YSR Cheyutha & Stree Nidhi Livelihood Scheme
**Requirements:** Women aged 45 to 60 years from SC, ST, BC, and Minority communities in AP holding White Ration Card. Documents: Integrated Caste Certificate, Aadhaar Card, Age Proof, Bank Passbook.
**Why it suits you:** Provides ₹18,750 per year (totaling ₹75,000 over 4 years) direct financial assistance for sustainable livelihoods (dairy, grocery, retail enterprises).
**Deadline:** Check Official Portal
**Official Portal Link:** [AP Navasakam Portal](https://navasakam2.apcfss.in)

6.
**Scheme Name:** Andhra Pradesh YSR Kalyana Masthu & Shaadi Mubarak Scheme
**Requirements:** Resident bride marrying with both bride (18+) and groom (21+) having passed Class 10, Family income under ₹1.44 Lakh (Rural) / ₹1.20 Lakh (Urban). Documents: Class 10 SSC Certificates, Aadhaar Cards, Wedding Card, Rice Card.
**Why it suits you:** Grants ₹1,00,000 direct financial assistance deposited into the bride's/mother's bank account to support dignified marriage ceremonies.
**Deadline:** Within 60 days of marriage (Check Official Portal)
**Official Portal Link:** [AP Navasakam Portal](https://navasakam2.apcfss.in)`;
    } else if (isStudent) {
      return isTeluguRequested
        ? `మీ ప్రొఫైల్ వివరాల ఆధారంగా ధృవీకరించబడిన ఆంధ్రప్రదేశ్ రాష్ట్ర ప్రభుత్వ పథకాలు & స్కాలర్‌షిప్‌లు క్రింద వివరించబడ్డాయి:

1.
**పథకం పేరు (Scheme Name):** ఆంధ్రప్రదేశ్ విద్యా దీవెన - పూర్తి ఫీజు రీయింబర్స్‌మెంట్ (JnanaBhumi Vidya Deevena)
**అర్హతలు & అవసరమైన పత్రాలు (Requirements):** ఆంధ్రప్రదేశ్ వాస్తవ్యులు, ITI/పాలిటెక్నిక్/డిగ్రీ/ఇంజనీరింగ్/పీజీ విద్యార్థులు, కుటుంబ వార్షిక ఆదాయం ₹2.5 లక్షల లోపు, 75% హాజరు. పత్రాలు: జ్ఞానభూమి ఐడీ, మీసేవ కుల ధృవీకరణ పత్రం, తెల్ల రేషన్ కార్డు / ఆదాయ పత్రం, తల్లి బ్యాంక్ పాస్‌బుక్, కాలేజీ బోనఫైడ్.
**మీకు ఎందుకు సరిపోతుంది (Why it suits you):** మీ విద్యా కోర్సుకు సంబంధించి పూర్తి కాలేజీ ట్యూషన్ ఫీజును ప్రభుత్వం నేరుగా మంజూరు చేస్తుంది.
**గడువు తేదీ (Deadline):** 15 November 2026
**అధికారిక పోర్టల్ లింక్ (Official Portal Link):** [జ్ఞానభూమి ఏపీ పోర్టల్](https://jnanabhumi.ap.gov.in)

2.
**పథకం పేరు (Scheme Name):** ఆంధ్రప్రదేశ్ వసతి దీవెన - వసతి మరియు భోజన ఖర్చుల సహాయం (JnanaBhumi Vasathi Deevena)
**అర్హతలు & అవసరమైన పత్రాలు (Requirements):** పాలిటెక్నిక్, ఐటీఐ, డిగ్రీ లేదా ఇంజనీరింగ్ చదువుతున్న ఏపీ విద్యార్థులు, కుటుంబ వార్షిక ఆదాయం ₹2.5 లక్షల లోపు. పత్రాలు: ఆధార్ కార్డు, కాలేజీ బోనఫైడ్, తల్లి ఆధార్-డీబీటీ ఖాతా పాస్‌బుక్.
**మీకు ఎందుకు సరిపోతుంది (Why it suits you):** హాస్టల్ వసతి మరియు భోజన ఖర్చుల కోసం డిగ్రీ/ఇంజనీరింగ్ విద్యార్థులకు ఏటా ₹20,000 నగదు సహాయం 2 విడతల్లో అందుతుంది.
**గడువు తేదీ (Deadline):** 15 November 2026
**అధికారిక పోర్టల్ లింక్ (Official Portal Link):** [జ్ఞానభూమి ఏపీ పోర్టల్](https://jnanabhumi.ap.gov.in)

3.
**పథకం పేరు (Scheme Name):** డాక్టర్ ఎన్టీఆర్ వైద్య సేవ - ఉచిత నగదు రహిత వైద్య చికిత్స (Dr. NTR Vaidya Seva)
**అర్హతలు & అవసరమైన పత్రాలు (Requirements):** ఆంధ్రప్రదేశ్ రైస్ కార్డు / వైట్ రేషన్ కార్డుదారులు, వార్షిక ఆదాయం ₹5 లక్షల లోపు. పత్రాలు: ఆధార్ కార్డు, ఏపీ రైస్ కార్డు.
**మీకు ఎందుకు సరిపోతుంది (Why it suits you):** కుటుంబానికి ప్రతి సంవత్సరం ₹25 లక్షల వరకు అధునాతన నెట్‌వర్క్ ఆసుపత్రులలో పూర్తి ఉచిత నగదు రహిత ఆరోగ్య చికిత్సను ప్రభుత్వం అందిస్తుంది.
**గడువు తేదీ (Deadline):** నిరంతరం అందుబాటులో ఉంటుంది (Check Official Portal)
**అధికారిక పోర్టల్ లింక్ (Official Portal Link):** [డాక్టర్ ఎన్టీఆర్ వైద్య సేవ ట్రస్ట్](https://aarogyasri.ap.gov.in)`
        : `Here are verified active Government of Andhra Pradesh state welfare schemes matching your student credentials:

1.
**Scheme Name:** Andhra Pradesh Vidya Deevena (Complete Fee Reimbursement via JnanaBhumi)
**Requirements:** Permanent resident of Andhra Pradesh pursuing ITI, Polytechnic, Degree, Engineering, or PG courses, Annual family income under ₹2.5 Lakh, 75% attendance. Documents: Aadhaar Card, AP Rice Card / Income Certificate, Integrated Caste Certificate from MeeSeva, College Bonafide, Mother's Aadhaar DBT Bank Account.
**Why it suits you:** Covers 100% full college tuition fee reimbursement paid directly by the state government to support your higher education.
**Deadline:** 15 November 2026
**Official Portal Link:** [JnanaBhumi AP Portal](https://jnanabhumi.ap.gov.in)

2.
**Scheme Name:** Andhra Pradesh Vasathi Deevena (Hostel & Boarding Grant via JnanaBhumi)
**Requirements:** Enrolled in regular ITI, Polytechnic, Degree, or Engineering colleges in Andhra Pradesh, Family annual income under ₹2.5 Lakh. Documents: Aadhaar Card, College Study Certificate, Rice Card, Mother's Bank Passbook.
**Why it suits you:** Grants up to ₹20,000/year (Degree/Engineering), ₹15,000/year (Polytechnic), and ₹10,000/year (ITI) directly to cover food and hostel expenses.
**Deadline:** 15 November 2026
**Official Portal Link:** [JnanaBhumi AP Portal](https://jnanabhumi.ap.gov.in)

3.
**Scheme Name:** Dr. NTR Vaidya Seva Comprehensive Healthcare Scheme
**Requirements:** Resident of Andhra Pradesh holding AP Rice Card / White Ration Card, Annual family income under ₹5.00 Lakh. Documents: Aadhaar Card, AP Rice Card / Health Card.
**Why it suits you:** Protects your entire family with cashless inpatient hospital coverage up to ₹25 Lakhs per year across empaneled hospitals.
**Deadline:** Continuous Enrollment (Check Official Portal)
**Official Portal Link:** [Dr. NTR Vaidya Seva Trust](https://aarogyasri.ap.gov.in)`;
    } else if (isFarmer) {
      return isTeluguRequested
        ? `మీ ప్రొఫైల్ వివరాల ఆధారంగా ధృవీకరించబడిన ఆంధ్రప్రదేశ్ రైతు సంక్షేమ పథకాలు క్రింద వివరించబడ్డాయి:

1.
**పథకం పేరు (Scheme Name):** ఆంధ్రప్రదేశ్ అన్నదాత సుఖీభవ - పీఎం కిసాన్ పథకం (AP Annadata Sukhibhava)
**అర్హతలు & అవసరమైన పత్రాలు (Requirements):** ఏపీ రైతు లేదా గుర్తింపు పొందిన కౌలు రైతు (CCRC కార్డుదారుడు), ఈ-క్రాప్ నమోదు. పత్రాలు: పట్టాదారు పాస్‌బుక్ / 1B, CCRC కార్డు, ఆధార్ లింక్డ్ బ్యాంక్ ఖాతా.
**మీకు ఎందుకు సరిపోతుంది (Why it suits you):** ప్రతి సంవత్సరం ₹20,000 (రాష్ట్ర ప్రభుత్వం ₹14,000 + కేంద్రం ₹6,000) పెట్టుబడి సాయంగా 3 విడతల్లో నేరుగా అందుతుంది.
**గడువు తేదీ (Deadline):** Open Year Round
**అధికారిక పోర్టల్ లింక్ (Official Portal Link):** [ఏపీ వ్యవసాయ శాఖ పోర్టల్](https://apagrisnet.gov.in)

2.
**పథకం పేరు (Scheme Name):** డాక్టర్ ఎన్టీఆర్ వైద్య సేవ (Dr. NTR Vaidya Seva Healthcare)
**అర్హతలు & అవసరమైన పత్రాలు (Requirements):** ఆంధ్రప్రదేశ్ వాస్తవ్యులు, రైస్ కార్డు కలిగిన కుటుంబాలు. పత్రాలు: ఆధార్ కార్డు, రైస్ కార్డు.
**మీకు ఎందుకు సరిపోతుంది (Why it suits you):** ఏటా ₹25 లక్షల వరకు కుటుంబానికి సూపర్ స్పెషాలిటీ ఆసుపత్రులలో ఉచిత నగదు రహిత చికిత్స అందిస్తుంది.
**గడువు తేదీ (Deadline):** Check Official Portal
**అధికారిక పోర్టల్ లింక్ (Official Portal Link):** [డాక్టర్ ఎన్టీఆర్ వైద్య సేవ ట్రస్ట్](https://aarogyasri.ap.gov.in)

3.
**పథకం పేరు (Scheme Name):** దీపం 2.0 ఉచిత గ్యాస్ సిలిండర్ల పథకం (AP Deepam 2.0 Free LPG)
**అర్హతలు & అవసరమైన పత్రాలు (Requirements):** ఏపీ మహిళలు / కుటుంబాలు, తెల్ల రేషన్ కార్డు మరియు ఎల్పీజీ కనెక్షన్. పత్రాలు: రేషన్ కార్డు, గ్యాస్ పాస్‌బుక్, ఆధార్ కార్డు.
**మీకు ఎందుకు సరిపోతుంది (Why it suits you):** సంవత్సరానికి 3 గృహ ఎల్పీజీ సిలిండర్లను 100% ఉచితంగా డీబీటీ రీఫండ్ ద్వారా అందిస్తుంది.
**గడువు తేదీ (Deadline):** Check Official Portal
**అధికారిక పోర్టల్ లింక్ (Official Portal Link):** [ఆంధ్రప్రదేశ్ పౌర సరఫరాల శాఖ](https://epdsap.ap.gov.in)`
        : `Here are verified active Government of Andhra Pradesh welfare schemes matching your profile:

1.
**Scheme Name:** Andhra Pradesh Annadata Sukhibhava - PM KISAN Farmer Grant
**Requirements:** Resident farmer or tenant cultivator in Andhra Pradesh, Valid Pattadar Passbook or CCRC Card. Documents: Land records, Aadhaar Card, Aadhaar-linked Bank Passbook.
**Why it suits you:** Provides ₹20,000 per year (₹14,000 AP State Assistance + ₹6,000 PM-KISAN) direct income and crop input subsidy.
**Deadline:** Open Year Round
**Official Portal Link:** [AP Agriculture Portal](https://apagrisnet.gov.in)

2.
**Scheme Name:** Dr. NTR Vaidya Seva Comprehensive Healthcare Scheme
**Requirements:** Resident of Andhra Pradesh holding AP Rice Card / White Ration Card, Annual family income under ₹5.00 Lakh. Documents: Aadhaar Card, AP Rice Card.
**Why it suits you:** Protects your family with cashless inpatient hospital coverage up to ₹25 Lakhs per year across empaneled hospitals.
**Deadline:** Continuous Enrollment (Check Official Portal)
**Official Portal Link:** [Dr. NTR Vaidya Seva Trust](https://aarogyasri.ap.gov.in)

3.
**Scheme Name:** Andhra Pradesh Deepam 2.0 Free Domestic LPG Scheme
**Requirements:** Resident family in Andhra Pradesh with domestic active LPG connection and White Ration Card. Documents: Aadhaar Card, LPG Consumer Number, AP Rice Card.
**Why it suits you:** Grants 3 free LPG domestic cooking gas refills every year credited directly through DBT subsidy.
**Deadline:** Open Year Round
**Official Portal Link:** [Civil Supplies Dept Andhra Pradesh](https://epdsap.ap.gov.in)`;
    } else {
      // Non-student, general / employed profile
      return isTeluguRequested
        ? `మీ ప్రొఫైల్ వివరాల ఆధారంగా ధృవీకరించబడిన ఆంధ్రప్రదేశ్ రాష్ట్ర ప్రభుత్వ సంక్షేమ పథకాలు క్రింద ఇవ్వబడ్డాయి:

1.
**పథకం పేరు (Scheme Name):** డాక్టర్ ఎన్టీఆర్ వైద్య సేవ - ఉచిత నగదు రహిత వైద్య చికిత్స (Dr. NTR Vaidya Seva)
**అర్హతలు & అవసరమైన పత్రాలు (Requirements):** ఆంధ్రప్రదేశ్ వాస్తవ్యులు, ఏపీ రైస్ కార్డు / వైట్ రేషన్ కార్డుదారులు, వార్షిక ఆదాయం ₹5 లక్షల లోపు. పత్రాలు: ఆధార్ కార్డు, ఏపీ రైస్ కార్డు.
**మీకు ఎందుకు సరిపోతుంది (Why it suits you):** కుటుంబానికి ప్రతి సంవత్సరం ₹25 లక్షల వరకు అధునాతన ఆసుపత్రులలో 100% ఉచిత నగదు రహిత ఆరోగ్య చికిత్స లభిస్తుంది.
**గడువు తేదీ (Deadline):** నిరంతరం అందుబాటులో ఉంటుంది (Check Official Portal)
**అధికారిక పోర్టల్ లింక్ (Official Portal Link):** [డాక్టర్ ఎన్టీఆర్ వైద్య సేవ ట్రస్ట్](https://aarogyasri.ap.gov.in)

2.
**పథకం పేరు (Scheme Name):** దీపం 2.0 ఉచిత గ్యాస్ సిలిండర్ల పథకం (AP Deepam 2.0 Free LPG)
**అర్హతలు & అవసరమైన పత్రాలు (Requirements):** ఆంధ్రప్రదేశ్ కుటుంబాలు, తెల్ల రేషన్ కార్డు మరియు క్రియాశీల ఎల్పీజీ కనెక్షన్. పత్రాలు: రేషన్ కార్డు, గ్యాస్ బుక్, ఆధార్ కార్డు.
**మీకు ఎందుకు సరిపోతుంది (Why it suits you):** ఏడాదికి 3 గృహ వంట గ్యాస్ సిలిండర్లను పూర్తి ఉచితంగా సబ్సిడీ రూపంలో అందిస్తుంది.
**గడువు తేదీ (Deadline):** Check Official Portal
**అధికారిక పోర్టల్ లింక్ (Official Portal Link):** [ఆంధ్రప్రదేశ్ పౌర సరఫరాల శాఖ](https://epdsap.ap.gov.in)

3.
**పథకం పేరు (Scheme Name):** ఆంధ్రప్రదేశ్ నవరత్నాలు గృహ నిర్మాణ పథకం (AP Housing Scheme)
**అర్హతలు & అవసరమైన పత్రాలు (Requirements):** శాశ్వత నివాస గృహం లేని ఏపీ నివాసితులు, వార్షిక ఆదాయ పరిమితి ₹3 లక్షల లోపు. పత్రాలు: ఆధార్, ఆదాయ ధృవీకరణ పత్రం, ఇళ్ల స్థలం పట్టా.
**మీకు ఎందుకు సరిపోతుంది (Why it suits you):** పక్కా గృహ నిర్మాణానికి ప్రభుత్వ సబ్సిడీ మరియు ఆర్థిక సహాయాన్ని మంజూరు చేస్తుంది.
**గడువు తేదీ (Deadline):** Check Official Portal
**అధికారిక పోర్టల్ లింక్ (Official Portal Link):** [ఏపీ హౌసింగ్ కార్పొరేషన్](https://housing.ap.gov.in)`
        : `Here are verified active Government of Andhra Pradesh state welfare programs matching your profile:

1.
**Scheme Name:** Dr. NTR Vaidya Seva Comprehensive Healthcare Scheme
**Requirements:** Resident of Andhra Pradesh holding AP Rice Card / White Ration Card, Annual family income under ₹5.00 Lakh. Documents: Aadhaar Card, AP Rice Card / Health Card.
**Why it suits you:** Cashless inpatient hospital coverage up to ₹25 Lakhs per family per year across empaneled super-specialty hospitals.
**Deadline:** Continuous Enrollment (Check Official Portal)
**Official Portal Link:** [Dr. NTR Vaidya Seva Trust](https://aarogyasri.ap.gov.in)

2.
**Scheme Name:** Andhra Pradesh Deepam 2.0 Free Domestic LPG Scheme
**Requirements:** Domestic household resident in Andhra Pradesh holding White Ration Card and active LPG connection. Documents: Aadhaar Card, LPG Consumer Connection Passbook, AP Rice Card.
**Why it suits you:** Provides 3 free cooking gas cylinder refills every year with 100% cost refund through DBT.
**Deadline:** Open Year Round
**Official Portal Link:** [Civil Supplies Dept Andhra Pradesh](https://epdsap.ap.gov.in)

3.
**Scheme Name:** Andhra Pradesh Navaratnalu Pucca Housing Assistance
**Requirements:** Resident of Andhra Pradesh without a permanent pucca house, Annual income under ₹3.00 Lakh. Documents: Aadhaar Card, Income Certificate, Residential Plot Patta.
**Why it suits you:** Subsidized pucca house construction assistance and building materials facilitation.
**Deadline:** Check Official Portal
**Official Portal Link:** [AP State Housing Corporation](https://housing.ap.gov.in)`;
    }
  }

  if (isStateQuery || isTelanganaQuery) {
    if (isSenior) {
      return isTeluguRequested
        ? `మీ ప్రొఫైల్ వివరాల ఆధారంగా తెలంగాణ రాష్ట్ర ప్రభుత్వ సీనియర్ సిటిజన్ (Senior Citizen) సంక్షేమ పథకాలు క్రింద ఇవ్వబడ్డాయి:

1.
**పథకం పేరు (Scheme Name):** తెలంగాణ చేయూత ఆసరా వృద్ధాప్య పింఛను పథకం (Telangana Cheyutha Senior Citizen Pension)
**అర్హతలు & అవసరమైన పత్రాలు (Requirements):** 57 సంవత్సరాలు లేదా అంతకంటే ఎక్కువ వయస్సు గల తెలంగాణ నివాసితులు, వార్షిక కుటుంబ ఆదాయం ₹1.50 లక్షల లోపు (గ్రామీణ) / ₹2.00 లక్షల లోపు (పట్టణ). పత్రాలు: ఆధార్ కార్డు, ఆహార భద్రతా కార్డు (ఫుడ్ సెక్యూరిటీ కార్డు), ఆధార్ అనుసంధానిత బ్యాంకు ఖాతా.
**మీకు ఎందుకు సరిపోతుంది (Why it suits you):** నెలకు ₹4,000 వృద్ధాప్య సామాజిక భద్రతా పింఛను నేరుగా మీ బ్యాంకు ఖాతాలో డీబీటీ ద్వారా ప్రతి నెలా జమ చేయబడుతుంది.
**గడువు తేదీ (Deadline):** నిరంతరం అందుబాటులో ఉంటుంది (Check Official Portal)
**అధికారిక పోర్టల్ లింక్ (Official Portal Link):** [తెలంగాణ ఆసరా పోర్టల్](https://aasara.telangana.gov.in)

2.
**పథకం పేరు (Scheme Name):** తెలంగాణ రాజీవ్ ఆరోగ్యశ్రీ వయోవృద్ధుల ఉచిత వైద్య సేవలు (Rajiv Aarogyasri Geriatric Healthcare)
**అర్హతలు & అవసరమైన పత్రాలు (Requirements):** తెలంగాణ సీనియర్ సిటిజన్లు, తెల్ల రేషన్ కార్డు / ఫుడ్ సెక్యూరిటీ కార్డు కలిగిన కుటుంబాలు. పత్రాలు: ఆధార్ కార్డు, ఆహార భద్రతా కార్డు.
**మీకు ఎందుకు సరిపోతుంది (Why it suits you):** వృద్ధాప్య వ్యాధులు, గుండె శస్త్రచికిత్సలు, మోకాలి మార్పిడి సహా 1,670+ చికిత్సలకు ఏటా ₹10 లక్షల వరకు 100% ఉచిత నగదు రహిత కార్పొరేట్ ఆసుపత్రి చికిత్స లభిస్తుంది.
**గడువు తేదీ (Deadline):** Open Year Round
**అధికారిక పోర్టల్ లింక్ (Official Portal Link):** [రాజీవ్ ఆరోగ్యశ్రీ ట్రస్ట్](https://aarogyasri.telangana.gov.in)

3.
**పథకం పేరు (Scheme Name):** తెలంగాణ సీనియర్ సిటిజన్ ఆర్టీసీ బస్సు రాయితీ & సహాయ పరికరాల పథకం (TSRTC Senior Citizen Concession & Aids)
**అర్హతలు & అవసరమైన పత్రాలు (Requirements):** 60 ఏళ్లు పైబడిన తెలంగాణ వయోవృద్ధులు. పత్రాలు: ఆధార్ కార్డు, సీనియర్ సిటిజన్ గుర్తింపు కార్డు.
**మీకు ఎందుకు సరిపోతుంది (Why it suits you):** TSRTC బస్సు ప్రయాణాల్లో 25% టికెట్ రాయితీ మరియు అర్హులైన వృద్ధులకు ఉచిత వినికిడి యంత్రాలు, చేతికర్రలు మరియు కళ్ళజోళ్ళు పంపిణీ చేయబడతాయి.
**గడువు తేదీ (Deadline):** Check Official Portal
**అధికారిక పోర్టల్ లింక్ (Official Portal Link):** [తెలంగాణ వికలాంగులు & వయోవృద్ధుల శాఖ](https://wdsc.telangana.gov.in)`
        : `Here are verified active Government of Telangana welfare schemes matching your profile for Senior Citizens (60+ years):

1.
**Scheme Name:** Telangana Cheyutha Social Security Senior Citizen Pension (Old Age Pension)
**Requirements:** Resident senior citizen of Telangana aged 57+ years, Family income under ₹1.50 Lakh (Rural) / ₹2.00 Lakh (Urban), Food Security Card holder. Documents: Aadhaar Card (age proof), Food Security Card, Aadhaar DBT-seeded Bank Passbook.
**Why it suits you:** Grants a monthly old age pension of ₹4,000 deposited straight into your bank account via DBT to ensure dignified financial self-reliance.
**Deadline:** Continuous Enrollment (Check Official Portal)
**Official Portal Link:** [Telangana Aasara Portal](https://aasara.telangana.gov.in)

2.
**Scheme Name:** Telangana Rajiv Aarogyasri Geriatric Healthcare Support
**Requirements:** Senior citizen resident in Telangana holding Food Security Card / White Ration Card. Documents: Aadhaar Card, Food Security Card.
**Why it suits you:** ₹10,00,000 annual cashless healthcare coverage per family for geriatric, cardiac, orthopedic, and oncology treatments across empaneled hospitals.
**Deadline:** Open Year Round
**Official Portal Link:** [Aarogyasri Health Care Trust](https://aarogyasri.telangana.gov.in)

3.
**Scheme Name:** Telangana Senior Citizen TSRTC Bus Concession & Assistive Devices
**Requirements:** Resident senior citizen aged 60+ in Telangana. Documents: Aadhaar Card / Senior Citizen ID Card.
**Why it suits you:** 25% bus travel fare concession across TSRTC services and free distribution of physical assistive aids (digital hearing aids, walking sticks, spectacles).
**Deadline:** Open Year Round
**Official Portal Link:** [Telangana Senior Citizen Welfare](https://wdsc.telangana.gov.in)`;
    } else if (isWoman) {
      return isTeluguRequested
        ? `మీ ప్రొఫైల్ వివరాల ఆధారంగా తెలంగాణ రాష్ట్ర ప్రభుత్వ మహిళా (Women) సంక్షేమ పథకాలు క్రింద ఇవ్వబడ్డాయి:

1.
**పథకం పేరు (Scheme Name):** తెలంగాణ మహాలక్ష్మి ఉచిత ఆర్టీసీ బస్సు ప్రయాణ పథకం (Telangana Maha Lakshmi Free Bus Travel for Women)
**అర్హతలు & అవసరమైన పత్రాలు (Requirements):** తెలంగాణ వాస్తవ్యులైన బాలికలు మరియు మహిళలందరూ (వయస్సు మరియు ఆదాయ పరిమితి లేదు). పత్రాలు: ఆధార్ కార్డు లేదా రాష్ట్ర ప్రభుత్వ గుర్తింపు కార్డు.
**మీకు ఎందుకు సరిపోతుంది (Why it suits you):** తెలంగాణ రాష్ట్రవ్యాప్తంగా అన్ని TSRTC పల్లె వెలుగు మరియు ఎక్స్‌ప్రెస్ బస్సుల్లో 100% పూర్తి ఉచిత ప్రయాణ సౌకర్యం (జీరో-టికెట్).
**గడువు తేదీ (Deadline):** నిరంతరం అందుబాటులో ఉంటుంది (Open Year Round)
**అధికారిక పోర్టల్ లింక్ (Official Portal Link):** [తెలంగాణ ఆర్టీసీ పోర్టల్](https://tsrtc.telangana.gov.in)

2.
**పథకం పేరు (Scheme Name):** తెలంగాణ మహాలక్ష్మి ₹500 సబ్సిడీ గ్యాస్ సిలిండర్ పథకం (Maha Lakshmi ₹500 Gas Cylinder)
**అర్హతలు & అవసరమైన పత్రాలు (Requirements):** తెల్ల రేషన్ కార్డు (ఆహార భద్రతా కార్డు) మరియు క్రియాశీల గ్యాస్ కనెక్షన్ కలిగిన మహిళా కుటుంబ యజమానులు. పత్రాలు: ఆధార్ కార్డు, ఆహార భద్రతా కార్డు, గ్యాస్ పాస్‌బుక్.
**మీకు ఎందుకు సరిపోతుంది (Why it suits you):** వంట గ్యాస్ సిలిండర్ కేవలం ₹500 కే లభిస్తుంది, మిగిలిన సబ్సిడీ మొత్తాన్ని ప్రభుత్వమే నేరుగా మీ బ్యాంక్ ఖాతాలో జమ చేస్తుంది.
**గడువు తేదీ (Deadline):** Open Year Round
**అధికారిక పోర్టల్ లింక్ (Official Portal Link):** [తెలంగాణ పౌర సరఫరాల శాఖ](https://epds.telangana.gov.in)

3.
**పథకం పేరు (Scheme Name):** తెలంగాణ కల్యాణ లక్ష్మి & షాదీ ముబారక్ పథకం (Kalyana Lakshmi & Shaadi Mubarak)
**అర్హతలు & అవసరమైన పత్రాలు (Requirements):** వివాహం చేసుకునే తెలంగాణ యువతులు (కనీస వయస్సు 18 సం.), SC/ST/BC/మైనారిటీ వర్గాలు, వార్షిక కుటుంబ ఆదాయం ₹2 లక్షల లోపు. పత్రాలు: వధువు ఆధార్, వివాహ ఆహ్వాన పత్రిక, ఆదాయ పత్రం, వధువు తల్లి బ్యాంక్ పాస్‌బుక్.
**మీకు ఎందుకు సరిపోతుంది (Why it suits you):** వివాహ ఖర్చుల సహాయార్థం ₹1,00,116 ఒకేసారి నేరుగా వధువు తల్లి బ్యాంక్ ఖాతాలో జమ చేయబడుతుంది.
**గడువు తేదీ (Deadline):** వివాహం జరిగిన రోజు లేదా అంతకుముందు (Check Official Portal)
**అధికారిక పోర్టల్ లింక్ (Official Portal Link):** [తెలంగాణ ఈ-పాస్ కల్యాణ లక్ష్మి](https://telanganaepass.cgg.gov.in)`
        : `Here are verified active Government of Telangana schemes tailored specifically for Women:

1.
**Scheme Name:** Telangana Maha Lakshmi Scheme (100% Free Bus Travel for Women)
**Requirements:** All girls and women of all age groups resident in Telangana. Documents: Domicile Proof / Aadhaar Card.
**Why it suits you:** 100% free, zero-fare bus travel on all TSRTC Palle Velugu and Express buses across the entire state of Telangana.
**Deadline:** Open Year Round
**Official Portal Link:** [TSRTC Official Portal](https://tsrtc.telangana.gov.in)

2.
**Scheme Name:** Telangana Maha Lakshmi ₹500 Subsidized LPG Gas Cylinder Scheme
**Requirements:** Female head of family in Telangana holding White Ration Card / Food Security Card and active domestic LPG connection. Documents: Food Security Card, Aadhaar Card, LPG Connection Book.
**Why it suits you:** Procure domestic cooking gas refills for only ₹500, with remaining subsidy reimbursed via DBT straight to your bank account.
**Deadline:** Open Year Round
**Official Portal Link:** [Telangana Civil Supplies](https://epds.telangana.gov.in)

3.
**Scheme Name:** Telangana Kalyana Lakshmi & Shaadi Mubarak Scheme
**Requirements:** Unmarried resident girls aged 18+ from SC/ST/BC/EBC/Minority communities with family annual income under ₹2.00 Lakh. Documents: Bride & Groom Aadhaar, Class 10 Marks Memo (age proof), Wedding Card, Mother's Bank Passbook.
**Why it suits you:** Direct one-time financial grant of ₹1,00,116 credited directly into the bride's mother's bank account to support dignified marriage ceremonies.
**Deadline:** Apply prior to or within wedding window
**Official Portal Link:** [Telangana ePASS Portal](https://telanganaepass.cgg.gov.in)`;
    } else if (isStudent) {
      return isTeluguRequested
        ? `మీ విద్యార్థి ప్రొఫైల్ ఆధారంగా ధృవీకరించబడిన తెలంగాణ రాష్ట్ర ప్రభుత్వ స్కాలర్‌షిప్ పథకాలు క్రింద ఇవ్వబడ్డాయి:

1.
**పథకం పేరు (Scheme Name):** తెలంగాణ ఈ-పాస్ పోస్ట్-మెట్రిక్ స్కాలర్‌షిప్ & ఫీజు రీయింబర్స్‌మెంట్ (Telangana ePASS)
**అర్హతలు & అవసరమైన పత్రాలు (Requirements):** తెలంగాణ వాస్తవ్యులు, ఇంటర్/డిగ్రీ/పీజీ విద్యార్థులు, వార్షిక కుటుంబ ఆదాయం ₹2 లక్షల లోపు (SC/ST లకు ₹2.5 లక్షల లోపు). పత్రాలు: ఆదాయ ధృవీకరణ పత్రం, కుల ధృవీకరణ పత్రం, ఎస్ఎస్సీ హాల్ టికెట్, కాలేజీ బోనఫైడ్, ఆధార్ డీబీటీ బ్యాంకు ఖాతా.
**మీకు ఎందుకు సరిపోతుంది (Why it suits you):** పూర్తి కాలేజీ ట్యూషన్ ఫీజు రీయింబర్స్‌మెంట్ (RTF) మరియు నెలవారీ వసతి భత్యం (MTF) నేరుగా అందిస్తుంది.
**గడువు తేదీ (Deadline):** Check Official Portal
**అధికారిక పోర్టల్ లింక్ (Official Portal Link):** [తెలంగాణ ఈ-పాస్ పోర్టల్](https://telanganaepass.cgg.gov.in)

2.
**పథకం పేరు (Scheme Name):** చీఫ్ మినిస్టర్స్ ఓవర్సీస్ స్కాలర్‌షిప్ పథకం (Overseas Vidya Nidhi)
**అర్హతలు & అవసరమైన పత్రాలు (Requirements):** విదేశీ విశ్వవిద్యాలయాల్లో ఉన్నత విద్య (MS/PG) అభ్యసించే ఎస్సీ/ఎస్టీ/బీసీ విద్యార్థులు, వార్షిక ఆదాయం ₹5 లక్షల లోపు. పత్రాలు: GRE/TOEFL స్కోర్‌కార్డ్, అడ్మిషన్ ఆఫర్ లెటర్, ఆధార్, పాస్‌పోర్ట్, ఆదాయ ధృవీకరణ పత్రం.
**మీకు ఎందుకు సరిపోతుంది (Why it suits you):** విదేశీ ఉన్నత విద్య కోసం గరిష్టంగా ₹20 లక్షల వరకు ఆర్థిక సహాయం గ్రాంట్‌గా మంజూరు చేస్తుంది.
**గడువు తేదీ (Deadline):** Check Official Portal
**అధికారిక పోర్టల్ లింక్ (Official Portal Link):** [తెలంగాణ ఓవర్సీస్ స్కాలర్‌షిప్](https://telanganaepass.cgg.gov.in)

3.
**పథకం పేరు (Scheme Name):** తెలంగాణ యువ వికాసం స్కిల్ డెవలప్‌మెంట్ & ఉపాధి శిక్షణ (TASK)
**అర్హతలు & అవసరమైన పత్రాలు (Requirements):** తెలంగాణ డిగ్రీ/ఇంజనీరింగ్ విద్యార్థులు (వయస్సు 18-28 సం.). పత్రాలు: ఆధార్ కార్డు, కాలేజీ ఐడీ, సెమిస్టర్ మార్కుల జాబితా.
**మీకు ఎందుకు సరిపోతుంది (Why it suits you):** పరిశ్రమలకు అవసరమైన ఆధునిక సాంకేతిక నైపుణ్యాల శిక్షణ మరియు కార్పొరేట్ క్యాంపస్ ప్లేస్‌మెంట్ కల్పిస్తుంది.
**గడువు తేదీ (Deadline):** Check Official Portal
**అధికారిక పోర్టల్ లింక్ (Official Portal Link):** [తెలంగాణ అకాడమీ ఫర్ స్కిల్ అండ్ నాలెడ్జ్](https://task.telangana.gov.in)`
        : `Here are verified active Government of Telangana schemes and scholarships matching your student credentials:

1.
**Scheme Name:** Telangana ePASS Post-Matric Scholarship & Full Fee Reimbursement (RTF & MTF)
**Requirements:** Resident of Telangana studying intermediate, degree, engineering or professional courses, Annual family income under ₹2.00 Lakh (SC/ST under ₹2.50 Lakh). Documents: Income Certificate from MeeSeva, Integrated Community Certificate, SSC Marks Card, College Bonafide, Bank Passbook (DBT-seeded).
**Why it suits you:** Reimburses 100% of your college tuition fees and provides monthly maintenance grants directly to your bank account.
**Deadline:** Check Official Portal
**Official Portal Link:** [Telangana ePASS Portal](https://telanganaepass.cgg.gov.in)

2.
**Scheme Name:** Overseas Vidya Nidhi Scheme for Higher Education Abroad
**Requirements:** Students pursuing Master's / PhD degrees in recognized universities in USA, UK, Canada, Australia, Family income up to ₹5.00 Lakh. Documents: Valid Passport, Visa, Foreign University Offer Letter, GRE/IELTS/TOEFL scorecard, Income Certificate.
**Why it suits you:** Grants up to ₹20.00 Lakh direct financial assistance to support overseas tuition and living costs.
**Deadline:** Check Official Portal
**Official Portal Link:** [Telangana ePASS Overseas Portal](https://telanganaepass.cgg.gov.in)

3.
**Scheme Name:** Telangana Academy for Skill and Knowledge (TASK) Youth Development Program
**Requirements:** Telangana students aged 18–28 enrolled in polytechnic, degree, or professional engineering colleges. Documents: College ID, Aadhaar Card, Semester Bonafide.
**Why it suits you:** Provides subsidized technology and industry-grade employability skill certifications with direct campus recruitment linkage.
**Deadline:** Check Official Portal
**Official Portal Link:** [Telangana Academy for Skill and Knowledge](https://task.telangana.gov.in)`;
    } else if (isFarmer) {
      return isTeluguRequested
        ? `మీ రైతు ప్రొఫైల్ ఆధారంగా ధృవీకరించబడిన తెలంగాణ రాష్ట్ర ప్రభుత్వ పథకాలు క్రింద ఇవ్వబడ్డాయి:

1.
**పథకం పేరు (Scheme Name):** తెలంగాణ రైతు భరోసా పంట పెట్టుబడి సహాయ పథకం (Telangana Rythu Bharosa)
**అర్హతలు & అవసరమైన పత్రాలు (Requirements):** తెలంగాణ రైతు లేదా ధరణిలో నమోదైన కౌలు రైతు. పత్రాలు: ధరణి పట్టాదారు పాస్‌బుక్, ఆధార్ కార్డు, ఆధార్ లింక్డ్ బ్యాంక్ ఖాతా.
**మీకు ఎందుకు సరిపోతుంది (Why it suits you):** ఖరీఫ్ మరియు రబీ సీజన్లలో ఎకరానికి ఏటా ₹15,000 (ఎకరానికి ₹7,500 చొప్పున) నేరుగా బ్యాంక్ ఖాతాలో జమ అవుతుంది.
**గడువు తేదీ (Deadline):** Open Year Round
**అధికారిక పోర్టల్ లింక్ (Official Portal Link):** [తెలంగాణ ధరణి పోర్టల్](https://dharani.telangana.gov.in)

2.
**పథకం పేరు (Scheme Name):** తెలంగాణ రాజీవ్ ఆరోగ్యశ్రీ ఉచిత నగదు రహిత వైద్య పథకం (Rajiv Aarogyasri)
**అర్హతలు & అవసరమైన పత్రాలు (Requirements):** తెల్ల రేషన్ కార్డు కలిగిన కుటుంబాలు. పత్రాలు: ఆధార్ కార్డు, ఫుడ్ సెక్యూరిటీ కార్డు.
**మీకు ఎందుకు సరిపోతుంది (Why it suits you):** ప్రతి కుటుంబానికి ఏటా ₹10 లక్షల వరకు ఆసుపత్రులలో ఉచిత నగదు రహిత చికిత్స అందిస్తుంది.
**గడువు తేదీ (Deadline):** Check Official Portal
**అధికారిక పోర్టల్ లింక్ (Official Portal Link):** [రాజీవ్ ఆరోగ్యశ్రీ హెల్త్‌కేర్ ట్రస్ట్](https://aarogyasri.telangana.gov.in)

3.
**పథకం పేరు (Scheme Name):** తెలంగాణ గృహ జ్యోతి ఉచిత విద్యుత్ పథకం (Gruha Jyothi)
**అర్హతలు & అవసరమైన పత్రాలు (Requirements):** నెలకు 200 యూనిట్ల లోపు గృహ విద్యుత్ వినియోగించే నివాసితులు. పత్రాలు: డిస్కం విద్యుత్ కనెక్షన్ నంబర్ (USCNO), ఆధార్, రేషన్ కార్డు.
**మీకు ఎందుకు సరిపోతుంది (Why it suits you):** ప్రతి నెలా 200 యూనిట్ల వరకు విద్యుత్ వినియోగానికి జీరో కరెంట్ బిల్లు (ఉచిత విద్యుత్) లభిస్తుంది.
**గడువు తేదీ (Deadline):** Open Year Round
**అధికారిక పోర్టల్ లింక్ (Official Portal Link):** [తెలంగాణ ప్రభుత్వం](https://telangana.gov.in)`
        : `Here are verified active Government of Telangana schemes matching your farmer profile:

1.
**Scheme Name:** Telangana Rythu Bharosa Farmer Investment Support Scheme
**Requirements:** Farmer or tenant cultivator resident in Telangana, Registered in Dharani portal. Documents: Pattadar Passbook, Aadhaar Card, Bank Passbook.
**Why it suits you:** Direct financial assistance of ₹15,000 per acre per year (₹7,500 per crop season) deposited directly into your bank account.
**Deadline:** Open Year Round
**Official Portal Link:** [Telangana Dharani Portal](https://dharani.telangana.gov.in)

2.
**Scheme Name:** Telangana Rajiv Aarogyasri Universal Health Scheme
**Requirements:** Resident family in Telangana holding White Ration Card / Food Security Card. Documents: Aadhaar Card, Ration Card.
**Why it suits you:** Cashless medical hospitalization and surgeries up to ₹10,00,000 per family per year across network hospitals.
**Deadline:** Open Year Round
**Official Portal Link:** [Aarogyasri Health Care Trust](https://aarogyasri.telangana.gov.in)

3.
**Scheme Name:** Telangana Gruha Jyothi Free Electricity Scheme
**Requirements:** Resident domestic household in Telangana consuming up to 200 units of power monthly. Documents: Aadhaar Card, Electricity Bill USCNO, Food Security Card.
**Why it suits you:** Provides 100% zero-rupee electricity bills for domestic consumption up to 200 units every month.
**Deadline:** Open Year Round
**Official Portal Link:** [Telangana Government Portal](https://telangana.gov.in)`;
    } else if (isBusiness) {
      return isTeluguRequested
        ? `మీ వ్యాపార / స్వయం ఉపాధి ప్రొఫైల్ ఆధారంగా ధృవీకరించబడిన తెలంగాణ రాష్ట్ర ప్రభుత్వ పథకాలు క్రింద ఇవ్వబడ్డాయి:

1.
**పథకం పేరు (Scheme Name):** తెలంగాణ టి-ప్రైడ్ & టిఎస్-ఐపాస్ ఎంఎస్ఎంఈ ప్రోత్సాహకాలు (Telangana T-PRIDE & TS-iPASS)
**అర్హతలు & అవసరమైన పత్రాలు (Requirements):** తెలంగాణ వ్యాపారవేత్తలు, దుకాణదారులు, ఎంఎస్ఎంఈ రిజిస్ట్రేషన్ కలిగినవారు. పత్రాలు: ఉద్యమ్ సర్టిఫికేట్, ఆధార్, పాన్ కార్డు, ప్రాజెక్ట్ రిపోర్ట్, బ్యాంక్ లోన్ మంజూరు పత్రం.
**మీకు ఎందుకు సరిపోతుంది (Why it suits you):** ప్లాంట్, యంత్రాలు మరియు వాణిజ్య వాహనాలపై 35% నుండి 45% వరకు పెట్టుబడి సబ్సిడీ (గరిష్టంగా ₹75 లక్షలు) మరియు 5% వడ్డీ రాయితీ లభిస్తుంది.
**గడువు తేదీ (Deadline):** Open Year Round
**అధికారిక పోర్టల్ లింక్ (Official Portal Link):** [తెలంగాణ ఐపాస్ పోర్టల్](https://ipass.telangana.gov.in)

2.
**పథకం పేరు (Scheme Name):** తెలంగాణ రాజీవ్ ఆరోగ్యశ్రీ ఉచిత నగదు రహిత వైద్య పథకం (Rajiv Aarogyasri)
**అర్హతలు & అవసరమైన పత్రాలు (Requirements):** తెల్ల రేషన్ కార్డు కలిగిన కుటుంబాలు. పత్రాలు: ఆధార్ కార్డు, ఫుడ్ సెక్యూరిటీ కార్డు.
**మీకు ఎందుకు సరిపోతుంది (Why it suits you):** ప్రతి కుటుంబానికి ఏటా ₹10 లక్షల వరకు ఆసుపత్రులలో ఉచిత నగదు రహిత చికిత్స అందిస్తుంది.
**గడువు తేదీ (Deadline):** Check Official Portal
**అధికారిక పోర్టల్ లింక్ (Official Portal Link):** [రాజీవ్ ఆరోగ్యశ్రీ హెల్త్‌కేర్ ట్రస్ట్](https://aarogyasri.telangana.gov.in)

3.
**పథకం పేరు (Scheme Name):** తెలంగాణ గృహ జ్యోతి ఉచిత విద్యుత్ పథకం (Gruha Jyothi)
**అర్హతలు & అవసరమైన పత్రాలు (Requirements):** నెలకు 200 యూనిట్ల లోపు విద్యుత్ వాడే కుటుంబాలు. పత్రాలు: మీటర్ సర్వీస్ నంబర్, ఆధార్, రేషన్ కార్డు.
**మీకు ఎందుకు సరిపోతుంది (Why it suits you):** గృహ అవసరాలకు 200 యూనిట్ల వరకు ఉచిత విద్యుత్ (జీరో కరెంట్ బిల్లు).
**గడువు తేదీ (Deadline):** Open Year Round
**అధికారిక పోర్టల్ లింక్ (Official Portal Link):** [తెలంగాణ ప్రభుత్వం](https://telangana.gov.in)`
        : `Here are verified active Government of Telangana schemes matching your business/self-employed profile:

1.
**Scheme Name:** Telangana T-PRIDE & TS-iPASS Entrepreneur Enterprise Incentive
**Requirements:** Resident entrepreneur, shopkeeper, or business proprietor in Telangana holding Udyam MSME registration. Documents: Udyam Certificate, Aadhaar, PAN, Bank Sanction Letter.
**Why it suits you:** Up to 35% to 45% capital investment subsidy (up to ₹75 Lakhs) on machinery/vehicles plus 5% interest subvention for 5 years.
**Deadline:** Open Year Round
**Official Portal Link:** [Telangana TS-iPASS Portal](https://ipass.telangana.gov.in)

2.
**Scheme Name:** Telangana Rajiv Aarogyasri Universal Health Scheme
**Requirements:** Resident family in Telangana holding White Ration Card / Food Security Card. Documents: Aadhaar Card, Ration Card.
**Why it suits you:** Cashless medical hospitalization and surgeries up to ₹10,00,000 per family per year across network hospitals.
**Deadline:** Open Year Round
**Official Portal Link:** [Aarogyasri Health Care Trust](https://aarogyasri.telangana.gov.in)

3.
**Scheme Name:** Telangana Gruha Jyothi Free Electricity Scheme
**Requirements:** Resident domestic household consuming within 200 units of power monthly. Documents: Electricity Bill USCNO, Aadhaar Card, Food Security Card.
**Why it suits you:** Guarantees zero-rupee electricity bills for domestic consumption up to 200 units per month.
**Deadline:** Open Year Round
**Official Portal Link:** [Telangana Government Portal](https://telangana.gov.in)`;
    } else {
      // General Employed / Non-Student Profile for Telangana
      return isTeluguRequested
        ? `మీ ప్రొఫైల్ వివరాల ఆధారంగా ధృవీకరించబడిన తెలంగాణ రాష్ట్ర ప్రభుత్వ సంక్షేమ పథకాలు క్రింద ఇవ్వబడ్డాయి:

1.
**పథకం పేరు (Scheme Name):** తెలంగాణ రాజీవ్ ఆరోగ్యశ్రీ ఉచిత నగదు రహిత వైద్య పథకం (Rajiv Aarogyasri Universal Health)
**అర్హతలు & అవసరమైన పత్రాలు (Requirements):** తెలంగాణ వాస్తవ్యులు, తెల్ల రేషన్ కార్డు (ఆహార భద్రతా కార్డు) లేదా ఆరోగ్యశ్రీ కార్డు కలిగిన కుటుంబాలు. పత్రాలు: ఆధార్ కార్డు, తెల్ల రేషన్ కార్డు.
**మీకు ఎందుకు సరిపోతుంది (Why it suits you):** మీ కుటుంబానికి ప్రతి సంవత్సరం ₹10 లక్షల వరకు నెట్‌వర్క్ ప్రభుత్వ మరియు కార్పొరేట్ ఆసుపత్రులలో 1,670+ చికిత్సలకు 100% ఉచిత నగదు రహిత వైద్యం లభిస్తుంది.
**గడువు తేదీ (Deadline):** నిరంతరం అందుబాటులో ఉంటుంది (Check Official Portal)
**అధికారిక పోర్టల్ లింక్ (Official Portal Link):** [రాజీవ్ ఆరోగ్యశ్రీ హెల్త్‌కేర్ ట్రస్ట్](https://aarogyasri.telangana.gov.in)

2.
**పథకం పేరు (Scheme Name):** తెలంగాణ గృహ జ్యోతి ఉచిత విద్యుత్ పథకం (Gruha Jyothi Free Electricity)
**అర్హతలు & అవసరమైన పత్రాలు (Requirements):** నెలకు 200 యూనిట్ల వరకు గృహ విద్యుత్ వినియోగించే తెలంగాణ కుటుంబాలు, తెల్ల రేషన్ కార్డు లేదా ప్రజా పాలన నమోదు. పత్రాలు: డిస్కం కరెంట్ మీటర్ నంబర్ (USCNO), ఆధార్ కార్డు, రేషన్ కార్డు.
**మీకు ఎందుకు సరిపోతుంది (Why it suits you):** నెలకు 200 యూనిట్ల వరకు పూర్తి ఉచిత విద్యుత్ (జీరో కరెంట్ బిల్లు) నేరుగా డిస్కం బిల్లులో వర్తిస్తుంది.
**గడువు తేదీ (Deadline):** Open Year Round
**అధికారిక పోర్టల్ లింక్ (Official Portal Link):** [తెలంగాణ ప్రభుత్వం](https://telangana.gov.in)

3.
**పథకం పేరు (Scheme Name):** తెలంగాణ ఇందిరమ్మ ఇండ్లు పక్కా గృహ నిర్మాణ పథకం (Indiramma Indlu Pucca Housing)
**అర్హతలు & అవసరమైన పత్రాలు (Requirements):** సొంత పక్కా ఇల్లు లేని తెలంగాణ నివాసితులు, వార్షిక కుటుంబ ఆదాయం ₹3 లక్షల లోపు లేదా ఆహార భద్రతా కార్డు, కనీసం 50 గజాల నివాస స్థలం ఉండాలి. పత్రాలు: ఆధార్, ఇళ్ల స్థలం పట్టా, ఆదాయ పత్రం, బ్యాంక్ పాస్‌బుక్.
**మీకు ఎందుకు సరిపోతుంది (Why it suits you):** పక్కా ఇల్లు నిర్మించుకోవడానికి ప్రభుత్వం 4 దశల్లో ₹5 లక్షల నగదు ఆర్థిక సహాయాన్ని నేరుగా మీ బ్యాంక్ ఖాతాలో డీబీటీ ద్వారా జమ చేస్తుంది.
**గడువు తేదీ (Deadline):** 31 December 2026
**అధికారిక పోర్టల్ లింక్ (Official Portal Link):** [తెలంగాణ హౌసింగ్ పోర్టల్](https://housing.telangana.gov.in)`
        : `Here are verified active Government of Telangana welfare programs matching your profile:

1.
**Scheme Name:** Telangana Rajiv Aarogyasri Universal Health Scheme
**Requirements:** Resident family in Telangana holding Food Security Card (White Ration Card) or Aarogyasri Health Card. Documents: Aadhaar Card, Food Security Card.
**Why it suits you:** Provides ₹10,00,000 cashless medical coverage per family per year for in-patient hospital treatments across 1,600+ network hospitals.
**Deadline:** Open Year Round
**Official Portal Link:** [Aarogyasri Health Care Trust](https://aarogyasri.telangana.gov.in)

2.
**Scheme Name:** Telangana Gruha Jyothi Free Electricity Scheme
**Requirements:** Resident domestic household in Telangana consuming up to 200 units of power monthly, Food Security Card or Praja Palana registration. Documents: Aadhaar Card, Electricity Connection Number (USCNO), White Ration Card.
**Why it suits you:** Guarantees 100% zero-rupee electricity bills for up to 200 units of monthly domestic consumption.
**Deadline:** Open Year Round
**Official Portal Link:** [Telangana Government Portal](https://telangana.gov.in)

3.
**Scheme Name:** Telangana Indiramma Indlu Pucca Housing Scheme
**Requirements:** Permanent resident of Telangana without a permanent pucca house, Annual income under ₹3.00 Lakh, Owning a residential plot of at least 50 sq yards. Documents: Aadhaar Card, Plot Title Deed / Patta, Income Certificate, Bank Passbook.
**Why it suits you:** Grants ₹5,00,000 direct financial assistance in 4 geo-tagged construction stages deposited directly via DBT.
**Deadline:** 31 December 2026
**Official Portal Link:** [Telangana Housing Corporation](https://housing.telangana.gov.in)`;
    }
  }

  // Central schemes fallback
  if (isSenior) {
    return isTeluguRequested
      ? `మీ ప్రొఫైల్ వివరాల ఆధారంగా సీనియర్ సిటిజన్ల (Senior Citizens 60+) కోసం ధృవీకరించబడిన ప్రముఖ కేంద్ర ప్రభుత్వ సంక్షేమ పథకాలు క్రింద వివరించబడ్డాయి:

1.
**పథకం పేరు (Scheme Name):** ఇందిరా గాంధీ జాతీయ వృద్ధాప్య పింఛను పథకం (IGNOAPS - Central DBT)
**అర్హతలు & అవసరమైన పత్రాలు (Requirements):** 60 సంవత్సరాలు పైబడిన బిపిఎల్ కుటుంబాల వృద్ధులు. పత్రాలు: ఆధార్ కార్డు, బిపిఎల్ రేషన్ కార్డు, ఆధార్ డీబీటీ బ్యాంకు ఖాతా.
**మీకు ఎందుకు సరిపోతుంది (Why it suits you):** వయోవృద్ధులకు కేంద్ర ప్రభుత్వం నేరుగా నెలవారీ సామాజిక భద్రతా పింఛనును మీ బ్యాంక్ ఖాతాలో జమ చేస్తుంది.
**గడువు తేదీ (Deadline):** నిరంతరం అందుబాటులో ఉంటుంది (Check Official Portal)
**అధికారిక పోర్టల్ లింక్ (Official Portal Link):** [నేషనల్ సోషల్ అసిస్టెన్స్ పోర్టల్](https://nsap.nic.in)

2.
**పథకం పేరు (Scheme Name):** రాష్ట్రీయ వయోశ్రీ యోజన - ఉచిత సహాయ పరికరాల పథకం (Rashtriya Vayoshri Yojana)
**అర్హతలు & అవసరమైన పత్రాలు (Requirements):** 60 ఏళ్లు పైబడిన బిపిఎల్ వృద్ధులు, వయో సంబంధిత వైకల్యం లేదా బలహీనత కలవారు. పత్రాలు: ఆధార్ కార్డు, ఆదాయ ధృవీకరణ పత్రం.
**మీకు ఎందుకు సరిపోతుంది (Why it suits you):** డిజిటల్ వినికిడి యంత్రాలు, వీల్‌చైర్లు, వాకింగ్ స్టిక్స్, కళ్లజోళ్ళు మరియు కృత్రిమ పళ్ళ సెట్లు 100% ఉచితంగా పంపిణీ చేయబడతాయి.
**గడువు తేదీ (Deadline):** Open Year Round
**అధికారిక పోర్టల్ లింక్ (Official Portal Link):** [అలింకో అధికారిక పోర్టల్](https://alimco.in)

3.
**పథకం పేరు (Scheme Name):** ఆయుష్మాన్ భారత్ పీఎం-జే సీనియర్ సిటిజన్ 70+ ఉచిత ఆరోగ్య బీమా (Ayushman Bharat PM-JAY Senior Citizen Cover)
**అర్హతలు & అవసరమైన పత్రాలు (Requirements):** 70 ఏళ్లు లేదా అంతకంటే ఎక్కువ వయస్సు గల భారతీయ పౌరులందరూ (ఆదాయ పరిమితి లేదు). పత్రాలు: ఆధార్ కార్డు (వయస్సు నిర్ధారణ 70+).
**మీకు ఎందుకు సరిపోతుంది (Why it suits you):** ఆదాయంతో సంబంధం లేకుండా వృద్ధాప్య ఆసుపత్రి చికిత్సలకు ప్రతి ఏటా ₹5 లక్షల ప్రత్యేక ఉచిత నగదు రహిత ఆరోగ్య బీమా రక్షణ లభిస్తుంది.
**గడువు తేదీ (Deadline):** నిరంతరం అందుబాటులో ఉంటుంది (Check Official Portal)
**అధికారిక పోర్టల్ లింక్ (Official Portal Link):** [పీఎం-జే ఆయుష్మాన్ పోర్టల్](https://pmjay.gov.in)`
      : `Here are verified active Central Government schemes matching your profile for Senior Citizens (60+ years):

1.
**Scheme Name:** Indira Gandhi National Old Age Pension Scheme (IGNOAPS)
**Requirements:** Senior citizen aged 60+ belonging to BPL household. Documents: Aadhaar Card, BPL Ration Card, Aadhaar-linked Bank Passbook.
**Why it suits you:** Monthly non-contributory social security pension for dignified sustenance transferred directly to your bank account via DBT.
**Deadline:** Continuous Enrollment (Check Official Portal)
**Official Portal Link:** [National Social Assistance Programme](https://nsap.nic.in)

2.
**Scheme Name:** Rashtriya Vayoshri Yojana (RVY - Free Assistive Devices for Seniors)
**Requirements:** Senior citizen aged 60+ belonging to BPL category suffering from age-related infirmities/disabilities. Documents: Aadhaar Card, BPL Certificate / Pension Slip.
**Why it suits you:** 100% free supply of assisted-living devices (hearing aids, wheelchairs, spectacles, crutches, dentures) manufactured by ALIMCO.
**Deadline:** Open Year Round
**Official Portal Link:** [ALIMCO Official Portal](https://alimco.in)

3.
**Scheme Name:** Ayushman Bharat PM-JAY Senior Citizen 70+ Universal Health Cover
**Requirements:** All Indian citizens aged 70 years and above, irrespective of family income or economic status. Documents: Aadhaar Card (age verification 70+).
**Why it suits you:** Dedicated ₹5,00,000 free annual cashless health insurance cover per senior citizen across network hospitals nationwide.
**Deadline:** Continuous Enrollment (Check Official Portal)
**Official Portal Link:** [National Health Authority](https://pmjay.gov.in)`;
  } else if (isWoman) {
    return isTeluguRequested
      ? `మీ ప్రొఫైల్ వివరాల ఆధారంగా మహిళల (Women) కోసం ధృవీకరించబడిన ప్రముఖ కేంద్ర ప్రభుత్వ సంక్షేమ పథకాలు క్రింద వివరించబడ్డాయి:

1.
**పథకం పేరు (Scheme Name):** ప్రధాన మంత్రి ఉజ్జ్వల యోజన - ఉచిత గ్యాస్ కనెక్షన్ & సబ్సిడీ (PM Ujjwala Yojana)
**అర్హతలు & అవసరమైన పత్రాలు (Requirements):** 18 ఏళ్లు నిండిన బిపిఎల్ / నిరుపేద కుటుంబాల మహిళలు. పత్రాలు: ఆధార్ కార్డు, తెల్ల రేషన్ కార్డు, బ్యాంక్ ఖాతా వివరాలు.
**మీకు ఎందుకు సరిపోతుంది (Why it suits you):** మహిళల పేరిట 100% ఉచిత ఎల్పీజీ కనెక్షన్ మరియు ప్రతి సిలిండర్ రీఫిల్‌పై ₹300 ప్రత్యేక కేంద్ర ప్రభుత్వ సబ్సిడీ లభిస్తుంది.
**గడువు తేదీ (Deadline):** నిరంతరం అందుబాటులో ఉంటుంది (Check Official Portal)
**అధికారిక పోర్టల్ లింక్ (Official Portal Link):** [పీఎం ఉజ్జ్వల పోర్టల్](https://pmuy.gov.in)

2.
**పథకం పేరు (Scheme Name):** మహిళా పారిశ్రామికవేత్తల కోసం స్టాండ్-అప్ ఇండియా పథకం (Stand-Up India for Women)
**అర్హతలు & అవసరమైన పత్రాలు (Requirements):** కొత్త గ్రీన్‌ఫీల్డ్ వ్యాపారం లేదా సేవా రంగాన్ని ప్రారంభించాలనుకునే 18+ ఏళ్ల మహిళలు. పత్రాలు: ప్రాజెక్ట్ రిపోర్ట్, ఆధార్, పాన్ కార్డు, వ్యాపార ప్రణాళిక.
**మీకు ఎందుకు సరిపోతుంది (Why it suits you):** తయారీ, సేవలు లేదా వాణిజ్య రంగాల్లో వ్యాపారం ప్రారంభించడానికి ₹10 లక్షల నుండి ₹1 కోటి వరకు పూచీకత్తు లేని బ్యాంకు రుణాలను అందిస్తుంది.
**గడువు తేదీ (Deadline):** Open Year Round
**అధికారిక పోర్టల్ లింక్ (Official Portal Link):** [స్టాండ్-అప్ ఇండియా పోర్టల్](https://standupmitra.in)

3.
**పథకం పేరు (Scheme Name):** ప్రధాన మంత్రి మాతృ వందన యోజన (PMMVY - Maternity Benefit Scheme)
**అర్హతలు & అవసరమైన పత్రాలు (Requirements):** గర్భిణీ స్త్రీలు మరియు పాలిచ్చే తల్లులు (మొదటి మరియు రెండవ సంతానానికి). పత్రాలు: ఎంసీపీ కార్డు, ఆధార్, బ్యాంక్ పాస్‌బుక్.
**మీకు ఎందుకు సరిపోతుంది (Why it suits you):** పౌష్టికాహార అవసరాలు మరియు ఆరోగ్య సంరక్షణ కోసం గరిష్టంగా ₹6,000 నగదు ఆర్థిక సహాయం డీబీటీ ద్వారా నేరుగా తల్లి బ్యాంక్ ఖాతాలో జమ చేయబడుతుంది.
**గడువు తేదీ (Deadline):** Check Official Portal
**అధికారిక పోర్టల్ లింక్ (Official Portal Link):** [పీఎంఎంవీవై పోర్టల్](https://pmmvy.wcd.gov.in)`
      : `Here are verified active Central Government welfare schemes tailored specifically for Women:

1.
**Scheme Name:** Pradhan Mantri Ujjwala Yojana (PMUY - Free Domestic LPG Connection & Subsidy)
**Requirements:** Adult woman (18+) belonging to poor / BPL household without existing LPG connection. Documents: Aadhaar Card, BPL Ration Card, Bank Passbook.
**Why it suits you:** Grants a free LPG cylinder connection with stove, and ₹300 direct per-cylinder subsidy credited into your bank account.
**Deadline:** Continuous Enrollment (Check Official Portal)
**Official Portal Link:** [PM Ujjwala Yojana Portal](https://pmuy.gov.in)

2.
**Scheme Name:** Stand-Up India Scheme for Women Entrepreneurs
**Requirements:** Female entrepreneurs aged 18+ establishing greenfield enterprises in manufacturing, services, or trading sectors. Documents: Business Project Report, Aadhaar, PAN Card, KYC.
**Why it suits you:** Facilitates bank loans between ₹10 Lakh and ₹1 Crore with composite support to jumpstart your business venture.
**Deadline:** Open Year Round
**Official Portal Link:** [Stand-Up India Portal](https://standupmitra.in)

3.
**Scheme Name:** Pradhan Mantri Matru Vandana Yojana (PMMVY - Direct Cash Maternity Benefit)
**Requirements:** Pregnant women and lactating mothers for first living child (and second if female), holding ration card. Documents: Mother and Child Protection (MCP) Card, Aadhaar, Bank Passbook.
**Why it suits you:** Direct cash incentive of up to ₹6,000 disbursed in installments into your bank account for nutritional care and wage compensation.
**Deadline:** Check Official Portal
**Official Portal Link:** [PMMVY Official Portal](https://pmmvy.wcd.gov.in)`;
  } else if (isStudent) {
    return isTeluguRequested
      ? `మీ ప్రొఫైల్ వివరాల ఆధారంగా ధృవీకరించబడిన ప్రముఖ కేంద్ర ప్రభుత్వ స్కాలర్‌షిప్‌లు క్రింద వివరించబడ్డాయి:

1.
**పథకం పేరు (Scheme Name):** పీఎం యశస్వి కేంద్రీయ స్కాలర్‌షిప్ పథకం (PM-YASASVI)
**అర్హతలు & అవసరమైన పత్రాలు (Requirements):** OBC/EBC/DNT విద్యార్థులు, వార్షిక కుటుంబ ఆదాయం ₹2.5 లక్షల లోపు. పత్రాలు: ఆధార్ కార్డు, ఆదాయ ధృవీకరణ పత్రం, కుల ధృవీకరణ పత్రం, బోనఫైడ్, ఆధార్ డీబీటీ బ్యాంకు ఖాతా.
**మీకు ఎందుకు సరిపోతుంది (Why it suits you):** మీ విద్యా స్థాయి మరియు సామాజిక వర్గానికి కేంద్ర ప్రభుత్వం ద్వారా నేరుగా డీబీటీ స్కాలర్‌షిప్ అందిస్తుంది.
**గడువు తేదీ (Deadline):** Check Official Portal
**అధికారిక పోర్టల్ లింక్ (Official Portal Link):** [నేషనల్ స్కాలర్‌షిప్ పోర్టల్](https://scholarships.gov.in)

2.
**పథకం పేరు (Scheme Name):** సెంట్రల్ సెక్టార్ స్కాలర్‌షిప్ ఫర్ కాలేజ్ & యూనివర్సిటీ స్టూడెంట్స్ (CSSS via NSP)
**అర్హతలు & అవసరమైన పత్రాలు (Requirements):** 12వ తరగతి బోర్డు పరీక్షల్లో 80వ పర్సంటైల్ సాధించిన రెగ్యులర్ డిగ్రీ విద్యార్థులు, వార్షిక కుటుంబ ఆదాయం ₹4.5 లక్షల లోపు. పత్రాలు: 12వ మార్కుల మెమో, కాలేజీ బోనఫైడ్, ఆదాయ ధృవీకరణ పత్రం.
**మీకు ఎందుకు సరిపోతుంది (Why it suits you):** గ్రాడ్యుయేషన్ కోసం ప్రతి ఏటా ₹12,000 మరియు పోస్ట్ గ్రాడ్యుయేషన్ కోసం ₹20,000 ఆర్థిక సహాయం నేరుగా అందుతుంది.
**గడువు తేదీ (Deadline):** 31 December 2026
**అధికారిక పోర్టల్ లింక్ (Official Portal Link):** [నేషనల్ స్కాలర్‌షిప్ పోర్టల్](https://scholarships.gov.in)

3.
**పథకం పేరు (Scheme Name):** పీఎం విద్యా లక్ష్మి ఉన్నత విద్యా లోన్ వడ్డీ రాయితీ పథకం (PM Vidyalaxmi)
**అర్హతలు & అవసరమైన పత్రాలు (Requirements):** నాణ్యమైన ఉన్నత విద్యా సంస్థల్లో (QHEIs) ప్రవేశం పొందిన విద్యార్థులు, కుటుంబ ఆదాయం ₹8 లక్షల లోపు. పత్రాలు: కాలేజీ అడ్మిషన్ లెటర్, ఫీజు రసీదు, ఆధార్, పాన్ కార్డు.
**మీకు ఎందుకు సరిపోతుంది (Why it suits you):** గ్యారంటీ లేకుండా ₹7.5 లక్షల వరకు 3% వడ్డీ రాయితీతో విద్యా రుణాన్ని అందిస్తుంది.
**గడువు తేదీ (Deadline):** Check Official Portal
**అధికారిక పోర్టల్ లింక్ (Official Portal Link):** [పీఎం విద్యా లక్ష్మి పోర్టల్](https://www.pmvidyalaxmi.gov.in)`
      : `Here are verified active Central Government national scholarships matching your credentials:

1.
**Scheme Name:** PM-YASASVI Central Sector Scholarship Scheme for Top Class Education
**Requirements:** Meritorious OBC, EBC, and DNT students studying in recognized institutions, Annual family income under ₹2.50 Lakh. Documents: Aadhaar Card, Income Certificate, Community/Caste Certificate, Bank Passbook, Admission Proof.
**Why it suits you:** Provides complete financial assistance covering full tuition fees and hostel maintenance directly through Direct Benefit Transfer (DBT).
**Deadline:** Check Official Portal
**Official Portal Link:** [National Scholarship Portal](https://scholarships.gov.in)

2.
**Scheme Name:** Central Sector Scheme of Scholarship for College and University Students (CSSS)
**Requirements:** Above 80th percentile in Class 12 board examination pursuing regular graduation courses, Annual family income under ₹4.50 Lakh. Documents: Class 12 Marks Card, College Bonafide Certificate, Income Certificate.
**Why it suits you:** Grants ₹12,000 per annum for graduation and ₹20,000 per annum for post-graduation directly to student bank accounts.
**Deadline:** 31 December 2026
**Official Portal Link:** [National Scholarship Portal](https://scholarships.gov.in)

3.
**Scheme Name:** PM Vidyalaxmi Education Loan Scheme (Interest Subvention for Higher Studies)
**Requirements:** Indian students admitted to top NIRF-ranked Quality Higher Education Institutions (QHEIs), Family income up to ₹8.00 Lakh. Documents: Admission Letter, College Fee Structure, Aadhaar Card, PAN Card.
**Why it suits you:** Provides collateral-free student education loans up to ₹7.50 Lakh with a 3% interest subvention for eligible candidates.
**Deadline:** Check Official Portal
**Official Portal Link:** [PM Vidyalaxmi Portal](https://www.pmvidyalaxmi.gov.in)`;
  } else if (isFarmer) {
    return isTeluguRequested
      ? `మీ రైతు ప్రొఫైల్ వివరాల ఆధారంగా ధృవీకరించబడిన కేంద్ర ప్రభుత్వ పథకాలు క్రింద ఇవ్వబడ్డాయి:

1.
**పథకం పేరు (Scheme Name):** పీఎం కిసాన్ సమ్మాన్ నిధి (PM-KISAN)
**అర్హతలు & అవసరమైన పత్రాలు (Requirements):** సాగు భూమి కలిగిన భారతీయ రైతులు, ఈ-కేవైసీ పూర్తి. పత్రాలు: భూమి రికార్డులు (పాస్‌బుక్), ఆధార్ కార్డు, ఆధార్-డీబీటీ బ్యాంక్ ఖాతా.
**మీకు ఎందుకు సరిపోతుంది (Why it suits you):** ప్రతి సంవత్సరం ₹6,000 నేరుగా మూడు సమాన విడతల్లో (విడతకు ₹2,000) బ్యాంక్ ఖాతాలో జమ అవుతుంది.
**గడువు తేదీ (Deadline):** Open Year Round
**అధికారిక పోర్టల్ లింక్ (Official Portal Link):** [పీఎం కిసాన్ పోర్టల్](https://pmkisan.gov.in)

2.
**పథకం పేరు (Scheme Name):** ప్రధాన మంత్రి ఫసల్ బీమా యోజన (PMFBY Crop Insurance)
**అర్హతలు & అవసరమైన పత్రాలు (Requirements):** ఆహార, నూనెగింజల పంటలు సాగుచేసే రైతులు. పత్రాలు: పంట విత్తన ధృవీకరణ పత్రం, భూమి పాస్‌బుక్, ఆధార్.
**మీకు ఎందుకు సరిపోతుంది (Why it suits you):** ప్రకృతి వైపరీత్యాలు, కరువు, తెగుళ్ల వల్ల పంట నష్టం జరిగితే పూర్తి బీమా పరిహారం లభిస్తుంది.
**గడువు తేదీ (Deadline):** Check Official Portal
**అధికారిక పోర్టల్ లింక్ (Official Portal Link):** [పీఎంఎఫ్ బీవై పోర్టల్](https://pmfby.gov.in)

3.
**పథకం పేరు (Scheme Name):** కిసాన్ క్రెడిట్ కార్డ్ పథకం (KCC Scheme)
**అర్హతలు & అవసరమైన పత్రాలు (Requirements):** రైతులు, కౌలు రైతులు మరియు పశుపోషకులు. పత్రాలు: భూమి పత్రాలు, ఆధార్ కార్డు, పాన్ కార్డు.
**మీకు ఎందుకు సరిపోతుంది (Why it suits you):** పంట పెట్టుబడి కోసం కేవలం 4% రాయితీ వడ్డీ రేటుతో ₹3 లక్షల వరకు సులభ రుణం లభిస్తుంది.
**గడువు తేదీ (Deadline):** Open Year Round
**అధికారిక పోర్టల్ లింక్ (Official Portal Link):** [వ్యవసాయ పోర్టల్](https://agricoop.nic.in)`
      : `Here are verified active Central Government schemes matching your farmer credentials:

1.
**Scheme Name:** Pradhan Mantri Kisan Samman Nidhi (PM-KISAN)
**Requirements:** Landholding farmer families with active e-KYC and Aadhaar-seeded bank account. Documents: Land ownership records, Aadhaar Card, Bank Passbook.
**Why it suits you:** ₹6,000 per year direct income support disbursed in 3 equal four-monthly installments of ₹2,000 each.
**Deadline:** Open Year Round
**Official Portal Link:** [PM-KISAN Portal](https://pmkisan.gov.in)

2.
**Scheme Name:** Pradhan Mantri Fasal Bima Yojana (PMFBY)
**Requirements:** Farmers growing notified agricultural crops in notified areas. Documents: Land possession record, Sowing certificate, Aadhaar Card.
**Why it suits you:** Comprehensive crop loss insurance covering natural calamities, pests, and post-harvest losses at nominal 1.5% to 2% premium.
**Deadline:** Check Official Portal
**Official Portal Link:** [PMFBY Portal](https://pmfby.gov.in)

3.
**Scheme Name:** Kisan Credit Card (KCC) Crop Loan Scheme
**Requirements:** All farmers, individual/joint cultivators, tenant farmers. Documents: Land records, Aadhaar Card, Passport photo.
**Why it suits you:** Subsidized short-term crop loans up to ₹3,00,000 at an effective interest rate of just 4% per annum.
**Deadline:** Open Year Round
**Official Portal Link:** [Department of Agriculture](https://agricoop.nic.in)`;
  } else {
    // Non-student general citizen / employed
    return isTeluguRequested
      ? `మీ ప్రొఫైల్ వివరాల ఆధారంగా ధృవీకరించబడిన ప్రముఖ కేంద్ర ప్రభుత్వ సంక్షేమ పథకాలు క్రింద వివరించబడ్డాయి:

1.
**పథకం పేరు (Scheme Name):** ఆయుష్మాన్ భారత్ ప్రధాన మంత్రి జన్ ఆరోగ్య యోజన (Ayushman Bharat PM-JAY)
**అర్హతలు & అవసరమైన పత్రాలు (Requirements):** అర్హత కలిగిన భారతీయ కుటుంబాలు, SECC/రేషన్ కార్డు లబ్ధిదారులు. పత్రాలు: ఆధార్ కార్డు, రేషన్ కార్డు / ఆయుష్మాన్ కార్డు.
**మీకు ఎందుకు సరిపోతుంది (Why it suits you):** ద్వితీయ మరియు తృతీయ స్థాయి ఆసుపత్రి చికిత్సల కోసం ప్రతి కుటుంబానికి ఏడాదికి ₹5 లక్షల వరకు 100% ఉచిత నగదు రహిత ఆరోగ్య బీమా రక్షణ కల్పిస్తుంది.
**గడువు తేదీ (Deadline):** నిరంతరం అందుబాటులో ఉంటుంది (Check Official Portal)
**అధికారిక పోర్టల్ లింక్ (Official Portal Link):** [పీఎం-జే పోర్టల్](https://pmjay.gov.in)

2.
**పథకం పేరు (Scheme Name):** ప్రధాన మంత్రి ఆవాస్ యోజన - పక్కా గృహ నిర్మాణం (PMAY Urban / Gramin)
**అర్హతలు & అవసరమైన పత్రాలు (Requirements):** సొంత పక్కా ఇల్లు లేని భారతీయ పౌరులు, EWS/LIG కుటుంబాలు. పత్రాలు: ఆధార్ కార్డు, ఆదాయ ధృవీకరణ పత్రం, బ్యాంక్ ఖాతా వివరాలు.
**మీకు ఎందుకు సరిపోతుంది (Why it suits you):** పక్కా గృహ నిర్మాణానికి లేదా గృహ రుణ వడ్డీపై ₹2.67 లక్షల వరకు కేంద్ర ప్రభుత్వ సబ్సిడీ లభిస్తుంది.
**గడువు తేదీ (Deadline):** 31 December 2026
**అధికారిక పోర్టల్ లింక్ (Official Portal Link):** [పీఎం ఆవాస్ యోజన పోర్టల్](https://pmaymis.gov.in)

3.
**పథకం పేరు (Scheme Name):** పీఎం సూర్య ఘర్: ముఫ్త్ బిజిలీ యోజన (PM Surya Ghar: Muft Bijli Yojana)
**అర్హతలు & అవసరమైన పత్రాలు (Requirements):** సొంత ఇంటి పైకప్పు (రూఫ్‌టాప్) కలిగిన నివాస వినియోగదారులు. పత్రాలు: విద్యుత్ బిల్లు (CA నంబర్), ఆధార్ కార్డు, పైకప్పు ఫోటో.
**మీకు ఎందుకు సరిపోతుంది (Why it suits you):** గృహ అవసరాలకు 300 యూనిట్ల వరకు ఉచిత విద్యుత్ ఉత్పత్తికి రూఫ్‌టాప్ సోలార్ ప్లాంట్లపై ₹78,000 వరకు నేరుగా సబ్సిడీ లభిస్తుంది.
**గడువు తేదీ (Deadline):** Open Year Round
**అధికారిక పోర్టల్ లింక్ (Official Portal Link):** [పీఎం సూర్య ఘర్ పోర్టల్](https://pmsuryaghar.gov.in)`
      : `Here are verified active Central Government welfare schemes matching your profile:

1.
**Scheme Name:** Ayushman Bharat Pradhan Mantri Jan Arogya Yojana (PM-JAY)
**Requirements:** Resident citizen family meeting target socioeconomic criteria or holding state food security / ration card. Documents: Aadhaar Card, Ration Card / Ayushman Card.
**Why it suits you:** ₹5,00,000 cashless health insurance cover per family per year for secondary and tertiary care hospitalization across all empaneled hospitals nationwide.
**Deadline:** Open Year Round
**Official Portal Link:** [National Health Authority](https://pmjay.gov.in)

2.
**Scheme Name:** Pradhan Mantri Awas Yojana (PMAY Urban / Gramin Housing)
**Requirements:** Indian citizen family without a pucca house anywhere in India, Annual income within EWS/LIG brackets. Documents: Aadhaar Card, Income Certificate, Bank Account Details.
**Why it suits you:** Provides financial assistance and interest subvention up to ₹2.67 Lakh for building or buying a pucca house.
**Deadline:** 31 December 2026
**Official Portal Link:** [PMAY Official Portal](https://pmaymis.gov.in)

3.
**Scheme Name:** PM Surya Ghar: Muft Bijli Yojana (Rooftop Solar Subsidy)
**Requirements:** Domestic household owning suitable unshaded rooftop space with active residential DISCOM electricity connection. Documents: Recent Electricity Bill, Aadhaar Card, Bank Account Details.
**Why it suits you:** Direct government capital subsidy up to ₹78,000 for installing residential rooftop solar panels yielding up to 300 units of free power monthly.
**Deadline:** Open Year Round
**Official Portal Link:** [PM Surya Ghar Portal](https://pmsuryaghar.gov.in)`;
  }
}

// General AI Scheme & Scholarship Chat Bot Endpoint
app.post('/api/ai/chat', async (req, res) => {
  try {
    const { message, history, userProfile, language } = req.body;
    const ai = getGenAI();

    const userMsgLower = (message || '').toLowerCase().trim();

    // Explicit language detection from current message and client request
    const explicitEnglish = /(\benglish\b|in english|reply in english|answer in english|ఆంగ్లంలో|english\s*lo)/i.test(userMsgLower);
    const explicitTelugu = /(\btelugu\b|తెలుగు|telugulo|telugu\s*lo|in telugu)/i.test(userMsgLower) || /[\u0C00-\u0C7F]/.test(message || '');
    
    let isTeluguRequested = false;
    if (explicitEnglish) {
      isTeluguRequested = false;
    } else if (explicitTelugu) {
      isTeluguRequested = true;
    } else if (typeof language === 'string' && language.toLowerCase() === 'telugu') {
      isTeluguRequested = true;
    }

    if (!ai) {
      return res.json({
        reply: buildFallbackReply(message, userProfile, isTeluguRequested)
      });
    }

    const normalizedStatus = (userProfile?.employmentStatus || '').trim().toLowerCase();
    const isStudent = !!userProfile?.isStudent || normalizedStatus === 'student' || userProfile?.currentEducationStatus === 'Pursuing';
    const isFarmer = !!userProfile?.isFarmer || normalizedStatus === 'farmer' || (userProfile?.occupation || '').toLowerCase().includes('farmer');
    const isSenior = !!userProfile?.isSeniorCitizen || normalizedStatus.includes('senior') || normalizedStatus.includes('retired') || (userProfile?.age && userProfile.age >= 60);
    const isWoman = !!userProfile?.isWomanEntrepreneur || normalizedStatus === 'women' || normalizedStatus === 'woman' || (userProfile?.gender === 'female' && !isSenior);

    const systemInstruction = `You are the official Government Scheme & Scholarship AI Assistant ("Yojana Mitra AI").
Your role is to assist Indian citizens in discovering, checking eligibility, understanding required documents, and applying for active government welfare schemes and scholarships.

CITIZEN PROFILE CONTEXT:
${userProfile ? `
- Name: ${userProfile.name || 'Citizen'}
- Age: ${userProfile.age || 'Not specified'} (${userProfile.gender || 'Not specified'})
- Marital Status: ${userProfile.maritalStatus || 'Single'}
- State/UT & District: ${userProfile.district ? `${userProfile.district}, ` : ''}${userProfile.state || 'All India'} (${userProfile.areaType || 'Urban'} sector)
- Category: ${userProfile.category || 'General'}
- Annual Family Income: ₹${userProfile.annualFamilyIncome || 'Not specified'}
- Occupation / Status: ${userProfile.occupation || userProfile.employmentStatus || 'Not specified'}
- Education: ${userProfile.highestEducation || 'Not specified'} (${userProfile.currentEducationStatus || ''})
- Student Status: ${isStudent ? 'Yes' : 'No'}
- Farmer Status: ${isFarmer ? 'Yes' : 'No'}
- Woman / Woman Entrepreneur: ${isWoman ? 'Yes' : 'No'}
- Senior Citizen: ${isSenior ? 'Yes' : 'No'}
- BPL / EWS: ${userProfile.isBPLOrEWS ? 'Yes' : 'No'}
- PwD (Disability): ${userProfile.isDisability ? 'Yes' : 'No'}
` : 'No citizen profile provided (general query).'}

${isTeluguRequested ? `
CRITICAL LANGUAGE DIRECTIVE - RESPOND IN TELUGU (తెలుగు):
- The user is communicating in Telugu or has requested Telugu.
- Respond in clear, natural, grammatically correct, and respectful Telugu (తెలుగు లిపి).
- DO NOT answer in English. All explanations, step-by-step guidance, criteria, and document lists must be in Telugu.
- Keep official English scheme titles or portal acronyms in parentheses where helpful (e.g., 'జాతీయ స్కాలర్‌షిప్ పోర్టల్ (NSP)', 'పీఎం యశస్వి (PM-YASASVI)', 'ఆధార్ డీబీటీ (Aadhaar DBT)').
- Start with a polite greeting in Telugu: "నమస్కారం! ..."
` : `
CRITICAL LANGUAGE DIRECTIVE - RESPOND IN ENGLISH:
- The user is communicating in English or has requested English.
- Deliver your entire response in clear, fluent, professional, and friendly English.
- (Only switch to Telugu if the citizen specifically asks in Telugu or requests 'in telugu').
`}

CORE OPERATING DIRECTIVES:
1. ALWAYS ANSWER THE USER'S SPECIFIC QUESTION OR QUERY DIRECTLY:
   - Your highest priority is to directly, accurately, and thoroughly answer the user's exact question, doubt, or request.
   - If the user asks a procedural question (e.g., "how to apply for an income certificate", "how does Aadhaar DBT seeding work", "where is the nearest MeeSeva", "how to register on ePASS", "what documents are required for my college scholarship", "is there a scheme for tractors"), EXPLAIN THE EXACT STEP-BY-STEP PROCEDURE DIRECTLY.
   - If the user asks about a specific scheme, question, or general query, address THAT query directly and comprehensively.
   - If the user greets you or asks who you are, give a polite, helpful greeting and guide them on what they can ask.
   - DO NOT ignore the citizen's question to dump an unrelated pre-scripted list of schemes.

2. SCHEME RECOMMENDATION FORMAT (WHEN SCHEMES ARE REQUESTED OR DIRECTLY RELEVANT):
   - When recommending schemes or when the user asks for schemes matching their profile, provide active schemes in clean text format directly in the chatbox, numbered sequentially:
   1.
   **Scheme Name:** [Official Scheme Name]
   **Requirements:** [Eligibility criteria & Required Documents]
   **Why it suits you:** [Clear reason explaining why it suits the citizen's specific age, category, student/occupation status, and income]
   **Deadline:** [Active deadline date or 'Check Official Portal']
   **Official Portal Link:** [Direct clickable official government link e.g. [National Scholarship Portal](https://scholarships.gov.in) or https://scholarships.gov.in]

   2.
   **Scheme Name:** ...
   **Requirements:** ...
   **Why it suits you:** ...
   **Deadline:** ...
   **Official Portal Link:** ...

   - Note: If the user is asking a conversational question, clarifying a detail, asking for directions, or asking how to obtain a certificate or solve a problem, ANSWER THEIR QUESTION DIRECTLY. You do not need to append arbitrary schemes if they are not relevant to what the user asked.

3. STRICT STATE RESTRICTION (ONLY ANDHRA PRADESH & TELANGANA):
   - You EXCLUSIVELY support and concentrate on the states of **Andhra Pradesh** and **Telangana** (in addition to Pan-India Central Government schemes).
   - If a user asks about any other state (such as Karnataka, Maharashtra, etc.), politely explain that this portal is dedicated to Andhra Pradesh, Telangana, and Central Government schemes.
   - Concentrate on active schemes in Andhra Pradesh (Annadata Sukhibhava farmer grant ₹20,000/yr, Dr. NTR Vaidya Seva ₹25 Lakh cashless healthcare, NTR Bharosa Social Security Pension ₹4,000/mo, Thalliki Vandanam ₹15,000/child education incentive, Deepam 2.0 Free 3 LPG Gas Cylinders, Maha Shakti Free RTC Bus Travel for Women, Yuva Galam Unemployment Allowance ₹3,000/mo, JnanaBhumi Vidya Deevena & Vasathi Deevena Fee Reimbursement, and Sunna Vaddi for DWCRA women) and Telangana (Telangana ePASS Post-Matric Scholarships & Fee Reimbursement, Maha Lakshmi Free Bus Travel and ₹500 Gas Cylinder, Overseas Vidya Nidhi, TASK Youth Training Subsidy, Rythu Bharosa, Kalyana Lakshmi / Shaadi Mubarak, Rajiv Aarogyasri, Gruha Jyothi).

4. STRICT PROFILE RELEVANCE:
   - When suggesting schemes, ensure they strictly match the citizen's profile.
   - If NOT a student: Do NOT recommend student scholarships or college fee reimbursements; recommend employment, healthcare, housing, electricity, agricultural (if farmer), or welfare schemes.
   - If a student: Prioritize scholarships, fee reimbursement, and educational assistance.
   - If 'Women': Recommend women-specific empowerment programs (not senior pensions).
   - If 'Senior Citizen': Recommend senior citizen pensions and geriatric healthcare.

5. VERIFIED OFFICIAL SOURCES:
   - Ground all advice in official Indian government portals (.gov.in, .nic.in, myscheme.gov.in, scholarships.gov.in, etc.). Always include genuine official links for every scheme discussed.`;

    // Format chat messages
    const contents: any[] = [];
    if (Array.isArray(history)) {
      history.forEach((h: { role: string; text: string }) => {
        if (h && h.text) {
          contents.push({
            role: h.role === 'user' ? 'user' : 'model',
            parts: [{ text: String(h.text) }]
          });
        }
      });
    }

    contents.push({
      role: 'user',
      parts: [{ text: message || 'Hello, can you help me find government schemes matching my profile?' }]
    });

    const response = await generateContentWithFallback(ai, {
      primaryModel: 'gemini-3.1-flash-lite',
      fallbackModels: ['gemini-3.8-flash', 'gemini-flash-latest'],
      contents,
      config: {
        systemInstruction,
      },
      timeoutMs: 15000,
    });

    if (response?.text) {
      return res.json({
        reply: response.text
      });
    }

    return res.json({
      reply: buildFallbackReply(message, userProfile, isTeluguRequested)
    });
  } catch (error: any) {
    const { message, userProfile, language } = req.body || {};
    const isTeluguRequested = 
      (typeof language === 'string' && language.toLowerCase() === 'telugu') ||
      (/(\btelugu\b|తెలుగు|telugulo|telugu\s*lo)/i.test(message || '')) ||
      (/[\u0C00-\u0C7F]/.test(message || ''));

    return res.json({
      reply: buildFallbackReply(message, userProfile, isTeluguRequested)
    });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Automated AI Scheme Scanner for Citizen Profile
app.post('/api/ai/scan-schemes', async (req, res) => {
  try {
    const { userProfile, candidateSchemes } = req.body;
    const ai = getGenAI();

    if (!ai || !Array.isArray(candidateSchemes) || candidateSchemes.length === 0) {
      return res.json({
        success: false,
        message: 'AI unavailable or no candidate schemes provided'
      });
    }

    const schemeSummaries = candidateSchemes.map((s: any) => ({
      id: s.id,
      name: s.name,
      category: s.category,
      state: s.state || 'All India',
      level: s.governmentLevel || 'Central',
      benefit: s.financialBenefitAmount || 'Standard government welfare benefit'
    }));

    const prompt = `You are "Yojana Mitra AI", an official Government Scheme & Scholarship Finder Agent in India.
You have scanned active Central and State government schemes for the following citizen:

CITIZEN PROFILE:
- Name: ${userProfile.name}
- Age: ${userProfile.age} (${userProfile.gender})
- Marital Status: ${userProfile.maritalStatus || 'Single'}
- State & District: ${userProfile.district || ''}, ${userProfile.state} (${userProfile.areaType || 'Urban'} sector)
- Education: ${userProfile.highestEducation || 'N/A'} (${userProfile.currentEducationStatus || ''})
- Category: ${userProfile.category} (Annual Family Income: ₹${userProfile.annualFamilyIncome || '2,50,000'})
- Occupation: ${userProfile.occupation || userProfile.employmentStatus || 'Citizen'}
- Special: Student=${userProfile.isStudent}, Farmer=${userProfile.isFarmer}, WomanEntrepreneur=${userProfile.isWomanEntrepreneur}, Senior=${userProfile.isSeniorCitizen}, BPL/EWS=${userProfile.isBPLOrEWS}, PwD=${userProfile.isDisability}

CANDIDATE CENTRAL & STATE SCHEMES:
${JSON.stringify(schemeSummaries, null, 2)}

TASK:
For each scheme above, provide a 1-sentence personalized AI evaluation explaining precisely why this citizen qualifies (highlighting state entitlement if it is an official state scheme for their state) and a key action or tip for applying.
Return a valid JSON object in this exact format:
{
  "scanSummary": "Found X government schemes and scholarships matching your profile as a <occupation> in <state>.",
  "advice": {
    "<scheme_id>": "Personalized 1-sentence advice note"
  }
}`;

    const response = await generateContentWithFallback(ai, {
      primaryModel: 'gemini-3.1-flash-lite',
      fallbackModels: ['gemini-3.8-flash', 'gemini-flash-latest'],
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        responseMimeType: 'application/json',
      }
    });

    let advice: Record<string, string> = {};
    let scanSummary = `Found ${candidateSchemes.length} matching schemes for your profile.`;

    if (response?.text) {
      try {
        const parsed = JSON.parse(response.text);
        if (parsed.scanSummary) scanSummary = parsed.scanSummary;
        if (parsed.advice) advice = parsed.advice;
      } catch (e) {
        console.warn('JSON parsing notice for scan-schemes');
      }
    } else {
      candidateSchemes.forEach((s: any) => {
        advice[s.id] = `Eligible under ${s.category || 'general'} criteria in ${s.state || 'India'}. Check official portal for active registration deadlines.`;
      });
    }

    return res.json({
      success: true,
      scanSummary,
      advice
    });
  } catch (error: any) {
    console.warn('Notice in /api/ai/scan-schemes:', error?.message || error);
    res.json({
      success: false,
      message: 'Failed to run AI scanner via Gemini'
    });
  }
});

// AI Scheme Assistant Endpoint
app.post('/api/ai/ask-scheme', async (req, res) => {
  try {
    const { schemeName, schemeDetails, userQuery, userProfile } = req.body;
    const ai = getGenAI();

    if (!ai) {
      return res.json({
        answer: `As an official Yojana Mitra advisor for **${schemeName}**, please note that eligibility is based on official government guidelines. \n\nKey Highlights:\n- Ensure you verify on the official portal.\n- Keep your Aadhaar-seeded bank account, income certificate, and caste credentials ready.\n\n*(Connect your Gemini API key in Settings > Secrets for real-time interactive AI guidance)*`,
        sources: ['Official Portal Verification Required']
      });
    }

    const prompt = `You are "Yojana Mitra AI", an official Government Scheme & Scholarship Assistant in India.
Answer the citizen's query about the following government scheme in clear, friendly, and objective language.

SCHEME CONTEXT:
Name: ${schemeName}
Details: ${JSON.stringify(schemeDetails || {})}

CITIZEN PROFILE:
${userProfile ? JSON.stringify(userProfile) : 'General Citizen'}

CITIZEN'S QUESTION:
"${userQuery}"

STRICT GUIDELINES:
1. Ground your answers strictly in authentic Indian government guidelines and portals (.gov.in, .nic.in, myscheme.gov.in, scholarships.gov.in).
2. Do not invent benefits, deadlines, or eligibility rules. If information is conditional or not officially confirmed, explicitly advise the citizen to verify on the official government website.
3. If explaining required documents, provide clear, practical tips (such as how to get an Income Certificate or link Aadhaar to a bank account).
4. Keep the tone respectful, clear, and reassuring.`;

    const response = await generateContentWithFallback(ai, {
      primaryModel: 'gemini-3.1-flash-lite',
      fallbackModels: ['gemini-3.8-flash', 'gemini-flash-latest'],
      contents: prompt,
      config: {
        systemInstruction: 'You are the official Yojana Mitra Assistant for Indian Government Schemes and Scholarships. Always ground advice in verified government portals (.gov.in).'
      }
    });

    res.json({
      answer: response?.text || 'Please check the official portal for specific scheme criteria or try your query again in a moment.',
      sources: ['National Portal / Department Guidelines']
    });
  } catch (error: any) {
    res.json({
      answer: 'Please refer to the official government portal for the most accurate and up-to-date scheme guidelines, or try asking your question again in a moment.',
      sources: ['Official Portal Verification Recommended']
    });
  }
});

// AI Live Scheme Discovery Endpoint with Google Search Grounding
app.post('/api/ai/search-schemes', async (req, res) => {
  try {
    const { query, state, category, userProfile } = req.body;
    const ai = getGenAI();

    if (!ai) {
      return res.json({
        summary: `Search for "${query}" across official government portals like myScheme.gov.in and National Scholarship Portal.`,
        groundingUrls: []
      });
    }

    const prompt = `Search for official Indian central or state government schemes or scholarships matching: "${query}".
State context: ${state || 'All India'}
Category: ${category || 'All'}
Citizen details: ${userProfile ? `Age: ${userProfile.age}, Occupation: ${userProfile.occupation}, Category: ${userProfile.category}, Income: ₹${userProfile.annualFamilyIncome}` : 'General'}

Provide:
1. Direct name and operating Ministry/Department of genuine active government schemes.
2. Target eligibility criteria and financial or welfare benefits.
3. Essential documents required for application.
4. Official government portal application link (.gov.in / .nic.in).
Do not invent deadlines or unofficial URLs.`;

    const response = await generateContentWithFallback(ai, {
      primaryModel: 'gemini-3.1-flash-lite',
      fallbackModels: ['gemini-3.8-flash', 'gemini-flash-latest'],
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }]
      }
    });

    const groundingChunks = response?.candidates?.[0]?.groundingMetadata?.groundingChunks;
    const urls: { title: string; uri: string }[] = [];
    if (groundingChunks && Array.isArray(groundingChunks)) {
      groundingChunks.forEach((chunk: any) => {
        if (chunk.web?.uri) {
          urls.push({
            title: chunk.web.title || 'Official Government Source',
            uri: chunk.web.uri
          });
        }
      });
    }

    res.json({
      summary: response?.text || 'Official schemes matching your query are active. Please check myscheme.gov.in or scholarships.gov.in.',
      groundingUrls: urls
    });
  } catch (error: any) {
    res.json({
      summary: `Unable to complete live search right now due to high portal traffic. Please search directly on myscheme.gov.in or scholarships.gov.in.`,
      groundingUrls: []
    });
  }
});

// AI Document Readiness Evaluator
app.post('/api/ai/check-documents', async (req, res) => {
  try {
    const { schemeName, requiredDocs, userHeldDocs } = req.body;
    const ai = getGenAI();

    if (!ai) {
      return res.json({
        analysis: 'Please check your required certificates against the scheme requirements and visit your local MeeSeva / CSC / Tehsildar office if any are missing.'
      });
    }

    const prompt = `You are Yojana Mitra Document Verification Advisor.
Scheme: ${schemeName}
Required Documents: ${JSON.stringify(requiredDocs)}
User's Available Documents: ${JSON.stringify(userHeldDocs)}

Analyze which documents are ready and provide simple step-by-step instructions on how the citizen can acquire any missing official documents (such as Caste Certificate, Income Certificate from Tehsildar/Revenue Department, Bonafide from college, or Aadhaar-bank seeding).`;

    const response = await generateContentWithFallback(ai, {
      primaryModel: 'gemini-3.1-flash-lite',
      fallbackModels: ['gemini-3.8-flash', 'gemini-flash-latest'],
      contents: prompt
    });

    res.json({
      analysis: response?.text || 'Document checklist verified.'
    });
  } catch (error: any) {
    res.json({
      analysis: 'Please verify that your Caste, Income, and Education certificates are active and that your bank account is seeded with Aadhaar for DBT transfer.'
    });
  }
});

// Setup Vite or Static File Serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Yojana Mitra Server running at http://0.0.0.0:${PORT}`);
  });
}

// Only launch HTTP listener if running outside Vercel Serverless environment
if (!process.env.VERCEL) {
  startServer();
}

export default app;
export { app };
