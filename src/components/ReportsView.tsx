import React, { useState, useMemo } from 'react';
import {
  FileBarChart2,
  Calendar,
  Printer,
  Download,
  DollarSign,
  TrendingUp,
  Receipt,
  Bird,
  Clock,
  Sparkles,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
} from 'lucide-react';
import {
  PoultryItem,
  EggRecord,
  BroodingRecord,
  HatchRecord,
  ExpenseRecord,
  SaleRecord,
  DashboardMetrics,
} from '../types';
import { formatTZS, formatNumber, formatDate } from '../utils/calculations';
import { exportMasterWorkbook } from '../utils/excelExport';

interface ReportsViewProps {
  metrics: DashboardMetrics;
  poultry: PoultryItem[];
  eggs: EggRecord[];
  brooding: BroodingRecord[];
  hatch: HatchRecord[];
  sales: SaleRecord[];
  expenses: ExpenseRecord[];
}

type PeriodFilter = 'all' | 'today' | 'week' | 'month' | 'year' | 'custom';

export const ReportsView: React.FC<ReportsViewProps> = ({
  metrics,
  poultry,
  eggs,
  brooding,
  hatch,
  sales,
  expenses,
}) => {
  const [activeTab, setActiveTab] = useState<'financial' | 'poultry' | 'brooding' | 'categories' | 'products'>('financial');
  const [period, setPeriod] = useState<PeriodFilter>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Date filter helper
  const isInPeriod = (dateStr: string): boolean => {
    if (!dateStr) return false;
    if (period === 'all') return true;

    const recordDate = new Date(dateStr);
    recordDate.setHours(0, 0, 0, 0);

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    if (period === 'today') {
      return recordDate.getTime() === now.getTime();
    } else if (period === 'week') {
      const startOfWeek = new Date(now);
      const day = startOfWeek.getDay() || 7;
      startOfWeek.setDate(startOfWeek.getDate() - day + 1);
      return recordDate >= startOfWeek;
    } else if (period === 'month') {
      return recordDate.getFullYear() === now.getFullYear() && recordDate.getMonth() === now.getMonth();
    } else if (period === 'year') {
      return recordDate.getFullYear() === now.getFullYear();
    } else if (period === 'custom') {
      if (startDate && recordDate < new Date(startDate)) return false;
      if (endDate && recordDate > new Date(endDate)) return false;
      return true;
    }
    return true;
  };

  // Filtered dataset for reporting
  const filteredSales = useMemo(() => sales.filter((s) => isInPeriod(s.date)), [sales, period, startDate, endDate]);
  const filteredExpenses = useMemo(() => expenses.filter((e) => isInPeriod(e.date)), [expenses, period, startDate, endDate]);
  const filteredEggs = useMemo(() => eggs.filter((e) => isInPeriod(e.date)), [eggs, period, startDate, endDate]);
  const filteredHatch = useMemo(() => hatch.filter((h) => isInPeriod(h.date)), [hatch, period, startDate, endDate]);

  // Financial calculations
  const totalRevenue = useMemo(() => filteredSales.reduce((acc, s) => acc + Number(s.total_amount), 0), [filteredSales]);
  const totalExpenseCost = useMemo(() => filteredExpenses.reduce((acc, e) => acc + Number(e.total_cost), 0), [filteredExpenses]);
  const netProfit = totalRevenue - totalExpenseCost;

  // Poultry Report counts
  const poultryReport = useMemo(() => {
    const total = poultry.reduce((acc, p) => acc + p.quantity, 0);
    const hens = poultry.filter((p) => p.type === 'Hen').reduce((acc, p) => acc + p.quantity, 0);
    const roosters = poultry.filter((p) => p.type === 'Rooster').reduce((acc, p) => acc + p.quantity, 0);
    const ducks = poultry.filter((p) => p.type === 'Duck').reduce((acc, p) => acc + p.quantity, 0);
    const drakes = poultry.filter((p) => p.type === 'Drake').reduce((acc, p) => acc + p.quantity, 0);
    const chicks = poultry.filter((p) => p.type === 'Chick').reduce((acc, p) => acc + p.quantity, 0);

    const active = poultry.filter((p) => p.current_status !== 'Sold' && p.current_status !== 'Dead').reduce((acc, p) => acc + p.quantity, 0);
    const sold = poultry.filter((p) => p.current_status === 'Sold').reduce((acc, p) => acc + p.quantity, 0);
    const dead = poultry.filter((p) => p.current_status === 'Dead').reduce((acc, p) => acc + p.quantity, 0);
    const laying = poultry.filter((p) => p.current_status === 'Laying').reduce((acc, p) => acc + p.quantity, 0);
    const broodingStatus = poultry.filter((p) => p.current_status === 'Brooding').reduce((acc, p) => acc + p.quantity, 0);

    return { total, hens, roosters, ducks, drakes, chicks, active, sold, dead, laying, broodingStatus };
  }, [poultry]);

  // Brooding Report counts
  const broodingReport = useMemo(() => {
    const totalBatches = brooding.length;
    const active = brooding.filter((b) => b.status === 'Active').length;
    const dueSoon = brooding.filter((b) => b.status === 'Due Soon').length;
    const dueToday = brooding.filter((b) => b.status === 'Due Today').length;
    const overdue = brooding.filter((b) => b.status === 'Overdue').length;
    const completed = brooding.filter((b) => b.status === 'Hatched' || b.status === 'Completed').length;

    const totalEggsPlaced = brooding.reduce((acc, b) => acc + Number(b.eggs_placed), 0);
    const totalHatchedCount = hatch.reduce((acc, h) => acc + Number(h.eggs_hatched), 0);
    const totalEggsPlacedHatch = hatch.reduce((acc, h) => acc + Number(h.eggs_placed), 0);
    const overallRate = totalEggsPlacedHatch > 0 ? Math.round((totalHatchedCount / totalEggsPlacedHatch) * 100) : 0;

    return { totalBatches, active, dueSoon, dueToday, overdue, completed, totalEggsPlaced, totalHatchedCount, overallRate };
  }, [brooding, hatch]);

  // Category summary
  const expenseByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    filteredExpenses.forEach((e) => {
      map[e.category] = (map[e.category] || 0) + Number(e.total_cost);
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [filteredExpenses]);

  // Product summary
  const salesByProduct = useMemo(() => {
    const map: Record<string, { total: number; qty: number }> = {};
    filteredSales.forEach((s) => {
      if (!map[s.product]) map[s.product] = { total: 0, qty: 0 };
      map[s.product].total += Number(s.total_amount);
      map[s.product].qty += Number(s.quantity);
    });
    return Object.entries(map).sort((a, b) => b[1].total - a[1].total);
  }, [filteredSales]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs no-print">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-slate-900">Commercial Reports & Auditing</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-900">
              Audit Ready
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Profit and Loss, Flock Census, Brooding Efficiency, Expense Distribution, and Stock Valuation.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handlePrint}
            className="inline-flex items-center px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
          >
            <Printer className="w-4 h-4 mr-1.5" />
            Print Report
          </button>
          <button
            onClick={() => exportMasterWorkbook(metrics, poultry, eggs, brooding, hatch, sales, expenses)}
            className="inline-flex items-center px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 transition-all"
          >
            <Download className="w-4 h-4 mr-1.5" />
            Export Complete Master Excel
          </button>
        </div>
      </div>

      {/* Period Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3 no-print">
        <div className="flex items-center space-x-1.5 overflow-x-auto">
          {(['all', 'today', 'week', 'month', 'year', 'custom'] as PeriodFilter[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-colors ${
                period === p
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {p === 'all' ? 'All Time' : p === 'week' ? 'This Week' : p === 'month' ? 'This Month' : p === 'year' ? 'This Year' : p}
            </button>
          ))}
        </div>

        {period === 'custom' && (
          <div className="flex items-center space-x-2 text-xs">
            <span className="text-slate-500">From:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-2 py-1 border border-slate-300 rounded-lg text-xs"
            />
            <span className="text-slate-500">To:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-2 py-1 border border-slate-300 rounded-lg text-xs"
            />
          </div>
        )}
      </div>

      {/* Report Section Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-1 no-print">
        <button
          onClick={() => setActiveTab('financial')}
          className={`px-4 py-2 text-xs font-bold rounded-t-xl transition-all ${
            activeTab === 'financial'
              ? 'bg-white text-emerald-800 border-t-2 border-emerald-600 shadow-xs'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Financial Profit & Loss
        </button>
        <button
          onClick={() => setActiveTab('poultry')}
          className={`px-4 py-2 text-xs font-bold rounded-t-xl transition-all ${
            activeTab === 'poultry'
              ? 'bg-white text-emerald-800 border-t-2 border-emerald-600 shadow-xs'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Flock & Poultry Census
        </button>
        <button
          onClick={() => setActiveTab('brooding')}
          className={`px-4 py-2 text-xs font-bold rounded-t-xl transition-all ${
            activeTab === 'brooding'
              ? 'bg-white text-emerald-800 border-t-2 border-emerald-600 shadow-xs'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Brooding & Incubation
        </button>
        <button
          onClick={() => setActiveTab('categories')}
          className={`px-4 py-2 text-xs font-bold rounded-t-xl transition-all ${
            activeTab === 'categories'
              ? 'bg-white text-emerald-800 border-t-2 border-emerald-600 shadow-xs'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Expense Breakdown
        </button>
        <button
          onClick={() => setActiveTab('products')}
          className={`px-4 py-2 text-xs font-bold rounded-t-xl transition-all ${
            activeTab === 'products'
              ? 'bg-white text-emerald-800 border-t-2 border-emerald-600 shadow-xs'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Sales Product Mix
        </button>
      </div>

      {/* 1. FINANCIAL REPORT TAB */}
      {activeTab === 'financial' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-xs font-bold text-slate-500">Gross Sales Revenue</span>
              <div className="text-2xl font-black text-blue-900 mt-1">{formatTZS(totalRevenue)}</div>
              <span className="text-[10px] text-blue-600">{filteredSales.length} recorded sales</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-xs font-bold text-slate-500">Operating Expenses</span>
              <div className="text-2xl font-black text-rose-900 mt-1">{formatTZS(totalExpenseCost)}</div>
              <span className="text-[10px] text-rose-600">{filteredExpenses.length} expense entries</span>
            </div>

            <div
              className={`p-5 rounded-2xl border shadow-xs ${
                netProfit >= 0 ? 'bg-emerald-50/70 border-emerald-200' : 'bg-rose-50/70 border-rose-200'
              }`}
            >
              <span className="text-xs font-bold text-slate-700">Net Cash Profit (P&L)</span>
              <div
                className={`text-2xl font-black mt-1 ${
                  netProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'
                }`}
              >
                {formatTZS(netProfit)}
              </div>
              <span className="text-[10px] text-slate-500">Revenue minus expenses</span>
            </div>

            <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-5 rounded-2xl border border-amber-200/80 shadow-xs">
              <span className="text-xs font-bold text-amber-900">Poultry Stock Value</span>
              <div className="text-2xl font-black text-amber-950 mt-1">
                {formatTZS(metrics.currentPoultryStockValue)}
              </div>
              <span className="text-[10px] text-amber-700">Live flock capital (separate from sales)</span>
            </div>
          </div>

          {/* Statement Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
            <h2 className="text-sm font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100 flex items-center justify-between">
              <span>Financial Profit and Loss Statement</span>
              <span className="text-xs font-medium text-slate-500">
                Currency: Tanzanian Shilling (TZS)
              </span>
            </h2>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="font-semibold text-slate-700">1. Commercial Sales Revenue (Gross)</span>
                <span className="font-bold text-blue-900">{formatTZS(totalRevenue)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="font-semibold text-slate-700">2. Farm Operational Expenses</span>
                <span className="font-bold text-rose-700">({formatTZS(totalExpenseCost)})</span>
              </div>
              <div className="flex justify-between py-3 border-b-2 border-slate-300 text-sm font-black">
                <span className="text-slate-900">3. Net Commercial Profit</span>
                <span className={netProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'}>
                  {formatTZS(netProfit)}
                </span>
              </div>
              <div className="flex justify-between py-2 text-slate-600 bg-slate-50 p-3 rounded-xl mt-4">
                <div>
                  <span className="font-bold block text-slate-800">4. Live Poultry Asset Valuation</span>
                  <span className="text-[10px] text-slate-400">
                    Calculated from current live bird heads × unit estimated market price
                  </span>
                </div>
                <span className="font-bold text-amber-800 text-sm">{formatTZS(metrics.currentPoultryStockValue)}</span>
              </div>
              <div className="flex justify-between py-3 bg-emerald-50/70 p-3 rounded-xl font-black text-emerald-950">
                <span>Total Farm Net Equity (Profit + Live Flock Assets)</span>
                <span className="text-base">{formatTZS(netProfit + metrics.currentPoultryStockValue)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. POULTRY CENSUS TAB */}
      {activeTab === 'poultry' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-6">
          <h2 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">
            Flock Distribution & Survival Census
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-xs text-slate-500 font-semibold">Total Heads</span>
              <div className="text-xl font-extrabold text-slate-900 mt-1">{formatNumber(poultryReport.total)}</div>
            </div>
            <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200">
              <span className="text-xs text-emerald-800 font-semibold">🐔 Hens</span>
              <div className="text-xl font-extrabold text-emerald-900 mt-1">{formatNumber(poultryReport.hens)}</div>
            </div>
            <div className="p-3.5 bg-teal-50 rounded-xl border border-teal-200">
              <span className="text-xs text-teal-800 font-semibold">🐓 Roosters</span>
              <div className="text-xl font-extrabold text-teal-900 mt-1">{formatNumber(poultryReport.roosters)}</div>
            </div>
            <div className="p-3.5 bg-blue-50 rounded-xl border border-blue-200">
              <span className="text-xs text-blue-800 font-semibold">🦆 Ducks & Drakes</span>
              <div className="text-xl font-extrabold text-blue-900 mt-1">
                {formatNumber(poultryReport.ducks + poultryReport.drakes)}
              </div>
            </div>
            <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200">
              <span className="text-xs text-amber-800 font-semibold">🐣 Chicks</span>
              <div className="text-xl font-extrabold text-amber-900 mt-1">{formatNumber(poultryReport.chicks)}</div>
            </div>
            <div className="p-3.5 bg-emerald-100/60 rounded-xl border border-emerald-300">
              <span className="text-xs text-emerald-950 font-bold">Active Live</span>
              <div className="text-xl font-black text-emerald-950 mt-1">{formatNumber(poultryReport.active)}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-500">Commercial Sold:</span>{' '}
              <strong className="text-blue-700">{formatNumber(poultryReport.sold)} birds</strong>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-500">Farm Mortality / Dead:</span>{' '}
              <strong className="text-rose-700">{formatNumber(poultryReport.dead)} birds</strong>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-500">Currently Laying / Brooding:</span>{' '}
              <strong className="text-emerald-700">
                {formatNumber(poultryReport.laying + poultryReport.broodingStatus)} birds
              </strong>
            </div>
          </div>
        </div>
      )}

      {/* 3. BROODING REPORT TAB */}
      {activeTab === 'brooding' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-6">
          <h2 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">
            Incubation Lifecycle & Hatch Success Report
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-200">
              <span className="text-indigo-700 font-semibold">Active Broodings</span>
              <div className="text-2xl font-black text-indigo-950 mt-1">{broodingReport.active}</div>
            </div>
            <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
              <span className="text-amber-800 font-semibold">Due Soon / Today</span>
              <div className="text-2xl font-black text-amber-950 mt-1">
                {broodingReport.dueSoon + broodingReport.dueToday}
              </div>
            </div>
            <div className="p-4 bg-rose-50 rounded-xl border border-rose-200">
              <span className="text-rose-800 font-semibold">Overdue Incubation</span>
              <div className="text-2xl font-black text-rose-950 mt-1">{broodingReport.overdue}</div>
            </div>
            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
              <span className="text-emerald-800 font-semibold">Farm Hatch Rate</span>
              <div className="text-2xl font-black text-emerald-950 mt-1">{broodingReport.overallRate}%</div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 text-xs space-y-2 text-slate-600">
            <div className="flex justify-between py-1">
              <span>Total Brooding Batches Logged:</span>
              <span className="font-bold text-slate-900">{broodingReport.totalBatches}</span>
            </div>
            <div className="flex justify-between py-1">
              <span>Total Eggs Placed in Incubation/Brooders:</span>
              <span className="font-bold text-slate-900">{formatNumber(broodingReport.totalEggsPlaced)}</span>
            </div>
            <div className="flex justify-between py-1">
              <span>Successfully Hatched Chicks Produced:</span>
              <span className="font-bold text-emerald-700">{formatNumber(broodingReport.totalHatchedCount)}</span>
            </div>
          </div>
        </div>
      )}

      {/* 4. EXPENSE BREAKDOWN TAB */}
      {activeTab === 'categories' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">
            Expenses Ranked by Category
          </h2>

          <div className="space-y-3">
            {expenseByCategory.map(([cat, amount]) => {
              const total = totalExpenseCost || 1;
              const pct = Math.min(100, Math.round((amount / total) * 100));
              return (
                <div key={cat} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-800">{cat}</span>
                    <span className="text-slate-900 font-bold">
                      {formatTZS(amount)} <span className="text-slate-400 font-normal">({pct}%)</span>
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-rose-500 to-amber-500 rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. SALES PRODUCT MIX TAB */}
      {activeTab === 'products' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">
            Sales Revenue by Product
          </h2>

          <div className="space-y-3">
            {salesByProduct.map(([prod, data]) => {
              const total = totalRevenue || 1;
              const pct = Math.min(100, Math.round((data.total / total) * 100));
              return (
                <div key={prod} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-800">
                      {prod} <span className="text-slate-400 font-normal">({formatNumber(data.qty)} units sold)</span>
                    </span>
                    <span className="text-slate-900 font-bold">
                      {formatTZS(data.total)} <span className="text-slate-400 font-normal">({pct}%)</span>
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
