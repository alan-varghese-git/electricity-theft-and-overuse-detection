import React from 'react';
import { Meter, Transformer } from '../types';

interface StatsOverviewProps {
  meters: Meter[];
  transformers: Transformer[];
  onFilterByStatus?: (status: 'all' | 'theft' | 'overuse' | 'normal') => void;
  activeFilter?: string;
}

export const StatsOverview: React.FC<StatsOverviewProps> = ({
  meters,
  onFilterByStatus,
  activeFilter = 'all',
}) => {
  const totalMeters = meters.length;
  const theftMeters = meters.filter((m) => m.classification === 'theft');
  const overuseMeters = meters.filter((m) => m.classification === 'overuse');
  const normalMeters = meters.filter((m) => m.classification === 'normal');
  const vacantMeters = meters.filter((m) => m.occupancyStatus === 'vacant' && m.classification === 'normal');

  const totalDemandKw = meters.reduce((acc, m) => acc + (m.currentPowerKw || 0), 0);
  const totalSanctionedKw = meters.reduce((acc, m) => acc + (m.sanctionedLoadKw || 0), 0);
  const totalWaterFlowLph = meters.reduce((acc, m) => acc + (m.currentWaterLph || 0), 0);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden mb-5 transition-colors duration-150 shadow-xs">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 divide-y sm:divide-y-0 divide-slate-200 dark:divide-slate-800 sm:divide-x">
        {/* 1. Total Monitored Meters */}
        <button
          type="button"
          onClick={() => onFilterByStatus?.('all')}
          className={`p-3 sm:p-4 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer min-h-[80px] ${
            activeFilter === 'all' ? 'bg-slate-50 dark:bg-slate-800/60 ring-1 ring-slate-900/20 dark:ring-white/20' : ''
          }`}
        >
          <div className="text-[11px] sm:text-xs font-medium text-slate-500 dark:text-slate-400 truncate">Total Smart Meters</div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-slate-900 dark:text-white mt-1 tabular-nums">
            {totalMeters}
          </div>
          <div className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5 tabular-nums truncate">
            {normalMeters.length} normal · {vacantMeters.length} vacant
          </div>
        </button>

        {/* 2. Theft Bypass Alerts */}
        <button
          type="button"
          onClick={() => onFilterByStatus?.('theft')}
          className={`p-3 sm:p-4 text-left transition-colors hover:bg-rose-50/40 dark:hover:bg-rose-950/30 cursor-pointer min-h-[80px] ${
            activeFilter === 'theft' ? 'bg-rose-50/50 dark:bg-rose-950/40 ring-1 ring-rose-500/30' : ''
          }`}
        >
          <div className="text-[11px] sm:text-xs font-medium text-rose-700 dark:text-rose-400 truncate">Meter Bypass Theft</div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-rose-600 dark:text-rose-400 mt-1 tabular-nums">
            {theftMeters.length}
          </div>
          <div className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
            Active water · Zero power
          </div>
        </button>

        {/* 3. Sanctioned Overuse */}
        <button
          type="button"
          onClick={() => onFilterByStatus?.('overuse')}
          className={`p-3 sm:p-4 text-left transition-colors hover:bg-amber-50/40 dark:hover:bg-amber-950/30 cursor-pointer min-h-[80px] ${
            activeFilter === 'overuse' ? 'bg-amber-50/50 dark:bg-amber-950/40 ring-1 ring-amber-500/30' : ''
          }`}
        >
          <div className="text-[11px] sm:text-xs font-medium text-amber-700 dark:text-amber-400 truncate">Sanctioned Overuse</div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-amber-600 dark:text-amber-400 mt-1 tabular-nums">
            {overuseMeters.length}
          </div>
          <div className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
            Exceeding kW limit
          </div>
        </button>

        {/* 4. Active Grid Power Load */}
        <div className="p-3 sm:p-4 text-left min-h-[80px]">
          <div className="text-[11px] sm:text-xs font-medium text-slate-500 dark:text-slate-400 truncate">Total Power Draw</div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-slate-900 dark:text-white mt-1 tabular-nums truncate">
            {totalDemandKw.toFixed(1)} <span className="text-xs font-normal text-slate-500 dark:text-slate-400">kW</span>
          </div>
          <div className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5 tabular-nums truncate">
            of {totalSanctionedKw.toFixed(0)} kW limit
          </div>
        </div>

        {/* 5. Municipal Water Correlation */}
        <div className="p-3 sm:p-4 text-left col-span-2 sm:col-span-1 min-h-[80px]">
          <div className="text-[11px] sm:text-xs font-medium text-slate-500 dark:text-slate-400 truncate">Total Water Flow</div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-slate-900 dark:text-white mt-1 tabular-nums truncate">
            {totalWaterFlowLph.toFixed(0)} <span className="text-xs font-normal text-slate-500 dark:text-slate-400">L/h</span>
          </div>
          <div className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
            Occupancy stream
          </div>
        </div>
      </div>
    </div>
  );
};
