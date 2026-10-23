import { ClassificationResult, ClassificationType, OccupancyStatus } from '../types';
import { runXGBoostInference } from './xgboostEngine';

/**
 * AI Multi-Source Classification Engine Powered by XGBoost
 * Correlates synchronized Electricity AMI and Water Meter streams via
 * eXtreme Gradient Boosted Decision Trees (GBDT) with SHAP attribution.
 */
export function classifyMultiSourceReading(params: {
  powerKw: number;
  waterLph: number;
  sanctionedLoadKw: number;
  consecutiveOveruseHours: number;
  hourOfDay: number; // 0 - 23
  consumerType?: string;
  voltageV?: number;
  powerFactor?: number;
}): ClassificationResult {
  const { powerKw, waterLph, sanctionedLoadKw, consecutiveOveruseHours, hourOfDay, voltageV, powerFactor } = params;

  // Run the XGBoost Gradient Boosted Decision Tree Inference Engine
  const xgbResult = runXGBoostInference({
    powerKw,
    waterLph,
    sanctionedLoadKw,
    consecutiveOveruseHours,
    hourOfDay,
    voltageV,
    powerFactor,
  });

  // Physical occupancy determination
  const WATER_OCCUPANCY_THRESHOLD = 8.0;
  const isOccupied = waterLph >= WATER_OCCUPANCY_THRESHOLD;
  const isVacant = waterLph < 2.0 && powerKw < 0.35;

  let occupancyStatus: OccupancyStatus = 'uncertain';
  if (isOccupied) occupancyStatus = 'occupied';
  else if (isVacant) occupancyStatus = 'vacant';

  const safePower = Math.max(powerKw, 0.02);
  const occupancyConsistencyIndex = Number((waterLph / safePower).toFixed(2));

  // Determine false alarm protection (vacation homes)
  const isFalseAlarmProtected =
    xgbResult.predictedClass === 'normal' && isVacant && powerKw <= 0.25;

  // Synthesize anomaly reason with XGBoost decision drivers
  let anomalyReason = '';
  const topDriverText = xgbResult.topDrivers.length > 0 ? ` [Key XGBoost Drivers: ${xgbResult.topDrivers.join(', ')}]` : '';

  if (xgbResult.predictedClass === 'theft') {
    anomalyReason = `XGBOOST METER BYPASS (Class 1): Active water flow (${waterLph.toFixed(1)} L/h) confirms human occupancy, but electricity meter registers near-zero draw (${powerKw.toFixed(2)} kW). Model confidence: ${(xgbResult.confidence * 100).toFixed(1)}%.${topDriverText}`;
  } else if (xgbResult.predictedClass === 'overuse') {
    const excess = Math.round(((powerKw / sanctionedLoadKw) - 1) * 100);
    anomalyReason = `XGBOOST SANCTIONED LOAD BREACH (Class 2): Power draw ${powerKw.toFixed(2)} kW exceeds approved limit of ${sanctionedLoadKw.toFixed(1)} kW by ${excess}% (Hour ${consecutiveOveruseHours + 1} sustained). Model confidence: ${(xgbResult.confidence * 100).toFixed(1)}%.${topDriverText}`;
  } else if (isFalseAlarmProtected) {
    anomalyReason = `XGBOOST FALSE ALARM SUPPRESSED: Low electricity (${powerKw.toFixed(2)} kW) verified against zero water usage (${waterLph.toFixed(1)} L/h). Tree ensemble confirms legitimate unoccupied vacation state.${topDriverText}`;
  } else {
    const isPeakHour = (hourOfDay >= 7 && hourOfDay <= 9) || (hourOfDay >= 18 && hourOfDay <= 22);
    anomalyReason = isPeakHour
      ? `XGBoost Normal Peak: Diurnal correlation verified between active power (${powerKw.toFixed(2)} kW) and water (${waterLph.toFixed(1)} L/h) within sanctioned limit (${sanctionedLoadKw.toFixed(1)} kW).`
      : `XGBoost Normal Baseline: Active draw (${powerKw.toFixed(2)} kW) and water (${waterLph.toFixed(1)} L/h) within expected multi-source operational envelope.`;
  }

  return {
    classification: xgbResult.predictedClass,
    theftProbability: xgbResult.classProbabilities.theft,
    overuseProbability: xgbResult.classProbabilities.overuse,
    occupancyStatus,
    occupancyConsistencyIndex,
    anomalyReason,
    isFalseAlarmProtected,
    xgboost: xgbResult,
  };
}
