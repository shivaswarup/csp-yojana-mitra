import { Scheme, UserProfile, SchemeRecommendation, MatchReason, EmploymentStatus } from '../types';

/**
 * Normalizes user's employment status to one of the 5 canonical categories:
 * 1. Business Holder
 * 2. Farmer
 * 3. Student
 * 4. Senior Citizen
 * 5. Women
 */
export function normalizeEmploymentStatus(status?: string): EmploymentStatus {
  if (!status) return 'Student';
  const s = status.toLowerCase().trim();

  if (s.includes('bussines') || s.includes('business') || s.includes('self-employed') || s.includes('msme') || s.includes('entrepreneur')) {
    return 'Business Holder';
  }
  if (s.includes('farmer') || s.includes('agri') || s.includes('cultivat')) {
    return 'Farmer';
  }
  if (s.includes('senior') || s.includes('retire') || s.includes('pension') || s.includes('elderly')) {
    return 'Senior Citizen';
  }
  if (s.includes('women') || s.includes('woman') || s.includes('female') || s.includes('mahila')) {
    return 'Women';
  }
  if (s.includes('student') || s.includes('pursuing') || s.includes('scholarship')) {
    return 'Student';
  }

  return 'Student';
}

/**
 * Identifies which of the 5 employment statuses a scheme is targeted for.
 */
export function getSchemeTargetEmploymentStatuses(scheme: Scheme): EmploymentStatus[] {
  // 1. Prioritize explicit target employment statuses on the scheme definition
  if (scheme.targetEmploymentStatuses && scheme.targetEmploymentStatuses.length > 0) {
    return scheme.targetEmploymentStatuses;
  }

  const rules = scheme.eligibilityRules || {};
  const cat = scheme.category || '';
  const text = [
    scheme.name,
    cat,
    scheme.description || '',
    scheme.shortDescription || '',
    (scheme.tags || []).join(' '),
    (scheme.eligibility || []).join(' ')
  ].join(' ').toLowerCase();

  const matched: EmploymentStatus[] = [];

  // 1. Student
  if (
    rules.requiresStudent ||
    cat === 'Scholarships' ||
    cat === 'Student Welfare' ||
    cat === 'Education' ||
    text.includes('scholarship') ||
    text.includes('student') ||
    text.includes('vidya deevena') ||
    text.includes('vasathi deevena') ||
    text.includes('videshi vidya') ||
    text.includes('fee reimbursement') ||
    text.includes('pratibha award') ||
    text.includes('fellowship') ||
    text.includes('merit-cum-means')
  ) {
    matched.push('Student');
  }

  // 2. Farmer
  if (
    rules.requiresFarmer ||
    cat === 'Agriculture' ||
    text.includes('farmer') ||
    text.includes('kisan') ||
    text.includes('agriculture') ||
    text.includes('crop') ||
    text.includes('farming') ||
    text.includes('rythu') ||
    text.includes('pm-kisan') ||
    text.includes('fasal bima') ||
    text.includes('cultivator') ||
    text.includes('landholder') ||
    text.includes('soil health') ||
    text.includes('kcc')
  ) {
    matched.push('Farmer');
  }

  // 3. Business Holder
  if (
    rules.requiresBusinessOwner ||
    cat === 'Business' ||
    cat === 'Employment' ||
    text.includes('business') ||
    text.includes('msme') ||
    text.includes('mudra') ||
    text.includes('svanidhi') ||
    text.includes('stand-up') ||
    text.includes('entrepreneur') ||
    text.includes('startup') ||
    text.includes('commercial') ||
    text.includes('pmegp') ||
    text.includes('enterprise') ||
    text.includes('micro enterprise') ||
    text.includes('t-pride') ||
    text.includes('credit guarantee') ||
    text.includes('artisan') ||
    text.includes('vishwakarma') ||
    text.includes('street vendor') ||
    text.includes('shop owner')
  ) {
    matched.push('Business Holder');
  }

  // 4. Senior Citizen (EXCLUSIVELY elderly pensions, geriatric health, and senior welfare - NEVER general social security or maternal/widow loans)
  const isSeniorSpecific =
    rules.requiresSeniorCitizen ||
    (rules.minAge && rules.minAge >= 58) ||
    text.includes('senior citizen') ||
    text.includes('old age pension') ||
    text.includes('elderly') ||
    text.includes('vridhjan') ||
    text.includes('vayo vandana') ||
    text.includes('geriatric') ||
    text.includes('vayoshri') ||
    (cat === 'Pension' && !text.includes('widow') && !text.includes('single women') && !text.includes('maternity'));

  if (isSeniorSpecific) {
    matched.push('Senior Citizen');
  }

  // 5. Women (EXCLUSIVELY dedicated women empowerment, SHG, maternal, and female schemes)
  const isWomenSpecific =
    rules.requiresWomanEntrepreneur ||
    cat === 'Women' ||
    (rules.genders && rules.genders.length === 1 && rules.genders[0] === 'female') ||
    text.includes('women empowerment') ||
    text.includes('woman entrepreneur') ||
    text.includes('maha shakti') ||
    text.includes('aadabidda') ||
    text.includes('dwcra') ||
    text.includes('shg') ||
    text.includes('self help group') ||
    text.includes('deepam') ||
    text.includes('cheyutha') ||
    text.includes('kalyana masthu') ||
    text.includes('shaadi mubarak') ||
    text.includes('sukanya samriddhi') ||
    text.includes('ladli behna') ||
    text.includes('maternity') ||
    text.includes('girl child');

  if (isWomenSpecific) {
    matched.push('Women');
  }

  return matched;
}

