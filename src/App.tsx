/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useRef } from 'react';
import { Navbar } from './components/Navbar';
import { StatsOverview } from './components/StatsOverview';
import { SimulationBar } from './components/SimulationBar';
import { TopologyView } from './components/TopologyView';
import { MetersTable } from './components/MetersTable';
import { MeterDetailDrawer } from './components/MeterDetailDrawer';
import { IncidentDesk } from './components/IncidentDesk';
import { AddMeterModal } from './components/AddMeterModal';
import { WorkOrderModal } from './components/WorkOrderModal';
import { AuditReportModal } from './components/AuditReportModal';
import { XGBoostModelModal } from './components/XGBoostModelModal';
import { LoginPortal } from './components/LoginPortal';
import { UserDashboard } from './components/UserDashboard';
import { Meter, Incident, Transformer, AuthSession } from './types';
import {
  subscribeToMeters,
  subscribeToIncidents,
  subscribeToTransformers,
  seedInitialGridDataIfEmpty,
  resetGridToDefault,
  switchGridDataset,
  updateMeterSimulationReading,
  endFirebaseAuthSession,
  createFirebaseAuthSession,
} from './services/firestoreService';
import { testFirestoreConnection } from './firebase';
import { Loader2, AlertCircle } from 'lucide-react';

