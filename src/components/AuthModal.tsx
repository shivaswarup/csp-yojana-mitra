import React, { useState } from 'react';
import { 
  Mail, 
  Lock, 
  User, 
  ArrowRight, 
  X, 
  MapPin, 
  AlertCircle,
  ShieldCheck,
  Smartphone,
  Trash2,
  PlusCircle,
  CheckCircle2,
  ChevronRight,
  ArrowLeft,
  AlertTriangle,
  Copy,
  Check,
  ExternalLink
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { DeviceAccount } from '../types';

const INDIAN_STATES = [
  'Andhra Pradesh'
];

export const AuthModal: React.FC = () => {
  const { 
    currentUser,
    isAuthModalOpen, 
    setIsAuthModalOpen, 
    authModalMode, 
    setAuthModalMode,
    login, 
    signup, 
    loginWithGoogle,
    loginDirectlyWithAccount,
    deviceAccounts,
    removeDeviceAccount,
    selectDeviceAccount
  } = useApp();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [selectedState, setSelectedState] = useState('Andhra Pradesh');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingGoogle, setIsLoadingGoogle] = useState(false);
  const [selectingAccountId, setSelectingAccountId] = useState<string | null>(null);
  
  // Vercel domain authorization assistance
  const [unauthorizedDomain, setUnauthorizedDomain] = useState<string | null>(null);
  const [copiedDomain, setCopiedDomain] = useState(false);
  const [directEmail, setDirectEmail] = useState('');
  const [directName, setDirectName] = useState('');
  const [isSubmittingDirect, setIsSubmittingDirect] = useState(false);

  // Track if user is in "Device Account Chooser" mode or "Manual Form" mode
  const [authView, setAuthView] = useState<'device_chooser' | 'manual_form'>('device_chooser');

  if (!isAuthModalOpen) return null;

  const isSignUp = authModalMode === 'signup';

  const handleGoogleSignIn = async (preferredEmail?: string, preferredName?: string) => {
    setError(null);
    setUnauthorizedDomain(null);
    setIsLoadingGoogle(true);
    try {
      await loginWithGoogle(preferredEmail, preferredName);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Google sign-in could not be completed.';
      if (msg.startsWith('DOMAIN_NOT_AUTHORIZED:')) {
        const domain = msg.split(':')[1] || (typeof window !== 'undefined' ? window.location.hostname : 'your Vercel domain');
        setUnauthorizedDomain(domain);
        setError(null);
      } else {
        setError(msg);
      }
    } finally {
      setIsLoadingGoogle(false);
    }
  };

  const handleDirectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!directEmail.trim()) {
      setError('Please enter your Google account email.');
      return;
    }
    setIsSubmittingDirect(true);
    setError(null);
    try {
      await loginDirectlyWithAccount(directEmail, directName, selectedState);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Sign-in failed.';
      setError(msg);
    } finally {
      setIsSubmittingDirect(false);
    }
  };

  const handleSelectDeviceAccount = async (account: DeviceAccount) => {
    setError(null);
    setSelectingAccountId(account.id);
    try {
      await selectDeviceAccount(account);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to switch account.';
      if (msg.startsWith('DOMAIN_NOT_AUTHORIZED:')) {
        const domain = msg.split(':')[1] || (typeof window !== 'undefined' ? window.location.hostname : 'your Vercel domain');
        setUnauthorizedDomain(domain);
        setError(null);
      } else {
        setError(msg);
      }
    } finally {
      setSelectingAccountId(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (isSignUp) {
      if (!name.trim()) {
        setError('Please enter your full name');
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters long');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }
      setIsLoading(true);
      try {
        await signup(name, email, password, selectedState);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Registration failed';
        setError(msg);
      } finally {
        setIsLoading(false);
      }
    } else {
      if (!email.trim() || !password.trim()) {
        setError('Please enter both email and password');
        return;
      }
      setIsLoading(true);
      try {
        await login(email, password);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Login failed';
        if (msg.includes('NO_PREEXISTING_ACCOUNT:')) {
          setAuthModalMode('signup');
          setError('No pre-existing citizen account found for this email. We have switched you to Sign Up to register your account.');
        } else {
          setError(msg);
        }
      } finally {
        setIsLoading(false);
      }
    }
  };

  const switchMode = (newMode: 'login' | 'signup') => {
    setAuthModalMode(newMode);
    setError(null);
    setUnauthorizedDomain(null);
  };

  const hasDeviceAccounts = deviceAccounts.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-md bg-white rounded-2xl border border-stone-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Accent Header */}
        <div className="bg-emerald-800 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-lg">
              🏛️
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">YOJANA MITRA</h3>
              <p className="text-[10px] text-emerald-200 font-medium tracking-wide uppercase">
                Citizen Portal Authentication
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsAuthModalOpen(false)}
            className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 max-h-[85vh] overflow-y-auto">
          
          {/* Mode Switcher Tabs (Log In vs Sign Up) */}
          <div className="grid grid-cols-2 p-1 bg-stone-100 rounded-xl">
            <button
              type="button"
              id="auth-tab-login"
              onClick={() => switchMode('login')}
              className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                !isSignUp 
                  ? 'bg-white text-stone-900 shadow-xs' 
                  : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              Log In
            </button>
            <button
              type="button"
              id="auth-tab-signup"
              onClick={() => switchMode('signup')}
              className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                isSignUp 
                  ? 'bg-white text-stone-900 shadow-xs' 
                  : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Context Header */}
          <div className="text-center space-y-1">
            <h4 className="text-lg font-bold text-stone-900">
              {hasDeviceAccounts && authView === 'device_chooser' 
                ? (isSignUp ? 'Choose Account to Sign Up' : 'Choose an Account')
                : (isSignUp ? 'Create Your Citizen Account' : 'Welcome to Yojana Mitra')}
            </h4>
            <p className="text-xs text-stone-500">
              {hasDeviceAccounts && authView === 'device_chooser'
                ? 'Select an account from this device or continue with Google'
                : (isSignUp 
                    ? 'Enter your citizen details to discover and track verified schemes'
                    : 'Sign in with your Google account or email & password')}
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-medium text-red-800 flex items-start gap-2 animate-in fade-in duration-150">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{error}</span>
            </div>
          )}

          {/* Domain Authorization Notice for Vercel Deployment */}
          {unauthorizedDomain && (
            <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl text-stone-800 space-y-3 animate-in fade-in duration-150">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <p className="font-bold text-amber-950">
                    Vercel Domain Authorization Required in Firebase
                  </p>
                  <p className="text-stone-600 leading-relaxed">
                    Google OAuth requires <span className="font-mono font-semibold bg-amber-100 px-1 py-0.5 rounded text-amber-900">{unauthorizedDomain}</span> to be added to Authorized Domains in your Firebase Console.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(unauthorizedDomain);
                    setCopiedDomain(true);
                    setTimeout(() => setCopiedDomain(false), 2000);
                  }}
                  className="px-3 py-1.5 bg-white border border-stone-300 hover:bg-stone-50 font-semibold rounded-lg text-stone-700 flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  {copiedDomain ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-stone-500" />}
                  <span>{copiedDomain ? 'Copied Domain!' : `Copy ${unauthorizedDomain}`}</span>
                </button>

                <a
                  href="https://console.firebase.google.com/project/yojana-mitra-79a51/authentication/settings"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-700 text-white font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Firebase Authorized Domains ↗</span>
                </a>
              </div>

              {/* Direct Login Fallback with custom chosen account */}
              <div className="border-t border-amber-200/80 pt-3">
                <p className="text-[11px] font-bold text-stone-700 mb-2 uppercase tracking-wide">
                  Or enter your Google account to proceed immediately:
                </p>
                <form onSubmit={handleDirectSubmit} className="space-y-2">
                  <input
                    type="email"
                    value={directEmail}
                    onChange={(e) => setDirectEmail(e.target.value)}
                    placeholder="Enter your Google email (e.g. citizen@gmail.com)"
                    className="w-full text-xs px-3 py-2 bg-white border border-stone-300 rounded-lg focus:outline-hidden focus:border-emerald-600"
                    required
                  />
                  <input
                    type="text"
                    value={directName}
                    onChange={(e) => setDirectName(e.target.value)}
                    placeholder="Your Full Name"
                    className="w-full text-xs px-3 py-2 bg-white border border-stone-300 rounded-lg focus:outline-hidden focus:border-emerald-600"
                  />
                  <button
                    type="submit"
                    disabled={isSubmittingDirect}
                    className="w-full py-2 bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs rounded-lg cursor-pointer transition-all disabled:opacity-60"
                  >
                    {isSubmittingDirect ? 'Authenticating...' : 'Continue with this Citizen Account'}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* OPTION A: DEVICE ACCOUNT CHOOSER (When device has accounts) */}
          {/* ========================================================= */}
          {hasDeviceAccounts && authView === 'device_chooser' ? (
            <div className="space-y-3.5">
              
              {/* Accounts List on this device */}
              <div className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <span className="text-[11px] font-bold text-stone-600 uppercase tracking-wider flex items-center gap-1.5">
                    <Smartphone className="w-3.5 h-3.5 text-emerald-700" />
                    Accounts on this Device ({deviceAccounts.length})
                  </span>
                  <span className="text-[10px] text-stone-400">Click to choose</span>
                </div>

                <div className="space-y-1.5">
                  {deviceAccounts.map((account) => {
                    const isActive = currentUser?.email.toLowerCase() === account.email.toLowerCase();
                    const isProcessingThis = selectingAccountId === account.id;

                    return (
                      <div
                        key={account.id}
                        onClick={() => !isProcessingThis && handleSelectDeviceAccount(account)}
                        className={`group relative flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                          isActive 
                            ? 'bg-emerald-50/70 border-emerald-300 ring-1 ring-emerald-400/30'
                            : 'bg-white hover:bg-stone-50 border-stone-200 hover:border-stone-300'
                        } ${isProcessingThis ? 'opacity-70 pointer-events-none' : ''}`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Avatar or Monogram */}
                          <div className="relative shrink-0">
                            {account.avatar ? (
                              <img 
                                src={account.avatar} 
                                alt={account.name}
                                className="w-9 h-9 rounded-full object-cover border border-stone-200"
                              />
                            ) : (
                              <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center border border-emerald-200">
                                {account.name ? account.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'U'}
                              </div>
                            )}

                            {/* Google Badge */}
                            {account.provider === 'google' && (
                              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center shadow-xs border border-stone-200">
                                <svg className="w-2.5 h-2.5" viewBox="0 0 24 24">
                                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                                </svg>
                              </div>
                            )}
                          </div>

                          {/* Account Info */}
                          <div className="min-w-0 text-left">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-stone-900 truncate">
                                {account.name}
                              </span>
                              {isActive && (
                                <span className="inline-flex items-center gap-0.5 text-[9px] font-semibold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-full border border-emerald-200">
                                  <CheckCircle2 className="w-2.5 h-2.5" />
                                  Active
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-stone-500 truncate">{account.email}</p>
                            {account.state && (
                              <p className="text-[10px] text-stone-400 font-medium">{account.state} Domicile</p>
                            )}
                          </div>
                        </div>

                        {/* Right Actions */}
                        <div className="flex items-center gap-1 shrink-0 ml-2">
                          {isProcessingThis ? (
                            <span className="text-[10px] text-emerald-700 font-semibold animate-pulse">
                              Signing in...
                            </span>
                          ) : (
                            <>
                              <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-stone-700 group-hover:translate-x-0.5 transition-all" />
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeDeviceAccount(account.id);
                                }}
                                className="opacity-0 group-hover:opacity-100 p-1 text-stone-400 hover:text-red-600 hover:bg-stone-100 rounded-md transition-all cursor-pointer"
                                title="Remove account from device"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Google Native Account Chooser Option */}
              <button
                type="button"
                id="google-account-chooser-btn"
                onClick={() => handleGoogleSignIn()}
                disabled={isLoadingGoogle || !!selectingAccountId}
                className="w-full py-2.5 px-4 bg-white hover:bg-stone-50 text-stone-800 border border-stone-300 font-semibold text-xs rounded-xl shadow-2xs transition-all flex items-center justify-between cursor-pointer disabled:opacity-60"
              >
                <div className="flex items-center gap-2.5">
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                  <span className="text-left font-bold text-stone-800">
                    {isLoadingGoogle ? 'Connecting with Google...' : 'Choose another Google account'}
                  </span>
                </div>
                <span className="text-[10px] text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Account Chooser
                </span>
              </button>

              {/* Toggle to Use Another / Custom Email or Password Account */}
              <button
                type="button"
                id="switch-to-manual-credentials-btn"
                onClick={() => setAuthView('manual_form')}
                className="w-full py-2.5 px-4 bg-stone-50 hover:bg-stone-100 text-stone-700 border border-dashed border-stone-300 font-semibold text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <PlusCircle className="w-4 h-4 text-stone-500" />
                <span>{isSignUp ? 'Sign up with another email & password' : 'Log in with another email & password'}</span>
              </button>

            </div>
          ) : (
            /* ========================================================= */
            /* OPTION B: CREDENTIALS FORM (Default on first visit or manual) */
            /* ========================================================= */
            <div className="space-y-3.5">
              
              {/* Back to Device Accounts button (only if device accounts exist) */}
              {hasDeviceAccounts && (
                <button
                  type="button"
                  onClick={() => setAuthView('device_chooser')}
                  className="flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-emerald-800 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to accounts on this device</span>
                </button>
              )}

              {/* Google Native One-Click Sign-In */}
              <button
                type="button"
                id="google-signin-primary-btn"
                onClick={() => handleGoogleSignIn()}
                disabled={isLoadingGoogle || isLoading}
                className="w-full py-2.5 px-4 bg-white hover:bg-stone-50 text-stone-800 border border-stone-300 font-semibold text-xs rounded-xl shadow-2xs transition-all flex items-center justify-center gap-3 cursor-pointer disabled:opacity-60"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                <span>{isLoadingGoogle ? 'Connecting with Google...' : 'Continue with Google (Choose Account)'}</span>
              </button>

              <div className="relative flex items-center justify-center my-3">
                <div className="border-t border-stone-200 w-full"></div>
                <span className="bg-white px-3 text-[11px] text-stone-400 font-medium uppercase tracking-wider relative">
                  or with email & password
                </span>
              </div>

              {/* Email/Password Form */}
              <form onSubmit={handleSubmit} className="space-y-3">
                
                {isSignUp && (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">
                        Full Name <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <User className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="e.g. Shiva Swarup"
                          className="w-full text-xs pl-9 pr-3 py-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:bg-white focus:outline-hidden focus:border-emerald-600 font-medium"
                          required={isSignUp}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">
                        State of Domicile <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <MapPin className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                        <select
                          value={selectedState}
                          onChange={(e) => setSelectedState(e.target.value)}
                          className="w-full text-xs pl-9 pr-3 py-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:bg-white focus:outline-hidden focus:border-emerald-600 font-medium"
                        >
                          {INDIAN_STATES.map((st) => (
                            <option key={st} value={st}>{st}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="citizen@example.com"
                      className="w-full text-xs pl-9 pr-3 py-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:bg-white focus:outline-hidden focus:border-emerald-600 font-medium"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter password (min 6 characters)"
                      className="w-full text-xs pl-9 pr-3 py-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:bg-white focus:outline-hidden focus:border-emerald-600 font-medium"
                      required
                    />
                  </div>
                </div>

                {isSignUp && (
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      Confirm Password <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Repeat password"
                        className="w-full text-xs pl-9 pr-3 py-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:bg-white focus:outline-hidden focus:border-emerald-600 font-medium"
                        required={isSignUp}
                      />
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading || isLoadingGoogle}
                  className="w-full py-3 px-4 bg-emerald-800 hover:bg-emerald-700 active:bg-emerald-900 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 mt-2 cursor-pointer disabled:opacity-60"
                >
                  {isLoading ? (
                    <span>Processing...</span>
                  ) : (
                    <>
                      <span>{isSignUp ? 'Create Citizen Account & Continue' : 'Sign In to Account'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

              </form>
            </div>
          )}

          {/* Footer Toggle */}
          <div className="text-center pt-2 border-t border-stone-100">
            <button
              type="button"
              onClick={() => switchMode(isSignUp ? 'login' : 'signup')}
              className="text-xs font-semibold text-stone-600 hover:text-emerald-800 transition-colors cursor-pointer"
            >
              {isSignUp 
                ? 'Already have an account? Log In' 
                : "Don't have an account yet? Create One"}
            </button>
          </div>

          <div className="flex items-center justify-center gap-1.5 text-[11px] text-stone-400 pt-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
            <span>Secure Firebase Authentication & Multi-Account Selection</span>
          </div>

        </div>
      </div>
    </div>
  );
};