/**
 * Evaluates scheme eligibility strictly based on Employment Status.
 * Primary occupation has been removed and is NOT considered.
 */
export function evaluateSchemeEligibility(scheme: Scheme, profile: UserProfile): SchemeRecommendation {
  const rules = scheme.eligibilityRules || {};
  const reasons: MatchReason[] = [];
  const unmetCriteria: string[] = [];

  const targetStatuses = getSchemeTargetEmploymentStatuses(scheme);
  const userStatus = normalizeEmploymentStatus(profile.employmentStatus);
  const userState = profile.state || 'All India';

  // 1. PRIMARY EVALUATION: Employment Status Criterion
  const isEmploymentMatch = targetStatuses.includes(userStatus);

  if (isEmploymentMatch) {
    reasons.push({
      matched: true,
      criterion: `Employment Status (${userStatus})`,
      detail: `Directly tailored for your employment status as a ${userStatus}.`
    });
  } else {
    // Scheme is designated for a different employment status
    const targetLabel = targetStatuses.length > 0 ? targetStatuses.join(' / ') : 'Other categories';
    unmetCriteria.push(`Exclusively designated for ${targetLabel} (Your status: ${userStatus})`);
    reasons.push({
      matched: false,
      criterion: 'Employment Status Requirement',
      detail: `This scheme is designated for ${targetLabel}. Your active employment status is ${userStatus}.`
    });
  }

  // 2. STATE DOMICILE VERIFICATION (For State Government Initiatives)
  const allowedStates = (rules.states && rules.states.length > 0)
    ? rules.states
    : (scheme.state && scheme.state !== 'All India' ? [scheme.state] : []);

  if (allowedStates.length > 0 && !allowedStates.includes('All India')) {
    const isStateMatch = allowedStates.some(st => st.toLowerCase() === userState.toLowerCase());
    if (isStateMatch) {
      reasons.push({
        matched: true,
        criterion: 'State Domicile',
        detail: `You reside in ${userState}, matching the state mandate (${allowedStates.join(', ')}).`
      });
      if (scheme.governmentLevel === 'State') {
        reasons.unshift({
          matched: true,
          criterion: 'Official State Government Initiative',
          detail: `Exclusive initiative enacted by the Government of ${userState} for ${userStatus}s.`
        });
      }
    } else {
      unmetCriteria.push(`Exclusively for residents of ${allowedStates.join(', ')} (Your state: ${userState})`);
      reasons.push({
        matched: false,
        criterion: 'State Domicile',
        detail: `Available exclusively for residents of ${allowedStates.join(', ')}.`
      });
    }
  }

  // 4. Calculate Final Score strictly based on Employment Status & State Match
  let score = 20;

  if (unmetCriteria.length === 0) {
    // Perfect match based on employment status
    score = 98;
  } else {
    // If employment status does not match, set low score so it is never recommended
    score = 25;
  }

  let matchBadge: SchemeRecommendation['matchBadge'] = 'You may be eligible';
  if (score >= 95) {
    matchBadge = '98% Match';
  } else if (score >= 90) {
    matchBadge = '95% Match';
  } else if (score >= 80) {
    matchBadge = 'Highly Recommended';
  } else {
    matchBadge = 'You may be eligible';
  }

  return {
    scheme,
    matchScore: score,
    matchBadge,
    matchReasons: reasons,
    unmetCriteria
  };
}

