import * as XLSX from 'xlsx';
import {
  PoultryItem,
  EggRecord,
  BroodingRecord,
  HatchRecord,
  ExpenseRecord,
  SaleRecord,
  DashboardMetrics,
} from '../types';
import { formatDate } from './calculations';

/**
 * Helper to trigger browser download of an XLSX workbook
 */
function downloadWorkbook(workbook: XLSX.WorkBook, filename: string) {
  XLSX.writeFile(workbook, `${filename}.xlsx`, { compression: true });
}

/**
 * Auto-fit column widths
 */
function autoFitColumns(rows: (string | number | boolean | null | undefined)[][]): XLSX.ColInfo[] {
  if (!rows || rows.length === 0) return [];
  const colCount = Math.max(...rows.map(r => r.length));
  const colWidths: number[] = new Array(colCount).fill(12);

  rows.forEach(row => {
    row.forEach((val, colIdx) => {
      const strVal = val != null ? String(val) : '';
      if (strVal.length + 3 > colWidths[colIdx]) {
        colWidths[colIdx] = Math.min(45, strVal.length + 3);
      }
    });
  });

  return colWidths.map(w => ({ wch: w }));
}

/**
 * 1. Export Poultry Inventory
 */
export function exportPoultryToExcel(items: PoultryItem[]) {
  const headers = [
    'Poultry ID',
    'Type',
    'Breed',
    'Sex',
    'Quantity',
    'Age (Weeks)',
    'Acquired Date',
    'Source',
    'Purchase Price (TZS)',
    'Estimated Unit Value (TZS)',
    'Total Stock Value (TZS)',
    'Status',
    'Notes',
  ];

  const dataRows = items.map(p => [
    p.poultry_id,
    p.type,
    p.breed,
    p.sex,
    Number(p.quantity),
    Number(p.age_weeks),
    formatDate(p.date_acquired),
    p.source,
    Number(p.purchase_price),
    Number(p.estimated_unit_value),
    Number(p.quantity) * Number(p.estimated_unit_value),
    p.current_status,
    p.notes || '',
  ]);

  const allRows = [
    ['KINGDOM GROUP POULTRY MANAGEMENT - POULTRY INVENTORY'],
    [`Generated: ${new Date().toLocaleString('en-GB')}`],
    [],
    headers,
    ...dataRows,
  ];

  const ws = XLSX.utils.aoa_to_sheet(allRows);
  ws['!cols'] = autoFitColumns(allRows);

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Poultry Inventory');
  downloadWorkbook(wb, `KGP_Poultry_Inventory_${new Date().toISOString().split('T')[0]}`);
}

/**
 * 2. Export Egg Production Records
 */
export function exportEggsToExcel(records: EggRecord[]) {
  const headers = [
    'Date',
    'Hen / Batch ID',
    'Total Eggs Collected',
    'Good Eggs',
    'Damaged Eggs',
    'Eggs Brooding',
    'Eggs Sold',
    'Eggs Consumed',
    'Eggs Remaining',
    'Notes',
  ];

  const dataRows = records.map(e => [
    formatDate(e.date),
    e.hen_id,
    Number(e.total_eggs),
    Number(e.good_eggs),
    Number(e.damaged_eggs),
    Number(e.eggs_brooding),
    Number(e.eggs_sold),
    Number(e.eggs_consumed),
    Number(e.eggs_remaining),
    e.notes || '',
  ]);

  const allRows = [
    ['KINGDOM GROUP POULTRY MANAGEMENT - EGG PRODUCTION LOG'],
    [`Generated: ${new Date().toLocaleString('en-GB')}`],
    [],
    headers,
    ...dataRows,
  ];

  const ws = XLSX.utils.aoa_to_sheet(allRows);
  ws['!cols'] = autoFitColumns(allRows);

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Egg Records');
  downloadWorkbook(wb, `KGP_Egg_Production_${new Date().toISOString().split('T')[0]}`);
}

