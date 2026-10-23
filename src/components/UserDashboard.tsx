import React, { useState } from 'react';
import {
  Zap,
  Droplets,
  AlertTriangle,
  Flame,
  ShieldCheck,
  CheckCircle2,
  Download,
  LogOut,
  Sun,
  Moon,
  Clock,
  DollarSign,
  Activity,
  RotateCcw
} from 'lucide-react';
import { AuthSession, Incident, Meter, Transformer } from '../types';
import { updateMeterSimulationReading } from '../services/firestoreService';

interface UserDashboardProps {
  session: AuthSession;
  meter: Meter | null;
  allMeters: Meter[];
  transformers: Transformer[];
  incidents: Incident[];
  onSwitchUserMeter: (meter: Meter) => void;
  onSignOut: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export const UserDashboard: React.FC<UserDashboardProps> = ({
  session,
  meter,
  allMeters,
  transformers,
  incidents,
  onSwitchUserMeter,
  onSignOut,
  theme,
  onToggleTheme,
}) => {
  const [chartMetric, setChartMetric] = useState<'both' | 'power' | 'water'>('both');
  const [isUpdatingMode, setIsUpdatingMode] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  if (!meter) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col items-center justify-center p-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 max-w-md w-full text-center space-y-4">
          <div className="text-sm font-bold">Consumer Meter Record Not Found</div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            The meter ID ({session.subjectId}) is not in the currently loaded dataset.
          </p>
          <button
            type="button"
            onClick={onSignOut}
            className="px-4 py-2 rounded-lg text-xs font-semibold bg-slate-900 dark:bg-white text-white dark:text-slate-900 cursor-pointer"
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  const history = meter.history || [];
  const transformer = transformers.find((t) => t.id === meter.transformerId);
  const userIncidents = incidents.filter((inc) => inc.meterId === meter.id);

  // Compute comprehensive usage statistics from 24-hour profile
  const dailyEnergyKwh = history.reduce((sum, pt) => sum + pt.powerKw, 0);
  const avgHourlyKw = history.length > 0 ? dailyEnergyKwh / history.length : meter.currentPowerKw;
  const peakPowerKw = history.reduce((max, pt) => Math.max(max, pt.powerKw), meter.currentPowerKw);
  const peakHourPoint = history.find((pt) => pt.powerKw === peakPowerKw);

  const dailyWaterLiters = history.reduce((sum, pt) => sum + pt.waterLph, 0);
  const avgWaterLph = history.length > 0 ? dailyWaterLiters / history.length : meter.currentWaterLph;

  // Time-of-Use (ToU) Breakdown
  const offPeakHours = history.filter((pt) => pt.hour >= 0 && pt.hour < 6 || pt.hour === 23);
  const peakHours = history.filter((pt) => (pt.hour >= 6 && pt.hour <= 9) || (pt.hour >= 17 && pt.hour <= 22));
  const midPeakHours = history.filter((pt) => pt.hour >= 10 && pt.hour <= 16);

  const offPeakKwh = offPeakHours.reduce((s, p) => s + p.powerKw, 0);
  const midPeakKwh = midPeakHours.reduce((s, p) => s + p.powerKw, 0);
  const onPeakKwh = peakHours.reduce((s, p) => s + p.powerKw, 0);

  // Tariff & Monthly Billing Estimation
  const ratePerKwh = meter.consumerType === 'commercial' ? 0.16 : meter.consumerType === 'industrial' ? 0.13 : 0.14;
  const waterRatePer1000L = 1.85;
  const isTheft = meter.classification === 'theft';
  const isOveruse = meter.classification === 'overuse';
  const isVacant = meter.occupancyStatus === 'vacant';
  const loadPct = Math.round((meter.currentPowerKw / meter.sanctionedLoadKw) * 100);

  const estimatedMonthlyEnergyCost = dailyEnergyKwh * 30 * ratePerKwh;
  const estimatedMonthlyWaterCost = (dailyWaterLiters * 30 / 1000) * waterRatePer1000L;
  const overusePenalty = isOveruse ? (meter.currentPowerKw - meter.sanctionedLoadKw) * 14.5 : 0;
  const estimatedTotalMonthlyBill = estimatedMonthlyEnergyCost + estimatedMonthlyWaterCost + overusePenalty;

  const handleUpdateConsumerMode = async (mode: 'normal' | 'vacation' | 'heavy_appliance') => {
    if (isUpdatingMode) return;
    setIsUpdatingMode(true);
    try {
      if (mode === 'vacation') {
        await updateMeterSimulationReading(meter, {
          powerKw: 0.11,
          waterLph: 0.1,
          tamperState: 'vacation',
          hourOfDay: 18,
        });
        setFeedbackMessage('Vacation / Away Mode enabled. Standby power (0.11 kW) and zero water flow synced.');
      } else if (mode === 'heavy_appliance') {
        const highLoad = Number((meter.sanctionedLoadKw * 2.1).toFixed(2));
        await updateMeterSimulationReading(meter, {
          powerKw: highLoad,
          waterLph: 26.0,
          tamperState: 'crypto_mining',
          hourOfDay: 18,
        });
        setFeedbackMessage(`Heavy Load simulated (${highLoad} kW). Overuse warning triggered in real time.`);
      } else {
        const nominalLoad = Number((meter.sanctionedLoadKw * 0.48).toFixed(2));
        await updateMeterSimulationReading(meter, {
          powerKw: nominalLoad,
          waterLph: 21.0,
          tamperState: 'none',
          hourOfDay: 18,
        });
        setFeedbackMessage(`Normal Household Load restored (${nominalLoad} kW, 21.0 L/h).`);
      }
      setTimeout(() => setFeedbackMessage(null), 4000);
    } finally {
      setIsUpdatingMode(false);
    }
  };

  const handleDownloadStatement = () => {
    const headers = ['Hour', 'Power (kW)', 'Sanctioned Limit (kW)', 'Water Flow (L/h)', 'Hourly Cost ($)', 'Status'];
    const rows = history.map((pt) => [
      pt.timeLabel,
      pt.powerKw.toFixed(2),
      meter.sanctionedLoadKw.toFixed(1),
      pt.waterLph.toFixed(1),
      (pt.powerKw * ratePerKwh).toFixed(3),
      pt.classification,
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `${meter.id}_usage_statement.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Chart geometry
  const chartWidth = 760;
  const chartHeight = 190;
  const maxPower = Math.max(10, meter.sanctionedLoadKw * 2.5, peakPowerKw * 1.15);
  const maxWater = Math.max(70, ...history.map((h) => h.waterLph));

  const powerPoints = history
    .map((pt, idx) => {
      const x = (idx / 23) * (chartWidth - 50) + 30;
      const y = chartHeight - (pt.powerKw / maxPower) * (chartHeight - 36) - 18;
      return `${x},${y}`;
    })
    .join(' ');

  const waterPoints = history
    .map((pt, idx) => {
      const x = (idx / 23) * (chartWidth - 50) + 30;
      const y = chartHeight - (pt.waterLph / maxWater) * (chartHeight - 36) - 18;
      return `${x},${y}`;
    })
    .join(' ');

  const sanctionedY = chartHeight - (meter.sanctionedLoadKw / maxPower) * (chartHeight - 36) - 18;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-150">
      {/* Consumer Top Header */}
      <header className="sticky top-0 z-40 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Brand + Consumer Badge */}
          <div className="flex items-center gap-3 min-w-0">
            <svg
              width="32"
              height="32"
              viewBox="0 0 36 36"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="shrink-0"
              aria-hidden="true"
            >
              <rect width="36" height="36" rx="8" fill="#0F172A" />
              <path
                d="M18 4.5L29.5 10.8V25.2L18 31.5L6.5 25.2V10.8L18 4.5Z"
                stroke="#334155"
                strokeWidth="1.2"
                fill="#1E293B"
              />
              <path
                d="M9.5 22.5C12 20.2 14.5 24.8 17 22.5C19.5 20.2 22 24.8 26.5 22.5"
                stroke="#38BDF8"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                d="M19.8 8.5L12.5 18.2H17.6L16.2 26.5L23.5 16.8H18.4L19.8 8.5Z"
                fill="#F59E0B"
              />
            </svg>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">
                  VoltWatch Consumer Portal
                </span>
                <span className="text-slate-300 dark:text-slate-700">·</span>
                <span className="font-mono text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {meter.id}
                </span>
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                {meter.consumerName} · {meter.consumerAddress}
              </div>
            </div>
          </div>

          {/* Right Controls: Switch Dataset User, Export Statement, Theme Toggle, Sign Out */}
          <div className="flex items-center gap-2 shrink-0">
            <select
              value={meter.id}
              onChange={(e) => {
                const found = allMeters.find((m) => m.id === e.target.value);
                if (found) onSwitchUserMeter(found);
              }}
              className="hidden md:block bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
              aria-label="Switch Consumer Account"
            >
              {allMeters.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.id} — {m.consumerName.split('(')[0].trim()}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={handleDownloadStatement}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              <span>Download CSV</span>
            </button>

            <button
              type="button"
              onClick={onToggleTheme}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? (
                <Sun className="w-3.5 h-3.5 text-amber-400" />
              ) : (
                <Moon className="w-3.5 h-3.5 text-slate-600" />
              )}
            </button>

            <button
              type="button"
              onClick={onSignOut}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-5">
        {/* Account Profile & Status Banner */}
        <div
          className={`p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${
            isTheft
              ? 'bg-rose-50/70 dark:bg-rose-950/35 border-rose-200 dark:border-rose-800 text-rose-950 dark:text-rose-100'
              : isOveruse
              ? 'bg-amber-50/70 dark:bg-amber-950/35 border-amber-200 dark:border-amber-800 text-amber-950 dark:text-amber-100'
              : isVacant
              ? 'bg-sky-50/70 dark:bg-sky-950/35 border-sky-200 dark:border-sky-800 text-sky-950 dark:text-sky-100'
              : 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-950 dark:text-emerald-100'
          }`}
        >
          <div className="flex items-start gap-3">
            {isTheft ? (
              <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            ) : isOveruse ? (
              <Flame className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            ) : isVacant ? (
              <ShieldCheck className="w-5 h-5 text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            )}

            <div>
              <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
                <span>
                  {isTheft
                    ? 'Meter Telemetry Alert — Inspection Scheduled'
                    : isOveruse
                    ? 'Sanctioned Capacity Exceeded — High Load Warning'
                    : isVacant
                    ? 'Vacation / Standby Mode Verified (False-Alarm Protected)'
                    : 'Account in Good Standing — Normal Multi-Utility Correlation'}
                </span>
                <span className="font-mono font-normal opacity-80">
                  · Session ID: {session.id}
                </span>
              </div>
              <p className="text-xs mt-1 opacity-90">{meter.anomalyReason}</p>
            </div>
          </div>

          <div className="text-xs font-mono shrink-0 md:text-right space-y-0.5">
            <div className="font-semibold">
              Feeder: {meter.transformerId} {transformer ? `(${transformer.name.split('(')[0].trim()})` : ''}
            </div>
            <div className="opacity-80 capitalize">
              Tariff: {meter.consumerType} · Sanctioned Limit: {meter.sanctionedLoadKw.toFixed(1)} kW
            </div>
          </div>
        </div>

        {/* 5 Key Consumer Usage Statistics Cards */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
          <div className="grid grid-cols-2 lg:grid-cols-5 divide-y lg:divide-y-0 lg:divide-x divide-slate-200 dark:divide-slate-800">
            {/* 1. Real-Time Power Demand */}
            <div className="p-4">
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Current Power Draw
              </div>
              <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-1 tabular-nums">
                {meter.currentPowerKw.toFixed(2)}{' '}
                <span className="text-xs font-normal text-slate-500 dark:text-slate-400">kW</span>
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-mono tabular-nums">
                {loadPct}% of {meter.sanctionedLoadKw.toFixed(1)} kW limit
              </div>
            </div>

            {/* 2. 24-Hour Energy Consumption */}
            <div className="p-4">
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                24-Hour Energy Usage
              </div>
              <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-1 tabular-nums">
                {dailyEnergyKwh.toFixed(1)}{' '}
                <span className="text-xs font-normal text-slate-500 dark:text-slate-400">kWh</span>
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-mono tabular-nums">
                Avg {avgHourlyKw.toFixed(2)} kW · Peak {peakPowerKw.toFixed(2)} kW
              </div>
            </div>

            {/* 3. Municipal Water Usage */}
            <div className="p-4">
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Water Consumption (24h)
              </div>
              <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-1 tabular-nums">
                {dailyWaterLiters.toFixed(0)}{' '}
                <span className="text-xs font-normal text-slate-500 dark:text-slate-400">Liters</span>
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-mono tabular-nums">
                Live: {meter.currentWaterLph.toFixed(1)} L/h · Avg {avgWaterLph.toFixed(1)} L/h
              </div>
            </div>

            {/* 4. Estimated Monthly Utility Bill */}
            <div className="p-4">
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Est. Monthly Bill (30d)
              </div>
              <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-1 tabular-nums">
                ${estimatedTotalMonthlyBill.toFixed(2)}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-mono tabular-nums">
                Elec ${estimatedMonthlyEnergyCost.toFixed(0)} · Water ${estimatedMonthlyWaterCost.toFixed(0)}
                {overusePenalty > 0 ? ` · +$${overusePenalty.toFixed(0)} overload` : ''}
              </div>
            </div>

            {/* 5. Line Quality & Occupancy */}
            <div className="p-4 col-span-2 lg:col-span-1">
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Power Quality &amp; Occupancy
              </div>
              <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-1 tabular-nums">
                {meter.voltageV}V · PF {(meter.powerFactor || 0.95).toFixed(2)}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 capitalize">
                Occupancy: <strong className="text-slate-800 dark:text-slate-200">{meter.occupancyStatus}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Chart & Self-Service Appliance Controls Row */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* 24-Hour Diurnal Load & Water Chart */}
          <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col justify-between">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                    24-Hour Electricity &amp; Water Consumption Curve
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Hourly smart meter telemetry with contracted load threshold ({meter.sanctionedLoadKw.toFixed(1)} kW)
                  </p>
                </div>

                <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs">
                  {(['both', 'power', 'water'] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setChartMetric(mode)}
                      className={`px-2.5 py-1 rounded-md text-xs font-medium capitalize transition-colors cursor-pointer ${
                        chartMetric === mode
                          ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-semibold'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      {mode === 'both' ? 'Combined' : mode === 'power' ? 'Power (kW)' : 'Water (L/h)'}
                    </button>
                  ))}
                </div>
              </div>

              <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-48 overflow-visible">
                <line x1="30" y1="25" x2={chartWidth - 20} y2="25" className="stroke-slate-100 dark:stroke-slate-800" strokeWidth="1" />
                <line x1="30" y1="95" x2={chartWidth - 20} y2="95" className="stroke-slate-100 dark:stroke-slate-800" strokeWidth="1" />
                <line x1="30" y1="165" x2={chartWidth - 20} y2="165" className="stroke-slate-100 dark:stroke-slate-800" strokeWidth="1" />

                {/* Sanctioned Load Limit Line */}
                {(chartMetric === 'both' || chartMetric === 'power') && (
                  <line
                    x1="30"
                    y1={sanctionedY}
                    x2={chartWidth - 20}
                    y2={sanctionedY}
                    stroke="#10b981"
                    strokeWidth="1.3"
                    strokeDasharray="5 4"
                  />
                )}

                {/* Water Polyline */}
                {(chartMetric === 'both' || chartMetric === 'water') && waterPoints && (
                  <polyline fill="none" stroke="#0ea5e9" strokeWidth="2.2" points={waterPoints} />
                )}

                {/* Power Polyline */}
                {(chartMetric === 'both' || chartMetric === 'power') && powerPoints && (
                  <polyline fill="none" stroke="#f59e0b" strokeWidth="2.4" points={powerPoints} />
                )}
              </svg>

              <div className="flex justify-between text-[11px] text-slate-400 dark:text-slate-500 font-mono px-4 mt-1 tabular-nums">
                <span>00:00 (Night)</span>
                <span>06:00 (Morning Peak)</span>
                <span>12:00 (Midday)</span>
                <span>18:00 (Evening Peak)</span>
                <span>23:00</span>
              </div>
            </div>

            {/* Time-of-Use (ToU) Summary Strip */}
            <div className="grid grid-cols-3 gap-3 pt-4 mt-4 border-t border-slate-200 dark:border-slate-800 text-xs font-mono tabular-nums">
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                <div className="font-sans text-[11px] text-slate-500 dark:text-slate-400">Off-Peak (23:00–06:00)</div>
                <div className="font-bold text-slate-900 dark:text-white mt-0.5">{offPeakKwh.toFixed(1)} kWh</div>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                <div className="font-sans text-[11px] text-slate-500 dark:text-slate-400">Mid-Peak (10:00–16:00)</div>
                <div className="font-bold text-slate-900 dark:text-white mt-0.5">{midPeakKwh.toFixed(1)} kWh</div>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                <div className="font-sans text-[11px] text-slate-500 dark:text-slate-400">Peak Hours (06–09, 17–22)</div>
                <div className="font-bold text-amber-600 dark:text-amber-400 mt-0.5">{onPeakKwh.toFixed(1)} kWh</div>
              </div>
            </div>
          </div>

          {/* Right Column: Usage Summary & Consumer Controls */}
          <div className="lg:col-span-4 space-y-5">
            {/* Consumer Load & Mode Controls */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-3.5">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Household Mode &amp; Load Controls
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Test how your smart meter responds to vacation mode or high-power appliances in real time.
                </p>
              </div>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => handleUpdateConsumerMode('normal')}
                  disabled={isUpdatingMode}
                  className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-left flex items-center justify-between text-xs transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-2 font-medium text-slate-800 dark:text-slate-200">
                    <RotateCcw className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Standard Household Load</span>
                  </span>
                  <span className="font-mono text-slate-500 dark:text-slate-400">
                    {(meter.sanctionedLoadKw * 0.48).toFixed(1)} kW
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleUpdateConsumerMode('vacation')}
                  disabled={isUpdatingMode}
                  className="w-full p-2.5 rounded-lg border border-sky-200 dark:border-sky-800/80 bg-sky-50/40 dark:bg-sky-950/30 hover:bg-sky-100/50 dark:hover:bg-sky-900/40 text-left flex items-center justify-between text-xs transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-2 font-medium text-sky-900 dark:text-sky-200">
                    <ShieldCheck className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                    <span>Enable Vacation / Away Mode</span>
                  </span>
                  <span className="font-mono text-sky-700 dark:text-sky-400">0.1 L/h · 0.11 kW</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleUpdateConsumerMode('heavy_appliance')}
                  disabled={isUpdatingMode}
                  className="w-full p-2.5 rounded-lg border border-amber-200 dark:border-amber-800/80 bg-amber-50/40 dark:bg-amber-950/30 hover:bg-amber-100/50 dark:hover:bg-amber-900/40 text-left flex items-center justify-between text-xs transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-2 font-medium text-amber-900 dark:text-amber-200">
                    <Flame className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <span>Simulate Heavy EV / HVAC Overload</span>
                  </span>
                  <span className="font-mono text-amber-700 dark:text-amber-400">
                    {(meter.sanctionedLoadKw * 2.1).toFixed(1)} kW
                  </span>
                </button>
              </div>

