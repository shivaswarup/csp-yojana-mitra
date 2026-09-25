import React, { useState, useMemo } from 'react';
import { 
  Sparkles, 
  Copy, 
  Check, 
  ExternalLink, 
  FileText, 
  LayoutGrid, 
  CheckCircle2, 
  Calendar, 
  ShieldCheck, 
  Link2,
  ArrowRight,
  Filter
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { SchemeCard } from './SchemeCard';
import { Scheme, SchemeRecommendation, UserProfile } from '../types';

interface RecommendedViewProps {
  onSelectScheme: (scheme: Scheme) => void;
}

interface FormattedSchemeText {
  number: number;
  schemeName: string;
  requirements: string;
  whyItSuitsYou: string;
  deadline: string;
  officialPortalLink: string;
  rawText: string;
  rec: SchemeRecommendation;
}

export const RecommendedView: React.FC<RecommendedViewProps> = ({ onSelectScheme }) => {
  const { currentUser, recommendedSchemes, setActiveTab } = useApp();
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'high_match' | 'scholarships' | 'subsidies'>('all');
  const [viewMode, setViewMode] = useState<'text' | 'cards'>('text');
  const [copiedAll, setCopiedAll] = useState<boolean>(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Effective profile fallback for guest
  const effectiveProfile: UserProfile = useMemo(() => {
    if (currentUser) return currentUser;
    return {
      id: 'guest-profile',
      email: 'guest@yojanamitra.gov.in',
      name: 'Citizen',
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=guest',
      age: 21,
      gender: 'male',
      state: 'Andhra Pradesh',
      district: 'Visakhapatnam',
      areaType: 'Urban',
      maritalStatus: 'Single',
      highestEducation: 'Undergraduate (UG)',
      currentEducationStatus: 'Pursuing',
      courseStream: 'B.Tech / Degree',
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
      isBPLOrEWS: true,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z'
    };
  }, [currentUser]);

  const activeProfile = currentUser || effectiveProfile;

  // Filter schemes
  const filtered = useMemo(() => {
    return recommendedSchemes.filter(({ scheme, matchScore }) => {
      if (selectedFilter === 'high_match') return matchScore >= 90;
      if (selectedFilter === 'scholarships') return scheme.category === 'Scholarships' || scheme.category === 'Education';
      if (selectedFilter === 'subsidies') return scheme.category === 'Agriculture' || scheme.category === 'Business' || scheme.category === 'Housing';
      return true;
    });
  }, [recommendedSchemes, selectedFilter]);

  // Format all eligible schemes into text format
  const formattedSchemes: FormattedSchemeText[] = useMemo(() => {
    return filtered.map((rec, index) => {
      const { scheme, matchReasons } = rec;
      const num = index + 1;
      const schemeName = scheme.name;

      const eligibilityList = scheme.eligibility && scheme.eligibility.length > 0
        ? scheme.eligibility.join('; ')
        : 'Citizens satisfying age, domicile, category, and income limits';
      const documentsList = scheme.requiredDocuments && scheme.requiredDocuments.length > 0
        ? scheme.requiredDocuments.join(', ')
        : 'Aadhaar Card, Active Bank Account, Income & Category Certificates';

      const requirements = `Eligibility: ${eligibilityList}. Required Documents: ${documentsList}.`;

      // Why it suits you
      const matchedDetails = matchReasons && matchReasons.length > 0
        ? matchReasons.filter(r => r.matched).map(r => r.detail)
        : [];
      
      const whyItSuitsYou = matchedDetails.length > 0
        ? matchedDetails.join(' ')
        : `Matches your verified profile details as a ${activeProfile.age}-year-old resident of ${activeProfile.state}, belonging to ${activeProfile.category} category, with annual family income under the ceiling.`;

      const deadline = scheme.deadline || 'Check Official Portal';
      const officialPortalLink = scheme.officialWebsite;

      const rawText = `${num}.
Scheme Name: ${schemeName}
Requirements: ${requirements}
Why it suits you: ${whyItSuitsYou}
Deadline: ${deadline}
Official Portal Link: ${officialPortalLink}`;

      return {
        number: num,
        schemeName,
        requirements,
        whyItSuitsYou,
        deadline,
        officialPortalLink,
        rawText,
        rec
      };
    });
  }, [filtered, activeProfile]);

  // Copy full text representation of all eligible schemes
  const handleCopyAll = () => {
    const fullText = formattedSchemes.map(s => s.rawText).join('\n\n');
    navigator.clipboard.writeText(fullText);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2500);
  };

  // Copy single scheme text
  const handleCopySingle = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-emerald-800 text-white rounded-2xl p-6 sm:p-8 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-xs text-white text-xs font-semibold px-3 py-1 rounded-full border border-white/30">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Scheme Recommendation System</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Personalized Entitlement Matching
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100 max-w-2xl leading-relaxed">
              Recommended exclusively based on your employment status ({activeProfile.employmentStatus}) and domicile ({activeProfile.state}).
            </p>
          </div>

          <button
            onClick={() => setActiveTab('profile')}
            className="px-4 py-2 bg-white text-emerald-900 hover:bg-stone-100 font-bold text-xs rounded-xl shadow-xs transition-colors shrink-0 cursor-pointer"
          >
            Refine Profile Parameters
          </button>
        </div>

        {/* Profile Summary Snapshot */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-white/20 text-xs">
          <div className="bg-black/10 rounded-xl p-2.5">
            <div className="text-emerald-200 text-[10px]">Income Ceiling</div>
            <div className="font-bold text-white mt-0.5">₹{(activeProfile.annualFamilyIncome || 0).toLocaleString('en-IN')}/yr</div>
          </div>
          <div className="bg-black/10 rounded-xl p-2.5">
            <div className="text-emerald-200 text-[10px]">Category / Status</div>
            <div className="font-bold text-white mt-0.5">{activeProfile.category} • {activeProfile.areaType}</div>
          </div>
          <div className="bg-black/10 rounded-xl p-2.5">
            <div className="text-emerald-200 text-[10px]">Education Level</div>
            <div className="font-bold text-white mt-0.5 truncate">{activeProfile.highestEducation}</div>
          </div>
          <div className="bg-black/10 rounded-xl p-2.5">
            <div className="text-emerald-200 text-[10px]">Primary Matches</div>
            <div className="font-bold text-emerald-300 mt-0.5">{recommendedSchemes.length} Schemes Eligible</div>
          </div>
        </div>
      </div>

      {/* Filter Tabs & View Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200 pb-3">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1 sm:pb-0">
          <button
            onClick={() => setSelectedFilter('all')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors shrink-0 cursor-pointer ${
              selectedFilter === 'all'
                ? 'bg-emerald-800 text-white'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            All Recommendations ({recommendedSchemes.length})
          </button>
          <button
            onClick={() => setSelectedFilter('high_match')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors shrink-0 cursor-pointer ${
              selectedFilter === 'high_match'
                ? 'bg-emerald-800 text-white'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            🌟 90%+ High Match ({recommendedSchemes.filter(r => r.matchScore >= 90).length})
          </button>
          <button
            onClick={() => setSelectedFilter('scholarships')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors shrink-0 cursor-pointer ${
              selectedFilter === 'scholarships'
                ? 'bg-emerald-800 text-white'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            🎓 Scholarships & Education
          </button>
          <button
            onClick={() => setSelectedFilter('subsidies')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors shrink-0 cursor-pointer ${
              selectedFilter === 'subsidies'
                ? 'bg-emerald-800 text-white'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            🌾 Agri, Business & Housing
          </button>
        </div>

        {/* View Toggle & Copy All */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleCopyAll}
            disabled={formattedSchemes.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold rounded-lg transition-colors cursor-pointer disabled:opacity-50"
            title="Copy all eligible schemes in text format to clipboard"
          >
            {copiedAll ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700">Copied All Text!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-stone-600" />
                <span>Copy All as Text</span>
              </>
            )}
          </button>

          <div className="flex items-center bg-stone-100 p-0.5 rounded-lg border border-stone-200">
            <button
              onClick={() => setViewMode('text')}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                viewMode === 'text'
                  ? 'bg-white text-emerald-900 shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
              title="Numbered Text Format"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Text Format</span>
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                viewMode === 'cards'
                  ? 'bg-white text-emerald-900 shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
              title="Card Grid View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Cards</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {viewMode === 'text' ? (
        /* ==================================================== */
        /* NUMBERED TEXT FORMAT VIEW                            */
        /* ==================================================== */
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-stone-500 px-1">
            <span>
              Showing <strong>{formattedSchemes.length}</strong> eligible schemes in structured text format
            </span>
            <span>Represented with: Scheme Name, Requirements, Why it suits you, Deadline, Official Portal Link</span>
          </div>

          <div className="space-y-4 font-sans">
            {formattedSchemes.map((item, idx) => (
              <div
                key={item.rec.scheme.id}
                id={`eligible-scheme-text-${item.number}`}
                className="bg-white border border-stone-200 hover:border-emerald-300 rounded-2xl p-5 sm:p-6 shadow-2xs hover:shadow-xs transition-all space-y-4 relative group"
              >
                {/* Header with Number & Scheme Name */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b border-stone-100">
                  <div className="flex items-start gap-3">
                    <span className="shrink-0 flex items-center justify-center w-8 h-8 rounded-xl bg-emerald-100 text-emerald-900 font-extrabold text-sm border border-emerald-200">
                      {item.number}.
                    </span>
                    <div className="space-y-1">
                      <div className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
                        Scheme Name:
                      </div>
                      <h2 className="text-base sm:text-lg font-bold text-stone-900 tracking-tight leading-snug">
                        {item.schemeName}
                      </h2>
                      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-stone-100 text-stone-700">
                          {item.rec.scheme.category}
                        </span>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                          Government of {item.rec.scheme.state}
                        </span>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          {item.rec.matchBadge}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Scheme Action Buttons */}
                  <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                    <button
                      onClick={() => handleCopySingle(item.rawText, idx)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-stone-600 hover:text-stone-900 bg-stone-50 hover:bg-stone-100 border border-stone-200 rounded-lg transition-colors cursor-pointer"
                      title="Copy this scheme in text format"
                    >
                      {copiedIndex === idx ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span className="text-emerald-700 text-[11px]">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3 text-stone-500" />
                          <span className="text-[11px]">Copy Text</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => onSelectScheme(item.rec.scheme)}
                      className="inline-flex items-center gap-1 px-3 py-1 text-xs font-bold text-emerald-900 hover:text-white bg-emerald-50 hover:bg-emerald-800 border border-emerald-200 hover:border-emerald-800 rounded-lg transition-colors cursor-pointer"
                    >
                      <span>View Details</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Structured Text Fields */}
                <div className="space-y-3.5 text-xs sm:text-sm">
                  {/* Requirements */}
                  <div className="space-y-1 bg-stone-50/70 p-3.5 rounded-xl border border-stone-200/80">
                    <span className="font-bold text-stone-900 block text-xs uppercase tracking-wider">
                      Requirements:
                    </span>
                    <p className="text-stone-700 leading-relaxed">
                      {item.requirements}
                    </p>
                  </div>

                  {/* Why it suits you */}
                  <div className="space-y-1 bg-emerald-50/60 p-3.5 rounded-xl border border-emerald-200/80">
                    <span className="font-bold text-emerald-950 block text-xs uppercase tracking-wider">
                      Why it suits you:
                    </span>
                    <p className="text-emerald-900 leading-relaxed font-medium">
                      {item.whyItSuitsYou}
                    </p>
                  </div>

                  {/* Deadline */}
                  <div className="flex flex-wrap items-center gap-2 bg-amber-50/60 px-3.5 py-2.5 rounded-xl border border-amber-200/80">
                    <span className="font-bold text-amber-950 text-xs uppercase tracking-wider">
                      Deadline:
                    </span>
                    <span className="font-bold text-amber-900 text-xs sm:text-sm">
                      {item.deadline}
                    </span>
                  </div>

                  {/* Official Portal Link (at the last) */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-stone-100/80 px-3.5 py-3 rounded-xl border border-stone-200">
                    <div className="space-y-0.5 min-w-0">
                      <span className="font-bold text-stone-900 text-xs uppercase tracking-wider block">
                        Official Portal Link:
                      </span>
                      <a
                        href={item.officialPortalLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-emerald-800 hover:text-emerald-900 hover:underline break-all text-xs inline-flex items-center gap-1 font-semibold"
                      >
                        <span>{item.officialPortalLink}</span>
                        <ExternalLink className="w-3 h-3 shrink-0" />
                      </a>
                    </div>

                    <a
                      href={item.officialPortalLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold rounded-lg shadow-2xs transition-colors shrink-0 cursor-pointer self-start sm:self-auto"
                    >
                      <span>Visit Portal</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>

              </div>
            ))}
          </div>
        </div>
      ) : (
        /* ==================================================== */
        /* CARD GRID VIEW                                       */
        /* ==================================================== */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((rec) => (
            <SchemeCard
              key={rec.scheme.id}
              scheme={rec.scheme}
              recommendation={rec}
              onViewDetails={onSelectScheme}
            />
          ))}
        </div>
      )}

      {filtered.length === 0 && (
        <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center max-w-md mx-auto space-y-3">
          <p className="text-stone-700 font-bold text-sm">No schemes in this filter tab</p>
          <button
            onClick={() => setSelectedFilter('all')}
            className="px-4 py-2 text-xs font-bold bg-emerald-800 text-white rounded-lg hover:bg-emerald-700 cursor-pointer"
          >
            Show All Recommended Schemes
          </button>
        </div>
      )}

    </div>
  );
};

