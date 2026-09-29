import React, { useState, useMemo } from 'react';
import {
  Receipt,
  Plus,
  Search,
  Filter,
  FileSpreadsheet,
  AlertCircle,
  X,
  Trash2,
  Tag,
  DollarSign,
  Layers,
} from 'lucide-react';
import { ExpenseRecord, ExpenseCategory } from '../types';
import { formatTZS, formatDate, formatNumber } from '../utils/calculations';
import { exportExpensesToExcel } from '../utils/excelExport';
import { useAuth } from '../context/AuthContext';

interface ExpensesViewProps {
  expenses: ExpenseRecord[];
  categories: ExpenseCategory[];
  onAddExpense: (record: Omit<ExpenseRecord, 'id' | 'created_at'>) => Promise<void>;
  onDeleteExpense: (id: string) => Promise<void>;
  onAddCategory: (name: string) => Promise<void>;
  isOpenAddDefault?: boolean;
}

export const ExpensesView: React.FC<ExpensesViewProps> = ({
  expenses,
  categories,
  onAddExpense,
  onDeleteExpense,
  onAddCategory,
  isOpenAddDefault = false,
}) => {
  const { role } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [isModalOpen, setIsModalOpen] = useState(isOpenAddDefault);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form State
  const [formCode, setFormCode] = useState('');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formCategory, setFormCategory] = useState(categories[0]?.name || 'Feed');
  const [formDescription, setFormDescription] = useState('');
  const [formQuantity, setFormQuantity] = useState(1);
  const [formUnitCost, setFormUnitCost] = useState(50000);
  const [formPaymentMethod, setFormPaymentMethod] = useState('M-Pesa');
  const [formSupplier, setFormSupplier] = useState('');
  const [formNotes, setFormNotes] = useState('');

  // Live total cost calculation
  const liveTotalCost = useMemo(() => {
    return Math.round(Number(formQuantity) * Number(formUnitCost));
  }, [formQuantity, formUnitCost]);

  const handleOpenAdd = () => {
    const codeNum = Math.floor(100 + Math.random() * 900);
    setFormCode(`EXP-${new Date().getFullYear()}-${codeNum}`);
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormCategory(categories[0]?.name || 'Feed');
    setFormDescription('');
    setFormQuantity(1);
    setFormUnitCost(50000);
    setFormPaymentMethod('M-Pesa');
    setFormSupplier('');
    setFormNotes('');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formCode.trim()) {
      setFormError('Expense ID is required.');
      return;
    }
    if (!formDescription.trim()) {
      setFormError('Description is required.');
      return;
    }
    if (formQuantity <= 0) {
      setFormError('Quantity must be greater than zero.');
      return;
    }
    if (formUnitCost < 0) {
      setFormError('Unit cost cannot be negative.');
      return;
    }

    try {
      setIsSubmitting(true);
      await onAddExpense({
        expense_code: formCode.trim(),
        date: formDate,
        category: formCategory,
        description: formDescription.trim(),
        quantity: Number(formQuantity),
        unit_cost: Number(formUnitCost),
        total_cost: liveTotalCost,
        payment_method: formPaymentMethod,
        supplier: formSupplier.trim() || undefined,
        notes: formNotes.trim(),
      });
      setIsModalOpen(false);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Error recording expense.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    try {
      await onAddCategory(newCatName.trim());
      setNewCatName('');
      setIsCategoryModalOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  // Filtered expenses
  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      const matchSearch =
        e.expense_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (e.supplier && e.supplier.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchCategory = categoryFilter === 'All' || e.category === categoryFilter;

      return matchSearch && matchCategory;
    });
  }, [expenses, searchTerm, categoryFilter]);

  const totalExpenseSum = useMemo(() => {
    return filteredExpenses.reduce((acc, e) => acc + Number(e.total_cost), 0);
  }, [filteredExpenses]);

  // Expenses grouped by category
  const categorySummary = useMemo(() => {
    const map: Record<string, number> = {};
    expenses.forEach((e) => {
      map[e.category] = (map[e.category] || 0) + Number(e.total_cost);
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [expenses]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-slate-900">Farm Expense Tracking</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-900">
              {filteredExpenses.length} Expense Records
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Track operational spending on feed, vaccines, medication, equipment, electricity, and custom categories.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => exportExpensesToExcel(filteredExpenses)}
            className="inline-flex items-center px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 mr-1.5 text-rose-600" />
            Export Excel
          </button>
          <button
            onClick={() => setIsCategoryModalOpen(true)}
            className="inline-flex items-center px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
            title="Manage Custom Categories"
          >
            <Tag className="w-4 h-4 mr-1 text-slate-500" />
            + Category
          </button>
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/20 transition-all"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Record Expense
          </button>
        </div>
      </div>

      {/* KPI banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gradient-to-r from-rose-900 to-rose-950 text-white p-4 rounded-xl shadow-xs">
          <span className="text-xs font-medium text-rose-200">Total Farm Expenses</span>
          <div className="text-2xl font-black mt-1 text-white">{formatTZS(totalExpenseSum)}</div>
          <span className="text-[10px] text-rose-300">All operating expenditures</span>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs">
          <span className="text-xs font-medium text-slate-500">Top Cost Category</span>
          <div className="text-xl font-black mt-1 text-slate-900">
            {categorySummary[0] ? `${categorySummary[0][0]}` : 'N/A'}
          </div>
          <span className="text-[10px] text-slate-400">
            {categorySummary[0] ? formatTZS(categorySummary[0][1]) : '0'}
          </span>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs">
          <span className="text-xs font-medium text-slate-500">Active Categories</span>
          <div className="text-xl font-black mt-1 text-slate-900">{categories.length} Categories</div>
          <span className="text-[10px] text-slate-400">Custom & standard classification</span>
        </div>
      </div>

      {/* Category Pills Quick Filter */}
      <div className="flex items-center space-x-1.5 overflow-x-auto pb-1">
        <button
          onClick={() => setCategoryFilter('All')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-colors ${
            categoryFilter === 'All'
              ? 'bg-rose-600 text-white'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          All Categories
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setCategoryFilter(c.name)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-colors ${
              categoryFilter === c.name
                ? 'bg-rose-600 text-white'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search description, expense code, supplier, category..."
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50"
          />
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-4">Expense ID</th>
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3">Description</th>
                <th className="py-3 px-3 text-right">Quantity</th>
                <th className="py-3 px-3 text-right">Unit Cost</th>
                <th className="py-3 px-3 text-right font-extrabold text-rose-900">Total Cost</th>
                <th className="py-3 px-3">Payment</th>
                <th className="py-3 px-3">Supplier</th>
                <th className="py-3 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400">
                    No expense records found. Click "Record Expense" to track farm costs.
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900">{exp.expense_code}</td>
                    <td className="py-3.5 px-3 text-slate-600">{formatDate(exp.date)}</td>
                    <td className="py-3.5 px-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                        {exp.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 font-medium text-slate-900 max-w-xs">{exp.description}</td>
                    <td className="py-3.5 px-3 text-right font-semibold text-slate-900">{exp.quantity}</td>
                    <td className="py-3.5 px-3 text-right text-slate-600 font-medium">{formatTZS(exp.unit_cost)}</td>
                    <td className="py-3.5 px-3 text-right font-black text-rose-700 bg-rose-50/40">
                      {formatTZS(exp.total_cost)}
                    </td>
                    <td className="py-3.5 px-3 text-slate-600">{exp.payment_method}</td>
                    <td className="py-3.5 px-3 text-slate-500">{exp.supplier || '-'}</td>
                    <td className="py-3.5 px-3 text-center">
                      <button
                        onClick={() => onDeleteExpense(exp.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                        title="Delete Expense"
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

      {/* Record Expense Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
            <div className="bg-rose-700 text-white px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold">Record Farm Expense</h2>
                <p className="text-xs text-rose-100">
                  Automatic calculation: Total = Quantity × Unit Cost (TZS)
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-rose-100 hover:text-white p-1 rounded-lg"
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
                  <label className="block text-xs font-bold text-slate-700 mb-1">Expense ID *</label>
                  <input
                    type="text"
                    required
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Category *</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 font-semibold"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Description / Item Details *
                  </label>
                  <input
                    type="text"
                    required
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="e.g. 50kg Layers Mash Feed, Gumboro vaccine vials, feeder troughs"
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Quantity *</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={formQuantity}
                    onChange={(e) => setFormQuantity(Number(e.target.value))}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Unit Cost (TZS) *</label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={formUnitCost}
                    onChange={(e) => setFormUnitCost(Number(e.target.value))}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 font-bold"
                  />
                </div>

                {/* AUTOMATIC TOTAL COST CALCULATION */}
                <div className="col-span-2 bg-rose-50/70 p-3.5 rounded-xl border border-rose-200">
                  <span className="block text-xs font-bold text-rose-900">
                    Automatic Total Expense Cost:
                  </span>
                  <div className="text-2xl font-black text-rose-950 mt-1">
                    {formatTZS(liveTotalCost)}
                  </div>
                  <span className="text-[10px] text-rose-700">
                    {formQuantity} × {formatTZS(formUnitCost)}
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Payment Method *</label>
                  <select
                    value={formPaymentMethod}
                    onChange={(e) => setFormPaymentMethod(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300"
                  >
                    <option value="M-Pesa">M-Pesa</option>
                    <option value="Cash">Cash (Taslimu)</option>
                    <option value="Airtel Money">Airtel Money</option>
                    <option value="Tigo Pesa">Tigo Pesa</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Supplier / Agrovet</label>
                  <input
                    type="text"
                    value={formSupplier}
                    onChange={(e) => setFormSupplier(e.target.value)}
                    placeholder="e.g. Kilimo Bora Feeds Ltd"
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Notes</label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="e.g. Receipt #445 saved, delivered to store."
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
                  className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-md transition-all disabled:opacity-50"
                >
                  {isSubmitting ? 'Recording Expense...' : 'Save Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Custom Category Modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-6 border border-slate-200">
            <h2 className="text-sm font-bold text-slate-900 mb-2">Add Custom Expense Category</h2>
            <p className="text-xs text-slate-500 mb-4">
              Create custom category for tracking farm overheads.
            </p>
            <form onSubmit={handleAddCategorySubmit} className="space-y-4">
              <input
                type="text"
                required
                placeholder="e.g. Security, Bedding Shavings, Brooder Gas"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-rose-500 font-semibold"
              />
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-xs"
                >
                  Add Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
