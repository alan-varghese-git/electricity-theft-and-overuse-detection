import React, { useState } from 'react';
import { Meter, Transformer } from '../types';

interface ExecutiveGridPulseProps {
  meters: Meter[];
  transformers: Transformer[];
  selectedMeter: Meter | null;
  onSelectMeter: (meter: Meter) => void;
  onDispatchWorkOrder: (meter: Meter) => void;
  onOpenWaveform: (meter: Meter) => void;
  onTripBreaker: (meter: Meter) => void;
  onExportSnapshot: () => void;
  onBroadcastIncident: () => void;
  isSimulating: boolean;
  simulationHour: number;
}

export const ExecutiveGridPulse: React.FC<ExecutiveGridPulseProps> = ({
  meters,
  transformers,
  selectedMeter,
  onSelectMeter,
  onDispatchWorkOrder,
  onOpenWaveform,
  onTripBreaker,
  onExportSnapshot,
  onBroadcastIncident,
  isSimulating,
  simulationHour,
}) => {
  const [selectedFeederFilter, setSelectedFeederFilter] = useState<'all' | 'industrial' | 'commercial' | 'residential'>('all');
  const [selectedTimeRange, setSelectedTimeRange] = useState<'15M' | '1H' | '6H' | '24H' | '7D'>('24H');
  const [activePhase, setActivePhase] = useState<'A' | 'B' | 'C'>('A');
  const [showHarmonics, setShowHarmonics] = useState(false);
  const [showBaseline, setShowBaseline] = useState(true);
  const [triageFilter, setTriageFilter] = useState<'all' | 'bypass' | 'reverse' | 'overload' | 'overuse'>('all');
  const [flaggedIds, setFlaggedIds] = useState<Set<string>>(new Set());

  // Metrics calculation
  const totalMetersCount = meters.length > 0 ? meters.length : 12450;
  const theftMeters = meters.filter((m) => m.classification === 'theft');
  const overuseMeters = meters.filter((m) => m.classification === 'overuse');
  const breachCount = theftMeters.length + overuseMeters.length || 14;

  const totalLoadKw = meters.reduce((acc, m) => acc + m.currentPowerKw, 0);
  const totalLoadMw = (14.82 + (totalLoadKw / 1000)).toFixed(2);
  const billedMw = (13.58 + (totalLoadKw / 1200)).toFixed(2);
  const theftGapMw = (Number(totalLoadMw) - Number(billedMw)).toFixed(2);
  const theftGapPct = ((Number(theftGapMw) / Number(totalLoadMw)) * 100).toFixed(1);

  // Filter meters for triage list
  const filteredTriageMeters = meters.filter((m) => {
    if (triageFilter === 'all') return m.classification === 'theft' || m.classification === 'overuse' || m.tamperState !== 'none';
    if (triageFilter === 'bypass') return m.tamperState === 'meter_bypass' || m.classification === 'theft';
    if (triageFilter === 'reverse') return m.tamperState === 'line_tap' || m.powerFactor < 0.7;
    if (triageFilter === 'overload' || triageFilter === 'overuse') return m.classification === 'overuse' || m.currentPowerKw > m.sanctionedLoadKw;
    return true;
  });

  const displayList = filteredTriageMeters.length > 0 ? filteredTriageMeters : meters.slice(0, 4);

  const handleToggleFlag = (meterId: string) => {
    setFlaggedIds((prev) => {
      const next = new Set(prev);
      if (next.has(meterId)) next.delete(meterId);
      else next.add(meterId);
      return next;
    });
  };

  return (
    <div className="flex flex-col w-full gap-space-md">
      {/* COMMAND CENTER TOP SUBHEADER & TELEMETRY FILTER BAR */}
      <section className="bg-surface-container-lowest p-space-md rounded shadow-sm flex flex-col gap-space-sm border border-surface-variant/30">
        <div className="flex flex-wrap items-center justify-between gap-space-md">
          {/* Node Selector & Topology Pills */}
          <div className="flex flex-wrap items-center gap-space-md">
            <div className="flex items-center gap-space-xs bg-surface-container-low px-space-md py-1 rounded shadow-sm border border-surface-variant/20">
              <span className="material-symbols-outlined text-primary text-[20px]">hub</span>
              <div className="flex flex-col">
                <span className="font-label-status text-label-status text-on-surface-variant uppercase">
                  Monitored Bus Infrastructure
                </span>
                <span className="font-title-sm text-title-sm text-on-surface font-semibold">
                  Substation Alpha-09 <span className="text-primary font-normal">(Feeder 04 Trunk)</span>
                </span>
              </div>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1 bg-surface-container-low p-1 rounded border border-surface-variant/20">
              <button
                onClick={() => setSelectedFeederFilter('all')}
                className={`px-space-sm py-1 rounded font-label-status text-label-status uppercase font-bold tracking-wider transition-all ${
                  selectedFeederFilter === 'all'
                    ? 'bg-primary-container text-on-primary-container'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                }`}
              >
                All Feeders
              </button>
              <button
                onClick={() => setSelectedFeederFilter('industrial')}
                className={`px-space-sm py-1 rounded font-label-status text-label-status uppercase transition-all ${
                  selectedFeederFilter === 'industrial'
                    ? 'bg-primary-container text-on-primary-container font-bold'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                }`}
              >
                Industrial Loop
              </button>
              <button
                onClick={() => setSelectedFeederFilter('commercial')}
                className={`px-space-sm py-1 rounded font-label-status text-label-status uppercase transition-all ${
                  selectedFeederFilter === 'commercial'
                    ? 'bg-primary-container text-on-primary-container font-bold'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                }`}
              >
                Commercial Core
              </button>
              <button
                onClick={() => setSelectedFeederFilter('residential')}
                className={`px-space-sm py-1 rounded font-label-status text-label-status uppercase transition-all ${
                  selectedFeederFilter === 'residential'
                    ? 'bg-primary-container text-on-primary-container font-bold'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                }`}
              >
                Residential North
              </button>
            </div>
          </div>

          {/* Live Stream Bus Status Indicators */}
          <div className="flex items-center gap-space-md bg-surface-container-low px-space-md py-1 rounded border border-surface-variant/20">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isSimulating ? 'bg-secondary' : 'bg-primary'} opacity-75`}></span>
                <span className={`relative inline-flex rounded-full h-2 w-2 ${isSimulating ? 'bg-secondary' : 'bg-primary'}`}></span>
              </span>
              <div className="flex flex-col">
                <span className="font-label-status text-label-status text-on-surface-variant uppercase">Stream Status</span>
                <span className="font-label-numeric-sm text-label-numeric-sm text-secondary font-medium">
                  {isSimulating ? 'WS Live 100ms' : 'Sync Paused'}
                </span>
              </div>
            </div>
            <div className="h-6 w-px bg-surface-variant"></div>
            <div className="flex flex-col">
              <span className="font-label-status text-label-status text-on-surface-variant uppercase">Monitored AMI Nodes</span>
              <span className="font-label-numeric-sm text-label-numeric-sm text-on-surface">
                12,450 <span className="text-secondary font-semibold">ONLINE</span>
              </span>
            </div>
            <div className="h-6 w-px bg-surface-variant"></div>
            <div className="flex flex-col">
              <span className="font-label-status text-label-status text-on-surface-variant uppercase">Bus Power Factor</span>
              <span className="font-label-numeric-sm text-label-numeric-sm text-primary">
                0.94 <span className="text-on-surface-variant">LAG</span>
              </span>
            </div>
            <div className="h-6 w-px bg-surface-variant"></div>
            <div className="flex flex-col">
              <span className="font-label-status text-label-status text-on-surface-variant uppercase">Sync Lock</span>
              <span className="font-label-numeric-sm text-label-numeric-sm text-secondary">59.98 Hz</span>
            </div>
          </div>

          {/* Time Range & Control Triggers */}
          <div className="flex items-center gap-space-sm">
            <div className="flex items-center bg-surface-container-low p-1 rounded font-label-status text-label-status border border-surface-variant/20">
              {(['15M', '1H', '6H', '24H', '7D'] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setSelectedTimeRange(range)}
                  className={`px-2 py-1 rounded transition-colors ${
                    selectedTimeRange === range
                      ? 'bg-surface-container-high text-primary font-bold shadow-sm'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1 bg-surface-container-low px-space-sm py-1 rounded border border-surface-variant/20">
              <span className="material-symbols-outlined text-primary text-[14px]">sync</span>
              <span className="font-label-status text-label-status text-on-surface-variant uppercase">Auto:</span>
              <span className="font-label-numeric-sm text-label-numeric-sm text-primary font-medium">5s</span>
            </div>
            <button
              onClick={onExportSnapshot}
              className="flex items-center gap-1 px-space-sm py-1 rounded bg-surface-container-high hover:bg-surface-variant text-on-surface font-title-sm text-title-sm transition-all border border-surface-variant/30"
              title="Export Telemetry Snapshot"
            >
              <span className="material-symbols-outlined text-[16px]">file_download</span>
              <span>Export</span>
            </button>
            <button
              onClick={onBroadcastIncident}
              className="flex items-center gap-1 px-space-sm py-1 rounded bg-error-container hover:bg-surface-tint text-on-error-container hover:text-on-primary font-title-sm text-title-sm font-semibold transition-all shadow-sm"
            >
              <span className="material-symbols-outlined text-[16px]">campaign</span>
              <span>Broadcast Incident</span>
            </button>
          </div>
        </div>
      </section>

      {/* TOP TELEMETRY KPI MATRIX (6 Dense Metric Cards) */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-space-sm">
        {/* CARD 1: AMI METERS MONITORED */}
        <div className="bg-surface-container-lowest p-space-sm rounded shadow-sm flex flex-col justify-between hover:bg-surface-container-low transition-colors border border-surface-variant/30">
          <div className="flex items-center justify-between">
            <span className="font-label-status text-label-status text-on-surface-variant uppercase">AMI Smart Meters</span>
            <span className="px-1 py-0.5 rounded bg-secondary-container text-on-secondary-container font-label-status text-label-status uppercase font-bold">
              99.82% Up
            </span>
          </div>
          <div className="my-space-xs flex items-baseline justify-between">
            <span className="font-label-numeric-lg text-label-numeric-lg text-on-surface">
              {totalMetersCount.toLocaleString()}
            </span>
            <span className="font-label-status text-label-status text-secondary font-medium">+18 Synced</span>
          </div>
          <div className="w-full flex items-center justify-between pt-1">
            <svg className="w-full h-5 text-secondary" fill="none" preserveAspectRatio="none" viewBox="0 0 120 20">
              <path d="M0,15 L20,14 L40,16 L60,11 L80,12 L100,8 L120,6" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5"></path>
            </svg>
          </div>
        </div>

        {/* CARD 2: DETECTED THEFT (CRIMSON ALERT) */}
        <div className="bg-surface-container-lowest p-space-sm rounded shadow-sm flex flex-col justify-between bg-gradient-to-br from-surface-container-lowest via-error-container/10 to-surface-container-lowest border border-error/30">
          <div className="flex items-center justify-between">
            <span className="font-label-status text-label-status text-error uppercase">24H Unmetered Theft</span>
            <span className="px-1 py-0.5 rounded bg-error-container text-on-error-container font-label-status text-label-status uppercase font-bold animate-pulse">
              +14.2%
            </span>
          </div>
          <div className="my-space-xs flex items-baseline justify-between">
            <span className="font-label-numeric-lg text-label-numeric-lg text-error">
              18.42 <span className="font-body-sm text-body-sm text-error/80">MWh</span>
            </span>
            <span className="font-label-status text-label-status text-error">$3,420/day</span>
          </div>
          <div className="w-full flex items-center justify-between pt-1">
            <span className="font-label-status text-label-status text-on-surface-variant">Annualized Est:</span>
            <span className="font-label-numeric-sm text-label-numeric-sm text-error font-medium">$1.25M</span>
          </div>
        </div>

        {/* CARD 3: REAL-TIME DIVERGENCE GAP */}
        <div className="bg-surface-container-lowest p-space-sm rounded shadow-sm flex flex-col justify-between border border-surface-variant/30">
          <div className="flex items-center justify-between">
            <span className="font-label-status text-label-status text-on-surface-variant uppercase">Real-Time Divergence</span>
            <span className="px-1 py-0.5 rounded bg-error text-on-error font-label-status text-label-status uppercase font-bold">
              Theft Spike
            </span>
          </div>
          <div className="my-space-xs flex items-baseline justify-between">
            <span className="font-label-numeric-lg text-label-numeric-lg text-primary">
              {theftGapMw} <span className="font-body-sm text-body-sm text-on-surface-variant">MW</span>
            </span>
            <span className="font-label-numeric-md text-label-numeric-md text-error">
              {theftGapPct}%
            </span>
          </div>
          <div className="w-full flex items-center justify-between pt-1">
            <span className="font-label-status text-label-status text-on-surface-variant">Line Loss Baseline</span>
            <span className="font-label-numeric-sm text-label-numeric-sm text-on-surface-variant">2.10% Tech</span>
          </div>
        </div>

        {/* CARD 4: TRANSFORMER THERMAL & LOAD */}
        <div className="bg-surface-container-lowest p-space-sm rounded shadow-sm flex flex-col justify-between border border-surface-variant/30">
          <div className="flex items-center justify-between">
            <span className="font-label-status text-label-status text-on-surface-variant uppercase">Substation Overload</span>
            <span className="px-1 py-0.5 rounded bg-surface-variant text-primary font-label-status text-label-status uppercase">
              7 Nodes
            </span>
          </div>
          <div className="my-space-xs flex items-baseline justify-between">
            <span className="font-label-numeric-lg text-label-numeric-lg text-on-surface">
              118% <span className="font-body-sm text-body-sm text-on-surface-variant">Rated</span>
            </span>
            <span className="font-label-numeric-md text-label-numeric-md text-primary">94.2°C</span>
          </div>
          <div className="w-full flex items-center justify-between pt-1">
            <span className="font-label-status text-label-status text-on-surface-variant">Feeder Alpha-4 Tank</span>
            <span className="font-label-status text-label-status text-error font-bold uppercase">Oil Heat Alert</span>
          </div>
        </div>

        {/* CARD 5: ML FRAUD ENSEMBLE HEALTH */}
        <div className="bg-surface-container-lowest p-space-sm rounded shadow-sm flex flex-col justify-between border border-surface-variant/30">
          <div className="flex items-center justify-between">
            <span className="font-label-status text-label-status text-on-surface-variant uppercase">ML Model ROC-AUC</span>
            <span className="px-1 py-0.5 rounded bg-surface-container-high text-primary font-label-status text-label-status uppercase">
              XGB+LSTM
            </span>
          </div>
          <div className="my-space-xs flex items-baseline justify-between">
            <span className="font-label-numeric-lg text-label-numeric-lg text-secondary">98.6%</span>
            <span className="font-label-numeric-sm text-label-numeric-sm text-primary">142ms Inf.</span>
          </div>
          <div className="w-full flex items-center justify-between pt-1">
            <span className="font-label-status text-label-status text-on-surface-variant">Anomaly Latency</span>
            <span className="font-label-status text-label-status text-secondary font-medium">Edge Synchronized</span>
          </div>
        </div>

        {/* CARD 6: RECOVERED REVENUE (MTD) */}
        <div className="bg-surface-container-lowest p-space-sm rounded shadow-sm flex flex-col justify-between border border-surface-variant/30">
          <div className="flex items-center justify-between">
            <span className="font-label-status text-label-status text-on-surface-variant uppercase">Recovered MTD</span>
            <span className="px-1 py-0.5 rounded bg-secondary-container text-on-secondary-container font-label-status text-label-status uppercase font-bold">
              18 Dispatches
            </span>
          </div>
          <div className="my-space-xs flex items-baseline justify-between">
            <span className="font-label-numeric-lg text-label-numeric-lg text-secondary">$48,250</span>
            <span className="font-label-status text-label-status text-on-surface-variant">+3 Today</span>
          </div>
          <div className="w-full flex items-center justify-between pt-1">
            <span className="font-label-status text-label-status text-on-surface-variant">Conviction Rate</span>
            <span className="font-label-numeric-sm text-label-numeric-sm text-secondary font-semibold">94.2% Tariff</span>
          </div>
        </div>
      </section>

      {/* MAIN OPERATIONAL COMMAND WORKSPACE (Split 65% / 35%) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-space-md">
        {/* LEFT 65% PRIMARY TELEMETRY WORKSPACE */}
        <div className="xl:col-span-8 flex flex-col gap-space-md min-w-0">
          {/* DUAL-AXIS WAVEFORM & LOSS DELTA VISUALIZATION */}
          <section className="bg-surface-container-lowest p-space-md rounded shadow-sm flex flex-col gap-space-sm border border-surface-variant/30">
            {/* Graph Header & Control Bar */}
            <div className="flex flex-wrap items-center justify-between gap-space-sm">
              <div className="flex items-center gap-space-xs">
                <span className="material-symbols-outlined text-primary text-[20px]">ssid_chart</span>
                <div className="flex flex-col">
                  <span className="font-title-sm text-title-sm text-on-surface font-semibold">
                    Substation Bulk Inflow vs. Aggregate Downstream Billed Draw
                  </span>
                  <span className="font-label-status text-label-status text-on-surface-variant uppercase">
                    High-precision SCADA CT Feeder Inflow vs. Advanced AMI Mesh Aggregate
                  </span>
                </div>
              </div>
              {/* Waveform Mode Selectors */}
              <div className="flex items-center gap-1">
                <div className="flex items-center bg-surface-container-low p-1 rounded font-label-status text-label-status border border-surface-variant/20">
                  {(['A', 'B', 'C'] as const).map((phase) => (
                    <button
                      key={phase}
                      onClick={() => setActivePhase(phase)}
                      className={`px-2 py-0.5 rounded transition-all ${
                        activePhase === phase
                          ? 'bg-primary text-on-primary font-bold'
                          : 'text-on-surface-variant hover:text-on-surface'
                      }`}
                    >
                      Phase {phase}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setShowHarmonics(!showHarmonics)}
                  className={`px-2 py-1 rounded font-label-status text-label-status uppercase transition-all ${
                    showHarmonics
                      ? 'bg-tertiary-container text-on-tertiary-container font-bold'
                      : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  Harmonics
                </button>
                <button
                  onClick={() => setShowBaseline(!showBaseline)}
                  className={`px-2 py-1 rounded font-label-status text-label-status uppercase transition-all ${
                    showBaseline
                      ? 'bg-surface-container text-primary border border-primary/30'
                      : 'bg-surface-container text-on-surface-variant'
                  }`}
                >
                  Tech Loss Baseline (2.1%)
                </button>
              </div>
            </div>

            {/* Legend and Live Delta Summary */}
            <div className="flex flex-wrap items-center justify-between px-space-sm py-1 bg-surface-container-low rounded border border-surface-variant/20">
              <div className="flex items-center gap-space-md font-label-status text-label-status">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-0.5 bg-primary"></span>
                  <span className="text-on-surface uppercase font-medium">Substation Bulk Supply:</span>
                  <span className="font-label-numeric-sm text-label-numeric-sm text-primary font-bold">{totalLoadMw} MW</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-0.5 bg-secondary"></span>
                  <span className="text-on-surface uppercase font-medium">Smart Metered Billed:</span>
                  <span className="font-label-numeric-sm text-label-numeric-sm text-secondary font-bold">{billedMw} MW</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-2 bg-error/30 rounded-xs"></span>
                  <span className="text-error uppercase font-medium">Unaccounted Theft Shunt:</span>
                  <span className="font-label-numeric-sm text-label-numeric-sm text-error font-bold">
                    {theftGapMw} MW ({theftGapPct}%)
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1 text-on-surface-variant font-label-status text-label-status">
                <span className="material-symbols-outlined text-[14px] text-secondary">verified</span>
                <span>Kalman Filter Smoothed (0.2s)</span>
              </div>
            </div>

            {/* SVG TELEMETRY WAVEFORM CANVAS */}
            <div className="relative w-full h-80 bg-surface-container-lowest rounded overflow-hidden select-none border border-surface-variant/20">
              {/* Background Grid Lines */}
              <svg className="absolute inset-0 w-full h-full text-surface-container-highest/60" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern height="40" id="gridPattern" patternUnits="userSpaceOnUse" width="60">
                    <path d="M 60 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeDasharray="2,2" strokeWidth="0.75"></path>
                  </pattern>
                  <pattern height="8" id="theftHatch" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse" width="8">
                    <line stroke="#ffb4ab" strokeOpacity="0.35" strokeWidth="1.5" x1="0" x2="0" y1="0" y2="8"></line>
                  </pattern>
                </defs>
                <rect fill="url(#gridPattern)" height="100%" width="100%"></rect>
              </svg>

              {/* Waveform SVG with Data Tracks */}
              <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 900 320">
                {/* Shaded Divergence Theft Gap */}
                <polygon
                  fill="url(#theftHatch)"
                  points="40,90 120,88 200,82 280,95 360,78 440,75 520,70 600,66 680,68 760,62 860,60 860,118 760,115 680,122 600,128 520,135 440,110 360,112 280,116 200,102 120,104 40,106"
                />
                {/* Technical Line Loss Reference Zone (2.1%) */}
                {showBaseline && (
                  <path
                    d="M40,98 L120,96 L200,90 L280,102 L360,86 L440,83 L520,78 L600,74 L680,76 L760,70 L860,68"
                    fill="none"
                    opacity="0.4"
                    stroke="#bcc9cd"
                    strokeDasharray="4,4"
                    strokeWidth="1"
                  />
                )}
                {/* Substation Inflow Trace (Cyan) */}
                <path
                  d="M40,90 L120,88 L200,82 L280,95 L360,78 L440,75 L520,70 L600,66 L680,68 L760,62 L860,60"
                  fill="none"
                  stroke="#4cd7f6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.5"
                />
                {/* Smart Metered Billed Trace (Emerald) */}
                <path
                  d="M40,106 L120,104 L200,102 L280,116 L360,112 L440,110 L520,135 L600,128 L680,122 L760,115 L860,118"
                  fill="none"
                  stroke="#4edea3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.2"
                />
                {/* Harmonic resonance ripple if active */}
                {showHarmonics && (
                  <path
                    d="M40,92 Q 100,70 160,94 T 280,86 T 400,90 T 520,76 T 640,82 T 760,68 T 860,66"
                    fill="none"
                    stroke="#c0c1ff"
                    strokeDasharray="2,2"
                    strokeWidth="1.5"
                  />
                )}
                {/* Critical Divergence Incident Marker at 520px (23:00 UTC) */}
                <line stroke="#ffb4ab" strokeDasharray="3,3" strokeWidth="1.5" x1="520" x2="520" y1="20" y2="280"></line>
                <circle cx="520" cy="70" fill="#4cd7f6" r="4" stroke="#080f17" strokeWidth="2"></circle>
                <circle cx="520" cy="135" fill="#ffb4ab" r="4.5" stroke="#690005" strokeWidth="2"></circle>
              </svg>

              {/* Interactive Annotation Tag at 23:00 UTC */}
              <div
                onClick={() => {
                  const target = meters.find((m) => m.classification === 'theft') || meters[0];
                  if (target) onSelectMeter(target);
                }}
                className="absolute left-[54%] top-6 bg-surface-container-high/95 p-space-xs rounded shadow-xl flex flex-col gap-0.5 max-w-xs cursor-pointer border border-error/40 hover:border-error transition-all"
              >
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-error animate-ping"></span>
                  <span className="font-label-status text-label-status text-error uppercase font-bold tracking-wider">
                    Theft Anomaly Detected
                  </span>
                  <span className="font-label-numeric-sm text-label-numeric-sm text-on-surface-variant ml-auto">
                    23:00:14 UTC
                  </span>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface font-medium leading-tight">
                  Apex Die Casting: Sudden Inductive Shunt Bypass
                </p>
                <div className="flex items-center justify-between font-label-numeric-sm text-label-numeric-sm text-on-surface-variant pt-0.5">
                  <span>Meter Delta: <strong className="text-error">-62.4 kW</strong></span>
                  <span>PF Drop: <strong className="text-primary">0.54</strong></span>
                </div>
              </div>

              {/* Y-Axis Scale Markers */}
              <div className="absolute left-2 top-2 bottom-6 flex flex-col justify-between font-label-numeric-sm text-label-numeric-sm text-on-surface-variant pointer-events-none">
                <span>16.0 MW</span>
                <span>14.0 MW</span>
                <span>12.0 MW</span>
                <span>10.0 MW</span>
                <span>8.0 MW</span>
              </div>

              {/* X-Axis Timeline Markers */}
              <div className="absolute left-10 right-4 bottom-1 flex justify-between font-label-numeric-sm text-label-numeric-sm text-on-surface-variant pointer-events-none">
                <span>00:00</span>
                <span>04:00</span>
                <span>08:00</span>
                <span>12:00</span>
                <span>16:00</span>
                <span>20:00</span>
                <span className="text-error font-semibold">23:00 [ALERT]</span>
                <span>03:00 [NOW]</span>
              </div>
            </div>
          </section>

          {/* FEEDER TOPOLOGICAL BREAKDOWN (3 Parallel Columns) */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-space-sm">
            {/* FEEDER 04-A: HEAVY INDUSTRIAL */}
            <div className="bg-surface-container-lowest p-space-sm rounded shadow-sm flex flex-col justify-between bg-gradient-to-b from-surface-container-lowest via-error-container/5 to-surface-container-lowest border border-error/30">
              <div className="flex items-center justify-between pb-1">
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-error"></span>
                  <span className="font-title-sm text-title-sm text-on-surface font-semibold">Feeder 04-A</span>
                </div>
                <span className="px-1 py-0.5 rounded bg-error text-on-error font-label-status text-label-status uppercase font-bold">
                  11.8% Loss Gap
                </span>
              </div>
              <span className="font-label-status text-label-status text-on-surface-variant uppercase">
                Heavy Industrial Trunk
              </span>
              <div className="grid grid-cols-2 gap-1 my-space-xs bg-surface-container-low p-space-xs rounded">
                <div>
                  <span className="font-label-status text-label-status text-on-surface-variant uppercase block">Inflow</span>
                  <span className="font-label-numeric-md text-label-numeric-md text-primary">6.80 MW</span>
                </div>
                <div>
                  <span className="font-label-status text-label-status text-on-surface-variant uppercase block">Billed</span>
                  <span className="font-label-numeric-md text-label-numeric-md text-secondary">6.00 MW</span>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex justify-between font-label-status text-label-status">
                  <span className="text-on-surface-variant">Line Loading Capacity</span>
                  <span className="text-error font-label-numeric-sm text-label-numeric-sm">118% Rating</span>
                </div>
                <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden">
                  <div className="bg-error h-full w-[94%]"></div>
                </div>
              </div>
              <div className="flex items-center justify-between pt-2 font-label-numeric-sm text-label-numeric-sm text-on-surface-variant">
                <span>CT/PT: <strong className="text-secondary font-normal">CALIBRATED</strong></span>
                <span>PF: <strong className="text-error">0.78 Lag</strong></span>
              </div>
            </div>

            {/* FEEDER 04-B: COMMERCIAL CENTER */}
            <div className="bg-surface-container-lowest p-space-sm rounded shadow-sm flex flex-col justify-between border border-surface-variant/30">
              <div className="flex items-center justify-between pb-1">
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-primary"></span>
                  <span className="font-title-sm text-title-sm text-on-surface font-semibold">Feeder 04-B</span>
                </div>
                <span className="px-1 py-0.5 rounded bg-surface-container-highest text-primary font-label-status text-label-status uppercase font-bold">
                  6.1% Loss
                </span>
              </div>
              <span className="font-label-status text-label-status text-on-surface-variant uppercase">
                Commercial Sector Alpha
              </span>
              <div className="grid grid-cols-2 gap-1 my-space-xs bg-surface-container-low p-space-xs rounded">
                <div>
                  <span className="font-label-status text-label-status text-on-surface-variant uppercase block">Inflow</span>
                  <span className="font-label-numeric-md text-label-numeric-md text-primary">4.90 MW</span>
                </div>
                <div>
                  <span className="font-label-status text-label-status text-on-surface-variant uppercase block">Billed</span>
                  <span className="font-label-numeric-md text-label-numeric-md text-secondary">4.60 MW</span>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex justify-between font-label-status text-label-status">
                  <span className="text-on-surface-variant">Line Loading Capacity</span>
                  <span className="text-primary font-label-numeric-sm text-label-numeric-sm">74% Nominal</span>
                </div>
                <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden">
                  <div className="bg-primary h-full w-[74%]"></div>
                </div>
              </div>
              <div className="flex items-center justify-between pt-2 font-label-numeric-sm text-label-numeric-sm text-on-surface-variant">
                <span>CT/PT: <strong className="text-secondary font-normal">NOMINAL</strong></span>
                <span>PF: <strong className="text-on-surface font-normal">0.92 Lag</strong></span>
              </div>
            </div>

            {/* FEEDER 04-C: RESIDENTIAL NORTH */}
            <div className="bg-surface-container-lowest p-space-sm rounded shadow-sm flex flex-col justify-between border border-surface-variant/30">
              <div className="flex items-center justify-between pb-1">
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-secondary"></span>
                  <span className="font-title-sm text-title-sm text-on-surface font-semibold">Feeder 04-C</span>
                </div>
                <span className="px-1 py-0.5 rounded bg-secondary-container text-on-secondary-container font-label-status text-label-status uppercase font-bold">
                  3.9% Normal
                </span>
              </div>
              <span className="font-label-status text-label-status text-on-surface-variant uppercase">
                Residential North Subgrid
              </span>
              <div className="grid grid-cols-2 gap-1 my-space-xs bg-surface-container-low p-space-xs rounded">
                <div>
                  <span className="font-label-status text-label-status text-on-surface-variant uppercase block">Inflow</span>
                  <span className="font-label-numeric-md text-label-numeric-md text-primary">3.10 MW</span>
                </div>
                <div>
                  <span className="font-label-status text-label-status text-on-surface-variant uppercase block">Billed</span>
                  <span className="font-label-numeric-md text-label-numeric-md text-secondary">2.98 MW</span>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex justify-between font-label-status text-label-status">
                  <span className="text-on-surface-variant">Line Loading Capacity</span>
                  <span className="text-secondary font-label-numeric-sm text-label-numeric-sm">52% Balanced</span>
                </div>
                <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden">
                  <div className="bg-secondary h-full w-[52%]"></div>
                </div>
              </div>
              <div className="flex items-center justify-between pt-2 font-label-numeric-sm text-label-numeric-sm text-on-surface-variant">
                <span>CT/PT: <strong className="text-secondary font-normal">STABLE</strong></span>
                <span>PF: <strong className="text-secondary font-semibold">0.98 Unity</strong></span>
              </div>
            </div>
          </section>
        </div>

        {/* RIGHT 35% ANOMALY TRIAGE & DISPATCH DOCKET */}
        <div className="xl:col-span-4 flex flex-col gap-space-sm min-w-0">
          <section className="bg-surface-container-lowest p-space-md rounded shadow-sm flex flex-col gap-space-sm h-full justify-between border border-surface-variant/30">
            {/* Header & Category Switchers */}
            <div className="flex flex-col gap-space-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-error text-[20px]">crisis_alert</span>
                  <span className="font-title-sm text-title-sm text-on-surface font-semibold">
                    Live ML Forensic Triage
                  </span>
                </div>
                <span className="font-label-status text-label-status px-1.5 py-0.5 rounded bg-error-container text-on-error-container font-bold uppercase tracking-wider animate-pulse">
                  {breachCount} Active Breaches
                </span>
              </div>

              {/* Quick Anomaly Filter Chips */}
              <div className="flex items-center gap-1 pt-1 overflow-x-auto pb-1">
                {(['all', 'bypass', 'reverse', 'overload'] as const).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setTriageFilter(cat)}
                    className={`px-space-sm py-1 rounded font-label-status text-label-status uppercase font-bold whitespace-nowrap transition-all ${
                      triageFilter === cat
                        ? 'bg-surface-container-highest text-primary'
                        : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    {cat.toUpperCase()} {cat === 'all' ? `(${breachCount})` : ''}
                  </button>
                ))}
              </div>
            </div>

            {/* Anomaly Incident Cards List */}
            <div className="flex flex-col gap-space-sm overflow-y-auto max-h-[640px] pr-1">
              {displayList.map((m, idx) => {
                const isTheft = m.classification === 'theft';
                const isFlagged = flaggedIds.has(m.id);
                return (
                  <div
                    key={m.id || idx}
                    className={`bg-surface-container-low p-space-sm rounded shadow-sm flex flex-col gap-space-xs border transition-all ${
                      isTheft
                        ? 'bg-gradient-to-r from-surface-container-low via-error-container/10 to-surface-container-low border-error/40'
                        : 'border-surface-variant/30'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="font-label-numeric-sm text-label-numeric-sm text-primary font-bold">
                          #{m.id}
                        </span>
                        <span className="font-body-sm text-body-sm text-on-surface font-medium truncate">
                          {m.consumerName}
                        </span>
                      </div>
                      <span
                        className={`px-1.5 py-0.5 rounded font-label-status text-label-status font-bold uppercase ${
                          isTheft
                            ? 'bg-error text-on-error'
                            : 'bg-surface-container-highest text-primary'
                        }`}
                      >
                        {isTheft ? '94% Risk' : '82% Overuse'}
                      </span>
                    </div>

                    <div className="flex items-center gap-space-sm font-label-status text-label-status text-on-surface-variant">
                      <span>Feeder Alpha-09</span>
                      <span>•</span>
                      <span className={isTheft ? 'text-error font-semibold' : 'text-primary font-medium'}>
                        {m.tamperState === 'meter_bypass'
                          ? 'CT Current Divider Divert (42%)'
                          : m.tamperState === 'line_tap'
                          ? 'Neutral Ground Shunt Loop'
                          : m.anomalyReason || 'Sudden load collapse'}
                      </span>
                    </div>

                    <p className="font-body-sm text-body-sm text-on-surface-variant leading-snug">
                      {m.anomalyReason || 'Midnight shift sudden load collapse (-62.4 kW unmetered vector drop). Secondary inductive coil bridge detected on Phase C.'}
                    </p>

                    <div className="flex items-center justify-between bg-surface-container p-space-xs rounded font-label-numeric-sm text-label-numeric-sm">
                      <span>Billed: <strong className="text-on-surface">{m.currentPowerKw.toFixed(1)} kW</strong></span>
                      <span>True Est: <strong className="text-error">{(m.currentPowerKw * 1.8).toFixed(1)} kW</strong></span>
                      <span>Loss: <strong className="text-error">${Math.round(m.currentPowerKw * 35)}/day</strong></span>
                    </div>

                    {/* Operational Triggers */}
                    <div className="grid grid-cols-3 gap-1 pt-1">
                      <button
                        onClick={() => onDispatchWorkOrder(m)}
                        className="px-2 py-1.5 rounded bg-primary-container text-on-primary-container hover:bg-surface-tint hover:text-on-primary font-title-sm text-title-sm font-medium flex items-center justify-center gap-1 transition-all"
                      >
                        <span className="material-symbols-outlined text-[14px]">local_shipping</span>
                        <span>Dispatch</span>
                      </button>
                      <button
                        onClick={() => onOpenWaveform(m)}
                        className="px-2 py-1.5 rounded bg-surface-container hover:bg-surface-variant text-on-surface font-title-sm text-title-sm flex items-center justify-center gap-1 transition-all"
                      >
                        <span className="material-symbols-outlined text-[14px]">query_stats</span>
                        <span>Waveform</span>
                      </button>
                      <button
                        onClick={() => onTripBreaker(m)}
                        className="px-2 py-1.5 rounded bg-error-container hover:bg-surface-tint text-on-error-container hover:text-on-primary font-title-sm text-title-sm font-semibold flex items-center justify-center gap-1 transition-all"
                        title="Remote SCADA Trip"
                      >
                        <span className="material-symbols-outlined text-[14px]">power_off</span>
                        <span>Trip Breaker</span>
                      </button>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <button
                        onClick={() => handleToggleFlag(m.id)}
                        className={`text-[11px] font-label-status flex items-center gap-1 transition-colors ${
                          isFlagged ? 'text-amber-400 font-bold' : 'text-on-surface-variant hover:text-on-surface'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[13px]">
                          {isFlagged ? 'flag_circle' : 'flag'}
                        </span>
                        <span>{isFlagged ? 'FLAGGED FOR FORENSIC DOCKET' : 'Flag for Forensic Review'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Docket Summary Footer */}
            <div className="pt-space-xs flex items-center justify-between font-label-status text-label-status text-on-surface-variant border-t border-surface-variant/20">
              <span>Priority Queue: <strong className="text-on-surface">Tier 1 Enforcement</strong></span>
              <span className="text-primary font-semibold uppercase">14 Active Breaches Logged</span>
            </div>
          </section>
        </div>
      </div>

      {/* BOTTOM SCADA TELEMETRY STREAM LOG & PROTOCOL DIAGNOSTICS */}
      <section className="bg-surface-container-lowest p-space-md rounded shadow-sm flex flex-col gap-space-xs border border-surface-variant/30">
        <div className="flex items-center justify-between pb-1">
          <div className="flex items-center gap-space-xs">
            <span className="material-symbols-outlined text-secondary text-[18px]">terminal</span>
            <span className="font-title-sm text-title-sm text-on-surface font-semibold">
              Real-Time SCADA Bus Telemetry &amp; Inference Audit Log
            </span>
          </div>
          <div className="flex items-center gap-space-md font-label-status text-label-status text-on-surface-variant">
            <span>Gateway Ping: <strong className="text-secondary font-label-numeric-sm text-label-numeric-sm">8.2ms</strong></span>
            <span>GOOSE Messaging: <strong className="text-primary font-label-numeric-sm text-label-numeric-sm">ACTIVE</strong></span>
            <span>Commit Rate: <strong className="text-on-surface font-label-numeric-sm text-label-numeric-sm">1,240 ev/s</strong></span>
          </div>
        </div>

        {/* Scrolling Tabular Terminal */}
        <div className="w-full bg-surface-container-lowest rounded overflow-x-auto">
          <table className="w-full text-left font-label-numeric-sm text-label-numeric-sm border-collapse">
            <thead>
              <tr className="bg-surface-container-low text-on-surface-variant font-label-status text-label-status uppercase">
                <th className="py-1 px-space-sm font-semibold">Timestamp (UTC)</th>
                <th className="py-1 px-space-sm font-semibold">Node Address</th>
                <th className="py-1 px-space-sm font-semibold">Topology Bus</th>
                <th className="py-1 px-space-sm font-semibold">Event Vector</th>
                <th className="py-1 px-space-sm font-semibold text-right">Delta Draw</th>
                <th className="py-1 px-space-sm font-semibold text-right">Power Factor</th>
                <th className="py-1 px-space-sm font-semibold text-center">Severity</th>
                <th className="py-1 px-space-sm font-semibold text-right">Action State</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-variant/20 text-on-surface">
              <tr className="hover:bg-surface-container/50 transition-colors">
                <td className="py-1.5 px-space-sm text-primary font-mono">14:28:09.112</td>
                <td className="py-1.5 px-space-sm font-medium">MTR-8849-NY</td>
                <td className="py-1.5 px-space-sm text-on-surface-variant">Feeder-04-A / Substation Alpha</td>
                <td className="py-1.5 px-space-sm text-error font-medium">CT Coil Partial Divert (42%)</td>
                <td className="py-1.5 px-space-sm text-right text-error font-semibold">-62.40 kW</td>
                <td className="py-1.5 px-space-sm text-right text-error font-mono">0.54</td>
                <td className="py-1.5 px-space-sm text-center">
                  <span className="px-1.5 py-0.2 rounded bg-error text-on-error font-label-status text-label-status uppercase font-bold">
                    CRITICAL
                  </span>
                </td>
                <td className="py-1.5 px-space-sm text-right text-primary">Docket #4821 Dispatched</td>
              </tr>
              <tr className="hover:bg-surface-container/50 transition-colors">
                <td className="py-1.5 px-space-sm text-primary font-mono">14:28:08.840</td>
                <td className="py-1.5 px-space-sm font-medium">TR-12-REGIONAL</td>
                <td className="py-1.5 px-space-sm text-on-surface-variant">Substation Alpha Transformer 12</td>
                <td className="py-1.5 px-space-sm text-on-surface font-medium">Phase C Overload Winding Thermal</td>
                <td className="py-1.5 px-space-sm text-right text-primary font-semibold">+18.00%</td>
                <td className="py-1.5 px-space-sm text-right text-on-surface-variant font-mono">0.86</td>
                <td className="py-1.5 px-space-sm text-center">
                  <span className="px-1.5 py-0.2 rounded bg-surface-container-highest text-primary font-label-status text-label-status uppercase font-bold">
                    WARNING
                  </span>
                </td>
                <td className="py-1.5 px-space-sm text-right text-secondary">Auto-Cooler Engaged</td>
              </tr>
              <tr className="hover:bg-surface-container/50 transition-colors">
                <td className="py-1.5 px-space-sm text-primary font-mono">14:28:07.429</td>
                <td className="py-1.5 px-space-sm font-medium">MTR-4021-BK</td>
                <td className="py-1.5 px-space-sm text-on-surface-variant">Feeder-04-B / Sector Beta</td>
                <td className="py-1.5 px-space-sm text-error font-medium">Neutral Ground Return Tamper Event</td>
                <td className="py-1.5 px-space-sm text-right text-error font-semibold">-14.80 kW</td>
                <td className="py-1.5 px-space-sm text-right text-error font-mono">0.52</td>
                <td className="py-1.5 px-space-sm text-center">
                  <span className="px-1.5 py-0.2 rounded bg-error-container text-on-error-container font-label-status text-label-status uppercase font-bold">
                    ELEVATED
                  </span>
                </td>
                <td className="py-1.5 px-space-sm text-right text-on-surface-variant">Awaiting Lead Approval</td>
              </tr>
              <tr className="hover:bg-surface-container/50 transition-colors">
                <td className="py-1.5 px-space-sm text-primary font-mono">14:28:06.910</td>
                <td className="py-1.5 px-space-sm font-medium">MTR-1094-QN</td>
                <td className="py-1.5 px-space-sm text-on-surface-variant">Feeder-04-C / Res-North</td>
                <td className="py-1.5 px-space-sm text-on-surface-variant">AMI Optical Meter Cover Sensor Trip</td>
                <td className="py-1.5 px-space-sm text-right text-on-surface font-semibold">-0.12 kW</td>
                <td className="py-1.5 px-space-sm text-right text-secondary font-mono">0.98</td>
                <td className="py-1.5 px-space-sm text-center">
                  <span className="px-1.5 py-0.2 rounded bg-surface-container text-on-surface-variant font-label-status text-label-status uppercase font-semibold">
                    TAMPER PIN
                  </span>
                </td>
                <td className="py-1.5 px-space-sm text-right text-on-surface-variant">Telemetry Flag Logged</td>
              </tr>
              {meters.slice(0, 3).map((m, idx) => (
                <tr key={`live-${m.id}-${idx}`} className="hover:bg-surface-container/50 transition-colors">
                  <td className="py-1.5 px-space-sm text-primary font-mono">{m.updatedAt ? m.updatedAt.slice(11, 23) : `14:28:0${5 - idx}.100`}</td>
                  <td className="py-1.5 px-space-sm font-medium">{m.id}</td>
                  <td className="py-1.5 px-space-sm text-on-surface-variant">{m.transformerId || 'Feeder-04-A'}</td>
                  <td className={`py-1.5 px-space-sm ${m.classification === 'theft' ? 'text-error font-medium' : 'text-on-surface'}`}>
                    {m.tamperState !== 'none' ? `Simulated ${m.tamperState}` : m.classification === 'theft' ? 'Suspected Shunt' : 'Periodic Sync Telemetry'}
                  </td>
                  <td className={`py-1.5 px-space-sm text-right font-semibold ${m.classification === 'theft' ? 'text-error' : 'text-secondary'}`}>
                    {m.classification === 'theft' ? `-${(m.currentPowerKw * 0.4).toFixed(2)} kW` : `+${m.currentPowerKw.toFixed(2)} kW`}
                  </td>
                  <td className="py-1.5 px-space-sm text-right font-mono text-on-surface">{m.powerFactor.toFixed(2)}</td>
                  <td className="py-1.5 px-space-sm text-center">
                    <span className={`px-1.5 py-0.2 rounded font-label-status text-label-status uppercase font-bold ${
                      m.classification === 'theft' ? 'bg-error text-on-error' : 'bg-surface-container text-secondary'
                    }`}>
                      {m.classification === 'theft' ? 'CRITICAL' : 'NOMINAL'}
                    </span>
                  </td>
                  <td className="py-1.5 px-space-sm text-right text-on-surface-variant">Live Ingest Locked</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
