import { Scheme } from '../types';

export const STATE_SCHEMES: Scheme[] = [
  // ===================== ANDHRA PRADESH =====================
  {
    id: 'ap-annadata-sukhibhava',
    name: 'Andhra Pradesh Annadata Sukhibhava - PM KISAN Scheme',
    slug: 'ap-annadata-sukhibhava',
    shortDescription: 'Annual financial support of ₹20,000 per farmer family in Andhra Pradesh (integrating ₹6,000 PM-KISAN + ₹14,000 AP State Assistance).',
    description: 'Flagship farmer welfare initiative launched by the Government of Andhra Pradesh (formerly YSR Rythu Bharosa) providing ₹20,000 annual financial aid directly to farmer bank accounts to cover seed, fertilizer, and crop cultivation expenses.',
    category: 'Agriculture',
    state: 'Andhra Pradesh',
    governmentLevel: 'State',
    department: 'Department of Agriculture & Cooperation, Government of Andhra Pradesh',
    financialBenefitAmount: '₹20,000 per year (₹14,000 State + ₹6,000 PM-KISAN DBT)',
    benefits: [
      '₹20,000 annual direct cash transfer credited into farmer bank accounts in three seasonal installments',
      'Extends coverage to both landholding farmers and tenant farmers holding CCRC cards',
      'Free 9-hour daytime agricultural power supply and crop insurance protection'
    ],
    eligibility: [
      'Farmer resident of Andhra Pradesh owning agricultural land or recognized tenant cultivator',
      'Tenant farmers holding valid Crop Cultivator Rights Card (CCRC)',
      'Registered on e-Crop portal with active Aadhaar DBT bank account'
    ],
    eligibilityRules: {
      minAge: 18,
      maxAge: 100,
      states: ['Andhra Pradesh'],
      requiresFarmer: true
    },
    requiredDocuments: [
      'Pattadar Passbook / 1B Land record title',
      'Crop Cultivator Rights Card (CCRC) for tenant cultivators',
      'Aadhaar Card and Aadhaar-seeded Bank Passbook'
    ],
    applicationProcess: [
      'Farmer registration through Rythu Seva Kendras / Village Secretariats',
      'Social audit and verification via e-Crop and Navasakam portal',
      'Direct DBT credit into beneficiary bank account'
    ],
    deadline: 'Open Year Round',
    deadlineDate: '2026-12-31',
    isDeadlineApproaching: false,
    officialWebsite: 'https://navasakam2.apcfss.in',
    officialSource: 'Government of Andhra Pradesh, Agriculture Department',
    lastUpdated: 'August 2026',
    tags: ['andhra pradesh', 'ap', 'annadata sukhibhava', 'farmer', 'rythu bharosa', 'agriculture', 'dbt', 'super six'],
    targetEmploymentStatuses: ['Farmer']
  },
  {
    id: 'ap-ntr-vaidya-seva',
    name: 'Dr. NTR Vaidya Seva Universal Health Scheme',
    slug: 'ap-ntr-vaidya-seva',
    shortDescription: 'Cashless medical treatment up to ₹25,00,000 per family per year in empanelled corporate and government hospitals across AP and major cities.',
    description: 'Dr. NTR Vaidya Seva (formerly Dr. YSR Aarogyasri) provides 100% cashless hospitalization up to ₹25 Lakhs per family annually covering 3,257 medical, surgical, oncology, and transplant procedures in network hospitals across Andhra Pradesh, Hyderabad, Bengaluru, and Chennai.',
    category: 'Healthcare',
    state: 'Andhra Pradesh',
    governmentLevel: 'State',
    department: 'Dr. NTR Vaidya Seva Trust, Government of Andhra Pradesh',
    financialBenefitAmount: '₹25,00,000 Cashless Hospitalization per family per year + Post-operative recovery allowance',
    benefits: [
      'Complete cashless hospital coverage up to ₹25,00,000 for 3,257 notified medical procedures',
      'Aarogya Aasara post-operative recuperative financial allowance of up to ₹5,000 per month',
      'Access to top multi-specialty network hospitals in AP, Hyderabad, Bengaluru, and Chennai'
    ],
    eligibility: [
      'Resident families of Andhra Pradesh with annual family income under ₹5 Lakhs',
      'Holding AP Rice Card (White Ration Card) or NTR Vaidya Seva Health Card'
    ],
    eligibilityRules: {
      minAge: 0,
      maxAge: 100,
      states: ['Andhra Pradesh'],
      maxIncome: 500000
    },
    requiredDocuments: [
      'Aadhaar Card of patient',
      'AP Rice Card / NTR Vaidya Seva Card',
      'Medical prescription or referral from government hospital/empanelled centre'
    ],
    applicationProcess: [
      'Visit any empanelled network hospital in AP, Hyderabad, Bengaluru, or Chennai',
      'Approach Vaidya Seva Mithra at the hospital helpdesk',
      'Instant electronic pre-authorization and free cashless admission'
    ],
    deadline: 'Open Year Round',
    deadlineDate: '2026-12-31',
    isDeadlineApproaching: false,
    officialWebsite: 'https://aarogyasri.ap.gov.in',
    officialSource: 'Dr. NTR Vaidya Seva Trust, Government of Andhra Pradesh',
    lastUpdated: 'August 2026',
    tags: ['andhra pradesh', 'ap', 'ntr vaidya seva', 'healthcare', 'aarogyasri', 'cashless hospital', 'health card']
  },
  {
    id: 'ap-thalliki-vandanam',
    name: 'Andhra Pradesh Thalliki Vandanam Scheme',
    slug: 'ap-thalliki-vandanam',
    shortDescription: 'Annual financial incentive of ₹15,000 for every school-going child deposited directly into the mother’s bank account under the Super Six initiative.',
    description: 'Thalliki Vandanam is an education incentive scheme under the Andhra Pradesh Super Six welfare package (restructured from the earlier Amma Vodi) that provides ₹15,000 per year per student to the mother’s account for all eligible school-going children in the household.',
    category: 'Scholarships',
    state: 'Andhra Pradesh',
    governmentLevel: 'State',
    department: 'School Education Department, Government of Andhra Pradesh',
    financialBenefitAmount: '₹15,000 per school-going child per year',
    benefits: [
      '₹15,000 direct benefit transfer credited into the mother’s Aadhaar-linked bank account',
      'Applicable to all school-going children from Class 1 to 12 in the family',
      'Supports school fees, uniform, stationery, and nutritional requirements'
    ],
    eligibility: [
      'Mother or recognized guardian of student studying in Class 1 to Intermediate (12th)',
      'Permanent resident of Andhra Pradesh',
      'Enrolled in recognized government, aided, or private schools/colleges',
      'Family annual income under ₹2.5 Lakhs (holding Rice Card)'
    ],
    eligibilityRules: {
      minAge: 5,
      maxAge: 19,
      states: ['Andhra Pradesh'],
      maxIncome: 250000,
      requiresStudent: true
    },
    requiredDocuments: [
      'Aadhaar Card of student and mother',
      'White Ration Card / AP Rice Card',
      'School Bonafide / Student Information System (UDISE) record',
      'Mother’s Bank Account Passbook'
    ],
    applicationProcess: [
      'School Headmaster verifies student enrollment and attendance on Child Info portal',
      'Village / Ward Sachivalayam conducts social audit verification',
      'Direct DBT credit by Andhra Pradesh Government into mother’s bank account'
    ],
    deadline: '31 October 2026',
    deadlineDate: '2026-10-31',
    isDeadlineApproaching: false,
    officialWebsite: 'https://jnanabhumi.ap.gov.in',
    officialSource: 'Department of School Education, Government of Andhra Pradesh',
    lastUpdated: 'August 2026',
    tags: ['andhra pradesh', 'ap', 'thalliki vandanam', 'amma vodi', 'education', 'school grant', 'super six']
  },
  // --- AP WOMEN SCHEMES ---
  {
    id: 'ap-maha-shakti-free-bus',
    name: 'Andhra Pradesh Maha Shakti Scheme (Free RTC Bus Travel for Women)',
    slug: 'ap-maha-shakti-free-bus',
    shortDescription: '100% free bus travel for all women and girls across Andhra Pradesh on APSRTC Palle Velugu, Ultra Palle Velugu, and Express buses under the Super Six package.',
    description: 'The Maha Shakti Free RTC Bus Travel Scheme is a hallmark initiative under the Andhra Pradesh Super Six welfare guarantees enacted by the NDA/TDP coalition government. It ensures safe, barrier-free, and completely zero-cost public transit for every girl child, student, working woman, and homemaker across the entire APSRTC bus network.',
    category: 'Women',
    state: 'Andhra Pradesh',
    governmentLevel: 'State',
    department: 'APSRTC & Transport Department, Government of Andhra Pradesh',
    financialBenefitAmount: '100% Free Public Transport on APSRTC Buses Statewide (Zero Fare)',
    benefits: [
      'Zero-fare travel across all APSRTC Palle Velugu, Express, and City Ordinary bus routes across Andhra Pradesh',
      'No monthly ceiling on number of journeys or distance traveled within the state borders',
      'Significant financial savings of ₹1,200 to ₹3,000 monthly for working women, vendors, and students'
    ],
    eligibility: [
      'All women, girls, and transgender persons of any age residing in Andhra Pradesh',
      'Production of valid photo identity / Aadhaar Card establishing AP domicile or identity'
    ],
    eligibilityRules: {
      minAge: 5,
      maxAge: 100,
      states: ['Andhra Pradesh'],
      genders: ['female']
    },
    requiredDocuments: [
      'Aadhaar Card or AP Residence Proof / Voter ID / Student ID for age verification'
    ],
    applicationProcess: [
      'Board any APSRTC Palle Velugu or Express bus within Andhra Pradesh',
      'Present Aadhaar or recognized photo ID card to the bus conductor',
      'Receive a Zero-Fare Passenger Ticket instantly with no out-of-pocket payment'
    ],
    deadline: 'Open Year Round',
    deadlineDate: '2026-12-31',
    isDeadlineApproaching: false,
    officialWebsite: 'https://apsrtc.ap.gov.in',
    officialSource: 'Andhra Pradesh State Road Transport Corporation (APSRTC)',
    lastUpdated: 'August 2026',
    tags: ['andhra pradesh', 'ap', 'maha shakti', 'women', 'free bus', 'apsrtc', 'super six'],
    targetEmploymentStatuses: ['Women']
  },
  {
    id: 'ap-maha-shakti-aadabidda-nidhi',
    name: 'Andhra Pradesh Maha Shakti Aadabidda Nidhi Scheme',
    slug: 'ap-maha-shakti-aadabidda-nidhi',
    shortDescription: 'Direct financial assistance of ₹1,500 per month (₹18,000 per year) deposited directly into the bank accounts of women aged 18 to 59 years in Andhra Pradesh.',
    description: 'Under the Super Six welfare framework, Aadabidda Nidhi provides a direct monthly allowance of ₹1,500 into the Aadhaar-seeded bank account of every adult woman resident in Andhra Pradesh between the ages of 18 and 59, securing basic economic autonomy and nutrition security.',
    category: 'Women',
    state: 'Andhra Pradesh',
    governmentLevel: 'State',
    department: 'Department of Women, Children, Disabled and Senior Citizens, Government of Andhra Pradesh',
    financialBenefitAmount: '₹1,500 per month (₹18,000 per year) DBT Direct Cash Transfer',
    benefits: [
      '₹1,500 monthly unconditional financial transfer credited directly into beneficiary bank account',
      '₹18,000 annual guaranteed financial safety net for women homemakers and informal workers',
      'Enhances household nutrition, healthcare independence, and emergency financial resilience'
    ],
    eligibility: [
      'Woman resident of Andhra Pradesh aged between 18 and 59 years',
      'Holding active AP White Ration Card (Rice Card)',
      'Aadhaar-seeded bank account enabled for NPCI DBT credit'
    ],
    eligibilityRules: {
      minAge: 18,
      maxAge: 59,
      states: ['Andhra Pradesh'],
      genders: ['female'],
      maxIncome: 250000
    },
    requiredDocuments: [
      'Aadhaar Card of the woman applicant',
      'AP Rice Card / Ration Card',
      'Bank Account Passbook showing Aadhaar linkage',
      'Income Certificate (or Rice Card valid as income proof)'
    ],
    applicationProcess: [
      'Submit application at nearest Village / Ward Sachivalayam or online via GSWS portal',
      'Field verification by Village Social Welfare Assistant',
      'Monthly DBT credit disbursed directly on the specified DBT day each month'
    ],
    deadline: 'Open Year Round',
    deadlineDate: '2026-12-31',
    isDeadlineApproaching: false,
    officialWebsite: 'https://navasakam2.apcfss.in',
    officialSource: 'Department of Women Development and Child Welfare, Government of Andhra Pradesh',
    lastUpdated: 'August 2026',
    tags: ['andhra pradesh', 'ap', 'aadabidda nidhi', 'maha shakti', 'women', 'financial aid', 'super six', 'dbt'],
    targetEmploymentStatuses: ['Women']
  },
  {
    id: 'ap-deepam-2-gas-scheme',
    name: 'Andhra Pradesh Deepam 2.0 Scheme (3 Free LPG Cylinders)',
    slug: 'ap-deepam-2-gas-scheme',
    shortDescription: 'Free 3 domestic LPG cooking gas cylinder refills per year through 100% DBT subsidy reimbursement for women heads of households under the Super Six package.',
    description: 'Launched by the Government of Andhra Pradesh under the Super Six initiative, Deepam 2.0 provides 3 free domestic LPG cylinders annually (one cylinder every 4 months) through 100% full DBT subsidy reimbursement credited directly into the bank accounts of women heads of BPL families.',
    category: 'Women',
    state: 'Andhra Pradesh',
    governmentLevel: 'State',
    department: 'Civil Supplies & Consumer Affairs Department, Government of Andhra Pradesh',
    financialBenefitAmount: '3 Free Domestic LPG Gas Cylinders per year (100% Full Cost DBT Reimbursement)',
    benefits: [
      '3 free domestic LPG cylinder refills provided per household per year (approx. ₹2,600+ annual benefit)',
      '100% subsidy reimbursement credited into the woman’s bank account within 48 hours of gas delivery',
      'Eliminates biomass smoke, protecting maternal and infant respiratory health'
    ],
    eligibility: [
      'Permanent female resident of Andhra Pradesh',
      'Holding valid AP White Ration Card / Rice Card',
      'Active domestic LPG connection in the name of a female family member'
    ],
    eligibilityRules: {
      minAge: 18,
      maxAge: 85,
      states: ['Andhra Pradesh'],
      genders: ['female'],
      maxIncome: 250000
    },
    requiredDocuments: [
      'Aadhaar Card of woman LPG consumer',
      'AP Rice Card / Ration Card',
      'LPG Connection Consumer Passbook (HPCL, BPCL, or IOCL)',
      'Aadhaar-seeded Bank Account'
    ],
    applicationProcess: [
      'Ensure Aadhaar and Rice Card are linked with your local LPG gas distributor',
      'Book standard domestic cylinder refill through agency, WhatsApp, or IVRS',
      'Full refill price is refunded automatically via DBT within 48 hours of delivery'
    ],
    deadline: 'Open Year Round',
    deadlineDate: '2026-12-31',
    isDeadlineApproaching: false,
    officialWebsite: 'https://spandana.ap.gov.in',
    officialSource: 'Civil Supplies Department, Government of Andhra Pradesh',
    lastUpdated: 'August 2026',
    tags: ['andhra pradesh', 'ap', 'deepam scheme', 'lpg gas', 'free cylinder', 'super six', 'women'],
    targetEmploymentStatuses: ['Women']
  },
  {
    id: 'ap-ysr-cheyutha-women',
    name: 'Andhra Pradesh YSR Cheyutha & Stree Nidhi Livelihood Scheme',
    slug: 'ap-ysr-cheyutha-women',
    shortDescription: 'Financial assistance of ₹18,750 per year (Total ₹75,000 over 4 years) for women aged 45–60 years from SC, ST, BC, and Minority communities to set up sustainable micro-enterprises.',
    description: 'YSR Cheyutha provides ₹18,750 per year for 4 consecutive years (totaling ₹75,000) directly to women between 45 and 60 years of age belonging to underprivileged SC, ST, BC, and Minority communities. In partnership with corporates like Amul, ITC, and HUL, the scheme facilitates dairy units, grocery stores, and poultry farming.',
    category: 'Women',
    state: 'Andhra Pradesh',
    governmentLevel: 'State',
    department: 'Department of Social Welfare & SERP, Government of Andhra Pradesh',
    financialBenefitAmount: '₹18,750 per year (Total ₹75,000 over 4 years) Direct Grant',
    benefits: [
      '₹18,750 annual grant transferred into the beneficiary’s bank account for 4 years',
      'Technical tie-ups with Amul, ITC, Procter & Gamble, and Reliance for wholesale supplies and buybacks',
      'Enables independent livelihood in cattle farming, retail stores, food processing, and tailoring'
    ],
    eligibility: [
      'Woman resident of Andhra Pradesh aged between 45 and 60 years',
      'Belonging to SC, ST, BC, or Minority communities',
      'Holding AP Rice Card with total family income under ₹1.44 Lakh (Rural) or ₹1.20 Lakh (Urban)'
    ],
    eligibilityRules: {
      minAge: 45,
      maxAge: 60,
      states: ['Andhra Pradesh'],
      genders: ['female'],
      maxIncome: 144000
    },
    requiredDocuments: [
      'Aadhaar Card of the woman applicant',
      'Caste and Integrated Community Certificate (SC/ST/BC/Minority)',
      'AP Rice Card / Income Certificate',
      'Aadhaar-seeded Bank Account Passbook'
    ],
    applicationProcess: [
      'Apply at your Village / Ward Secretariat (Sachivalayam) through the Welfare Assistant',
      'Verification of caste, age, and socioeconomic parameters through Navasakam',
      'DBT disbursement credited into bank account'
    ],
    deadline: 'Open Year Round',
    deadlineDate: '2026-12-31',
    isDeadlineApproaching: false,
    officialWebsite: 'https://navasakam2.apcfss.in',
    officialSource: 'Society for Elimination of Rural Poverty (SERP), Andhra Pradesh',
    lastUpdated: 'August 2026',
    tags: ['andhra pradesh', 'ap', 'cheyutha', 'women', 'livelihood', 'stree nidhi', 'micro enterprise'],
    targetEmploymentStatuses: ['Women']
  },
  {
    id: 'ap-kalyana-masthu',
    name: 'Andhra Pradesh YSR Kalyana Masthu & Shaadi Mubarak Scheme',
    slug: 'ap-kalyana-masthu',
    shortDescription: 'One-time financial marriage grant of up to ₹1,00,000 for poor brides from SC, ST, BC, and Minority communities with mandatory 10th pass qualification.',
    description: 'YSR Kalyana Masthu (and Shaadi Mubarak for Minorities) provides financial assistance up to ₹1,00,000 to impoverished brides from SC, ST, BC, Minority, and disabled families. To encourage education and eradicate child marriage, both the bride and groom must be at least 18 and 21 years old respectively, and both must have passed Class 10th (SSC).',
    category: 'Women',
    state: 'Andhra Pradesh',
    governmentLevel: 'State',
    department: 'Social Welfare & Minority Welfare Departments, Government of Andhra Pradesh',
    financialBenefitAmount: '₹1,00,000 (SC/ST/Minority) | ₹50,000 (BC) | ₹1,50,000 (Differently Abled)',
    benefits: [
      'Direct DBT credit of up to ₹1,00,000 directly into the bride’s bank account post-marriage',
      'Promotes educational attainment by requiring minimum Class 10th pass for bride and groom',
      'Provides financial independence to newlywed women in setting up home or small enterprise'
    ],
    eligibility: [
      'Bride must be a permanent resident of Andhra Pradesh',
      'Minimum age of 18 years for bride and 21 years for groom at the time of marriage',
      'Both bride and groom must have passed 10th Class (SSC)',
      'Total annual family income must be within BPL limits (Rice Card holder)'
    ],
    eligibilityRules: {
      minAge: 18,
      maxAge: 45,
      states: ['Andhra Pradesh'],
      genders: ['female'],
      maxIncome: 144000
    },
    requiredDocuments: [
      'Bride and Groom Aadhaar Cards',
      'Class 10th SSC Passing Certificates of bride and groom',
      'Marriage Certificate or Marriage Registration Acknowledgement',
      'Caste Certificate and Rice Card'
    ],
    applicationProcess: [
      'Apply at Village / Ward Sachivalayam or Navasakam portal within 60 days of marriage',
      'Joint physical verification by Village Welfare & Education Assistant',
      'Grant disbursed directly into the bride’s bank account'
    ],
    deadline: 'Open Year Round',
    deadlineDate: '2026-12-31',
    isDeadlineApproaching: false,
    officialWebsite: 'https://navasakam2.apcfss.in',
    officialSource: 'Social Welfare Department, Government of Andhra Pradesh',
    lastUpdated: 'August 2026',
    tags: ['andhra pradesh', 'ap', 'kalyana masthu', 'shaadi mubarak', 'women', 'marriage aid'],
    targetEmploymentStatuses: ['Women']
  },

  // --- AP SENIOR CITIZEN SCHEMES ---
  {
    id: 'ap-ntr-bharosa-pension',
    name: 'Andhra Pradesh NTR Bharosa Senior Citizen Pension Scheme (Old Age Pension)',
    slug: 'ap-ntr-bharosa-pension',
    shortDescription: 'Enhanced monthly old age pension of ₹4,000 delivered directly at the doorstep on the 1st of every month for senior citizens aged 60+ in Andhra Pradesh.',
    description: 'Under the TDP/NDA coalition government and the Super Six guarantees, the flagship NTR Bharosa Pension (formerly YSR Pension Kanuka) was enhanced from ₹3,000 to ₹4,000 per month for senior citizens aged 60 years and above. The pension is disbursed punctually on the 1st day of every month directly at the elderly citizen’s doorstep by Village/Ward Secretariat volunteers.',
    category: 'Pension',
    state: 'Andhra Pradesh',
    governmentLevel: 'State',
    department: 'Department of Social Welfare & SERP, Government of Andhra Pradesh',
    financialBenefitAmount: '₹4,000 per month delivered directly at the doorstep on 1st of every month',
    benefits: [
      '₹4,000 monthly pension delivered in cash at the senior citizen’s doorstep on the 1st of each month',
      'Doorstep biometric authentication or facial recognition so elderly citizens do not need to visit banks or stand in lines',
      'Guaranteed lifelong economic security and dignity for senior citizens'
    ],
    eligibility: [
      'Resident of Andhra Pradesh aged 60 years or above',
      'Holding valid White Ration Card / AP Rice Card',
      'Total family income under ₹1.44 Lakh per annum (Rural) or ₹1.20 Lakh (Urban)',
      'Not a government employee or receiving government service pension'
    ],
    eligibilityRules: {
      minAge: 60,
      maxAge: 105,
      states: ['Andhra Pradesh'],
      requiresSeniorCitizen: true,
      maxIncome: 144000
    },
    requiredDocuments: [
      'Aadhaar Card of senior citizen (verifying age 60+)',
      'White Ration Card / AP Rice Card',
      'Voter Identity Card / Age proof certificate',
      'Bank Account Passbook (optional, for DBT mode)'
    ],
    applicationProcess: [
      'Submit application at nearest Village / Ward Sachivalayam (Gram/Ward Secretariat)',
      'Field verification and social audit by Welfare and Education Assistant',
      'Sanction card issued with monthly doorstep delivery starting on next 1st of month'
    ],
    deadline: 'Open Year Round',
    deadlineDate: '2026-12-31',
    isDeadlineApproaching: false,
    officialWebsite: 'https://sspensions.ap.gov.in',
    officialSource: 'Society for Elimination of Rural Poverty (SERP), Government of Andhra Pradesh',
    lastUpdated: 'August 2026',
    tags: ['andhra pradesh', 'ap', 'ntr bharosa', 'pension', 'senior citizen', 'old age pension', 'super six'],
    targetEmploymentStatuses: ['Senior Citizen']
  },
  {
    id: 'ap-senior-geriatric-vaidya-seva',
    name: 'Dr. NTR Vaidya Seva Geriatric & Senior Citizen Healthcare Support',
    slug: 'ap-senior-geriatric-vaidya-seva',
    shortDescription: '100% cashless hospitalization up to ₹25,00,000 for elderly citizens covering knee/hip replacements, cardiac stents, oncology, and Aarogya Aasara post-op allowance of ₹5,000/month.',
    description: 'Dr. NTR Vaidya Seva offers dedicated priority coverage for senior citizens aged 60+, providing completely cashless treatment up to ₹25,00,000 per family per year across 3,257 surgical, medical, and geriatric procedures. In addition, elderly patients undergoing surgery receive the Aarogya Aasara post-operative recovery allowance of up to ₹5,000 per month during bedrest.',
    category: 'Healthcare',
    state: 'Andhra Pradesh',
    governmentLevel: 'State',
    department: 'Dr. NTR Vaidya Seva Trust, Government of Andhra Pradesh',
    financialBenefitAmount: '₹25,00,000 Cashless Hospital Treatment + ₹5,000/month Aarogya Aasara Recovery Allowance',
    benefits: [
      'Cashless coverage up to ₹25,00,000 for cardiac surgeries, cataract surgeries, orthopedic knee/hip implants, dialysis, and cancer treatments',
      'Post-operative recuperative financial support (Aarogya Aasara) up to ₹5,000/month deposited directly into the senior citizen’s bank account',
      'Dedicated Vaidya Seva Mithra helpdesks providing priority wheelchair access and admission for elderly patients'
    ],
    eligibility: [
      'Senior citizen resident of Andhra Pradesh aged 60 years or above',
      'Holding AP Rice Card (White Ration Card) or NTR Vaidya Seva Card',
      'Family income within eligible ceiling (under ₹5 Lakhs per annum)'
    ],
    eligibilityRules: {
      minAge: 60,
      maxAge: 105,
      states: ['Andhra Pradesh'],
      requiresSeniorCitizen: true,
      maxIncome: 500000
    },
    requiredDocuments: [
      'Aadhaar Card of senior citizen',
      'AP Rice Card / NTR Vaidya Seva Health Card',
      'Doctor referral or medical diagnosis from government/empanelled hospital'
    ],
    applicationProcess: [
      'Visit any empanelled corporate or government hospital in AP, Hyderabad, Bengaluru, or Chennai',
      'Meet the Vaidya Seva Mithra at the hospital reception',
      'Instant electronic pre-authorization and free admission with zero out-of-pocket costs'
    ],
    deadline: 'Open Year Round',
    deadlineDate: '2026-12-31',
    isDeadlineApproaching: false,
    officialWebsite: 'https://aarogyasri.ap.gov.in',
    officialSource: 'Dr. NTR Vaidya Seva Trust, Government of Andhra Pradesh',
    lastUpdated: 'August 2026',
    tags: ['andhra pradesh', 'ap', 'ntr vaidya seva', 'senior citizen', 'geriatric', 'healthcare', 'aarogya aasara'],
    targetEmploymentStatuses: ['Senior Citizen']
  },
  {
    id: 'ap-vayo-vandana-assistive-devices',
    name: 'Andhra Pradesh Vayo Vandana Senior Citizen Assistive Devices Scheme',
    slug: 'ap-vayo-vandana-assistive-devices',
    shortDescription: 'Free distribution of physical assisted-living devices (hearing aids, spectacles, wheelchairs, tripod walking sticks, and artificial dentures) for low-income senior citizens.',
    description: 'The Andhra Pradesh Vayo Vandana Scheme, administered in coordination with the Senior Citizens Welfare Board and ALIMCO, organizes statewide assessment camps across all districts of Andhra Pradesh to distribute free high-grade assistive devices and walking aids to senior citizens aged 60 and above living below the poverty line.',
    category: 'Social Security',
    state: 'Andhra Pradesh',
    governmentLevel: 'State',
    department: 'Department for Empowerment of Senior Citizens, Government of Andhra Pradesh & ALIMCO',
    financialBenefitAmount: '100% Free Assisted Living Aids (Valued up to ₹25,000 per beneficiary)',
    benefits: [
      'Free distribution of digital hearing aids, motorized/standard wheelchairs, folding walkers, tripod canes, and spectacles',
      'Free dental screening and custom-fitted artificial dentures for elderly citizens',
      'Restores independent physical mobility, social communication, and quality of life'
    ],
    eligibility: [
      'Senior citizen resident of Andhra Pradesh aged 60 years or above',
      'Holding AP White Ration Card (Rice Card) or family income under ₹1.8 Lakh per annum',
      'Suffering from age-related hearing, vision, or locomotor impairment certified at camp'
    ],
    eligibilityRules: {
      minAge: 60,
      maxAge: 105,
      states: ['Andhra Pradesh'],
      requiresSeniorCitizen: true,
      maxIncome: 180000
    },
    requiredDocuments: [
      'Aadhaar Card proving age 60+',
      'AP Rice Card / Income Certificate',
      'Passport size photograph'
    ],
    applicationProcess: [
      'Attend the designated Vayo Vandana screening camp organized at Mandal / Municipality headquarters',
      'Undergo free clinical assessment by ALIMCO and medical specialists',
      'Receive customized assistive equipment on the spot or during the distribution ceremony'
    ],
    deadline: 'Open Year Round',
    deadlineDate: '2026-12-31',
    isDeadlineApproaching: false,
    officialWebsite: 'https://navasakam2.apcfss.in',
    officialSource: 'Welfare of Senior Citizens Department, Government of Andhra Pradesh',
    lastUpdated: 'August 2026',
    tags: ['andhra pradesh', 'ap', 'vayo vandana', 'senior citizen', 'assistive devices', 'hearing aid', 'wheelchair'],
    targetEmploymentStatuses: ['Senior Citizen']
  },
  {
    id: 'ap-senior-citizen-apsrtc-concession',
    name: 'Andhra Pradesh Senior Citizen APSRTC Bus Concession & Vrudhula Card',
    slug: 'ap-senior-citizen-apsrtc-concession',
    shortDescription: '25% fare concession on APSRTC express and rural buses, reserved senior seating, and priority healthcare queues for citizens aged 60+ across Andhra Pradesh.',
    description: 'APSRTC provides a 25% fare concession for all senior citizens aged 60 and above traveling on state-run APSRTC buses throughout Andhra Pradesh. In addition, the Vrudhula Card facilitates express queue services at MeeSeva centers, government hospitals, and district welfare offices.',
    category: 'Social Security',
    state: 'Andhra Pradesh',
    governmentLevel: 'State',
    department: 'APSRTC & Transport Department, Government of Andhra Pradesh',
    financialBenefitAmount: '25% Travel Concession on APSRTC Buses + Dedicated Senior Counters',
    benefits: [
      '25% discount on passenger fare on Palle Velugu, Express, Deluxe, and Super Luxury APSRTC buses',
      'Specially earmarked reserved seats in front rows of all state buses',
      'Priority queue privileges at government outpatient departments (OPD) and MeeSeva citizen centers'
    ],
    eligibility: [
      'Resident of Andhra Pradesh aged 60 years or older',
      'Any gender residing in Andhra Pradesh'
    ],
    eligibilityRules: {
      minAge: 60,
      maxAge: 105,
      states: ['Andhra Pradesh'],
      requiresSeniorCitizen: true
    },
    requiredDocuments: [
      'Aadhaar Card or Voter ID proving age 60 years or above',
      'Passport size photograph'
    ],
    applicationProcess: [
      'Present Aadhaar Card directly at any APSRTC bus ticketing counter or bus conductor during boarding',
      'Receive 25% discounted senior passenger ticket instantly',
      'Optionally obtain laminated APSRTC Senior Citizen ID card at main bus stations'
    ],
    deadline: 'Open Year Round',
    deadlineDate: '2026-12-31',
    isDeadlineApproaching: false,
    officialWebsite: 'https://apsrtc.ap.gov.in',
    officialSource: 'Andhra Pradesh State Road Transport Corporation (APSRTC)',
    lastUpdated: 'August 2026',
    tags: ['andhra pradesh', 'ap', 'apsrtc', 'senior citizen', 'bus concession', 'travel discount'],
    targetEmploymentStatuses: ['Senior Citizen']
  },
  {
    id: 'ap-igncaps-senior-pension',
    name: 'Indira Gandhi National Old Age Pension Scheme (IGNOAPS - AP State Direct DBT)',
    slug: 'ap-igncaps-senior-pension',
    shortDescription: 'Social security monthly cash pension directly disbursed into bank accounts of elderly citizens aged 60+ living below poverty line in Andhra Pradesh.',
    description: 'Under the National Social Assistance Programme (NSAP) integrated with Andhra Pradesh State Social Security, IGNOAPS provides monthly financial subsistence directly credited into the bank accounts of impoverished elderly residents aged 60 and above holding BPL cards.',
    category: 'Pension',
    state: 'Andhra Pradesh',
    governmentLevel: 'State',
    department: 'Department of Rural Development & NSAP, Government of Andhra Pradesh',
    financialBenefitAmount: 'Monthly Direct Cash Pension Disbursed via Aadhaar DBT',
    benefits: [
      'Direct credit into Aadhaar-seeded bank or post office account',
      'Assures basic food and medicine security for destitute senior citizens without family support',
      'Zero intermediaries with direct digital DBT monitoring'
    ],
    eligibility: [
      'Elderly resident of Andhra Pradesh aged 60 years or older',
      'Listed in official Below Poverty Line (BPL) / SECC household database'
    ],
    eligibilityRules: {
      minAge: 60,
      maxAge: 105,
      states: ['Andhra Pradesh'],
      requiresSeniorCitizen: true,
      maxIncome: 120000
    },
    requiredDocuments: [
      'Aadhaar Card',
      'BPL Certificate / White Ration Card',
      'Aadhaar-linked Bank Account Passbook'
    ],
    applicationProcess: [
      'Apply at Village / Ward Sachivalayam or through National Social Assistance Programme (NSAP) portal',
      'Verification by Mandal Parishad Development Officer (MPDO) / Municipal Commissioner',
      'Sanction and inclusion in monthly electronic DBT payroll'
    ],
    deadline: 'Open Year Round',
    deadlineDate: '2026-12-31',
    isDeadlineApproaching: false,
    officialWebsite: 'https://nsap.nic.in',
    officialSource: 'Ministry of Rural Development & Government of Andhra Pradesh',
    lastUpdated: 'August 2026',
    tags: ['andhra pradesh', 'ap', 'ignoaps', 'senior citizen', 'nsap', 'old age pension', 'dbt'],
    targetEmploymentStatuses: ['Senior Citizen']
  },
  {
    id: 'ap-vidya-deevena-reimbursement',
    name: 'Andhra Pradesh Vidya Deevena (Complete Fee Reimbursement via JnanaBhumi)',
    slug: 'ap-vidya-deevena-reimbursement',
    shortDescription: '100% full tuition fee reimbursement credited directly for ITI, Polytechnic, Degree, Engineering, and PG students in Andhra Pradesh.',
    description: 'Flagship higher education welfare program of the Government of Andhra Pradesh providing 100% full tuition fee reimbursement directly for students pursuing polytechnic, engineering, pharmacy, degree, and postgraduate courses via the official JnanaBhumi portal.',
    category: 'Scholarships',
    state: 'Andhra Pradesh',
    governmentLevel: 'State',
    department: 'Social Welfare & Higher Education Department, Government of Andhra Pradesh',
    financialBenefitAmount: '100% Full Tuition Fee Reimbursement paid directly to colleges/mothers',
    benefits: [
      '100% Full Fee Reimbursement paid quarterly directly into bank account',
      'Zero tuition burden for polytechnic, degree, engineering, pharmacy, and postgraduate students',
      'Promotes educational attainment across underprivileged communities in Andhra Pradesh'
    ],
    eligibility: [
      'Permanent resident student of Andhra Pradesh',
      'Pursuing ITI, Polytechnic, Degree, Engineering, Medicine, or Postgraduate courses',
      'Family annual income must not exceed ₹2.5 Lakhs per annum',
      'Student must maintain minimum 75% attendance'
    ],
    eligibilityRules: {
      minAge: 16,
      maxAge: 32,
      states: ['Andhra Pradesh'],
      maxIncome: 250000,
      requiresStudent: true,
      minEducation: ['10th Pass (Matric)', '12th Pass (Intermediate)', 'Diploma/ITI', 'Undergraduate (UG)', 'Postgraduate (PG)']
    },
    requiredDocuments: [
      'Aadhaar Card of student and mother',
      'AP Rice Card / White Ration Card (or Income Certificate under ₹2.5 Lakhs)',
      'Integrated Caste Certificate issued via MeeSeva',
      'College Admission details and Jnanabhumi student ID',
      'Aadhaar-seeded Bank Account Passbook'
    ],
    applicationProcess: [
      'Student applies via College Principal / Nodal Officer on Jnanabhumi portal (jnanabhumi.ap.gov.in)',
      'Field verification completed by Village / Ward Sachivalayam staff',
      'Sanctions approved and credited in quarterly cycles via DBT'
    ],
    deadline: '15 November 2026',
    deadlineDate: '2026-11-15',
    isDeadlineApproaching: false,
    officialWebsite: 'https://jnanabhumi.ap.gov.in',
    officialSource: 'Government of Andhra Pradesh, Social Welfare Dept',
    lastUpdated: 'August 2026',
    tags: ['andhra pradesh', 'ap', 'state scheme', 'scholarship', 'vidya deevena', 'fee reimbursement', 'jnanabhumi']
  },
  {
    id: 'ap-vasathi-deevena-grant',
    name: 'Andhra Pradesh Vasathi Deevena (Hostel & Boarding Grant via JnanaBhumi)',
    slug: 'ap-vasathi-deevena-grant',
    shortDescription: 'Annual financial assistance of ₹20,000 for degree/engineering, ₹15,000 for polytechnic, and ₹10,000 for ITI students for food & hostel expenses.',
    description: 'Vasathi Deevena provides annual financial aid to meet boarding, lodging, and hostel expenses of college students from low-income families in Andhra Pradesh, credited in two installments into the mother’s account.',
    category: 'Scholarships',
    state: 'Andhra Pradesh',
    governmentLevel: 'State',
    department: 'Social Welfare & Backward Classes Welfare Department, Government of Andhra Pradesh',
    financialBenefitAmount: '₹20,000/year (Degree/Engg) | ₹15,000/year (Polytechnic) | ₹10,000/year (ITI)',
    benefits: [
      '₹20,000 per year for Degree & Engineering students in 2 installments',
      '₹15,000 per year for Polytechnic diploma students',
      '₹10,000 per year for Industrial Training Institute (ITI) students',
      'Covers hostel mess charges, room rents, and study materials'
    ],
    eligibility: [
      'Permanent resident student of Andhra Pradesh',
      'Enrolled in recognized ITI, Polytechnic, Degree, or Professional Engineering courses',
      'Family annual income under ₹2.5 Lakhs per annum',
      'Must maintain 75% attendance'
    ],
    eligibilityRules: {
      minAge: 16,
      maxAge: 32,
      states: ['Andhra Pradesh'],
      maxIncome: 250000,
      requiresStudent: true
    },
    requiredDocuments: [
      'Aadhaar Card of student and mother',
      'AP Rice Card / FSC / Income Certificate',
      'College Bonafide Study Certificate',
      'Mother’s Bank Passbook'
    ],
    applicationProcess: [
      'Applied concurrently with Vidya Deevena on Jnanabhumi portal',
      'College Principal certifies semester enrollment and attendance',
      'Disbursed through Navasakam DBT gateway'
    ],
    deadline: '15 November 2026',
    deadlineDate: '2026-11-15',
    isDeadlineApproaching: false,
    officialWebsite: 'https://jnanabhumi.ap.gov.in',
    officialSource: 'Government of Andhra Pradesh, Social Welfare Dept',
    lastUpdated: 'August 2026',
    tags: ['andhra pradesh', 'ap', 'state scheme', 'scholarship', 'vasathi deevena', 'hostel grant']
  },
  {
    id: 'ap-videshi-vidya-scheme',
    name: 'Andhra Pradesh Overseas Study Grant (JnanaBhumi Videshi Vidya)',
    slug: 'ap-videshi-vidya-scheme',
    shortDescription: 'Financial grant up to ₹1.25 Crore for SC, ST, BC, Minority, and EWS students securing admission in top 100 QS-ranked global universities.',
    description: 'The Government of Andhra Pradesh sanctions financial grants up to ₹1.25 Crore (100% of tuition and living fees for top 50 QS universities, and up to ₹50 Lakhs for top 51–100 universities) for meritorious underprivileged students pursuing Master’s or PhD degrees abroad.',
    category: 'Scholarships',
    state: 'Andhra Pradesh',
    governmentLevel: 'State',
    department: 'Higher Education & Social Welfare Department, Government of Andhra Pradesh',
    financialBenefitAmount: 'Up to ₹1.25 Crore (Full Fee + Living Stipend + Airfare)',
    benefits: [
      '100% tuition fee and living expenses up to ₹1.25 Crore for admissions in top 50 QS-ranked universities',
      'Up to ₹50 Lakhs or 100% tuition for QS rank 51 to 100 institutions',
      'One-way flight passage and visa counseling facilitation'
    ],
    eligibility: [
      'Permanent resident of Andhra Pradesh',
      'Belonging to SC, ST, BC, Minority, or EWS category',
      'Family income not exceeding ₹8 Lakhs per annum',
      'Age below 35 years',
      'Secured unconditional admission in top 100 QS World University Rankings'
    ],
    eligibilityRules: {
      minAge: 20,
      maxAge: 35,
      states: ['Andhra Pradesh'],
      categories: ['SC', 'ST', 'OBC', 'EWS', 'Minority'],
      maxIncome: 800000,
      requiresStudent: true
    },
    requiredDocuments: [
      'Aadhaar Card and AP Domicile Certificate',
      'Caste Certificate and Income Certificate from MeeSeva',
      'Unconditional admission offer letter from QS top 100 university',
      'GRE / GMAT / IELTS / TOEFL score report',
      'Valid Passport and Student Visa'
    ],
    applicationProcess: [
      'Register on Jnanabhumi Videshi Vidya portal',
      'Upload university offer letter and academic credentials',
      'Scrutiny by State Level Selection Committee and release of DBT milestone payments'
    ],
    deadline: '30 November 2026',
    deadlineDate: '2026-11-30',
    isDeadlineApproaching: false,
    officialWebsite: 'https://jnanabhumi.ap.gov.in',
    officialSource: 'Government of Andhra Pradesh, Higher Education Dept',
    lastUpdated: 'August 2026',
    tags: ['andhra pradesh', 'ap', 'state scheme', 'overseas scholarship', 'videshi vidya', 'foreign studies']
  },
  {
    id: 'ap-yuva-galam-unemployment-aid',
    name: 'Andhra Pradesh Yuva Galam Unemployment Allowance Scheme',
    slug: 'ap-yuva-galam-unemployment-aid',
    shortDescription: 'Monthly financial assistance of ₹3,000 per month for educated unemployed youth in Andhra Pradesh to support skill development and competitive exam preparation.',
    description: 'Part of the Super Six welfare agenda of the Government of Andhra Pradesh, Yuva Galam provides ₹3,000 per month to eligible unemployed diploma, degree, and postgraduate youths in AP to cover skill training and job application expenses.',
    category: 'Employment',
    state: 'Andhra Pradesh',
    governmentLevel: 'State',
    department: 'Skill Development & Youth Welfare Department, Government of Andhra Pradesh',
    financialBenefitAmount: '₹3,000 per month direct allowance',
    benefits: [
      '₹3,000 per month direct stipend credited into candidate bank account',
      'Free industry certification and placement training via AP Skill Development Corporation (APSSDC)',
      'Financial support during competitive exam coaching and job searches'
    ],
    eligibility: [
      'Resident youth of Andhra Pradesh aged 18 to 35 years',
      'Minimum qualification of Polytechnic Diploma, ITI, Graduate Degree, or PG',
      'Currently unemployed and registered with AP Employment Exchange',
      'Family annual income under ₹2.5 Lakhs'
    ],
    eligibilityRules: {
      minAge: 18,
      maxAge: 35,
      states: ['Andhra Pradesh'],
      maxIncome: 250000,
      minEducation: ['Diploma/ITI', 'Undergraduate (UG)', 'Postgraduate (PG)']
    },
    requiredDocuments: [
      'Aadhaar Card of applicant',
      'Educational Degree / Diploma Certificate and Marks Memo',
      'AP Employment Exchange registration card',
      'Aadhaar-linked Bank Passbook'
    ],
    applicationProcess: [
      'Register on AP Skill / Spandana Portal',
      'Verification of degree and unemployment status',
      'Monthly allowance credited directly to account'
    ],
    deadline: 'Open Year Round',
    deadlineDate: '2026-12-31',
    isDeadlineApproaching: false,
    officialWebsite: 'https://apssdc.in',
    officialSource: 'AP Skill Development Corporation, Government of Andhra Pradesh',
    lastUpdated: 'August 2026',
    tags: ['andhra pradesh', 'ap', 'yuva galam', 'unemployment allowance', 'youth', 'super six', 'employment'],
    targetEmploymentStatuses: ['Business Holder', 'Student']
  },
  {
    id: 'ap-sunna-vaddi-dwcra',
    name: 'Andhra Pradesh Sunna Vaddi (Zero Interest DWCRA Loans)',
    slug: 'ap-sunna-vaddi-dwcra',
    shortDescription: '100% full interest subvention for DWCRA Self Help Group (SHG) women on bank loans up to ₹5,00,000 in Andhra Pradesh.',
    description: 'Sunna Vaddi ensures zero interest on bank loans taken by DWCRA Self Help Groups in Andhra Pradesh. The state government directly reimburses the entire bank interest amount into the SHG members’ accounts, ensuring zero interest burden on women entrepreneurs.',
    category: 'Women',
    state: 'Andhra Pradesh',
    governmentLevel: 'State',
    department: 'SERP & MEPMA, Department of Rural Development, Government of Andhra Pradesh',
    financialBenefitAmount: '100% Interest Subvention on SHG bank loans up to ₹5,00,000',
    benefits: [
      '100% interest reimbursement credited directly to SHG bank accounts',
      'Eliminates interest burden on petty shop owners, weavers, vegetable vendors, and SHG women',
      'Strengthens women credit rating and livelihood enterprises'
    ],
    eligibility: [
      'Women belonging to registered rural (SERP) or urban (MEPMA) DWCRA Self Help Groups in AP',
      'Bank loan amount up to ₹5,00,000 with regular monthly repayments'
    ],
    eligibilityRules: {
      minAge: 18,
      maxAge: 70,
      states: ['Andhra Pradesh'],
      genders: ['female'],
      requiresWomanEntrepreneur: true
    },
    requiredDocuments: [
      'SHG Group Registration details and Member Aadhaar Cards',
      'SHG Bank Loan Passbook showing regular repayments',
      'Rice Card / FSC'
    ],
    applicationProcess: [
      'SHG applies through Village Organization (VO) / Slum Level Federation (SLF)',
      'Bank submits repayment and interest claim to SERP/MEPMA',
      'Government disburses 100% interest subsidy directly to SHG account'
    ],
    deadline: 'Open Year Round',
    deadlineDate: '2026-12-31',
    isDeadlineApproaching: false,
    officialWebsite: 'https://navasakam2.apcfss.in',
    officialSource: 'Society for Elimination of Rural Poverty (SERP), Andhra Pradesh',
    lastUpdated: 'August 2026',
    tags: ['andhra pradesh', 'ap', 'sunna vaddi', 'dwcra', 'women', 'shg', 'interest free loan'],
    targetEmploymentStatuses: ['Women']
  }
];
