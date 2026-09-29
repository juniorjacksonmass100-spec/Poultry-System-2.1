import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Sidebar, NavTab } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { PoultryView } from './components/PoultryView';
import { EggProductionView } from './components/EggProductionView';
import { BroodingView } from './components/BroodingView';
import { HatchingView } from './components/HatchingView';
import { SalesView } from './components/SalesView';
import { ExpensesView } from './components/ExpensesView';
import { ReportsView } from './components/ReportsView';
import { ExcelExportView } from './components/ExcelExportView';
import { SettingsView } from './components/SettingsView';
import { SupabaseSetupModal } from './components/SupabaseSetupModal';
import { AuthModal } from './components/AuthModal';
import { db } from './services/db';
import {
  PoultryItem,
  EggRecord,
  BroodingRecord,
  HatchRecord,
  ExpenseRecord,
  SaleRecord,
  ExpenseCategory,
  DashboardMetrics,
} from './types';
import { Award, ShieldCheck, Heart, PanelLeft } from 'lucide-react';

function MainAppContent() {
  const { user, isAdmin, loading: authLoading } = useAuth();

  // Navigation & Modals
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);
  const [preselectedBrooding, setPreselectedBrooding] = useState<BroodingRecord | null>(null);

  // Quick Action Modal Trigger States
  const [openQuickAddPoultry, setOpenQuickAddPoultry] = useState(false);
  const [openQuickAddSale, setOpenQuickAddSale] = useState(false);
  const [openQuickAddExpense, setOpenQuickAddExpense] = useState(false);

  // Database Data States
  const [poultry, setPoultry] = useState<PoultryItem[]>([]);
  const [eggs, setEggs] = useState<EggRecord[]>([]);
  const [brooding, setBrooding] = useState<BroodingRecord[]>([]);
  const [hatch, setHatch] = useState<HatchRecord[]>([]);
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  // Load all data from db engine
  const loadAllData = useCallback(async () => {
    try {
      setDataLoading(true);
      const [
        pData,
        eData,
        bData,
        hData,
        sData,
        expData,
        cData,
      ] = await Promise.all([
        db.getPoultry(),
        db.getEggs(),
        db.getBrooding(),
        db.getHatchRecords(),
        db.getSales(),
        db.getExpenses(),
        db.getExpenseCategories(),
      ]);

      setPoultry(pData);
      setEggs(eData);
      setBrooding(bData);
      setHatch(hData);
      setSales(sData);
      setExpenses(expData);
      setCategories(cData);
    } catch (err) {
      console.error('Error loading farm data:', err);
    } finally {
      setDataLoading(false);
    }
  }, []);

  useEffect(() => {
    // One-time cleanup of legacy demo/sample records from local storage if present
    const DEMO_PURGE_KEY = 'kgp_sample_data_purged_v2';
    if (!localStorage.getItem(DEMO_PURGE_KEY)) {
      try {
        localStorage.removeItem('kgp_db_poultry');
        localStorage.removeItem('kgp_db_egg_records');
        localStorage.removeItem('kgp_db_brooding');
        localStorage.removeItem('kgp_db_hatch_records');
        localStorage.removeItem('kgp_db_sales');
        localStorage.removeItem('kgp_db_expenses');
        localStorage.setItem(DEMO_PURGE_KEY, 'true');
      } catch {
        // ignore
      }
    }

    loadAllData();
    // Subscribe to realtime database changes
    const unsubscribe = db.subscribeToChanges(() => {
      loadAllData();
    });
    return () => {
      unsubscribe();
    };
  }, [loadAllData]);

  // Handle Quick Actions
  const handleOpenQuickAction = (action: string) => {
    if (action === 'poultry') {
      setActiveTab('poultry');
      setOpenQuickAddPoultry(true);
    } else if (action === 'sale') {
      setActiveTab('sales');
      setOpenQuickAddSale(true);
    } else if (action === 'expense') {
      setActiveTab('expenses');
      setOpenQuickAddExpense(true);
    }
  };

  const handleOpenRecordHatchModal = (brd: BroodingRecord) => {
    setPreselectedBrooding(brd);
    setActiveTab('hatching');
  };

  // CRUD Handlers
  const handleAddPoultry = async (item: Omit<PoultryItem, 'id' | 'created_at' | 'updated_at'>) => {
    await db.addPoultry(item);
    await loadAllData();
  };

  const handleUpdatePoultry = async (id: string, updates: Partial<PoultryItem>) => {
    await db.updatePoultry(id, updates);
    await loadAllData();
  };

  const handleDeletePoultry = async (id: string) => {
    await db.deletePoultry(id);
    await loadAllData();
  };

  const handleAddEggRecord = async (record: Omit<EggRecord, 'id' | 'created_at'>) => {
    await db.addEggRecord(record);
    await loadAllData();
  };

  const handleDeleteEggRecord = async (id: string) => {
    await db.deleteEggRecord(id);
    await loadAllData();
  };

  const handleAddBrooding = async (record: Omit<BroodingRecord, 'id' | 'created_at' | 'updated_at'>) => {
    await db.addBrooding(record);
    await loadAllData();
  };

  const handleUpdateBrooding = async (id: string, updates: Partial<BroodingRecord>) => {
    await db.updateBrooding(id, updates);
    await loadAllData();
  };

  const handleDeleteBrooding = async (id: string) => {
    await db.deleteBrooding(id);
    await loadAllData();
  };

  const handleAddHatchRecord = async (record: Omit<HatchRecord, 'id' | 'created_at'>, addToInventory: boolean) => {
    const res = await db.addHatchRecord(record, addToInventory);
    await loadAllData();
    return res;
  };

  const handleDeleteHatchRecord = async (id: string) => {
    await db.deleteHatchRecord(id);
    await loadAllData();
  };

  const handleAddSale = async (record: Omit<SaleRecord, 'id' | 'created_at'>) => {
    await db.addSale(record);
    await loadAllData();
  };

  const handleDeleteSale = async (id: string) => {
    await db.deleteSale(id);
    await loadAllData();
  };

  const handleAddExpense = async (record: Omit<ExpenseRecord, 'id' | 'created_at'>) => {
    await db.addExpense(record);
    await loadAllData();
  };

  const handleDeleteExpense = async (id: string) => {
    await db.deleteExpense(id);
    await loadAllData();
  };

  const handleAddCategory = async (name: string) => {
    await db.addExpenseCategory(name);
    await loadAllData();
  };

  const handleResetAllData = async () => {
    const res = await db.resetAllData();
    await loadAllData();
    if (!res.success) {
      throw new Error(res.message);
    }
  };

  // CENTRAL AUTOMATIC METRIC CALCULATIONS (Sections 4, 14, 15, 27)
  const metrics: DashboardMetrics = useMemo(() => {
    // 1. Flock counts (only Active/non-dead/non-sold)
    const activePoultry = poultry.filter(
      (p) => p.current_status !== 'Sold' && p.current_status !== 'Dead'
    );
    const totalPoultry = activePoultry.reduce((acc, p) => acc + p.quantity, 0);
    const totalHens = activePoultry
      .filter((p) => p.type === 'Hen')
      .reduce((acc, p) => acc + p.quantity, 0);
    const totalRoosters = activePoultry
      .filter((p) => p.type === 'Rooster')
      .reduce((acc, p) => acc + p.quantity, 0);
    const totalDucks = activePoultry
      .filter((p) => p.type === 'Duck' || p.type === 'Drake')
      .reduce((acc, p) => acc + p.quantity, 0);
    const totalChicks = activePoultry
      .filter((p) => p.type === 'Chick')
      .reduce((acc, p) => acc + p.quantity, 0);

    // 2. Eggs
    const eggsCollected = eggs.reduce((acc, e) => acc + Number(e.total_eggs), 0);
    const activeBroodingBatches = brooding.filter(
      (b) => b.status !== 'Hatched' && b.status !== 'Failed' && b.status !== 'Completed'
    );
    const eggsBrooding = activeBroodingBatches.reduce((acc, b) => acc + Number(b.eggs_placed), 0);
    const expectedHatchings = eggsBrooding;

    // 3. Financial Totals
    const totalSales = sales.reduce((acc, s) => acc + Number(s.total_amount), 0);
    const totalExpenses = expenses.reduce((acc, e) => acc + Number(e.total_cost), 0);
    const netProfit = totalSales - totalExpenses;

    // 4. Poultry Stock Value = sum(Quantity * Estimated Unit Value)
    const currentPoultryStockValue = activePoultry.reduce(
      (acc, p) => acc + p.quantity * p.estimated_unit_value,
      0
    );

    // 5. Periodic Calculations
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    const startOfWeek = new Date(now);
    const day = startOfWeek.getDay() || 7;
    startOfWeek.setDate(startOfWeek.getDate() - day + 1);
    startOfWeek.setHours(0, 0, 0, 0);

    const isToday = (d: string) => d === todayStr;
    const isThisWeek = (d: string) => new Date(d) >= startOfWeek;
    const isThisMonth = (d: string) => {
      const dt = new Date(d);
      return dt.getFullYear() === now.getFullYear() && dt.getMonth() === now.getMonth();
    };
    const isThisYear = (d: string) => new Date(d).getFullYear() === now.getFullYear();

    const revenueToday = sales.filter((s) => isToday(s.date)).reduce((acc, s) => acc + Number(s.total_amount), 0);
    const revenueThisWeek = sales.filter((s) => isThisWeek(s.date)).reduce((acc, s) => acc + Number(s.total_amount), 0);
    const revenueThisMonth = sales.filter((s) => isThisMonth(s.date)).reduce((acc, s) => acc + Number(s.total_amount), 0);
    const revenueThisYear = sales.filter((s) => isThisYear(s.date)).reduce((acc, s) => acc + Number(s.total_amount), 0);

    const expensesToday = expenses.filter((e) => isToday(e.date)).reduce((acc, e) => acc + Number(e.total_cost), 0);
    const expensesThisWeek = expenses.filter((e) => isThisWeek(e.date)).reduce((acc, e) => acc + Number(e.total_cost), 0);
    const expensesThisMonth = expenses.filter((e) => isThisMonth(e.date)).reduce((acc, e) => acc + Number(e.total_cost), 0);
    const expensesThisYear = expenses.filter((e) => isThisYear(e.date)).reduce((acc, e) => acc + Number(e.total_cost), 0);

    return {
      totalPoultry,
      totalHens,
      totalRoosters,
      totalDucks,
      totalChicks,
      eggsCollected,
      eggsBrooding,
      expectedHatchings,
      totalSales,
      totalExpenses,
      netProfit,
      currentPoultryStockValue,
      revenueToday,
      revenueThisWeek,
      revenueThisMonth,
      revenueThisYear,
      expensesToday,
      expensesThisWeek,
      expensesThisMonth,
      expensesThisYear,
      profitToday: revenueToday - expensesToday,
      profitThisWeek: revenueThisWeek - expensesThisWeek,
      profitThisMonth: revenueThisMonth - expensesThisMonth,
      profitThisYear: revenueThisYear - expensesThisYear,
    };
  }, [poultry, eggs, brooding, sales, expenses]);

  // Protected Routes Check (Section 3)
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold text-slate-400">Loading Kingdom Group Poultry System...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <AuthModal onOpenSupabaseModal={() => setIsSupabaseModalOpen(true)} />
        <SupabaseSetupModal
          isOpen={isSupabaseModalOpen}
          onClose={() => setIsSupabaseModalOpen(false)}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-800">
      {/* Top Navigation */}
      <Navbar
        onOpenSupabaseModal={() => setIsSupabaseModalOpen(true)}
        onOpenQuickAction={handleOpenQuickAction}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        isSidebarOpen={isSidebarOpen}
        activeTab={activeTab}
      />

      <div className="flex-1 flex max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isOpen={isSidebarOpen}
          onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        />

        {/* Main Content Area */}
        <main
          className={`flex-1 transition-all duration-300 min-w-0 ${
            isSidebarOpen ? 'lg:pl-64' : 'lg:pl-0'
          }`}
        >
          {activeTab === 'dashboard' && (
            <DashboardView
              metrics={metrics}
              poultry={poultry}
              eggs={eggs}
              brooding={brooding}
              hatch={hatch}
              sales={sales}
              expenses={expenses}
              onNavigate={(tab) => setActiveTab(tab)}
              onOpenQuickAction={handleOpenQuickAction}
            />
          )}

          {activeTab === 'poultry' && (
            <PoultryView
              poultry={poultry}
              onAddPoultry={handleAddPoultry}
              onUpdatePoultry={handleUpdatePoultry}
              onDeletePoultry={handleDeletePoultry}
              isOpenAddModalDefault={openQuickAddPoultry}
            />
          )}

          {activeTab === 'eggs' && (
            <EggProductionView
              eggs={eggs}
              poultry={poultry}
              onAddEggRecord={handleAddEggRecord}
              onDeleteEggRecord={handleDeleteEggRecord}
            />
          )}

          {activeTab === 'brooding' && (
            <BroodingView
              brooding={brooding}
              poultry={poultry}
              onAddBrooding={handleAddBrooding}
              onUpdateBrooding={handleUpdateBrooding}
              onDeleteBrooding={handleDeleteBrooding}
              onOpenRecordHatchModal={handleOpenRecordHatchModal}
            />
          )}

          {activeTab === 'hatching' && (
            <HatchingView
              hatch={hatch}
              brooding={brooding}
              onAddHatchRecord={handleAddHatchRecord}
              onDeleteHatchRecord={handleDeleteHatchRecord}
              preselectedBrooding={preselectedBrooding}
              onClearPreselectedBrooding={() => setPreselectedBrooding(null)}
            />
          )}

          {activeTab === 'sales' && (
            <SalesView
              sales={sales}
              poultry={poultry}
              onAddSale={handleAddSale}
              onDeleteSale={handleDeleteSale}
              isOpenAddDefault={openQuickAddSale}
            />
          )}

          {activeTab === 'expenses' && (
            <ExpensesView
              expenses={expenses}
              categories={categories}
              onAddExpense={handleAddExpense}
              onDeleteExpense={handleDeleteExpense}
              onAddCategory={handleAddCategory}
              isOpenAddDefault={openQuickAddExpense}
            />
          )}

          {activeTab === 'reports' && (
            <ReportsView
              metrics={metrics}
              poultry={poultry}
              eggs={eggs}
              brooding={brooding}
              hatch={hatch}
              sales={sales}
              expenses={expenses}
            />
          )}

          {activeTab === 'export' && (
            <ExcelExportView
              metrics={metrics}
              poultry={poultry}
              eggs={eggs}
              brooding={brooding}
              hatch={hatch}
              sales={sales}
              expenses={expenses}
            />
          )}

          {activeTab === 'supabase' && isAdmin && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
              <h2 className="text-lg font-bold text-slate-900">Supabase SQL Editor & Architecture</h2>
              <p className="text-xs text-slate-500">
                Manage your live PostgreSQL tables, Row Level Security policies, and connection keys.
              </p>
              <button
                onClick={() => setIsSupabaseModalOpen(true)}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs"
              >
                Open SQL Schema & Credentials Dialog
              </button>
            </div>
          )}

          {activeTab === 'settings' && (
            <SettingsView
              onOpenSupabaseModal={() => setIsSupabaseModalOpen(true)}
              onResetAllData={handleResetAllData}
            />
          )}
        </main>
      </div>

      {/* Floating Toggle Button when Left Panel is Closed */}
      {!isSidebarOpen && (
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="fixed left-3 bottom-6 z-30 px-3.5 py-2.5 bg-slate-900 text-white rounded-xl shadow-2xl flex items-center space-x-2 text-xs font-bold border border-slate-700 hover:bg-slate-800 transition-all hover:scale-105 group no-print"
          title="Open Side Menu Panel"
        >
          <PanelLeft className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
          <span>Open Menu</span>
        </button>
      )}

      {/* Supabase Setup Modal */}
      <SupabaseSetupModal
        isOpen={isSupabaseModalOpen}
        onClose={() => setIsSupabaseModalOpen(false)}
      />

      {/* Professional Footer (Section 34) */}
      <footer className="mt-12 bg-white border-t border-slate-200/80 py-6 text-center text-xs text-slate-500 no-print">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <span className="font-extrabold text-slate-900 tracking-tight">
              KINGDOM GROUP POULTRY MANAGEMENT
            </span>
            <span className="text-slate-300">•</span>
            <span>All rights reserved</span>
          </div>

          <div className="flex items-center space-x-1.5 font-medium text-slate-700">
            <span>Developed by</span>
            <span className="font-extrabold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
              CEO Junior Jackson Massawe
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

import { LanguageProvider } from './context/LanguageContext';

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <MainAppContent />
      </AuthProvider>
    </LanguageProvider>
  );
}
