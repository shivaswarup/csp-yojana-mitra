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
      {/* Desktop Persistent Taskbar / Sidebar */}
      <aside className="hidden md:flex flex-col w-56 lg:w-64 bg-stone-100 border-r border-stone-200 min-h-[calc(100vh-4rem)] p-4 shrink-0 justify-between">
        <div className="space-y-6">
          
          {/* Official Verification Tag */}
          <div className="bg-white/80 rounded-xl p-3 border border-stone-200">
            <div className="flex items-center gap-2 text-xs font-semibold text-stone-800 mb-1">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <span>State Portal Gateway</span>
            </div>
            <p className="text-[11px] text-stone-500 leading-relaxed">
              Verified access to State Government welfare initiatives, scholarships, and entitlements.
            </p>
          </div>

          {/* Nav List */}
          <nav className="space-y-1">
            <div className="text-[10px] font-bold text-stone-500 uppercase tracking-wider px-3 mb-2">
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
                  className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-emerald-800 text-white shadow-xs font-semibold'
                      : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {isActive ? (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 shrink-0" />
                    ) : (
                      <Icon className="w-4 h-4 text-stone-400" />
                    )}
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                      isActive 
                        ? 'bg-emerald-700 text-emerald-100' 
                        : 'bg-stone-200 text-stone-700'
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
        <div className="pt-4 border-t border-stone-200 space-y-2">
          <div className="px-3 py-2 bg-stone-200/60 rounded-lg border border-stone-300/60 text-[11px] text-stone-800">
            <div className="font-semibold flex items-center gap-1.5 mb-0.5 text-emerald-900">
              <Building2 className="w-3.5 h-3.5 text-emerald-700" />
              <span>myScheme & NSP Integrated</span>
            </div>
            <p className="text-stone-600">Direct submission links to official government portals.</p>
          </div>

          {currentUser && (
            <button
              id="nav-logout-button"
              onClick={logout}
              className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium text-stone-500 hover:text-red-600 hover:bg-stone-200/80 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4 text-stone-400" />
              <span className="text-xs font-semibold uppercase tracking-wider">Sign Out</span>
            </button>
          )}
        </div>
      </aside>

      {/* Mobile Responsive Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-stone-200 px-1 py-1 flex items-center justify-around shadow-lg safe-area-inset-bottom">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center min-h-[48px] min-w-[56px] py-1 px-1.5 rounded-lg text-[10px] font-medium transition-all active:scale-95 ${
                isActive 
                  ? 'text-emerald-800 font-bold bg-emerald-50/80' 
                  : 'text-stone-500 hover:text-stone-800 hover:bg-stone-50'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 mb-0.5 ${isActive ? 'text-emerald-800' : 'text-stone-500'}`} />
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