/**
 * 3. Export Brooding Records
 */
export function exportBroodingToExcel(records: BroodingRecord[]) {
  const headers = [
    'Brooding ID',
    'Parent Hen/Duck ID',
    'Poultry Type',
    'Breed',
    'Eggs Placed',
    'Start Date',
    'Expected Hatch Date',
    'Actual Hatch Date',
    'Status',
    'Hatched',
    'Failed',
    'Notes',
  ];

  const dataRows = records.map(b => [
    b.brooding_code,
    b.parent_poultry_id,
    b.poultry_type,
    b.breed,
    Number(b.eggs_placed),
    formatDate(b.start_date),
    formatDate(b.expected_hatch_date),
    b.actual_hatch_date ? formatDate(b.actual_hatch_date) : 'Pending',
    b.status,
    Number(b.hatched_count || 0),
    Number(b.failed_count || 0),
    b.notes || '',
  ]);

  const allRows = [
    ['KINGDOM GROUP POULTRY MANAGEMENT - BROODING & INCUBATION SCHEDULE'],
    ['Hen incubation: 21 days | Duck incubation: 40 days'],
    [`Generated: ${new Date().toLocaleString('en-GB')}`],
    [],
    headers,
    ...dataRows,
  ];

  const ws = XLSX.utils.aoa_to_sheet(allRows);
  ws['!cols'] = autoFitColumns(allRows);

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Brooding Records');
  downloadWorkbook(wb, `KGP_Brooding_Records_${new Date().toISOString().split('T')[0]}`);
}

/**
 * 4. Export Hatch Records
 */
export function exportHatchToExcel(records: HatchRecord[]) {
  const headers = [
    'Hatch Date',
    'Brooding Reference',
    'Species',
    'Breed',
    'Eggs Placed',
    'Eggs Hatched',
    'Eggs Failed',
    'Chicks Produced',
    'Hatch Rate (%)',
    'Mortality',
    'Added To Inventory',
    'Inventory Bird ID',
    'Notes',
  ];

  const dataRows = records.map(h => [
    formatDate(h.date),
    h.brooding_code || h.brooding_id,
    h.poultry_type || 'Hen',
    h.breed || '-',
    Number(h.eggs_placed),
    Number(h.eggs_hatched),
    Number(h.eggs_failed),
    Number(h.chicks_produced),
    Number(h.hatch_rate),
    Number(h.mortality_count),
    h.added_to_inventory ? 'Yes' : 'No',
    h.inventory_poultry_id || '-',
    h.notes || '',
  ]);

  const allRows = [
    ['KINGDOM GROUP POULTRY MANAGEMENT - HATCHING PERFORMANCE RESULTS'],
    [`Generated: ${new Date().toLocaleString('en-GB')}`],
    [],
    headers,
    ...dataRows,
  ];

  const ws = XLSX.utils.aoa_to_sheet(allRows);
  ws['!cols'] = autoFitColumns(allRows);

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Hatching Results');
  downloadWorkbook(wb, `KGP_Hatching_Results_${new Date().toISOString().split('T')[0]}`);
}

/**
 * 5. Export Sales
 */
export function exportSalesToExcel(sales: SaleRecord[]) {
  const headers = [
    'Sale ID',
    'Date',
    'Product',
    'Category',
    'Quantity',
    'Unit Price (TZS)',
    'Total Amount (TZS)',
    'Customer',
    'Payment Method',
    'Notes',
  ];

  const dataRows = sales.map(s => [
    s.sale_code,
    formatDate(s.date),
    s.product,
    s.category,
    Number(s.quantity),
    Number(s.unit_price),
    Number(s.total_amount),
    s.customer,
    s.payment_method,
    s.notes || '',
  ]);

  const allRows = [
    ['KINGDOM GROUP POULTRY MANAGEMENT - SALES LEDGER'],
    [`Generated: ${new Date().toLocaleString('en-GB')}`],
    [],
    headers,
    ...dataRows,
  ];

  const ws = XLSX.utils.aoa_to_sheet(allRows);
  ws['!cols'] = autoFitColumns(allRows);

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Sales Ledger');
  downloadWorkbook(wb, `KGP_Sales_${new Date().toISOString().split('T')[0]}`);
}

