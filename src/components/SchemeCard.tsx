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
  ShieldCheck,
  FileText
} from 'lucide-react';
import { Scheme, SchemeRecommendation } from '../types';
import { useApp } from '../context/AppContext';
import { ensureAbsoluteUrl } from '../utils/urlUtils';

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

  // Category badge styling in Green and White theme
  const getCategoryBadgeClass = (category: string) => {
    switch (category) {
      case 'Education':
      case 'Scholarships':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'Agriculture':
        return 'bg-emerald-50 text-emerald-900 border-emerald-300 font-bold';
      case 'Health':
      case 'Healthcare':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'Business':
      case 'Employment':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'Housing':
      case 'Women':
      case 'Pension':
      default:
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
    }
  };

  const isDueSoon = scheme.isDeadlineApproaching || (scheme.deadlineDate && scheme.deadlineDate <= '2026-10-25');

  return (
    <div className="bg-white p-5 rounded-xl border border-emerald-200 shadow-xs flex flex-col justify-between hover:border-emerald-400 hover:shadow-md transition-all duration-200 group">
      
      {/* Top Banner & Badges */}
      <div>
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${getCategoryBadgeClass(scheme.category)}`}>
              {scheme.category}
            </span>
            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-900 border border-emerald-300 rounded text-[10px] font-bold">
              {scheme.state} State
            </span>
          </div>

          {recommendation ? (
            <span className="text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-xs font-bold shrink-0">
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
          onClick={handleSelect}
          className="font-bold text-stone-900 mb-2 leading-snug group-hover:text-emerald-800 transition-colors cursor-pointer line-clamp-2 text-sm sm:text-base"
        >
          {scheme.name}
        </h3>

        {/* Short Description */}
        <p className="text-xs text-stone-600 mb-3 line-clamp-2 leading-relaxed">
          {scheme.shortDescription}
        </p>

        {/* Financial Benefit Callout */}
        {scheme.financialBenefitAmount && (
          <div className="mb-3 px-3 py-1.5 bg-stone-50 border border-stone-200 rounded-lg flex items-center gap-2 text-xs font-semibold text-stone-800">
            <IndianRupee className="w-3.5 h-3.5 text-emerald-800 shrink-0" />
            <span className="truncate">{scheme.financialBenefitAmount}</span>
          </div>
        )}

        {/* REQUIRED DOCUMENTS TO APPLY SECTION */}
        {scheme.requiredDocuments && scheme.requiredDocuments.length > 0 && (
          <div className="mb-3 p-2.5 bg-stone-50/80 rounded-lg border border-stone-200">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-stone-800 mb-1.5">
              <FileText className="w-3.5 h-3.5 text-emerald-800 shrink-0" />
              <span>Required Documents to Apply:</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {scheme.requiredDocuments.slice(0, 3).map((doc, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-white border border-stone-200 rounded text-[10px] text-stone-700 font-medium"
                >
                  <span className="text-emerald-800 font-bold">✓</span>
                  <span className="truncate max-w-[130px] sm:max-w-[170px]" title={doc}>{doc}</span>
                </span>
              ))}
              {scheme.requiredDocuments.length > 3 && (
                <span 
                  onClick={handleSelect}
                  className="px-1.5 py-0.5 bg-stone-100 hover:bg-stone-200 border border-stone-200 rounded text-[10px] text-stone-600 font-bold cursor-pointer transition-colors"
                  title="Click to view all required documents"
                >
                  +{scheme.requiredDocuments.length - 3} more
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Card Footer */}
      <div className="mt-auto pt-3 border-t border-stone-100 space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className={`flex items-center text-[11px] ${isDueSoon ? 'text-red-600 font-bold' : 'text-stone-500'}`}>
            <Calendar className="w-3.5 h-3.5 mr-1.5 shrink-0" />
            <span className="truncate">Deadline: {scheme.deadline}</span>
          </div>

          {isApplied && (
            <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 shrink-0">
              ✓ {applicationRecord?.status || 'Applied'}
            </span>
          )}
        </div>

        {/* Action Buttons: View Details & Apply on Official Portal */}
        <div className="grid grid-cols-2 gap-2">
          <button
            id={`view-details-${scheme.id}`}
            onClick={handleSelect}
            className="w-full py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-200 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
          >
            <span>View Details</span>
            <ArrowRight className="w-3 h-3 text-stone-600" />
          </button>

          <a
            id={`apply-portal-${scheme.id}`}
            href={ensureAbsoluteUrl(scheme.officialWebsite || 'https://www.myscheme.gov.in')}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="w-full py-2 bg-emerald-800 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 shadow-2xs cursor-pointer text-center"
          >
            <span>Official Portal</span>
            <ExternalLink className="w-3 h-3 text-white" />
          </a>
        </div>
      </div>

    </div>
  );
};
