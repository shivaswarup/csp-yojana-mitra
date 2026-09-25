import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Mail, 
  Lock, 
  User, 
  ArrowRight, 
  Sparkles, 
  CheckCircle2, 
  Building2,
  MapPin,
  Loader2,
  Users,
  ChevronRight
} from 'lucide-react';
import { useApp } from '../context/AppContext';

const INDIAN_STATES = [
  'Andhra Pradesh'
];

export const AuthView: React.FC = () => {
  const { 
    login, 
    signup, 
    loginWithGoogle, 
    loginDirectlyWithAccount,
    deviceAccounts, 
    selectDeviceAccount 
  } = useApp();

  const [isSignUp, setIsSignUp] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [selectedState, setSelectedState] = useState('Andhra Pradesh');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingGoogle, setIsLoadingGoogle] = useState(false);
  const [selectingAccountId, setSelectingAccountId] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setError(null);
    setIsLoadingGoogle(true);
    try {
      await loginWithGoogle(email.trim() || undefined, name.trim() || undefined);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Google sign-in could not be completed.';
      setError(msg);
    } finally {
      setIsLoadingGoogle(false);
    }
  };

  const handleSelectAccount = async (account: any) => {
    setSelectingAccountId(account.id);
    setError(null);
    try {
      await selectDeviceAccount(account);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not activate account.';
      setError(msg);
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
        setError('Password must be at least 6 characters');
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
        const msg = err instanceof Error ? err.message : 'Registration failed.';
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
        const msg = err instanceof Error ? err.message : 'Login failed.';
        if (msg.includes('NO_PREEXISTING_ACCOUNT')) {
          setError('No pre-existing account found for this email. Switched to registration so you can create your citizen account.');
          setIsSignUp(true);
        } else {
          setError(msg);
        }
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      
      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-3">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-800 text-white font-bold text-3xl shadow-sm border border-emerald-700">
          🏛️
        </div>
        <div>
          <h1 className="text-3xl font-bold text-stone-900 tracking-tight">
            YOJANA MITRA
          </h1>
          <p className="text-xs font-semibold text-emerald-800 mt-1 uppercase tracking-wider">
            Government of India &amp; State Welfare Gateway
          </p>
          <p className="text-xs text-stone-500 mt-0.5">
            Government schemes &amp; scholarships, made personal.
          </p>
        </div>
      </div>

      {/* Auth Container */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 sm:px-10 rounded-2xl border border-stone-200 shadow-sm space-y-6">
          
          {/* Header Title */}
          <div className="text-center space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-900 text-[11px] font-bold mb-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
              <span>{isSignUp ? 'Citizen Registration' : 'Citizen Sign In'}</span>
            </div>
            <h2 className="text-xl font-bold text-stone-900">
              {isSignUp ? 'Create Citizen Account' : 'Sign In to Your Account'}
            </h2>
            <p className="text-xs text-stone-500 max-w-xs mx-auto">
              {isSignUp 
                ? 'Register to unlock access to personalized welfare schemes, scholarships, and the Home dashboard.'
                : 'Sign in to access your registered profile and personalized state schemes.'}
            </p>
          </div>

          {/* Quick Select from Saved Device Accounts if user already registered on this device */}
          {deviceAccounts && deviceAccounts.length > 0 && (
            <div className="p-3.5 bg-stone-50 border border-stone-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-[11px] font-bold text-stone-600 uppercase tracking-wider">
                <span className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Saved Device Accounts</span>
                </span>
                <span className="text-[10px] text-stone-400 font-normal">Already registered</span>
              </div>
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {deviceAccounts.slice(0, 3).map((acc) => (
                  <button
                    key={acc.id}
                    type="button"
                    onClick={() => handleSelectAccount(acc)}
                    disabled={selectingAccountId === acc.id}
                    className="w-full flex items-center justify-between p-2 rounded-lg bg-white border border-stone-200 hover:border-emerald-500 hover:bg-emerald-50/40 text-left transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-bold shrink-0">
                        {acc.name ? acc.name.charAt(0).toUpperCase() : 'C'}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-stone-900 truncate group-hover:text-emerald-900">
                          {acc.name || 'Citizen'}
                        </div>
                        <div className="text-[10px] text-stone-500 truncate">
                          {acc.email}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 shrink-0">
                      {selectingAccountId === acc.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <>
                          <span>Select</span>
                          <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                        </>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs font-semibold text-red-700 leading-relaxed">
              {error}
            </div>
          )}

          {/* Google Auth Button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isLoadingGoogle}
            className="w-full py-2.5 px-4 bg-white hover:bg-stone-50 text-stone-800 border border-stone-300 font-semibold text-xs rounded-xl shadow-2xs transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-60"
          >
            {isLoadingGoogle ? (
              <Loader2 className="w-4 h-4 animate-spin text-stone-600" />
            ) : (
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            )}
            <span>
              {isLoadingGoogle 
                ? 'Connecting to Google...' 
                : (isSignUp ? 'Register with Google' : 'Continue with Google')}
            </span>
          </button>

          <div className="relative flex py-1 items-center">
            <div className="grow border-t border-stone-200"></div>
            <span className="shrink mx-3 text-[11px] text-stone-400 font-medium">or continue with credentials</span>
            <div className="grow border-t border-stone-200"></div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            
            {isSignUp && (
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Shiva Kumar"
                    className="w-full text-xs pl-10 pr-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-lg focus:bg-white focus:outline-hidden focus:border-emerald-600 font-medium"
                    required={isSignUp}
                  />
                </div>
              </div>
            )}

            {isSignUp && (
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Domicile State
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                  <select
                    value={selectedState}
                    onChange={(e) => setSelectedState(e.target.value)}
                    className="w-full text-xs pl-10 pr-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-lg focus:bg-white focus:outline-hidden focus:border-emerald-600 font-medium cursor-pointer"
                  >
                    {INDIAN_STATES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="citizen@example.com"
                  className="w-full text-xs pl-10 pr-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-lg focus:bg-white focus:outline-hidden focus:border-emerald-600 font-medium"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full text-xs pl-10 pr-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-lg focus:bg-white focus:outline-hidden focus:border-emerald-600 font-medium"
                  required
                />
              </div>
            </div>

            {isSignUp && (
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full text-xs pl-10 pr-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-lg focus:bg-white focus:outline-hidden focus:border-emerald-600 font-medium"
                    required={isSignUp}
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-emerald-800 hover:bg-emerald-700 active:bg-emerald-900 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 mt-3 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin text-white" />
              ) : (
                <ArrowRight className="w-4 h-4" />
              )}
              <span>
                {isLoading 
                  ? (isSignUp ? 'Registering Citizen...' : 'Signing In...')
                  : (isSignUp ? 'Complete Registration & Continue to Home' : 'Sign In to Yojana Mitra')}
              </span>
            </button>

          </form>

          {/* Toggle between Sign in and Sign up */}
          <div className="text-center pt-3 border-t border-stone-100">
            <button
              type="button"
              onClick={() => { setIsSignUp(!isSignUp); setError(null); }}
              className="text-xs font-semibold text-stone-600 hover:text-emerald-800 transition-colors cursor-pointer"
            >
              {isSignUp 
                ? 'Already have an account? Sign in' 
                : "Don't have an account? Register as a new Citizen"}
            </button>
          </div>

        </div>
      </div>

    </div>
  );
};
