import React, { useState } from 'react';
import { X, Send, CheckCircle2 } from 'lucide-react';
import { Meter } from '../types';

interface WorkOrderModalProps {
  meter: Meter | null;
  onClose: () => void;
}

export const WorkOrderModal: React.FC<WorkOrderModalProps> = ({ meter, onClose }) => {
  const [inspector, setInspector] = useState('Field Unit A-101');
  const [priority, setPriority] = useState('Urgent / Immediate Dispatch');
  const [instructions, setInstructions] = useState(
    'Inspect meter terminal seals, examine service drop for physical tap shunts, and verify occupant water meter flow rate.'
  );
  const [isDispatched, setIsDispatched] = useState(false);

  if (!meter) return null;

  const handleDispatch = (e: React.FormEvent) => {
    e.preventDefault();
    setIsDispatched(true);
    setTimeout(() => {
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-[1px]">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden flex flex-col max-h-[90vh] shadow-2xl">
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            Create Field Inspection Work Order
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[36px] min-w-[36px] p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {isDispatched ? (
          <div className="p-8 text-center space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 dark:text-emerald-400 mx-auto" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Work Order Dispatched</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Assigned to <strong>{inspector}</strong> for meter <strong className="font-mono">{meter.id}</strong>.
            </p>
          </div>
        ) : (
          <form onSubmit={handleDispatch} className="p-4 sm:p-5 space-y-4 text-xs overflow-y-auto flex-1">
            <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-lg border border-slate-200 dark:border-slate-800 space-y-1">
              <div className="flex justify-between font-medium text-slate-900 dark:text-white">
                <span>
                  <strong className="font-mono">{meter.id}</strong> — {meter.consumerName}
                </span>
                <span className="uppercase font-mono text-slate-600 dark:text-slate-400">{meter.classification}</span>
              </div>
              <div className="text-slate-500 dark:text-slate-400">
                {meter.consumerAddress} · {meter.transformerId}
              </div>
              <div className="text-slate-700 dark:text-slate-300 pt-1 flex flex-wrap gap-3 font-mono tabular-nums text-[11px]">
                <span>Power: {meter.currentPowerKw.toFixed(2)} kW</span>
                <span>Water: {meter.currentWaterLph.toFixed(1)} L/h</span>
                <span className="capitalize">Occupancy: {meter.occupancyStatus}</span>
              </div>
            </div>

            <div>
              <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Assigned Field Unit</label>
              <select
                value={inspector}
                onChange={(e) => setInspector(e.target.value)}
                className="w-full min-h-[44px] sm:min-h-0 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-base sm:text-xs text-slate-900 dark:text-white focus:outline-none focus:border-slate-900 dark:focus:border-slate-400"
              >
                <option value="Field Unit A-101">Field Unit A-101 (Revenue Protection)</option>
                <option value="Field Unit B-204">Field Unit B-204 (Substation Engineering)</option>
                <option value="Field Unit C-309">Field Unit C-309 (AMI Compliance)</option>
                <option value="Grid Audit Unit D-12">Grid Audit Unit D-12 (Senior Audit Team)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Priority Level</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full min-h-[44px] sm:min-h-0 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-base sm:text-xs text-slate-900 dark:text-white focus:outline-none focus:border-slate-900 dark:focus:border-slate-400"
              >
                <option value="Urgent / Immediate Dispatch">Urgent / Immediate Dispatch</option>
                <option value="High (Within 4 Hours)">High (Within 4 Hours)</option>
                <option value="Routine Inspection">Routine Inspection</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Inspection Notes</label>
              <textarea
                rows={3}
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-base sm:text-xs text-slate-900 dark:text-white focus:outline-none focus:border-slate-900 dark:focus:border-slate-400 leading-relaxed"
              />
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="min-h-[44px] px-4 py-2 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="min-h-[44px] px-5 py-2 rounded-lg font-semibold bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900 flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Dispatch Work Order</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
