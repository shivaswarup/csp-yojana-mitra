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
      name: 'JnanaBhumi AP Portal',
      url: 'https://jnanabhumi.ap.gov.in',
      domain: 'jnanabhumi.ap.gov.in',
      category: 'Post-Matric Scholarships & Education Support',
      description: 'Official Government of AP portal for Post-Matric Fee Reimbursement, Vasathi Deevena, Thalliki Vandanam, and Overseas Vidya Grants.',
      targetSchemes: ['jnanabhumi', 'vidya deevena', 'vasathi deevena', 'thalliki vandanam', 'post-matric scholarship', 'videshi vidya']
    },
    {
      name: 'AP Navasakam / Spandana Citizen Portal',
      url: 'https://navasakam2.apcfss.in',
      domain: 'navasakam2.apcfss.in',
      category: 'Direct Benefit Transfer Services',
      description: 'Official Government of Andhra Pradesh portal for citizen welfare audit, Annadata Sukhibhava, NTR Bharosa, Deepam 2.0, and DBT cards.',
      targetSchemes: ['navasakam', 'annadata sukhibhava', 'ntr bharosa', 'deepam scheme', 'sunna vaddi', 'yuva galam']
    },
    {
      name: 'AP MeeSeva Portal',
      url: 'https://meeseva.ap.gov.in',
      domain: 'meeseva.ap.gov.in',
      category: 'Certificates & Citizen Paperwork',
      description: 'Official portal for Integrated Caste, Income, and Residence certificates in Andhra Pradesh.',
      targetSchemes: ['meeseva', 'caste certificate', 'income certificate', 'residence proof']
    },
    {
      name: 'Dr. NTR Vaidya Seva Trust',
      url: 'https://aarogyasri.ap.gov.in',
      domain: 'aarogyasri.ap.gov.in',
      category: 'Healthcare & Medical Cover',
      description: 'Official cashless medical treatment portal covering comprehensive health procedures up to ₹25,00,000 across AP and network cities.',
      targetSchemes: ['ntr vaidya seva', 'aarogyasri', 'health cover', 'cashless hospital']
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
