import React from 'react';
import { 
  Home, 
  CalendarClock, 
  BookOpen, 
  ClipboardCheck, 
  LogOut, 
  ShieldCheck, 
  Building2 
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const Sidebar: React.FC = () => {
  const { 
    currentUser, 
    activeTab, 
    setActiveTab, 
    logout, 
    appliedSchemes 
  } = useApp();

  const navItems = [
    { id: 'home' as const, label: 'Home', icon: Home, badge: null },
    { id: 'deadlines' as const, label: 'Deadlines', icon: CalendarClock, badge: null },
    { id: 'schemes' as const, label: 'Schemes', icon: BookOpen, badge: null },
    { id: 'applied' as const, label: 'Applied Schemes', icon: ClipboardCheck, badge: appliedSchemes.length > 0 ? `${appliedSchemes.length}` : null },
  ];

  return (
    <>
      {/* Desktop Persistent Taskbar / Sidebar - Strict Green & White Theme */}
      <aside className="hidden md:flex flex-col w-56 lg:w-64 bg-emerald-50/30 border-r border-emerald-100 min-h-[calc(100vh-4rem)] p-4 shrink-0 justify-between">
        <div className="space-y-6">
          
          {/* Official Verification Tag */}
          <div className="bg-white rounded-xl p-3.5 border border-emerald-200 shadow-2xs">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-950 mb-1">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <span>State Portal Gateway</span>
            </div>
            <p className="text-[11px] text-emerald-700 leading-relaxed font-medium">
              Verified access to State Government welfare initiatives, scholarships, and entitlements.
            </p>
          </div>

          {/* Nav List */}
          <nav className="space-y-1.5">
            <div className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider px-3 mb-2">
              Citizen Navigation
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-link-${item.id}`}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-emerald-800 text-white shadow-xs'
                      : 'text-emerald-900 hover:text-emerald-950 hover:bg-emerald-100/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {isActive ? (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 shrink-0" />
                    ) : (
                      <Icon className="w-4 h-4 text-emerald-600" />
                    )}
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                      isActive 
                        ? 'bg-emerald-700 text-emerald-100' 
                        : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Section with Official Helpline & Logout */}
        <div className="pt-4 border-t border-emerald-100 space-y-2">
          <div className="px-3 py-2.5 bg-white rounded-xl border border-emerald-200 text-[11px] text-emerald-900 shadow-2xs">
            <div className="font-bold flex items-center gap-1.5 mb-0.5 text-emerald-950">
              <Building2 className="w-3.5 h-3.5 text-emerald-700" />
              <span>myScheme & NSP Integrated</span>
            </div>
            <p className="text-emerald-700">Direct submission links to official government portals.</p>
          </div>

          {currentUser && (
            <button
              id="nav-logout-button"
              onClick={logout}
              className="w-full flex items-center gap-3 px-4 py-2 rounded-xl text-sm font-semibold text-emerald-700 hover:text-emerald-950 hover:bg-emerald-100/60 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4 text-emerald-600" />
              <span className="text-xs uppercase tracking-wider">Sign Out</span>
            </button>
          )}
        </div>
      </aside>

      {/* Mobile Responsive Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-emerald-100 px-1 py-1 flex items-center justify-around shadow-lg safe-area-inset-bottom">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center min-h-[48px] min-w-[56px] py-1 px-1.5 rounded-lg text-[10px] font-medium transition-all active:scale-95 ${
                isActive 
                  ? 'text-emerald-800 font-bold bg-emerald-50' 
                  : 'text-emerald-700 hover:text-emerald-950 hover:bg-emerald-50/50'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 mb-0.5 ${isActive ? 'text-emerald-800' : 'text-emerald-600'}`} />
                {item.badge && (
                  <span className="absolute -top-1 -right-2 w-4 h-4 bg-emerald-800 text-white text-[9px] font-bold rounded-full flex items-center justify-center border border-white">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="truncate max-w-[58px] leading-tight">{item.label}</span>
            </button>
          );
        })}
      </div>
    </>
  );
};
