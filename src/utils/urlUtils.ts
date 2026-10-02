// Utility for normalizing and ensuring valid, absolute official government URLs across the app

export const ensureAbsoluteUrl = (rawUrl?: string): string => {
  if (!rawUrl || !rawUrl.trim()) return 'https://www.myscheme.gov.in';
  
  let url = rawUrl.trim();

  // Strip trailing punctuation or markdown chars
  url = url.replace(/[\.\,\;\:\)\*\_]+$/, '').trim();

  // Fix common outdated/decommissioned state government subdomains that time out or fail SSL
  if (url.includes('apecs.ap.gov.in') || url.includes('apecs')) {
    return 'https://civilsupplies.ap.gov.in/homepage.jsp';
  }
  if (url.includes('nsap.gov.in') || url.includes('nsap.nic.in') || url.includes('sspensions.ap.gov.in') || url.includes('gramawardsachivalayam.ap.gov.in')) {
    return 'https://sspensions.ap.gov.in/';
  }
  if (url.includes('meeseva.ap.gov.in') || url.includes('meeseva')) {
    return 'https://www.myscheme.gov.in';
  }
  if (url.includes('cheyutha.ap.gov.in') || url.includes('cheyutha') || url.includes('sthreenidhi')) {
    return 'https://www.sthreenidhi.ap.gov.in/SNBank/UI/Home.aspx';
  }
  if (url.includes('aprtc.ap.gov.in') || url.includes('aprtc')) {
    return 'https://apsrtc.ap.gov.in';
  }
  if (url.includes('apagrisnet.gov.in') || url.includes('rythubharosa.ap.gov.in')) {
    return 'https://pmkisan.gov.in';
  }
  if (url.includes('aarogyasri.ap.gov.in') || url.includes('vaidyaseva.ap.gov.in') || url.includes('drntrvaidyaseva.ap.gov.in')) {
    return 'https://drntrvaidyaseva.ap.gov.in/';
  }
  if (url.includes('navasakam2.apcfss.in') || url.includes('navasakam.ap.gov.in') || url.includes('navasakam')) {
    return 'https://navasakamportal.com/';
  }
  if (url.includes('spandana.ap.gov.in')) {
    return 'https://civilsupplies.ap.gov.in/homepage.jsp';
  }
  if (url.includes('jnanabhumi.ap.gov.in') || url.includes('jnanabhumi')) {
    return 'https://jnanabhumi.ap.gov.in/';
  }
  if (url.includes('npscra.nsdl.co.in') || url.includes('nps-proteantech.in')) {
    return 'https://enps.nps-proteantech.in/eNPS/ApySubRegistration.html';
  }
  if (url.includes('apdascac.ap.gov.in') || url.includes('apdascac')) {
    return 'https://apdascac.ap.gov.in/';
  }
  if (url.includes('aadabidda') || url.includes('aadabiddanidhi.ap.gov.in')) {
    return 'https://www.myscheme.gov.in/search?q=aadabidda';
  }
  if (url.includes('shaaditohfa') || url.includes('navasakamportal.com') || url.includes('kalyanamasthu')) {
    return 'https://navasakamportal.com/';
  }
  if (url.includes('indiapost.gov.in') || url.includes('indiapost') || url.includes('sukanya')) {
    return 'https://www.indiapost.gov.in/banking-services/savings';
  }
  if (url.includes('aicte.gov.in') || url.includes('aicte') || url.includes('pragati-scholarship')) {
    return 'https://www.aicte.gov.in/schemes/scholarship-schemes';
  }

  // If scheme name/domain is passed without protocol, prepend https://
  if (!/^https?:\/\//i.test(url)) {
    url = `https://${url}`;
  }

  return url;
};

