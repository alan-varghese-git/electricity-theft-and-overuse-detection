import React, { useState } from 'react';
import {
  X,
  Cpu,
  Zap,
  Droplets,
  AlertTriangle,
  Flame,
  CheckCircle2,
  Sliders,
  TrendingUp,
  Binary,
  Layers,
} from 'lucide-react';
import {
  XGBOOST_BENCHMARK_METRICS,
  runXGBoostInference,
  extractXGBoostFeatures,
} from '../services/xgboostEngine';

interface XGBoostModelModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const XGBoostModelModal: React.FC<XGBoostModelModalProps> = ({ isOpen, onClose }) => {
  // Interactive Live Feature Sandbox
  const [simPower, setSimPower] = useState(0.04);
  const [simWater, setSimWater] = useState(28.0);
  const [simSanctioned, setSimSanctioned] = useState(4.0);
  const [simHours, setSimHours] = useState(0);

  if (!isOpen) return null;

  // Compute live prediction
  const livePrediction = runXGBoostInference({
    powerKw: simPower,
    waterLph: simWater,
    sanctionedLoadKw: simSanctioned,
    consecutiveOveruseHours: simHours,
    hourOfDay: 14,
  });

  const liveFeatures = extractXGBoostFeatures({
    powerKw: simPower,
    waterLph: simWater,
    sanctionedLoadKw: simSanctioned,
    consecutiveOveruseHours: simHours,
    hourOfDay: 14,
  });

