import React, { useState } from 'react';
import {
  Shield,
  UserCheck,
  Lock,
  ArrowRight,
  Sun,
  Moon,
  AlertCircle,
  Zap,
  Layers,
  Mail
} from 'lucide-react';
import { AuthSession, Meter } from '../types';
import {
  createFirebaseAuthSession,
  signInAdminWithEmailPassword,
} from '../services/firestoreService';

interface LoginPortalProps {
  meters: Meter[];
  currentDataset: 'default' | 'us_cities' | 'sgcc';
  onSwitchDataset: (dataset: 'default' | 'us_cities' | 'sgcc') => Promise<void>;
  onAuthenticated: (session: AuthSession) => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  isLoadingData: boolean;
}

export const LoginPortal: React.FC<LoginPortalProps> = ({
  meters,
  currentDataset,
  onSwitchDataset,
  onAuthenticated,
  theme,
  onToggleTheme,
  isLoadingData,
}) => {
  const [loginMode, setLoginMode] = useState<'user' | 'admin'>('user');

  // Admin Login State (Email & Password only)
  const [adminEmail, setAdminEmail] = useState<string>('');
  const [adminPassword, setAdminPassword] = useState<string>('');

  // Consumer Login State (Meter ID & PIN)
  const [meterIdInput, setMeterIdInput] = useState<string>('');
  const [consumerPin, setConsumerPin] = useState<string>('1234');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleAdminSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!adminEmail.trim() || !adminPassword) {
      setErrorMsg('Please enter your administrator email and password.');
      return;
    }

    setIsSubmitting(true);
    try {
      const session = await signInAdminWithEmailPassword(adminEmail, adminPassword);
      onAuthenticated(session);
    } catch (err: unknown) {
      console.error('Administrator authentication error:', err);
      const firebaseError = err as { code?: string; message?: string };
      const code = firebaseError?.code || '';

      if (code === 'auth/unauthorized-domain') {
        setErrorMsg(
          'Domain not authorized: Please add "alan-varghese-git.github.io" to Authorized Domains in your Firebase Console (Authentication > Settings > Authorized Domains).'
        );
      } else if (code === 'auth/operation-not-allowed') {
        setErrorMsg(
          'Email/Password sign-in is disabled in your Firebase project. Please enable Email/Password under Firebase Console > Authentication > Sign-in method.'
        );
      } else if (code === 'auth/invalid-credential' || code === 'auth/user-not-found' || code === 'auth/wrong-password') {
        setErrorMsg('Invalid email or password. Verify the account is created in Firebase Authentication.');
      } else if (code === 'auth/too-many-requests') {
        setErrorMsg('Access temporarily blocked due to repeated failed attempts. Please try again later.');
      } else if (code === 'auth/network-request-failed') {
        setErrorMsg('Network error: Unable to reach authentication server. Please check your internet connection.');
      } else {
        setErrorMsg(firebaseError?.message || 'Authentication failed. Please verify your credentials.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConsumerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const trimmedMeterId = meterIdInput.trim().toUpperCase();
    if (!trimmedMeterId) {
      setErrorMsg('Please enter your Smart Meter ID.');
      return;
    }

    const matchedMeter = meters.find((m) => m.id.toUpperCase() === trimmedMeterId);
    if (!matchedMeter) {
      setErrorMsg(`Smart Meter ID "${trimmedMeterId}" was not found in the selected grid network. Please verify your ID or switch network.`);
      return;
    }

    if (!consumerPin.trim()) {
      setErrorMsg('Please enter your consumer access PIN (default: 1234).');
      return;
    }

    setIsSubmitting(true);
    try {
      const session = await createFirebaseAuthSession({
        role: 'user',
        subjectId: matchedMeter.id,
        displayName: matchedMeter.consumerName,
        subtitle: `${matchedMeter.consumerAddress} · ${matchedMeter.transformerId}`,
        authMethod: 'consumer_meter',
      });
      onAuthenticated(session);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to sign in to consumer account.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-150">
      {/* Top Bar */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-6">
          <div className="flex items-center gap-2.5 whitespace-nowrap shrink-0">
            <svg
              width="34"
              height="34"
              viewBox="0 0 36 36"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="shrink-0"
              aria-hidden="true"
            >
              <rect width="36" height="36" rx="8" fill="#0F172A" />
              <path
                d="M18 4.5L29.5 10.8V25.2L18 31.5L6.5 25.2V10.8L18 4.5Z"
                stroke="#334155"
                strokeWidth="1.2"
                fill="#1E293B"
              />
              <path
                d="M9.5 22.5C12 20.2 14.5 24.8 17 22.5C19.5 20.2 22 24.8 26.5 22.5"
                stroke="#38BDF8"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                d="M19.8 8.5L12.5 18.2H17.6L16.2 26.5L23.5 16.8H18.4L19.8 8.5Z"
                fill="#F59E0B"
              />
            </svg>
            <span className="text-base font-bold tracking-tight text-slate-900 dark:text-white">
              VoltWatch
            </span>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <span className="hidden sm:inline text-xs text-slate-500 dark:text-slate-400">
              Smart Grid Telemetry &amp; Utility Portal
            </span>
            <button
              type="button"
              onClick={onToggleTheme}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span>Light</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-slate-600" />
                  <span>Dark</span>
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Authentication Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12 flex flex-col justify-center">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Smart Grid Portal Sign In
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
            Select your access role to sign in as a Consumer User or System Administrator.
          </p>
        </div>

        {/* Role Selector Tabs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          <button
            type="button"
            onClick={() => {
              setLoginMode('user');
              setErrorMsg(null);
            }}
            className={`min-h-[64px] p-4 rounded-xl border text-left transition-colors cursor-pointer flex items-start gap-3.5 ${
              loginMode === 'user'
                ? 'bg-white dark:bg-slate-900 border-slate-900 dark:border-white ring-2 ring-slate-900 dark:ring-white shadow-xs'
                : 'bg-white/70 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 hover:bg-white dark:hover:bg-slate-900'
            }`}
          >
            <div
              className={`p-2.5 rounded-lg shrink-0 ${
                loginMode === 'user'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
              }`}
            >
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900 dark:text-white">
                Consumer User Login
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                Sign in with your consumer account ({meters.length} active meters) to view personal usage statistics, 24h load profiles, and billing.
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              setLoginMode('admin');
              setErrorMsg(null);
            }}
            className={`min-h-[64px] p-4 rounded-xl border text-left transition-colors cursor-pointer flex items-start gap-3.5 ${
              loginMode === 'admin'
                ? 'bg-white dark:bg-slate-900 border-slate-900 dark:border-white ring-2 ring-slate-900 dark:ring-white shadow-xs'
                : 'bg-white/70 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 hover:bg-white dark:hover:bg-slate-900'
            }`}
          >
            <div
              className={`p-2.5 rounded-lg shrink-0 ${
                loginMode === 'admin'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
              }`}
            >
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900 dark:text-white">
                Administrator Login
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                Sign in with your administrator email and password to manage grid telemetry, substations, and field incidents.
              </div>
            </div>
          </button>
        </div>

        {errorMsg && (
          <div className="mb-5 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 flex items-center gap-2.5 text-xs">
            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Mode 1: Consumer User Login */}
        {loginMode === 'user' ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 sm:p-6 max-w-md mx-auto w-full space-y-5 shadow-xs">
            <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Consumer Account Sign In
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Enter your Smart Meter ID and Access PIN to view telemetry, load analysis, and billing.
              </p>
            </div>

            <form onSubmit={handleConsumerSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Grid Network
                </label>
                <div className="relative">
                  <Layers className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <select
                    value={currentDataset}
                    onChange={(e) => {
                      onSwitchDataset(e.target.value as 'default' | 'us_cities' | 'sgcc');
                      setErrorMsg(null);
                    }}
                    disabled={isLoadingData}
                    className="w-full min-h-[44px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg pl-9 pr-8 py-2.5 text-base sm:text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-slate-900 dark:focus:border-slate-400 cursor-pointer disabled:opacity-60"
                  >
                    <option value="sgcc">SGCC State Grid Benchmark (Shanghai, Beijing · 28 Meters)</option>
                    <option value="us_cities">US Metro Grid (Austin, Seattle, Boston · 30 Meters)</option>
                    <option value="default">Greenwood Municipal Grid (12 Meters)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Smart Meter ID
                </label>
                <div className="relative">
                  <Zap className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={meterIdInput}
                    onChange={(e) => {
                      setMeterIdInput(e.target.value);
                      if (errorMsg) setErrorMsg(null);
                    }}
                    placeholder={
                      currentDataset === 'sgcc'
                        ? 'e.g. SGCC-SHA-101'
                        : currentDataset === 'us_cities'
                        ? 'e.g. US-ATX-101'
                        : 'e.g. MTR-1001'
                    }
                    className="w-full min-h-[44px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg pl-9 pr-3 py-2.5 text-base sm:text-xs font-mono font-bold uppercase text-slate-900 dark:text-white placeholder:font-normal placeholder:text-slate-400 placeholder:normal-case focus:outline-none focus:border-slate-900 dark:focus:border-slate-400"
                  />
                </div>
                <div className="flex items-center justify-between mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                  <span>
                    Sample IDs:{' '}
                    {currentDataset === 'sgcc'
                      ? 'SGCC-SHA-101, SGCC-BEI-101'
                      : currentDataset === 'us_cities'
                      ? 'US-ATX-101, US-SEA-101'
                      : 'MTR-1001, MTR-1002'}
                  </span>
                  {meters.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setMeterIdInput(meters[0].id)}
                      className="text-slate-600 dark:text-slate-300 hover:underline font-mono cursor-pointer"
                    >
                      Fill sample
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Consumer Access PIN
                </label>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={consumerPin}
                    onChange={(e) => {
                      setConsumerPin(e.target.value);
                      if (errorMsg) setErrorMsg(null);
                    }}
                    placeholder="Enter PIN (default: 1234)"
                    className="w-full min-h-[44px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg pl-9 pr-3 py-2.5 text-base sm:text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-slate-900 dark:focus:border-slate-400"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full min-h-[44px] py-3 px-4 rounded-lg text-sm sm:text-xs font-semibold bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900 flex items-center justify-center gap-2 transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
              >
                <span>{isSubmitting ? 'Signing In...' : 'Sign In to Consumer Account'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        ) : (
          /* Mode 2: Administrator Email & Password Login Only */
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 sm:p-6 max-w-md mx-auto w-full space-y-5 shadow-xs">
            <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Administrator Sign In
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Enter your administrator email address and password to access the grid management console.
              </p>
            </div>

            <form onSubmit={handleAdminSignIn} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    placeholder="admin@example.com"
                    className="w-full min-h-[44px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg pl-9 pr-3 py-2.5 text-base sm:text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-slate-900 dark:focus:border-slate-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full min-h-[44px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg pl-9 pr-3 py-2.5 text-base sm:text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-slate-900 dark:focus:border-slate-400"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full min-h-[44px] py-3 px-4 rounded-lg text-sm sm:text-xs font-semibold bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900 flex items-center justify-center gap-2 transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
              >
                <span>{isSubmitting ? 'Signing In...' : 'Sign In'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}
      </main>

      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 text-xs py-4 px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>VoltWatch · Multi-Source Smart Grid Anomaly &amp; Revenue Protection Platform</div>
          <div className="text-[11px] text-slate-400 dark:text-slate-500">
            XGBoost Multi-Utility AMI Classifier
          </div>
        </div>
      </footer>
    </div>
  );
};
