import React, { useState } from 'react';
import { X } from 'lucide-react';
import { ConsumerType, Transformer } from '../types';
import { addCustomMeter } from '../services/firestoreService';

interface AddMeterModalProps {
  onClose: () => void;
  existingCount: number;
  transformers?: Transformer[];
}

export const AddMeterModal: React.FC<AddMeterModalProps> = ({
  onClose,
  existingCount,
  transformers = [],
}) => {
  const defaultFeeder = transformers[0]?.id || 'TX-ATX-01';
  const [meterId, setMeterId] = useState(`US-MTR-${200 + existingCount + 1}`);
  const [consumerName, setConsumerName] = useState('');
  const [consumerAddress, setConsumerAddress] = useState('');
  const [consumerType, setConsumerType] = useState<ConsumerType>('residential');
  const [transformerId, setTransformerId] = useState(defaultFeeder);
  const [sanctionedLoadKw, setSanctionedLoadKw] = useState(5.0);
  const [initialPowerKw, setInitialPowerKw] = useState(2.2);
  const [initialWaterLph, setInitialWaterLph] = useState(20.0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consumerName.trim()) {
      setErrorMsg('Consumer name is required');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    try {
      await addCustomMeter({
        id: meterId.trim(),
        consumerName: consumerName.trim(),
        consumerAddress: consumerAddress.trim() || 'Austin, TX',
        consumerType,
        transformerId,
        sanctionedLoadKw: Number(sanctionedLoadKw),
        currentPowerKw: Number(initialPowerKw),
        currentWaterLph: Number(initialWaterLph),
        voltageV: 240,
        powerFactor: 0.95,
        classification: 'normal',
        tamperState: 'none',
      });
      onClose();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to register meter');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-[1px]">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden flex flex-col">
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            Add New Smart Meter Node
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {errorMsg && (
            <div className="p-2.5 rounded bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200">
              {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Meter ID</label>
              <input
                type="text"
                value={meterId}
                onChange={(e) => setMeterId(e.target.value)}
                required
                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white font-mono focus:outline-none focus:border-slate-900 dark:focus:border-slate-400"
              />
            </div>
            <div>
              <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Substation Feeder</label>
              <select
                value={transformerId}
                onChange={(e) => setTransformerId(e.target.value)}
                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white font-mono focus:outline-none focus:border-slate-900 dark:focus:border-slate-400"
              >
                {transformers.length > 0 ? (
                  transformers.map((tx) => (
                    <option key={tx.id} value={tx.id}>
                      {tx.id} — {tx.name}
                    </option>
                  ))
                ) : (
                  <>
                    <option value="TX-ATX-01">TX-ATX-01 (Austin Mueller)</option>
                    <option value="TX-ATX-02">TX-ATX-02 (Austin East Travis)</option>
                    <option value="TX-SAN-01">TX-SAN-01 (San Diego)</option>
                    <option value="TX-BLD-01">TX-BLD-01 (Boulder)</option>
                    <option value="TX-CHI-01">TX-CHI-01 (Chicago)</option>
                    <option value="TX-ITH-01">TX-ITH-01 (Ithaca)</option>
                  </>
                )}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Consumer Name</label>
            <input
              type="text"
              placeholder="e.g., Michael & Elena Vance"
              value={consumerName}
              onChange={(e) => setConsumerName(e.target.value)}
              required
              className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-slate-900 dark:focus:border-slate-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Street Address &amp; City</label>
              <input
                type="text"
                placeholder="e.g., 2410 Aldrich St, Austin, TX"
                value={consumerAddress}
                onChange={(e) => setConsumerAddress(e.target.value)}
                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-slate-900 dark:focus:border-slate-400"
              />
            </div>
            <div>
              <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Tariff Class</label>
              <select
                value={consumerType}
                onChange={(e) => setConsumerType(e.target.value as ConsumerType)}
                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-slate-900 dark:focus:border-slate-400"
              >
                <option value="residential">Residential</option>
                <option value="commercial">Commercial</option>
                <option value="industrial">Industrial</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 font-mono">
            <div>
              <label className="block text-slate-600 dark:text-slate-400 mb-1 font-sans font-medium">Sanctioned (kW)</label>
              <input
                type="number"
                step="0.5"
                min="0.5"
                value={sanctionedLoadKw}
                onChange={(e) => setSanctionedLoadKw(parseFloat(e.target.value))}
                required
                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-slate-900 dark:focus:border-slate-400"
              />
            </div>
            <div>
              <label className="block text-slate-600 dark:text-slate-400 mb-1 font-sans font-medium">Power (kW)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={initialPowerKw}
                onChange={(e) => setInitialPowerKw(parseFloat(e.target.value))}
                required
                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-slate-900 dark:focus:border-slate-400"
              />
            </div>
            <div>
              <label className="block text-slate-600 dark:text-slate-400 mb-1 font-sans font-medium">Water (L/h)</label>
              <input
                type="number"
                step="1"
                min="0"
                value={initialWaterLph}
                onChange={(e) => setInitialWaterLph(parseFloat(e.target.value))}
                required
                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-slate-900 dark:focus:border-slate-400"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg font-semibold bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? 'Adding...' : 'Add Meter'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
