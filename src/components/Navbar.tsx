import React from 'react';
import {
  Bird,
  Database,
  Shield,
  UserCheck,
  LogOut,
  PlusCircle,
  PanelLeft,
  Languages,
  Wifi,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { isSupabaseConfigured } from '../services/supabase';

interface NavbarProps {
  onOpenSupabaseModal: () => void;
  onOpenQuickAction: (action: string) => void;
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
  activeTab: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenSupabaseModal,
  onOpenQuickAction,
  onToggleSidebar,
  isSidebarOpen,
}) => {
  const { profile, isAdmin, signOut } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const isConnected = isSupabaseConfigured();

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'sw' : 'en');
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Sidebar Toggle Button & Logo */}
          <div className="flex items-center space-x-2.5 sm:space-x-3">
            <button
              onClick={onToggleSidebar}
              className="p-2 rounded-xl text-slate-700 hover:text-slate-950 hover:bg-slate-100 border border-slate-200 transition-all flex items-center space-x-1.5 font-bold text-xs shadow-2xs"
              aria-label="Toggle Side Panel"
              title={isSidebarOpen ? 'Close Side Menu' : 'Open Side Menu'}
            >
              <PanelLeft className="w-4 h-4 text-emerald-700" />
              <span className="hidden sm:inline text-slate-800">
                {isSidebarOpen ? 'Hide Menu' : 'Show Menu'}
              </span>
            </button>

            <div className="flex items-center space-x-2.5 sm:space-x-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 flex items-center justify-center text-white shadow-md shadow-emerald-900/10 ring-2 ring-emerald-500/20 shrink-0">
                <Bird className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <div className="flex items-center space-x-1.5 sm:space-x-2">
                  <span className="font-extrabold text-slate-900 text-sm sm:text-lg tracking-tight uppercase truncate">
                    Kingdom Group
                  </span>
                  <span className="hidden md:inline-block px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase bg-emerald-100 text-emerald-800 rounded-md">
                    Poultry
                  </span>
                </div>
                <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium tracking-wide truncate max-w-[150px] sm:max-w-none">
                  CEO <span className="font-semibold text-emerald-700">Junior Jackson Massawe</span>
                </p>
              </div>
            </div>
          </div>

          {/* Right: Language switch, quick actions, admin sync pill, role badge, signout */}
          <div className="flex items-center space-x-1.5 sm:space-x-3">
            {/* Language Switch Button (English / Kiswahili) */}
            <button
              onClick={toggleLanguage}
              className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl border border-emerald-300 bg-emerald-50/70 hover:bg-emerald-100 text-emerald-800 font-bold text-xs transition-colors shadow-2xs"
              title="Badili Lugha / Switch Language (English / Kiswahili)"
            >
              <Languages className="w-3.5 h-3.5 text-emerald-700" />
              <span className="uppercase text-[11px] tracking-wider">{language === 'en' ? 'SW' : 'EN'}</span>
            </button>

            {/* Quick Action buttons */}
            <div className="hidden lg:flex items-center space-x-2">
              <button
                onClick={() => onOpenQuickAction('poultry')}
                className="inline-flex items-center px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors"
              >
                <PlusCircle className="w-3.5 h-3.5 mr-1" />
                {t.addBird}
              </button>
              <button
                onClick={() => onOpenQuickAction('sale')}
                className="inline-flex items-center px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-colors"
              >
                <PlusCircle className="w-3.5 h-3.5 mr-1" />
                {t.recordSale}
              </button>
              <button
                onClick={() => onOpenQuickAction('expense')}
                className="inline-flex items-center px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition-colors"
              >
                <PlusCircle className="w-3.5 h-3.5 mr-1" />
                {t.recordExpense}
              </button>
            </div>

            {/* Supabase Connection Status Pill - ONLY visible to Admin */}
            {isAdmin && (
              <button
                onClick={onOpenSupabaseModal}
                title="Admin Only: View Supabase configuration and SQL architecture"
                className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                  isConnected
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                    : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                  }`}
                />
                <Database className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">
                  {isConnected ? 'Supabase Live' : 'Supabase Config'}
                </span>
              </button>
            )}

            {/* Role & Status Badge */}
            <div className="flex items-center px-2 sm:px-2.5 py-1 rounded-lg border text-xs font-semibold bg-slate-50 border-slate-200 text-slate-700">
              {isAdmin ? (
                <>
                  <Shield className="w-3.5 h-3.5 text-amber-600 mr-1 sm:mr-1.5" />
                  <span className="text-amber-800 font-bold truncate max-w-[80px] sm:max-w-none">
                    {language === 'sw' ? 'Mkurugenzi (CEO)' : 'CEO Admin'}
                  </span>
                </>
              ) : (
                <>
                  <UserCheck className="w-3.5 h-3.5 text-emerald-600 mr-1 sm:mr-1.5" />
                  <span className="text-slate-700 font-medium truncate max-w-[80px] sm:max-w-none">
                    {language === 'sw' ? 'Msimamizi' : 'Staff'}
                  </span>
                </>
              )}
            </div>

            {/* User Profile Avatar / Logout */}
            <div className="flex items-center space-x-1.5 sm:space-x-2 pl-1.5 sm:pl-2 border-l border-slate-200">
              <div
                className={`w-8 h-8 rounded-full text-white font-bold text-xs flex items-center justify-center shadow-xs ${
                  isAdmin
                    ? 'bg-gradient-to-tr from-amber-600 to-emerald-700 ring-2 ring-amber-400/40'
                    : 'bg-slate-700'
                }`}
                title={profile?.full_name || 'User'}
              >
                {profile?.full_name ? profile.full_name[0].toUpperCase() : 'U'}
              </div>
              <button
                onClick={() => signOut()}
                className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                title={t.signOut}
                aria-label="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
