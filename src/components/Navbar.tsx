import React, { useState } from 'react';
import { 
  Search, 
  Bell, 
  User, 
  CheckCircle2, 
  LogOut, 
  ChevronDown,
  UserPlus,
  LogIn,
  Users
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
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-stone-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-3 shrink-0 cursor-pointer" onClick={() => setActiveTab('home')}>
            <div className="w-10 h-10 rounded-xl bg-emerald-800 text-white flex items-center justify-center font-bold text-xl shadow-xs border border-emerald-700">
              🏛️
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold tracking-tight text-xl text-emerald-800 font-sans">YOJANA MITRA</span>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-emerald-200">
                  Govt Official
                </span>
              </div>
              <p className="text-[10px] uppercase tracking-widest text-stone-500 font-semibold hidden sm:block">
                Government Schemes Assistant
              </p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-xl mx-1 sm:mx-2 min-w-0">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 sm:pl-3.5 flex items-center pointer-events-none text-stone-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                id="main-scheme-search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search schemes or scholarships..."
                className="w-full pl-9 sm:pl-10 pr-4 py-2 text-xs sm:text-sm bg-stone-100 hover:bg-stone-100/90 focus:bg-white border border-stone-200 rounded-full text-stone-800 placeholder-stone-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-600 transition-all truncate"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-3 sm:pr-3.5 flex items-center text-xs text-stone-400 hover:text-stone-700 font-medium"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Top Right Corner Actions */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            
            {!currentUser ? (
              /* User is NOT logged in: Show Log In and Sign Up options */
              <div className="flex items-center gap-2">
                <button
                  id="navbar-login-btn"
                  onClick={() => openAuthModal('login')}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-stone-700 hover:text-emerald-800 hover:bg-stone-100 rounded-xl border border-stone-200 transition-colors cursor-pointer"
                >
                  <LogIn className="w-3.5 h-3.5 text-stone-500" />
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
                  className="relative p-2.5 sm:p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-stone-600 hover:text-emerald-800 hover:bg-stone-100 focus:outline-hidden transition-colors cursor-pointer"
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
                    className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 min-h-[44px] rounded-xl border border-stone-200 hover:border-stone-300 hover:bg-stone-50 focus:outline-hidden transition-all text-left cursor-pointer"
                  >
                    <div className="w-8 h-8 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0">
                      {currentUser?.name ? currentUser.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'U'}
                    </div>
                    <div className="hidden lg:block text-left">
                      <div className="text-xs font-bold text-stone-800 leading-tight">
                        {currentUser?.name || 'Citizen'}
                      </div>
                      <div className="text-[10px] text-stone-500 uppercase font-semibold mt-0.5">
                        {currentUser?.category || 'General'} • {currentUser?.employmentStatus || 'Citizen'}
                      </div>
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-stone-400 hidden sm:block" />
                  </button>

                  {isProfileMenuOpen && (
                    <div 
                      className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-stone-200 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100 max-h-[85vh] overflow-y-auto"
                      onMouseLeave={() => setIsProfileMenuOpen(false)}
                    >
                      <div className="px-3 py-2 border-b border-stone-100">
                        <p className="text-xs font-semibold text-stone-900">{currentUser?.name}</p>
                        <p className="text-[11px] text-stone-500 truncate">{currentUser?.email}</p>
                        <p className="text-[10px] text-emerald-700 font-medium mt-0.5">{currentUser?.state} • {currentUser?.district || 'General'}</p>
                      </div>
                      <button
                        onClick={() => { setActiveTab('profile'); setIsProfileMenuOpen(false); }}
                        className="w-full px-3 py-2.5 text-left text-xs text-stone-700 hover:bg-stone-50 flex items-center gap-2 cursor-pointer"
                      >
                        <User className="w-4 h-4 text-stone-500" />
                        <span>View & Edit Profile</span>
                      </button>
                      <button
                        onClick={() => { setActiveTab('applied'); setIsProfileMenuOpen(false); }}
                        className="w-full px-3 py-2.5 text-left text-xs text-stone-700 hover:bg-stone-50 flex items-center gap-2 cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4 text-stone-500" />
                        <span>My Applied Schemes</span>
                      </button>
                      <button
                        id="switch-account-button"
                        onClick={() => { openAuthModal('login'); setIsProfileMenuOpen(false); }}
                        className="w-full px-3 py-2.5 text-left text-xs text-stone-700 hover:bg-stone-50 flex items-center gap-2 cursor-pointer"
                      >
                        <Users className="w-4 h-4 text-stone-500" />
                        <span>Switch / Choose Account</span>
                      </button>

                      <div className="border-t border-stone-100 my-1" />
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
