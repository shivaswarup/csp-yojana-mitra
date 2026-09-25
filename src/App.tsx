import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { HomeView } from './components/HomeView';
import { RecommendedView } from './components/RecommendedView';
import { SchemesView } from './components/SchemesView';
import { DeadlinesView } from './components/DeadlinesView';
import { AppliedSchemesView } from './components/AppliedSchemesView';
import { ProfileView } from './components/ProfileView';
import { SchemeDetails } from './components/SchemeDetails';
import { OnboardingView } from './components/OnboardingView';
import { NotificationsModal } from './components/NotificationsModal';
import { GeminiChatBot } from './components/GeminiChatBot';
import { AuthModal } from './components/AuthModal';
import { AuthView } from './components/AuthView';
import { Scheme } from './types';

const MainContent: React.FC = () => {
  const { currentUser, isOnboarding, activeTab, openAuthModal } = useApp();
  const [selectedScheme, setSelectedScheme] = useState<Scheme | null>(null);

  // Do not route to home page unless user has gone through the registration process or is already registered
  if (!currentUser || currentUser.isRegistered === false) {
    return <AuthView />;
  }

  // If newly registered citizen requires onboarding customization
  if (currentUser && isOnboarding) {
    return <OnboardingView />;
  }

  const renderActiveView = () => {
    if (selectedScheme) {
      return (
        <SchemeDetails
          scheme={selectedScheme}
          onBack={() => setSelectedScheme(null)}
        />
      );
    }

    switch (activeTab) {
      case 'home':
        return <HomeView onSelectScheme={setSelectedScheme} />;
      case 'recommended':
        return <RecommendedView onSelectScheme={setSelectedScheme} />;
      case 'schemes':
        return <SchemesView onSelectScheme={setSelectedScheme} />;
      case 'deadlines':
        return <DeadlinesView onSelectScheme={setSelectedScheme} />;
      case 'applied':
        if (!currentUser) {
          return (
            <div className="p-8 text-center bg-white rounded-2xl border border-stone-200 shadow-xs max-w-md mx-auto space-y-4 my-12">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-800 rounded-xl flex items-center justify-center mx-auto text-xl font-bold">
                🏛️
              </div>
              <h3 className="text-base font-bold text-stone-900">Sign in to track your applications</h3>
              <p className="text-xs text-stone-500">
                Log in or create an account to save and track your official government scheme submissions.
              </p>
              <button
                onClick={() => openAuthModal('login')}
                className="px-4 py-2 text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-700 rounded-xl cursor-pointer shadow-xs"
              >
                Log In
              </button>
            </div>
          );
        }
        return <AppliedSchemesView onSelectScheme={setSelectedScheme} />;
      case 'profile':
        if (!currentUser) {
          return (
            <div className="p-8 text-center bg-white rounded-2xl border border-stone-200 shadow-xs max-w-md mx-auto space-y-4 my-12">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-800 rounded-xl flex items-center justify-center mx-auto text-xl font-bold">
                👤
              </div>
              <h3 className="text-base font-bold text-stone-900">Sign in to manage your profile</h3>
              <p className="text-xs text-stone-500">
                Create an account or log in to configure your education, caste category, domicile, and income criteria.
              </p>
              <button
                onClick={() => openAuthModal('signup')}
                className="px-4 py-2 text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-700 rounded-xl cursor-pointer shadow-xs"
              >
                Sign Up
              </button>
            </div>
          );
        }
        return <ProfileView />;
      default:
        return <HomeView onSelectScheme={setSelectedScheme} />;
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 flex flex-col font-sans antialiased selection:bg-orange-500/20 selection:text-orange-950">
      
      {/* Top Navigation */}
      <Navbar />

      {/* Main Workspace Layout */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto pb-28 md:pb-6">
        
        {/* Persistent Taskbar / Sidebar */}
        <Sidebar />

        {/* Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0">
          {renderActiveView()}
        </main>
      </div>

      {/* Authentication Modal */}
      <AuthModal />

      {/* Notifications Drawer / Modal */}
      <NotificationsModal onSelectScheme={setSelectedScheme} />

      {/* Floating Gemini AI Chat Bot */}
      <GeminiChatBot onSelectScheme={setSelectedScheme} />

    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
}
