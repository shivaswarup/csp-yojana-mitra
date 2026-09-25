import React from 'react';
import { 
  Bell, 
  X, 
  CheckCheck, 
  Calendar, 
  Sparkles, 
  ShieldAlert, 
  CheckCircle2, 
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { SCHEMES_DATABASE } from '../data/schemes';
import { Scheme } from '../types';

interface NotificationsModalProps {
  onSelectScheme: (scheme: Scheme) => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({ onSelectScheme }) => {
  const { 
    isNotificationsOpen, 
    setIsNotificationsOpen, 
    notifications, 
    markNotificationAsRead, 
    markAllNotificationsAsRead 
  } = useApp();

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

  const getIcon = (type: string, title: string = '') => {
    switch (type) {
      case 'deadline':
        return (
          <div className="w-8 h-8 rounded-lg bg-red-100 text-red-700 flex items-center justify-center shrink-0 shadow-2xs">
            <Calendar className="w-4 h-4 animate-pulse" />
          </div>
        );
      case 'new_scheme':
        return (
          <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 shadow-2xs">
            <Sparkles className="w-4 h-4" />
          </div>
        );
      case 'status_update':
        return (
          <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 shadow-2xs">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 rounded-lg bg-stone-100 text-stone-600 flex items-center justify-center shrink-0 shadow-2xs">
            <ShieldAlert className="w-4 h-4" />
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center sm:justify-end p-4">
      <div className="bg-white rounded-xl w-full max-w-md h-[85vh] flex flex-col shadow-xl border border-stone-200 animate-in fade-in slide-in-from-right-10 duration-200">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-stone-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-stone-900">Notifications & Alerts</h2>
              <p className="text-[11px] text-stone-500">Deadlines and scheme eligibility updates</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={markAllNotificationsAsRead}
              className="p-1.5 text-stone-500 hover:text-stone-800 hover:bg-stone-100 rounded-lg text-xs font-semibold flex items-center gap-1"
              title="Mark all as read"
            >
              <CheckCheck className="w-4 h-4" />
              <span className="hidden sm:inline text-[11px]">Read All</span>
            </button>
            <button
              onClick={() => setIsNotificationsOpen(false)}
              className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {notifications.length > 0 ? (
            notifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => handleNotificationClick(notif)}
                className={`p-3.5 rounded-lg border transition-all cursor-pointer ${
                  notif.type === 'deadline'
                    ? notif.read 
                      ? 'bg-red-50/40 border-red-200 text-stone-800'
                      : 'bg-red-50/80 border-red-300 text-stone-950 shadow-xs ring-1 ring-red-400/30'
                    : notif.read
                      ? 'bg-stone-50/60 border-stone-200 text-stone-600 hover:bg-stone-100/60'
                      : 'bg-emerald-50/70 border-emerald-200 text-stone-900 shadow-2xs hover:bg-emerald-100/50'
                }`}
              >
                <div className="flex items-start gap-3">
                  {getIcon(notif.type, notif.title)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 className={`text-xs ${notif.read ? 'font-semibold text-stone-800' : 'font-bold text-stone-950'}`}>
                          {notif.title}
                        </h3>
                        {notif.type === 'deadline' && (
                          <span className="px-1.5 py-0.2 rounded bg-red-600 text-white text-[9px] font-black uppercase tracking-wider">
                            Urgent
                          </span>
                        )}
                      </div>
                      {!notif.read && (
                        <span className={`w-2 h-2 rounded-full shrink-0 ${notif.type === 'deadline' ? 'bg-red-600' : 'bg-emerald-800'}`} />
                      )}
                    </div>
                    <p className="text-[11px] text-stone-600 mt-1 leading-relaxed">
                      {notif.message}
                    </p>
                    {notif.schemeId && (
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold mt-2 ${notif.type === 'deadline' ? 'text-red-700' : 'text-emerald-800'}`}>
                        <span>View Scheme Details & Apply</span>
                        <ArrowRight className="w-3 h-3" />
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 space-y-2 text-stone-400">
              <Bell className="w-8 h-8 mx-auto stroke-1" />
              <p className="text-xs font-semibold text-stone-600">No new notifications</p>
              <p className="text-[11px] text-stone-400">You're all caught up with government deadlines!</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-stone-100 bg-stone-50/80 text-center text-[11px] text-stone-500 rounded-b-xl">
          Verified National Government Notifications
        </div>

      </div>
    </div>
  );
};
