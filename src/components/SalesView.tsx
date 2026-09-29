import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  Plus,
  Search,
  Calendar,
  FileSpreadsheet,
  AlertCircle,
  X,
  Trash2,
  DollarSign,
  CheckCircle2,
} from 'lucide-react';
import { SaleRecord, SaleProductType, PoultryItem } from '../types';
import { formatTZS, formatDate, formatNumber } from '../utils/calculations';
import { exportSalesToExcel } from '../utils/excelExport';

interface SalesViewProps {
  sales: SaleRecord[];
  poultry: PoultryItem[];
  onAddSale: (record: Omit<SaleRecord, 'id' | 'created_at'>) => Promise<void>;
  onDeleteSale: (id: string) => Promise<void>;
  isOpenAddDefault?: boolean;
}

export const SalesView: React.FC<SalesViewProps> = ({
  sales,
  poultry,
  onAddSale,
  onDeleteSale,
  isOpenAddDefault = false,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [productFilter, setProductFilter] = useState<string>('All');
  const [paymentFilter, setPaymentFilter] = useState<string>('All');
  const [isModalOpen, setIsModalOpen] = useState(isOpenAddDefault);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form State
  const [formCode, setFormCode] = useState('');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formProduct, setFormProduct] = useState<SaleProductType>('Live chicken');
  const [formCategory, setFormCategory] = useState('Mature Kienyeji');
  const [formQuantity, setFormQuantity] = useState(5);
  const [formUnitPrice, setFormUnitPrice] = useState(20000);
  const [formCustomer, setFormCustomer] = useState('');
  const [formPaymentMethod, setFormPaymentMethod] = useState('M-Pesa');
  const [formPoultryIdLinked, setFormPoultryIdLinked] = useState('');
  const [formNotes, setFormNotes] = useState('');

  // Live total amount calculation
  const liveTotalAmount = useMemo(() => {
    return Math.round(Number(formQuantity) * Number(formUnitPrice));
  }, [formQuantity, formUnitPrice]);

  const handleOpenAdd = () => {
    const codeNum = Math.floor(100 + Math.random() * 900);
    setFormCode(`SAL-${new Date().getFullYear()}-${codeNum}`);
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormProduct('Live chicken');
    setFormCategory('Mature Kienyeji');
    setFormQuantity(5);
    setFormUnitPrice(20000);
    setFormCustomer('');
    setFormPaymentMethod('M-Pesa');
    setFormPoultryIdLinked('');
    setFormNotes('');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formCode.trim()) {
      setFormError('Sale ID is required.');
      return;
    }
    if (!formCustomer.trim()) {
      setFormError('Customer name is required.');
      return;
    }
    if (formQuantity <= 0) {
      setFormError('Quantity must be greater than zero.');
      return;
    }
    if (formUnitPrice < 0) {
      setFormError('Unit price cannot be negative.');
      return;
    }

    try {
      setIsSubmitting(true);
      await onAddSale({
        sale_code: formCode.trim(),
        date: formDate,
        product: formProduct,
        category: formCategory,
        quantity: Number(formQuantity),
        unit_price: Number(formUnitPrice),
        total_amount: liveTotalAmount,
        customer: formCustomer.trim(),
        payment_method: formPaymentMethod,
        poultry_id_linked: formPoultryIdLinked || undefined,
        notes: formNotes.trim(),
      });
      setIsModalOpen(false);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Error saving sale.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered sales
  const filteredSales = useMemo(() => {
    return sales.filter((s) => {
      const matchSearch =
        s.sale_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.product.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.notes && s.notes.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchProduct = productFilter === 'All' || s.product === productFilter;
      const matchPayment = paymentFilter === 'All' || s.payment_method === paymentFilter;

      return matchSearch && matchProduct && matchPayment;
    });
  }, [sales, searchTerm, productFilter, paymentFilter]);

  const totalRevenue = useMemo(() => {
    return filteredSales.reduce((acc, s) => acc + Number(s.total_amount), 0);
  }, [filteredSales]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-slate-900">Sales & Revenue Management</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-900">
              {filteredSales.length} Transactions
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Commercial sales of live birds, eggs, hatching eggs, and manure in Tanzanian Shillings (TZS).
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => exportSalesToExcel(filteredSales)}
            className="inline-flex items-center px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 mr-1.5 text-blue-600" />
            Export Excel
          </button>
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/20 transition-all"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Record New Sale
          </button>
        </div>
      </div>

      {/* KPI banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gradient-to-r from-blue-900 to-indigo-950 text-white p-4 rounded-xl shadow-xs">
          <span className="text-xs font-medium text-blue-200">Total Sales Revenue</span>
          <div className="text-2xl font-black mt-1 text-white">{formatTZS(totalRevenue)}</div>
          <span className="text-[10px] text-blue-300">Filtered transactions sum</span>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs">
          <span className="text-xs font-medium text-slate-500">Average Transaction Size</span>
          <div className="text-2xl font-black mt-1 text-slate-900">
            {formatTZS(filteredSales.length > 0 ? Math.round(totalRevenue / filteredSales.length) : 0)}
          </div>
          <span className="text-[10px] text-slate-400">Per customer receipt</span>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs">
          <span className="text-xs font-medium text-slate-500">Total Items / Units Sold</span>
          <div className="text-2xl font-black mt-1 text-slate-900">
            {formatNumber(filteredSales.reduce((acc, s) => acc + Number(s.quantity), 0))} Units
          </div>
          <span className="text-[10px] text-slate-400">Birds, egg trays, & products</span>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search customer, sale code, product, notes..."
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50"
          />
        </div>

        <div className="flex items-center space-x-2">
          <select
            value={productFilter}
            onChange={(e) => setProductFilter(e.target.value)}
            className="text-xs rounded-xl border border-slate-200 px-3 py-2 bg-white text-slate-700"
          >
            <option value="All">All Products</option>
            <option value="Live chicken">Live chicken</option>
            <option value="Ducks">Ducks</option>
            <option value="Chicks">Chicks</option>
            <option value="Eggs">Eggs</option>
            <option value="Hatching eggs">Hatching eggs</option>
            <option value="Manure">Manure</option>
            <option value="Other poultry products">Other products</option>
          </select>

          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="text-xs rounded-xl border border-slate-200 px-3 py-2 bg-white text-slate-700"
          >
            <option value="All">All Payment Methods</option>
            <option value="M-Pesa">M-Pesa</option>
            <option value="Cash">Cash</option>
            <option value="Airtel Money">Airtel Money</option>
            <option value="Tigo Pesa">Tigo Pesa</option>
            <option value="Bank Transfer">Bank Transfer</option>
          </select>
        </div>
      </div>

      {/* Sales Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-4">Sale ID</th>
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3">Product</th>
                <th className="py-3 px-3">Customer</th>
                <th className="py-3 px-3 text-right">Quantity</th>
                <th className="py-3 px-3 text-right">Unit Price</th>
                <th className="py-3 px-3 text-right font-extrabold text-blue-900">Total Amount</th>
                <th className="py-3 px-3">Payment Method</th>
                <th className="py-3 px-4">Notes</th>
                <th className="py-3 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400">
                    No sales recorded yet. Click "Record New Sale" to log revenue.
                  </td>
                </tr>
              ) : (
                filteredSales.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900">{s.sale_code}</td>
                    <td className="py-3.5 px-3 text-slate-600">{formatDate(s.date)}</td>
                    <td className="py-3.5 px-3 font-semibold text-slate-800">{s.product}</td>
                    <td className="py-3.5 px-3 font-medium text-slate-900">{s.customer}</td>
                    <td className="py-3.5 px-3 text-right font-bold text-slate-900">
                      {formatNumber(s.quantity)}
                    </td>
                    <td className="py-3.5 px-3 text-right text-slate-600 font-medium">
                      {formatTZS(s.unit_price)}
                    </td>
                    <td className="py-3.5 px-3 text-right font-black text-blue-700 bg-blue-50/40">
                      {formatTZS(s.total_amount)}
                    </td>
                    <td className="py-3.5 px-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                        {s.payment_method}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 max-w-xs truncate">{s.notes || '-'}</td>
                    <td className="py-3.5 px-3 text-center">
                      <button
                        onClick={() => onDeleteSale(s.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                        title="Delete Sale"
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

      {/* Record Sale Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
            <div className="bg-blue-700 text-white px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold">Record Commercial Sale</h2>
                <p className="text-xs text-blue-100">
                  Automatic total calculation (Quantity × Unit Price in TZS)
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-blue-100 hover:text-white p-1 rounded-lg"
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
                  <label className="block text-xs font-bold text-slate-700 mb-1">Sale ID *</label>
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

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Product *</label>
                  <select
                    value={formProduct}
                    onChange={(e) => {
                      const p = e.target.value as SaleProductType;
                      setFormProduct(p);
                      if (p === 'Live chicken') setFormUnitPrice(25000);
                      else if (p === 'Ducks') setFormUnitPrice(30000);
                      else if (p === 'Chicks') setFormUnitPrice(6500);
                      else if (p === 'Eggs') setFormUnitPrice(500);
                      else if (p === 'Hatching eggs') setFormUnitPrice(1500);
                      else if (p === 'Manure') setFormUnitPrice(5000);
                    }}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 font-semibold"
                  >
                    <option value="Live chicken">Live chicken (Kuku Mzima)</option>
                    <option value="Ducks">Ducks (Mabata)</option>
                    <option value="Chicks">Chicks (Vifaranga)</option>
                    <option value="Eggs">Table Eggs (Mayai ya Kula)</option>
                    <option value="Hatching eggs">Hatching Eggs (Mayai ya Kutotoa)</option>
                    <option value="Manure">Manure / Fertilizer (Mbolea)</option>
                    <option value="Other poultry products">Other poultry products</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Customer Name *</label>
                  <input
                    type="text"
                    required
                    value={formCustomer}
                    onChange={(e) => setFormCustomer(e.target.value)}
                    placeholder="e.g. Mama Neema / Royal Hotel"
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
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Unit Price (TZS) *
                  </label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={formUnitPrice}
                    onChange={(e) => setFormUnitPrice(Number(e.target.value))}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 font-bold"
                  />
                </div>

                {/* AUTOMATIC TOTAL SALE CALCULATION DISPLAY */}
                <div className="col-span-2 bg-blue-50/70 p-3.5 rounded-xl border border-blue-200">
                  <span className="block text-xs font-bold text-blue-900">
                    Automatic Total Sale Amount:
                  </span>
                  <div className="text-2xl font-black text-blue-950 mt-1">
                    {formatTZS(liveTotalAmount)}
                  </div>
                  <span className="text-[10px] text-blue-700">
                    {formQuantity} × {formatTZS(formUnitPrice)}
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Payment Method *
                  </label>
                  <select
                    value={formPaymentMethod}
                    onChange={(e) => setFormPaymentMethod(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300"
                  >
                    <option value="M-Pesa">M-Pesa</option>
                    <option value="Cash">Cash (Taslimu)</option>
                    <option value="Airtel Money">Airtel Money</option>
                    <option value="Tigo Pesa">Tigo Pesa</option>
                    <option value="Bank Transfer">Bank Transfer (NMB / CRDB)</option>
                  </select>
                </div>

                {/* Optional flock deduction link */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Deduct From Poultry Flock (Optional)
                  </label>
                  <select
                    value={formPoultryIdLinked}
                    onChange={(e) => setFormPoultryIdLinked(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300"
                  >
                    <option value="">-- Do not deduct / Not applicable --</option>
                    {poultry
                      .filter((p) => p.current_status !== 'Sold' && p.current_status !== 'Dead')
                      .map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.poultry_id} ({p.type} - {p.quantity} available)
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Notes</label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="e.g. Paid in full upon delivery, receipt #890 issued."
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
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md transition-all disabled:opacity-50"
                >
                  {isSubmitting ? 'Recording Sale...' : 'Save Sale'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
