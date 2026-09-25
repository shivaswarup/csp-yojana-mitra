import React from 'react';
import { 
  CalendarClock, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  ExternalLink, 
  ArrowRight,
  ShieldCheck,
  Building2,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { SCHEMES_DATABASE } from '../data/schemes';
import { Scheme } from '../types';
import { useApp } from '../context/AppContext';
import { calculateDaysUntilDeadline } from '../utils/deadlineAlerts';

interface DeadlinesViewProps {
  onSelectScheme: (scheme: Scheme) => void;
}

export const DeadlinesView: React.FC<DeadlinesViewProps> = ({ onSelectScheme }) => {
  const { appliedSchemes } = useApp();

  // Sort and categorize deadlines based on real dates
  const critical3DaySchemes: Array<{ scheme: Scheme; daysLeft: number; statusText: string }> = [];
  const dueSoonSchemes: Scheme[] = []; // within next 45 days
  const thisMonthSchemes: Scheme[] = []; // October / November 2026
  const laterSchemes: Scheme[] = []; // December 2026 or Open Year Round

  SCHEMES_DATABASE.forEach(s => {
    const { daysLeft, isExpiringIn3Days, statusText } = calculateDaysUntilDeadline(s);
    if (isExpiringIn3Days && daysLeft !== null) {
      critical3DaySchemes.push({ scheme: s, daysLeft, statusText });
    } else if (s.isDeadlineApproaching || (s.deadlineDate && s.deadlineDate <= '2026-10-25')) {
      dueSoonSchemes.push(s);
    } else if (s.deadlineDate && s.deadlineDate <= '2026-11-30') {
      thisMonthSchemes.push(s);
    } else {
      laterSchemes.push(s);
    }
  });

  critical3DaySchemes.sort((a, b) => a.daysLeft - b.daysLeft);

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-200">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 tracking-tight flex items-center gap-2">
            <CalendarClock className="w-6 h-6 text-emerald-800" />
            <span>Government Scheme Application Deadlines</span>
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            Track key application closure windows, cutoffs, and verification milestones to never miss benefits.
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-xs bg-stone-100 p-2 rounded-xl border border-stone-200">
          <div className="flex items-center gap-1.5 font-medium text-stone-700">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
            <span>Due Soon (Closing)</span>
          </div>
          <div className="flex items-center gap-1.5 font-medium text-stone-700">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span>Upcoming (1-2 Months)</span>
          </div>
          <div className="flex items-center gap-1.5 font-medium text-stone-700">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
            <span>Open Year Round</span>
          </div>
        </div>
      </div>

      {/* Section 0: Critical 3-Day Deadline Alerts */}
      {critical3DaySchemes.length > 0 && (
        <div className="space-y-3 bg-red-50/50 p-4 sm:p-5 rounded-2xl border-2 border-red-300">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-sm font-black text-red-950">
              <span className="w-3 h-3 rounded-full bg-red-600 animate-ping" />
              <span>🚨 Critical Deadline Alert: Closing in 3 Days or Less</span>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-black uppercase">
              Immediate Action Required
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {critical3DaySchemes.map(({ scheme, daysLeft, statusText }) => (
              <div key={scheme.id} className="bg-white rounded-xl border-2 border-red-300 p-5 shadow-xs flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-red-600 text-white">
                      🚨 {daysLeft === 0 ? 'Closes Today!' : `${daysLeft} Days Left`} ({scheme.deadline})
                    </span>
                    <span className="text-xs font-bold text-red-900 bg-red-100 px-2 py-0.5 rounded">
                      {scheme.category}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-stone-900 leading-snug">{scheme.name}</h3>
                  <p className="text-xs text-stone-600 mt-1.5 line-clamp-2 leading-relaxed">{scheme.shortDescription}</p>
                  {scheme.financialBenefitAmount && (
                    <div className="text-xs font-bold text-stone-900 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg mt-2 inline-block">
                      Entitlement: {scheme.financialBenefitAmount}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-stone-100">
                  <span className="text-[11px] text-stone-500 truncate max-w-[200px]">{scheme.officialSource}</span>
                  <button
                    onClick={() => onSelectScheme(scheme)}
                    className="inline-flex items-center gap-1 text-xs font-bold text-red-700 hover:text-red-900 underline cursor-pointer"
                  >
                    <span>Apply Now & View Details</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Section 1: Due Soon */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-bold text-red-900 bg-red-50 p-3 rounded-xl border border-red-200">
          <span className="w-2.5 h-2.5 rounded-full bg-red-600" />
          <span>🔴 Due Soon (Closing in next 45 days)</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {dueSoonSchemes.map((scheme) => (
            <div key={scheme.id} className="bg-white rounded-xl border border-red-200 p-5 shadow-xs flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-red-100 text-red-800">
                    Closes: {scheme.deadline}
                  </span>
                  <span className="text-xs font-semibold text-stone-500">{scheme.category}</span>
                </div>
                <h3 className="text-base font-bold text-stone-900 leading-snug">{scheme.name}</h3>
                <p className="text-xs text-stone-600 mt-1.5 line-clamp-2 leading-relaxed">{scheme.shortDescription}</p>
                {scheme.financialBenefitAmount && (
                  <div className="text-xs font-semibold text-stone-800 bg-stone-50 px-2.5 py-1 rounded-lg mt-2 inline-block border border-stone-200">
                    Entitlement: {scheme.financialBenefitAmount}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-stone-100">
                <span className="text-[11px] text-stone-500 truncate max-w-[200px]">{scheme.officialSource}</span>
                <button
                  onClick={() => onSelectScheme(scheme)}
                  className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 hover:text-emerald-950 underline"
                >
                  <span>View Details</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section 2: This Month / Upcoming */}
      <div className="space-y-3 pt-4">
        <div className="flex items-center gap-2 text-sm font-bold text-amber-900 bg-amber-50 p-3 rounded-xl border border-amber-200">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
          <span>🟡 Upcoming Deadlines (Next 60 Days)</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {thisMonthSchemes.map((scheme) => (
            <div key={scheme.id} className="bg-white rounded-xl border border-stone-200 p-5 shadow-xs flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-900">
                    Deadline: {scheme.deadline}
                  </span>
                  <span className="text-xs font-semibold text-stone-500">{scheme.category}</span>
                </div>
                <h3 className="text-base font-bold text-stone-900 leading-snug">{scheme.name}</h3>
                <p className="text-xs text-stone-600 mt-1.5 line-clamp-2 leading-relaxed">{scheme.shortDescription}</p>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-stone-100">
                <span className="text-[11px] text-stone-500">{scheme.officialSource}</span>
                <button
                  onClick={() => onSelectScheme(scheme)}
                  className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 hover:text-emerald-950"
                >
                  <span>View Details</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section 3: Open Year Round / Ongoing */}
      <div className="space-y-3 pt-4">
        <div className="flex items-center gap-2 text-sm font-bold text-emerald-900 bg-emerald-50 p-3 rounded-xl border border-emerald-200">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
          <span>🟢 Open Year-Round / Ongoing Enrollment</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {laterSchemes.map((scheme) => (
            <div key={scheme.id} className="bg-white rounded-xl border border-stone-200 p-5 shadow-xs flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                    Open Year Round
                  </span>
                  <span className="text-xs font-semibold text-stone-500">{scheme.category}</span>
                </div>
                <h3 className="text-sm font-bold text-stone-900 leading-snug">{scheme.name}</h3>
                <p className="text-xs text-stone-600 mt-1 line-clamp-2 leading-relaxed">{scheme.shortDescription}</p>
              </div>

              <div className="pt-2 border-t border-stone-100 flex justify-end">
                <button
                  onClick={() => onSelectScheme(scheme)}
                  className="text-xs font-bold text-emerald-800 hover:text-emerald-950"
                >
                  View Details →
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
