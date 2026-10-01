import React, { useMemo } from 'react';
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
  AlertCircle,
  Filter,
  RotateCw
} from 'lucide-react';
import { SCHEMES_DATABASE } from '../data/schemes';
import { Scheme } from '../types';
import { useApp } from '../context/AppContext';
import { calculateDaysUntilDeadline } from '../utils/deadlineAlerts';
import { evaluateSchemeEligibility } from '../utils/recommendationEngine';

interface DeadlinesViewProps {
  onSelectScheme: (scheme: Scheme) => void;
}

export const DeadlinesView: React.FC<DeadlinesViewProps> = ({ onSelectScheme }) => {
  const { currentUser } = useApp();
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 600);
  };

  // Filter schemes strictly to those the user is eligible for
  const eligibleSchemes = useMemo(() => {
    if (!currentUser) return SCHEMES_DATABASE;
    return SCHEMES_DATABASE.filter(s => {
      const evalRes = evaluateSchemeEligibility(s, currentUser);
      return evalRes.unmetCriteria.length === 0;
    });
  }, [currentUser]);

  // Sort and categorize deadlines based on real dates strictly for eligible schemes
  const { critical3DaySchemes, dueSoonSchemes, thisMonthSchemes, laterSchemes } = useMemo(() => {
    const critical3Day: Array<{ scheme: Scheme; daysLeft: number; statusText: string }> = [];
    const dueSoon: Scheme[] = []; // within next 45 days
    const thisMonth: Scheme[] = []; // October / November 2026
    const later: Scheme[] = []; // December 2026 or Open Year Round

    eligibleSchemes.forEach(s => {
      const { daysLeft, isExpiringIn3Days, statusText } = calculateDaysUntilDeadline(s);
      if (isExpiringIn3Days && daysLeft !== null) {
        critical3Day.push({ scheme: s, daysLeft, statusText });
      } else if (s.isDeadlineApproaching || (s.deadlineDate && s.deadlineDate <= '2026-10-25')) {
        dueSoon.push(s);
      } else if (s.deadlineDate && s.deadlineDate <= '2026-11-30') {
        thisMonth.push(s);
      } else {
        later.push(s);
      }
    });

    critical3Day.sort((a, b) => a.daysLeft - b.daysLeft);
    return {
      critical3DaySchemes: critical3Day,
      dueSoonSchemes: dueSoon,
      thisMonthSchemes: thisMonth,
      laterSchemes: later
    };
  }, [eligibleSchemes]);

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
            Tracking application closure windows and milestones exclusively for schemes you are eligible for.
          </p>
          {currentUser && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-900 mt-2">
              <Filter className="w-3.5 h-3.5 text-emerald-700" />
              <span>Tailored for: {currentUser.employmentStatus || 'Citizen'} • {currentUser.state || 'All India'}</span>
            </div>
          )}
        </div>

        {/* Legend & Refresh */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300 text-xs font-bold rounded-lg shadow-2xs transition-all cursor-pointer disabled:opacity-50"
            title="Refresh deadlines"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-emerald-700' : 'text-emerald-800'}`} />
            <span>Refresh Results</span>
          </button>

          <div className="flex items-center gap-3 text-xs bg-emerald-50/60 p-2 rounded-xl border border-emerald-200">
            <div className="flex items-center gap-1.5 font-medium text-stone-700">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
              <span>Due Soon (Closing)</span>
            </div>
            <div className="flex items-center gap-1.5 font-medium text-emerald-900">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
              <span>Upcoming (1-2 Months)</span>
            </div>
            <div className="flex items-center gap-1.5 font-medium text-stone-700">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-700" />
              <span>Open Year Round</span>
            </div>
          </div>
        </div>
      </div>

      {eligibleSchemes.length === 0 && (
        <div className="bg-stone-50 border border-stone-200 rounded-2xl p-8 text-center space-y-2">
          <AlertCircle className="w-8 h-8 text-stone-400 mx-auto" />
          <h3 className="text-base font-bold text-stone-800">No Eligible Deadlines Found</h3>
          <p className="text-xs text-stone-500 max-w-md mx-auto">
            There are currently no active schemes with closing deadlines matching your profile. Please check back regularly or update your profile details.
          </p>
        </div>
      )}

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
                    <div className="text-xs font-bold text-emerald-950 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg mt-2 inline-block">
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
      {dueSoonSchemes.length > 0 && (
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
      )}

      {/* Section 2: This Month / Upcoming */}
      {thisMonthSchemes.length > 0 && (
        <div className="space-y-3 pt-4">
          <div className="flex items-center gap-2 text-sm font-bold text-emerald-950 bg-emerald-50 p-3 rounded-xl border border-emerald-200">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
            <span>🟢 Upcoming Deadlines (Next 60 Days)</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {thisMonthSchemes.map((scheme) => (
              <div key={scheme.id} className="bg-white rounded-xl border border-stone-200 p-5 shadow-xs flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 border border-emerald-200">
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
      )}

      {/* Section 3: Open Year Round / Ongoing */}
      {laterSchemes.length > 0 && (
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
      )}

    </div>
  );
};
