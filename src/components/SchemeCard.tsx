import React from 'react';
import { 
  Building2, 
  Calendar, 
  ArrowRight, 
  CheckCircle, 
  Sparkles, 
  Clock, 
  IndianRupee,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { Scheme, SchemeRecommendation } from '../types';
import { useApp } from '../context/AppContext';

interface SchemeCardProps {
  scheme: Scheme;
  recommendation?: SchemeRecommendation;
  onViewDetails?: (scheme: Scheme) => void;
  onSelect?: (scheme: Scheme) => void;
}

export const SchemeCard: React.FC<SchemeCardProps> = ({ scheme, recommendation, onViewDetails, onSelect }) => {
  const { appliedSchemes } = useApp();
  const isApplied = appliedSchemes.some(a => a.schemeId === scheme.id);
  const applicationRecord = appliedSchemes.find(a => a.schemeId === scheme.id);

  const handleSelect = () => {
    if (onViewDetails) {
      onViewDetails(scheme);
    } else if (onSelect) {
      onSelect(scheme);
    }
  };

  // Category badge styling according to Natural Tones theme
  const getCategoryBadgeClass = (category: string) => {
    switch (category) {
      case 'Education':
      case 'Scholarships':
        return 'bg-blue-50 text-blue-600';
      case 'Agriculture':
        return 'bg-orange-50 text-orange-600';
      case 'Health':
      case 'Healthcare':
        return 'bg-emerald-50 text-emerald-600';
      case 'Business':
      case 'Employment':
        return 'bg-stone-100 text-stone-600';
      case 'Housing':
        return 'bg-red-50 text-red-600';
      case 'Women':
        return 'bg-purple-50 text-purple-600';
      default:
        return 'bg-stone-100 text-stone-600';
    }
  };

  const isDueSoon = scheme.isDeadlineApproaching || (scheme.deadlineDate && scheme.deadlineDate <= '2026-10-25');

  return (
    <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm flex flex-col justify-between hover:border-emerald-300 hover:shadow-md transition-all duration-200 group">
      
      {/* Top Banner & Badges */}
      <div>
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${getCategoryBadgeClass(scheme.category)}`}>
              {scheme.category}
            </span>
            <span className="px-2 py-0.5 bg-amber-100 text-amber-900 border border-amber-200 rounded text-[10px] font-bold">
              🏛️ {scheme.state} State
            </span>
          </div>

          {recommendation ? (
            <span className="text-emerald-600 text-xs font-bold shrink-0">
              {recommendation.matchScore}% Match
            </span>
          ) : (
            <span className="text-stone-400 text-xs font-bold shrink-0">
              Check Eligibility
            </span>
          )}
        </div>

        {/* Scheme Name */}
        <h3 
          onClick={() => onViewDetails(scheme)}
          className="font-bold text-stone-900 mb-2 leading-snug group-hover:text-emerald-800 transition-colors cursor-pointer line-clamp-2 text-sm sm:text-base"
        >
          {scheme.name}
        </h3>

        {/* Short Description */}
        <p className="text-xs text-stone-600 mb-4 line-clamp-2 leading-relaxed">
          {scheme.shortDescription}
        </p>

        {/* Financial Benefit Callout (if available) */}
        {scheme.financialBenefitAmount && (
          <div className="mb-4 px-3 py-1.5 bg-stone-50 border border-stone-200/80 rounded-lg flex items-center gap-2 text-xs font-semibold text-stone-800">
            <IndianRupee className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
            <span className="truncate">{scheme.financialBenefitAmount}</span>
          </div>
        )}
      </div>

      {/* Card Footer */}
      <div className="mt-auto pt-3 border-t border-stone-100 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className={`flex items-center text-[11px] ${isDueSoon ? 'text-red-600 font-bold' : 'text-stone-500'}`}>
            <Calendar className="w-3.5 h-3.5 mr-1.5 shrink-0" />
            <span className="truncate">Deadline: {scheme.deadline}</span>
          </div>

          {isApplied && (
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 shrink-0">
              ✓ {applicationRecord?.status || 'Applied'}
            </span>
          )}
        </div>

        <button
          id={`view-details-${scheme.id}`}
          onClick={handleSelect}
          className="w-full py-2 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-lg text-xs font-bold hover:bg-emerald-700 hover:text-white transition-all flex items-center justify-center gap-1.5"
        >
          <span>View Details</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

    </div>
  );
};
