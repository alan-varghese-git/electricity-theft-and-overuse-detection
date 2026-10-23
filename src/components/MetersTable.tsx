import React, { useState } from 'react';
import { Meter, Transformer } from '../types';
import {
  AlertTriangle,
  Flame,
  ShieldCheck,
  Search,
  CheckCircle2,
  ChevronRight
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
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden mb-6 transition-colors duration-150">
      {/* Table Filter Bar */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search meter ID, consumer, or city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:bg-white dark:focus:bg-slate-800 focus:border-slate-900 dark:focus:border-slate-400 w-56 sm:w-64 transition-colors"
            />
          </div>

          <select
            value={transformerFilter}
            onChange={(e) => setTransformerFilter(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:border-slate-900 dark:focus:border-slate-400 font-mono cursor-pointer"
          >
            <option value="all">All Substations ({feederOptions.length})</option>
            {feederOptions.map((f) => (
              <option key={f.id} value={f.id}>
                {f.label}
              </option>
            ))}
          </select>
        </div>

        {/* Interactive Status Filter Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs">
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
                className={`px-3 py-1 rounded-md text-xs font-medium capitalize transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
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

      {/* High-Density Data Grid */}
      <div className="overflow-x-auto">
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