/**
 * Returns recommended schemes ONLY based on the user's Employment Status.
 */
export function getRecommendedSchemes(schemes: Scheme[], profile: UserProfile): SchemeRecommendation[] {
  const recommendations = schemes.map(scheme => evaluateSchemeEligibility(scheme, profile));

  // Strictly return schemes where employment status matches with 0 unmet criteria
  return recommendations
    .filter(rec => rec.unmetCriteria.length === 0 && rec.matchScore >= 80)
    .sort((a, b) => b.matchScore - a.matchScore);
}

/**
 * Filter and extract ONLY the schemes identified, recommended, or discussed in the chatbot's text response,
 * respecting the user's Employment Status.
 */
export function matchSchemesFromAiResponse(
  aiText: string,
  candidateSchemes: Scheme[],
  userProfile?: UserProfile | null
): Scheme[] {
  if (!aiText) return [];
  const textLower = aiText.toLowerCase();

  const seenIds = new Set<string>();

  // 1. Identify schemes explicitly mentioned in the chatbot's reply text
  const mentioned = candidateSchemes.filter(scheme => {
    if (userProfile) {
      const eligibility = evaluateSchemeEligibility(scheme, userProfile);
      if (eligibility.unmetCriteria.length > 0) {
        return false;
      }
    }

    const nameLower = scheme.name.toLowerCase();
    const nameWithoutParen = nameLower.replace(/\([^)]*\)/g, '').trim();

    const acronymMatch = scheme.name.match(/\(([^)]+)\)/);
    const acronym = acronymMatch ? acronymMatch[1].trim().toLowerCase() : '';

    let isMatch = false;
    if (textLower.includes(nameLower)) {
      isMatch = true;
    } else if (nameWithoutParen.length >= 6 && textLower.includes(nameWithoutParen)) {
      isMatch = true;
    } else if (acronym.length >= 3 && (textLower.includes(` ${acronym} `) || textLower.includes(`(${acronym})`) || textLower.includes(`**${acronym}**`))) {
      isMatch = true;
    } else if (scheme.slug && textLower.includes(scheme.slug.toLowerCase())) {
      isMatch = true;
    }

    if (isMatch && !seenIds.has(scheme.id)) {
      if (userProfile) {
        const evalRes = evaluateSchemeEligibility(scheme, userProfile);
        if (evalRes.unmetCriteria.length > 0) return false;
      }
      seenIds.add(scheme.id);
      return true;
    }
    return false;
  });

  if (mentioned.length > 0) {
    return mentioned;
  }

  // 2. If exact scheme names were not verbatim in text, filter strictly to schemes matching employment status
  if (userProfile) {
    const qualified = candidateSchemes
      .filter(s => {
        if (seenIds.has(s.id)) return false;
        const evalRes = evaluateSchemeEligibility(s, userProfile);
        return evalRes.unmetCriteria.length === 0;
      });

    return qualified.slice(0, 6);
  }

  return candidateSchemes.filter(s => {
    if (seenIds.has(s.id)) return false;
    seenIds.add(s.id);
    return true;
  }).slice(0, 4);
}