export default function App() {
  const [meters, setMeters] = useState<Meter[]>([]);
  const [transformers, setTransformers] = useState<Transformer[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [selectedMeter, setSelectedMeter] = useState<Meter | null>(null);

  // Active Authentication Session
  const [authSession, setAuthSession] = useState<AuthSession | null>(null);

  // Theme State ('light' | 'dark') persisted in localStorage
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      const saved = localStorage.getItem('voltwatch-theme');
      if (saved === 'dark' || saved === 'light') return saved;
    } catch {
      // ignore storage errors
    }
    return 'light';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      localStorage.setItem('voltwatch-theme', theme);
    } catch {
      // ignore storage errors
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  // App UI State
  const [activeTab, setActiveTab] = useState<'grid' | 'topology' | 'incidents'>('grid');
  const [statusFilter, setStatusFilter] = useState<'all' | 'theft' | 'overuse' | 'normal'>('all');
  const [currentDataset, setCurrentDataset] = useState<'default' | 'us_cities'>('us_cities');
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modals
  const [isAddMeterOpen, setIsAddMeterOpen] = useState(false);
  const [isAuditReportOpen, setIsAuditReportOpen] = useState(false);
  const [isXGBoostOpen, setIsXGBoostOpen] = useState(false);
  const [workOrderMeter, setWorkOrderMeter] = useState<Meter | null>(null);

  // Simulation controls
  const [isSimulating, setIsSimulating] = useState(false);
  const [simSpeed, setSimSpeed] = useState(1);
  const [simulationHour, setSimulationHour] = useState(18);

  useEffect(() => {
    let unsubscribeMeters: (() => void) | undefined;
    let unsubscribeIncidents: (() => void) | undefined;
    let unsubscribeTransformers: (() => void) | undefined;

    async function initialize() {
      try {
        await testFirestoreConnection();
        await seedInitialGridDataIfEmpty();

        unsubscribeMeters = subscribeToMeters(
          (liveMeters) => {
            setMeters(liveMeters);
            setIsLoading(false);

            if (liveMeters.length > 0) {
              const isUsDataset = liveMeters.some((m) => m.id.startsWith('US-'));
              setCurrentDataset(isUsDataset ? 'us_cities' : 'default');
            }

            setSelectedMeter((prev) => {
              if (!prev) return null;
              return liveMeters.find((m) => m.id === prev.id) || null;
            });
          },
          (err) => {
            console.error('Meters subscription error:', err);
            setErrorMessage(err.message);
          }
        );

        unsubscribeIncidents = subscribeToIncidents(
          (liveIncidents) => {
            setIncidents(liveIncidents);
          },
          (err) => console.error('Incidents subscription error:', err)
        );

        unsubscribeTransformers = subscribeToTransformers(
          (liveTx) => {
            setTransformers(liveTx);
          },
          (err) => console.error('Transformers subscription error:', err)
        );
      } catch (err) {
        console.error('Initialization error:', err);
        setErrorMessage(err instanceof Error ? err.message : 'Failed to connect to database');
        setIsLoading(false);
      }
    }

    initialize();

    return () => {
      if (unsubscribeMeters) unsubscribeMeters();
      if (unsubscribeIncidents) unsubscribeIncidents();
      if (unsubscribeTransformers) unsubscribeTransformers();
    };
  }, []);

  // Periodic simulation stream effect
  const simulationHourRef = useRef(simulationHour);
  simulationHourRef.current = simulationHour;
  const metersRef = useRef(meters);
  metersRef.current = meters;

  useEffect(() => {
    if (!isSimulating) return;

    const intervalMs = Math.max(800, 3000 / simSpeed);
    const timer = setInterval(() => {
      setSimulationHour((prev) => (prev + 1) % 24);

      const currentMeters = metersRef.current;
      if (currentMeters.length > 0) {
        const normalMeters = currentMeters.filter((m) => m.tamperState === 'none');
        if (normalMeters.length > 0) {
          const target = normalMeters[Math.floor(Math.random() * normalMeters.length)];
          const deltaP = Math.random() * 0.2 - 0.1;
          const deltaW = Math.random() * 2.0 - 1.0;
          const newP = Math.max(0.2, target.currentPowerKw + deltaP);
          const newW = Math.max(2.0, target.currentWaterLph + deltaW);

          updateMeterSimulationReading(target, {
            powerKw: newP,
            waterLph: newW,
            hourOfDay: (simulationHourRef.current + 1) % 24,
          }).catch(console.error);
        }
      }
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isSimulating, simSpeed]);

  const theftCount = meters.filter((m) => m.classification === 'theft').length;
  const overuseCount = meters.filter((m) => m.classification === 'overuse').length;

  const handleSelectMeterById = (meterId: string) => {
    const found = meters.find((m) => m.id === meterId);
    if (found) {
      setSelectedMeter(found);
      setActiveTab('grid');
    }
  };

  const handleResetGrid = async () => {
    setIsLoading(true);
    try {
      if (currentDataset === 'us_cities') {
        await switchGridDataset('us_cities');
      } else {
        await resetGridToDefault();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSwitchDataset = async (dataset: 'default' | 'us_cities') => {
    setIsLoading(true);
    setCurrentDataset(dataset);
    setSelectedMeter(null);
    try {
      await switchGridDataset(dataset);
    } catch (err) {
      console.error('Failed to switch dataset:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    setIsSimulating(false);
    await endFirebaseAuthSession(authSession);
    setAuthSession(null);
    setSelectedMeter(null);
  };

  const handleSwitchUserMeter = async (newMeter: Meter) => {
    if (authSession) {
      await endFirebaseAuthSession(authSession);
    }
    const newSession = await createFirebaseAuthSession({
      role: 'user',
      subjectId: newMeter.id,
      displayName: newMeter.consumerName,
      subtitle: `${newMeter.consumerAddress} · ${newMeter.transformerId}`,
      authMethod: 'consumer_meter',
    });
    setAuthSession(newSession);
  };

  // 1. Initial Login Gate: Ask user to sign in as Consumer User or Administrator
  if (!authSession) {
    return (
      <LoginPortal
        meters={meters}
        currentDataset={currentDataset}
        onSwitchDataset={handleSwitchDataset}
        onAuthenticated={(session) => setAuthSession(session)}
        theme={theme}
        onToggleTheme={toggleTheme}
        isLoadingData={isLoading}
      />
    );
  }

  // 2. Consumer User Interface
  if (authSession.role === 'user') {
    const userMeter = meters.find((m) => m.id === authSession.subjectId) || null;
    return (
      <UserDashboard
        session={authSession}
        meter={userMeter}
        allMeters={meters}
        transformers={transformers}
        incidents={incidents}
        onSwitchUserMeter={handleSwitchUserMeter}
        onSignOut={handleSignOut}
        theme={theme}
        onToggleTheme={toggleTheme}
      />
    );
  }

  // 3. Grid Administrator Interface
  return (
    <div id="top" className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-150">
      <Navbar
        onOpenAddMeter={() => setIsAddMeterOpen(true)}
        onResetGrid={handleResetGrid}
        onOpenAuditReport={() => setIsAuditReportOpen(true)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        theftCount={theftCount}
        overuseCount={overuseCount}
        currentDataset={currentDataset}
        onSwitchDataset={handleSwitchDataset}
        onOpenXGBoost={() => setIsXGBoostOpen(true)}
        theme={theme}
        onToggleTheme={toggleTheme}
        adminSession={authSession}
        onSignOut={handleSignOut}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-4 sm:py-6 pb-24 lg:pb-6">
        {errorMessage && (
          <div className="mb-5 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800/70 text-rose-800 dark:text-rose-200 flex items-center gap-3 text-xs">
            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
            <div>{errorMessage}</div>
          </div>
        )}

        <StatsOverview
          meters={meters}
          transformers={transformers}
          onFilterByStatus={(filter) => {
            setStatusFilter(filter);
            setActiveTab('grid');
          }}
          activeFilter={statusFilter}
        />

        <SimulationBar
          meters={meters}
          selectedMeter={selectedMeter}
          onSelectMeter={setSelectedMeter}
          isSimulating={isSimulating}
          setIsSimulating={setIsSimulating}
          simSpeed={simSpeed}
          setSimSpeed={setSimSpeed}
          simulationHour={simulationHour}
          setSimulationHour={setSimulationHour}
        />

        {isLoading ? (
          <div className="py-24 flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
            <Loader2 className="w-6 h-6 text-slate-900 dark:text-slate-100 animate-spin" />
            <span className="text-xs">Loading smart grid telemetry...</span>
          </div>
        ) : (
          <>
            {activeTab === 'grid' && (
              <MetersTable
                meters={meters}
                transformers={transformers}
                selectedMeter={selectedMeter}
                onSelectMeter={setSelectedMeter}
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
              />
            )}

            {activeTab === 'topology' && (
              <TopologyView
                meters={meters}
                transformers={transformers}
                selectedMeter={selectedMeter}
                onSelectMeter={setSelectedMeter}
              />
            )}

            {activeTab === 'incidents' && (
              <IncidentDesk
                incidents={incidents}
                onSelectMeterById={handleSelectMeterById}
              />
            )}
          </>
        )}
      </main>

      {selectedMeter && (
        <MeterDetailDrawer
          meter={selectedMeter}
          onClose={() => setSelectedMeter(null)}
          onDispatchWorkOrder={(m) => setWorkOrderMeter(m)}
          onMeterUpdated={(updated) => setSelectedMeter(updated)}
          simulationHour={simulationHour}
        />
      )}

      {isAddMeterOpen && (
        <AddMeterModal
          onClose={() => setIsAddMeterOpen(false)}
          existingCount={meters.length}
          transformers={transformers}
        />
      )}

      {workOrderMeter && (
        <WorkOrderModal
          meter={workOrderMeter}
          onClose={() => setWorkOrderMeter(null)}
        />
      )}

      {isAuditReportOpen && (
        <AuditReportModal
          meters={meters}
          incidents={incidents}
          transformers={transformers}
          onClose={() => setIsAuditReportOpen(false)}
        />
      )}

      <XGBoostModelModal
        isOpen={isXGBoostOpen}
        onClose={() => setIsXGBoostOpen(false)}
      />

      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 text-xs py-4 px-6 transition-colors duration-150">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            VoltWatch Admin Console · Signed in as <strong>{authSession.subjectId}</strong>
          </div>
          <div className="font-mono text-[11px] text-slate-400 dark:text-slate-500">
            Session: {authSession.id}
          </div>
        </div>
      </footer>
    </div>
  );
}
