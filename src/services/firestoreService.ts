import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
} from 'firebase/firestore';
import {
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';
import { Meter, Incident, Transformer, TamperState, AuthSession } from '../types';
import {
  INITIAL_METERS,
  INITIAL_TRANSFORMERS,
  INITIAL_INCIDENTS,
  US_CITIES_METERS,
  US_CITIES_TRANSFORMERS,
  US_CITIES_INCIDENTS,
  SGCC_METERS,
  SGCC_TRANSFORMERS,
  SGCC_INCIDENTS,
  generate24HourProfile
} from './gridSimulation';
import { classifyMultiSourceReading } from './aiClassifier';

// Create an authentication session record
export async function createFirebaseAuthSession(params: {
  role: 'admin' | 'user';
  subjectId: string;
  displayName: string;
  subtitle: string;
  authMethod: 'firebase_email' | 'consumer_meter';
  firebaseUid?: string;
}): Promise<AuthSession> {
  const now = new Date().toISOString();
  const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
  const cleanSub = params.subjectId.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 24);
  const sessionId = `SES-${params.role.toUpperCase()}-${cleanSub}-${randomSuffix}`;

  const session: AuthSession = {
    id: sessionId,
    role: params.role,
    subjectId: params.subjectId,
    displayName: params.displayName,
    subtitle: params.subtitle.slice(0, 190),
    authMethod: params.authMethod,
    ...(params.firebaseUid ? { firebaseUid: params.firebaseUid } : {}),
    status: 'active',
    createdAt: now,
    lastActiveAt: now,
  };

  try {
    await setDoc(doc(db, 'auth_sessions', session.id), session);
  } catch (error) {
    console.warn('Session Firestore audit log warning (proceeding with local session):', error);
  }
  return session;
}

// Admin Sign-In strictly using Email & Password registered in Firebase Authentication
export async function signInAdminWithEmailPassword(
  email: string,
  password: string
): Promise<AuthSession> {
  const normalizedEmail = email.trim().toLowerCase();
  const cred = await signInWithEmailAndPassword(auth, normalizedEmail, password);
  const verifiedEmail = cred.user.email || normalizedEmail;

  return createFirebaseAuthSession({
    role: 'admin',
    subjectId: verifiedEmail,
    displayName: verifiedEmail,
    subtitle: 'System Administrator',
    authMethod: 'firebase_email',
    firebaseUid: cred.user.uid,
  });
}

// End an active authentication session
export async function endFirebaseAuthSession(session: AuthSession | null): Promise<void> {
  if (!session) return;
  try {
    await updateDoc(doc(db, 'auth_sessions', session.id), {
      status: 'signed_out',
      lastActiveAt: new Date().toISOString(),
    });
    if (auth.currentUser) {
      await firebaseSignOut(auth);
    }
  } catch (error) {
    console.warn('Session sign-out update warning:', error);
  }
}

// Subscribe to all meters in real-time
export function subscribeToMeters(
  callback: (meters: Meter[]) => void,
  onError?: (err: Error) => void
) {
  const metersCol = collection(db, 'meters');
  return onSnapshot(
    metersCol,
    (snapshot) => {
      const meters: Meter[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as Meter;
        // Generate deterministic 24-hour profile reflecting current tamperState & readings
        data.history = generate24HourProfile(
          data.id,
          data.sanctionedLoadKw,
          data.tamperState || 'none',
          data.currentPowerKw,
          data.currentWaterLph
        );
        meters.push(data);
      });
      // Sort stably by ID
      meters.sort((a, b) => a.id.localeCompare(b.id));
      callback(meters);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.GET, 'meters');
      } catch (e) {
        if (onError) onError(e as Error);
      }
    }
  );
}

// Subscribe to incidents in real-time
export function subscribeToIncidents(
  callback: (incidents: Incident[]) => void,
  onError?: (err: Error) => void
) {
  const incidentsCol = collection(db, 'incidents');
  return onSnapshot(
    incidentsCol,
    (snapshot) => {
      const incidents: Incident[] = [];
      snapshot.forEach((docSnap) => {
        incidents.push(docSnap.data() as Incident);
      });
      // Sort by newest timestamp first
      incidents.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      callback(incidents);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.GET, 'incidents');
      } catch (e) {
        if (onError) onError(e as Error);
      }
    }
  );
}

// Subscribe to transformers in real-time
export function subscribeToTransformers(
  callback: (transformers: Transformer[]) => void,
  onError?: (err: Error) => void
) {
  const transformersCol = collection(db, 'transformers');
  return onSnapshot(
    transformersCol,
    (snapshot) => {
      const transformers: Transformer[] = [];
      snapshot.forEach((docSnap) => {
        transformers.push(docSnap.data() as Transformer);
      });
      transformers.sort((a, b) => a.id.localeCompare(b.id));
      callback(transformers);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.GET, 'transformers');
      } catch (e) {
        if (onError) onError(e as Error);
      }
    }
  );
}