  const probNormal = (livePrediction.classProbabilities.normal * 100).toFixed(1);
  const probTheft = (livePrediction.classProbabilities.theft * 100).toFixed(1);
  const probOveruse = (livePrediction.classProbabilities.overuse * 100).toFixed(1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-[1px] p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-700 dark:text-blue-400">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                XGBoost v2.1 Multi-Source Classifier
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Gradient Boosted Decision Trees (GBDT) for Electricity Theft &amp; Sanctioned Overuse Detection
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-slate-700 dark:text-slate-300 text-xs">
          {/* Key Metrics Ribbon */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl">
              <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Test Accuracy</div>
              <div className="text-lg font-bold font-mono text-slate-900 dark:text-white mt-1">
                {XGBOOST_BENCHMARK_METRICS.testAccuracy}%
              </div>
              <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">Holdout test split</div>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl">
              <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Theft ROC-AUC</div>
              <div className="text-lg font-bold font-mono text-slate-900 dark:text-white mt-1">
                {XGBOOST_BENCHMARK_METRICS.theftRocAuc}
              </div>
              <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">Multi-class OvR</div>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl">
              <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Theft Precision</div>
              <div className="text-lg font-bold font-mono text-slate-900 dark:text-white mt-1">
                {XGBOOST_BENCHMARK_METRICS.theftPrecision}%
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Near-zero false pos</div>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl">
              <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Theft Recall</div>
              <div className="text-lg font-bold font-mono text-slate-900 dark:text-white mt-1">
                {XGBOOST_BENCHMARK_METRICS.theftRecall}%
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">97.9% detected</div>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl">
              <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">False Alarm Suppr.</div>
              <div className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
                {XGBOOST_BENCHMARK_METRICS.falseAlarmSuppressionRate}%
              </div>
              <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">vs 41.2% in SGCC</div>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl">
              <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Tree Depth / Est.</div>
              <div className="text-lg font-bold font-mono text-slate-900 dark:text-white mt-1">4 / 60</div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">0.4ms inference</div>
            </div>
          </div>

          {/* Interactive Feature Sandbox */}
          <div className="p-5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 dark:border-slate-700/80 pb-3">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Interactive Live Inference Sandbox
                </h3>
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Adjust sliders to recalculate log-odds and SHAP attributions in real time
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Sliders */}
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between font-medium text-slate-700 dark:text-slate-300 mb-1">
                    <span className="flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-amber-500" />
                      Active Power (kW)
                    </span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">{simPower.toFixed(2)} kW</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    step="0.02"
                    value={simPower}
                    onChange={(e) => setSimPower(parseFloat(e.target.value))}
                    className="w-full accent-blue-600 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 dark:text-slate-500 font-mono mt-0.5">
                    <span>0.00 kW (Bypass)</span>
                    <span>2.0 kW (Nominal)</span>
                    <span>10.0 kW (Overload)</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between font-medium text-slate-700 dark:text-slate-300 mb-1">
                    <span className="flex items-center gap-1.5">
                      <Droplets className="w-3.5 h-3.5 text-blue-500" />
                      Water AMI Flow (L/h)
                    </span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">{simWater.toFixed(1)} L/h</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="60"
                    step="0.5"
                    value={simWater}
                    onChange={(e) => setSimWater(parseFloat(e.target.value))}
                    className="w-full accent-blue-600 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 dark:text-slate-500 font-mono mt-0.5">
                    <span>0.0 L/h (Vacation)</span>
                    <span>20.0 L/h (Normal)</span>
                    <span>60.0 L/h (High Occupancy)</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">Sanctioned Limit</label>
                    <select
                      value={simSanctioned}
                      onChange={(e) => setSimSanctioned(parseFloat(e.target.value))}
                      className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-white font-mono focus:outline-none focus:border-blue-500"
                    >
                      <option value="3.0">3.0 kW (Standard)</option>
                      <option value="4.0">4.0 kW (Enhanced)</option>
                      <option value="6.0">6.0 kW (Premium)</option>
                      <option value="10.0">10.0 kW (Commercial)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">Overuse Duration</label>
                    <select
                      value={simHours}
                      onChange={(e) => setSimHours(parseInt(e.target.value))}
                      className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-white font-mono focus:outline-none focus:border-blue-500"
                    >
                      <option value="0">0 hrs (Momentary)</option>
                      <option value="1">1 hr sustained</option>
                      <option value="2">2 hrs sustained</option>
                      <option value="4">4+ hrs (Heavy)</option>
                    </select>
                  </div>
                </div>

                {/* Quick Scenario Buttons */}
                <div className="pt-2 flex flex-wrap gap-1.5">
                  <span className="text-[10px] text-slate-400 self-center mr-1">Presets:</span>
                  <button
                    type="button"
                    onClick={() => { setSimPower(0.04); setSimWater(32.0); setSimSanctioned(4.0); setSimHours(0); }}
                    className="px-2 py-1 rounded bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-800 text-[10px] font-medium cursor-pointer"
                  >
                    Meter Bypass (Theft)
                  </button>
                  <button
                    type="button"
                    onClick={() => { setSimPower(0.10); setSimWater(0.0); setSimSanctioned(4.0); setSimHours(0); }}
                    className="px-2 py-1 rounded bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-900/60 border border-sky-200 dark:border-sky-800 text-[10px] font-medium cursor-pointer"
                  >
                    Vacation (0-Alarm)
                  </button>
                  <button
                    type="button"
                    onClick={() => { setSimPower(7.8); setSimWater(20.0); setSimSanctioned(4.0); setSimHours(2); }}
                    className="px-2 py-1 rounded bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/60 border border-amber-200 dark:border-amber-800 text-[10px] font-medium cursor-pointer"
                  >
                    Sanctioned Overuse
                  </button>
                  <button
                    type="button"
                    onClick={() => { setSimPower(2.1); setSimWater(22.0); setSimSanctioned(4.0); setSimHours(0); }}
                    className="px-2 py-1 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800 text-[10px] font-medium cursor-pointer"
                  >
                    Normal Correlated
                  </button>
                </div>
              </div>

              {/* Live Inference Output */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Model Output
                    </span>
                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-md border capitalize flex items-center gap-1.5 ${
                        livePrediction.predictedClass === 'theft'
                          ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                          : livePrediction.predictedClass === 'overuse'
                          ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                          : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                      }`}
                    >
                      {livePrediction.predictedClass === 'theft' && <AlertTriangle className="w-3.5 h-3.5" />}
                      {livePrediction.predictedClass === 'overuse' && <Flame className="w-3.5 h-3.5" />}
                      {livePrediction.predictedClass === 'normal' && <CheckCircle2 className="w-3.5 h-3.5" />}
                      Predicted: {livePrediction.predictedClass}
                    </span>
                  </div>

                  {/* Softmax Probabilities */}
                  <div className="space-y-2 mb-4">
                    <div>
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="text-slate-600 dark:text-slate-400 font-medium">Class 0: Normal Baseline</span>
                        <span className="font-mono font-bold text-slate-900 dark:text-white">{probNormal}%</span>
                      </div>
                      <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 transition-all duration-300" style={{ width: `${probNormal}%` }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="text-slate-600 dark:text-slate-400 font-medium">Class 1: Meter Bypass Theft</span>
                        <span className="font-mono font-bold text-rose-700 dark:text-rose-400">{probTheft}%</span>
                      </div>
                      <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-rose-500 transition-all duration-300" style={{ width: `${probTheft}%` }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="text-slate-600 dark:text-slate-400 font-medium">Class 2: Sanctioned Overuse</span>
                        <span className="font-mono font-bold text-amber-700 dark:text-amber-400">{probOveruse}%</span>
                      </div>
                      <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-500 transition-all duration-300" style={{ width: `${probOveruse}%` }} />
                      </div>
                    </div>
                  </div>

                  {/* Calculated Engineered Indices */}
                  <div className="grid grid-cols-2 gap-2 text-[11px] p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-100 dark:border-slate-800 font-mono mb-3">
                    <div>
                      <span className="text-slate-500 dark:text-slate-400">OCI Index: </span>
                      <span className="font-bold text-slate-800 dark:text-white">{liveFeatures.f4_oci_index}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-slate-400">Load Ratio: </span>
                      <span className="font-bold text-slate-800 dark:text-white">{liveFeatures.f3_load_ratio}x</span>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-slate-400">Z-Divergence: </span>
                      <span className="font-bold text-slate-800 dark:text-white">{liveFeatures.f5_cross_utility_divergence}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-slate-400">Confidence: </span>
                      <span className="font-bold text-blue-700 dark:text-blue-400">{(livePrediction.confidence * 100).toFixed(1)}%</span>
                    </div>
                  </div>
                </div>

                {/* Top SHAP Drivers */}
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-1">
                    Top SHAP Feature Attributions
                  </span>
                  <div className="space-y-1">
                    {livePrediction.shapAttributions.slice(0, 3).map((shap, idx) => (
                      <div key={idx} className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-600 dark:text-slate-400 truncate max-w-[200px]">{shap.featureName}</span>
                        <span className={`font-mono font-bold ${shap.shapValue > 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-500'}`}>
                          {shap.shapValue > 0 ? `+${shap.shapValue.toFixed(3)}` : shap.shapValue.toFixed(3)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Global Feature Importance Table */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
            <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-slate-700 dark:text-slate-300" />
                Global Feature Importance Rankings (Split Gain % &amp; Frequency)
              </h3>
              <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">Trained on Pecan Street + SGCC</span>
            </div>
            <div className="p-4 space-y-3">
              {XGBOOST_BENCHMARK_METRICS.globalFeatureImportances.map((item, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-medium text-slate-800 dark:text-slate-200 flex items-center gap-2">
                      <span className="font-mono text-[10px] text-slate-400">#{idx + 1}</span>
                      {item.name}
                      <span className="text-[10px] text-slate-400">({item.unit})</span>
                    </span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">
                      {item.globalGain.toFixed(1)}% Gain
                    </span>
                  </div>
                  <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
                    <div
                      className={`h-full ${
                        idx === 0
                          ? 'bg-blue-600'
                          : idx === 1
                          ? 'bg-amber-500'
                          : idx === 2
                          ? 'bg-cyan-500'
                          : idx === 3
                          ? 'bg-indigo-500'
                          : 'bg-slate-400'
                      }`}
                      style={{ width: `${item.globalGain}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">{item.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Benchmark Comparison: Single-Utility SGCC vs Multi-Source XGBoost */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
            <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-slate-700 dark:text-slate-300" />
                Benchmark Comparison: Single-Utility (SGCC) vs. Multi-Source XGBoost
              </h3>
            </div>
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                  <th className="py-2.5 px-4 font-semibold text-slate-700 dark:text-slate-300">Evaluation Metric</th>
                  <th className="py-2.5 px-4 font-semibold text-slate-500 dark:text-slate-400">Single-Utility Baseline (SGCC)</th>
                  <th className="py-2.5 px-4 font-semibold text-blue-700 dark:text-blue-400">VoltWatch Multi-Source XGBoost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {XGBOOST_BENCHMARK_METRICS.comparisonVsBaselines.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="py-2 px-4 font-medium text-slate-800 dark:text-slate-200">{row.metric}</td>
                    <td className="py-2 px-4 font-mono text-slate-500 dark:text-slate-400">{row.singleUtilityBaseline}</td>
                    <td className="py-2 px-4 font-mono font-bold text-emerald-700 dark:text-emerald-400">{row.xgboostMultiSource}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mathematical Formulation */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Binary className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              Mathematical Objective Function &amp; Second-Order Taylor Optimization
            </h4>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
              At round <span className="font-mono">t</span>, XGBoost minimizes the regularized second-order Taylor approximation across all <span className="font-mono">K=3</span> classes:
            </p>
            <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg font-mono text-[11px] text-slate-800 dark:text-slate-200 text-center overflow-x-auto">
              {'L^(t) ≈ ∑ [ g_ik * f_t(x_i) + 0.5 * h_ik * (f_t(x_i))^2 ] + γ*T + 0.5*λ*∑(w_j^2)'}
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
              where <span className="font-mono">{'g_ik = p_ik - y_ik'}</span> is the multi-class first-order gradient, <span className="font-mono">{'h_ik = 2*p_ik*(1 - p_ik)'}</span> is the second-order Hessian, and <span className="font-mono">λ = 1.5</span> penalizes tree complexity, preventing overfitting on noisy secondary AMI lines.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900">
          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
            Model: <span className="font-bold text-slate-800 dark:text-slate-200">XGBoost v2.1-hist</span> • Parameters: 60 Trees (Depth 4)
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg font-semibold text-xs hover:bg-slate-800 dark:hover:bg-slate-200 transition cursor-pointer"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
