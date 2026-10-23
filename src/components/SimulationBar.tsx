import React, { useState, useEffect } from 'react';
import {
  Play,
  Pause,
  FastForward,
  AlertTriangle,
  Flame,
  ShieldCheck,
  RotateCcw,
  CheckCircle2
} from 'lucide-react';
import { Meter } from '../types';
import { updateMeterSimulationReading } from '../services/firestoreService';

interface SimulationBarProps {
  meters: Meter[];
  selectedMeter: Meter | null;
  onSelectMeter: (meter: Meter | null) => void;
  isSimulating: boolean;
  setIsSimulating: React.Dispatch<React.SetStateAction<boolean>>;
  simSpeed: number;
  setSimSpeed: (speed: number) => void;
  simulationHour: number;
  setSimulationHour: React.Dispatch<React.SetStateAction<number>>;
}

export const SimulationBar: React.FC<SimulationBarProps> = ({
  meters,
  selectedMeter,
  onSelectMeter,
  isSimulating,
  setIsSimulating,
  simulationHour,
  setSimulationHour,
}) => {
  const [targetId, setTargetId] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusFeedback, setStatusFeedback] = useState<string | null>(null);

  // Keep targetId synced with selectedMeter or first available meter
  useEffect(() => {
    if (selectedMeter) {
      setTargetId(selectedMeter.id);
    } else if (meters.length > 0 && (!targetId || !meters.some((m) => m.id === targetId))) {
      setTargetId(meters[0].id);
    }
  }, [selectedMeter, meters, targetId]);

  const showFeedback = (msg: string) => {
    setStatusFeedback(msg);
    setTimeout(() => setStatusFeedback(null), 4000);
  };

  const getTargetMeter = (): Meter | null => {
    if (selectedMeter) return selectedMeter;
    return meters.find((m) => m.id === targetId) || meters[0] || null;
  };

  const handleInjectScenario = async (scenario: 'theft' | 'overuse' | 'vacation' | 'normal') => {
    const target = getTargetMeter();
    if (!target || isProcessing) return;

    setIsProcessing(true);
    try {
      let updated: Meter;
      if (scenario === 'theft') {
        updated = await updateMeterSimulationReading(target, {
          powerKw: 0.04,
          waterLph: 38.5,
          tamperState: 'meter_bypass',
          hourOfDay: simulationHour,
        });
        showFeedback(`${updated.id}: Injected Meter Bypass → Classified as Theft (${Math.round(updated.theftProbability * 100)}%)`);
      } else if (scenario === 'overuse') {
        const highLoad = Number((target.sanctionedLoadKw * 2.4).toFixed(2));
        updated = await updateMeterSimulationReading(target, {
          powerKw: highLoad,
          waterLph: 26.0,
          tamperState: 'crypto_mining',
          hourOfDay: simulationHour,
        });
        showFeedback(`${updated.id}: Injected Overload (${highLoad} kW) → Classified as Overuse (${Math.round(updated.overuseProbability * 100)}%)`);
      } else if (scenario === 'vacation') {
        updated = await updateMeterSimulationReading(target, {
          powerKw: 0.12,
          waterLph: 0.1,
          tamperState: 'vacation',
          hourOfDay: simulationHour,
        });
        showFeedback(`${updated.id}: Set Vacation Mode (0.1 L/h water) → False Alarm Suppressed`);
      } else {
        const normalLoad = Number((target.sanctionedLoadKw * 0.45).toFixed(2));
        updated = await updateMeterSimulationReading(target, {
          powerKw: normalLoad,
          waterLph: 20.0,
          tamperState: 'none',
          hourOfDay: simulationHour,
        });
        showFeedback(`${updated.id}: Restored to Normal Baseline (${normalLoad} kW, 20.0 L/h)`);
      }

      if (selectedMeter && selectedMeter.id === updated.id) {
        onSelectMeter(updated);
      }
    } catch (err) {
      console.error('Scenario injection failed:', err);
      showFeedback('Failed to update meter reading. Check connection.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 mb-5 transition-colors duration-150 shadow-xs">
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Left: Target Meter Selection & Scenario Injection Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <label htmlFor="target-meter-select" className="text-xs font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap shrink-0">
              Target Meter:
            </label>
            <select
              id="target-meter-select"
              value={targetId}
              onChange={(e) => {
                const newId = e.target.value;
                setTargetId(newId);
                if (selectedMeter) {
                  const found = meters.find((m) => m.id === newId);
                  if (found) onSelectMeter(found);
                }
              }}
              className="flex-1 sm:flex-none min-h-[40px] sm:min-h-0 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-mono font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-slate-900 dark:focus:border-slate-400 cursor-pointer"
            >
              {meters.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.id} — {m.consumerName.split('(')[0].trim()} ({m.classification.toUpperCase()})
                </option>
              ))}
            </select>
          </div>

          {/* Scenario Buttons: 2x2 grid on mobile, flex on desktop */}
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={() => handleInjectScenario('theft')}
              disabled={isProcessing || meters.length === 0}
              className="min-h-[40px] sm:min-h-0 px-3 py-1.5 rounded-lg text-xs font-medium bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-800/70 text-rose-800 dark:text-rose-200 flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 whitespace-nowrap cursor-pointer"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0" />
              <span>Inject Theft</span>
            </button>

            <button
              type="button"
              onClick={() => handleInjectScenario('overuse')}
              disabled={isProcessing || meters.length === 0}
              className="min-h-[40px] sm:min-h-0 px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 dark:hover:bg-amber-900/60 border border-amber-200 dark:border-amber-800/70 text-amber-800 dark:text-amber-200 flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 whitespace-nowrap cursor-pointer"
            >
              <Flame className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>Inject Overuse</span>
            </button>

            <button
              type="button"
              onClick={() => handleInjectScenario('vacation')}
              disabled={isProcessing || meters.length === 0}
              className="min-h-[40px] sm:min-h-0 px-3 py-1.5 rounded-lg text-xs font-medium bg-sky-50 dark:bg-sky-950/60 hover:bg-sky-100 dark:hover:bg-sky-900/60 border border-sky-200 dark:border-sky-800/70 text-sky-800 dark:text-sky-200 flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 whitespace-nowrap cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 shrink-0" />
              <span>Set Vacant</span>
            </button>

            <button
              type="button"
              onClick={() => handleInjectScenario('normal')}
              disabled={isProcessing || meters.length === 0}
              className="min-h-[40px] sm:min-h-0 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 whitespace-nowrap cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400 shrink-0" />
              <span>Restore</span>
            </button>
          </div>
        </div>

        {/* Right: Simulation Stream Controls */}
        <div className="flex items-center justify-between sm:justify-end gap-2.5 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100 dark:border-slate-800">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums">
            Clock: <strong className="text-slate-900 dark:text-white">{simulationHour.toString().padStart(2, '0')}:00</strong>
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSimulationHour((prev) => (prev + 1) % 24)}
              className="min-h-[40px] sm:min-h-0 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              title="Advance Clock 1 Hour"
            >
              <FastForward className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              <span>+1h</span>
            </button>

            <button
              type="button"
              onClick={() => setIsSimulating(!isSimulating)}
              className={`min-h-[40px] sm:min-h-0 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                isSimulating
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                  : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200'
              }`}
            >
              {isSimulating ? (
                <>
                  <Pause className="w-3.5 h-3.5 fill-current" />
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Auto Stream</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Inline Feedback Banner */}
      {statusFeedback && (
        <div className="mt-2.5 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 text-xs font-mono text-slate-700 dark:text-slate-300">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{statusFeedback}</span>
        </div>
      )}
    </div>
  );
};