// Seed initial data if database is empty or still holds the legacy 8-node dataset
export async function seedInitialGridDataIfEmpty(): Promise<void> {
  try {
    const snap = await getDocs(collection(db, 'meters'));
    if (snap.empty || snap.size < 12) {
      await switchGridDataset('us_cities');
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'meters_seed');
  }
}

// Update a meter reading and reclassify via XGBoost
export async function updateMeterSimulationReading(
  meter: Meter,
  updates: {
    powerKw?: number;
    waterLph?: number;
    tamperState?: TamperState;
    hourOfDay?: number;
  }
): Promise<Meter> {
  const newPower = updates.powerKw !== undefined ? Number(updates.powerKw.toFixed(2)) : meter.currentPowerKw;
  const newWater = updates.waterLph !== undefined ? Number(updates.waterLph.toFixed(1)) : meter.currentWaterLph;
  const newTamperState = updates.tamperState !== undefined ? updates.tamperState : meter.tamperState;
  const hour = updates.hourOfDay ?? new Date().getHours();

  let inputConsecutiveHours = classificationResultConsecutiveHours(meter, newPower);
  if (newTamperState === 'crypto_mining' && newPower > meter.sanctionedLoadKw * 1.25) {
    inputConsecutiveHours = Math.max(4, inputConsecutiveHours);
  } else if (newTamperState === 'none' || newTamperState === 'vacation') {
    inputConsecutiveHours = 0;
  }

  // Run XGBoost Multi-Source Classification
  const classificationResult = classifyMultiSourceReading({
    powerKw: newPower,
    waterLph: newWater,
    sanctionedLoadKw: meter.sanctionedLoadKw,
    consecutiveOveruseHours: inputConsecutiveHours,
    hourOfDay: hour,
    consumerType: meter.consumerType,
    voltageV: meter.voltageV,
    powerFactor: meter.powerFactor,
  });

  const consecutiveHours =
    classificationResult.classification === 'overuse'
      ? Math.max(1, inputConsecutiveHours)
      : 0;

  const safeReason = classificationResult.anomalyReason.slice(0, 490);

  const updatedMeter: Meter = {
    id: meter.id,
    consumerName: meter.consumerName,
    consumerAddress: meter.consumerAddress,
    consumerType: meter.consumerType,
    transformerId: meter.transformerId,
    sanctionedLoadKw: meter.sanctionedLoadKw,
    currentPowerKw: newPower,
    currentWaterLph: newWater,
    voltageV: meter.voltageV,
    powerFactor: meter.powerFactor,
    classification: classificationResult.classification,
    theftProbability: Number(classificationResult.theftProbability.toFixed(4)),
    overuseProbability: Number(classificationResult.overuseProbability.toFixed(4)),
    occupancyStatus: classificationResult.occupancyStatus,
    anomalyReason: safeReason,
    consecutiveOveruseHours: consecutiveHours,
    tamperState: newTamperState,
    updatedAt: new Date().toISOString(),
  };

  try {
    await setDoc(doc(db, 'meters', meter.id), updatedMeter, { merge: true });

    // Create or update incident record when anomaly is detected
    if (classificationResult.classification === 'theft') {
      const incidentId = `INC-T-${meter.id}`;
      const incident: Incident = {
        id: incidentId,
        meterId: meter.id,
        consumerName: meter.consumerName,
        type: 'theft',
        severity: 'critical',
        powerKw: updatedMeter.currentPowerKw,
        waterLph: updatedMeter.currentWaterLph,
        occupancyScore: classificationResult.occupancyConsistencyIndex,
        description: safeReason,
        timestamp: new Date().toISOString(),
        status: 'investigating',
        inspectorAssigned: 'Field Unit A-101',
        actionNotes: 'Automated alert: Active water occupancy detected during suppressed electric meter flow.',
      };
      await setDoc(doc(db, 'incidents', incidentId), incident);
    } else if (classificationResult.classification === 'overuse') {
      const incidentId = `INC-O-${meter.id}`;
      const incident: Incident = {
        id: incidentId,
        meterId: meter.id,
        consumerName: meter.consumerName,
        type: 'overuse',
        severity: 'high',
        powerKw: updatedMeter.currentPowerKw,
        waterLph: updatedMeter.currentWaterLph,
        occupancyScore: classificationResult.occupancyConsistencyIndex,
        description: safeReason,
        timestamp: new Date().toISOString(),
        status: 'investigating',
        inspectorAssigned: 'Field Unit B-204',
        actionNotes: 'Automated alert: Sanctioned load capacity limit continuously breached.',
      };
      await setDoc(doc(db, 'incidents', incidentId), incident);
    }

    return {
      ...updatedMeter,
      history: generate24HourProfile(
        updatedMeter.id,
        updatedMeter.sanctionedLoadKw,
        updatedMeter.tamperState,
        updatedMeter.currentPowerKw,
        updatedMeter.currentWaterLph
      ),
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `meters/${meter.id}`);
    throw error;
  }
}

