import React, { useState } from 'react';
import {
  RotateCcw,
  Plus,
  Download,
  Sun,
  Moon,
  LogOut,
  Shield,
  Menu,
  X,
  LayoutGrid,
  GitBranch,
  AlertTriangle,
  Cpu,
  Database
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
  currentDataset: 'default' | 'us_cities' | 'sgcc';
  onSwitchDataset: (dataset: 'default' | 'us_cities' | 'sgcc') => void;
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const alertTotal = theftCount + overuseCount;

  return (
    <>
      <header className="sticky top-0 z-40 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 transition-colors duration-150">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-2 sm:gap-4">
          {/* Zone 1: Professional Custom SVG Brand Logo & Wordmark */}
          <a
            href="#top"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('grid');
              setIsMobileMenuOpen(false);
            }}
            className="flex items-center gap-2 sm:gap-2.5 whitespace-nowrap shrink-0 group focus:outline-none"
          >
            <svg
              width="32"
              height="32"
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
              <span className="text-sm sm:text-base font-bold tracking-tight text-slate-900 dark:text-white block leading-none">
                VoltWatch
              </span>
              {adminSession && (
                <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5 truncate max-w-[130px] sm:max-w-none">
                  <Shield className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span className="truncate">{adminSession.subjectId}</span>
                </span>
              )}
            </div>
          </a>

          {/* Zone 2: Desktop Navigation Links (hidden on mobile) */}
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

          {/* Zone 3: Desktop Actions & Mobile Menu Toggle */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Desktop Dataset Selector */}
            <select
              value={currentDataset}
              onChange={(e) => onSwitchDataset(e.target.value as 'default' | 'us_cities' | 'sgcc')}
              className="hidden md:block bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:border-slate-900 dark:focus:border-slate-400 cursor-pointer whitespace-nowrap shrink-0"
              aria-label="Select Grid Dataset"
            >
              <option value="sgcc">SGCC State Grid (28 Nodes)</option>
              <option value="us_cities">US Cities Dataset (30 Nodes)</option>
              <option value="default">Greenwood Grid (12 Nodes)</option>
            </select>

            {/* Theme Toggle (Available on both desktop & mobile) */}
            <button
              type="button"
              onClick={onToggleTheme}
              className="min-h-[40px] min-w-[40px] sm:min-h-0 sm:min-w-0 inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              aria-label={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-600" />
              )}
            </button>

            {/* Desktop-only secondary buttons */}
            <button
              type="button"
              onClick={onOpenAuditReport}
              className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              <span>Export</span>
            </button>

            <button
              type="button"
              onClick={onResetGrid}
              className="hidden sm:inline-flex p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors shrink-0 cursor-pointer"
              title="Reset Dataset to Baseline"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={onOpenAddMeter}
              className="hidden sm:inline-flex px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900 items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Meter</span>
            </button>

            {onSignOut && (
              <button
                type="button"
                onClick={onSignOut}
                className="hidden lg:inline-flex px-2.5 py-1.5 rounded-lg text-xs font-medium bg-white dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/50 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:text-rose-700 dark:hover:text-rose-300 items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                title="Sign Out of Admin Session"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            )}

            {/* Mobile Hamburger / Quick Actions Toggle */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden min-h-[40px] min-w-[40px] p-2 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center cursor-pointer transition-colors"
              aria-label="Toggle navigation menu"
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Panel for Quick Settings & Dataset Switcher */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-4 space-y-3 animate-fade-in shadow-xl">
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                Active Grid Dataset
              </label>
              <div className="relative">
                <Database className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <select
                  value={currentDataset}
                  onChange={(e) => {
                    onSwitchDataset(e.target.value as 'default' | 'us_cities' | 'sgcc');
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full min-h-[44px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
                >
                  <option value="sgcc">SGCC State Grid (28 Nodes)</option>
                  <option value="us_cities">US Cities Dataset (30 Nodes)</option>
                  <option value="default">Greenwood Grid (12 Nodes)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  onOpenAddMeter();
                  setIsMobileMenuOpen(false);
                }}
                className="min-h-[44px] p-2.5 rounded-lg text-xs font-semibold bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Add Meter</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onOpenAuditReport();
                  setIsMobileMenuOpen(false);
                }}
                className="min-h-[44px] p-2.5 rounded-lg text-xs font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Export Audit</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  onResetGrid();
                  setIsMobileMenuOpen(false);
                }}
                className="min-h-[44px] p-2.5 rounded-lg text-xs font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reset Baseline</span>
              </button>

              {onSignOut && (
                <button
                  type="button"
                  onClick={() => {
                    onSignOut();
                    setIsMobileMenuOpen(false);
                  }}
                  className="min-h-[44px] p-2.5 rounded-lg text-xs font-semibold bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800/80 text-rose-800 dark:text-rose-200 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Fixed Mobile Bottom Tab Bar (Visible on mobile screens < 1024px) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-2 py-1.5 pb-safe flex items-center justify-around shadow-lg transition-colors duration-150">
        <button
          type="button"
          onClick={() => {
            setActiveTab('grid');
            setIsMobileMenuOpen(false);
          }}
          className={`flex-1 py-1.5 px-2 rounded-lg flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors cursor-pointer min-h-[44px] ${
            activeTab === 'grid'
              ? 'text-slate-900 dark:text-white font-bold bg-slate-100 dark:bg-slate-800/80'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <LayoutGrid className="w-4 h-4 shrink-0" />
          <span>Grid</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('topology');
            setIsMobileMenuOpen(false);
          }}
          className={`flex-1 py-1.5 px-2 rounded-lg flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors cursor-pointer min-h-[44px] ${
            activeTab === 'topology'
              ? 'text-slate-900 dark:text-white font-bold bg-slate-100 dark:bg-slate-800/80'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <GitBranch className="w-4 h-4 shrink-0" />
          <span>Feeders</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('incidents');
            setIsMobileMenuOpen(false);
          }}
          className={`flex-1 py-1.5 px-2 rounded-lg flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors cursor-pointer relative min-h-[44px] ${
            activeTab === 'incidents'
              ? 'text-slate-900 dark:text-white font-bold bg-slate-100 dark:bg-slate-800/80'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <div className="relative">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            {alertTotal > 0 && (
              <span className="absolute -top-1.5 -right-2.5 px-1 py-0.2 bg-rose-600 text-white font-mono text-[9px] font-bold rounded-full min-w-[14px] text-center leading-tight">
                {alertTotal}
              </span>
            )}
          </div>
          <span>Incidents</span>
        </button>

        <button
          type="button"
          onClick={() => {
            onOpenXGBoost();
            setIsMobileMenuOpen(false);
          }}
          className="flex-1 py-1.5 px-2 rounded-lg flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors cursor-pointer text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 min-h-[44px]"
        >
          <Cpu className="w-4 h-4 shrink-0" />
          <span>XGBoost</span>
        </button>
      </nav>
    </>
  );
};
