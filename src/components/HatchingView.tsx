import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  X,
  Bird,
  Trash2,
  Percent,
} from 'lucide-react';
import { HatchRecord, BroodingRecord, PoultryItem } from '../types';
import { calculateHatchRate, formatDate, formatNumber } from '../utils/calculations';
import { exportHatchToExcel } from '../utils/excelExport';

interface HatchingViewProps {
  hatch: HatchRecord[];
  brooding: BroodingRecord[];
  onAddHatchRecord: (record: Omit<HatchRecord, 'id' | 'created_at'>, addToInventory: boolean) => Promise<{ hatch: HatchRecord; createdPoultry?: PoultryItem }>;
  onDeleteHatchRecord: (id: string) => Promise<void>;
  preselectedBrooding?: BroodingRecord | null;
  onClearPreselectedBrooding?: () => void;
  isOpenAddDefault?: boolean;
}

export const HatchingView: React.FC<HatchingViewProps> = ({
  hatch,
  brooding,
  onAddHatchRecord,
  onDeleteHatchRecord,
  preselectedBrooding,
  onClearPreselectedBrooding,
  isOpenAddDefault = false,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(isOpenAddDefault || Boolean(preselectedBrooding));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Form State
  const [selectedBroodingId, setSelectedBroodingId] = useState(preselectedBrooding?.id || '');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formEggsPlaced, setFormEggsPlaced] = useState(preselectedBrooding?.eggs_placed || 20);
  const [formEggsHatched, setFormEggsHatched] = useState(16);
  const [formEggsFailed, setFormEggsFailed] = useState(4);
  const [formMortality, setFormMortality] = useState(0);
  const [formAddToInventory, setFormAddToInventory] = useState(true);
  const [formNotes, setFormNotes] = useState('');

  // Active brooding record selected in form
  const currentBrooding = useMemo(() => {
    return brooding.find((b) => b.id === selectedBroodingId) || preselectedBrooding;
  }, [brooding, selectedBroodingId, preselectedBrooding]);

  // Live calculation of Hatch Rate
  const liveHatchRate = useMemo(() => {
    return calculateHatchRate(formEggsHatched, formEggsPlaced);
  }, [formEggsHatched, formEggsPlaced]);

  // Live calculation of healthy chicks produced
  const liveChicksProduced = useMemo(() => {
    return Math.max(0, formEggsHatched - formMortality);
  }, [formEggsHatched, formMortality]);

  const handleOpenAdd = (brd?: BroodingRecord) => {
    if (brd) {
      setSelectedBroodingId(brd.id);
      setFormEggsPlaced(brd.eggs_placed);
    } else {
      const activeBrd = brooding.find((b) => b.status !== 'Hatched' && b.status !== 'Failed');
      setSelectedBroodingId(activeBrd?.id || '');
      setFormEggsPlaced(activeBrd?.eggs_placed || 20);
    }
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormEggsHatched(16);
    setFormEggsFailed(4);
    setFormMortality(0);
    setFormAddToInventory(true);
    setFormNotes('');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (formEggsPlaced <= 0) {
      setFormError('Eggs placed must be greater than zero.');
      return;
    }
    if (formEggsHatched > formEggsPlaced) {
      setFormError(`Eggs hatched (${formEggsHatched}) cannot exceed eggs placed (${formEggsPlaced}).`);
      return;
    }
    if (formEggsHatched + formEggsFailed > formEggsPlaced) {
      setFormError(
        `Total (Hatched ${formEggsHatched} + Failed ${formEggsFailed} = ${
          formEggsHatched + formEggsFailed
        }) cannot exceed eggs placed (${formEggsPlaced}).`
      );
      return;
    }
    if (formMortality > formEggsHatched) {
      setFormError('Mortality cannot exceed hatched count.');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await onAddHatchRecord(
        {
          brooding_id: selectedBroodingId,
          brooding_code: currentBrooding?.brooding_code || 'DIRECT-HATCH',
          poultry_type: currentBrooding?.poultry_type || 'Hen',
          breed: currentBrooding?.breed || 'Improved Kienyeji',
          date: formDate,
          eggs_placed: Number(formEggsPlaced),
          eggs_hatched: Number(formEggsHatched),
          eggs_failed: Number(formEggsFailed),
          chicks_produced: liveChicksProduced,
          hatch_rate: liveHatchRate,
          mortality_count: Number(formMortality),
          added_to_inventory: formAddToInventory,
          notes: formNotes.trim(),
        },
        formAddToInventory
      );

      setIsModalOpen(false);
      if (onClearPreselectedBrooding) onClearPreselectedBrooding();

      if (res.createdPoultry) {
        setSuccessNotice(
          `Success! Recorded hatch with ${liveHatchRate}% hatch rate. Automatically added ${res.createdPoultry.quantity} ${res.createdPoultry.type}s to Poultry Inventory as ID: ${res.createdPoultry.poultry_id}.`
        );
      } else {
        setSuccessNotice(`Success! Recorded hatch results with ${liveHatchRate}% hatch rate.`);
      }
      setTimeout(() => setSuccessNotice(null), 8000);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Error recording hatch results.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredHatch = useMemo(() => {
    return hatch.filter((h) => {
      const matchSearch =
        (h.brooding_code && h.brooding_code.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (h.breed && h.breed.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (h.inventory_poultry_id && h.inventory_poultry_id.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (h.notes && h.notes.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchSearch;
    });
  }, [hatch, searchTerm]);

  // Aggregates
  const totalHatchedChicks = hatch.reduce((acc, h) => acc + Number(h.chicks_produced), 0);
  const totalPlaced = hatch.reduce((acc, h) => acc + Number(h.eggs_placed), 0);
  const avgHatchRate = totalPlaced > 0 ? Math.round((totalHatchedChicks / totalPlaced) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-slate-900">Hatching Results & Recruitment</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-900">
              {filteredHatch.length} Hatch Records
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Calculate exact hatch rates (Hatched ÷ Placed × 100) and automatically recruit chicks into live inventory.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => exportHatchToExcel(filteredHatch)}
            className="inline-flex items-center px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 mr-1.5 text-emerald-600" />
            Export Excel
          </button>
          <button
            onClick={() => handleOpenAdd()}
            className="inline-flex items-center px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 transition-all"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Record Hatch Result
          </button>
        </div>
      </div>

      {/* Success Notice if just recruited to inventory */}
      {successNotice && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-900 text-xs flex items-center justify-between shadow-xs">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="font-semibold">{successNotice}</span>
          </div>
          <button onClick={() => setSuccessNotice(null)} className="text-emerald-700 hover:text-emerald-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gradient-to-r from-emerald-900 to-teal-950 text-white p-4 rounded-xl shadow-xs">
          <span className="text-xs font-medium text-emerald-300">Total Chicks & Ducklings Produced</span>
          <div className="text-2xl font-black mt-1 text-emerald-100">{formatNumber(totalHatchedChicks)} Birds</div>
          <span className="text-[10px] text-emerald-400">Successfully recruited</span>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs">
          <span className="text-xs font-medium text-slate-500">Overall Farm Hatch Rate</span>
          <div className="text-2xl font-black mt-1 text-slate-900">{avgHatchRate}%</div>
          <span className="text-[10px] text-emerald-600 font-semibold">
            {avgHatchRate >= 75 ? 'Optimal fertility & brooding' : 'Needs humidity/temp calibration'}
          </span>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs">
          <span className="text-xs font-medium text-slate-500">Total Eggs Incubated</span>
          <div className="text-2xl font-black mt-1 text-slate-900">{formatNumber(totalPlaced)} Eggs</div>
          <span className="text-[10px] text-slate-400">All historical hatch batches</span>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search brooding code, breed, inventory bird ID..."
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-4">Hatch Date</th>
                <th className="py-3 px-3">Brooding Ref</th>
                <th className="py-3 px-3">Species & Breed</th>
                <th className="py-3 px-3 text-right">Placed</th>
                <th className="py-3 px-3 text-right">Hatched</th>
                <th className="py-3 px-3 text-right">Failed</th>
                <th className="py-3 px-3 text-right">Mortality</th>
                <th className="py-3 px-3 text-right font-extrabold text-emerald-800">Chicks</th>
                <th className="py-3 px-3 text-right">Hatch Rate</th>
                <th className="py-3 px-3">Inventory Link</th>
                <th className="py-3 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {filteredHatch.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-8 text-center text-slate-400">
                    No hatch results recorded yet.
                  </td>
                </tr>
              ) : (
                filteredHatch.map((h) => (
                  <tr key={h.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-900">{formatDate(h.date)}</td>
                    <td className="py-3 px-3 font-bold text-indigo-900">{h.brooding_code || '-'}</td>
                    <td className="py-3 px-3">
                      <span className="font-semibold text-slate-800">
                        {h.poultry_type === 'Duck' ? '🦆 Duck' : '🐔 Hen'}
                      </span>{' '}
                      • {h.breed || '-'}
                    </td>
                    <td className="py-3 px-3 text-right font-medium">{h.eggs_placed}</td>
                    <td className="py-3 px-3 text-right text-emerald-700 font-bold">{h.eggs_hatched}</td>
                    <td className="py-3 px-3 text-right text-rose-600 font-medium">{h.eggs_failed}</td>
                    <td className="py-3 px-3 text-right text-slate-500">{h.mortality_count}</td>
                    <td className="py-3 px-3 text-right font-black text-emerald-800 bg-emerald-50/50">
                      {h.chicks_produced}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full font-bold text-[10px] ${
                          h.hatch_rate >= 80
                            ? 'bg-emerald-100 text-emerald-800'
                            : h.hatch_rate >= 60
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {h.hatch_rate}%
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      {h.inventory_poultry_id ? (
                        <span className="inline-flex items-center space-x-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                          <Bird className="w-3 h-3" />
                          <span>{h.inventory_poultry_id}</span>
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">Not added</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => onDeleteHatchRecord(h.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                        title="Delete Hatch Record"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Hatch Result Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
            <div className="bg-emerald-700 text-white px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold">Record Hatching Outcome</h2>
                <p className="text-xs text-emerald-100">
                  Automatic Hatch Rate calculation & flock recruitment
                </p>
              </div>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  if (onClearPreselectedBrooding) onClearPreselectedBrooding();
                }}
                className="text-emerald-100 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center">
                  <AlertCircle className="w-4 h-4 mr-2 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Brooding batch select */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Select Brooding Batch *
                </label>
                <select
                  value={selectedBroodingId}
                  onChange={(e) => {
                    const bId = e.target.value;
                    setSelectedBroodingId(bId);
                    const b = brooding.find((x) => x.id === bId);
                    if (b) {
                      setFormEggsPlaced(b.eggs_placed);
                    }
                  }}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 font-semibold"
                >
                  <option value="">-- Direct Hatch / Independent Incubator --</option>
                  {brooding.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.brooding_code} ({b.poultry_type} • {b.eggs_placed} eggs • Expected: {formatDate(b.expected_hatch_date)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Hatch Date *</label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Eggs Placed *</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={formEggsPlaced}
                    onChange={(e) => setFormEggsPlaced(Number(e.target.value))}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-emerald-800 mb-1">
                    Eggs Hatched Successfully *
                  </label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={formEggsHatched}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setFormEggsHatched(val);
                      setFormEggsFailed(Math.max(0, formEggsPlaced - val));
                    }}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-emerald-300 bg-emerald-50/30 font-black text-emerald-950"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-rose-700 mb-1">Eggs Failed / Infertile *</label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={formEggsFailed}
                    onChange={(e) => setFormEggsFailed(Number(e.target.value))}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Day-1 Mortality</label>
                  <input
                    type="number"
                    min={0}
                    value={formMortality}
                    onChange={(e) => setFormMortality(Number(e.target.value))}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>

                {/* AUTOMATIC HATCH RATE DISPLAY */}
                <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
                  <span className="block text-[11px] font-bold text-emerald-800">
                    Automatic Hatch Rate:
                  </span>
                  <div className="text-xl font-black text-emerald-900 mt-0.5">
                    {liveHatchRate}%
                  </div>
                  <span className="text-[9px] text-emerald-700">
                    ({formEggsHatched} hatched ÷ {formEggsPlaced} placed)
                  </span>
                </div>
              </div>

              {/* AUTOMATIC INVENTORY RECRUITMENT TOGGLE */}
              <div className="p-3.5 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl space-y-2">
                <label className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formAddToInventory}
                    onChange={(e) => setFormAddToInventory(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-emerald-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <div>
                    <span className="text-xs font-extrabold text-slate-900 block">
                      Automatically add {liveChicksProduced} healthy chicks to Poultry Inventory
                    </span>
                    <span className="text-[11px] text-slate-500 block">
                      Creates a registered flock record under status "Growing" with source "Hatched on farm", preventing manual re-entry errors.
                    </span>
                  </div>
                </label>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Notes</label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="e.g. Vigorous active chicks, placed under brooding heat lamp."
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md transition-all disabled:opacity-50"
                >
                  {isSubmitting ? 'Recording Hatch...' : 'Save Hatch Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