              {feedbackMessage && (
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>{feedbackMessage}</span>
                </div>
              )}
            </div>

            {/* Billing & Contract Summary Card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-3 text-xs">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Billing &amp; Contract Breakdown
              </h3>

              <div className="space-y-2 font-mono tabular-nums">
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span className="font-sans">Tariff Rate ({meter.consumerType})</span>
                  <span className="font-semibold text-slate-900 dark:text-white">${ratePerKwh.toFixed(2)} / kWh</span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span className="font-sans">Peak Hour Recorded</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {peakHourPoint?.timeLabel || '18:00'} ({peakPowerKw.toFixed(2)} kW)
                  </span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span className="font-sans">Consecutive Overuse Hours</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {meter.consecutiveOveruseHours} hrs
                  </span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span className="font-sans">Active Field Notices</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {userIncidents.length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 24-Hour Hourly Usage Log Table */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                24-Hour Hourly Smart Meter Telemetry Log
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Synchronized hourly electricity (kW), water flow (L/h), and estimated cost for {meter.id}
              </p>
            </div>
          </div>

          <div className="overflow-x-auto max-h-96">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="sticky top-0 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-medium">
                <tr>
                  <th className="py-2.5 px-4">Hour</th>
                  <th className="py-2.5 px-4 text-right">Electricity (kW)</th>
                  <th className="py-2.5 px-4 text-right">Sanctioned Limit</th>
                  <th className="py-2.5 px-4 text-right">Load %</th>
                  <th className="py-2.5 px-4 text-right">Water Flow (L/h)</th>
                  <th className="py-2.5 px-4 text-right">Est. Hourly Cost</th>
                  <th className="py-2.5 px-4">Hourly Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-mono tabular-nums">
                {history.map((pt) => {
                  const utilPct = Math.round((pt.powerKw / meter.sanctionedLoadKw) * 100);
                  const hourlyCost = pt.powerKw * ratePerKwh + (pt.waterLph / 1000) * waterRatePer1000L;

                  return (
                    <tr key={pt.hour} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="py-2.5 px-4 font-semibold text-slate-900 dark:text-white">
                        {pt.timeLabel}
                      </td>
                      <td className="py-2.5 px-4 text-right font-semibold text-slate-900 dark:text-white">
                        {pt.powerKw.toFixed(2)} kW
                      </td>
                      <td className="py-2.5 px-4 text-right text-slate-500 dark:text-slate-400">
                        {meter.sanctionedLoadKw.toFixed(1)} kW
                      </td>
                      <td className="py-2.5 px-4 text-right text-slate-700 dark:text-slate-300">
                        {utilPct}%
                      </td>
                      <td className="py-2.5 px-4 text-right text-slate-800 dark:text-slate-200">
                        {pt.waterLph.toFixed(1)} L/h
                      </td>
                      <td className="py-2.5 px-4 text-right text-slate-700 dark:text-slate-300">
                        ${hourlyCost.toFixed(3)}
                      </td>
                      <td className="py-2.5 px-4 font-sans capitalize">
                        {pt.classification === 'theft' ? (
                          <span className="text-rose-600 dark:text-rose-400 font-semibold">Meter Bypass Alert</span>
                        ) : pt.classification === 'overuse' ? (
                          <span className="text-amber-600 dark:text-amber-400 font-semibold">Overuse</span>
                        ) : (
                          <span className="text-emerald-600 dark:text-emerald-400 font-medium">Normal</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 text-xs py-4 px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            VoltWatch Consumer Portal · Logged in as <strong>{meter.consumerName}</strong> ({meter.id})
          </div>
          <div className="font-mono text-[11px]">Session: {session.id}</div>
        </div>
      </footer>
    </div>
  );
};
