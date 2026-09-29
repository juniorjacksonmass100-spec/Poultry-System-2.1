import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Download,
  CheckCircle,
  FileCheck,
  Layers,
  Bird,
  Egg,
  Clock,
  Sparkles,
  TrendingUp,
  Receipt,
  DollarSign,
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
import {
  exportMasterWorkbook,
  exportPoultryToExcel,
  exportEggsToExcel,
  exportBroodingToExcel,
  exportHatchToExcel,
  exportSalesToExcel,
  exportExpensesToExcel,
} from '../utils/excelExport';

interface ExcelExportViewProps {
  metrics: DashboardMetrics;
  poultry: PoultryItem[];
  eggs: EggRecord[];
  brooding: BroodingRecord[];
  hatch: HatchRecord[];
  sales: SaleRecord[];
  expenses: ExpenseRecord[];
}

export const ExcelExportView: React.FC<ExcelExportViewProps> = ({
  metrics,
  poultry,
  eggs,
  brooding,
  hatch,
  sales,
  expenses,
}) => {
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  const handleDownloadMaster = () => {
    exportMasterWorkbook(metrics, poultry, eggs, brooding, hatch, sales, expenses);
    setDownloadSuccess('Master Multi-Sheet Excel Workbook exported successfully!');
    setTimeout(() => setDownloadSuccess(null), 5000);
  };

  const handleExportIndividual = (type: string, fn: () => void) => {
    fn();
    setDownloadSuccess(`${type} Excel file exported successfully!`);
    setTimeout(() => setDownloadSuccess(null), 5000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 text-white rounded-2xl p-6 sm:p-8 shadow-xl border border-emerald-800/40 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold uppercase tracking-wider mb-2">
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Microsoft Excel (.xlsx) Engine</span>
            </div>
            <h1 className="text-2xl font-black">KINGDOM GROUP EXCEL DATA EXPORT</h1>
            <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-2xl">
              Export native Excel spreadsheets containing structured tables, numeric formatting, automated column autosizing, and Tanzanian Shilling currency formatting.
            </p>
          </div>

          <button
            onClick={handleDownloadMaster}
            className="px-6 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black rounded-xl text-sm shadow-xl shadow-emerald-500/20 transition-all flex items-center space-x-2 shrink-0 group"
          >
            <Download className="w-5 h-5 group-hover:-translate-y-0.5 transition-transform" />
            <span>DOWNLOAD COMPLETE MASTER WORKBOOK (8 SHEETS)</span>
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {downloadSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-900 text-xs flex items-center space-x-2">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="font-bold">{downloadSuccess}</span>
        </div>
      )}

      {/* Master 8-Worksheet Architecture Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center">
              <Layers className="w-5 h-5 mr-2 text-emerald-600" />
              Complete Master Workbook Structure (8 Worksheets)
            </h2>
            <p className="text-xs text-slate-500">
              Generated according to Section 17 of the Kingdom Group system requirements.
            </p>
          </div>
          <button
            onClick={handleDownloadMaster}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center space-x-1.5"
          >
            <Download className="w-4 h-4" />
            <span>Download Master (.xlsx)</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="font-bold text-slate-900 block mb-1">1. Dashboard Sheet</span>
            <p className="text-slate-500 text-[11px]">All 12 farm metrics, active incubation counts, and periodic P&L breakdown.</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="font-bold text-slate-900 block mb-1">2. Poultry Sheet</span>
            <p className="text-slate-500 text-[11px]">{poultry.length} flock records, breed classification, age in weeks, and bird values.</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="font-bold text-slate-900 block mb-1">3. Eggs Sheet</span>
            <p className="text-slate-500 text-[11px]">{eggs.length} daily logs: good, damaged, brooding, sold, consumed, and remaining store balance.</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="font-bold text-slate-900 block mb-1">4. Brooding Sheet</span>
            <p className="text-slate-500 text-[11px]">{brooding.length} incubation schedules (Hens 21d / Ducks 40d), expected hatch dates & statuses.</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="font-bold text-slate-900 block mb-1">5. Hatching Sheet</span>
            <p className="text-slate-500 text-[11px]">{hatch.length} hatch performance logs, hatch rate percentages, mortality, and inventory links.</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="font-bold text-slate-900 block mb-1">6. Sales Sheet</span>
            <p className="text-slate-500 text-[11px]">{sales.length} customer revenue transactions with quantity, unit prices, and payment methods.</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="font-bold text-slate-900 block mb-1">7. Expenses Sheet</span>
            <p className="text-slate-500 text-[11px]">{expenses.length} operating costs with categories, suppliers, unit costs, and total costs.</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="font-bold text-slate-900 block mb-1">8. Financial Summary</span>
            <p className="text-slate-500 text-[11px]">Audit sheet calculating Net Cash Profit and Live Stock Asset Value in TZS.</p>
          </div>
        </div>
      </div>

      {/* Individual Modular Exports */}
      <div>
        <h2 className="text-sm font-bold text-slate-900 mb-3">Individual Topic Excel Exports</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Poultry Export */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700">
                  <Bird className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Poultry Inventory</h3>
                  <span className="text-[11px] text-slate-500">{poultry.length} records ready</span>
                </div>
              </div>
              <p className="text-xs text-slate-500">
                Exports Poultry ID, type, breed, sex, quantity, age in weeks, source, and stock value.
              </p>
            </div>
            <button
              onClick={() => handleExportIndividual('Poultry Inventory', () => exportPoultryToExcel(poultry))}
              className="mt-4 w-full py-2 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 text-slate-700 rounded-xl text-xs font-bold transition-colors flex items-center justify-center space-x-1.5"
            >
              <Download className="w-4 h-4" />
              <span>Export Poultry (.xlsx)</span>
            </button>
          </div>

          {/* Egg Records Export */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <div className="p-2.5 rounded-xl bg-amber-50 text-amber-700">
                  <Egg className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Egg Production</h3>
                  <span className="text-[11px] text-slate-500">{eggs.length} daily logs</span>
                </div>
              </div>
              <p className="text-xs text-slate-500">
                Exports daily collected, good, damaged, brooding, sold, consumed, and remaining store balance.
              </p>
            </div>
            <button
              onClick={() => handleExportIndividual('Egg Production', () => exportEggsToExcel(eggs))}
              className="mt-4 w-full py-2 bg-slate-100 hover:bg-amber-50 hover:text-amber-800 text-slate-700 rounded-xl text-xs font-bold transition-colors flex items-center justify-center space-x-1.5"
            >
              <Download className="w-4 h-4" />
              <span>Export Eggs (.xlsx)</span>
            </button>
          </div>

          {/* Brooding Export */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-700">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Brooding Schedules</h3>
                  <span className="text-[11px] text-slate-500">{brooding.length} incubation batches</span>
                </div>
              </div>
              <p className="text-xs text-slate-500">
                Includes 21-day Hen schedules and 40-day Duck schedules with calculated expected hatch dates.
              </p>
            </div>
            <button
              onClick={() => handleExportIndividual('Brooding Schedules', () => exportBroodingToExcel(brooding))}
              className="mt-4 w-full py-2 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-800 text-slate-700 rounded-xl text-xs font-bold transition-colors flex items-center justify-center space-x-1.5"
            >
              <Download className="w-4 h-4" />
              <span>Export Brooding (.xlsx)</span>
            </button>
          </div>

          {/* Hatch Results Export */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Hatching Results</h3>
                  <span className="text-[11px] text-slate-500">{hatch.length} hatch events</span>
                </div>
              </div>
              <p className="text-xs text-slate-500">
                Eggs placed, hatched, failed, mortality, and calculated hatch rate percentage.
              </p>
            </div>
            <button
              onClick={() => handleExportIndividual('Hatching Results', () => exportHatchToExcel(hatch))}
              className="mt-4 w-full py-2 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 text-slate-700 rounded-xl text-xs font-bold transition-colors flex items-center justify-center space-x-1.5"
            >
              <Download className="w-4 h-4" />
              <span>Export Hatch Results (.xlsx)</span>
            </button>
          </div>

          {/* Sales Export */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <div className="p-2.5 rounded-xl bg-blue-50 text-blue-700">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Sales Transactions</h3>
                  <span className="text-[11px] text-slate-500">{sales.length} customer sales</span>
                </div>
              </div>
              <p className="text-xs text-slate-500">
                Detailed commercial records of all bird, egg, and manure sales with customer and payment details.
              </p>
            </div>
            <button
              onClick={() => handleExportIndividual('Sales Ledger', () => exportSalesToExcel(sales))}
              className="mt-4 w-full py-2 bg-slate-100 hover:bg-blue-50 hover:text-blue-800 text-slate-700 rounded-xl text-xs font-bold transition-colors flex items-center justify-center space-x-1.5"
            >
              <Download className="w-4 h-4" />
              <span>Export Sales (.xlsx)</span>
            </button>
          </div>

          {/* Expenses Export */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <div className="p-2.5 rounded-xl bg-rose-50 text-rose-700">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Farm Expenses</h3>
                  <span className="text-[11px] text-slate-500">{expenses.length} expense logs</span>
                </div>
              </div>
              <p className="text-xs text-slate-500">
                Expenditures on feed, medication, vaccines, transport, electricity, labour, and supplies.
              </p>
            </div>
            <button
              onClick={() => handleExportIndividual('Expenses Ledger', () => exportExpensesToExcel(expenses))}
              className="mt-4 w-full py-2 bg-slate-100 hover:bg-rose-50 hover:text-rose-800 text-slate-700 rounded-xl text-xs font-bold transition-colors flex items-center justify-center space-x-1.5"
            >
              <Download className="w-4 h-4" />
              <span>Export Expenses (.xlsx)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
