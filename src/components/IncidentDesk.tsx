import React, { useState } from 'react';
import { Incident, IncidentStatus } from '../types';
import { ExternalLink } from 'lucide-react';
import { updateIncident } from '../services/firestoreService';

interface IncidentDeskProps {
  incidents: Incident[];
  onSelectMeterById: (meterId: string) => void;
}

export const IncidentDesk: React.FC<IncidentDeskProps> = ({
  incidents,
  onSelectMeterById,
}) => {
  const [statusFilter, setStatusFilter] = useState<'all' | IncidentStatus>('all');

  const filteredIncidents = incidents.filter((inc) => {
    if (statusFilter !== 'all' && inc.status !== statusFilter) return false;
    return true;
  });

  const handleUpdateStatus = async (incidentId: string, newStatus: IncidentStatus) => {
    await updateIncident(incidentId, { status: newStatus });
  };

  const handleAssignInspector = async (incidentId: string, inspector: string) => {
    await updateIncident(incidentId, { inspectorAssigned: inspector });
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden mb-6 transition-colors duration-150">
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            Active Anomaly Incidents &amp; Field Dispatch
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Automated multi-source anomaly alerts and revenue protection work orders.
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs">
          {(['all', 'investigating', 'confirmed', 'resolved'] as const).map((st) => {
            const count =
              st === 'all'
                ? incidents.length
                : incidents.filter((i) => i.status === st).length;
            const isActive = statusFilter === st;
            return (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 rounded-md text-xs font-medium capitalize transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-semibold shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {st} ({count})
              </button>
            );
          })}
        </div>
      </div>

      <div className="divide-y divide-slate-200 dark:divide-slate-800">
        {filteredIncidents.length === 0 ? (
          <div className="py-12 text-center text-slate-500 dark:text-slate-400 text-xs">
            No incidents found in this status category.
          </div>
        ) : (
          filteredIncidents.map((inc) => {
            const isTheft = inc.type === 'theft';

            return (
              <div
                key={inc.id}
                className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
              >
                <div className="space-y-1 flex-1">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="font-mono font-semibold text-slate-900 dark:text-white">{inc.id}</span>
                    <span className="text-slate-300 dark:text-slate-700">·</span>
                    <button
                      type="button"
                      onClick={() => onSelectMeterById(inc.meterId)}
                      className="font-mono font-semibold text-sky-700 dark:text-sky-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
                    >
                      {inc.meterId}
                      <ExternalLink className="w-3 h-3" />
                    </button>
                    <span className="text-slate-300 dark:text-slate-700">·</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{inc.consumerName}</span>
                    <span className="text-slate-300 dark:text-slate-700">·</span>
                    <span
                      className={`font-semibold uppercase ${
                        isTheft ? 'text-rose-700 dark:text-rose-400' : 'text-amber-700 dark:text-amber-400'
                      }`}
                    >
                      {inc.type}
                    </span>
                    <span className="text-slate-300 dark:text-slate-700">·</span>
                    <span className="capitalize text-slate-600 dark:text-slate-400 font-medium">{inc.status}</span>
                  </div>

                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed max-w-3xl">
                    {inc.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 font-mono tabular-nums pt-0.5">
                    <span>{new Date(inc.timestamp).toLocaleString()}</span>
                    <span>·</span>
                    <span>Power: {inc.powerKw?.toFixed(2)} kW</span>
                    <span>·</span>
                    <span>Water: {inc.waterLph?.toFixed(1)} L/h</span>
                    {inc.actionNotes && (
                      <>
                        <span>·</span>
                        <span className="font-sans text-slate-600 dark:text-slate-400">{inc.actionNotes}</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  {inc.status === 'investigating' && (
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus(inc.id, 'confirmed')}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 dark:hover:bg-amber-900/60 border border-amber-200 dark:border-amber-800/70 text-amber-800 dark:text-amber-200 transition-colors cursor-pointer"
                    >
                      Confirm
                    </button>
                  )}
                  {inc.status !== 'resolved' && (
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus(inc.id, 'resolved')}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800/70 text-emerald-800 dark:text-emerald-200 transition-colors cursor-pointer"
                    >
                      Resolve
                    </button>
                  )}

                  <select
                    value={inc.inspectorAssigned || 'Field Unit A-101'}
                    onChange={(e) => handleAssignInspector(inc.id, e.target.value)}
                    className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:border-slate-900 dark:focus:border-slate-400 cursor-pointer"
                  >
                    <option value="Field Unit A-101">Field Unit A-101</option>
                    <option value="Field Unit B-204">Field Unit B-204</option>
                    <option value="Field Unit C-309">Field Unit C-309</option>
                    <option value="Grid Audit Unit D-12">Grid Audit Unit D-12</option>
                  </select>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