export const normalizeGovernmentUrl = (rawUrl: string): { activeUrl: string; displayLabel: string; mirrorUrl: string } => {
  const activeUrl = ensureAbsoluteUrl(rawUrl);

  if (rawUrl.includes('apecs.ap.gov.in') || rawUrl.includes('apecs')) {
    return {
      activeUrl: 'https://civilsupplies.ap.gov.in/homepage.jsp',
      displayLabel: 'civilsupplies.ap.gov.in (AP Civil Supplies Official Portal)',
      mirrorUrl: 'https://www.myscheme.gov.in'
    };
  }

  if (rawUrl.includes('nsap.gov.in') || rawUrl.includes('nsap.nic.in') || rawUrl.includes('sspensions.ap.gov.in') || rawUrl.includes('gramawardsachivalayam.ap.gov.in')) {
    return {
      activeUrl: 'https://sspensions.ap.gov.in/',
      displayLabel: 'sspensions.ap.gov.in (AP Social Security Pensions Portal)',
      mirrorUrl: 'https://www.myscheme.gov.in/search?q=pension'
    };
  }

  if (rawUrl.includes('meeseva.ap.gov.in') || rawUrl.includes('meeseva')) {
    return {
      activeUrl: 'https://www.myscheme.gov.in',
      displayLabel: 'myscheme.gov.in (National & AP Welfare Gateway)',
      mirrorUrl: 'https://civilsupplies.ap.gov.in/homepage.jsp'
    };
  }

  if (rawUrl.includes('cheyutha.ap.gov.in') || rawUrl.includes('cheyutha') || activeUrl.includes('sthreenidhi')) {
    return {
      activeUrl: 'https://www.sthreenidhi.ap.gov.in/SNBank/UI/Home.aspx',
      displayLabel: 'sthreenidhi.ap.gov.in (AP Stree Nidhi Credit Cooperative Federation)',
      mirrorUrl: 'https://www.myscheme.gov.in/search?q=cheyutha'
    };
  }

  if (activeUrl.includes('apsrtc.ap.gov.in')) {
    return {
      activeUrl: 'https://apsrtc.ap.gov.in',
      displayLabel: 'apsrtc.ap.gov.in (APSRTC Official Portal)',
      mirrorUrl: 'https://www.myscheme.gov.in/search?q=apsrtc'
    };
  }

  if (activeUrl.includes('pmkisan.gov.in')) {
    return {
      activeUrl: 'https://pmkisan.gov.in',
      displayLabel: 'pmkisan.gov.in (PM-KISAN & Farmer Portal)',
      mirrorUrl: 'https://www.myscheme.gov.in/schemes/pm-kisan'
    };
  }

  if (activeUrl.includes('drntrvaidyaseva.ap.gov.in')) {
    return {
      activeUrl: 'https://drntrvaidyaseva.ap.gov.in/',
      displayLabel: 'drntrvaidyaseva.ap.gov.in (Dr. NTR Vaidya Seva Portal)',
      mirrorUrl: 'https://pmjay.gov.in'
    };
  }
  if (activeUrl.includes('pmjay.gov.in')) {
    return {
      activeUrl: 'https://pmjay.gov.in',
      displayLabel: 'pmjay.gov.in (Ayushman Bharat / PM-JAY)',
      mirrorUrl: 'https://www.myscheme.gov.in/search?q=ayushman'
    };
  }

  if (activeUrl.includes('indiapost.gov.in') || activeUrl.includes('indiapost') || rawUrl.includes('sukanya')) {
    return {
      activeUrl: 'https://www.indiapost.gov.in/banking-services/savings',
      displayLabel: 'indiapost.gov.in (India Post Savings & Small Schemes Portal)',
      mirrorUrl: 'https://www.myscheme.gov.in/search?q=post+office'
    };
  }

  if (activeUrl.includes('shaaditohfa') || activeUrl.includes('navasakamportal.com') || rawUrl.includes('kalyanamasthu')) {
    return {
      activeUrl: 'https://navasakamportal.com/',
      displayLabel: 'navasakamportal.com (Navasakam & Kalyana Masthu Portal)',
      mirrorUrl: 'https://www.myscheme.gov.in/search?q=kalyana+masthu'
    };
  }
  if (activeUrl.includes('aadabidda') || rawUrl.includes('aadabiddanidhi.ap.gov.in')) {
    return {
      activeUrl: 'https://www.myscheme.gov.in/search?q=aadabidda',
      displayLabel: 'myscheme.gov.in (Aadabidda Nidhi Scheme Portal)',
      mirrorUrl: 'https://www.myscheme.gov.in'
    };
  }
  if (activeUrl.includes('apdascac.ap.gov.in') || activeUrl.includes('apdascac')) {
    return {
      activeUrl: 'https://apdascac.ap.gov.in/',
      displayLabel: 'apdascac.ap.gov.in (AP Differently Abled & Senior Citizens Corporation)',
      mirrorUrl: 'https://www.myscheme.gov.in/search?q=vayo+vandana'
    };
  }
  if (activeUrl.includes('npscra.nsdl.co.in') || activeUrl.includes('nps-proteantech.in')) {
    return {
      activeUrl: 'https://enps.nps-proteantech.in/eNPS/ApySubRegistration.html',
      displayLabel: 'enps.nps-proteantech.in (Atal Pension Yojana Portal)',
      mirrorUrl: 'https://www.myscheme.gov.in/search?q=atal+pension'
    };
  }

  if (activeUrl.includes('aicte.gov.in') || activeUrl.includes('aicte') || rawUrl.includes('pragati')) {
    return {
      activeUrl: 'https://www.aicte.gov.in/schemes/scholarship-schemes',
      displayLabel: 'aicte.gov.in (AICTE Official Scholarship Schemes Portal)',
      mirrorUrl: 'https://www.myscheme.gov.in/search?q=aicte'
    };
  }

  if (activeUrl.includes('jnanabhumi.ap.gov.in') || activeUrl.includes('jnanabhumi')) {
    return {
      activeUrl: 'https://jnanabhumi.ap.gov.in/',
      displayLabel: 'jnanabhumi.ap.gov.in (AP JnanaBhumi Portal)',
      mirrorUrl: 'https://www.myscheme.gov.in/search?q=scholarship'
    };
  }

  if (activeUrl.includes('scholarships.gov.in')) {
    return {
      activeUrl: 'https://scholarships.gov.in',
      displayLabel: 'scholarships.gov.in (National Scholarship Portal)',
      mirrorUrl: 'https://www.myscheme.gov.in/search?q=scholarship'
    };
  }

  let domain = 'Official Government Portal';
  try {
    const parsed = new URL(activeUrl);
    domain = parsed.hostname.replace(/^www\./, '');
  } catch {
    domain = activeUrl.replace(/^https?:\/\//, '').replace(/^www\./, '');
  }

  return {
    activeUrl,
    displayLabel: domain,
    mirrorUrl: `https://www.myscheme.gov.in/search?q=${encodeURIComponent(domain)}`
  };
};
