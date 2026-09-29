import React, { useState, useMemo } from 'react';
import {
  Egg,
  Plus,
  Search,
  Calendar,
  FileSpreadsheet,
  AlertCircle,
  X,
  Trash2,
  CheckCircle2,
} from 'lucide-react';
import { EggRecord, PoultryItem } from '../types';
import { calculateEggRemaining, formatDate, formatNumber } from '../utils/calculations';
import { exportEggsToExcel } from '../utils/excelExport';

interface EggProductionViewProps {
  eggs: EggRecord[];
  poultry: PoultryItem[];
  onAddEggRecord: (record: Omit<EggRecord, 'id' | 'created_at'>) => Promise<void>;
  onDeleteEggRecord: (id: string) => Promise<void>;
  isOpenAddDefault?: boolean;
}

export const EggProductionView: React.FC<EggProductionViewProps> = ({
  eggs,
  poultry,
  onAddEggRecord,
  onDeleteEggRecord,
  isOpenAddDefault = false,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(isOpenAddDefault);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form State
  const [formHenId, setFormHenId] = useState('');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formTotal, setFormTotal] = useState(20);
  const [formGood, setFormGood] = useState(18);
  const [formDamaged, setFormDamaged] = useState(2);
  const [formBrooding, setFormBrooding] = useState(6);
  const [formSold, setFormSold] = useState(10);
  const [formConsumed, setFormConsumed] = useState(1);
  const [formNotes, setFormNotes] = useState('');

  // Auto-calculated remaining for the current form input
  const liveFormRemaining = useMemo(() => {
    return calculateEggRemaining(
      formTotal,
      formBrooding,
      formSold,
      formConsumed,
      formDamaged
    );
  }, [formTotal, formBrooding, formSold, formConsumed, formDamaged]);

  // Aggregate Totals across all filtered egg records
  const filteredEggs = useMemo(() => {
    return eggs.filter((e) => {
      const matchSearch =
        e.hen_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (e.notes && e.notes.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchDate = !dateFilter || e.date === dateFilter;
      return matchSearch && matchDate;
    });
  }, [eggs, searchTerm, dateFilter]);

  const aggregates = useMemo(() => {
    return filteredEggs.reduce(
      (acc, r) => ({
        totalCollected: acc.totalCollected + Number(r.total_eggs),
        goodEggs: acc.goodEggs + Number(r.good_eggs),
        damagedEggs: acc.damagedEggs + Number(r.damaged_eggs),
        broodingEggs: acc.broodingEggs + Number(r.eggs_brooding),
        soldEggs: acc.soldEggs + Number(r.eggs_sold),
        consumedEggs: acc.consumedEggs + Number(r.eggs_consumed),
        remainingEggs: acc.remainingEggs + Number(r.eggs_remaining),
      }),
      {
        totalCollected: 0,
        goodEggs: 0,
        damagedEggs: 0,
        broodingEggs: 0,
        soldEggs: 0,
        consumedEggs: 0,
        remainingEggs: 0,
      }
    );
  }, [filteredEggs]);

  const handleOpenAdd = () => {
    const activeLayingFlock = poultry.find((p) => p.current_status === 'Laying' || p.type === 'Hen');
    setFormHenId(activeLayingFlock ? activeLayingFlock.poultry_id : 'KGP-H101');
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormTotal(20);
    setFormGood(18);
    setFormDamaged(2);
    setFormBrooding(6);
    setFormSold(8);
    setFormConsumed(2);
    setFormNotes('');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formHenId.trim()) {
      setFormError('Hen ID / Flock reference is required.');
      return;
    }
    if (formTotal < 0) {
      setFormError('Total eggs cannot be negative.');
      return;
    }

    const calculatedRemaining = calculateEggRemaining(
      formTotal,
      formBrooding,
      formSold,
      formConsumed,
      formDamaged
    );

    const totalAllocated = Number(formBrooding) + Number(formSold) + Number(formConsumed) + Number(formDamaged);
    if (totalAllocated > formTotal) {
      setFormError(
        `Allocated eggs (Brooding ${formBrooding} + Sold ${formSold} + Consumed ${formConsumed} + Damaged ${formDamaged} = ${totalAllocated}) cannot exceed total eggs collected (${formTotal}).`
      );
      return;
    }

    try {
      setIsSubmitting(true);
      await onAddEggRecord({
        hen_id: formHenId.trim(),
        date: formDate,
        total_eggs: Number(formTotal),
        good_eggs: Number(formGood),
        damaged_eggs: Number(formDamaged),
        eggs_brooding: Number(formBrooding),
        eggs_sold: Number(formSold),
        eggs_consumed: Number(formConsumed),
        eggs_remaining: calculatedRemaining,
        notes: formNotes.trim(),
      });
      setIsModalOpen(false);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Failed to record eggs.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-slate-900">Egg Production & Allocation</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-900">
              {filteredEggs.length} Daily Records
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Track daily lay, good/damaged quality, incubation selection, sales, consumption, and store balance.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => exportEggsToExcel(filteredEggs)}
            className="inline-flex items-center px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 mr-1.5 text-amber-600" />
            Export Excel
          </button>
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center px-4 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-md shadow-amber-600/20 transition-all"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Record Egg Collection
          </button>
        </div>
      </div>

      {/* Aggregate KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500">Total Collected</span>
          <div className="text-lg font-black text-slate-900 mt-1">{formatNumber(aggregates.totalCollected)}</div>
          <span className="text-[10px] text-slate-400">100% of collection</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-emerald-700">Good Eggs</span>
          <div className="text-lg font-black text-emerald-800 mt-1">{formatNumber(aggregates.goodEggs)}</div>
          <span className="text-[10px] text-emerald-600">Prime quality</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-rose-700">Damaged / Broken</span>
          <div className="text-lg font-black text-rose-800 mt-1">{formatNumber(aggregates.damagedEggs)}</div>
          <span className="text-[10px] text-rose-600">Loss / rejects</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-indigo-700">For Brooding</span>
          <div className="text-lg font-black text-indigo-800 mt-1">{formatNumber(aggregates.broodingEggs)}</div>
          <span className="text-[10px] text-indigo-600">To incubation</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-blue-700">Eggs Sold</span>
          <div className="text-lg font-black text-blue-800 mt-1">{formatNumber(aggregates.soldEggs)}</div>
          <span className="text-[10px] text-blue-600">Commercial revenue</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-600">Farm Consumed</span>
          <div className="text-lg font-black text-slate-800 mt-1">{formatNumber(aggregates.consumedEggs)}</div>
          <span className="text-[10px] text-slate-400">Staff / family</span>
        </div>

        <div className="bg-gradient-to-br from-amber-500 to-amber-600 text-white p-3.5 rounded-xl shadow-xs col-span-2 sm:col-span-1">
          <span className="text-[11px] font-bold text-amber-100">Remaining Store</span>
          <div className="text-lg font-black mt-1">{formatNumber(aggregates.remainingEggs)}</div>
          <span className="text-[10px] text-amber-200">Balance in storage</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search Hen ID or notes..."
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50"
          />
        </div>
        <div className="flex items-center space-x-2">
          <Calendar className="w-4 h-4 text-slate-400" />
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="text-xs rounded-xl border border-slate-200 px-3 py-2 bg-white text-slate-700"
          />
          {dateFilter && (
            <button
              onClick={() => setDateFilter('')}
              className="text-xs text-rose-600 hover:underline"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-3">Hen / Batch ID</th>
                <th className="py-3 px-3 text-right">Collected</th>
                <th className="py-3 px-3 text-right">Good</th>
                <th className="py-3 px-3 text-right">Damaged</th>
                <th className="py-3 px-3 text-right">Brooding</th>
                <th className="py-3 px-3 text-right">Sold</th>
                <th className="py-3 px-3 text-right">Consumed</th>
                <th className="py-3 px-3 text-right font-extrabold text-amber-800">Remaining</th>
                <th className="py-3 px-4">Notes</th>
                <th className="py-3 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {filteredEggs.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-8 text-center text-slate-400">
                    No egg records recorded yet. Click "Record Egg Collection" to start.
                  </td>
                </tr>
              ) : (
                filteredEggs.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-900">{formatDate(rec.date)}</td>
                    <td className="py-3 px-3 font-bold text-slate-800">{rec.hen_id}</td>
                    <td className="py-3 px-3 text-right font-extrabold text-slate-900">
                      {formatNumber(rec.total_eggs)}
                    </td>
                    <td className="py-3 px-3 text-right text-emerald-700 font-semibold">
                      {formatNumber(rec.good_eggs)}
                    </td>
                    <td className="py-3 px-3 text-right text-rose-600 font-semibold">
                      {formatNumber(rec.damaged_eggs)}
                    </td>
                    <td className="py-3 px-3 text-right text-indigo-700 font-semibold">
                      {formatNumber(rec.eggs_brooding)}
                    </td>
                    <td className="py-3 px-3 text-right text-blue-700 font-semibold">
                      {formatNumber(rec.eggs_sold)}
                    </td>
                    <td className="py-3 px-3 text-right text-slate-600 font-semibold">
                      {formatNumber(rec.eggs_consumed)}
                    </td>
                    <td className="py-3 px-3 text-right font-black text-amber-800 bg-amber-50/50">
                      {formatNumber(rec.eggs_remaining)}
                    </td>
                    <td className="py-3 px-4 text-slate-500 max-w-xs truncate">{rec.notes || '-'}</td>
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => onDeleteEggRecord(rec.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                        title="Delete Egg Record"
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

      {/* Record Egg Collection Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
            <div className="bg-amber-600 text-white px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold">Record Egg Collection</h2>
                <p className="text-xs text-amber-100">
                  Automatic balance: Collected - (Brooding + Sold + Consumed + Damaged)
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-amber-100 hover:text-white p-1 rounded-lg"
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Hen ID / Pen Batch *
                  </label>
                  <input
                    type="text"
                    required
                    value={formHenId}
                    onChange={(e) => setFormHenId(e.target.value)}
                    placeholder="e.g. KGP-H101"
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Collection Date *</label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Total collected */}
              <div className="bg-amber-50/70 p-3.5 rounded-xl border border-amber-200">
                <label className="block text-xs font-black text-amber-950 mb-1">
                  Total Eggs Collected Today *
                </label>
                <input
                  type="number"
                  min={0}
                  required
                  value={formTotal}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setFormTotal(val);
                    setFormGood(Math.max(0, val - formDamaged));
                  }}
                  className="w-full text-sm font-black text-amber-950 px-3 py-2 rounded-xl border border-amber-300 bg-white focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Allocations breakdown */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block font-semibold text-emerald-700 mb-1">Good Eggs</label>
                  <input
                    type="number"
                    min={0}
                    value={formGood}
                    onChange={(e) => setFormGood(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-rose-700 mb-1">Damaged Eggs</label>
                  <input
                    type="number"
                    min={0}
                    value={formDamaged}
                    onChange={(e) => setFormDamaged(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-indigo-700 mb-1">To Brooding</label>
                  <input
                    type="number"
                    min={0}
                    value={formBrooding}
                    onChange={(e) => setFormBrooding(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-blue-700 mb-1">Eggs Sold</label>
                  <input
                    type="number"
                    min={0}
                    value={formSold}
                    onChange={(e) => setFormSold(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Consumed</label>
                  <input
                    type="number"
                    min={0}
                    value={formConsumed}
                    onChange={(e) => setFormConsumed(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-bold text-amber-800 mb-1">Auto Remaining</label>
                  <div className="px-2.5 py-1.5 rounded-lg bg-amber-100/70 border border-amber-300 font-black text-amber-900 text-center">
                    {liveFormRemaining} eggs
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Notes</label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="e.g. Morning tray, pen clean, high shell thickness."
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
                  className="px-5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-md transition-all disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Save Egg Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
