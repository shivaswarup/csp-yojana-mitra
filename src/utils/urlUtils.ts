// Utility for normalizing and ensuring valid, absolute official government URLs across the app

export const ensureAbsoluteUrl = (rawUrl?: string): string => {
  if (!rawUrl || !rawUrl.trim()) return 'https://www.myscheme.gov.in';
  
  let url = rawUrl.trim();

  // Strip trailing punctuation or markdown chars
  url = url.replace(/[\.\,\;\:\)\*\_]+$/, '').trim();

  // Fix common outdated/decommissioned state government subdomains that time out or fail SSL
  if (url.includes('apecs.ap.gov.in') || url.includes('apecs')) {
    return 'https://epdsap.ap.gov.in';
  }
  if (url.includes('nsap.gov.in') || url.includes('nsap.nic.in') || url.includes('sspensions.ap.gov.in')) {
    return 'https://www.myscheme.gov.in/search?q=pension';
  }
  if (url.includes('meeseva.ap.gov.in') || url.includes('meeseva')) {
    return 'https://www.myscheme.gov.in';
  }
  if (url.includes('cheyutha.ap.gov.in') || url.includes('cheyutha')) {
    return 'https://www.myscheme.gov.in/search?q=cheyutha';
  }
  if (url.includes('aprtc.ap.gov.in') || url.includes('aprtc')) {
    return 'https://apsrtc.ap.gov.in';
  }
  if (url.includes('apagrisnet.gov.in') || url.includes('rythubharosa.ap.gov.in')) {
    return 'https://pmkisan.gov.in';
  }
  if (url.includes('aarogyasri.ap.gov.in') || url.includes('vaidyaseva.ap.gov.in')) {
    return 'https://pmjay.gov.in';
  }
  if (url.includes('navasakam2.apcfss.in') || url.includes('navasakam.ap.gov.in') || url.includes('apcfss.in')) {
    return 'https://www.myscheme.gov.in';
  }
  if (url.includes('spandana.ap.gov.in')) {
    return 'https://epdsap.ap.gov.in';
  }
  if (url.includes('jnanabhumi.ap.gov.in') || url.includes('jnanabhumi')) {
    return 'https://jnanabhumi.ap.gov.in/';
  }
  if (url.includes('ammatodi.ap.gov.in')) {
    return 'https://jnanabhumi.ap.gov.in/';
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
      activeUrl: 'https://epdsap.ap.gov.in',
      displayLabel: 'epdsap.ap.gov.in (AP Consumer & Civil Supplies Portal)',
      mirrorUrl: 'https://www.myscheme.gov.in'
    };
  }

  if (rawUrl.includes('nsap.gov.in') || rawUrl.includes('nsap.nic.in') || rawUrl.includes('sspensions.ap.gov.in')) {
    return {
      activeUrl: 'https://www.myscheme.gov.in/search?q=pension',
      displayLabel: 'myscheme.gov.in (National & State Pension Portal)',
      mirrorUrl: 'https://epdsap.ap.gov.in'
    };
  }

  if (rawUrl.includes('meeseva.ap.gov.in') || rawUrl.includes('meeseva')) {
    return {
      activeUrl: 'https://www.myscheme.gov.in',
      displayLabel: 'myscheme.gov.in (National & AP Welfare Gateway)',
      mirrorUrl: 'https://epdsap.ap.gov.in'
    };
  }

  if (rawUrl.includes('cheyutha.ap.gov.in') || rawUrl.includes('cheyutha')) {
    return {
      activeUrl: 'https://www.myscheme.gov.in/search?q=cheyutha',
      displayLabel: 'myscheme.gov.in (AP Cheyutha Portal)',
      mirrorUrl: 'https://epdsap.ap.gov.in'
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

  if (activeUrl.includes('pmjay.gov.in')) {
    return {
      activeUrl: 'https://pmjay.gov.in',
      displayLabel: 'pmjay.gov.in (Ayushman Bharat / PM-JAY)',
      mirrorUrl: 'https://www.myscheme.gov.in/search?q=ayushman'
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
