import React from 'react';
import {
  RotateCcw,
  Plus,
  Download,
  Sun,
  Moon,
  LogOut,
  Shield
} from 'lucide-react';
import { AuthSession } from '../types';

interface NavbarProps {
  onOpenAddMeter: () => void;
  onResetGrid: () => void;
  onOpenAuditReport: () => void;
  activeTab: 'grid' | 'topology' | 'incidents';
  setActiveTab: (tab: 'grid' | 'topology' | 'incidents') => void;
  theftCount: number;
  overuseCount: number;
  currentDataset: 'default' | 'us_cities';
  onSwitchDataset: (dataset: 'default' | 'us_cities') => void;
  onOpenXGBoost: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  adminSession?: AuthSession | null;
  onSignOut?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenAddMeter,
  onResetGrid,
  onOpenAuditReport,
  activeTab,
  setActiveTab,
  theftCount,
  overuseCount,
  currentDataset,
  onSwitchDataset,
  onOpenXGBoost,
  theme,
  onToggleTheme,
  adminSession,
  onSignOut,
}) => {
  const alertTotal = theftCount + overuseCount;

  return (
    <header className="sticky top-0 z-40 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 transition-colors duration-150">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Zone 1: Professional Custom SVG Brand Logo & Wordmark */}
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            setActiveTab('grid');
          }}
          className="flex items-center gap-2.5 whitespace-nowrap shrink-0 group focus:outline-none"
        >
          <svg
            width="34"
            height="34"
            viewBox="0 0 36 36"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="shrink-0 transition-transform duration-150 group-hover:scale-[1.02]"
            aria-hidden="true"
          >
            {/* Outer Precision Hexagonal Shield */}
            <rect width="36" height="36" rx="8" fill="#0F172A" />
            <path
              d="M18 4.5L29.5 10.8V25.2L18 31.5L6.5 25.2V10.8L18 4.5Z"
              stroke="#334155"
              strokeWidth="1.2"
              fill="#1E293B"
            />
            {/* Multi-Source Water Sine Wave */}
            <path
              d="M9.5 22.5C12 20.2 14.5 24.8 17 22.5C19.5 20.2 22 24.8 26.5 22.5"
              stroke="#38BDF8"
              strokeWidth="2"
              strokeLinecap="round"
            />
            {/* High-Voltage Precision Vector Bolt */}
            <path
              d="M19.8 8.5L12.5 18.2H17.6L16.2 26.5L23.5 16.8H18.4L19.8 8.5Z"
              fill="#F59E0B"
            />
          </svg>
          <div>
            <span className="text-base font-bold tracking-tight text-slate-900 dark:text-white block leading-none">
              VoltWatch
            </span>
            {adminSession && (
              <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                <Shield className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400" />
                {adminSession.subjectId}
              </span>
            )}
          </div>
        </a>

        {/* Zone 2: Clean Single-Line Navigation Links */}
        <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-400">
          <button
            type="button"
            onClick={() => setActiveTab('grid')}
            className={`py-5 border-b-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'grid'
                ? 'border-slate-900 dark:border-white text-slate-900 dark:text-white font-semibold'
                : 'border-transparent hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Grid Telemetry
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('topology')}
            className={`py-5 border-b-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'topology'
                ? 'border-slate-900 dark:border-white text-slate-900 dark:text-white font-semibold'
                : 'border-transparent hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Substations
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('incidents')}
            className={`py-5 border-b-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'incidents'
                ? 'border-slate-900 dark:border-white text-slate-900 dark:text-white font-semibold'
                : 'border-transparent hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span>Incidents</span>
            {alertTotal > 0 && (
              <span className="font-mono text-xs font-semibold text-rose-600 dark:text-rose-400 tabular-nums">
                ({alertTotal})
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={onOpenXGBoost}
            className="py-5 border-b-2 border-transparent hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            XGBoost Engine
          </button>
        </nav>

        {/* Zone 3: Dataset Selector, Theme Toggle & Primary Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <select
            value={currentDataset}
            onChange={(e) => onSwitchDataset(e.target.value as 'default' | 'us_cities')}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:border-slate-900 dark:focus:border-slate-400 cursor-pointer whitespace-nowrap shrink-0"
            aria-label="Select Grid Dataset"
          >
            <option value="us_cities">US Cities Dataset (30 Nodes)</option>
            <option value="default">Greenwood Grid (12 Nodes)</option>
          </select>

          <button
            type="button"
            onClick={onToggleTheme}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {theme === 'dark' ? (
              <Sun className="w-3.5 h-3.5 text-amber-400" />
            ) : (
              <Moon className="w-3.5 h-3.5 text-slate-600" />
            )}
          </button>

          <button
            type="button"
            onClick={onOpenAuditReport}
            className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <span className="hidden xl:inline">Export</span>
          </button>

          <button
            type="button"
            onClick={onResetGrid}
            className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors shrink-0 cursor-pointer"
            title="Reset Dataset to Baseline"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={onOpenAddMeter}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900 flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Meter</span>
          </button>

          {onSignOut && (
            <button
              type="button"
              onClick={onSignOut}
              className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-white dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/50 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:text-rose-700 dark:hover:text-rose-300 flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              title="Sign Out of Admin Session"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
