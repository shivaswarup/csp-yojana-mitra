import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Building2, 
  Calendar, 
  ExternalLink, 
  CheckCircle2, 
  ShieldCheck, 
  FileText, 
  Sparkles, 
  HelpCircle, 
  Send, 
  Info, 
  ListChecks, 
  IndianRupee, 
  CheckSquare, 
  Square,
  AlertCircle,
  Clock
} from 'lucide-react';
import { Scheme, SchemeRecommendation } from '../types';
import { useApp } from '../context/AppContext';
import { evaluateSchemeEligibility } from '../utils/recommendationEngine';

interface SchemeDetailsProps {
  scheme: Scheme;
  onBack: () => void;
}

export const SchemeDetails: React.FC<SchemeDetailsProps> = ({ scheme, onBack }) => {
  const { currentUser, appliedSchemes, applyForScheme } = useApp();
  
  const [checkedDocs, setCheckedDocs] = useState<Record<string, boolean>>({});
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResponses, setAiResponses] = useState<{ question: string; answer: string }[]>([]);
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [appNotes, setAppNotes] = useState('');
  const [appRefNo, setAppRefNo] = useState('');

  const isApplied = appliedSchemes.some(a => a.schemeId === scheme.id);
  const applicationRecord = appliedSchemes.find(a => a.schemeId === scheme.id);

  // Compute recommendation match reasons specifically for this user
  const recommendation = currentUser ? evaluateSchemeEligibility(scheme, currentUser) : null;

  const toggleDoc = (doc: string) => {
    setCheckedDocs(prev => ({
      ...prev,
      [doc]: !prev[doc]
    }));
  };

  const handleAskAI = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!aiQuestion.trim()) return;

    const q = aiQuestion.trim();
    setAiQuestion('');
    setAiLoading(true);

    try {
      const res = await fetch('/api/ai/ask-scheme', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schemeName: scheme.name,
          schemeDetails: {
            description: scheme.description,
            benefits: scheme.benefits,
            eligibility: scheme.eligibility,
            requiredDocuments: scheme.requiredDocuments,
            applicationProcess: scheme.applicationProcess,
            officialWebsite: scheme.officialWebsite,
            deadline: scheme.deadline
          },
          userQuery: q,
          userProfile: currentUser
        })
      });
      const data = await res.json();
      setAiResponses(prev => [{ question: q, answer: data.answer || 'No response available.' }, ...prev]);
    } catch (err: any) {
      setAiResponses(prev => [{ question: q, answer: 'Note: Please check the official government portal guidelines for detailed clarification.' }, ...prev]);
    } finally {
      setAiLoading(false);
    }
  };

  const handleConfirmApply = () => {
    applyForScheme(scheme, appNotes, appRefNo);
    setShowApplicationModal(false);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      
      {/* Top Breadcrumb & Navigation */}
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-stone-200 text-stone-700 bg-white hover:bg-stone-50 hover:text-stone-900 text-xs font-semibold shadow-2xs transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Schemes</span>
        </button>

        <div className="flex items-center gap-2">
          {isApplied ? (
            <span className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1.5 rounded-lg border border-emerald-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-800" />
              Status: {applicationRecord?.status || 'Applied'}
            </span>
          ) : (
            <button
              id="mark-as-applied-top"
              onClick={() => setShowApplicationModal(true)}
              className="inline-flex items-center gap-1.5 bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-1.5 rounded-lg shadow-xs transition-colors"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Mark as Applied</span>
            </button>
          )}

          <a
            href={scheme.officialWebsite}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-1.5 rounded-lg shadow-xs transition-colors"
          >
            <span>Apply on Official Portal</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Scheme Header Card */}
      <div className="bg-white rounded-xl border border-stone-200 p-6 md:p-8 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="bg-stone-100 text-stone-700 text-xs font-bold px-3 py-1 rounded-md border border-stone-200">
            {scheme.category}
          </span>
          <span className="bg-amber-50 text-amber-900 text-xs font-bold px-3 py-1 rounded-md border border-amber-200 flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-amber-700" />
            Government of {scheme.state}
          </span>
          {recommendation && (
            <span className="bg-emerald-50 text-emerald-800 text-xs font-bold px-3 py-1 rounded-md border border-emerald-200 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-800" />
              {recommendation.matchBadge} ({recommendation.matchScore}% Score)
            </span>
          )}
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 leading-tight">
          {scheme.name}
        </h1>

        <div className="text-xs text-stone-500 font-medium">
          Ministry / Department: <strong className="text-stone-700">{scheme.department}</strong>
        </div>

        {/* Highlight Banner */}
        {scheme.financialBenefitAmount && (
          <div className="p-4 bg-stone-50 rounded-lg border border-stone-200 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-800 text-white flex items-center justify-center font-bold text-lg shrink-0">
                ₹
              </div>
              <div>
                <div className="text-[11px] font-semibold text-stone-600 uppercase tracking-wider">Financial Entitlement</div>
                <div className="text-base font-bold text-stone-900">{scheme.financialBenefitAmount}</div>
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-[11px] font-medium text-stone-500">Application Deadline</div>
              <div className="text-xs font-bold text-stone-900 flex items-center gap-1 justify-end">
                <Clock className="w-3.5 h-3.5 text-stone-500" />
                <span>{scheme.deadline}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Grid: Main Information */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Columns: Details */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Why this scheme was recommended */}
          {recommendation && recommendation.matchReasons.length > 0 && (
            <div className="bg-emerald-50/60 rounded-xl border border-emerald-200/80 p-6 space-y-3">
              <div className="flex items-center gap-2 text-emerald-950 font-bold text-base">
                <Sparkles className="w-5 h-5 text-emerald-800 shrink-0" />
                <span>Why this scheme was recommended for you</span>
              </div>
              <p className="text-xs text-emerald-900/90 leading-relaxed">
                Based on the information provided in your citizen profile (<strong>{currentUser?.name}</strong>), you meet the primary qualifying parameters:
              </p>
              <ul className="space-y-2 mt-2">
                {recommendation.matchReasons.map((reason, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-xs text-emerald-950">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                    <span><strong>{reason.criterion}:</strong> {reason.detail}</span>
                  </li>
                ))}
              </ul>
              <p className="text-[11px] text-emerald-800 italic pt-1 border-t border-emerald-200/50">
                “Based on the information provided, you may be eligible. Final verification is governed by the official portal.”
              </p>
            </div>
          )}

          {/* Scheme Description */}
          <div className="bg-white rounded-xl border border-stone-200 p-6 space-y-3">
            <h2 className="text-lg font-bold text-stone-900 flex items-center gap-2">
              <Info className="w-5 h-5 text-stone-600" />
              <span>Scheme Overview</span>
            </h2>
            <p className="text-sm text-stone-700 leading-relaxed">
              {scheme.description}
            </p>
          </div>

          {/* Benefits */}
          <div className="bg-white rounded-xl border border-stone-200 p-6 space-y-3">
            <h2 className="text-lg font-bold text-stone-900 flex items-center gap-2">
              <IndianRupee className="w-5 h-5 text-emerald-800" />
              <span>Key Benefits & Entitlements</span>
            </h2>
            <ul className="space-y-2.5">
              {scheme.benefits.map((b, i) => (
                <li key={i} className="flex items-start gap-2.5 text-xs sm:text-sm text-stone-700">
                  <div className="w-2 h-2 rounded-full bg-emerald-800 shrink-0 mt-2" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Eligibility Requirements */}
          <div className="bg-white rounded-xl border border-stone-200 p-6 space-y-3">
            <h2 className="text-lg font-bold text-stone-900 flex items-center gap-2">
              <ListChecks className="w-5 h-5 text-stone-600" />
              <span>Eligibility Requirements</span>
            </h2>
            <ul className="space-y-2.5">
              {scheme.eligibility.map((el, i) => (
                <li key={i} className="flex items-start gap-2.5 text-xs sm:text-sm text-stone-700">
                  <div className="w-2 h-2 rounded-full bg-emerald-800 shrink-0 mt-2" />
                  <span>{el}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Application Process */}
          <div className="bg-white rounded-xl border border-stone-200 p-6 space-y-4">
            <h2 className="text-lg font-bold text-stone-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-stone-600" />
              <span>Step-by-Step Application Process</span>
            </h2>
            <div className="space-y-3">
              {scheme.applicationProcess.map((step, index) => (
                <div key={index} className="flex items-start gap-3.5 p-3 rounded-lg bg-stone-50 border border-stone-200">
                  <div className="w-6 h-6 rounded-full bg-emerald-800 text-white font-bold text-xs flex items-center justify-center shrink-0">
                    {index + 1}
                  </div>
                  <p className="text-xs sm:text-sm text-stone-800 leading-relaxed font-medium">
                    {step}
                  </p>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right 1 Column: Documents, Official Portal, AI Advisor */}
        <div className="space-y-6">
          
          {/* Official Source & Apply Box */}
          <div className="bg-stone-900 text-white rounded-xl p-6 space-y-4 shadow-xs">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
              <span>Official Government Portal</span>
            </div>
            <div>
              <div className="text-xs text-stone-400">Operating Portal</div>
              <div className="text-sm font-bold text-white mt-0.5">{scheme.officialSource}</div>
            </div>
            <div>
              <div className="text-xs text-stone-400">Application Deadline</div>
              <div className="text-sm font-bold text-emerald-400 mt-0.5">{scheme.deadline}</div>
            </div>

            <a
              id="official-portal-apply-btn"
              href={scheme.officialWebsite}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full inline-flex items-center justify-center gap-2 bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-sm py-3 px-4 rounded-lg shadow-xs transition-all text-center"
            >
              <span>Apply / Visit Official Website</span>
              <ExternalLink className="w-4 h-4" />
            </a>

            {!isApplied && (
              <button
                onClick={() => setShowApplicationModal(true)}
                className="w-full inline-flex items-center justify-center gap-2 bg-stone-800 hover:bg-stone-700 text-stone-200 font-semibold text-xs py-2.5 px-4 rounded-lg border border-stone-700 transition-colors"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Mark as Applied & Track Status</span>
              </button>
            )}

            <div className="text-[11px] text-stone-400 border-t border-stone-800 pt-3">
              Last verified by Yojana Mitra: <strong>{scheme.lastUpdated}</strong>
            </div>
          </div>

          {/* Required Documents Checklist */}
          <div className="bg-white rounded-xl border border-stone-200 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-800" />
                <span>Required Documents</span>
              </h3>
              <span className="text-[11px] text-stone-500 font-medium">Checklist</span>
            </div>
            <p className="text-xs text-stone-500">
              Ensure you have scanned copies or physical certificates ready:
            </p>

            <div className="space-y-2">
              {scheme.requiredDocuments.map((doc, idx) => {
                const isChecked = !!checkedDocs[doc];
                return (
                  <div
                    key={idx}
                    onClick={() => toggleDoc(doc)}
                    className={`flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-colors ${
                      isChecked
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-950 font-medium'
                        : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                    }`}
                  >
                    {isChecked ? (
                      <CheckSquare className="w-4 h-4 text-emerald-800 shrink-0 mt-0.5" />
                    ) : (
                      <Square className="w-4 h-4 text-stone-400 shrink-0 mt-0.5" />
                    )}
                    <span className="text-xs leading-tight">{doc}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* AI Scheme Advisor Box */}
          <div className="bg-stone-50 rounded-xl border border-stone-200 p-6 space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-800" />
              <h3 className="text-sm font-bold text-stone-900">Ask Yojana Mitra AI</h3>
            </div>
            <p className="text-xs text-stone-600 leading-relaxed">
              Have questions about document requirements, income limits, or how to apply? Ask for plain-language assistance.
            </p>

            <form onSubmit={handleAskAI} className="space-y-2">
              <div className="relative">
                <input
                  type="text"
                  value={aiQuestion}
                  onChange={(e) => setAiQuestion(e.target.value)}
                  placeholder={`Ask a question about ${scheme.slug}...`}
                  className="w-full text-xs pl-3 pr-9 py-2.5 bg-white border border-stone-300 rounded-lg focus:outline-hidden focus:border-emerald-600"
                />
                <button
                  type="submit"
                  disabled={aiLoading || !aiQuestion.trim()}
                  className="absolute right-1.5 top-1.5 p-1.5 text-emerald-800 hover:text-emerald-950 disabled:text-stone-300"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
              {aiLoading && (
                <div className="text-[11px] text-emerald-800 animate-pulse flex items-center gap-1.5 font-medium">
                  <Sparkles className="w-3 h-3 animate-spin" />
                  <span>Consulting official scheme guidelines...</span>
                </div>
              )}
            </form>

            {/* AI Responses */}
            {aiResponses.length > 0 && (
              <div className="space-y-3 mt-3 max-h-64 overflow-y-auto pr-1">
                {aiResponses.map((item, idx) => (
                  <div key={idx} className="bg-white rounded-lg p-3 border border-stone-200 text-xs space-y-1.5 shadow-2xs">
                    <div className="font-semibold text-stone-800 flex items-center gap-1">
                      <HelpCircle className="w-3.5 h-3.5 text-stone-400" />
                      <span>{item.question}</span>
                    </div>
                    <p className="text-stone-600 text-[11px] leading-relaxed whitespace-pre-line">
                      {item.answer}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Mark as Applied Modal */}
      {showApplicationModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-stone-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-800" />
                <span>Track Scheme Application</span>
              </h3>
              <button
                onClick={() => setShowApplicationModal(false)}
                className="text-stone-400 hover:text-stone-700 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-stone-600">
              Marking <strong>{scheme.name}</strong> as applied will allow you to track review updates and deadline alerts in your <strong>Applied Schemes</strong> dashboard.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-stone-700 font-semibold mb-1">
                  Application / Acknowledgment Number (Optional)
                </label>
                <input
                  type="text"
                  value={appRefNo}
                  onChange={(e) => setAppRefNo(e.target.value)}
                  placeholder="e.g. NSP/2026/12345 or PMK-89234"
                  className="w-full p-2.5 border border-stone-300 rounded-lg bg-stone-50 focus:bg-white focus:outline-hidden focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-semibold mb-1">
                  Notes / Next Steps (Optional)
                </label>
                <textarea
                  rows={2}
                  value={appNotes}
                  onChange={(e) => setAppNotes(e.target.value)}
                  placeholder="e.g. Submitted online; need to submit hard copy to college desk by Monday."
                  className="w-full p-2.5 border border-stone-300 rounded-lg bg-stone-50 focus:bg-white focus:outline-hidden focus:border-emerald-600"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
              <button
                onClick={() => setShowApplicationModal(false)}
                className="px-3 py-2 rounded-lg text-xs font-semibold text-stone-600 hover:bg-stone-100"
              >
                Cancel
              </button>
              <button
                id="confirm-mark-applied-btn"
                onClick={handleConfirmApply}
                className="px-4 py-2 rounded-lg text-xs font-bold bg-emerald-800 hover:bg-emerald-700 text-white shadow-xs"
              >
                Confirm & Track
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
