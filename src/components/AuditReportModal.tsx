import React from 'react';
import { X, Download, Printer } from 'lucide-react';
import { Meter, Incident, Transformer } from '../types';

interface AuditReportModalProps {
  meters: Meter[];
  incidents: Incident[];
  transformers: Transformer[];
  onClose: () => void;
}

export const AuditReportModal: React.FC<AuditReportModalProps> = ({
  meters,
  onClose,
}) => {
  const theftMeters = meters.filter((m) => m.classification === 'theft');
  const overuseMeters = meters.filter((m) => m.classification === 'overuse');
  const vacantMeters = meters.filter((m) => m.occupancyStatus === 'vacant');

  const handleExportCSV = () => {
    const headers = [
      'Meter ID',
      'Consumer Name',
      'Address',
      'Type',
      'Transformer',
      'Sanctioned kW',
      'Current Power kW',
      'Current Water L/h',
      'Occupancy Status',
      'Classification',
      'Theft Probability',
      'Overuse Probability',
      'Anomaly Reason'
    ];

    const rows = meters.map((m) => [
      m.id,
      `"${m.consumerName.replace(/"/g, '""')}"`,
      `"${m.consumerAddress.replace(/"/g, '""')}"`,
      m.consumerType,
      m.transformerId,
      m.sanctionedLoadKw,
      m.currentPowerKw,
      m.currentWaterLph,
      m.occupancyStatus,
      m.classification,
      m.theftProbability,
      m.overuseProbability,
      `"${m.anomalyReason.replace(/"/g, '""')}"`
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `voltwatch_grid_audit_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-[1px]">
      <div className="w-full max-w-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Multi-Source Grid Audit Report
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Generated {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-700 dark:text-slate-300 text-xs">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono tabular-nums">
            <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/40">
              <span className="text-slate-500 dark:text-slate-400 text-[11px] font-sans">Total Meters</span>
              <div className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">{meters.length}</div>
            </div>
            <div className="p-3 rounded-lg border border-rose-200 dark:border-rose-800 bg-rose-50/40 dark:bg-rose-950/40">
              <span className="text-rose-700 dark:text-rose-400 text-[11px] font-sans">Theft Cases</span>
              <div className="text-lg font-bold text-rose-700 dark:text-rose-400 mt-0.5">{theftMeters.length}</div>
            </div>
            <div className="p-3 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50/40 dark:bg-amber-950/40">
              <span className="text-amber-700 dark:text-amber-400 text-[11px] font-sans">Overuse Cases</span>
              <div className="text-lg font-bold text-amber-700 dark:text-amber-400 mt-0.5">{overuseMeters.length}</div>
            </div>
            <div className="p-3 rounded-lg border border-sky-200 dark:border-sky-800 bg-sky-50/40 dark:bg-sky-950/40">
              <span className="text-sky-700 dark:text-sky-400 text-[11px] font-sans">Vacant Verified</span>
              <div className="text-lg font-bold text-sky-700 dark:text-sky-400 mt-0.5">{vacantMeters.length}</div>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold text-slate-900 dark:text-white text-xs">
              Flagged Anomaly Meters
            </h3>
            <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-medium">
                    <th className="p-2.5">Meter ID</th>
                    <th className="p-2.5">Consumer</th>
                    <th className="p-2.5 text-right">Power</th>
                    <th className="p-2.5 text-right">Water</th>
                    <th className="p-2.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {theftMeters.concat(overuseMeters).length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-6 text-center text-slate-500 dark:text-slate-400">
                        No active violations detected.
                      </td>
                    </tr>
                  ) : (
                    theftMeters.concat(overuseMeters).map((m) => (
                      <tr key={m.id}>
                        <td className="p-2.5 font-mono font-semibold text-slate-900 dark:text-white">{m.id}</td>
                        <td className="p-2.5 text-slate-800 dark:text-slate-200">{m.consumerName}</td>
                        <td className="p-2.5 text-right font-mono tabular-nums">{m.currentPowerKw.toFixed(2)} kW</td>
                        <td className="p-2.5 text-right font-mono tabular-nums">{m.currentWaterLph.toFixed(1)} L/h</td>
                        <td className="p-2.5 capitalize font-semibold text-slate-800 dark:text-slate-200">{m.classification}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
          <button
            type="button"
            onClick={() => window.print()}
            className="px-3.5 py-2 rounded-lg text-xs font-medium bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print</span>
          </button>
          <button
            type="button"
            onClick={handleExportCSV}
            className="px-4 py-2 rounded-lg text-xs font-semibold bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Download CSV</span>
          </button>
        </div>
      </div>
    </div>
  );
};
