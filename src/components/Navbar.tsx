import React, { useState } from 'react';
import { 
  Search, 
  Bell, 
  User, 
  CheckCircle2, 
  LogOut, 
  ChevronDown,
  UserPlus,
  LogIn
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const Navbar: React.FC = () => {
  const { 
    currentUser, 
    searchQuery, 
    setSearchQuery, 
    unreadNotificationCount, 
    setIsNotificationsOpen, 
    setActiveTab, 
    logout,
    openAuthModal
  } = useApp();

  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-emerald-100 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Brand */}
          <div className="flex items-center gap-2.5 shrink-0 cursor-pointer" onClick={() => setActiveTab('home')}>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold tracking-tight text-xl text-emerald-800 font-sans">YOJANA MITRA</span>
              </div>
              <p className="text-[10px] uppercase tracking-widest text-emerald-700 font-semibold hidden sm:block">
                Schemes &amp; Scholarships Portal
              </p>
            </div>
          </div>

          <div className="flex-1" />

          {/* Top Right Corner Actions */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            
            {!currentUser ? (
              /* User is NOT logged in: Show Log In and Sign Up options */
              <div className="flex items-center gap-2">
                <button
                  id="navbar-login-btn"
                  onClick={() => openAuthModal('login')}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-emerald-900 hover:text-emerald-950 hover:bg-emerald-50 rounded-xl border border-emerald-200 transition-colors cursor-pointer"
                >
                  <LogIn className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Log In</span>
                </button>
                <button
                  id="navbar-signup-btn"
                  onClick={() => openAuthModal('signup')}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-700 active:bg-emerald-900 rounded-xl shadow-xs transition-all cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5 text-emerald-200" />
                  <span>Sign Up</span>
                </button>
              </div>
            ) : (
              /* User IS logged in: Show notification bell and citizen profile dropdown */
              <>
                {/* Notification Bell */}
                <button
                  id="notifications-button"
                  onClick={() => setIsNotificationsOpen(true)}
                  className="relative p-2.5 sm:p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-emerald-800 hover:text-emerald-950 hover:bg-emerald-50 focus:outline-hidden transition-colors cursor-pointer"
                  aria-label="View notifications"
                >
                  <Bell className="w-5 h-5" />
                  {unreadNotificationCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                      {unreadNotificationCount}
                    </span>
                  )}
                </button>

                {/* User Profile Button */}
                <div className="relative">
                  <button
                    id="user-profile-button"
                    onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                    className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 min-h-[44px] rounded-xl border border-emerald-200 hover:border-emerald-300 hover:bg-emerald-50/60 focus:outline-hidden transition-all text-left cursor-pointer"
                  >
                    <div className="w-8 h-8 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0">
                      {currentUser?.name ? currentUser.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'U'}
                    </div>
                    <div className="hidden lg:block text-left">
                      <div className="text-xs font-bold text-emerald-950 leading-tight">
                        {currentUser?.name || 'Citizen'}
                      </div>
                      <div className="text-[10px] text-emerald-700 uppercase font-semibold mt-0.5">
                        {currentUser?.category || 'General'} • {currentUser?.employmentStatus || 'Citizen'}
                      </div>
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-emerald-600 hidden sm:block" />
                  </button>

                  {isProfileMenuOpen && (
                    <div 
                      className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-emerald-200 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100 max-h-[85vh] overflow-y-auto"
                      onMouseLeave={() => setIsProfileMenuOpen(false)}
                    >
                      <div className="px-3 py-2 border-b border-emerald-100">
                        <p className="text-xs font-semibold text-emerald-950">{currentUser?.name}</p>
                        <p className="text-[11px] text-emerald-700 truncate">{currentUser?.email}</p>
                        <p className="text-[10px] text-emerald-800 font-bold mt-0.5">{currentUser?.state} • {currentUser?.district || 'General'}</p>
                      </div>
                      <button
                        onClick={() => { setActiveTab('profile'); setIsProfileMenuOpen(false); }}
                        className="w-full px-3 py-2.5 text-left text-xs text-emerald-900 hover:bg-emerald-50 flex items-center gap-2 cursor-pointer"
                      >
                        <User className="w-4 h-4 text-emerald-700" />
                        <span>View & Edit Profile</span>
                      </button>
                      <button
                        onClick={() => { setActiveTab('applied'); setIsProfileMenuOpen(false); }}
                        className="w-full px-3 py-2.5 text-left text-xs text-emerald-900 hover:bg-emerald-50 flex items-center gap-2 cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                        <span>My Applied Schemes</span>
                      </button>

                      <div className="border-t border-emerald-100 my-1" />
                      <button
                        onClick={() => { logout(); setIsProfileMenuOpen(false); }}
                        className="w-full px-3 py-2 text-left text-xs text-red-600 hover:bg-red-50 flex items-center gap-2 cursor-pointer"
                      >
                        <LogOut className="w-4 h-4 text-red-500" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}

          </div>
        </div>
      </div>
    </header>
  );
};