/**
 * 6. Export Expenses
 */
export function exportExpensesToExcel(expenses: ExpenseRecord[]) {
  const headers = [
    'Expense ID',
    'Date',
    'Category',
    'Description',
    'Quantity',
    'Unit Cost (TZS)',
    'Total Cost (TZS)',
    'Payment Method',
    'Supplier',
    'Notes',
  ];

  const dataRows = expenses.map(e => [
    e.expense_code,
    formatDate(e.date),
    e.category,
    e.description,
    Number(e.quantity),
    Number(e.unit_cost),
    Number(e.total_cost),
    e.payment_method,
    e.supplier || '',
    e.notes || '',
  ]);

  const allRows = [
    ['KINGDOM GROUP POULTRY MANAGEMENT - EXPENSES LEDGER'],
    [`Generated: ${new Date().toLocaleString('en-GB')}`],
    [],
    headers,
    ...dataRows,
  ];

  const ws = XLSX.utils.aoa_to_sheet(allRows);
  ws['!cols'] = autoFitColumns(allRows);

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Expenses');
  downloadWorkbook(wb, `KGP_Expenses_${new Date().toISOString().split('T')[0]}`);
}

/**
 * 7. COMPLETE MASTER WORKBOOK EXPORT (8 Dedicated Worksheets)
 * As required by section 17 of specifications:
 * 1. Dashboard
 * 2. Poultry
 * 3. Eggs
 * 4. Brooding
 * 5. Hatching
 * 6. Sales
 * 7. Expenses
 * 8. Financial Summary
 */
