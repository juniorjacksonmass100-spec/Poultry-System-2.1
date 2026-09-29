import React, { useState, useMemo } from 'react';
import {
  Clock,
  Plus,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Sparkles,
  FileSpreadsheet,
  X,
  Trash2,
  ArrowRight,
} from 'lucide-react';
import { BroodingRecord, BroodingPoultryType, BroodingStatus, PoultryItem } from '../types';
import {
  calculateExpectedHatchDate,
  getBroodingStatusAndCountdown,
  formatDate,
  formatNumber,
  HEN_INCUBATION_DAYS,
  DUCK_INCUBATION_DAYS,
} from '../utils/calculations';
import { exportBroodingToExcel } from '../utils/excelExport';

interface BroodingViewProps {
  brooding: BroodingRecord[];
  poultry: PoultryItem[];
  onAddBrooding: (record: Omit<BroodingRecord, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  onUpdateBrooding: (id: string, updates: Partial<BroodingRecord>) => Promise<void>;
  onDeleteBrooding: (id: string) => Promise<void>;
  onOpenRecordHatchModal: (brooding: BroodingRecord) => void;
  isOpenAddDefault?: boolean;
}

export const BroodingView: React.FC<BroodingViewProps> = ({
  brooding,
  poultry,
  onAddBrooding,
  onUpdateBrooding,
  onDeleteBrooding,
  onOpenRecordHatchModal,
  isOpenAddDefault = false,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'All' | 'Hen' | 'Duck'>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [isModalOpen, setIsModalOpen] = useState(isOpenAddDefault);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form State
  const [formCode, setFormCode] = useState('');
  const [formParentId, setFormParentId] = useState('');
  const [formPoultryType, setFormPoultryType] = useState<BroodingPoultryType>('Hen');
  const [formBreed, setFormBreed] = useState('Improved Kienyeji');
  const [formEggsPlaced, setFormEggsPlaced] = useState(15);
  const [formStartDate, setFormStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [formNotes, setFormNotes] = useState('');

  // Live calculation of expected hatch date as user changes form
  const liveExpectedHatchDate = useMemo(() => {
    return calculateExpectedHatchDate(formStartDate, formPoultryType);
  }, [formStartDate, formPoultryType]);

  const handleOpenAdd = (defaultType: BroodingPoultryType = 'Hen') => {
    setFormPoultryType(defaultType);
    const codeNum = Math.floor(100 + Math.random() * 900);
    setFormCode(`BRD-${defaultType === 'Hen' ? 'H' : 'DK'}-${new Date().getFullYear()}-${codeNum}`);

    const parent = poultry.find((p) => (defaultType === 'Hen' ? p.type === 'Hen' : p.type === 'Duck'));
    setFormParentId(parent ? parent.poultry_id : defaultType === 'Hen' ? 'KGP-H101' : 'KGP-D103');
    setFormBreed(defaultType === 'Hen' ? 'Improved Kienyeji' : 'Improved Duck');
    setFormEggsPlaced(defaultType === 'Hen' ? 15 : 20);
    setFormStartDate(new Date().toISOString().split('T')[0]);
    setFormNotes('');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formCode.trim()) {
      setFormError('Brooding ID is required.');
      return;
    }
    if (!formParentId.trim()) {
      setFormError('Parent poultry / incubator reference is required.');
      return;
    }
    if (formEggsPlaced <= 0) {
      setFormError('Number of eggs placed must be greater than zero.');
      return;
    }

    const expectedDate = calculateExpectedHatchDate(formStartDate, formPoultryType);
    const { status } = getBroodingStatusAndCountdown(formStartDate, expectedDate);

    try {
      setIsSubmitting(true);
      await onAddBrooding({
        brooding_code: formCode.trim(),
        parent_poultry_id: formParentId.trim(),
        poultry_type: formPoultryType,
        breed: formBreed,
        eggs_placed: Number(formEggsPlaced),
        start_date: formStartDate,
        expected_hatch_date: expectedDate,
        status,
        notes: formNotes.trim(),
      });
      setIsModalOpen(false);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Failed to save brooding record.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered List
  const filteredBrooding = useMemo(() => {
    return brooding.filter((b) => {
      const matchSearch =
        b.brooding_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.parent_poultry_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.breed.toLowerCase().includes(searchTerm.toLowerCase());

      const matchType = typeFilter === 'All' || b.poultry_type === typeFilter;
      const matchStatus = statusFilter === 'All' || b.status === statusFilter;

      return matchSearch && matchType && matchStatus;
    });
  }, [brooding, searchTerm, typeFilter, statusFilter]);

  // Aggregate statistics
  const henBroodings = brooding.filter((b) => b.poultry_type === 'Hen');
  const duckBroodings = brooding.filter((b) => b.poultry_type === 'Duck');
  const activeEggs = brooding
    .filter((b) => b.status !== 'Hatched' && b.status !== 'Failed' && b.status !== 'Completed')
    .reduce((acc, b) => acc + Number(b.eggs_placed), 0);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-slate-900">Brooding & Incubation Schedules</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-900">
              {filteredBrooding.length} Batches
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Strict biological schedules: <strong className="text-indigo-700">Hens = 21 Days</strong> and{' '}
            <strong className="text-teal-700">Ducks = 40 Days</strong>. Real-time countdown & status calculation.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => exportBroodingToExcel(filteredBrooding)}
            className="inline-flex items-center px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 mr-1.5 text-indigo-600" />
            Export Excel
          </button>
          <button
            onClick={() => handleOpenAdd('Hen')}
            className="inline-flex items-center px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 transition-all"
          >
            <Plus className="w-4 h-4 mr-1" />
            + Hen Brooding (21d)
          </button>
          <button
            onClick={() => handleOpenAdd('Duck')}
            className="inline-flex items-center px-3.5 py-2 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white shadow-md shadow-teal-600/20 transition-all"
          >
            <Plus className="w-4 h-4 mr-1" />
            + Duck Brooding (40d)
          </button>
        </div>
      </div>

      {/* Incubation Rules Educational Banner */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Hen Rule */}
        <div className="bg-gradient-to-r from-indigo-900 to-indigo-950 text-white p-4 rounded-xl border border-indigo-800 shadow-xs flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-800/80 flex items-center justify-center text-xl">
              🐔
            </div>
            <div>
              <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest">
                Hen Incubation Period
              </span>
              <div className="text-xl font-extrabold text-white">21 Days Standard</div>
              <span className="text-[11px] text-indigo-200">Expected Date = Start Date + 21 days</span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs text-indigo-300">Batches</span>
            <div className="text-2xl font-black text-white">{henBroodings.length}</div>
          </div>
        </div>

        {/* Duck Rule */}
        <div className="bg-gradient-to-r from-teal-900 to-teal-950 text-white p-4 rounded-xl border border-teal-800 shadow-xs flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-teal-800/80 flex items-center justify-center text-xl">
              🦆
            </div>
            <div>
              <span className="text-[10px] font-bold text-teal-300 uppercase tracking-widest">
                Duck Incubation Period
              </span>
              <div className="text-xl font-extrabold text-white">40 Days Standard</div>
              <span className="text-[11px] text-teal-200">Expected Date = Start Date + 40 days</span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs text-teal-300">Batches</span>
            <div className="text-2xl font-black text-white">{duckBroodings.length}</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search Brooding Code, parent bird ID, breed..."
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50"
          />
        </div>

        <div className="flex items-center space-x-2">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as 'All' | 'Hen' | 'Duck')}
            className="text-xs rounded-xl border border-slate-200 px-3 py-2 bg-white text-slate-700"
          >
            <option value="All">All Species (Hen & Duck)</option>
            <option value="Hen">Hens Only (21d)</option>
            <option value="Duck">Ducks Only (40d)</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs rounded-xl border border-slate-200 px-3 py-2 bg-white text-slate-700"
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Due Soon">Due Soon (&lt; 3 days)</option>
            <option value="Due Today">Due Today</option>
            <option value="Overdue">Overdue</option>
            <option value="Hatched">Hatched</option>
            <option value="Failed">Failed</option>
          </select>
        </div>
      </div>

      {/* Brooding Cards / Table */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredBrooding.length === 0 ? (
          <div className="col-span-full bg-white p-12 text-center rounded-2xl border border-slate-200 text-slate-400">
            No brooding schedules recorded yet. Click one of the buttons above to register a Hen or Duck brooding batch.
          </div>
        ) : (
          filteredBrooding.map((item) => {
            const { status, countdownText, isOverdue } = getBroodingStatusAndCountdown(
              item.start_date,
              item.expected_hatch_date,
              item.actual_hatch_date,
              item.hatched_count,
              item.status
            );

            const isHen = item.poultry_type === 'Hen';

            return (
              <div
                key={item.id}
                className={`bg-white rounded-2xl border p-5 shadow-xs transition-all relative overflow-hidden flex flex-col justify-between ${
                  isOverdue
                    ? 'border-rose-400 bg-rose-50/20 ring-1 ring-rose-400'
                    : status === 'Due Today'
                    ? 'border-emerald-500 bg-emerald-50/20 ring-1 ring-emerald-500'
                    : status === 'Due Soon'
                    ? 'border-amber-400 bg-amber-50/20'
                    : status === 'Hatched'
                    ? 'border-slate-200 bg-slate-50/50'
                    : 'border-slate-200'
                }`}
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-xl">{isHen ? '🐔' : '🦆'}</span>
                      <div>
                        <span className="font-extrabold text-sm text-slate-900">{item.brooding_code}</span>
                        <div className="text-[10px] text-slate-500">
                          Parent: <strong className="text-slate-700">{item.parent_poultry_id}</strong>
                        </div>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full ${
                        status === 'Overdue'
                          ? 'bg-rose-100 text-rose-800 animate-pulse'
                          : status === 'Due Today'
                          ? 'bg-emerald-100 text-emerald-800 animate-bounce'
                          : status === 'Due Soon'
                          ? 'bg-amber-100 text-amber-800'
                          : status === 'Hatched'
                          ? 'bg-teal-100 text-teal-800'
                          : 'bg-indigo-100 text-indigo-800'
                      }`}
                    >
                      {status}
                    </span>
                  </div>

                  {/* Countdown banner */}
                  <div
                    className={`mt-3 py-1.5 px-3 rounded-xl text-xs font-bold text-center ${
                      isOverdue
                        ? 'bg-rose-100 text-rose-900'
                        : status === 'Due Today'
                        ? 'bg-emerald-500 text-white shadow-xs'
                        : status === 'Due Soon'
                        ? 'bg-amber-100 text-amber-900'
                        : status === 'Hatched'
                        ? 'bg-slate-100 text-slate-700'
                        : 'bg-indigo-50 text-indigo-900'
                    }`}
                  >
                    {countdownText}
                  </div>

                  {/* Details grid */}
                  <div className="mt-3.5 space-y-1.5 text-xs text-slate-600 bg-slate-50/80 p-3 rounded-xl">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Species & Breed:</span>
                      <span className="font-semibold text-slate-800">
                        {item.poultry_type} • {item.breed}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Eggs Placed:</span>
                      <span className="font-black text-slate-900">{item.eggs_placed} eggs</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Incubation Standard:</span>
                      <span className="font-semibold text-indigo-700">
                        {isHen ? '21 Days' : '40 Days'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Start Date:</span>
                      <span className="font-medium text-slate-800">{formatDate(item.start_date)}</span>
                    </div>
                    <div className="flex justify-between font-bold">
                      <span className="text-slate-700">Expected Hatch Date:</span>
                      <span className="text-emerald-700">{formatDate(item.expected_hatch_date)}</span>
                    </div>

                    {item.actual_hatch_date && (
                      <div className="flex justify-between pt-1 border-t border-slate-200 font-bold text-teal-800">
                        <span>Actual Hatch:</span>
                        <span>{formatDate(item.actual_hatch_date)}</span>
                      </div>
                    )}
                  </div>

                  {item.notes && (
                    <p className="mt-2 text-[11px] text-slate-500 italic bg-white p-2 rounded-lg border border-slate-100">
                      "{item.notes}"
                    </p>
                  )}
                </div>

                {/* Bottom Actions */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() => onDeleteBrooding(item.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                    title="Delete Record"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  {status !== 'Hatched' ? (
                    <button
                      onClick={() => onOpenRecordHatchModal(item)}
                      className="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-all"
                    >
                      <Sparkles className="w-3.5 h-3.5 mr-1" />
                      Record Hatch Result
                    </button>
                  ) : (
                    <span className="text-[11px] font-bold text-teal-700 flex items-center">
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                      Hatch Logged
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Brooding Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
            <div className="bg-indigo-900 text-white px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold">
                  Start New Brooding Batch ({formPoultryType === 'Hen' ? '21 Days' : '40 Days'})
                </h2>
                <p className="text-xs text-indigo-200">
                  Automatic hatch date calculation for Kingdom Group Poultry
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-indigo-200 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center">
                  <AlertTriangle className="w-4 h-4 mr-2 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Species Toggle */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Poultry Species & Incubation Rule *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setFormPoultryType('Hen');
                      setFormBreed('Improved Kienyeji');
                    }}
                    className={`py-3 px-3 rounded-xl border text-xs font-bold text-left transition-all ${
                      formPoultryType === 'Hen'
                        ? 'bg-indigo-50 border-indigo-500 text-indigo-950 ring-2 ring-indigo-500/20'
                        : 'bg-white border-slate-200 text-slate-600'
                    }`}
                  >
                    <div className="text-base mb-0.5">🐔 Hen (Kuku)</div>
                    <div className="text-[10px] text-indigo-700 font-semibold">21 Days Standard Incubation</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setFormPoultryType('Duck');
                      setFormBreed('Improved Duck');
                    }}
                    className={`py-3 px-3 rounded-xl border text-xs font-bold text-left transition-all ${
                      formPoultryType === 'Duck'
                        ? 'bg-teal-50 border-teal-500 text-teal-950 ring-2 ring-teal-500/20'
                        : 'bg-white border-slate-200 text-slate-600'
                    }`}
                  >
                    <div className="text-base mb-0.5">🦆 Duck (Bata)</div>
                    <div className="text-[10px] text-teal-700 font-semibold">40 Days Standard Incubation</div>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Brooding Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value)}
                    placeholder="e.g. BRD-H-2026-001"
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Parent Hen / Duck / Incubator ID *
                  </label>
                  <input
                    type="text"
                    required
                    value={formParentId}
                    onChange={(e) => setFormParentId(e.target.value)}
                    placeholder="e.g. KGP-H101 or Incubator-1"
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Breed *</label>
                  <input
                    type="text"
                    required
                    value={formBreed}
                    onChange={(e) => setFormBreed(e.target.value)}
                    placeholder="e.g. Improved Kienyeji"
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Number of Eggs Placed *
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={formEggsPlaced}
                    onChange={(e) => setFormEggsPlaced(Number(e.target.value))}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 font-black text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Start Date of Brooding *
                  </label>
                  <input
                    type="date"
                    required
                    value={formStartDate}
                    onChange={(e) => setFormStartDate(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>

                {/* AUTOMATIC EXPECTED HATCH DATE DISPLAY */}
                <div>
                  <label className="block text-xs font-black text-emerald-800 mb-1">
                    Automatic Expected Hatch Date
                  </label>
                  <div className="w-full text-xs font-black px-3 py-2 rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-900">
                    {formatDate(liveExpectedHatchDate)}
                  </div>
                  <span className="text-[10px] text-slate-400">
                    +{formPoultryType === 'Hen' ? 21 : 40} days automatically calculated
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Notes / Nest Box Location</label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="e.g. Nest box 3, clean straw, mother hen was checked for parasites."
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
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md transition-all disabled:opacity-50"
                >
                  {isSubmitting ? 'Starting Brooding...' : 'Start Brooding Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
