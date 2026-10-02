export interface OfficialPortalInfo {
  name: string;
  url: string;
  domain: string;
  category: string;
  description: string;
  targetSchemes?: string[];
}

export const STATE_OFFICIAL_PORTALS: Record<string, OfficialPortalInfo[]> = {
  'Andhra Pradesh': [
    {
      name: 'AP JnanaBhumi Education & Scholarship Portal',
      url: 'https://jnanabhumi.ap.gov.in/',
      domain: 'jnanabhumi.ap.gov.in',
      category: 'AP State Scholarships & Higher Education Support',
      description: 'Official Government of AP portal for Vidya Deevena fee reimbursement, Vasathi Deevena hostel grants, Post-Matric Scholarships, and education assistance.',
      targetSchemes: ['jnanabhumi', 'vidya deevena', 'vasathi deevena', 'thalliki vandanam', 'post-matric scholarship', 'videshi vidya', 'scholarship']
    },
    {
      name: 'myScheme Official Welfare Portal',
      url: 'https://www.myscheme.gov.in',
      domain: 'myscheme.gov.in',
      category: 'One-Stop Central & State Welfare Gateway (MeitY)',
      description: 'Official Government of India portal indexing all Central and Andhra Pradesh state welfare schemes, eligibility rules, and official application links.',
      targetSchemes: ['annadata sukhibhava', 'ntr bharosa', 'deepam scheme', 'sunna vaddi', 'yuva galam', 'all', 'cheyutha', 'kalyana masthu']
    },
    {
      name: 'National Scholarship Portal (NSP)',
      url: 'https://scholarships.gov.in',
      domain: 'scholarships.gov.in',
      category: 'Scholarships & Higher Education Support',
      description: 'Official Government portal for Central Post-Matric Scholarships, Tuition Fee Reimbursement, Pre-Matric grants, and Central/State education support.',
      targetSchemes: ['nsp', 'central scholarship', 'post-matric scholarship', 'aicte pragati']
    },
    {
      name: 'Dr. NTR Vaidya Seva Official Healthcare Portal',
      url: 'https://drntrvaidyaseva.ap.gov.in/',
      domain: 'drntrvaidyaseva.ap.gov.in',
      category: 'Universal Health Coverage & Hospitalization',
      description: 'Official Government of AP portal for Dr. NTR Vaidya Seva cashless medical treatment covering comprehensive health and surgical procedures up to ₹25 Lakhs.',
      targetSchemes: ['ntr vaidya seva', 'aarogyasri', 'health cover', 'cashless hospital', 'geriatric']
    },
    {
      name: 'PM-KISAN & Farmer Welfare Portal',
      url: 'https://pmkisan.gov.in',
      domain: 'pmkisan.gov.in',
      category: 'Agricultural Income & Farmer DBT Support',
      description: 'Official government portal for farmer income support, e-KYC status, DBT beneficiary credit, and Annadata Sukhibhava integration.',
      targetSchemes: ['pm-kisan', 'annadata sukhibhava', 'farmer', 'agriculture', 'rythu bharosa']
    },
    {
      name: 'AP State Skill Development Corporation (APSSDC)',
      url: 'https://apssdc.in',
      domain: 'apssdc.in',
      category: 'Youth Skill Training & Employment Placement',
      description: 'Official Government of AP portal for youth skill training, certifications, competitive exam support, and placement assistance.',
      targetSchemes: ['apssdc', 'yuva galam', 'skill development', 'youth employment', 'unemployment']
    },
    {
      name: 'AP Social Security Pensions (SSPensions) Portal',
      url: 'https://sspensions.ap.gov.in/',
      domain: 'sspensions.ap.gov.in',
      category: 'Pensions & Social Security',
      description: 'Official Government of AP portal for NTR Bharosa monthly old age, widow, and disability pensions.',
      targetSchemes: ['ntr bharosa', 'pension', 'senior citizen', 'ignoaps', 'sspensions']
    },
    {
      name: 'AP Differently Abled and Senior Citizens Assistance Corporation (APDASCAC)',
      url: 'https://apdascac.ap.gov.in/',
      domain: 'apdascac.ap.gov.in',
      category: 'Senior Citizen Assistive Devices & Welfare',
      description: 'Official Government of AP portal for Vayo Vandana assistive devices, walking aids, hearing aids, wheelchairs, and senior citizen welfare grants.',
      targetSchemes: ['vayo vandana', 'assistive devices', 'senior citizen', 'wheelchair', 'hearing aid', 'apdascac']
    },
    {
      name: 'APSRTC Official Transport & Concession Portal',
      url: 'https://apsrtc.ap.gov.in',
      domain: 'apsrtc.ap.gov.in',
      category: 'Public Transport & Student/Women Bus Concessions',
      description: 'Official Government of AP portal for Maha Shakti Free RTC Bus Travel for women, student bus passes, and senior citizen travel concessions.',
      targetSchemes: ['apsrtc', 'aprtc', 'maha shakti', 'bus travel', 'free bus', 'bus concession']
    },
    {
      name: 'India Post Savings & Small Schemes Portal',
      url: 'https://www.indiapost.gov.in/banking-services/savings',
      domain: 'indiapost.gov.in',
      category: 'Small Savings, Post Office Accounts & Sukanya Samriddhi',
      description: 'Official Department of Posts portal for Sukanya Samriddhi Yojana, Post Office Savings, Mahila Samman Savings, and Senior Citizen Savings Accounts.',
      targetSchemes: ['sukanya samriddhi', 'post office', 'indiapost', 'savings', 'ssy']
    },
    {
      name: 'AICTE Scholarship Schemes Portal',
      url: 'https://www.aicte.gov.in/schemes/scholarship-schemes',
      domain: 'aicte.gov.in',
      category: 'AICTE Technical Scholarships & Fellowships',
      description: 'Official AICTE portal for Pragati Scholarship for Girl Students, Saksham Scholarship for Differently Abled, and Technical Degree/Diploma grants.',
      targetSchemes: ['aicte', 'pragati', 'aicte pragati', 'technical scholarship']
    },
    {
      name: 'AP Stree Nidhi Credit Cooperative Federation Portal',
      url: 'https://www.sthreenidhi.ap.gov.in/SNBank/UI/Home.aspx',
      domain: 'sthreenidhi.ap.gov.in',
      category: 'Women Micro-credit, Cheyutha & Livelihood Finance',
      description: 'Official Government of AP portal for Stree Nidhi credit cooperative bank, Cheyutha livelihood loans, DWCRA women enterprise credit, and SHG financial empowerment.',
      targetSchemes: ['cheyutha', 'stree nidhi', 'sthreenidhi', 'dwcra', 'women livelihood']
    }
  ]
};

export function getOfficialPortalsForState(stateName: string, responseText?: string): OfficialPortalInfo[] {
  const normalizedState = Object.keys(STATE_OFFICIAL_PORTALS).find(
    s => s.toLowerCase() === stateName.toLowerCase()
  );

  const stateList = normalizedState 
    ? STATE_OFFICIAL_PORTALS[normalizedState] 
    : STATE_OFFICIAL_PORTALS['Andhra Pradesh'];
  
  if (!responseText || !responseText.trim()) {
    return stateList;
  }

  const lowerText = responseText.toLowerCase();

  // If text is provided, sort by relevance to the mentioned schemes in the text
  const matched = stateList.filter(portal => {
    if (lowerText.includes(portal.name.toLowerCase()) || lowerText.includes(portal.domain.toLowerCase())) {
      return true;
    }
    return portal.targetSchemes?.some(tag => lowerText.includes(tag.toLowerCase()));
  });

  const unmatched = stateList.filter(portal => !matched.includes(portal));

  // Return matched first, followed by remaining state portals
  return [...matched, ...unmatched];
}
