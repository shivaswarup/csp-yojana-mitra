import React, { useMemo, useState, useEffect } from 'react';
import { 
  Sparkles, 
  Bot, 
  Landmark, 
  MapPin, 
  Loader2,
  X,
  Eye,
  CheckCircle2
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { SCHEMES_DATABASE } from '../data/schemes';
import { Scheme, UserProfile } from '../types';
import { evaluateSchemeEligibility, matchSchemesFromAiResponse } from '../utils/recommendationEngine';
import { AiTextResponsePanel } from './AiTextResponsePanel';

interface HomeViewProps {
  onSelectScheme: (scheme: Scheme) => void;
}

export const HomeView: React.FC<HomeViewProps> = () => {
  const { 
    currentUser, 
    isAskingStateSchemes,
    askChatbotForStateSchemes,
    stateChatbotAnswer,
    clearStateChatbotAnswer
  } = useApp();

  const [stateAiReply, setStateAiReply] = useState<string>('');

  // Close / Open state for State schemes panel
  const [isStatePanelClosed, setIsStatePanelClosed] = useState<boolean>(false);

  // Active state is strictly derived from user's domicile (default Andhra Pradesh)
  const activeStateName = currentUser?.state || 'Andhra Pradesh';

  // Effective user profile to ensure AI evaluation strictly checks eligibility based on Employment Status
  const effectiveProfile: UserProfile = useMemo(() => {
    if (currentUser) {
      return currentUser;
    }
    // Baseline profile for evaluation when guest
    return {
      id: 'guest-profile',
      email: 'guest@yojanamitra.gov.in',
      name: 'Citizen',
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=guest',
      age: 21,
      gender: 'male',
      state: activeStateName,
      district: 'Guntur',
      areaType: 'Urban',
      maritalStatus: 'Single',
      highestEducation: 'Undergraduate (UG)',
      currentEducationStatus: 'Pursuing',
      isStudent: true,
      category: 'OBC',
      isDisability: false,
      isMinority: false,
      annualFamilyIncome: 250000,
      employmentStatus: 'Student',
      isFarmer: false,
      isBusinessOwner: false,
      isWomanEntrepreneur: false,
      isSeniorCitizen: false,
      isBPLOrEWS: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }, [currentUser, activeStateName]);

  // Helper function to deduplicate schemes strictly
  const deduplicateSchemes = (list: Scheme[]): Scheme[] => {
    const seen = new Set<string>();
    return list.filter(scheme => {
      if (!scheme || !scheme.id) return false;
      if (seen.has(scheme.id)) return false;
      seen.add(scheme.id);
      return true;
    });
  };

  // -------------------------------------------------------------------
  // 1. STATE SCHEMES (EVALUATED BY YOJANA MITRA AI CHATBOT)
  // -------------------------------------------------------------------
  const [stateAiSchemes, setStateAiSchemes] = useState<Scheme[]>([]);

  // All schemes enacted by this active state
  const allStateSchemesPool = useMemo(() => {
    const list = SCHEMES_DATABASE.filter(s => {
      if (s.governmentLevel === 'Central' || s.state === 'All India') return false;
      const stateMatch = s.state.toLowerCase() === activeStateName.toLowerCase() ||
        (s.eligibilityRules?.states?.some(st => st.toLowerCase() === activeStateName.toLowerCase()) ?? false);
      return stateMatch;
    });
    return deduplicateSchemes(list);
  }, [activeStateName]);

  // Eligible pool of state schemes matching user profile
  const eligibleStatePool = useMemo(() => {
    const list = allStateSchemesPool.filter(s => {
      const evalRes = evaluateSchemeEligibility(s, effectiveProfile);
      return evalRes.unmetCriteria.length === 0;
    });
    return deduplicateSchemes(list);
  }, [allStateSchemesPool, effectiveProfile]);

  // Immediately clear previous AI responses when user updates their profile details
  useEffect(() => {
    setStateAiSchemes([]);
    setStateAiReply('');
    clearStateChatbotAnswer();
  }, [
    currentUser?.updatedAt,
    currentUser?.employmentStatus,
    currentUser?.annualFamilyIncome,
    currentUser?.state
  ]);

  // Handle Ask AI for State Schemes
  const handleAskStateAi = async () => {
    setIsStatePanelClosed(false);
    const result = await askChatbotForStateSchemes(activeStateName);
    if (result && result.reply) {
      setStateAiReply(result.reply);
    }
    if (result.foundSchemes && result.foundSchemes.length > 0) {
      const strictlyEligible = result.foundSchemes.filter(s => {
        const evalRes = evaluateSchemeEligibility(s, effectiveProfile);
        return evalRes.unmetCriteria.length === 0;
      });
      setStateAiSchemes(deduplicateSchemes(strictlyEligible));
    } else {
      const matched = matchSchemesFromAiResponse(result.reply, eligibleStatePool, effectiveProfile);
      setStateAiSchemes(deduplicateSchemes(matched));
    }
  };

  // Handle Clear or Close for State Schemes
  const handleClearStateSchemes = () => {
    setIsStatePanelClosed(true);
    setStateAiReply('');
    setStateAiSchemes([]);
    clearStateChatbotAnswer();
  };

  // Pre-computed verified text response for eligible State schemes using exact numbered format
  const defaultStateResponse = useMemo(() => {
    if (eligibleStatePool.length === 0) {
      return `No active State Government schemes currently match your employment status (${effectiveProfile.employmentStatus}) in ${activeStateName}. Please update your profile details or ask the Yojana Mitra AI Chatbot.`;
    }
    return eligibleStatePool.map((scheme, idx) => {
      const criteriaText = scheme.eligibilityCriteria && scheme.eligibilityCriteria.length > 0 
        ? scheme.eligibilityCriteria.join(', ')
        : (scheme.eligibility && scheme.eligibility.length > 0 ? scheme.eligibility.join(', ') : `Resident of ${activeStateName}, meets ${effectiveProfile.employmentStatus} criteria`);
      const documentsText = scheme.documentsRequired && scheme.documentsRequired.length > 0
        ? scheme.documentsRequired.join(', ')
        : (scheme.requiredDocuments && scheme.requiredDocuments.length > 0 ? scheme.requiredDocuments.join(', ') : 'Aadhaar Card, State Domicile Certificate, Income Certificate, Bank Passbook');
      const requirements = `${criteriaText}. Documents Required: ${documentsText}`;
      const suitReason = `Official initiative of Government of ${activeStateName} tailored directly for your employment status as ${effectiveProfile.employmentStatus}.`;
      const deadline = scheme.applicationDeadline || scheme.deadline || 'Check Official Portal';
      const portalLink = scheme.applicationLink || scheme.officialWebsite || 'https://myscheme.gov.in';

      return `${idx + 1}.
**Scheme Name:** ${scheme.name}
**Requirements:** ${requirements}
**Why it suits you:** ${suitReason}
**Deadline:** ${deadline}
**Official Portal Link:** [Official Portal](${portalLink})`;
    }).join('\n\n');
  }, [eligibleStatePool, activeStateName, effectiveProfile.employmentStatus]);

  // -------------------------------------------------------------------
  // AUTOMATIC AI EVALUATION UPON SHOWING SCHEMES
  // When showing schemes, ask Yojana Mitra AI Chatbot for eligible schemes
  // -------------------------------------------------------------------
  useEffect(() => {
    if (!isStatePanelClosed && !stateChatbotAnswer && !isAskingStateSchemes) {
      handleAskStateAi();
    }
  }, [
    activeStateName,
    effectiveProfile.employmentStatus
  ]);

  return (
    <div className="space-y-10 pb-16">

      {/* ==================================================== */}
      {/* SECTION 1: STATE SCHEMES (YOJANA MITRA AI EVALUATED) */}
      {/* ==================================================== */}
      <section className="space-y-4">
        
        {/* State Section Header */}
        <div className="bg-white rounded-2xl border border-amber-200/80 p-4 sm:p-5 shadow-xs space-y-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-amber-100 text-amber-900 shadow-2xs">
                  <Landmark className="w-5 h-5" />
                </span>
                <div>
                  <h2 className="text-xl font-bold text-stone-900 tracking-tight flex items-center gap-2">
                    <span>Government of {activeStateName} Schemes</span>
                    {isStatePanelClosed && (
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-stone-100 text-stone-600 border border-stone-300">
                        Closed
                      </span>
                    )}
                  </h2>
                  <p className="text-xs text-stone-600">
                    Official welfare programs and scholarships evaluated for {effectiveProfile.employmentStatus} by Yojana Mitra AI.
                  </p>
                </div>
              </div>
            </div>

            {/* Actions: Domicile, Toggle Close/Open & Re-evaluate Action */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Profile Domicile Badge */}
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-stone-100 border border-stone-200 rounded-lg text-xs">
                <MapPin className="w-3.5 h-3.5 text-stone-500" />
                <span className="text-stone-500 text-[11px]">Your Domicile:</span>
                <span className="font-bold text-stone-800">{activeStateName}</span>
              </div>

              {/* Close or Open Toggle Button in Header */}
              {isStatePanelClosed ? (
                <button
                  onClick={() => setIsStatePanelClosed(false)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold rounded-lg border border-amber-300 transition-all cursor-pointer"
                  title="Open State Schemes panel"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Open Panel</span>
                </button>
              ) : (
                <button
                  onClick={handleClearStateSchemes}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-white hover:bg-red-50 text-stone-600 hover:text-red-700 text-xs font-bold rounded-lg border border-stone-200 hover:border-red-300 transition-all cursor-pointer"
                  title="Close State Schemes panel"
                >
                  <X className="w-3.5 h-3.5 text-stone-400 hover:text-red-600" />
                  <span>Close</span>
                </button>
              )}

              {/* Ask AI / Re-evaluate Button */}
              <button
                onClick={handleAskStateAi}
                disabled={isAskingStateSchemes}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-700 hover:bg-amber-800 active:bg-amber-900 text-white text-xs font-bold rounded-lg shadow-xs hover:shadow-md transition-all cursor-pointer disabled:opacity-50"
                title={`Ask Yojana Mitra AI to evaluate ${activeStateName} schemes you are eligible for`}
              >
                {isAskingStateSchemes ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Bot className="w-3.5 h-3.5" />
                )}
                <Sparkles className="w-3.5 h-3.5 text-amber-200" />
                <span>{isAskingStateSchemes ? 'Evaluating with AI...' : 'Re-evaluate with AI'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* State Schemes Display: Evaluating with AI vs Closed Panel vs Yojana Mitra AI Text Response Panel */}
        {isAskingStateSchemes ? (
          <div className="bg-amber-50/70 rounded-2xl border border-amber-200 p-8 text-center space-y-3">
            <div className="inline-flex items-center justify-center p-3 bg-amber-100 text-amber-800 rounded-full mb-1">
              <Bot className="w-6 h-6 animate-pulse" />
            </div>
            <div className="flex items-center justify-center gap-2 text-sm font-bold text-amber-950">
              <Loader2 className="w-4 h-4 animate-spin text-amber-700" />
              <span>Yojana Mitra AI Chatbot is evaluating Government of {activeStateName} schemes for {effectiveProfile.employmentStatus}...</span>
            </div>
            <p className="text-xs text-stone-600 max-w-md mx-auto">
              Reviewing verified state welfare schemes tailored strictly for your employment status as a {effectiveProfile.employmentStatus}.
            </p>
          </div>
        ) : isStatePanelClosed ? (
          /* Sleek, interactive closed state when user clicks Close */
          <div className="bg-amber-50/40 rounded-2xl border border-amber-200/80 p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
                <Landmark className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                  <span>Government of {activeStateName} Schemes Panel (Closed)</span>
                </h4>
                <p className="text-xs text-stone-500 mt-0.5">
                  This section has been closed. Click below to view active {activeStateName} schemes for {effectiveProfile.employmentStatus} or re-evaluate with AI.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setIsStatePanelClosed(false)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white hover:bg-amber-50 text-amber-950 text-xs font-bold rounded-lg border border-amber-300 shadow-2xs transition-all cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Open State Schemes</span>
              </button>
              <button
                onClick={handleAskStateAi}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-800 hover:bg-amber-900 text-white text-xs font-bold rounded-lg shadow-2xs transition-all cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Re-evaluate with AI</span>
              </button>
            </div>
          </div>
        ) : (
          <AiTextResponsePanel
            title={`Government of ${activeStateName} Schemes & Scholarships`}
            subtitle={`Official welfare initiatives evaluated for ${effectiveProfile.employmentStatus} by Yojana Mitra AI Chatbot`}
            response={stateChatbotAnswer?.text || stateAiReply || defaultStateResponse}
            timestamp={stateChatbotAnswer?.timestamp}
            theme="amber"
            stateName={activeStateName}
            relevantSchemes={stateAiSchemes.length > 0 ? stateAiSchemes : eligibleStatePool}
            discussPrompt={`Tell me more about active state welfare schemes and scholarships in ${activeStateName} for ${effectiveProfile.employmentStatus} that I am eligible for.`}
            onClear={handleClearStateSchemes}
          />
        )}
      </section>

    </div>
  );
};
