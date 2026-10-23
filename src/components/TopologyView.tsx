import React from 'react';
import { Meter, Transformer } from '../types';
import { Zap, Droplets } from 'lucide-react';

interface TopologyViewProps {
  meters: Meter[];
  transformers: Transformer[];
  selectedMeter: Meter | null;
  onSelectMeter: (meter: Meter) => void;
}

export const TopologyView: React.FC<TopologyViewProps> = ({
  meters,
  transformers,
  selectedMeter,
  onSelectMeter,
}) => {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 sm:p-5 mb-6 transition-colors duration-150 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-5 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            Substation Feeders &amp; Connected Smart Meters
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Distribution transformers and child AMI nodes with real-time load and non-technical loss tracking.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 dark:text-slate-400">
          <span>Normal</span>
          <span className="text-slate-300 dark:text-slate-700">·</span>
          <span className="text-rose-700 dark:text-rose-400 font-semibold">Theft Bypass</span>
          <span className="text-slate-300 dark:text-slate-700">·</span>
          <span className="text-amber-700 dark:text-amber-400 font-semibold">Overuse</span>
          <span className="text-slate-300 dark:text-slate-700">·</span>
          <span className="text-sky-700 dark:text-sky-400">Vacant</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {transformers.map((tx) => {
          const childMeters = meters.filter((m) => m.transformerId === tx.id);
          const totalMeterLoad = childMeters.reduce((acc, m) => acc + (m.currentPowerKw || 0), 0);
          const feederLoad = Math.max(tx.currentLoadKw, totalMeterLoad + 2.4);
          const discrepancy = Math.max(0, feederLoad - totalMeterLoad);
          const discPct = feederLoad > 0 ? ((discrepancy / feederLoad) * 100).toFixed(1) : '0';
          const hasTheft = childMeters.some((m) => m.classification === 'theft');
          const hasOveruse = childMeters.some((m) => m.classification === 'overuse');
          const loadCapacityRatio = Math.round((feederLoad / tx.capacityKva) * 100);

          return (
            <div
              key={tx.id}
              className={`rounded-xl border p-4 transition-colors ${
                hasTheft
                  ? 'border-rose-200 dark:border-rose-900/70 bg-rose-50/15 dark:bg-rose-950/15'
                  : hasOveruse
                  ? 'border-amber-200 dark:border-amber-900/70 bg-amber-50/15 dark:bg-amber-950/15'
                  : 'border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/30'
              }`}
            >
              {/* Transformer Header */}
              <div className="flex items-start justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">{tx.id}</span>
                    <span className="text-slate-300 dark:text-slate-700">·</span>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white">{tx.name}</h3>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{tx.location}</p>
                </div>

                <div className="text-right font-mono text-xs tabular-nums">
                  <div className="text-slate-700 dark:text-slate-300">
                    <strong className="text-slate-900 dark:text-white">{feederLoad.toFixed(1)}</strong> / {tx.capacityKva} kVA
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    Loss: {discPct}% ({discrepancy.toFixed(1)} kW)
                  </div>
                </div>
              </div>

              {/* Load Utilization Bar */}
              <div className="mb-3.5">
                <div className="flex justify-between text-[10px] text-slate-500 dark:text-slate-400 font-mono mb-1 tabular-nums">
                  <span>Feeder Utilization</span>
                  <span>{loadCapacityRatio}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      loadCapacityRatio > 85 ? 'bg-amber-500' : 'bg-slate-800 dark:bg-slate-200'
                    }`}
                    style={{ width: `${Math.min(100, loadCapacityRatio)}%` }}
                  />
                </div>
              </div>

              {/* Connected Consumer Nodes */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {childMeters.map((meter) => {
                  const isSelected = selectedMeter?.id === meter.id;
                  const isTheft = meter.classification === 'theft';
                  const isOveruse = meter.classification === 'overuse';
                  const isVacant = meter.occupancyStatus === 'vacant';

                  let statusCard =
                    'border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-600 text-slate-800 dark:text-slate-200';
                  let statusText = 'Normal';
                  let statusColor = 'text-slate-500 dark:text-slate-400';

                  if (isTheft) {
                    statusCard =
                      'border-rose-300 dark:border-rose-800 bg-rose-50/70 dark:bg-rose-950/40 text-rose-950 dark:text-rose-100';
                    statusText = 'THEFT';
                    statusColor = 'text-rose-700 dark:text-rose-400 font-bold';
                  } else if (isOveruse) {
                    statusCard =
                      'border-amber-300 dark:border-amber-800 bg-amber-50/70 dark:bg-amber-950/40 text-amber-950 dark:text-amber-100';
                    statusText = 'OVERUSE';
                    statusColor = 'text-amber-700 dark:text-amber-400 font-bold';
                  } else if (isVacant) {
                    statusCard =
                      'border-sky-200 dark:border-sky-800 bg-sky-50/70 dark:bg-sky-950/40 text-sky-950 dark:text-sky-100';
                    statusText = 'VACANT';
                    statusColor = 'text-sky-700 dark:text-sky-400 font-medium';
                  }

                  if (isSelected) {
                    statusCard += ' ring-2 ring-slate-900 dark:ring-white border-slate-900 dark:border-white';
                  }

                  return (
                    <button
                      key={meter.id}
                      type="button"
                      onClick={() => onSelectMeter(meter)}
                      className={`min-h-[64px] p-2.5 rounded-lg border text-left transition-colors cursor-pointer ${statusCard}`}
                    >
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                          {meter.id}
                        </span>
                        <span className={`text-[10px] font-mono uppercase ${statusColor}`}>
                          {statusText}
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-700 dark:text-slate-300 truncate font-medium">
                        {meter.consumerName.split('(')[0]}
                      </div>

                      <div className="mt-1.5 pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] font-mono tabular-nums">
                        <span className="flex items-center gap-0.5 text-slate-800 dark:text-slate-200">
                          <Zap className="w-2.5 h-2.5 text-amber-500" />
                          {meter.currentPowerKw.toFixed(1)} kW
                        </span>
                        <span className="flex items-center gap-0.5 text-slate-600 dark:text-slate-400">
                          <Droplets className="w-2.5 h-2.5 text-sky-600 dark:text-sky-400" />
                          {meter.currentWaterLph.toFixed(0)} L/h
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                <div>
                  Meter Sum: <strong className="text-slate-900 dark:text-white">{totalMeterLoad.toFixed(1)} kW</strong>
                </div>
                <div>{childMeters.length} connected meters</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
