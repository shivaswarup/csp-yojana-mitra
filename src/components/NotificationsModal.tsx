import React, { useState, useMemo } from 'react';
import { 
  Bell, 
  X, 
  CheckCheck, 
  Calendar, 
  Sparkles, 
  ShieldAlert, 
  CheckCircle2, 
  ArrowRight,
  ExternalLink,
  Clock,
  IndianRupee,
  FileCheck2
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { SCHEMES_DATABASE } from '../data/schemes';
import { Scheme } from '../types';
import { calculateDaysUntilDeadline } from '../utils/deadlineAlerts';
import { evaluateSchemeEligibility } from '../utils/recommendationEngine';
import { ensureAbsoluteUrl } from '../utils/urlUtils';

interface NotificationsModalProps {
  onSelectScheme: (scheme: Scheme) => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({ onSelectScheme }) => {
  const { 
    isNotificationsOpen, 
    setIsNotificationsOpen, 
    notifications, 
    markNotificationAsRead, 
    markAllNotificationsAsRead,
    currentUser
  } = useApp();

  const [activeFilter, setActiveFilter] = useState<'all' | 'deadlines'>('all');

  // Filter notifications strictly to schemes matching user eligibility
  const eligibleNotifications = useMemo(() => {
    if (!currentUser) return notifications;
    return notifications.filter(n => {
      if (n.schemeId) {
        const scheme = SCHEMES_DATABASE.find(s => s.id === n.schemeId);
        if (scheme) {
          const evalRes = evaluateSchemeEligibility(scheme, currentUser);
          return evalRes.unmetCriteria.length === 0;
        }
      }
      return true;
    });
  }, [notifications, currentUser]);

  // Find schemes related to notifications
  const deadlineNotifications = useMemo(() => {
    return eligibleNotifications.filter(n => n.type === 'deadline');
  }, [eligibleNotifications]);

  const displayedNotifications = useMemo(() => {
    if (activeFilter === 'deadlines') {
      return deadlineNotifications;
    }
    return eligibleNotifications;
  }, [activeFilter, deadlineNotifications, eligibleNotifications]);

  if (!isNotificationsOpen) return null;

  const handleNotificationClick = (notif: typeof notifications[0]) => {
    markNotificationAsRead(notif.id);
    if (notif.schemeId) {
      const scheme = SCHEMES_DATABASE.find(s => s.id === notif.schemeId);
      if (scheme) {
        setIsNotificationsOpen(false);
        onSelectScheme(scheme);
      }
    }
  };

  const getSchemeDetails = (schemeId?: string) => {
    if (!schemeId) return null;
    return SCHEMES_DATABASE.find(s => s.id === schemeId) || null;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center sm:justify-end p-4">
      <div className="bg-white rounded-2xl w-full max-w-md h-[88vh] flex flex-col shadow-2xl border border-stone-200 animate-in fade-in slide-in-from-right-10 duration-200 overflow-hidden">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-stone-200 bg-white">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shadow-xs">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-stone-900 flex items-center gap-2">
                  <span>Notifications & Alerts</span>
                  {deadlineNotifications.length > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-[10px] font-extrabold border border-red-200">
                      {deadlineNotifications.length} Deadlines
                    </span>
                  )}
                </h2>
                <p className="text-xs text-stone-500">Scheme application deadlines & welfare updates</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={markAllNotificationsAsRead}
                className="p-1.5 text-stone-500 hover:text-stone-800 hover:bg-stone-100 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
                title="Mark all as read"
              >
                <CheckCheck className="w-4 h-4 text-emerald-700" />
                <span className="hidden sm:inline text-[11px]">Read All</span>
              </button>
              <button
                type="button"
                onClick={() => setIsNotificationsOpen(false)}
                className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-2 pt-1 border-t border-stone-100 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeFilter === 'all'
                  ? 'bg-emerald-800 text-white font-bold shadow-2xs'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              All Alerts ({notifications.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('deadlines')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeFilter === 'deadlines'
                  ? 'bg-red-600 text-white font-bold shadow-2xs'
                  : 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>⏰ Deadline Reminders ({deadlineNotifications.length})</span>
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-stone-50/50">
          {displayedNotifications.length > 0 ? (
            displayedNotifications.map((notif) => {
              const scheme = getSchemeDetails(notif.schemeId);
              const deadlineInfo = scheme ? calculateDaysUntilDeadline(scheme) : null;
              const isUrgent = notif.type === 'deadline' && (deadlineInfo?.isExpiringSoon || notif.title.toLowerCase().includes('urgent') || notif.title.toLowerCase().includes('deadline'));

              return (
                <div
                  key={notif.id}
                  className={`p-4 rounded-xl border transition-all ${
                    isUrgent
                      ? notif.read 
                        ? 'bg-white border-red-200 text-stone-800 shadow-xs'
                        : 'bg-red-50/80 border-red-300 text-stone-950 shadow-sm ring-1 ring-red-400/30'
                      : notif.read
                        ? 'bg-white border-stone-200 text-stone-700'
                        : 'bg-emerald-50/80 border-emerald-300 text-stone-900 shadow-2xs'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="shrink-0 mt-0.5">
                      {isUrgent ? (
                        <div className="w-9 h-9 rounded-xl bg-red-100 text-red-700 flex items-center justify-center shadow-2xs">
                          <Clock className="w-4 h-4 animate-pulse" />
                        </div>
                      ) : (
                        <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shadow-2xs">
                          <Sparkles className="w-4 h-4" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h3 className={`text-xs ${notif.read ? 'font-semibold text-stone-800' : 'font-bold text-stone-950'}`}>
                            {notif.title}
                          </h3>
                          {isUrgent && (
                            <span className="px-1.5 py-0.5 rounded bg-red-600 text-white text-[9px] font-black uppercase tracking-wider">
                              Deadline Alert
                            </span>
                          )}
                        </div>
                        {!notif.read && (
                          <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${isUrgent ? 'bg-red-600' : 'bg-emerald-700'}`} />
                        )}
                      </div>

                      {/* Prominent Application Deadline Callout */}
                      {scheme && (
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-red-300 rounded-lg text-red-700 font-bold text-[11px] shadow-2xs">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>Application Deadline: {scheme.deadline}</span>
                          </span>
                          {scheme.financialBenefitAmount && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-emerald-300 rounded-lg text-emerald-800 font-bold text-[11px] shadow-2xs">
                              <IndianRupee className="w-3.5 h-3.5" />
                              <span>{scheme.financialBenefitAmount}</span>
                            </span>
                          )}
                        </div>
                      )}

                      <p className="text-xs text-stone-600 leading-relaxed">
                        {notif.message}
                      </p>

                      {/* Action Links */}
                      <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-stone-100">
                        {scheme ? (
                          <>
                            <button
                              type="button"
                              onClick={() => handleNotificationClick(notif)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-2xs transition-colors cursor-pointer"
                            >
                              <span>View Scheme Details & Apply</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>

                            <a
                              href={ensureAbsoluteUrl(scheme.officialWebsite)}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => {
                                e.stopPropagation();
                                markNotificationAsRead(notif.id);
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-stone-100 border border-stone-300 text-stone-700 rounded-lg text-xs font-semibold shadow-2xs transition-colors"
                            >
                              <span>Official Portal</span>
                              <ExternalLink className="w-3.5 h-3.5 text-stone-500" />
                            </a>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => markNotificationAsRead(notif.id)}
                            className="text-[11px] text-stone-500 hover:text-stone-800 font-semibold cursor-pointer"
                          >
                            Mark as read
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-16 space-y-3 text-stone-400">
              <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center mx-auto text-stone-400">
                <Bell className="w-6 h-6 stroke-1" />
              </div>
              <p className="text-sm font-bold text-stone-700">No notifications in this view</p>
              <p className="text-xs text-stone-500 max-w-xs mx-auto">
                {activeFilter === 'deadlines'
                  ? 'All scheme deadlines are monitored and will alert you prior to closing.'
                  : 'You are all caught up with government scheme announcements and deadlines.'}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-stone-200 bg-white text-center text-[11px] text-stone-500 flex items-center justify-between px-5">
          <span className="flex items-center gap-1.5 font-medium">
            <FileCheck2 className="w-3.5 h-3.5 text-emerald-700" />
            <span>Reminding Active Government Deadlines</span>
          </span>
          <span className="font-semibold text-emerald-800">
            Yojana Mitra Alert System
          </span>
        </div>

      </div>
    </div>
  );
};
