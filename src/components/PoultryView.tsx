import React, { useState, useMemo } from 'react';
import {
  Bird,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  Eye,
  X,
  AlertCircle,
  FileSpreadsheet,
  CheckCircle,
} from 'lucide-react';
import { PoultryItem, PoultryType, PoultryBreed, PoultrySex, PoultryStatus, PoultrySource } from '../types';
import { formatTZS, formatNumber, formatDate } from '../utils/calculations';
import { exportPoultryToExcel } from '../utils/excelExport';

interface PoultryViewProps {
  poultry: PoultryItem[];
  onAddPoultry: (item: Omit<PoultryItem, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  onUpdatePoultry: (id: string, updates: Partial<PoultryItem>) => Promise<void>;
  onDeletePoultry: (id: string) => Promise<void>;
  isOpenAddModalDefault?: boolean;
}

export const PoultryView: React.FC<PoultryViewProps> = ({
  poultry,
  onAddPoultry,
  onUpdatePoultry,
  onDeletePoultry,
  isOpenAddModalDefault = false,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('All');
  const [selectedBreed, setSelectedBreed] = useState<string>('All');
  const [selectedSex, setSelectedSex] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'date' | 'quantity' | 'poultry_id' | 'value'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(isOpenAddModalDefault);
  const [editingItem, setEditingItem] = useState<PoultryItem | null>(null);
  const [viewingItem, setViewingItem] = useState<PoultryItem | null>(null);
  const [deleteConfirmItem, setDeleteConfirmItem] = useState<PoultryItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form Fields
  const [formPoultryId, setFormPoultryId] = useState('');
  const [formType, setFormType] = useState<PoultryType>('Hen');
  const [formBreed, setFormBreed] = useState<PoultryBreed | string>('Improved Kienyeji');
  const [formSex, setFormSex] = useState<PoultrySex>('Female');
  const [formQuantity, setFormQuantity] = useState(10);
  const [formDateAcquired, setFormDateAcquired] = useState(new Date().toISOString().split('T')[0]);
  const [formAgeWeeks, setFormAgeWeeks] = useState(16);
  const [formSource, setFormSource] = useState<PoultrySource>('Hatched on farm');
  const [formPurchasePrice, setFormPurchasePrice] = useState(0);
  const [formEstimatedValue, setFormEstimatedValue] = useState(20000);
  const [formStatus, setFormStatus] = useState<PoultryStatus>('Active');
  const [formNotes, setFormNotes] = useState('');

  // Open modal for new entry
  const handleOpenAdd = () => {
    setEditingItem(null);
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    setFormPoultryId(`KGP-${formType === 'Hen' ? 'H' : formType === 'Duck' ? 'D' : 'B'}${randomSuffix}`);
    setFormType('Hen');
    setFormBreed('Improved Kienyeji');
    setFormSex('Female');
    setFormQuantity(10);
    setFormDateAcquired(new Date().toISOString().split('T')[0]);
    setFormAgeWeeks(16);
    setFormSource('Hatched on farm');
    setFormPurchasePrice(0);
    setFormEstimatedValue(20000);
    setFormStatus('Active');
    setFormNotes('');
    setFormError(null);
    setIsModalOpen(true);
  };

  // Open modal for editing
  const handleOpenEdit = (item: PoultryItem) => {
    setEditingItem(item);
    setFormPoultryId(item.poultry_id);
    setFormType(item.type);
    setFormBreed(item.breed);
    setFormSex(item.sex);
    setFormQuantity(item.quantity);
    setFormDateAcquired(item.date_acquired);
    setFormAgeWeeks(item.age_weeks);
    setFormSource(item.source);
    setFormPurchasePrice(item.purchase_price);
    setFormEstimatedValue(item.estimated_unit_value);
    setFormStatus(item.current_status);
    setFormNotes(item.notes || '');
    setFormError(null);
    setIsModalOpen(true);
  };

  // Form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formPoultryId.trim()) {
      setFormError('Poultry ID / Batch Code is required.');
      return;
    }
    if (formQuantity < 0) {
      setFormError('Quantity cannot be negative.');
      return;
    }
    if (formPurchasePrice < 0 || formEstimatedValue < 0) {
      setFormError('Prices and valuations cannot be negative.');
      return;
    }

    try {
      setIsSubmitting(true);
      if (editingItem) {
        await onUpdatePoultry(editingItem.id, {
          poultry_id: formPoultryId.trim(),
          type: formType,
          breed: formBreed,
          sex: formSex,
          quantity: Number(formQuantity),
          date_acquired: formDateAcquired,
          age_weeks: Number(formAgeWeeks),
          source: formSource,
          purchase_price: Number(formPurchasePrice),
          estimated_unit_value: Number(formEstimatedValue),
          current_status: formStatus,
          notes: formNotes.trim(),
        });
      } else {
        await onAddPoultry({
          poultry_id: formPoultryId.trim(),
          type: formType,
          breed: formBreed,
          sex: formSex,
          quantity: Number(formQuantity),
          date_acquired: formDateAcquired,
          age_weeks: Number(formAgeWeeks),
          source: formSource,
          purchase_price: Number(formPurchasePrice),
          estimated_unit_value: Number(formEstimatedValue),
          current_status: formStatus,
          notes: formNotes.trim(),
        });
      }
      setIsModalOpen(false);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Error saving poultry record.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtering and Sorting
  const filteredList = useMemo(() => {
    return poultry.filter(item => {
      const matchSearch =
        item.poultry_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.breed.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.notes && item.notes.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchType = selectedType === 'All' || item.type === selectedType;
      const matchBreed = selectedBreed === 'All' || item.breed === selectedBreed;
      const matchSex = selectedSex === 'All' || item.sex === selectedSex;
      const matchStatus = selectedStatus === 'All' || item.current_status === selectedStatus;

      return matchSearch && matchType && matchBreed && matchSex && matchStatus;
    }).sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'quantity') comparison = a.quantity - b.quantity;
      else if (sortBy === 'poultry_id') comparison = a.poultry_id.localeCompare(b.poultry_id);
      else if (sortBy === 'value') {
        const valA = a.quantity * a.estimated_unit_value;
        const valB = b.quantity * b.estimated_unit_value;
        comparison = valA - valB;
      } else {
        comparison = new Date(a.date_acquired).getTime() - new Date(b.date_acquired).getTime();
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [poultry, searchTerm, selectedType, selectedBreed, selectedSex, selectedStatus, sortBy, sortOrder]);

  // Aggregate stats
  const totalQuantity = useMemo(() => {
    return filteredList.reduce((acc, p) => acc + (p.current_status !== 'Dead' && p.current_status !== 'Sold' ? p.quantity : 0), 0);
  }, [filteredList]);

  const totalFilteredStockValue = useMemo(() => {
    return filteredList.reduce((acc, p) => {
      if (p.current_status !== 'Dead' && p.current_status !== 'Sold') {
        return acc + (p.quantity * p.estimated_unit_value);
      }
      return acc;
    }, 0);
  }, [filteredList]);

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-slate-900">Live Poultry Inventory</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
              {filteredList.length} Records ({formatNumber(totalQuantity)} Birds)
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Registered flocks, breed classification, age tracking, and stock asset valuation.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => exportPoultryToExcel(filteredList)}
            className="inline-flex items-center px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 mr-1.5 text-emerald-600" />
            Export Excel
          </button>
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-700/20 transition-all"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Register Poultry
          </button>
        </div>
      </div>

      {/* Stock Value Highlight Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gradient-to-r from-emerald-900 to-teal-950 text-white p-4 rounded-xl shadow-xs">
          <span className="text-xs font-medium text-emerald-300">Live Active Flock Value</span>
          <div className="text-xl font-black mt-1 text-emerald-100">{formatTZS(totalFilteredStockValue)}</div>
          <span className="text-[10px] text-emerald-400">Current live assets on farm</span>
        </div>
        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs">
          <span className="text-xs font-medium text-slate-500">Active Birds Count</span>
          <div className="text-xl font-black mt-1 text-slate-900">{formatNumber(totalQuantity)} Heads</div>
          <span className="text-[10px] text-slate-400">Excludes dead or sold</span>
        </div>
        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs">
          <span className="text-xs font-medium text-slate-500">Average Bird Valuation</span>
          <div className="text-xl font-black mt-1 text-slate-900">
            {formatTZS(totalQuantity > 0 ? Math.round(totalFilteredStockValue / totalQuantity) : 0)}
          </div>
          <span className="text-[10px] text-slate-400">Weighted market estimate</span>
        </div>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search Poultry ID, breed, type, notes..."
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-slate-50/50"
            />
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="text-xs rounded-xl border border-slate-200 px-3 py-2 bg-white text-slate-700 focus:ring-2 focus:ring-emerald-500"
            >
              <option value="All">All Species</option>
              <option value="Hen">Hen</option>
              <option value="Rooster">Rooster</option>
              <option value="Duck">Duck</option>
              <option value="Drake">Drake</option>
              <option value="Chick">Chick</option>
              <option value="Other">Other</option>
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="text-xs rounded-xl border border-slate-200 px-3 py-2 bg-white text-slate-700 focus:ring-2 focus:ring-emerald-500"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Laying">Laying</option>
              <option value="Breeding">Breeding</option>
              <option value="Brooding">Brooding</option>
              <option value="Growing">Growing</option>
              <option value="Sick">Sick</option>
              <option value="Sold">Sold</option>
              <option value="Dead">Dead</option>
            </select>

            <select
              value={selectedSex}
              onChange={(e) => setSelectedSex(e.target.value)}
              className="text-xs rounded-xl border border-slate-200 px-3 py-2 bg-white text-slate-700 focus:ring-2 focus:ring-emerald-500"
            >
              <option value="All">All Sex</option>
              <option value="Female">Female</option>
              <option value="Male">Male</option>
              <option value="Unknown">Unknown</option>
            </select>

            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [sb, so] = e.target.value.split('-') as ['date' | 'quantity' | 'poultry_id' | 'value', 'asc' | 'desc'];
                setSortBy(sb);
                setSortOrder(so);
              }}
              className="text-xs rounded-xl border border-slate-200 px-3 py-2 bg-white text-slate-700 focus:ring-2 focus:ring-emerald-500"
            >
              <option value="date-desc">Newest Acquired</option>
              <option value="date-asc">Oldest Acquired</option>
              <option value="quantity-desc">Highest Quantity</option>
              <option value="value-desc">Highest Stock Value</option>
              <option value="poultry_id-asc">Poultry ID (A-Z)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Live Inventory Table as Required in Section 6 */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-4">Poultry ID</th>
                <th className="py-3 px-3">Type</th>
                <th className="py-3 px-3">Breed</th>
                <th className="py-3 px-3">Sex</th>
                <th className="py-3 px-3 text-right">Quantity</th>
                <th className="py-3 px-3">Age</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Date Registered</th>
                <th className="py-3 px-3 text-right">Unit Value</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400">
                    No poultry records match your search criteria.
                  </td>
                </tr>
              ) : (
                filteredList.map((item) => {
                  const isDeadOrSold = item.current_status === 'Dead' || item.current_status === 'Sold';
                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-slate-50/70 transition-colors ${
                        isDeadOrSold ? 'bg-slate-50/40 text-slate-400' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4 font-bold text-slate-900 flex items-center space-x-2">
                        <span>{item.poultry_id}</span>
                      </td>
                      <td className="py-3.5 px-3">
                        <span className="inline-flex items-center space-x-1 font-semibold text-slate-800">
                          <span>
                            {item.type === 'Hen'
                              ? '🐔'
                              : item.type === 'Rooster'
                              ? '🐓'
                              : item.type === 'Duck' || item.type === 'Drake'
                              ? '🦆'
                              : '🐣'}
                          </span>
                          <span>{item.type}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-3 font-medium text-slate-600">{item.breed}</td>
                      <td className="py-3.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            item.sex === 'Female'
                              ? 'bg-pink-50 text-pink-700'
                              : item.sex === 'Male'
                              ? 'bg-blue-50 text-blue-700'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {item.sex}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-right font-extrabold text-slate-900">
                        {formatNumber(item.quantity)}
                      </td>
                      <td className="py-3.5 px-3 text-slate-600">
                        {item.age_weeks > 0 ? `${item.age_weeks} wks` : '< 1 wk'}
                      </td>
                      <td className="py-3.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            item.current_status === 'Active' || item.current_status === 'Laying'
                              ? 'bg-emerald-100 text-emerald-800'
                              : item.current_status === 'Breeding' || item.current_status === 'Brooding'
                              ? 'bg-indigo-100 text-indigo-800'
                              : item.current_status === 'Growing'
                              ? 'bg-amber-100 text-amber-800'
                              : item.current_status === 'Sold'
                              ? 'bg-blue-100 text-blue-800'
                              : item.current_status === 'Dead'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {item.current_status}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-slate-500">{formatDate(item.date_acquired)}</td>
                      <td className="py-3.5 px-3 text-right font-semibold text-slate-800">
                        {formatTZS(item.estimated_unit_value)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center space-x-1.5">
                          <button
                            onClick={() => setViewingItem(item)}
                            className="p-1 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="View Record Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(item)}
                            className="p-1 text-slate-400 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit Record"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmItem(item)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Delete Record"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Poultry Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold">
                  {editingItem ? 'Edit Poultry Record' : 'Register Poultry / Flock Batch'}
                </h2>
                <p className="text-xs text-slate-400">
                  Kingdom Group Poultry Management System
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Poultry ID */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Poultry ID / Batch Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={formPoultryId}
                    onChange={(e) => setFormPoultryId(e.target.value)}
                    placeholder="e.g. KGP-H105"
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 font-semibold"
                  />
                </div>

                {/* Poultry Type */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Poultry Type *
                  </label>
                  <select
                    value={formType}
                    onChange={(e) => {
                      const t = e.target.value as PoultryType;
                      setFormType(t);
                      if (t === 'Hen') {
                        setFormSex('Female');
                        setFormBreed('Improved Kienyeji');
                      } else if (t === 'Rooster') {
                        setFormSex('Male');
                        setFormBreed('Kienyeji');
                      } else if (t === 'Duck') {
                        setFormSex('Female');
                        setFormBreed('Improved Duck');
                      } else if (t === 'Drake') {
                        setFormSex('Male');
                        setFormBreed('Improved Duck');
                      }
                    }}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Hen">Hen (Kuku Jike)</option>
                    <option value="Rooster">Rooster (Jogoo)</option>
                    <option value="Duck">Duck (Bata Jike)</option>
                    <option value="Drake">Drake (Bata Dume)</option>
                    <option value="Chick">Chick (Kifaranga)</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* Breed */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Breed *</label>
                  <select
                    value={formBreed}
                    onChange={(e) => setFormBreed(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Improved Kienyeji">Improved Kienyeji (Kienyeji Chotara)</option>
                    <option value="Kienyeji">Kienyeji Asili (Pure Local)</option>
                    <option value="Chotara">Chotara / Crossbreed</option>
                    <option value="Local Duck">Local Duck (Bata wa Kienyeji)</option>
                    <option value="Improved Duck">Improved Duck (Bata Chotara)</option>
                    <option value="Sasso">Sasso</option>
                    <option value="Kuroiler">Kuroiler</option>
                    <option value="Black Australorp">Black Australorp</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* Sex */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Sex *</label>
                  <select
                    value={formSex}
                    onChange={(e) => setFormSex(e.target.value as PoultrySex)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Unknown">Unknown</option>
                  </select>
                </div>

                {/* Quantity */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Head Count / Quantity *
                  </label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={formQuantity}
                    onChange={(e) => setFormQuantity(Number(e.target.value))}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 font-bold"
                  />
                </div>

                {/* Age (Weeks) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Age (Weeks)</label>
                  <input
                    type="number"
                    min={0}
                    value={formAgeWeeks}
                    onChange={(e) => setFormAgeWeeks(Number(e.target.value))}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* Date Acquired */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Date Acquired *</label>
                  <input
                    type="date"
                    required
                    value={formDateAcquired}
                    onChange={(e) => setFormDateAcquired(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* Source */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Source</label>
                  <select
                    value={formSource}
                    onChange={(e) => setFormSource(e.target.value as PoultrySource)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Hatched on farm">Hatched on farm (Incubator/Broody)</option>
                    <option value="Purchased">Purchased from market / vendor</option>
                    <option value="Gifted">Gifted / Transferred</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* Purchase Price (TZS) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Purchase Price (TZS per bird)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={formPurchasePrice}
                    onChange={(e) => setFormPurchasePrice(Number(e.target.value))}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* Estimated Unit Value (TZS) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Estimated Unit Stock Value (TZS) *
                  </label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={formEstimatedValue}
                    onChange={(e) => setFormEstimatedValue(Number(e.target.value))}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 font-bold"
                  />
                  <span className="text-[10px] text-slate-400">
                    Used to calculate stock valuation (separate from sales)
                  </span>
                </div>

                {/* Current Status */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Current Status *</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as PoultryStatus)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Active">Active (Healthy)</option>
                    <option value="Laying">Laying (Kutaga)</option>
                    <option value="Breeding">Breeding (Kupanda/Kuzalisha)</option>
                    <option value="Brooding">Brooding (Kuatamia)</option>
                    <option value="Growing">Growing (Makuzi)</option>
                    <option value="Sick">Sick (Matibabu)</option>
                    <option value="Sold">Sold (Imeuzwa)</option>
                    <option value="Dead">Dead (Amekufa)</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Notes / Pen Location</label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="e.g. Pen 2A, vaccination scheduled for next Tuesday, healthy weights."
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Action buttons */}
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
                  {isSubmitting ? 'Saving to Database...' : editingItem ? 'Save Updates' : 'Register Poultry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {viewingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
              <h2 className="font-bold text-sm">Flock Record: {viewingItem.poultry_id}</h2>
              <button onClick={() => setViewingItem(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl">
                <div><span className="text-slate-500">Type:</span> <span className="font-bold text-slate-800">{viewingItem.type}</span></div>
                <div><span className="text-slate-500">Breed:</span> <span className="font-bold text-slate-800">{viewingItem.breed}</span></div>
                <div><span className="text-slate-500">Sex:</span> <span className="font-bold text-slate-800">{viewingItem.sex}</span></div>
                <div><span className="text-slate-500">Quantity:</span> <span className="font-extrabold text-slate-900">{viewingItem.quantity}</span></div>
                <div><span className="text-slate-500">Age:</span> <span className="font-bold text-slate-800">{viewingItem.age_weeks} weeks</span></div>
                <div><span className="text-slate-500">Status:</span> <span className="font-bold text-emerald-700">{viewingItem.current_status}</span></div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Acquired Date:</span>
                  <span className="font-semibold text-slate-900">{formatDate(viewingItem.date_acquired)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Source:</span>
                  <span className="font-semibold text-slate-900">{viewingItem.source}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Purchase Price:</span>
                  <span className="font-semibold text-slate-900">{formatTZS(viewingItem.purchase_price)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Unit Valuation:</span>
                  <span className="font-semibold text-slate-900">{formatTZS(viewingItem.estimated_unit_value)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100 font-bold">
                  <span className="text-slate-700">Total Group Value:</span>
                  <span className="text-emerald-700">{formatTZS(viewingItem.quantity * viewingItem.estimated_unit_value)}</span>
                </div>
              </div>
              {viewingItem.notes && (
                <div className="p-2.5 bg-slate-50 rounded-xl text-slate-600">
                  <span className="font-bold block text-slate-700 mb-0.5">Notes:</span>
                  {viewingItem.notes}
                </div>
              )}
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setViewingItem(null)}
                className="px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-300 rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal (Data Safety Rule - Section 26) */}
      {deleteConfirmItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-6 border border-slate-200 text-center">
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h2 className="text-sm font-bold text-slate-900">Confirm Deletion</h2>
            <p className="text-xs text-slate-500 mt-2">
              Are you sure you want to permanently delete record{' '}
              <span className="font-bold text-slate-800">{deleteConfirmItem.poultry_id}</span> ({deleteConfirmItem.quantity} birds)?
            </p>
            <p className="text-[11px] text-amber-700 bg-amber-50 p-2 rounded-lg mt-3">
              Tip: If birds were sold or died, change their status instead of deleting to preserve historical records.
            </p>
            <div className="flex items-center justify-center space-x-3 mt-5">
              <button
                onClick={() => setDeleteConfirmItem(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  await onDeletePoultry(deleteConfirmItem.id);
                  setDeleteConfirmItem(null);
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl"
              >
                Delete Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
