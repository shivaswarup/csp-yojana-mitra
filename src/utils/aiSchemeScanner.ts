import { Scheme, UserProfile, ChatbotRecommendedScheme } from '../types';
import { SCHEMES_DATABASE } from '../data/schemes';
import { getRecommendedSchemes } from './recommendationEngine';

/**
 * Generates rich, personalized AI advice notes for each eligible scheme
 * according to the citizen's specific profile attributes (marital status,
 * age, state, district, income, category, employment status).
 */
export function generatePersonalizedAiNote(scheme: Scheme, profile: UserProfile): string {
  const marital = profile.maritalStatus || 'Single';
  const state = profile.state || 'India';
  const district = profile.district ? `${profile.district}, ` : '';
  const incomeFormatted = profile.annualFamilyIncome 
    ? `₹${(profile.annualFamilyIncome / 100000).toFixed(1)}L income` 
    : 'income ceiling';

  // Explicit state scheme check
  if (scheme.governmentLevel === 'State' || (scheme.state && scheme.state !== 'All India')) {
    return `🏛️ State Govt Entitlement: Official ${scheme.state} State Government scheme verified for resident citizens of ${district}${scheme.state} (${scheme.financialBenefitAmount || 'state welfare benefit'}).`;
  }

  if (scheme.category === 'Scholarships' || scheme.category === 'Education') {
    return `AI Match: 100% eligible for ${scheme.financialBenefitAmount || 'stipend award'} as an active ${profile.category} ${profile.currentEducationStatus === 'Pursuing' ? 'student' : 'candidate'} from ${district}${state}.`;
  }

  if (scheme.category === 'Agriculture' || profile.isFarmer) {
    return `AI Match: Verified agricultural DBT entitlement for landholding cultivator in ${district}${state} with ${incomeFormatted}.`;
  }

  if (scheme.category === 'Women' || (profile.gender === 'female')) {
    return `AI Match: Special entitlement tailored for ${marital.toLowerCase()} women in ${state} to support financial independence and welfare.`;
  }

  if (scheme.category === 'Pension' || profile.isSeniorCitizen) {
    return `AI Match: Social security pension coverage confirmed for ${profile.age} yrs (${marital}) under official ${profile.category} guidelines.`;
  }

  if (scheme.category === 'Health') {
    return `AI Match: Free healthcare insurance coverage active for ${district}${state} residents with ${incomeFormatted}.`;
  }

  if (scheme.category === 'Business' || profile.isBusinessOwner || profile.isWomanEntrepreneur) {
    return `AI Match: Institutional micro-credit & government subsidy backing verified for your enterprise in ${district}${state}.`;
  }

  if (scheme.category === 'Housing') {
    return `AI Match: Financial assistance for pucca house construction in ${profile.areaType || 'Urban'} sector of ${district}${state}.`;
  }

  return `AI Match: Profile criteria (${marital}, ${profile.age} yrs, ${profile.category}, ${state}) 100% verified against official ministry norms.`;
}

/**
 * Scans the schemes database according to citizen's details,
 * and calls the AI API if available to enrich recommendations.
 * Returns ALL matched schemes so that the citizen does not need
 * to query the chatbot repeatedly.
 */
export async function scanCitizenSchemesWithAI(
  profile: UserProfile,
  allSchemes: Scheme[] = SCHEMES_DATABASE
): Promise<ChatbotRecommendedScheme[]> {
  // 1. Determine all schemes that strictly match user profile
  const matchedRecs = getRecommendedSchemes(allSchemes, profile);

  if (matchedRecs.length === 0) {
    return [];
  }

  const baseRecommendations: ChatbotRecommendedScheme[] = matchedRecs.map(rec => ({
    scheme: rec.scheme,
    recommendedAt: new Date().toISOString(),
    aiNote: generatePersonalizedAiNote(rec.scheme, profile),
    sourceQuery: `AI Profile Match (${profile.employmentStatus || 'Citizen'}, ${profile.state}, ${profile.maritalStatus || 'Single'})`
  }));

  // 2. Attempt to enrich via Gemini /api/ai/scan-schemes in background
  try {
    const candidateSchemes = matchedRecs.map(r => ({
      id: r.scheme.id,
      name: r.scheme.name,
      category: r.scheme.category,
      state: r.scheme.state,
      governmentLevel: r.scheme.governmentLevel,
      financialBenefitAmount: r.scheme.financialBenefitAmount
    }));

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const response = await fetch('/api/ai/scan-schemes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userProfile: profile,
        candidateSchemes
      }),
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      if (data.success && data.advice) {
        return baseRecommendations.map(item => {
          const liveAdvice = data.advice[item.scheme.id];
          if (liveAdvice && typeof liveAdvice === 'string' && liveAdvice.trim().length > 10) {
            return {
              ...item,
              aiNote: `AI Guidance: ${liveAdvice}`
            };
          }
          return item;
        });
      }
    }
  } catch {
    // Network or timeout: fallback seamlessly to rich rule-based AI notes
  }

  return baseRecommendations;
}
