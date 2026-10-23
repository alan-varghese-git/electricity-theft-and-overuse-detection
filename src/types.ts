export type ConsumerType = 'residential' | 'commercial' | 'industrial';
export type ClassificationType = 'normal' | 'theft' | 'overuse';
export type OccupancyStatus = 'occupied' | 'vacant' | 'uncertain';
export type TamperState = 'none' | 'meter_bypass' | 'line_tap' | 'vacation' | 'crypto_mining';
export type IncidentStatus = 'investigating' | 'confirmed' | 'resolved' | 'dismissed';
export type IncidentSeverity = 'critical' | 'high' | 'medium' | 'low';
export type TransformerStatus = 'normal' | 'warning' | 'overloaded';

export interface AdminUser {
  id: 'ADMIN-1' | 'ADMIN-2' | 'ADMIN-3' | 'ADMIN-4';
  slotNumber: number;
  email: string;
  roleTitle: string;
  lastLoginAt?: string;
}

export interface AuthSession {
  id: string;
  role: 'admin' | 'user';
  subjectId: string; // Verified Admin Email or Dataset Meter ID
  displayName: string;
  subtitle: string;
  authMethod: 'firebase_google' | 'firebase_email' | 'consumer_meter';
  firebaseUid?: string;
  status: 'active' | 'signed_out';
  createdAt: string;
  lastActiveAt: string;
}

export interface Meter {
  id: string;
  consumerName: string;
  consumerAddress: string;
  consumerType: ConsumerType;
  transformerId: string;
  sanctionedLoadKw: number;
  currentPowerKw: number;
  currentWaterLph: number;
  voltageV: number;
  powerFactor: number;
  classification: ClassificationType;
  theftProbability: number;
  overuseProbability: number;
  occupancyStatus: OccupancyStatus;
  anomalyReason: string;
  consecutiveOveruseHours: number;
  tamperState: TamperState;
  updatedAt: string;
  xgboost?: XGBoostPredictionDetails;
  // History for sparklines and local display
  history?: HourlyReadingPoint[];
}

export interface HourlyReadingPoint {
  hour: number;
  timeLabel: string;
  powerKw: number;
  waterLph: number;
  occupancyScore: number;
  classification: ClassificationType;
}

export interface Incident {
  id: string;
  meterId: string;
  consumerName: string;
  type: 'theft' | 'overuse' | 'tamper_flag';
  severity: IncidentSeverity;
  powerKw: number;
  waterLph: number;
  occupancyScore: number;
  description: string;
  timestamp: string;
  status: IncidentStatus;
  actionNotes?: string;
  inspectorAssigned?: string;
}

export interface Transformer {
  id: string;
  name: string;
  capacityKva: number;
  currentLoadKw: number;
  aggregateMeterLoadKw: number;
  lossDiscrepancyKw: number;
  lossPercentage: number;
  meterCount: number;
  status: TransformerStatus;
  location: string;
  updatedAt: string;
}

export interface XGBoostShapAttribution {
  featureKey: string;
  featureName: string;
  featureValue: number;
  unit: string;
  shapValue: number; // positive = drives predicted class; negative = opposes
  interpretation: string;
}

export interface XGBoostFeatureImportance {
  featureKey: string;
  name: string;
  gain: number; // split gain percentage
  weight: number; // frequency in trees
  description: string;
}

export interface XGBoostPredictionDetails {
  modelName: string;
  modelVersion: string;
  predictedClass: ClassificationType;
  classProbabilities: {
    normal: number;
    theft: number;
    overuse: number;
  };
  rawMargins: {
    normal: number;
    theft: number;
    overuse: number;
  };
  confidence: number;
  shapAttributions: XGBoostShapAttribution[];
  topDrivers: string[];
}

export interface ClassificationResult {
  classification: ClassificationType;
  theftProbability: number;
  overuseProbability: number;
  occupancyStatus: OccupancyStatus;
  occupancyConsistencyIndex: number;
  anomalyReason: string;
  isFalseAlarmProtected: boolean;
  xgboost?: XGBoostPredictionDetails;
}