export function exportMasterWorkbook(
  metrics: DashboardMetrics,
  poultry: PoultryItem[],
  eggs: EggRecord[],
  brooding: BroodingRecord[],
  hatch: HatchRecord[],
  sales: SaleRecord[],
  expenses: ExpenseRecord[]
) {
  const wb = XLSX.utils.book_new();

  // 1. Dashboard Worksheet
  const dashRows = [
    ['KINGDOM GROUP POULTRY MANAGEMENT - MASTER OPERATIONAL SUMMARY'],
    ['Developed by CEO Junior Jackson Massawe'],
    [`Report Date: ${new Date().toLocaleString('en-GB')}`],
    [],
    ['KEY PERFORMANCE INDICATORS', 'VALUE', 'UNIT / CURRENCY'],
    ['Total Live Flock', metrics.totalPoultry, 'Birds'],
    ['Total Hens', metrics.totalHens, 'Birds'],
    ['Total Roosters', metrics.totalRoosters, 'Birds'],
    ['Total Ducks & Drakes', metrics.totalDucks, 'Birds'],
    ['Total Chicks & Ducklings', metrics.totalChicks, 'Birds'],
    ['Total Eggs Collected (All-Time)', metrics.eggsCollected, 'Eggs'],
    ['Eggs Currently Brooding', metrics.eggsBrooding, 'Eggs'],
    ['Expected Hatchings (Active)', metrics.expectedHatchings, 'Eggs'],
    ['Total Sales Revenue', metrics.totalSales, 'TZS'],
    ['Total Farm Expenses', metrics.totalExpenses, 'TZS'],
    ['Net Cash Profit', metrics.netProfit, 'TZS'],
    ['Estimated Poultry Stock Value', metrics.currentPoultryStockValue, 'TZS'],
    [],
    ['PERIODIC FINANCIAL BREAKDOWN', 'SALES REVENUE (TZS)', 'EXPENSES (TZS)', 'NET PROFIT (TZS)'],
    ['Today', metrics.revenueToday, metrics.expensesToday, metrics.profitToday],
    ['This Week', metrics.revenueThisWeek, metrics.expensesThisWeek, metrics.profitThisWeek],
    ['This Month', metrics.revenueThisMonth, metrics.expensesThisMonth, metrics.profitThisMonth],
    ['This Year', metrics.revenueThisYear, metrics.expensesThisYear, metrics.profitThisYear],
  ];
  const wsDash = XLSX.utils.aoa_to_sheet(dashRows);
  wsDash['!cols'] = autoFitColumns(dashRows);
  XLSX.utils.book_append_sheet(wb, wsDash, 'Dashboard');

  // 2. Poultry Worksheet
  const poultryRows = [
    ['POULTRY INVENTORY ROSTER'],
    ['Poultry ID', 'Type', 'Breed', 'Sex', 'Quantity', 'Age (Weeks)', 'Acquired Date', 'Source', 'Purchase Price (TZS)', 'Estimated Unit Value (TZS)', 'Total Stock Value (TZS)', 'Status', 'Notes'],
    ...poultry.map(p => [
      p.poultry_id,
      p.type,
      p.breed,
      p.sex,
      Number(p.quantity),
      Number(p.age_weeks),
      p.date_acquired,
      p.source,
      Number(p.purchase_price),
      Number(p.estimated_unit_value),
      Number(p.quantity) * Number(p.estimated_unit_value),
      p.current_status,
      p.notes || '',
    ]),
  ];
  const wsPoultry = XLSX.utils.aoa_to_sheet(poultryRows);
  wsPoultry['!cols'] = autoFitColumns(poultryRows);
  XLSX.utils.book_append_sheet(wb, wsPoultry, 'Poultry');

  // 3. Eggs Worksheet
  const eggRows = [
    ['EGG PRODUCTION HISTORY'],
    ['Date', 'Hen / Batch ID', 'Total Collected', 'Good Eggs', 'Damaged Eggs', 'Eggs Brooding', 'Eggs Sold', 'Eggs Consumed', 'Remaining In Store', 'Notes'],
    ...eggs.map(e => [
      e.date,
      e.hen_id,
      Number(e.total_eggs),
      Number(e.good_eggs),
      Number(e.damaged_eggs),
      Number(e.eggs_brooding),
      Number(e.eggs_sold),
      Number(e.eggs_consumed),
      Number(e.eggs_remaining),
      e.notes || '',
    ]),
  ];
  const wsEggs = XLSX.utils.aoa_to_sheet(eggRows);
  wsEggs['!cols'] = autoFitColumns(eggRows);
  XLSX.utils.book_append_sheet(wb, wsEggs, 'Eggs');

  // 4. Brooding Worksheet
  const broodingRows = [
    ['BROODING & INCUBATION REGISTRY (HENS 21 DAYS | DUCKS 40 DAYS)'],
    ['Brooding Code', 'Parent Hen/Duck ID', 'Species', 'Breed', 'Eggs Placed', 'Start Date', 'Expected Hatch Date', 'Actual Hatch Date', 'Status', 'Hatched', 'Failed', 'Notes'],
    ...brooding.map(b => [
      b.brooding_code,
      b.parent_poultry_id,
      b.poultry_type,
      b.breed,
      Number(b.eggs_placed),
      b.start_date,
      b.expected_hatch_date,
      b.actual_hatch_date || '-',
      b.status,
      Number(b.hatched_count || 0),
      Number(b.failed_count || 0),
      b.notes || '',
    ]),
  ];
  const wsBrooding = XLSX.utils.aoa_to_sheet(broodingRows);
  wsBrooding['!cols'] = autoFitColumns(broodingRows);
  XLSX.utils.book_append_sheet(wb, wsBrooding, 'Brooding');

  // 5. Hatching Worksheet
  const hatchRows = [
    ['HATCHING RESULTS & CHICK RECRUITMENT'],
    ['Date', 'Brooding Reference', 'Species', 'Breed', 'Eggs Placed', 'Eggs Hatched', 'Eggs Failed', 'Chicks Produced', 'Hatch Rate (%)', 'Mortality', 'Added To Inventory', 'Flock Poultry ID', 'Notes'],
    ...hatch.map(h => [
      h.date,
      h.brooding_code || h.brooding_id,
      h.poultry_type || 'Hen',
      h.breed || '-',
      Number(h.eggs_placed),
      Number(h.eggs_hatched),
      Number(h.eggs_failed),
      Number(h.chicks_produced),
      Number(h.hatch_rate),
      Number(h.mortality_count),
      h.added_to_inventory ? 'Yes' : 'No',
      h.inventory_poultry_id || '-',
      h.notes || '',
    ]),
  ];
  const wsHatch = XLSX.utils.aoa_to_sheet(hatchRows);
  wsHatch['!cols'] = autoFitColumns(hatchRows);
  XLSX.utils.book_append_sheet(wb, wsHatch, 'Hatching');

  // 6. Sales Worksheet
  const salesRows = [
    ['SALES REVENUE TRANSACTIONS'],
    ['Sale ID', 'Date', 'Product', 'Category', 'Quantity', 'Unit Price (TZS)', 'Total Amount (TZS)', 'Customer', 'Payment Method', 'Notes'],
    ...sales.map(s => [
      s.sale_code,
      s.date,
      s.product,
      s.category,
      Number(s.quantity),
      Number(s.unit_price),
      Number(s.total_amount),
      s.customer,
      s.payment_method,
      s.notes || '',
    ]),
  ];
  const wsSales = XLSX.utils.aoa_to_sheet(salesRows);
  wsSales['!cols'] = autoFitColumns(salesRows);
  XLSX.utils.book_append_sheet(wb, wsSales, 'Sales');

  // 7. Expenses Worksheet
  const expenseRows = [
    ['FARM EXPENSES TRANSACTIONS'],
    ['Expense ID', 'Date', 'Category', 'Description', 'Quantity', 'Unit Cost (TZS)', 'Total Cost (TZS)', 'Payment Method', 'Supplier', 'Notes'],
    ...expenses.map(e => [
      e.expense_code,
      e.date,
      e.category,
      e.description,
      Number(e.quantity),
      Number(e.unit_cost),
      Number(e.total_cost),
      e.payment_method,
      e.supplier || '',
      e.notes || '',
    ]),
  ];
  const wsExpenses = XLSX.utils.aoa_to_sheet(expenseRows);
  wsExpenses['!cols'] = autoFitColumns(expenseRows);
  XLSX.utils.book_append_sheet(wb, wsExpenses, 'Expenses');

  // 8. Financial Summary Worksheet
  const financialRows = [
    ['FINANCIAL AUDIT & PROFIT/LOSS STATEMENT'],
    ['KINGDOM GROUP POULTRY MANAGEMENT - CEO JUNIOR JACKSON MASSAWE'],
    [],
    ['METRIC', 'AMOUNT (TZS)', 'NOTES'],
    ['Total Gross Sales', metrics.totalSales, 'Cumulative sales revenue'],
    ['Total Operational Expenses', metrics.totalExpenses, 'Cumulative operating cost'],
    ['Net Cash Profit', metrics.netProfit, 'Total Revenue - Total Expenses'],
    ['Live Poultry Asset Value', metrics.currentPoultryStockValue, 'Valuation of active birds in stock'],
    ['Combined Equity (Profit + Assets)', metrics.netProfit + metrics.currentPoultryStockValue, 'True commercial farm equity'],
  ];
  const wsFinancial = XLSX.utils.aoa_to_sheet(financialRows);
  wsFinancial['!cols'] = autoFitColumns(financialRows);
  XLSX.utils.book_append_sheet(wb, wsFinancial, 'Financial Summary');

  // Save the complete master file
  downloadWorkbook(wb, `KINGDOM_GROUP_POULTRY_MASTER_REPORT_${new Date().toISOString().split('T')[0]}`);
}
