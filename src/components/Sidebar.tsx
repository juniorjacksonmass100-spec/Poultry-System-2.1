import React from 'react';
import {
  LayoutDashboard,
  Bird,
  Egg,
  Clock,
  Sparkles,
  TrendingUp,
  Receipt,
  FileBarChart2,
  FileSpreadsheet,
  Database,
  Settings,
  ShieldCheck,
  UserCheck,
  Award,
  PanelLeftClose,
  Radio,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export type NavTab =
  | 'dashboard'
  | 'poultry'
  | 'eggs'
  | 'brooding'
  | 'hatching'
  | 'sales'
  | 'expenses'
  | 'reports'
  | 'export'
  | 'supabase'
  | 'settings';

interface SidebarProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isOpen,
  onToggle,
}) => {
  const { profile, isAdmin } = useAuth();
  const { t } = useLanguage();

  // Define nav items with role restriction and localized labels
  const allNavItems: {
    id: NavTab;
    label: string;
    icon: React.ReactNode;
    badge?: string;
    adminOnly?: boolean;
  }[] = [
    { id: 'dashboard', label: t.dashboard, icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'poultry', label: t.poultryInventory, icon: <Bird className="w-5 h-5" /> },
    { id: 'eggs', label: t.eggProduction, icon: <Egg className="w-5 h-5" /> },
    { id: 'brooding', label: t.brooding, icon: <Clock className="w-5 h-5" /> },
    { id: 'hatching', label: t.hatchingResults, icon: <Sparkles className="w-5 h-5" /> },
    { id: 'sales', label: t.salesManagement, icon: <TrendingUp className="w-5 h-5" /> },
    { id: 'expenses', label: t.expenseTracking, icon: <Receipt className="w-5 h-5" /> },
    { id: 'reports', label: t.financialReports, icon: <FileBarChart2 className="w-5 h-5" /> },
    { id: 'export', label: t.excelExport, icon: <FileSpreadsheet className="w-5 h-5" />, badge: 'XLSX' },
    { id: 'supabase', label: t.supabaseDatabase, icon: <Database className="w-5 h-5" />, adminOnly: true },
    { id: 'settings', label: t.settings, icon: <Settings className="w-5 h-5" /> },
  ];

  const visibleNavItems = allNavItems.filter((item) => !item.adminOnly || isAdmin);

  const handleSelect = (tab: NavTab) => {
    setActiveTab(tab);
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      onToggle();
    }
  };

  return (
    <>
      {/* Mobile Backdrop overlay */}
      {isOpen && (
        <div
          onClick={onToggle}
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800 transition-transform duration-300 ease-in-out shadow-2xl ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand header with Close Toggle */}
        <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-emerald-500/20 shrink-0">
              <Bird className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <h1 className="text-white font-black text-sm tracking-wide uppercase leading-tight truncate">
                Kingdom Group
              </h1>
              <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-widest block">
                Poultry System
              </span>
            </div>
          </div>

          <button
            onClick={onToggle}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            title="Close Left Panel"
          >
            <PanelLeftClose className="w-5 h-5 text-slate-300 hover:text-white" />
          </button>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Menu ya Mfumo / System Menu
          </div>
          {visibleNavItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelect(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-emerald-600 to-emerald-700 text-white shadow-md shadow-emerald-950/40 ring-1 ring-emerald-400/30'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <span className={`${isActive ? 'text-emerald-200' : 'text-slate-400'}`}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                      isActive
                        ? 'bg-emerald-800/60 text-emerald-100'
                        : 'bg-slate-800 text-emerald-400'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* User Card & Live Status in Footer */}
        <div className="p-4 border-t border-slate-800/90 bg-slate-950/60">
          <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/60 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/10 rounded-full blur-xl pointer-events-none" />
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-emerald-500/60 shadow-md bg-slate-700 flex items-center justify-center text-white">
                  {isAdmin ? (
                    <img
                      src="/1787747918623.jpg"
                      alt="CEO Junior Jackson Massawe"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : null}
                  <span className="font-bold text-xs tracking-wider">
                    {profile?.full_name ? profile.full_name.substring(0, 2).toUpperCase() : 'ST'}
                  </span>
                </div>
                {/* Real-time online indicator dot */}
                <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-emerald-400 rounded-full ring-2 ring-slate-900 animate-pulse" />
                {isAdmin && (
                  <div
                    className="absolute -bottom-1 -right-1 bg-amber-500 text-slate-950 rounded-full p-0.5 shadow-xs"
                    title="Executive CEO Authority"
                  >
                    <Award className="w-3 h-3" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="text-[10px] font-medium text-slate-400 flex items-center space-x-1">
                  <span>{isAdmin ? 'Founder & CEO' : 'Staff Operator'}</span>
                </div>
                <div className="text-xs font-bold text-slate-100 truncate tracking-tight">
                  {profile?.full_name || 'Staff Member'}
                </div>
                <div className="text-[10px] text-emerald-400 font-semibold tracking-wide flex items-center mt-0.5">
                  {isAdmin ? (
                    <>
                      <ShieldCheck className="w-3 h-3 mr-1 inline text-amber-400" />
                      CEO Admin
                    </>
                  ) : (
                    <>
                      <UserCheck className="w-3 h-3 mr-1 inline text-emerald-400" />
                      Standard User
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
