import { GoogleGenAI } from '@google/genai';

function getGenAI() {
  const apiKey = (process.env.GEMINI_API_KEY || '').trim();
  if (!apiKey) {
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

async function generateContentWithFallback(ai, options) {
  const modelsToTry = [
    options.primaryModel || 'gemini-3.1-flash-lite',
    ...(options.fallbackModels || ['gemini-3.8-flash', 'gemini-flash-latest'])
  ];

  for (let i = 0; i < modelsToTry.length; i++) {
    const model = modelsToTry[i];
    const maxAttempts = i === 0 ? (options.retries ?? 1) : 0;
    
    for (let attempt = 0; attempt <= maxAttempts; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: options.contents,
          config: options.config,
        });
        return response;
      } catch (err) {
        const errMsg = (err?.message || String(err)).toLowerCase();
        const isTransient = 
          errMsg.includes('503') || 
          errMsg.includes('high demand') || 
          errMsg.includes('unavailable') || 
          errMsg.includes('resource_exhausted') || 
          errMsg.includes('quota') ||
          errMsg.includes('rate') ||
          errMsg.includes('429');

        if (isTransient && attempt < maxAttempts) {
          const delay = (attempt + 1) * 600 + Math.floor(Math.random() * 200);
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }

        if (isTransient && i < modelsToTry.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 300));
          break;
        }

        if (!isTransient) {
          break;
        }
      }
    }
  }

  return null;
}

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch {
        body = {};
      }
    } else if (!body) {
      body = {};
    }

    const { message = '', history = [], userProfile = null, language = 'english' } = body;
    const ai = getGenAI();

    // Language detection
    const isTeluguRequested = 
      (typeof language === 'string' && language.toLowerCase() === 'telugu') ||
      (/(\btelugu\b|తెలుగు|telugulo|telugu\s*lo)/i.test(message || '')) ||
      (/[\u0C00-\u0C7F]/.test(message || '')) ||
      (Array.isArray(history) && history.some(h => 
        /(\btelugu\b|తెలుగు|telugulo|telugu\s*lo)/i.test(h.text || '') || /[\u0C00-\u0C7F]/.test(h.text || '')
      ));

    // Structured fallback if Gemini API key is missing
    if (!ai) {
      const employmentStatus = userProfile?.employmentStatus || '';
      const isSenior = employmentStatus === 'Senior Citizen' || !!userProfile?.isSeniorCitizen;
      const isWoman = employmentStatus === 'Women' || !!userProfile?.isWomanEntrepreneur || (userProfile?.gender === 'female' && !isSenior);
      const isFarmer = employmentStatus === 'Farmer' || !!userProfile?.isFarmer;
      const studentKeywords = /(student|scholarship|college|school|vidya|చదువు|విద్య|స్కాలర్‌షిప్)/i.test(message) || employmentStatus === 'Student';
      let defaultReply = '';
      
      if (isTeluguRequested) {
        if (isSenior) {
          defaultReply = `మీ ప్రొఫైల్ ఆధారంగా ఆంధ్రప్రదేశ్ రాష్ట్ర ప్రభుత్వ సీనియర్ సిటిజన్ (Senior Citizen) సంక్షేమ పథకాలు క్రింద ఇవ్వబడ్డాయి:

1.
**పథకం పేరు (Scheme Name):** ఆంధ్రప్రదేశ్ ఎన్టీఆర్ భరోసా వృద్ధాప్య పింఛను పథకం (AP NTR Bharosa Senior Citizen Pension)
**అర్హతలు & అవసరమైన పత్రాలు (Requirements):** 60 సంవత్సరాలు నిండిన వృద్ధులు, వార్షిక కుటుంబ ఆదాయం ₹1.44 లక్షల లోపు (గ్రామీణ) / ₹1.20 లక్షల లోపు (పట్టణ). పత్రాలు: ఆధార్ కార్డు (వయస్సు నిర్ధారణ 60+), ఏపీ రైస్ కార్డ్ (తెల్ల రేషన్ కార్డు), ఆధార్ అనుసంధానిత బ్యాంకు ఖాతా.
**మీకు ఎందుకు సరిపోతుంది (Why it suits you):** నెలకు ₹4,000 వృద్ధాప్య పింఛను ప్రతి నెలా 1వ తేదీన నేరుగా గ్రామ/వార్డు సచివాలయాల ద్వారా మీ ఇంటి వద్దే నగదు రూపంలో అందజేయబడుతుంది.
**గడువు తేదీ (Deadline):** నిరంతరం అందుబాటులో ఉంటుంది (Check Official Portal)
**అధికారిక పోర్టల్ లింక్ (Official Portal Link):** [AP SSPensions Portal](https://sspensions.ap.gov.in)

2.
**పథకం పేరు (Scheme Name):** డాక్టర్ ఎన్టీఆర్ వైద్య సేవ వయోవృద్ధుల ఆరోగ్య భద్రత (Dr. NTR Vaidya Seva Geriatric Healthcare)
**అర్హతలు & అవసరమైన పత్రాలు (Requirements):** 60+ ఏళ్ల వృద్ధులు, వార్షిక ఆదాయం ₹5 లక్షల లోపు. పత్రాలు: ఆధార్ కార్డు, ఎన్టీఆర్ వైద్య సేవ హెల్త్ కార్డు / రైస్ కార్డ్.
**మీకు ఎందుకు సరిపోతుంది (Why it suits you):** మోకాలి మార్పిడి, గుండె చికిత్సలు, క్యాన్సర్ సహా 3,257 శస్త్రచికిత్సలకు ₹25 లక్షల వరకు పూర్తి నగదు రహిత ఆసుపత్రి చికిత్స మరియు విశ్రాంతి సమయంలో నెలకు ₹5,000 ఆరోగ్య ఆసరా లభిస్తుంది.
**గడువు తేదీ (Deadline):** Open Year Round
**అధికారిక పోర్టల్ లింక్ (Official Portal Link):** [Dr. NTR Vaidya Seva](https://aarogyasri.ap.gov.in)

3.
**పథకం పేరు (Scheme Name):** ఆంధ్రప్రదేశ్ వయో వందన సహాయ పరికరాల పథకం (AP Vayo Vandana Scheme)
**అర్హతలు & అవసరమైన పత్రాలు (Requirements):** 60 ఏళ్లు పైబడిన బిపిఎల్ వయోవృద్ధులు. పత్రాలు: ఆధార్ కార్డు, ఆదాయ ధృవీకరణ పత్రం.
**మీకు ఎందుకు సరిపోతుంది (Why it suits you):** వినికిడి యంత్రాలు, వీల్‌చైర్లు, వాకింగ్ స్టిక్స్, కళ్లజోళ్ళు మరియు కృత్రిమ పళ్ళ సెట్లు 100% ఉచితంగా పంపిణీ చేయబడతాయి.
**గడువు తేదీ (Deadline):** Check Official Portal
**అధికారిక పోర్టల్ లింక్ (Official Portal Link):** [AP Navasakam Portal](https://navasakam2.apcfss.in)

4.
**పథకం పేరు (Scheme Name):** ఆంధ్రప్రదేశ్ సీనియర్ సిటిజన్ ఆర్టీసీ బస్సు రాయితీ & వృద్ధుల గుర్తింపు కార్డు (APSRTC Senior Citizen Bus Concession)
**అర్హతలు & అవసరమైన పత్రాలు (Requirements):** 60 ఏళ్లు నిండిన ఆంధ్రప్రదేశ్ వయోవృద్ధులు. పత్రాలు: ఆధార్ కార్డు / సీనియర్ సిటిజన్ ఐడీ కార్డ్, ఫోటో.
**మీకు ఎందుకు సరిపోతుంది (Why it suits you):** ఆర్టీసీ పల్లె వెలుగు, ఎక్స్‌ప్రెస్ మరియు డీలక్స్ బస్సు ప్రయాణాల్లో 25% టికెట్ రాయితీ మరియు బస్సుల్లో ప్రత్యేక సీట్లు లభిస్తాయి.
**గడువు తేదీ (Deadline):** Open Year Round
**అధికారిక పోర్టల్ లింక్ (Official Portal Link):** [APSRTC Official Portal](https://apsrtc.ap.gov.in)`;
        } else if (isWoman) {
          defaultReply = `మీ ప్రొఫైల్ ఆధారంగా ఆంధ్రప్రదేశ్ రాష్ట్ర ప్రభుత్వ మహిళా (Women) సంక్షేమ పథకాలు క్రింద ఇవ్వబడ్డాయి:

1.
**పథకం పేరు (Scheme Name):** ఆంధ్రప్రదేశ్ మహా శక్తి ఉచిత ఆర్టీసీ బస్సు ప్రయాణ పథకం (AP Maha Shakti Free Bus Travel for Women)
**అర్హతలు & అవసరమైన పత్రాలు (Requirements):** ఆంధ్రప్రదేశ్ నివాసితులైన బాలికలు మరియు మహిళలందరూ. పత్రాలు: ఆధార్ కార్డు లేదా గుర్తింపు కార్డు.
**మీకు ఎందుకు సరిపోతుంది (Why it suits you):** ఏపీఎస్ ఆర్టీసీ పల్లె వెలుగు, ఎక్స్‌ప్రెస్ బస్సులలో రాష్ట్రవ్యాప్తంగా ఎలాంటి ఛార్జీ లేకుండా 100% ఉచితంగా ప్రయాణించవచ్చు.
**గడువు తేదీ (Deadline):** నిరంతరం అందుబాటులో ఉంటుంది (Check Official Portal)
**అధికారిక పోర్టల్ లింక్ (Official Portal Link):** [APSRTC Official Portal](https://apsrtc.ap.gov.in)

2.
**పథకం పేరు (Scheme Name):** ఆంధ్రప్రదేశ్ మహా శక్తి ఆడబిడ్డ నిధి (AP Maha Shakti Aadabidda Nidhi Scheme)
**అర్హతలు & అవసరమైన పత్రాలు (Requirements):** 18 నుండి 59 సంవత్సరాల వయస్సు గల ఏపీ మహిళలు, తెల్ల రేషన్ కార్డు కలిగి ఉండాలి. పత్రాలు: ఆధార్ కార్డు, రైస్ కార్డ్, డీబీటీ బ్యాంకు పాస్‌బుక్.
**మీకు ఎందుకు సరిపోతుంది (Why it suits you):** నెలకు ₹1,500 (సంవత్సరానికి ₹18,000) నగదు సహాయం నేరుగా మీ బ్యాంకు ఖాతాలో డీబీటీ పద్ధతిలో జమ అవుతుంది.
**గడువు తేదీ (Deadline):** Check Official Portal
**అధికారిక పోర్టల్ లింక్ (Official Portal Link):** [AP Navasakam Portal](https://navasakam2.apcfss.in)

3.
**పథకం పేరు (Scheme Name):** ఆంధ్రప్రదేశ్ దీపం 2.0 పథకం - 3 ఉచిత గ్యాస్ సిలిండర్లు (Deepam 2.0 Scheme)
**అర్హతలు & అవసరమైన పత్రాలు (Requirements):** మహిళ పేరుపై గ్యాస్ కనెక్షన్, ఏపీ రైస్ కార్డ్. పత్రాలు: ఆధార్ కార్డు, గ్యాస్ కనెక్షన్ బుక్, రైస్ కార్డ్.
**మీకు ఎందుకు సరిపోతుంది (Why it suits you):** సంవత్సరానికి 3 గృహ వినియోగ ఎల్పీజీ సిలిండర్ల పూర్తి ఖర్చు 100% సబ్సిడీ రీయింబర్స్‌మెంట్ ద్వారా ఉచితంగా లభిస్తుంది.
**గడువు తేదీ (Deadline):** Open Year Round
**అధికారిక పోర్టల్ లింక్ (Official Portal Link):** [AP Spandana Portal](https://spandana.ap.gov.in)

4.
**పథకం పేరు (Scheme Name):** ఆంధ్రప్రదేశ్ సున్నా వడ్డీ డ్వాక్రా రుణాల పథకం (AP Sunna Vaddi DWCRA Loans)
**అర్హతలు & అవసరమైన పత్రాలు (Requirements):** ఏపీలో నమోదైన డ్వాక్రా (SHG) మహిళా సంఘాల సభ్యులు, ₹5 లక్షల వరకు రుణాలు. పత్రాలు: సంఘం రికార్డులు, సభ్యుల ఆధార్, లోన్ పాస్‌బుక్.
**మీకు ఎందుకు సరిపోతుంది (Why it suits you):** బ్యాంకు రుణాలపై అయ్యే పూర్తి వడ్డీని (0% వడ్డీ) ప్రభుత్వమే నేరుగా బ్యాంకులకు లేదా మహిళా ఖాతాలకు చెల్లిస్తుంది.
**గడువు తేదీ (Deadline):** Open Year Round
**అధికారిక పోర్టల్ లింక్ (Official Portal Link):** [AP Navasakam Portal](https://navasakam2.apcfss.in)

5.
**పథకం పేరు (Scheme Name):** వైఎస్సార్ చేయూత & స్త్రీ నిధి మహిళా జీవనోపాధి పథకం (YSR Cheyutha & Stree Nidhi)
**అర్హతలు & అవసరమైన పత్రాలు (Requirements):** 45 నుండి 60 ఏళ్ల మధ్య వయస్సు గల ఎస్సీ, ఎస్టీ, బీసీ, మైనారిటీ మహిళలు. పత్రాలు: కుల ధృవీకరణ పత్రం, వయస్సు రుజువు, ఆధార్, బ్యాంక్ ఖాతా.
**మీకు ఎందుకు సరిపోతుంది (Why it suits you):** మహిళల స్వయం ఉపాధి కోసం 4 ఏళ్లలో మొత్తం ₹75,000 (ఏడాదికి ₹18,750) ప్రత్యక్ష ఆర్థిక సహాయం లభిస్తుంది.
**గడువు తేదీ (Deadline):** Check Official Portal
**అధికారిక పోర్టల్ లింక్ (Official Portal Link):** [AP Navasakam Portal](https://navasakam2.apcfss.in)

6.
**పథకం పేరు (Scheme Name):** వైఎస్సార్ కళ్యాణ మస్తు & షాదీ ముబారక్ పథకం (YSR Kalyana Masthu & Shaadi Mubarak)
**అర్హతలు & అవసరమైన పత్రాలు (Requirements):** వివాహం చేసుకునే పేద కుటుంబాల ఆడపిల్లలు (18+ సం.), 10వ తరగతి ఉత్తీర్ణత. పత్రాలు: 10వ తరగతి సర్టిఫికెట్, ఆధార్ కార్డు, పెళ్లి కార్డు.
**మీకు ఎందుకు సరిపోతుంది (Why it suits you):** ఆడపిల్లల గౌరవప్రదమైన వివాహం కోసం ₹1,00,000 వరకు నేరుగా వధువు తల్లి ఖాతాలో జమ చేయబడుతుంది.
**గడువు తేదీ (Deadline):** వివాహం జరిగిన 60 రోజుల్లోపు (Check Official Portal)
**అధికారిక పోర్టల్ లింక్ (Official Portal Link):** [నవశకం కళ్యాణ మస్తు](https://navasakam.ap.gov.in)`;
        } else if (studentKeywords) {
          defaultReply = `మీ ప్రొఫైల్ వివరాల ఆధారంగా విద్యార్థుల కోసం ధృవీకరించబడిన రాష్ట్ర ప్రభుత్వ సంక్షేమ పథకాలు & స్కాలర్‌షిప్‌లు క్రింద వివరించబడ్డాయి:

1.
**పథకం పేరు (Scheme Name):** ఆంధ్రప్రదేశ్ జగనన్న విద్యా దీవెన - పూర్తి ఫీజు రీయింబర్స్‌మెంట్ (Jagananna Vidya Deevena)
**అర్హతలు & అవసరమైన పత్రాలు (Requirements):** ఐటీఐ, పాలిటెక్నిక్, డిగ్రీ, ఇంజనీరింగ్, ఫార్మసీ లేదా పీజీ చదువుతున్న రెగ్యులర్ విద్యార్థులు, వార్షిక కుటుంబ ఆదాయం ₹2.5 లక్షల లోపు, 75% హాజరు. పత్రాలు: ఆధార్ కార్డు, రేషన్ కార్డ్ / ఆదాయ ధృవీకరణ పత్రం, కాలేజ్ అడ్మిషన్ రసీదు, తల్లి బ్యాంకు పాస్‌బుక్.
**మీకు ఎందుకు సరిపోతుంది (Why it suits you):** కళాశాల పూర్తి ట్యూషన్ ఫీజును 100% రాష్ట్ర ప్రభుత్వమే నేరుగా మీ తల్లి బ్యాంకు ఖాతాలో త్రైమాసిక వాయిదాలలో జమ చేస్తుంది.
**గడువు తేదీ (Deadline):** Check Official Portal
**అధికారిక పోర్టల్ లింక్ (Official Portal Link):** [జ్ఞానభూమి పోర్టల్](https://jnanabhumi.ap.gov.in)

2.
**పథకం పేరు (Scheme Name):** ఆంధ్రప్రదేశ్ జగనన్న వసతి దీవెన - హాస్టల్ & భోజన వసతి (Jagananna Vasathi Deevena)
**అర్హతలు & అవసరమైన పత్రాలు (Requirements):** పాలిటెక్నిక్, ఐటీఐ, డిగ్రీ, ఇంజనీరింగ్ రెగ్యులర్ విద్యార్థులు. పత్రాలు: ఆధార్, హాస్టల్ / కాలేజ్ బోనఫైడ్, తల్లి బ్యాంకు ఖాతా.
**మీకు ఎందుకు సరిపోతుంది (Why it suits you):** హాస్టల్ మరియు మెస్ ఖర్చుల కోసం సంవత్సరానికి ₹10,000 నుండి ₹20,000 వరకు ప్రత్యక్ష నగదు సహాయం లభిస్తుంది.
**గడువు తేదీ (Deadline):** Check Official Portal
**అధికారిక పోర్టల్ లింక్ (Official Portal Link):** [జ్ఞానభూమి పోర్టల్](https://jnanabhumi.ap.gov.in)

3.
**పథకం పేరు (Scheme Name):** ఆంధ్రప్రదేశ్ తల్లికి వందనం పథకం (AP Thalliki Vandanam)
**అర్హతలు & అవసరమైన పత్రాలు (Requirements):** పాఠశాలలో 1 నుండి 12వ తరగతి చదువుతున్న విద్యార్థులు, 75% హాజరు, తెల్ల రేషన్ కార్డు. పత్రాలు: ఆధార్, స్టడీ సర్టిఫికెట్, తల్లి బ్యాంకు ఖాతా.
**మీకు ఎందుకు సరిపోతుంది (Why it suits you):** చదువుకునే ప్రతి విద్యార్థికి తల్లి ఖాతాలో ప్రతి సంవత్సరం ₹15,000 నేరుగా జమ చేయబడుతుంది.
**గడువు తేదీ (Deadline):** Check Official Portal
**అధికారిక పోర్టల్ లింక్ (Official Portal Link):** [జ్ఞానభూమి పోర్టల్](https://jnanabhumi.ap.gov.in)`;
        } else {
          defaultReply = `నమస్కారం! మీ ప్రొఫైల్ వివరాల ఆధారంగా మీరు అర్హులైన ప్రముఖ రాష్ట్ర ప్రభుత్వ సంక్షేమ పథకాలు క్రింద వివరించబడ్డాయి:

1.
**పథకం పేరు (Scheme Name):** డాక్టర్ ఎన్టీఆర్ వైద్య సేవ ఆరోగ్య భద్రత పథకం (Dr. NTR Vaidya Seva)
**అర్హతలు & అవసరమైన పత్రాలు (Requirements):** ఆంధ్రప్రదేశ్ నివాసితులు, వార్షిక కుటుంబ ఆదాయం ₹5 లక్షల లోపు లేదా తెల్ల రేషన్ కార్డు కలిగి ఉండాలి. పత్రాలు: ఆధార్ కార్డు, రైస్ కార్డ్.
**మీకు ఎందుకు సరిపోతుంది (Why it suits you):** ప్రతి కుటుంబానికి సంవత్సరానికి ₹25 లక్షల వరకు పూర్తి నగదు రహిత ఆసుపత్రి చికిత్స లభిస్తుంది.
**గడువు తేదీ (Deadline):** నిరంతరం అందుబాటులో ఉంటుంది (Check Official Portal)
**అధికారిక పోర్టల్ లింక్ (Official Portal Link):** [ఎన్టీఆర్ వైద్య సేవ పోర్టల్](https://aarogyasri.ap.gov.in)

2.
**పథకం పేరు (Scheme Name):** ఆంధ్రప్రదేశ్ అన్నదాత సుఖీభవ రైతు పథకం (Annadata Sukhibhava)
**అర్హతలు & అవసరమైన పత్రాలు (Requirements):** ఏపీలో భూమి కలిగిన మరియు కౌలు రైతులు. పత్రాలు: పట్టాదారు పాస్‌బుక్, ఆధార్, బ్యాంక్ ఖాతా.
**మీకు ఎందుకు సరిపోతుంది (Why it suits you):** వ్యవసాయ పెట్టుబడి సహాయంగా ప్రతి రైతు కుటుంబానికి సంవత్సరానికి ₹20,000 నేరుగా డీబీటీ ద్వారా అందుతుంది.
**గడువు తేదీ (Deadline):** Check Official Portal
**అధికారిక పోర్టల్ లింక్ (Official Portal Link):** [ఏపీ వ్యవసాయ పోర్టల్](https://apagrisnet.gov.in)`;
        }
      } else {
        if (isSenior) {
          defaultReply = `Here are active State Government schemes for Senior Citizens (60+ years) matching your profile in Andhra Pradesh:

1.
**Scheme Name:** Andhra Pradesh NTR Bharosa Senior Citizen Pension Scheme (Old Age Pension)
**Requirements:** Permanent resident of AP aged 60 years or older, Annual family income under ₹1.44 Lakh. Documents: Aadhaar Card (age proof 60+), AP Rice Card / White Ration Card, Bank Passbook.
**Why it suits you:** Provides a dedicated monthly old age pension of ₹4,000 delivered directly at your doorstep on the 1st of every month without waiting in long queues.
**Deadline:** Continuous Enrollment (Check Official Portal)
**Official Portal Link:** [AP SSPensions Portal](https://sspensions.ap.gov.in)

2.
**Scheme Name:** Dr. NTR Vaidya Seva Geriatric & Senior Citizen Healthcare Support
**Requirements:** Senior citizen aged 60+ resident of AP, Family income under ₹5 Lakhs. Documents: Aadhaar Card, NTR Vaidya Seva Card / Rice Card.
**Why it suits you:** Full 100% cashless hospitalization up to ₹25,00,000 covering major senior procedures (cardiac, knee/hip replacement, cancer) plus ₹5,000/month post-op recovery allowance.
**Deadline:** Open Year Round
**Official Portal Link:** [Dr. NTR Vaidya Seva](https://aarogyasri.ap.gov.in)

3.
**Scheme Name:** Andhra Pradesh Vayo Vandana Senior Citizen Assistive Devices Scheme
**Requirements:** Senior citizen aged 60+, BPL household. Documents: Aadhaar Card, Income Certificate.
**Why it suits you:** 100% free distribution of assisted-living aids including digital hearing aids, wheelchairs, spectacles, and artificial dentures.
**Deadline:** Check Official Portal
**Official Portal Link:** [AP Navasakam Portal](https://navasakam2.apcfss.in)

4.
**Scheme Name:** Andhra Pradesh Senior Citizen APSRTC Bus Concession & Vrudhula Card
**Requirements:** Resident senior citizen aged 60+ years residing in Andhra Pradesh. Documents: Aadhaar Card / Senior Citizen ID Card, Passport Photo.
**Why it suits you:** 25% bus travel fare concession across all APSRTC services and dedicated reserved priority seating across buses and bus stations statewide.
**Deadline:** Open Year Round
**Official Portal Link:** [APSRTC Official Portal](https://apsrtc.ap.gov.in)`;
        } else if (isWoman) {
          defaultReply = `Here are active State Government schemes tailored specifically for Women in Andhra Pradesh:

1.
**Scheme Name:** Andhra Pradesh Maha Shakti Scheme (Free RTC Bus Travel for Women)
**Requirements:** All women, girls, and students residing in Andhra Pradesh. Documents: Aadhaar Card or recognised photo identity.
**Why it suits you:** Enjoy 100% free, zero-fare bus travel on all APSRTC Palle Velugu and Express buses statewide without any journey ceiling.
**Deadline:** Continuous Enrollment (Check Official Portal)
**Official Portal Link:** [APSRTC Official Portal](https://apsrtc.ap.gov.in)

2.
**Scheme Name:** Andhra Pradesh Maha Shakti Aadabidda Nidhi Scheme
**Requirements:** Women residents of Andhra Pradesh aged between 18 and 59 years, AP White Ration Card holder. Documents: Aadhaar Card, Rice Card, Aadhaar DBT-linked bank account.
**Why it suits you:** Direct cash transfer of ₹1,500 per month (₹18,000 annually) credited directly into your bank account.
**Deadline:** Check Official Portal
**Official Portal Link:** [AP Navasakam Portal](https://navasakam2.apcfss.in)

3.
**Scheme Name:** Andhra Pradesh Deepam 2.0 Scheme (3 Free LPG Cylinders)
**Requirements:** Female head of household in Andhra Pradesh with active domestic LPG connection and Rice Card. Documents: Aadhaar Card, Rice Card, LPG Consumer Passbook.
**Why it suits you:** 3 free domestic cooking gas cylinder refills per year with 100% full DBT cost reimbursement within 48 hours of delivery.
**Deadline:** Open Year Round
**Official Portal Link:** [AP Spandana Portal](https://spandana.ap.gov.in)

4.
**Scheme Name:** Andhra Pradesh Sunna Vaddi (Zero Interest DWCRA Loans)
**Requirements:** Women members of registered DWCRA Self Help Groups (SHG) in AP with bank loans up to ₹5,00,000. Documents: SHG Registration, Member Aadhaar, Loan Passbook.
**Why it suits you:** 100% full interest subvention reimbursed directly by the state government, eliminating all interest burden.
**Deadline:** Open Year Round
**Official Portal Link:** [AP Navasakam Portal](https://navasakam2.apcfss.in)

5.
**Scheme Name:** Andhra Pradesh YSR Cheyutha & Stree Nidhi Livelihood Scheme
**Requirements:** Women aged 45 to 60 years from SC, ST, BC, and Minority communities. Documents: Caste Certificate, Age Proof, Aadhaar Card, Bank Passbook.
**Why it suits you:** Total financial grant of ₹75,000 disbursed across 4 equal yearly installments of ₹18,750 each for sustainable entrepreneurship and livelihood.
**Deadline:** Check Official Portal
**Official Portal Link:** [AP Navasakam Portal](https://navasakam2.apcfss.in)

6.
**Scheme Name:** Andhra Pradesh YSR Kalyana Masthu & Shaadi Mubarak
**Requirements:** Resident brides aged 18+ from poor families who have passed Class 10 examination. Documents: Class 10 Certificate, Aadhaar Card, Wedding Card, Mother's Bank Passbook.
**Why it suits you:** One-time wedding financial grant of up to ₹1,00,000 deposited directly into the bride's mother's bank account.
**Deadline:** Apply within 60 days of marriage
**Official Portal Link:** [AP Navasakam Portal](https://navasakam2.apcfss.in)`;
        } else if (studentKeywords) {
          defaultReply = `Here are active State Government schemes and scholarships matching your profile:

1.
**Scheme Name:** Andhra Pradesh Jagananna Vidya Deevena (RTF - Full Fee Reimbursement)
**Requirements:** Regular students enrolled in ITI, Polytechnic, Degree, Engineering, Pharmacy, or PG courses in AP, Annual family income under ₹2.5 Lakh, Min 75% attendance. Documents: Aadhaar Card, White Ration Card / Income Certificate, Admission Fee Receipt, Mother's Bank Passbook.
**Why it suits you:** 100% full college tuition fee reimbursement credited directly into the student's mother's bank account in quarterly installments.
**Deadline:** Check Official Portal
**Official Portal Link:** [AP JnanaBhumi Portal](https://jnanabhumi.ap.gov.in)

2.
**Scheme Name:** Andhra Pradesh Jagananna Vasathi Deevena (MTF - Food & Hostel Support)
**Requirements:** Regular students enrolled in ITI, Polytechnic, Degree, Engineering, or PG courses in Andhra Pradesh. Documents: Aadhaar Card, Hostel/College Bonafide, Mother's Bank Account.
**Why it suits you:** Provides annual direct financial support of ₹10,000 to ₹20,000 per student to cover hostel boarding and mess food expenses.
**Deadline:** Check Official Portal
**Official Portal Link:** [AP JnanaBhumi Portal](https://jnanabhumi.ap.gov.in)

3.
**Scheme Name:** Andhra Pradesh Thalliki Vandanam Scheme
**Requirements:** School-going student in Class 1 to 12 in AP with min 75% attendance and White Ration Card. Documents: Aadhaar Card, Bonafide Study Certificate, Mother's Bank Account.
**Why it suits you:** ₹15,000 annual direct cash transfer credited into the mother's account to cover school and learning essentials.
**Deadline:** Check Official Portal
**Official Portal Link:** [AP JnanaBhumi Portal](https://jnanabhumi.ap.gov.in)`;
        } else {
          defaultReply = `Here are verified active State Government welfare schemes matching your profile:

1.
**Scheme Name:** Dr. NTR Vaidya Seva Cashless Universal Healthcare Scheme
**Requirements:** Resident of Andhra Pradesh with White Ration Card / BPL card or family income under ₹5 Lakh. Documents: Aadhaar Card, Rice Card.
**Why it suits you:** Covers cashless secondary and tertiary medical treatments up to ₹25 Lakh across 3,257 procedures statewide.
**Deadline:** Continuous Enrollment (Check Official Portal)
**Official Portal Link:** [Dr. NTR Vaidya Seva Portal](https://aarogyasri.ap.gov.in)

2.
**Scheme Name:** Andhra Pradesh Annadata Sukhibhava Farmer Investment Support
**Requirements:** Landholding and tenant farmers in Andhra Pradesh with verified land records. Documents: Aadhaar, Pattadar Passbook, Bank Account.
**Why it suits you:** Provides ₹20,000 per year direct income and seed input assistance directly into the farmer's bank account.
**Deadline:** Check Official Portal
**Official Portal Link:** [AP Agriculture Portal](https://apagrisnet.gov.in)`;
        }
      }

      return res.status(200).json({ reply: defaultReply });
    }

    const systemInstruction = `You are the official State Government Scheme & Scholarship Finder Agent ("Yojana Mitra AI").
Your role is to assist Indian citizens in discovering, checking eligibility, understanding required documents, and applying for active State Government welfare schemes and scholarships.

CITIZEN PROFILE CONTEXT:
${userProfile ? `- Name: ${userProfile.name || 'Citizen'}
- Age: ${userProfile.age || 'Not specified'} (${userProfile.gender || 'Not specified'})
- Marital Status: ${userProfile.maritalStatus || 'Single'}
- State/UT & District: ${userProfile.district ? `${userProfile.district}, ` : ''}${userProfile.state || 'Andhra Pradesh'} (${userProfile.areaType || 'Urban'} sector)
- Category: ${userProfile.category || 'General'}
- Annual Family Income: ₹${userProfile.annualFamilyIncome || 'Not specified'}
- Employment Status: ${userProfile.employmentStatus || 'Not specified'}
- Education: ${userProfile.highestEducation || 'Not specified'} (${userProfile.currentEducationStatus || ''})
- Student Status: ${userProfile.isStudent ? 'Yes' : 'No'}
- Farmer Status: ${userProfile.isFarmer ? 'Yes' : 'No'}
- Woman Entrepreneur / Self-Employed: ${userProfile.isWomanEntrepreneur ? 'Yes' : 'No'}
- Senior Citizen: ${userProfile.isSeniorCitizen ? 'Yes' : 'No'}
- BPL / EWS: ${userProfile.isBPLOrEWS ? 'Yes' : 'No'}
- PwD (Disability): ${userProfile.isDisability ? 'Yes' : 'No'}` : 'No citizen profile provided (general query).'}

${isTeluguRequested ? `CRITICAL MANDATORY DIRECTIVE - RESPOND ENTIRELY IN TELUGU (తెలుగు):
- You MUST answer the ENTIRE response in clear, natural, grammatically correct, and respectful Telugu (తెలుగు లిపి).
- DO NOT answer in English. All explanations, criteria, and document lists must be in Telugu.
- Structure all scheme recommendations strictly in TEXT FORMAT (DO NOT USE CARDS) using this numbered format:
1.
**పథకం పేరు (Scheme Name):** [అధికారిక రాష్ట్ర పథకం పేరు]
**అర్హతలు & అవసరమైన పత్రాలు (Requirements):** [అర్హత ప్రమాణాలు మరియు కావలసిన ధృవీకరణ పత్రాలు]
**మీకు ఎందుకు సరిపోతుంది (Why it suits you):** [మీ వయస్సు, విద్య, రాష్ట్రం లేదా కేటగిరీకి ఇది ఎలా సరిపోతుంది]
**గడువు తేదీ (Deadline):** [గడువు తేదీ లేదా 'Check Official Portal']
**అధికారిక పోర్టల్ లింక్ (Official Portal Link):** [అధికారిక రాష్ట్ర వెబ్‌సైట్ లింక్ (ఉదా. [జ్ఞానభూమి పోర్టల్](https://jnanabhumi.ap.gov.in))]` : `MANDATORY TEXT FORMAT (STRICTLY NO CARDS):
- Structure all scheme recommendations in pure text format directly in the chatbox, numbered sequentially:
1.
**Scheme Name:** [Official State Scheme Name]
**Requirements:** [Eligibility criteria & Required Documents]
**Why it suits you:** [Clear reason explaining why it suits the citizen's specific age, category, employment status, and income]
**Deadline:** [Active deadline date or 'Check Official Portal']
**Official Portal Link:** [Direct clickable official state government link e.g. [AP JnanaBhumi Portal](https://jnanabhumi.ap.gov.in)]`}

CORE DIRECTIVES:
1. ALWAYS DIRECTLY ANSWER THE CITIZEN'S SPECIFIC QUESTION OR QUERY:
   - Your primary duty is to directly, accurately, and thoroughly answer whatever the user asked (procedures, requirements, eligibility, certificates from MeeSeva, greetings, or questions).
   - Never ignore the user's question to dump an unrelated scheme list.
2. SCHEME RECOMMENDATION FORMAT (WHEN SCHEMES ARE REQUESTED):
   - When suggesting schemes, output them in clear text format:
   1.
   **Scheme Name:** [Official Scheme Name]
   **Requirements:** [Eligibility criteria & Required Documents]
   **Why it suits you:** [Clear reason explaining why it suits the citizen]
   **Deadline:** [Active deadline date or 'Check Official Portal']
   **Official Portal Link:** [Direct clickable official government link]

RULES:
1. FOCUS ON ANDHRA PRADESH STATE SCHEMES:
   - For Andhra Pradesh: Annadata Sukhibhava, Dr. NTR Vaidya Seva, NTR Bharosa, Thalliki Vandanam, Deepam 2.0, Maha Shakti, Yuva Galam, JnanaBhumi Vidya & Vasathi Deevena.
2. STRICT PROFILE RELEVANCE:
   - Only recommend schemes that strictly match the citizen's specified Employment/Student Status.
3. OFFICIAL PORTALS: Restrict factual verification strictly to official government portals (.gov.in, .nic.in).
4. NEVER invent deadlines. Mark "Check Official Portal" if unspecified.`;

    const contents = [];
    if (Array.isArray(history)) {
      history.forEach(h => {
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
      primaryModel: 'gemini-3.8-flash',
      fallbackModels: ['gemini-3.1-flash-lite', 'gemini-flash-latest'],
      contents,
      config: {
        systemInstruction,
      }
    });

    if (response?.text) {
      return res.status(200).json({ reply: response.text });
    }

    // If Gemini model response was empty or rate-limited, provide fallback
    const employmentStatus = userProfile?.employmentStatus || '';
    const isSenior = employmentStatus === 'Senior Citizen' || !!userProfile?.isSeniorCitizen;
    const isWoman = employmentStatus === 'Women' || !!userProfile?.isWomanEntrepreneur || (userProfile?.gender === 'female' && !isSenior);
    const studentQuery = /(student|scholarship|college|school|vidya|చదువు|విద్య|స్కాలర్‌షిప్)/i.test(message);
    
    let fallbackText = '';
    if (isSenior) {
      fallbackText = isTeluguRequested
        ? `మీ ప్రొఫైల్ వివరాల ఆధారంగా సీనియర్ సిటిజన్ల (Senior Citizens 60+) కోసం ప్రముఖ ప్రభుత్వ పథకాలు:\n\n1.\n**పథకం పేరు (Scheme Name):** ఆంధ్రప్రదేశ్ ఎన్టీఆర్ భరోసా వృద్ధాప్య పింఛను పథకం (AP NTR Bharosa Senior Citizen Pension)\n**అర్హతలు & అవసరమైన పత్రాలు (Requirements):** 60 ఏళ్లు నిండిన వృద్ధులు, తెల్ల రేషన్ కార్డు. పత్రాలు: ఆధార్ కార్డు, రైస్ కార్డ్, బ్యాంక్ ఖాతా.\n**మీకు ఎందుకు సరిపోతుంది (Why it suits you):** నెలకు ₹4,000 వృద్ధాప్య పింఛను ప్రతి నెలా 1వ తేదీన నేరుగా ఇంటి వద్దే అందుతుంది.\n**గడువు తేదీ (Deadline):** నిరంతరం అందుబాటులో ఉంటుంది (Check Official Portal)\n**అధికారిక పోర్టల్ లింక్ (Official Portal Link):** [AP SSPensions Portal](https://sspensions.ap.gov.in)`
        : `Here are verified active government schemes for Senior Citizens (60+ years):\n\n1.\n**Scheme Name:** Andhra Pradesh NTR Bharosa Senior Citizen Pension Scheme (Old Age Pension)\n**Requirements:** Resident of AP aged 60+ years, White Ration Card holder. Documents: Aadhaar Card, Rice Card, Bank Passbook.\n**Why it suits you:** Dedicated monthly pension of ₹4,000 delivered directly to your doorstep on the 1st of every month.\n**Deadline:** Continuous Enrollment (Check Official Portal)\n**Official Portal Link:** [AP SSPensions Portal](https://sspensions.ap.gov.in)`;
    } else if (isWoman) {
      fallbackText = isTeluguRequested
        ? `మీ ప్రొఫైల్ వివరాల ఆధారంగా మహిళల (Women) కోసం ప్రముఖ ప్రభుత్వ పథకాలు:\n\n1.\n**పథకం పేరు (Scheme Name):** ఆంధ్రప్రదేశ్ మహా శక్తి ఉచిత ఆర్టీసీ బస్సు ప్రయాణ పథకం (AP Maha Shakti Free Bus Travel for Women)\n**అర్హతలు & అవసరమైన పత్రాలు (Requirements):** ఆంధ్రప్రదేశ్ నివాసితులైన బాలికలు మరియు మహిళలందరూ. పత్రాలు: ఆధార్ కార్డు లేదా గుర్తింపు కార్డు.\n**మీకు ఎందుకు సరిపోతుంది (Why it suits you):** ఏపీఎస్ ఆర్టీసీ పల్లె వెలుగు, ఎక్స్‌ప్రెస్ బస్సులలో రాష్ట్రవ్యాప్తంగా 100% ఉచితంగా ప్రయాణించవచ్చు.\n**గడువు తేదీ (Deadline):** నిరంతరం అందుబాటులో ఉంటుంది (Check Official Portal)\n**అధికారిక పోర్టల్ లింక్ (Official Portal Link):** [APSRTC Official Portal](https://apsrtc.ap.gov.in)`
        : `Here are active government schemes tailored specifically for Women:\n\n1.\n**Scheme Name:** Andhra Pradesh Maha Shakti Scheme (Free RTC Bus Travel for Women)\n**Requirements:** All women and girls resident in AP. Documents: Aadhaar Card or recognised ID.\n**Why it suits you:** 100% free, zero-fare bus travel on all APSRTC Palle Velugu and Express buses statewide.\n**Deadline:** Continuous Enrollment (Check Official Portal)\n**Official Portal Link:** [APSRTC Official Portal](https://apsrtc.ap.gov.in)`;
    } else if (studentQuery) {
      fallbackText = isTeluguRequested
        ? `మీ ప్రొఫైల్ వివరాల ఆధారంగా విద్యార్థుల కోసం ధృవీకరించబడిన ప్రముఖ రాష్ట్ర సంక్షేమ పథకాలు:\n\n1.\n**పథకం పేరు (Scheme Name):** ఆంధ్రప్రదేశ్ జగనన్న విద్యా దీవెన - పూర్తి ఫీజు రీయింబర్స్‌మెంట్ (Jagananna Vidya Deevena)\n**అర్హతలు & అవసరమైన పత్రాలు (Requirements):** ఐటీఐ, పాలిటెక్నిక్, డిగ్రీ, ఇంజనీరింగ్ లేదా పీజీ రెగ్యులర్ విద్యార్థులు, వార్షిక కుటుంబ ఆదాయం ₹2.5 లక్షల లోపు. పత్రాలు: ఆధార్ కార్డు, ఆదాయ ధృవీకరణ పత్రం, కాలేజ్ అడ్మిషన్ రసీదు, తల్లి బ్యాంకు పాస్‌బుక్.\n**మీకు ఎందుకు సరిపోతుంది (Why it suits you):** పూర్తి కళాశాల ట్యూషన్ ఫీజు 100% రీయింబర్స్‌మెంట్ రూపంలో ప్రభుత్వం నేరుగా మీ తల్లి ఖాతాలో జమ చేస్తుంది.\n**గడువు తేదీ (Deadline):** Check Official Portal\n**అధికారిక పోర్టల్ లింక్ (Official Portal Link):** [జ్ఞానభూమి పోర్టల్](https://jnanabhumi.ap.gov.in)`
        : `Here are active State Government schemes and scholarships matching your query:\n\n1.\n**Scheme Name:** Andhra Pradesh Jagananna Vidya Deevena (Full Tuition Fee Reimbursement)\n**Requirements:** Regular students admitted to ITI, Polytechnic, Degree, Engineering, or PG courses in AP, Annual family income under ₹2.5 Lakh. Documents: Aadhaar Card, Income Certificate / White Ration Card, College Bonafide, Mother's Bank Account.\n**Why it suits you:** Full 100% college tuition fee paid directly into the student's mother's bank account in quarterly installments.\n**Deadline:** Check Official Portal\n**Official Portal Link:** [AP JnanaBhumi Portal](https://jnanabhumi.ap.gov.in)`;
    } else {
      fallbackText = isTeluguRequested
        ? `మీ ప్రొఫైల్ వివరాల ఆధారంగా ధృవీకరించబడిన ప్రముఖ రాష్ట్ర ప్రభుత్వ సంక్షేమ పథకాలు:\n\n1.\n**పథకం పేరు (Scheme Name):** డాక్టర్ ఎన్టీఆర్ వైద్య సేవ ఆరోగ్య భద్రత పథకం (Dr. NTR Vaidya Seva)\n**అర్హతలు & అవసరమైన పత్రాలు (Requirements):** ఏపీ నివాసితులు, వార్షిక కుటుంబ ఆదాయం ₹5 లక్షల లోపు లేదా రైస్ కార్డ్. పత్రాలు: ఆధార్ కార్డు, రేషన్ కార్డు.\n**మీకు ఎందుకు సరిపోతుంది (Why it suits you):** ప్రతి కుటుంబానికి సంవత్సరానికి ₹25 లక్షల వరకు పూర్తి నగదు రహిత ఆసుపత్రి చికిత్స లభిస్తుంది.\n**గడువు తేదీ (Deadline):** Check Official Portal\n**అధికారిక పోర్టల్ లింక్ (Official Portal Link):** [ఎన్టీఆర్ వైద్య సేవ పోర్టల్](https://aarogyasri.ap.gov.in)`
        : `Here are active State Government welfare schemes matching your profile:\n\n1.\n**Scheme Name:** Dr. NTR Vaidya Seva Cashless Universal Healthcare Scheme\n**Requirements:** Resident of Andhra Pradesh with White Ration Card / BPL card or family income under ₹5 Lakh. Documents: Aadhaar Card, Rice Card.\n**Why it suits you:** 100% cashless medical treatments up to ₹25 Lakh across 3,257 procedures statewide.\n**Deadline:** Continuous Enrollment (Check Official Portal)\n**Official Portal Link:** [Dr. NTR Vaidya Seva Portal](https://aarogyasri.ap.gov.in)`;
    }

    return res.status(200).json({ reply: fallbackText });
  } catch (err) {
    console.error('Error in /api/ai/chat handler:', err);
    return res.status(200).json({
      reply: `Here are active State Government schemes and scholarships matching your profile:

1.
**Scheme Name:** Andhra Pradesh Jagananna Vidya Deevena (Full Tuition Fee Reimbursement)
**Requirements:** Regular students in ITI, Polytechnic, Degree, Engineering, or PG courses in AP, Annual income under ₹2.5 Lakh. Documents: Aadhaar Card, Income Certificate / White Ration Card, Mother's Bank Account.
**Why it suits you:** Full 100% college tuition fee credited directly into the student's mother's bank account.
**Deadline:** Check Official Portal
**Official Portal Link:** [AP JnanaBhumi Portal](https://jnanabhumi.ap.gov.in)`
    });
  }
}
