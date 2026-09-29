import React from 'react';
import {
  Bird,
  Egg,
  Clock,
  Sparkles,
  TrendingUp,
  Receipt,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
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
import { NavTab } from './Sidebar';

interface DashboardViewProps {
  metrics: DashboardMetrics;
  poultry: PoultryItem[];
  eggs: EggRecord[];
  brooding: BroodingRecord[];
  hatch: HatchRecord[];
  sales: SaleRecord[];
  expenses: ExpenseRecord[];
  onNavigate: (tab: NavTab) => void;
  onOpenQuickAction: (action: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  metrics,
  poultry,
  eggs,
  brooding,
  hatch,
  sales,
  expenses,
  onNavigate,
  onOpenQuickAction,
}) => {
  // Filter urgent brooding alerts
  const urgentBroodings = brooding.filter(
    b => b.status === 'Due Today' || b.status === 'Overdue' || b.status === 'Due Soon'
  );

  // Group expenses by category
  const expenseByCategoryMap: Record<string, number> = {};
  expenses.forEach(e => {
    expenseByCategoryMap[e.category] = (expenseByCategoryMap[e.category] || 0) + Number(e.total_cost);
  });
  const sortedExpenseCategories = Object.entries(expenseByCategoryMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // Group sales by product
  const salesByProductMap: Record<string, number> = {};
  sales.forEach(s => {
    salesByProductMap[s.product] = (salesByProductMap[s.product] || 0) + Number(s.total_amount);
  });
  const sortedSalesProducts = Object.entries(salesByProductMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // Calculate overall hatch rate
  const totalEggsPlacedAll = hatch.reduce((acc, h) => acc + Number(h.eggs_placed), 0);
  const totalEggsHatchedAll = hatch.reduce((acc, h) => acc + Number(h.eggs_hatched), 0);
  const overallHatchRate = totalEggsPlacedAll > 0 ? Math.round((totalEggsHatchedAll / totalEggsPlacedAll) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Top Welcome & Executive Header */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden border border-emerald-800/40">
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold uppercase tracking-wider mb-3 border border-emerald-500/30">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Kingdom Group Live Operations</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              KINGDOM GROUP POULTRY MANAGEMENT
            </h1>
            <p className="text-slate-300 text-sm mt-1 max-w-2xl">
              Real-time synchronization for flock inventory, egg collection, 21-day hen and 40-day duck brooding schedules, sales, and Tanzanian Shilling financial analytics.
            </p>
            <p className="text-xs text-emerald-400 font-semibold mt-2 tracking-wide">
              Developed by CEO Junior Jackson Massawe
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <button
              onClick={() => onOpenQuickAction('sale')}
              className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center space-x-2"
            >
              <TrendingUp className="w-4 h-4" />
              <span>+ Record Sale</span>
            </button>
            <button
              onClick={() => onOpenQuickAction('poultry')}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl text-xs border border-slate-700 transition-all flex items-center space-x-2"
            >
              <Bird className="w-4 h-4" />
              <span>+ Register Poultry</span>
            </button>
            <button
              onClick={() => onNavigate('export')}
              className="px-4 py-2.5 bg-teal-800/60 hover:bg-teal-700/60 text-teal-100 font-semibold rounded-xl text-xs border border-teal-500/30 transition-all"
            >
              Excel Report (.xlsx)
            </button>
          </div>
        </div>
      </div>

      {/* Urgent Brooding Alerts if any */}
      {urgentBroodings.length > 0 && (
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-xl shadow-xs">
          <div className="flex items-start">
            <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 mr-3 shrink-0" />
            <div className="flex-1">
              <h2 className="text-sm font-bold text-amber-900">
                Brooding & Hatch Attention Needed ({urgentBroodings.length} batch{urgentBroodings.length > 1 ? 'es' : ''})
              </h2>
              <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {urgentBroodings.map((b) => (
                  <div
                    key={b.id}
                    onClick={() => onNavigate('brooding')}
                    className="cursor-pointer bg-white p-2.5 rounded-lg border border-amber-200 hover:border-amber-400 transition-colors shadow-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-900">{b.brooding_code}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          b.status === 'Overdue'
                            ? 'bg-rose-100 text-rose-800'
                            : b.status === 'Due Today'
                            ? 'bg-emerald-100 text-emerald-800 font-extrabold animate-pulse'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {b.status}
                      </span>
                    </div>
                    <div className="text-xs text-slate-600 mt-1">
                      {b.poultry_type} • {b.eggs_placed} eggs • Expected: {formatDate(b.expected_hatch_date)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 12 Live Metric Cards Grid as Required by Section 4 */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center justify-between">
          <span>Live Farm Key Indicators</span>
          <span className="text-[11px] font-normal lowercase text-slate-400">
            auto-calculated from database
          </span>
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3.5">
          {/* 1. Total Poultry */}
          <div
            onClick={() => onNavigate('poultry')}
            className="cursor-pointer bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs hover:border-emerald-500 hover:shadow-md transition-all group"
          >
            <div className="flex items-center justify-between text-slate-500 group-hover:text-emerald-600">
              <span className="text-xs font-semibold">Total Poultry</span>
              <Bird className="w-4 h-4" />
            </div>
            <div className="mt-2 text-2xl font-extrabold text-slate-900">
              {formatNumber(metrics.totalPoultry)}
            </div>
            <div className="text-[10px] text-slate-400 mt-1">Active live flock</div>
          </div>

          {/* 2. Total Hens */}
          <div
            onClick={() => onNavigate('poultry')}
            className="cursor-pointer bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs hover:border-emerald-500 hover:shadow-md transition-all group"
          >
            <div className="flex items-center justify-between text-slate-500 group-hover:text-emerald-600">
              <span className="text-xs font-semibold">Total Hens</span>
              <span className="text-xs">🐔</span>
            </div>
            <div className="mt-2 text-2xl font-extrabold text-slate-900">
              {formatNumber(metrics.totalHens)}
            </div>
            <div className="text-[10px] text-slate-400 mt-1">Layers & breeders</div>
          </div>

          {/* 3. Total Roosters */}
          <div
            onClick={() => onNavigate('poultry')}
            className="cursor-pointer bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs hover:border-emerald-500 hover:shadow-md transition-all group"
          >
            <div className="flex items-center justify-between text-slate-500 group-hover:text-emerald-600">
              <span className="text-xs font-semibold">Total Roosters</span>
              <span className="text-xs">🐓</span>
            </div>
            <div className="mt-2 text-2xl font-extrabold text-slate-900">
              {formatNumber(metrics.totalRoosters)}
            </div>
            <div className="text-[10px] text-slate-400 mt-1">Male breeders</div>
          </div>

          {/* 4. Total Ducks */}
          <div
            onClick={() => onNavigate('poultry')}
            className="cursor-pointer bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs hover:border-emerald-500 hover:shadow-md transition-all group"
          >
            <div className="flex items-center justify-between text-slate-500 group-hover:text-emerald-600">
              <span className="text-xs font-semibold">Total Ducks</span>
              <span className="text-xs">🦆</span>
            </div>
            <div className="mt-2 text-2xl font-extrabold text-slate-900">
              {formatNumber(metrics.totalDucks)}
            </div>
            <div className="text-[10px] text-slate-400 mt-1">Ducks & drakes</div>
          </div>

          {/* 5. Total Chicks */}
          <div
            onClick={() => onNavigate('poultry')}
            className="cursor-pointer bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs hover:border-emerald-500 hover:shadow-md transition-all group"
          >
            <div className="flex items-center justify-between text-slate-500 group-hover:text-emerald-600">
              <span className="text-xs font-semibold">Total Chicks</span>
              <span className="text-xs">🐣</span>
            </div>
            <div className="mt-2 text-2xl font-extrabold text-slate-900">
              {formatNumber(metrics.totalChicks)}
            </div>
            <div className="text-[10px] text-slate-400 mt-1">Growing brood</div>
          </div>

          {/* 6. Eggs Collected */}
          <div
            onClick={() => onNavigate('eggs')}
            className="cursor-pointer bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs hover:border-amber-500 hover:shadow-md transition-all group"
          >
            <div className="flex items-center justify-between text-slate-500 group-hover:text-amber-600">
              <span className="text-xs font-semibold">Eggs Collected</span>
              <Egg className="w-4 h-4" />
            </div>
            <div className="mt-2 text-2xl font-extrabold text-amber-900">
              {formatNumber(metrics.eggsCollected)}
            </div>
            <div className="text-[10px] text-slate-400 mt-1">Cumulative records</div>
          </div>

          {/* 7. Eggs Brooding */}
          <div
            onClick={() => onNavigate('brooding')}
            className="cursor-pointer bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs hover:border-indigo-500 hover:shadow-md transition-all group"
          >
            <div className="flex items-center justify-between text-slate-500 group-hover:text-indigo-600">
              <span className="text-xs font-semibold">Eggs Brooding</span>
              <Clock className="w-4 h-4" />
            </div>
            <div className="mt-2 text-2xl font-extrabold text-indigo-900">
              {formatNumber(metrics.eggsBrooding)}
            </div>
            <div className="text-[10px] text-slate-400 mt-1">In nest/incubators</div>
          </div>

          {/* 8. Expected Hatchings */}
          <div
            onClick={() => onNavigate('brooding')}
            className="cursor-pointer bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs hover:border-emerald-500 hover:shadow-md transition-all group"
          >
            <div className="flex items-center justify-between text-slate-500 group-hover:text-emerald-600">
              <span className="text-xs font-semibold">Expected Hatches</span>
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="mt-2 text-2xl font-extrabold text-emerald-900">
              {formatNumber(metrics.expectedHatchings)}
            </div>
            <div className="text-[10px] text-slate-400 mt-1">Active incubation</div>
          </div>

          {/* 9. Total Sales */}
          <div
            onClick={() => onNavigate('sales')}
            className="cursor-pointer bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs hover:border-blue-500 hover:shadow-md transition-all group"
          >
            <div className="flex items-center justify-between text-slate-500 group-hover:text-blue-600">
              <span className="text-xs font-semibold">Total Sales</span>
              <TrendingUp className="w-4 h-4 text-blue-600" />
            </div>
            <div className="mt-2 text-xl sm:text-2xl font-extrabold text-blue-900 truncate">
              {formatTZS(metrics.totalSales)}
            </div>
            <div className="text-[10px] text-slate-400 mt-1">Gross revenue</div>
          </div>

          {/* 10. Total Expenses */}
          <div
            onClick={() => onNavigate('expenses')}
            className="cursor-pointer bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs hover:border-rose-500 hover:shadow-md transition-all group"
          >
            <div className="flex items-center justify-between text-slate-500 group-hover:text-rose-600">
              <span className="text-xs font-semibold">Total Expenses</span>
              <Receipt className="w-4 h-4 text-rose-600" />
            </div>
            <div className="mt-2 text-xl sm:text-2xl font-extrabold text-rose-900 truncate">
              {formatTZS(metrics.totalExpenses)}
            </div>
            <div className="text-[10px] text-slate-400 mt-1">Operating costs</div>
          </div>

          {/* 11. Net Profit */}
          <div
            onClick={() => onNavigate('reports')}
            className={`cursor-pointer p-4 rounded-xl border shadow-xs transition-all ${
              metrics.netProfit >= 0
                ? 'bg-emerald-50/70 border-emerald-200 hover:border-emerald-400'
                : 'bg-rose-50/70 border-rose-200 hover:border-rose-400'
            }`}
          >
            <div className="flex items-center justify-between text-slate-600">
              <span className="text-xs font-bold">Net Profit</span>
              {metrics.netProfit >= 0 ? (
                <ArrowUpRight className="w-4 h-4 text-emerald-600" />
              ) : (
                <ArrowDownRight className="w-4 h-4 text-rose-600" />
              )}
            </div>
            <div
              className={`mt-2 text-xl sm:text-2xl font-black truncate ${
                metrics.netProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'
              }`}
            >
              {formatTZS(metrics.netProfit)}
            </div>
            <div className="text-[10px] text-slate-500 mt-1">Sales minus expenses</div>
          </div>

          {/* 12. Current Stock Value */}
          <div
            onClick={() => onNavigate('poultry')}
            className="cursor-pointer bg-gradient-to-br from-amber-50 to-orange-50/60 p-4 rounded-xl border border-amber-200/80 shadow-xs hover:border-amber-400 hover:shadow-md transition-all group"
          >
            <div className="flex items-center justify-between text-amber-800">
              <span className="text-xs font-bold">Stock Value</span>
              <Layers className="w-4 h-4 text-amber-700" />
            </div>
            <div className="mt-2 text-xl sm:text-2xl font-extrabold text-amber-950 truncate">
              {formatTZS(metrics.currentPoultryStockValue)}
            </div>
            <div className="text-[10px] text-amber-700/80 mt-1">Asset valuation (separate)</div>
          </div>
        </div>
      </div>

      {/* Financial Timeline Overview Cards */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Periodic Financial Breakdown</h2>
            <p className="text-xs text-slate-500">Real-time revenue, costs, and profit by timeframe</p>
          </div>
          <button
            onClick={() => onNavigate('reports')}
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center"
          >
            <span>Full Audit Report</span>
            <ArrowUpRight className="w-3.5 h-3.5 ml-0.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Today */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Today</span>
            <div className="mt-2 space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Revenue:</span>
                <span className="font-semibold text-blue-700">{formatTZS(metrics.revenueToday)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Expenses:</span>
                <span className="font-semibold text-rose-700">{formatTZS(metrics.expensesToday)}</span>
              </div>
              <div className="flex justify-between text-xs pt-1 border-t border-slate-200 font-bold">
                <span className="text-slate-700">Profit:</span>
                <span className={metrics.profitToday >= 0 ? 'text-emerald-700' : 'text-rose-700'}>
                  {formatTZS(metrics.profitToday)}
                </span>
              </div>
            </div>
          </div>

          {/* This Week */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">This Week</span>
            <div className="mt-2 space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Revenue:</span>
                <span className="font-semibold text-blue-700">{formatTZS(metrics.revenueThisWeek)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Expenses:</span>
                <span className="font-semibold text-rose-700">{formatTZS(metrics.expensesThisWeek)}</span>
              </div>
              <div className="flex justify-between text-xs pt-1 border-t border-slate-200 font-bold">
                <span className="text-slate-700">Profit:</span>
                <span className={metrics.profitThisWeek >= 0 ? 'text-emerald-700' : 'text-rose-700'}>
                  {formatTZS(metrics.profitThisWeek)}
                </span>
              </div>
            </div>
          </div>

          {/* This Month */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">This Month</span>
            <div className="mt-2 space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Revenue:</span>
                <span className="font-semibold text-blue-700">{formatTZS(metrics.revenueThisMonth)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Expenses:</span>
                <span className="font-semibold text-rose-700">{formatTZS(metrics.expensesThisMonth)}</span>
              </div>
              <div className="flex justify-between text-xs pt-1 border-t border-slate-200 font-bold">
                <span className="text-slate-700">Profit:</span>
                <span className={metrics.profitThisMonth >= 0 ? 'text-emerald-700' : 'text-rose-700'}>
                  {formatTZS(metrics.profitThisMonth)}
                </span>
              </div>
            </div>
          </div>

          {/* This Year */}
          <div className="p-3.5 rounded-xl bg-emerald-50/50 border border-emerald-200/80">
            <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">This Year</span>
            <div className="mt-2 space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Revenue:</span>
                <span className="font-semibold text-blue-700">{formatTZS(metrics.revenueThisYear)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Expenses:</span>
                <span className="font-semibold text-rose-700">{formatTZS(metrics.expensesThisYear)}</span>
              </div>
              <div className="flex justify-between text-xs pt-1 border-t border-emerald-200 font-bold">
                <span className="text-slate-700">Profit:</span>
                <span className={metrics.profitThisYear >= 0 ? 'text-emerald-700' : 'text-rose-700'}>
                  {formatTZS(metrics.profitThisYear)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Visual Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expenses by Category Breakdown */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-900 flex items-center">
              <Receipt className="w-4 h-4 mr-2 text-rose-600" />
              Expenses by Category
            </h2>
            <button
              onClick={() => onNavigate('expenses')}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800"
            >
              View all
            </button>
          </div>

          {sortedExpenseCategories.length === 0 ? (
            <div className="text-xs text-slate-400 py-6 text-center">No expense records yet</div>
          ) : (
            <div className="space-y-3">
              {sortedExpenseCategories.map(([category, amount]) => {
                const totalCost = metrics.totalExpenses || 1;
                const percent = Math.min(100, Math.round((amount / totalCost) * 100));
                return (
                  <div key={category} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium text-slate-700">{category}</span>
                      <span className="font-bold text-slate-900">
                        {formatTZS(amount)} <span className="text-slate-400 font-normal">({percent}%)</span>
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-rose-500 to-amber-500 rounded-full"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Sales by Product Breakdown */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-900 flex items-center">
              <TrendingUp className="w-4 h-4 mr-2 text-blue-600" />
              Sales Revenue by Product
            </h2>
            <button
              onClick={() => onNavigate('sales')}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800"
            >
              View all
            </button>
          </div>

          {sortedSalesProducts.length === 0 ? (
            <div className="text-xs text-slate-400 py-6 text-center">No sales records yet</div>
          ) : (
            <div className="space-y-3">
              {sortedSalesProducts.map(([product, amount]) => {
                const totalSales = metrics.totalSales || 1;
                const percent = Math.min(100, Math.round((amount / totalSales) * 100));
                return (
                  <div key={product} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium text-slate-700">{product}</span>
                      <span className="font-bold text-slate-900">
                        {formatTZS(amount)} <span className="text-slate-400 font-normal">({percent}%)</span>
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-teal-500 rounded-full"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Quick Activity / Operational Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Poultry Species Mix */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
          <h2 className="text-sm font-bold text-slate-900 mb-3 flex items-center">
            <Bird className="w-4 h-4 mr-2 text-emerald-600" />
            Flock Species Composition
          </h2>
          <div className="space-y-2.5">
            {[
              { label: 'Hens', count: metrics.totalHens, icon: '🐔', color: 'bg-emerald-500' },
              { label: 'Roosters', count: metrics.totalRoosters, icon: '🐓', color: 'bg-teal-500' },
              { label: 'Ducks & Drakes', count: metrics.totalDucks, icon: '🦆', color: 'bg-blue-500' },
              { label: 'Chicks', count: metrics.totalChicks, icon: '🐣', color: 'bg-amber-500' },
            ].map(item => {
              const total = metrics.totalPoultry || 1;
              const pct = Math.round((item.count / total) * 100);
              return (
                <div key={item.label} className="flex items-center justify-between text-xs py-1">
                  <div className="flex items-center space-x-2">
                    <span>{item.icon}</span>
                    <span className="text-slate-700 font-medium">{item.label}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-slate-400">{pct}%</span>
                    <span className="font-bold text-slate-900 min-w-8 text-right">
                      {formatNumber(item.count)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Brooding & Hatch Efficiency */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
          <h2 className="text-sm font-bold text-slate-900 mb-3 flex items-center">
            <Sparkles className="w-4 h-4 mr-2 text-indigo-600" />
            Incubation & Hatching Performance
          </h2>
          <div className="space-y-4">
            <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 flex items-center justify-between">
              <div>
                <div className="text-[11px] font-semibold text-indigo-800">Historical Hatch Rate</div>
                <div className="text-2xl font-black text-indigo-950 mt-0.5">{overallHatchRate}%</div>
              </div>
              <div className="w-12 h-12 rounded-full border-4 border-indigo-600 border-t-indigo-200 flex items-center justify-center font-bold text-xs text-indigo-900">
                {overallHatchRate}%
              </div>
            </div>

            <div className="text-xs space-y-2 text-slate-600">
              <div className="flex justify-between">
                <span>Active Hen Broodings (21d):</span>
                <span className="font-bold text-slate-900">
                  {brooding.filter(b => b.poultry_type === 'Hen' && b.status !== 'Hatched' && b.status !== 'Failed').length}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Active Duck Broodings (40d):</span>
                <span className="font-bold text-slate-900">
                  {brooding.filter(b => b.poultry_type === 'Duck' && b.status !== 'Hatched' && b.status !== 'Failed').length}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Total Hatched Chicks Produced:</span>
                <span className="font-bold text-emerald-700">
                  {formatNumber(hatch.reduce((acc, h) => acc + Number(h.chicks_produced), 0))}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Recent Transactions */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
          <h2 className="text-sm font-bold text-slate-900 mb-3 flex items-center">
            <DollarSign className="w-4 h-4 mr-2 text-emerald-600" />
            Recent Financial Operations
          </h2>
          <div className="space-y-2.5">
            {sales.slice(0, 2).map(s => (
              <div key={s.id} className="p-2.5 bg-blue-50/50 rounded-xl border border-blue-100 flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-slate-900">{s.product} ({s.quantity})</div>
                  <div className="text-[10px] text-slate-500">{s.customer} • {formatDate(s.date)}</div>
                </div>
                <div className="font-extrabold text-blue-700">+{formatTZS(s.total_amount)}</div>
              </div>
            ))}
            {expenses.slice(0, 2).map(e => (
              <div key={e.id} className="p-2.5 bg-rose-50/50 rounded-xl border border-rose-100 flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-slate-900">{e.category}</div>
                  <div className="text-[10px] text-slate-500 truncate max-w-[140px]">{e.description}</div>
                </div>
                <div className="font-extrabold text-rose-700">-{formatTZS(e.total_cost)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
