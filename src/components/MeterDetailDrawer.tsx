import React, { useState } from 'react';
import { Meter } from '../types';
import {
  X,
  AlertTriangle,
  Flame,
  ShieldCheck,
  CheckCircle2,
  FileText,
  RotateCcw
} from 'lucide-react';
import { updateMeterSimulationReading } from '../services/firestoreService';
import { runXGBoostInference } from '../services/xgboostEngine';

interface MeterDetailDrawerProps {
  meter: Meter | null;
  onClose: () => void;
  onDispatchWorkOrder: (meter: Meter) => void;
  onMeterUpdated?: (meter: Meter) => void;
  simulationHour: number;
}

export const MeterDetailDrawer: React.FC<MeterDetailDrawerProps> = ({
  meter,
  onClose,
  onDispatchWorkOrder,
  onMeterUpdated,
  simulationHour,
}) => {
  const [isUpdating, setIsUpdating] = useState(false);

  if (!meter) return null;

  const history = meter.history || [];
  const isTheft = meter.classification === 'theft';
  const isOveruse = meter.classification === 'overuse';
  const isVacant = meter.occupancyStatus === 'vacant';
  const loadPct = Math.round((meter.currentPowerKw / meter.sanctionedLoadKw) * 100);

  const handleQuickTamper = async (tamper: 'meter_bypass' | 'crypto_mining' | 'vacation' | 'none') => {
    if (isUpdating) return;
    setIsUpdating(true);
    try {
      let updated: Meter;
      if (tamper === 'meter_bypass') {
        updated = await updateMeterSimulationReading(meter, {
          powerKw: 0.04,
          waterLph: 35.0,
          tamperState: 'meter_bypass',
          hourOfDay: simulationHour,
        });
      } else if (tamper === 'crypto_mining') {
        updated = await updateMeterSimulationReading(meter, {
          powerKw: Number((meter.sanctionedLoadKw * 2.4).toFixed(2)),
          waterLph: 25.0,
          tamperState: 'crypto_mining',
          hourOfDay: simulationHour,
        });
      } else if (tamper === 'vacation') {
        updated = await updateMeterSimulationReading(meter, {
          powerKw: 0.11,
          waterLph: 0.1,
          tamperState: 'vacation',
          hourOfDay: simulationHour,
        });
      } else {
        updated = await updateMeterSimulationReading(meter, {
          powerKw: Number((meter.sanctionedLoadKw * 0.5).toFixed(2)),
          waterLph: 22.0,
          tamperState: 'none',
          hourOfDay: simulationHour,
        });
      }
      onMeterUpdated?.(updated);
    } finally {
      setIsUpdating(false);
    }
  };

  // Compute SVG chart coordinates for 24-hour diurnal profile
  const chartHeight = 150;
  const chartWidth = 540;
  const maxPower = Math.max(12, meter.sanctionedLoadKw * 2.6);
  const maxWater = 85;

  const powerPoints = history
    .map((pt, idx) => {
      const x = (idx / 23) * (chartWidth - 40) + 20;
      const y = chartHeight - (pt.powerKw / maxPower) * (chartHeight - 30) - 15;
      return `${x},${y}`;
    })
    .join(' ');

  const waterPoints = history
    .map((pt, idx) => {
      const x = (idx / 23) * (chartWidth - 40) + 20;
      const y = chartHeight - (pt.waterLph / maxWater) * (chartHeight - 30) - 15;
      return `${x},${y}`;
    })
    .join(' ');

  const sanctionedY = chartHeight - (meter.sanctionedLoadKw / maxPower) * (chartHeight - 30) - 15;

  const xgb = runXGBoostInference({
    powerKw: meter.currentPowerKw,
    waterLph: meter.currentWaterLph,
    sanctionedLoadKw: meter.sanctionedLoadKw,
    consecutiveOveruseHours: meter.consecutiveOveruseHours,
    hourOfDay: simulationHour,
    voltageV: meter.voltageV,
    powerFactor: meter.powerFactor,
  });

  const probNormal = (xgb.classProbabilities.normal * 100).toFixed(1);
  const probTheft = (xgb.classProbabilities.theft * 100).toFixed(1);
  const probOveruse = (xgb.classProbabilities.overuse * 100).toFixed(1);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-[1px]">
      <div className="w-full max-w-full sm:max-w-xl bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 h-full overflow-y-auto flex flex-col shadow-2xl">
        {/* Header */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 sticky top-0 z-10">
          <div className="min-w-0 pr-2">
            <div className="flex items-center gap-2 text-xs font-mono text-slate-500 dark:text-slate-400">
              <span className="font-bold text-slate-900 dark:text-white">{meter.id}</span>
              <span>·</span>
              <span>{meter.transformerId}</span>
              <span>·</span>
              <span className="capitalize">{meter.consumerType}</span>
            </div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white mt-0.5 truncate">{meter.consumerName}</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{meter.consumerAddress}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[40px] min-w-[40px] p-2 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer flex items-center justify-center shrink-0"
            aria-label="Close details"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-5 sm:space-y-6 flex-1">
          {/* Status Summary */}
          <div
            className={`p-4 rounded-xl border flex items-start gap-3 ${
              isTheft
                ? 'bg-rose-50/60 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-950 dark:text-rose-100'
                : isOveruse
                ? 'bg-amber-50/60 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-950 dark:text-amber-100'
                : isVacant
                ? 'bg-sky-50/60 dark:bg-sky-950/40 border-sky-200 dark:border-sky-800 text-sky-950 dark:text-sky-100'
                : 'bg-emerald-50/60 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-950 dark:text-emerald-100'
            }`}
          >
            {isTheft ? (
              <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            ) : isOveruse ? (
              <Flame className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            ) : isVacant ? (
              <ShieldCheck className="w-5 h-5 text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            )}
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-semibold">
                <span>
                  {isTheft
                    ? 'Meter Bypass Theft Detected'
                    : isOveruse
                    ? 'Sanctioned Load Overuse'
                    : isVacant
                    ? 'Verified Vacant (False Alarm Suppressed)'
                    : 'Normal Operation'}
                </span>
                <span className="text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                  · {(xgb.confidence * 100).toFixed(1)}% confidence
                </span>
              </div>
              <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300">{meter.anomalyReason}</p>
            </div>
          </div>

          {/* Core Telemetry Readings */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
            <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/40">
              <div className="text-[11px] font-sans text-slate-500 dark:text-slate-400">Power Draw</div>
              <div className="text-lg font-bold text-slate-900 dark:text-white mt-0.5 tabular-nums">
                {meter.currentPowerKw.toFixed(2)} <span className="text-xs font-normal text-slate-500 dark:text-slate-400">kW</span>
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 tabular-nums">
                {loadPct}% of {meter.sanctionedLoadKw.toFixed(1)} kW
              </div>
            </div>

            <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/40">
              <div className="text-[11px] font-sans text-slate-500 dark:text-slate-400">Water Flow</div>
              <div className="text-lg font-bold text-slate-900 dark:text-white mt-0.5 tabular-nums">
                {meter.currentWaterLph.toFixed(1)} <span className="text-xs font-normal text-slate-500 dark:text-slate-400">L/h</span>
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 capitalize font-sans">
                Status: {meter.occupancyStatus}
              </div>
            </div>

            <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/40">
              <div className="text-[11px] font-sans text-slate-500 dark:text-slate-400">Voltage</div>
              <div className="text-lg font-bold text-slate-900 dark:text-white mt-0.5 tabular-nums">
                {meter.voltageV} <span className="text-xs font-normal text-slate-500 dark:text-slate-400">V</span>
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 tabular-nums">
                PF {(meter.powerFactor || 0.95).toFixed(2)}
              </div>
            </div>

            <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/40">
              <div className="text-[11px] font-sans text-slate-500 dark:text-slate-400">W/P Ratio</div>
              <div className="text-lg font-bold text-slate-900 dark:text-white mt-0.5 tabular-nums">
                {(meter.currentWaterLph / Math.max(meter.currentPowerKw, 0.05)).toFixed(1)}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 font-sans">
                L/h per kW
              </div>
            </div>
          </div>

          {/* 24-Hour Telemetry Chart */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 bg-white dark:bg-slate-900">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3 text-xs">
              <span className="font-semibold text-slate-900 dark:text-white">24-Hour Electricity &amp; Water Profile</span>
              <div className="flex items-center gap-3 text-[11px] text-slate-600 dark:text-slate-400">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-0.5 bg-amber-500 inline-block" /> Power (kW)
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-0.5 bg-sky-500 inline-block" /> Water (L/h)
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-0.5 border-b border-dashed border-emerald-500 inline-block" /> Limit
                </span>
              </div>
            </div>

            <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-40 overflow-visible">
              <line x1="20" y1="20" x2={chartWidth - 20} y2="20" className="stroke-slate-100 dark:stroke-slate-800" strokeWidth="1" />
              <line x1="20" y1="75" x2={chartWidth - 20} y2="75" className="stroke-slate-100 dark:stroke-slate-800" strokeWidth="1" />
              <line x1="20" y1="130" x2={chartWidth - 20} y2="130" className="stroke-slate-100 dark:stroke-slate-800" strokeWidth="1" />

              <line
                x1="20"
                y1={sanctionedY}
                x2={chartWidth - 20}
                y2={sanctionedY}
                stroke="#10b981"
                strokeWidth="1.2"
                strokeDasharray="4 4"
              />

              {waterPoints && (
                <polyline fill="none" stroke="#0ea5e9" strokeWidth="2" points={waterPoints} />
              )}

              {powerPoints && (
                <polyline fill="none" stroke="#f59e0b" strokeWidth="2" points={powerPoints} />
              )}
            </svg>

            <div className="flex justify-between text-[10px] text-slate-400 dark:text-slate-500 font-mono px-4 mt-1 tabular-nums">
              <span>00:00</span>
              <span>06:00</span>
              <span>12:00</span>
              <span>18:00</span>
              <span>23:00</span>
            </div>
          </div>

          {/* XGBoost Class Probabilities */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-900 dark:text-white">XGBoost Classification Probabilities</span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">60 Boosted Trees</span>
            </div>

            <div className="space-y-2">
              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-slate-600 dark:text-slate-400">Normal Operation</span>
                  <span className="font-mono font-semibold text-slate-900 dark:text-white tabular-nums">{probNormal}%</span>
                </div>
                <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500" style={{ width: `${probNormal}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-slate-600 dark:text-slate-400">Meter Bypass Theft</span>
                  <span className="font-mono font-semibold text-rose-700 dark:text-rose-400 tabular-nums">{probTheft}%</span>
                </div>
                <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-rose-500" style={{ width: `${probTheft}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-slate-600 dark:text-slate-400">Sanctioned Overuse</span>
                  <span className="font-mono font-semibold text-amber-700 dark:text-amber-400 tabular-nums">{probOveruse}%</span>
                </div>
                <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500" style={{ width: `${probOveruse}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* Scenario Injection Controls */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3">
            <div className="text-xs font-semibold text-slate-900 dark:text-white">
              Simulate Meter Condition ({meter.id})
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => handleQuickTamper('meter_bypass')}
                disabled={isUpdating}
                className="min-h-[48px] sm:min-h-0 p-2.5 rounded-lg text-xs font-medium bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-800/70 text-rose-800 dark:text-rose-200 flex flex-col items-center justify-center gap-1 transition-colors disabled:opacity-50 cursor-pointer"
              >
                <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                <span>Inject Theft</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickTamper('crypto_mining')}
                disabled={isUpdating}
                className="min-h-[48px] sm:min-h-0 p-2.5 rounded-lg text-xs font-medium bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 dark:hover:bg-amber-900/60 border border-amber-200 dark:border-amber-800/70 text-amber-800 dark:text-amber-200 flex flex-col items-center justify-center gap-1 transition-colors disabled:opacity-50 cursor-pointer"
              >
                <Flame className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span>Inject Overuse</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickTamper('vacation')}
                disabled={isUpdating}
                className="min-h-[48px] sm:min-h-0 p-2.5 rounded-lg text-xs font-medium bg-sky-50 dark:bg-sky-950/60 hover:bg-sky-100 dark:hover:bg-sky-900/60 border border-sky-200 dark:border-sky-800/70 text-sky-800 dark:text-sky-200 flex flex-col items-center justify-center gap-1 transition-colors disabled:opacity-50 cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                <span>Set Vacant</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickTamper('none')}
                disabled={isUpdating}
                className="min-h-[48px] sm:min-h-0 p-2.5 rounded-lg text-xs font-medium bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center gap-1 transition-colors disabled:opacity-50 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                <span>Restore Normal</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 pb-safe border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between gap-3 sticky bottom-0">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums truncate">
            {new Date(meter.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
          <button
            type="button"
            onClick={() => onDispatchWorkOrder(meter)}
            className="min-h-[44px] px-4 py-2 rounded-lg text-xs font-semibold bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900 flex items-center gap-2 transition-colors cursor-pointer shrink-0 shadow-xs"
          >
            <FileText className="w-4 h-4" />
            <span>Create Work Order</span>
          </button>
        </div>
      </div>
    </div>
  );
};
