import React, { useState, useEffect } from 'react';
import {
  Shield,
  UserCheck,
  Search,
  Lock,
  ArrowRight,
  Sun,
  Moon,
  AlertCircle,
  Zap,
  Droplets,
  Database,
  Mail
} from 'lucide-react';
import { AuthSession, Meter } from '../types';
import {
  createFirebaseAuthSession,
  signInAdminWithEmailPassword,
} from '../services/firestoreService';

interface LoginPortalProps {
  meters: Meter[];
  currentDataset: 'default' | 'us_cities';
  onSwitchDataset: (dataset: 'default' | 'us_cities') => Promise<void>;
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

  // User Login State (Users from Dataset)
  const [userSearch, setUserSearch] = useState<string>('');
  const [selectedMeterId, setSelectedMeterId] = useState<string>('');
  const [consumerPin, setConsumerPin] = useState<string>('1234');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Keep selectedMeterId synced with available dataset meters
  useEffect(() => {
    if (meters.length > 0 && (!selectedMeterId || !meters.some((m) => m.id === selectedMeterId))) {
      setSelectedMeterId(meters[0].id);
    }
  }, [meters, selectedMeterId]);

  const filteredMeters = meters.filter((m) => {
    if (!userSearch.trim()) return true;
    const q = userSearch.toLowerCase();
    return (
      m.id.toLowerCase().includes(q) ||
      m.consumerName.toLowerCase().includes(q) ||
      m.consumerAddress.toLowerCase().includes(q) ||
      m.consumerType.toLowerCase().includes(q)
    );
  });

  const selectedMeter = meters.find((m) => m.id === selectedMeterId) || filteredMeters[0] || null;

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

    if (!selectedMeter) {
      setErrorMsg('Please select a consumer account from the dataset.');
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
        subjectId: selectedMeter.id,
        displayName: selectedMeter.consumerName,
        subtitle: `${selectedMeter.consumerAddress} · ${selectedMeter.transformerId}`,
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

        {/* Mode 1: Consumer User Login (Dataset Users) */}
        {loginMode === 'user' ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 shadow-xs">
            {/* Left Column: Dataset User Directory */}
            <div className="lg:col-span-7 p-4 sm:p-5 border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-800 flex flex-col">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-3">
                <div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                    Select Consumer Account
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Choose your meter node from active dataset
                  </p>
                </div>

                <div className="flex items-center gap-1.5 self-start sm:self-auto w-full sm:w-auto">
                  <Database className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <select
                    value={currentDataset}
                    onChange={(e) => onSwitchDataset(e.target.value as 'default' | 'us_cities')}
                    disabled={isLoadingData}
                    className="w-full sm:w-auto bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
                  >
                    <option value="us_cities">US Cities Dataset (30 Users)</option>
                    <option value="default">Greenwood Grid (12 Users)</option>
                  </select>
                </div>
              </div>

              {/* Search input - text-base on mobile to avoid iOS Safari auto-zoom */}
              <div className="relative mb-3">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Search name, meter ID (e.g. US-ATX-101), or city..."
                  className="w-full min-h-[44px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg pl-9 pr-3 py-2.5 text-base sm:text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-slate-900 dark:focus:border-slate-400"
                />
              </div>

              {/* Scrollable Dataset Consumer List with touch optimization */}
              <div className="max-h-72 sm:max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg touch-pan-y">
                {isLoadingData ? (
                  <div className="p-8 text-center text-xs text-slate-500 dark:text-slate-400">
                    Loading consumer accounts...
                  </div>
                ) : filteredMeters.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-500 dark:text-slate-400">
                    No dataset users match "{userSearch}".
                  </div>
                ) : (
                  filteredMeters.map((m) => {
                    const isSelected = selectedMeter?.id === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => {
                          setSelectedMeterId(m.id);
                          setErrorMsg(null);
                        }}
                        className={`w-full min-h-[50px] px-3.5 py-3 text-left transition-colors flex items-center justify-between gap-3 cursor-pointer ${
                          isSelected
                            ? 'bg-slate-100 dark:bg-slate-800 font-medium'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/40 active:bg-slate-100 dark:active:bg-slate-800'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                              {m.id}
                            </span>
                            <span className="text-slate-300 dark:text-slate-700">·</span>
                            <span className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                              {m.consumerName}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                            {m.consumerAddress} · <span className="capitalize">{m.consumerType}</span>
                          </div>
                        </div>

                        <div className="text-right font-mono text-[11px] shrink-0 tabular-nums">
                          <div className="text-slate-800 dark:text-slate-200 font-semibold">
                            {m.currentPowerKw.toFixed(2)} kW
                          </div>
                          <div className="text-slate-500 dark:text-slate-400">
                            {m.currentWaterLph.toFixed(1)} L/h
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right Column: Consumer Session Form */}
            <form onSubmit={handleConsumerSubmit} className="lg:col-span-5 p-4 sm:p-5 flex flex-col justify-between space-y-4">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Consumer Account Sign In
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Access your personal smart meter telemetry and usage statement
                  </p>
                </div>

                {selectedMeter && (
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-slate-900 dark:text-white">
                        {selectedMeter.id}
                      </span>
                      <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 capitalize">
                        {selectedMeter.consumerType} Tariff · {selectedMeter.transformerId}
                      </span>
                    </div>
                    <div className="font-semibold text-slate-900 dark:text-white">
                      {selectedMeter.consumerName}
                    </div>
                    <div className="text-slate-500 dark:text-slate-400 text-[11px]">
                      {selectedMeter.consumerAddress}
                    </div>
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center gap-4 font-mono text-[11px] tabular-nums">
                      <span className="flex items-center gap-1 text-slate-700 dark:text-slate-300">
                        <Zap className="w-3.5 h-3.5 text-amber-500" />
                        {selectedMeter.currentPowerKw.toFixed(2)} / {selectedMeter.sanctionedLoadKw.toFixed(1)} kW
                      </span>
                      <span className="flex items-center gap-1 text-slate-700 dark:text-slate-300">
                        <Droplets className="w-3.5 h-3.5 text-sky-500" />
                        {selectedMeter.currentWaterLph.toFixed(1)} L/h
                      </span>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Selected Smart Meter ID
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={selectedMeter?.id || ''}
                    className="w-full min-h-[44px] bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-base sm:text-xs font-mono font-bold text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Consumer Access PIN
                  </label>
                  <div className="relative">
                    <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      value={consumerPin}
                      onChange={(e) => setConsumerPin(e.target.value)}
                      placeholder="Enter PIN (default: 1234)"
                      className="w-full min-h-[44px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg pl-8 pr-3 py-2 text-base sm:text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-slate-900 dark:focus:border-slate-400"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !selectedMeter}
                className="w-full min-h-[44px] py-3 px-4 rounded-lg text-sm sm:text-xs font-semibold bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900 flex items-center justify-center gap-2 transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
              >
                <span>
                  {isSubmitting
                    ? 'Signing In...'
                    : `Sign In as ${selectedMeter ? selectedMeter.consumerName.split('(')[0].trim() : 'Consumer'}`}
                </span>
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
