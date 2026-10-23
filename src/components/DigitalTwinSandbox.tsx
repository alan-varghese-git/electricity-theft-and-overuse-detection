import React, { useState } from 'react';
import { Meter } from '../types';

interface DigitalTwinSandboxProps {
  meters: Meter[];
  onSelectMeter?: (meter: Meter) => void;
  onOpenWorkOrder?: (meter: Meter) => void;
}

export const DigitalTwinSandbox: React.FC<DigitalTwinSandboxProps> = ({ meters, onOpenWorkOrder }) => {
  const [bypassRatio, setBypassRatio] = useState<number>(42);
  const [neutralResistance, setNeutralResistance] = useState<number>(0.4);
  const [unmeteredLoadKw, setUnmeteredLoadKw] = useState<number>(24.8);
  const [thdPercent, setThdPercent] = useState<number>(6.2);
  const [presetMode, setPresetMode] = useState<'clean' | 'bypass' | 'ground_shunt' | 'reverse'>('bypass');
  const [isMonteCarloRunning, setIsMonteCarloRunning] = useState(false);
  const [monteCarloResult, setMonteCarloResult] = useState<{
    iterations: number;
    detectionRate: number;
    avgDailyLoss: number;
    p95Loss: number;
  } | null>(null);

  // Derived physics
  const billedFactor = Math.max(0.05, (100 - bypassRatio) / 100);
  const trueLoadKw = 60 + unmeteredLoadKw;
  const billedKw = trueLoadKw * billedFactor;
  const unmeteredKw = trueLoadKw - billedKw;
  const dailyLoss = unmeteredKw * 24 * 0.16; // $0.16 / kWh
  const annualLoss = dailyLoss * 365;
  const mlConfidence = Math.min(99.8, Math.max(12.5, 45 + (bypassRatio * 0.5) + (thdPercent * 1.5) + (unmeteredLoadKw * 0.4)));

  const handleApplyPreset = (mode: 'clean' | 'bypass' | 'ground_shunt' | 'reverse') => {
    setPresetMode(mode);
    if (mode === 'clean') {
      setBypassRatio(0);
      setNeutralResistance(0.05);
      setUnmeteredLoadKw(0);
      setThdPercent(1.8);
    } else if (mode === 'bypass') {
      setBypassRatio(42);
      setNeutralResistance(0.4);
      setUnmeteredLoadKw(24.8);
      setThdPercent(6.2);
    } else if (mode === 'ground_shunt') {
      setBypassRatio(68);
      setNeutralResistance(2.8);
      setUnmeteredLoadKw(38.0);
      setThdPercent(11.4);
    } else if (mode === 'reverse') {
      setBypassRatio(85);
      setNeutralResistance(0.2);
      setUnmeteredLoadKw(15.0);
      setThdPercent(8.9);
    }
  };

  const handleReset = () => {
    handleApplyPreset('clean');
    setMonteCarloResult(null);
  };

  const handleInjectSpike = () => {
    setBypassRatio((prev) => Math.min(100, prev + 25));
    setUnmeteredLoadKw((prev) => Math.min(80, prev + 15));
    setThdPercent((prev) => Math.min(25, prev + 5));
  };

  const runMonteCarlo = () => {
    setIsMonteCarloRunning(true);
    setTimeout(() => {
      setIsMonteCarloRunning(false);
      setMonteCarloResult({
        iterations: 1000,
        detectionRate: mlConfidence > 80 ? 99.4 : mlConfidence > 50 ? 88.2 : 34.1,
        avgDailyLoss: Math.round(dailyLoss * 1.04),
        p95Loss: Math.round(dailyLoss * 1.38),
      });
    }, 600);
  };

  return (
    <div className="flex flex-col gap-space-md w-full">
      {/* Sandbox Header */}
      <section className="bg-surface-container-lowest p-space-md rounded shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-space-sm border border-surface-variant/30">
        <div className="flex items-center gap-space-sm">
          <div className="w-10 h-10 rounded bg-surface-container flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-[24px]">science</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-title-sm text-title-sm uppercase tracking-wider text-on-surface font-bold">
                Digital Twin Sandbox: Ohmic &amp; Reactive Vector Simulator
              </h2>
              <span className="font-label-status text-label-status px-1.5 py-0.5 rounded bg-primary-container text-on-primary-container font-bold uppercase">
                Substation-Alpha Busbar Twin
              </span>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Synthesize phase distortions, secondary CT tap diverts, neutral resistance loops, and inspect real-time ML anomaly confidence.
            </p>
          </div>
        </div>

        {/* Preset Selector */}
        <div className="flex items-center gap-1 bg-surface-container-low p-1 rounded border border-surface-variant/30">
          <button
            onClick={() => handleApplyPreset('clean')}
            className={`px-space-sm py-1 rounded font-label-status text-label-status uppercase transition-all ${
              presetMode === 'clean'
                ? 'bg-secondary text-on-secondary font-bold'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Baseline (Clean)
          </button>
          <button
            onClick={() => handleApplyPreset('bypass')}
            className={`px-space-sm py-1 rounded font-label-status text-label-status uppercase transition-all ${
              presetMode === 'bypass'
                ? 'bg-primary-container text-on-primary-container font-bold'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Partial Bypass
          </button>
          <button
            onClick={() => handleApplyPreset('ground_shunt')}
            className={`px-space-sm py-1 rounded font-label-status text-label-status uppercase transition-all ${
              presetMode === 'ground_shunt'
                ? 'bg-error-container text-on-error-container font-bold'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Ground Neutral Shunt
          </button>
          <button
            onClick={() => handleApplyPreset('reverse')}
            className={`px-space-sm py-1 rounded font-label-status text-label-status uppercase transition-all ${
              presetMode === 'reverse'
                ? 'bg-tertiary-container text-on-tertiary-container font-bold'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Reverse Vector Tap
          </button>
        </div>
      </section>

      {/* Grid Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-md">
        {/* Left Column: Parameter Synthesizer */}
        <div className="lg:col-span-5 flex flex-col gap-space-md">
          <div className="bg-surface-container-lowest p-space-md rounded shadow-sm border border-surface-variant/30 flex flex-col gap-space-md">
            <div className="flex items-center justify-between pb-1 border-b border-surface-variant/20">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-primary text-[18px]">tune</span>
                <span className="font-title-sm text-title-sm text-on-surface font-semibold">Parameter Synthesizer</span>
              </div>
              <span className="font-label-numeric-sm text-label-numeric-sm text-secondary font-mono">100Hz Ingest Rate</span>
            </div>

            {/* Slider 1: Meter Bypass Ratio */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between font-body-sm text-body-sm">
                <span className="text-on-surface-variant">Meter Bypass Ratio:</span>
                <span className="font-label-numeric-md text-label-numeric-md text-error font-bold">
                  {bypassRatio}% Diverted
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={bypassRatio}
                onChange={(e) => {
                  setBypassRatio(Number(e.target.value));
                  setPresetMode('bypass');
                }}
                className="w-full h-1.5 bg-surface-container-high rounded-lg appearance-none cursor-pointer accent-[#4cd7f6]"
              />
              <div className="flex justify-between font-label-status text-label-status text-on-surface-variant">
                <span>0% (Full Billed)</span>
                <span>50%</span>
                <span>100% (Total Theft)</span>
              </div>
            </div>

            {/* Slider 2: Neutral Line Resistance */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between font-body-sm text-body-sm">
                <span className="text-on-surface-variant">Neutral Line Resistance:</span>
                <span className="font-label-numeric-md text-label-numeric-md text-primary font-bold">
                  {neutralResistance.toFixed(2)} Ω
                </span>
              </div>
              <input
                type="range"
                min="0.01"
                max="5.0"
                step="0.05"
                value={neutralResistance}
                onChange={(e) => setNeutralResistance(Number(e.target.value))}
                className="w-full h-1.5 bg-surface-container-high rounded-lg appearance-none cursor-pointer accent-[#4cd7f6]"
              />
              <div className="flex justify-between font-label-status text-label-status text-on-surface-variant">
                <span>0.01 Ω (Bonded)</span>
                <span>2.5 Ω (Earth Sag)</span>
                <span>5.0 Ω (High Loop)</span>
              </div>
            </div>

            {/* Slider 3: Unmetered Shunt Load */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between font-body-sm text-body-sm">
                <span className="text-on-surface-variant">Unmetered Shunt Load:</span>
                <span className="font-label-numeric-md text-label-numeric-md text-error font-bold">
                  {unmeteredLoadKw.toFixed(1)} kW
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="80"
                step="0.5"
                value={unmeteredLoadKw}
                onChange={(e) => setUnmeteredLoadKw(Number(e.target.value))}
                className="w-full h-1.5 bg-surface-container-high rounded-lg appearance-none cursor-pointer accent-[#ffb4ab]"
              />
              <div className="flex justify-between font-label-status text-label-status text-on-surface-variant">
                <span>0 kW</span>
                <span>40 kW (Arc Furnace)</span>
                <span>80 kW</span>
              </div>
            </div>

            {/* Slider 4: Harmonic Distortion (THD) */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between font-body-sm text-body-sm">
                <span className="text-on-surface-variant">Harmonic Distortion (THD):</span>
                <span className="font-label-numeric-md text-label-numeric-md text-tertiary font-bold">
                  {thdPercent.toFixed(1)}% THD
                </span>
              </div>
              <input
                type="range"
                min="1.0"
                max="25.0"
                step="0.2"
                value={thdPercent}
                onChange={(e) => setThdPercent(Number(e.target.value))}
                className="w-full h-1.5 bg-surface-container-high rounded-lg appearance-none cursor-pointer accent-[#c0c1ff]"
              />
              <div className="flex justify-between font-label-status text-label-status text-on-surface-variant">
                <span>&lt;3% (IEEE 519 Grid Norm)</span>
                <span>12%</span>
                <span>25% (Extreme Rectifier)</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-surface-variant/20">
              <button
                onClick={handleReset}
                className="px-3 py-2 rounded bg-surface-container hover:bg-surface-variant text-on-surface font-title-sm text-title-sm flex items-center justify-center gap-1.5 transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">restart_alt</span>
                <span>Reset Baseline</span>
              </button>
              <button
                onClick={handleInjectSpike}
                className="px-3 py-2 rounded bg-error-container hover:bg-surface-tint text-on-error-container hover:text-on-primary font-title-sm text-title-sm font-semibold flex items-center justify-center gap-1.5 transition-all shadow-sm"
              >
                <span className="material-symbols-outlined text-[16px]">bolt</span>
                <span>Inject Anomaly Spike</span>
              </button>
            </div>
          </div>

          {/* Revenue Hemorrhage Card */}
          <div className="bg-surface-container-lowest p-space-md rounded shadow-sm border border-surface-variant/30 flex flex-col gap-space-xs bg-gradient-to-br from-surface-container-lowest via-error-container/10 to-surface-container-lowest">
            <span className="font-label-status text-label-status text-error uppercase font-bold tracking-wider">
              Estimated Revenue Hemorrhage
            </span>
            <div className="flex items-baseline justify-between my-1">
              <div>
                <span className="font-label-numeric-lg text-label-numeric-lg text-error">
                  ${dailyLoss.toFixed(2)}
                </span>
                <span className="font-label-status text-label-status text-on-surface-variant ml-1">/ day</span>
              </div>
              <div className="text-right">
                <span className="font-label-numeric-md text-label-numeric-md text-error font-bold">
                  ${annualLoss.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </span>
                <span className="font-label-status text-label-status text-on-surface-variant ml-1">/ year</span>
              </div>
            </div>
            <div className="flex items-center justify-between text-on-surface-variant font-label-numeric-sm text-label-numeric-sm pt-1 border-t border-surface-variant/20">
              <span>Billed Draw: <strong className="text-secondary">{billedKw.toFixed(1)} kW</strong></span>
              <span>True Feeder Draw: <strong className="text-error">{trueLoadKw.toFixed(1)} kW</strong></span>
              <span>Discrepancy: <strong className="text-error">{(bypassRatio).toFixed(0)}%</strong></span>
            </div>
          </div>
        </div>

        {/* Right Column: Feeder vs Meter Vector Analysis & ML Inference Engine */}
        <div className="lg:col-span-7 flex flex-col gap-space-md">
          {/* Vector Phasor Diagram & Telemetry Comparison */}
          <div className="bg-surface-container-lowest p-space-md rounded shadow-sm border border-surface-variant/30 flex flex-col gap-space-sm">
            <div className="flex items-center justify-between pb-1 border-b border-surface-variant/20">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-secondary text-[18px]">radar</span>
                <span className="font-title-sm text-title-sm text-on-surface font-semibold">
                  Feeder vs. Meter Vector Analysis (Phasor Diagram)
                </span>
              </div>
              <span className="font-label-status text-label-status px-2 py-0.5 rounded bg-surface-container text-primary uppercase font-mono">
                Synchronous 3-Phase Polar
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md items-center py-2">
              {/* Radar Phasor Dial */}
              <div className="relative w-full aspect-square max-w-[260px] mx-auto bg-surface-container-low rounded-full border border-surface-variant/40 flex items-center justify-center p-4">
                {/* Concentric Grid Rings */}
                <div className="absolute inset-4 rounded-full border border-surface-variant/30 pointer-events-none"></div>
                <div className="absolute inset-12 rounded-full border border-surface-variant/20 pointer-events-none"></div>
                <div className="absolute inset-20 rounded-full border border-surface-variant/15 pointer-events-none"></div>
                {/* Axis lines */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-full h-px bg-surface-variant/30"></div>
                </div>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="h-full w-px bg-surface-variant/30"></div>
                </div>

                {/* SVG Phasor Vectors */}
                <svg className="w-full h-full" viewBox="-100 -100 200 200">
                  {/* Feeder Bulk Vector (Cyan - reference) */}
                  <line
                    x1="0"
                    y1="0"
                    x2={80 * Math.cos(-Math.PI / 6)}
                    y2={80 * Math.sin(-Math.PI / 6)}
                    stroke="#4cd7f6"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                  {/* Billed Vector (Emerald - shorter due to bypass) */}
                  <line
                    x1="0"
                    y1="0"
                    x2={80 * billedFactor * Math.cos(-Math.PI / 6 - (bypassRatio * 0.01))}
                    y2={80 * billedFactor * Math.sin(-Math.PI / 6 - (bypassRatio * 0.01))}
                    stroke="#4edea3"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                  {/* Divergence Vector (Crimson) */}
                  {bypassRatio > 5 && (
                    <line
                      x1={80 * billedFactor * Math.cos(-Math.PI / 6 - (bypassRatio * 0.01))}
                      y1={80 * billedFactor * Math.sin(-Math.PI / 6 - (bypassRatio * 0.01))}
                      x2={80 * Math.cos(-Math.PI / 6)}
                      y2={80 * Math.sin(-Math.PI / 6)}
                      stroke="#ffb4ab"
                      strokeWidth="2"
                      strokeDasharray="3,3"
                    />
                  )}
                  <circle cx="0" cy="0" r="4" fill="#dce3f0" />
                </svg>

                {/* Vector Labels */}
                <span className="absolute top-2 right-4 font-label-status text-label-status text-primary">
                  I_Feeder (True)
                </span>
                <span className="absolute bottom-4 left-4 font-label-status text-label-status text-secondary">
                  I_Billed (Reported)
                </span>
              </div>

              {/* Vector Stats Box */}
              <div className="flex flex-col gap-space-sm font-label-numeric-sm text-label-numeric-sm">
                <div className="bg-surface-container-low p-space-sm rounded border border-surface-variant/30">
                  <span className="font-label-status text-label-status text-on-surface-variant uppercase block">
                    Feeder Active Inflow (Reference)
                  </span>
                  <div className="flex items-baseline justify-between mt-1">
                    <span className="font-label-numeric-md text-label-numeric-md text-primary font-bold">
                      {trueLoadKw.toFixed(1)} kW
                    </span>
                    <span className="text-on-surface-variant">PF: 0.94 Lag</span>
                  </div>
                </div>

                <div className="bg-surface-container-low p-space-sm rounded border border-surface-variant/30">
                  <span className="font-label-status text-label-status text-on-surface-variant uppercase block">
                    AMI Smart Meter Registered
                  </span>
                  <div className="flex items-baseline justify-between mt-1">
                    <span className="font-label-numeric-md text-label-numeric-md text-secondary font-bold">
                      {billedKw.toFixed(1)} kW
                    </span>
                    <span className="text-on-surface-variant">PF: {(0.94 - bypassRatio * 0.004).toFixed(2)}</span>
                  </div>
                </div>

                <div className="bg-surface-container-low p-space-sm rounded border border-surface-variant/30">
                  <span className="font-label-status text-label-status text-error uppercase block font-semibold">
                    Vector Discrepancy &amp; Deficit
                  </span>
                  <div className="flex items-baseline justify-between mt-1">
                    <span className="font-label-numeric-md text-label-numeric-md text-error font-bold">
                      -{unmeteredKw.toFixed(1)} kW
                    </span>
                    <span className="text-error font-bold">
                      {(bypassRatio).toFixed(1)}% Under-report
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ML Anomaly Classifier Response Panel */}
          <div className="bg-surface-container-lowest p-space-md rounded shadow-sm border border-surface-variant/30 flex flex-col gap-space-sm">
            <div className="flex items-center justify-between pb-1 border-b border-surface-variant/20">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-primary text-[18px]">psychology</span>
                <span className="font-title-sm text-title-sm text-on-surface font-semibold">
                  ML Anomaly Detection Response Engine
                </span>
              </div>
              <span className="font-label-status text-label-status text-on-surface-variant font-mono">
                XGBoost v2.1 + Isolation Forest
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-space-sm">
              <div className="bg-surface-container-low p-space-sm rounded">
                <span className="font-label-status text-label-status text-on-surface-variant uppercase block">
                  Model Decision
                </span>
                <span className={`font-title-sm text-title-sm font-bold uppercase mt-1 block ${
                  mlConfidence > 75 ? 'text-error' : mlConfidence > 40 ? 'text-amber-400' : 'text-secondary'
                }`}>
                  {mlConfidence > 75 ? 'Theft Confirmed' : mlConfidence > 40 ? 'Suspicious Anomaly' : 'Normal Grid Draw'}
                </span>
              </div>
              <div className="bg-surface-container-low p-space-sm rounded">
                <span className="font-label-status text-label-status text-on-surface-variant uppercase block">
                  Confidence Score
                </span>
                <span className="font-label-numeric-lg text-label-numeric-lg text-primary font-bold mt-1 block">
                  {mlConfidence.toFixed(1)}%
                </span>
              </div>
              <div className="bg-surface-container-low p-space-sm rounded">
                <span className="font-label-status text-label-status text-on-surface-variant uppercase block">
                  Inference Latency
                </span>
                <span className="font-label-numeric-lg text-label-numeric-lg text-secondary font-bold mt-1 block">
                  142 ms
                </span>
              </div>
            </div>

            {/* Monte Carlo Results if run */}
            {monteCarloResult && (
              <div className="bg-surface-container-low p-space-sm rounded border border-primary/30 flex flex-col gap-1 mt-1">
                <div className="flex items-center justify-between">
                  <span className="font-label-status text-label-status text-primary uppercase font-bold">
                    Monte Carlo Simulation Output (1,000 Iterations)
                  </span>
                  <span className="font-label-numeric-sm text-label-numeric-sm text-secondary">
                    Completed in 210ms
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 font-label-numeric-sm text-label-numeric-sm text-on-surface-variant pt-1">
                  <div>Detection Probability: <strong className="text-secondary">{monteCarloResult.detectionRate}%</strong></div>
                  <div>Avg Expected Daily Loss: <strong className="text-error">${monteCarloResult.avgDailyLoss}</strong></div>
                  <div>P95 Tail Risk: <strong className="text-error">${monteCarloResult.p95Loss}</strong></div>
                </div>
              </div>
            )}

            {/* Bottom Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-surface-variant/20">
              <button
                onClick={runMonteCarlo}
                disabled={isMonteCarloRunning}
                className="px-3 py-2 rounded bg-surface-container-high hover:bg-surface-variant text-on-surface font-title-sm text-title-sm font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[16px] text-primary">casino</span>
                <span>{isMonteCarloRunning ? 'Running 1,000 Trials...' : 'Run Monte Carlo Stress Test'}</span>
              </button>
              <button
                onClick={() => {
                  const targetMeter = meters[0];
                  if (targetMeter && onOpenWorkOrder) {
                    onOpenWorkOrder(targetMeter);
                  }
                }}
                className="px-3 py-2 rounded bg-primary-container text-on-primary-container hover:bg-surface-tint hover:text-on-primary font-title-sm text-title-sm font-semibold flex items-center justify-center gap-2 transition-all shadow-sm"
              >
                <span className="material-symbols-outlined text-[16px]">assignment_turned_in</span>
                <span>Dispatch Forensic Audit for Scenario</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
