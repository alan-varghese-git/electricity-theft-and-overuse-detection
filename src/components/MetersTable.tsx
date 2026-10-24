import React, { useState } from 'react';
import { Meter, Transformer } from '../types';
import {
  AlertTriangle,
  Flame,
  ShieldCheck,
  Search,
  CheckCircle2,
  ChevronRight,
  ChevronDown
} from 'lucide-react';

interface MetersTableProps {
  meters: Meter[];
  transformers?: Transformer[];
  selectedMeter: Meter | null;
  onSelectMeter: (meter: Meter) => void;
  statusFilter: string;
  setStatusFilter: (filter: 'all' | 'theft' | 'overuse' | 'normal') => void;
}

export const MetersTable: React.FC<MetersTableProps> = ({
  meters,
  transformers = [],
  selectedMeter,
  onSelectMeter,
  statusFilter,
  setStatusFilter,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [transformerFilter, setTransformerFilter] = useState('all');

  // Unique feeder list from transformers or meters
  const feederOptions =
    transformers.length > 0
      ? transformers.map((t) => ({ id: t.id, label: `${t.id} — ${t.name}` }))
      : Array.from(new Set(meters.map((m) => m.transformerId))).map((id) => ({
          id,
          label: id,
        }));

  const filteredMeters = meters.filter((meter) => {
    if (statusFilter !== 'all' && meter.classification !== statusFilter) {
      return false;
    }
    if (transformerFilter !== 'all' && meter.transformerId !== transformerFilter) {
      return false;
    }
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const matchId = meter.id.toLowerCase().includes(q);
      const matchName = meter.consumerName.toLowerCase().includes(q);
      const matchAddr = meter.consumerAddress.toLowerCase().includes(q);
      return matchId || matchName || matchAddr;
    }
    return true;
  });

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden mb-6 transition-colors duration-150 shadow-xs">
      {/* Table Filter Bar */}
      <div className="p-3.5 sm:p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2.5 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search ID, consumer, or city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full min-h-[44px] sm:min-h-0 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg pl-9 pr-3 py-2 sm:py-1.5 text-base sm:text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:bg-white dark:focus:bg-slate-800 focus:border-slate-900 dark:focus:border-slate-400 transition-colors"
            />
          </div>

          <div className="relative w-full sm:w-auto min-w-0">
            <select
              value={transformerFilter}
              onChange={(e) => setTransformerFilter(e.target.value)}
              className="w-full sm:w-auto min-w-0 min-h-[44px] sm:min-h-0 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg pl-3 pr-8 py-2 sm:py-1.5 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:border-slate-900 dark:focus:border-slate-400 font-mono cursor-pointer appearance-none truncate"
            >
              <option value="all">All Substations ({feederOptions.length})</option>
              {feederOptions.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.label}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5 text-slate-400 dark:text-slate-500">
              <ChevronDown className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Interactive Status Filter Tabs with horizontal touch scroll */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs overflow-x-auto w-full sm:w-auto no-scrollbar touch-pan-x">
          {(['all', 'theft', 'overuse', 'normal'] as const).map((filter) => {
            const count =
              filter === 'all'
                ? meters.length
                : meters.filter((m) => m.classification === filter).length;
            const isActive = statusFilter === filter;

            return (
              <button
                key={filter}
                type="button"
                onClick={() => setStatusFilter(filter)}
                className={`min-h-[36px] sm:min-h-0 flex-1 sm:flex-none px-3 py-1.5 sm:py-1 rounded-md text-xs font-medium capitalize transition-colors whitespace-nowrap shrink-0 cursor-pointer text-center ${
                  isActive
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-semibold shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {filter} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Mobile Card View (Optimized for screens < 768px) */}
      <div className="block md:hidden divide-y divide-slate-100 dark:divide-slate-800">
        {filteredMeters.length === 0 ? (
          <div className="text-center py-12 px-4 text-xs text-slate-500 dark:text-slate-400">
            No smart meters match the current search or filter criteria.
          </div>
        ) : (
          filteredMeters.map((meter) => {
            const isSelected = selectedMeter?.id === meter.id;
            const isTheft = meter.classification === 'theft';
            const isOveruse = meter.classification === 'overuse';
            const isVacant = meter.occupancyStatus === 'vacant';
            const loadPct = Math.round((meter.currentPowerKw / meter.sanctionedLoadKw) * 100);

            return (
              <div
                key={meter.id}
                onClick={() => onSelectMeter(meter)}
                className={`p-4 transition-colors cursor-pointer active:bg-slate-100 dark:active:bg-slate-800 ${
                  isSelected
                    ? 'bg-slate-100 dark:bg-slate-800 ring-2 ring-inset ring-slate-900 dark:ring-white'
                    : isTheft
                    ? 'bg-rose-50/30 dark:bg-rose-950/20'
                    : isOveruse
                    ? 'bg-amber-50/30 dark:bg-amber-950/20'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                }`}
              >
                {/* Card Top Row: ID, Substation & Status */}
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                      {meter.id}
                    </span>
                    <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                      · {meter.transformerId}
                    </span>
                  </div>

                  <div>
                    {isTheft ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 dark:text-rose-400 bg-rose-100/70 dark:bg-rose-950/80 px-2 py-0.5 rounded-md">
                        <AlertTriangle className="w-3 h-3 text-rose-600 dark:text-rose-400" />
                        <span>Theft ({Math.round(meter.theftProbability * 100)}%)</span>
                      </span>
                    ) : isOveruse ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 dark:text-amber-400 bg-amber-100/70 dark:bg-amber-950/80 px-2 py-0.5 rounded-md">
                        <Flame className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                        <span>Overuse ({Math.round(meter.overuseProbability * 100)}%)</span>
                      </span>
                    ) : isVacant ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-sky-700 dark:text-sky-400 bg-sky-100/70 dark:bg-sky-950/80 px-2 py-0.5 rounded-md">
                        <ShieldCheck className="w-3 h-3 text-sky-600 dark:text-sky-400" />
                        <span>Vacant</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-100/70 dark:bg-emerald-950/80 px-2 py-0.5 rounded-md">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                        <span>Normal</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Consumer info */}
                <div className="font-semibold text-xs text-slate-900 dark:text-white">
                  {meter.consumerName}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                  {meter.consumerAddress} · <span className="capitalize">{meter.consumerType}</span>
                </div>

                {/* Metrics bar */}
                <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs font-mono tabular-nums">
                  <div>
                    <span className="text-[10px] font-sans text-slate-400 dark:text-slate-500 block">Power Load</span>
                    <span
                      className={`font-bold ${
                        isTheft
                          ? 'text-rose-600 dark:text-rose-400'
                          : isOveruse
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-slate-900 dark:text-white'
                      }`}
                    >
                      {meter.currentPowerKw.toFixed(2)} kW
                    </span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 ml-1">({loadPct}%)</span>
                  </div>

                  <div>
                    <span className="text-[10px] font-sans text-slate-400 dark:text-slate-500 block">Sanctioned</span>
                    <span className="text-slate-600 dark:text-slate-400">
                      {meter.sanctionedLoadKw.toFixed(1)} kW
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-sans text-slate-400 dark:text-slate-500 block">Water Flow</span>
                    <span className="text-slate-800 dark:text-slate-200 font-semibold">
                      {meter.currentWaterLph.toFixed(1)} L/h
                    </span>
                  </div>

                  <div className="flex items-center text-slate-400 dark:text-slate-500">
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Desktop High-Density Data Grid (Visible on md and larger) */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-medium">
              <th className="py-3 px-4">Meter ID</th>
              <th className="py-3 px-4">Consumer &amp; Location</th>
              <th className="py-3 px-3">Substation</th>
              <th className="py-3 px-3 text-right">Power (kW)</th>
              <th className="py-3 px-3 text-right">Limit (kW)</th>
              <th className="py-3 px-3 text-right">Water (L/h)</th>
              <th className="py-3 px-3">Status</th>
              <th className="py-3 px-4 text-right">Inspect</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {filteredMeters.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-12 text-slate-500 dark:text-slate-400">
                  No smart meters match the current search or filter criteria.
                </td>
              </tr>
            ) : (
              filteredMeters.map((meter) => {
                const isSelected = selectedMeter?.id === meter.id;
                const isTheft = meter.classification === 'theft';
                const isOveruse = meter.classification === 'overuse';
                const isVacant = meter.occupancyStatus === 'vacant';
                const loadPct = Math.round((meter.currentPowerKw / meter.sanctionedLoadKw) * 100);

                return (
                  <tr
                    key={meter.id}
                    onClick={() => onSelectMeter(meter)}
                    className={`cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-slate-100 dark:bg-slate-800'
                        : isTheft
                        ? 'bg-rose-50/30 dark:bg-rose-950/20 hover:bg-rose-50/60 dark:hover:bg-rose-950/35'
                        : isOveruse
                        ? 'bg-amber-50/30 dark:bg-amber-950/20 hover:bg-amber-50/60 dark:hover:bg-amber-950/35'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <td className="py-3 px-4 font-mono font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                      {meter.id}
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900 dark:text-slate-100">{meter.consumerName}</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[260px]">
                        {meter.consumerAddress} · <span className="capitalize">{meter.consumerType}</span>
                      </div>
                    </td>

                    <td className="py-3 px-3 font-mono text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      {meter.transformerId}
                    </td>

                    <td className="py-3 px-3 text-right font-mono tabular-nums whitespace-nowrap">
                      <span
                        className={`font-semibold ${
                          isTheft
                            ? 'text-rose-600 dark:text-rose-400'
                            : isOveruse
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-slate-900 dark:text-slate-100'
                        }`}
                      >
                        {meter.currentPowerKw.toFixed(2)}
                      </span>
                      <span className="text-[11px] text-slate-400 dark:text-slate-500 ml-1">({loadPct}%)</span>
                    </td>

                    <td className="py-3 px-3 text-right font-mono text-slate-600 dark:text-slate-400 tabular-nums whitespace-nowrap">
                      {meter.sanctionedLoadKw.toFixed(1)}
                    </td>

                    <td className="py-3 px-3 text-right font-mono text-slate-800 dark:text-slate-200 tabular-nums whitespace-nowrap">
                      {meter.currentWaterLph.toFixed(1)}
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap">
                      {isTheft ? (
                        <span className="inline-flex items-center gap-1.5 text-rose-700 dark:text-rose-400 font-semibold">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0" />
                          <span>Theft Bypass · {Math.round(meter.theftProbability * 100)}%</span>
                        </span>
                      ) : isOveruse ? (
                        <span className="inline-flex items-center gap-1.5 text-amber-700 dark:text-amber-400 font-semibold">
                          <Flame className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                          <span>Overuse · {Math.round(meter.overuseProbability * 100)}%</span>
                        </span>
                      ) : isVacant ? (
                        <span className="inline-flex items-center gap-1.5 text-sky-700 dark:text-sky-400 font-medium">
                          <ShieldCheck className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 shrink-0" />
                          <span>Vacant (0-Alarm)</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <span>Normal</span>
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectMeter(meter);
                        }}
                        className="p-1 rounded hover:bg-slate-200/70 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                        aria-label={`Inspect ${meter.id}`}
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