function classificationResultConsecutiveHours(meter: Meter, newPower: number): number {
  if (newPower > meter.sanctionedLoadKw * 1.25) {
    return (meter.consecutiveOveruseHours || 0) + 1;
  }
  return 0;
}

// Update incident status
export async function updateIncident(
  incidentId: string,
  updates: Partial<Incident>
): Promise<void> {
  try {
    const cleanUpdates: Record<string, unknown> = {};
    Object.entries(updates).forEach(([k, v]) => {
      if (v !== undefined) cleanUpdates[k] = v;
    });
    await updateDoc(doc(db, 'incidents', incidentId), cleanUpdates);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `incidents/${incidentId}`);
  }
}

// Add a new consumer meter
export async function addCustomMeter(
  meter: Omit<
    Meter,
    | 'theftProbability'
    | 'overuseProbability'
    | 'occupancyStatus'
    | 'anomalyReason'
    | 'consecutiveOveruseHours'
    | 'updatedAt'
  >
): Promise<void> {
  const classificationResult = classifyMultiSourceReading({
    powerKw: meter.currentPowerKw,
    waterLph: meter.currentWaterLph,
    sanctionedLoadKw: meter.sanctionedLoadKw,
    consecutiveOveruseHours: 0,
    hourOfDay: new Date().getHours(),
    consumerType: meter.consumerType,
  });

  const fullMeter: Meter = {
    ...meter,
    classification: classificationResult.classification,
    theftProbability: Number(classificationResult.theftProbability.toFixed(4)),
    overuseProbability: Number(classificationResult.overuseProbability.toFixed(4)),
    occupancyStatus: classificationResult.occupancyStatus,
    anomalyReason: classificationResult.anomalyReason.slice(0, 490),
    consecutiveOveruseHours: 0,
    updatedAt: new Date().toISOString(),
  };

  try {
    await setDoc(doc(db, 'meters', fullMeter.id), fullMeter);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `meters/${fullMeter.id}`);
  }
}

// Reset grid back to default baseline
export async function resetGridToDefault(): Promise<void> {
  await switchGridDataset('default');
}

// Switch dataset between Synthetic Greenwood (12 nodes), US Cities (30 nodes), and SGCC State Grid (28 nodes)
export async function switchGridDataset(dataset: 'default' | 'us_cities' | 'sgcc'): Promise<void> {
  try {
    let metersToLoad = INITIAL_METERS;
    let transformersToLoad = INITIAL_TRANSFORMERS;
    let incidentsToLoad = INITIAL_INCIDENTS;

    if (dataset === 'sgcc') {
      metersToLoad = SGCC_METERS;
      transformersToLoad = SGCC_TRANSFORMERS;
      incidentsToLoad = SGCC_INCIDENTS;
    } else if (dataset === 'us_cities') {
      metersToLoad = US_CITIES_METERS;
      transformersToLoad = US_CITIES_TRANSFORMERS;
      incidentsToLoad = US_CITIES_INCIDENTS;
    }

    // Remove existing records for a clean state
    const currentMetersSnap = await getDocs(collection(db, 'meters'));
    await Promise.all(currentMetersSnap.docs.map((d) => deleteDoc(d.ref)));

    const currentTxSnap = await getDocs(collection(db, 'transformers'));
    await Promise.all(currentTxSnap.docs.map((d) => deleteDoc(d.ref)));

    const currentIncSnap = await getDocs(collection(db, 'incidents'));
    await Promise.all(currentIncSnap.docs.map((d) => deleteDoc(d.ref)));

    await Promise.all(
      transformersToLoad.map((tx) => setDoc(doc(db, 'transformers', tx.id), tx))
    );

    await Promise.all(
      metersToLoad.map((mtr) => {
        const { history, ...sanitized } = mtr;
        return setDoc(doc(db, 'meters', mtr.id), sanitized);
      })
    );

    await Promise.all(
      incidentsToLoad.map((inc) => setDoc(doc(db, 'incidents', inc.id), inc))
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'dataset_switch');
  }
}
