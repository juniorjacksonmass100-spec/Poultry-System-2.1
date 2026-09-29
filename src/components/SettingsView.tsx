import React, { useState } from 'react';
import {
  Shield,
  Database,
  Award,
  Clock,
  CheckCircle,
  Trash2,
  AlertTriangle,
  RefreshCw,
  Lock,
  Languages,
  Users,
  UserCheck,
  Radio,
  Smartphone,
  Cloud,
} from 'lucide-react';
import { useAuth, ADMIN_EMAIL, ADMIN_NAME } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { HEN_INCUBATION_DAYS, DUCK_INCUBATION_DAYS } from '../utils/calculations';
import { isSupabaseConfigured } from '../services/supabase';

interface SettingsViewProps {
  onOpenSupabaseModal: () => void;
  onResetAllData?: () => Promise<void>;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  onOpenSupabaseModal,
  onResetAllData,
}) => {
  const { profile, isAdmin, allProfiles, refreshProfiles } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [resetSuccessMessage, setResetSuccessMessage] = useState<string | null>(null);

  const isConnected = isSupabaseConfigured();

  const handleExecuteReset = async () => {
    if (!isAdmin) {
      alert('Unauthorized: Only CEO Admin Junior Jackson can reset database records.');
      return;
    }

    if (confirmText.trim().toUpperCase() !== 'RESET') {
      return;
    }
    try {
      setIsResetting(true);
      if (onResetAllData) {
        await onResetAllData();
      }
      setIsResetModalOpen(false);
      setConfirmText('');
      setResetSuccessMessage('All farm records, flocks, batches, and transactions have been permanently cleared for all users across the system.');
      setTimeout(() => setResetSuccessMessage(null), 8000);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error resetting data');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl pb-10">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">{t.settings}</h1>
          <p className="text-xs text-slate-500 mt-1">
            Kingdom Group Poultry Management System Configuration & Synchronization
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>v2.5.0 Production APK Ready</span>
          </div>
        </div>
      </div>

      {resetSuccessMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-900 text-xs flex items-center space-x-2">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="font-bold">{resetSuccessMessage}</span>
        </div>
      )}

      {/* LANGUAGE PREFERENCE PANEL (ENGLISH & SWAHILI) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <Languages className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                {language === 'sw' ? 'Chagua Lugha ya Mfumo' : 'System Language Preference'}
              </h2>
              <p className="text-xs text-slate-500">
                {language === 'sw'
                  ? 'Badili mfumo uwe wa Kiswahili au Kiingereza kwa urahisi'
                  : 'Toggle between English and Kiswahili across all screens and reports'}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <button
            onClick={() => setLanguage('en')}
            className={`p-4 rounded-xl border text-left transition-all flex items-center justify-between ${
              language === 'en'
                ? 'border-emerald-600 bg-emerald-50/70 shadow-xs ring-2 ring-emerald-500/20'
                : 'border-slate-200 hover:bg-slate-50'
            }`}
          >
            <div>
              <div className="font-bold text-sm text-slate-900 flex items-center space-x-2">
                <span>🇬🇧 English</span>
                {language === 'en' && (
                  <span className="text-[10px] bg-emerald-600 text-white px-1.5 py-0.5 rounded-md font-semibold">Active</span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1">Default international poultry management terminology.</p>
            </div>
            {language === 'en' && <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />}
          </button>

          <button
            onClick={() => setLanguage('sw')}
            className={`p-4 rounded-xl border text-left transition-all flex items-center justify-between ${
              language === 'sw'
                ? 'border-emerald-600 bg-emerald-50/70 shadow-xs ring-2 ring-emerald-500/20'
                : 'border-slate-200 hover:bg-slate-50'
            }`}
          >
            <div>
              <div className="font-bold text-sm text-slate-900 flex items-center space-x-2">
                <span>🇹🇿 Kiswahili</span>
                {language === 'sw' && (
                  <span className="text-[10px] bg-emerald-600 text-white px-1.5 py-0.5 rounded-md font-semibold">Inatumika</span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1">Lugha ya Kiswahili fasaha ya usimamizi wa shamba na kuku.</p>
            </div>
            {language === 'sw' && <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />}
          </button>
        </div>
      </div>

      {/* CLOUD MULTI-DEVICE SYNCHRONIZATION STATUS */}
      <div className="bg-gradient-to-br from-emerald-950 via-slate-900 to-slate-950 text-white rounded-2xl p-6 shadow-xl border border-emerald-800/40 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center space-x-2">
                <span>{t.cloudSyncTitle}</span>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              </h2>
              <p className="text-xs text-slate-300 mt-0.5">
                {t.cloudSyncDesc}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
          <div className="bg-slate-800/70 p-3.5 rounded-xl border border-slate-700/80">
            <div className="text-slate-400 font-medium">Database Backend</div>
            <div className="text-sm font-bold text-emerald-400 mt-1 flex items-center space-x-1.5">
              <Database className="w-4 h-4" />
              <span>Supabase PostgreSQL</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              {isConnected ? 'Live sync & auto-replication active' : 'Offline engine (waiting for credentials)'}
            </p>
          </div>

          <div className="bg-slate-800/70 p-3.5 rounded-xl border border-slate-700/80">
            <div className="text-slate-400 font-medium">Multi-Device Login</div>
            <div className="text-sm font-bold text-blue-400 mt-1 flex items-center space-x-1.5">
              <Smartphone className="w-4 h-4" />
              <span>Cross-Device Instant Sync</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Login on any phone or laptop to view all data entered.
            </p>
          </div>

          <div className="bg-slate-800/70 p-3.5 rounded-xl border border-slate-700/80">
            <div className="text-slate-400 font-medium">My Account Status</div>
            <div className="text-sm font-bold text-amber-400 mt-1 flex items-center space-x-1.5">
              <Shield className="w-4 h-4" />
              <span>{isAdmin ? 'CEO Authority (Admin)' : 'Staff Operator'}</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1 truncate">
              {profile?.email || 'Logged in'}
            </p>
          </div>
        </div>
      </div>

      {/* USER & OPERATOR STATUS DIRECTORY */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <Users className="w-5 h-5 text-indigo-600" />
            <div>
              <h2 className="text-sm font-bold text-slate-900">{t.userDirectory}</h2>
              <p className="text-xs text-slate-500">
                {language === 'sw'
                  ? 'Tazama hali ya watumiaji waliounganishwa kwenye mfumo wako'
                  : 'Track user statuses, roles, and real-time online activity'}
              </p>
            </div>
          </div>
          <button
            onClick={() => refreshProfiles()}
            className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg text-xs font-semibold flex items-center space-x-1 transition-colors"
            title="Refresh Directory"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>

        {/* User cards list */}
        <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden text-xs">
          {/* Active user self */}
          <div className="p-3.5 bg-emerald-50/50 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-9 h-9 rounded-full bg-emerald-700 text-white font-bold flex items-center justify-center">
                  {profile?.full_name ? profile.full_name.substring(0, 2).toUpperCase() : 'ME'}
                </div>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-white" />
              </div>
              <div>
                <div className="font-bold text-slate-900 flex items-center space-x-1.5">
                  <span>{profile?.full_name || 'My Account'}</span>
                  <span className="text-[10px] bg-emerald-600 text-white px-1.5 py-0.2 rounded font-semibold">You (Current Device)</span>
                </div>
                <div className="text-[11px] text-slate-500">{profile?.email}</div>
              </div>
            </div>
            <div className="text-right">
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                isAdmin ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-slate-100 text-slate-800'
              }`}>
                {isAdmin ? 'CEO Administrator' : 'Staff Operator'}
              </span>
              <div className="text-[10px] text-emerald-600 font-semibold mt-0.5 flex items-center justify-end space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>Online / Active</span>
              </div>
            </div>
          </div>

          {/* Other registered accounts */}
          {allProfiles.filter(p => p.id !== profile?.id).map((member) => (
            <div key={member.id} className="p-3.5 hover:bg-slate-50 flex items-center justify-between transition-colors">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="w-9 h-9 rounded-full bg-slate-700 text-white font-bold flex items-center justify-center">
                    {member.full_name ? member.full_name.substring(0, 2).toUpperCase() : 'ST'}
                  </div>
                  <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full ring-2 ring-white ${
                    member.is_online ? 'bg-emerald-500' : 'bg-slate-300'
                  }`} />
                </div>
                <div>
                  <div className="font-bold text-slate-900">{member.full_name || 'Staff Member'}</div>
                  <div className="text-[11px] text-slate-500">{member.email}</div>
                </div>
              </div>
              <div className="text-right">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  member.role === 'admin' ? 'bg-amber-100 text-amber-900' : 'bg-slate-100 text-slate-800'
                }`}>
                  {member.role === 'admin' ? 'CEO Admin' : 'Staff Operator'}
                </span>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  {member.is_online ? (
                    <span className="text-emerald-600 font-semibold flex items-center justify-end space-x-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span>Online</span>
                    </span>
                  ) : (
                    <span>Last active: {member.last_sign_in_at ? new Date(member.last_sign_in_at).toLocaleDateString() : 'Recently'}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Executive Developer Profile Card */}
      <div className="bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-950 text-white rounded-2xl p-6 shadow-xl border border-emerald-800/40 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6 relative z-10">
          <div className="relative shrink-0">
            <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-emerald-400 shadow-2xl ring-4 ring-emerald-500/20 bg-slate-800 flex items-center justify-center text-white">
              <img
                src="/1787747918623.jpg"
                alt="CEO Junior Jackson Massawe"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <span className="font-extrabold text-2xl tracking-widest">JM</span>
            </div>
            <div className="absolute -bottom-2 -right-2 bg-amber-400 text-slate-950 rounded-lg px-1.5 py-0.5 text-[10px] font-black shadow-md flex items-center space-x-0.5">
              <Award className="w-3 h-3" />
              <span>CEO</span>
            </div>
          </div>

          <div className="text-center sm:text-left flex-1 min-w-0">
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 mb-2">
              <Shield className="w-3 h-3" />
              <span>System Creator & Chief Executive Officer</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              Junior Jackson Massawe
            </h2>
            <p className="text-xs text-emerald-400 font-semibold tracking-wide mt-0.5">
              Kingdom Group Poultry Management System
            </p>
            <p className="text-xs text-slate-300 mt-3 leading-relaxed">
              Designed and engineered with full-stack synchronization, cross-device database persistence, biological incubation calculation matrices, and enterprise poultry management architecture.
            </p>
          </div>
        </div>
      </div>

      {/* Biological Constants */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-slate-900 flex items-center">
          <Clock className="w-4 h-4 mr-2 text-indigo-600" />
          Biological Incubation Constants
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-slate-900">🐔 Hen (Chicken) Brooding:</span>
              <span className="font-extrabold text-indigo-700">{HEN_INCUBATION_DAYS} Days</span>
            </div>
            <p className="text-[11px] text-slate-500">
              Standard incubation period from clutch placement to pipping and hatching.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-slate-900">🦆 Duck Brooding:</span>
              <span className="font-extrabold text-teal-700">{DUCK_INCUBATION_DAYS} Days</span>
            </div>
            <p className="text-[11px] text-slate-500">
              Standard waterfowl incubation period for local and improved ducks.
            </p>
          </div>
        </div>
      </div>

      {/* ADMIN-ONLY SECTION: SUPABASE DATABASE CONFIGURATION */}
      {isAdmin ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center">
              <Database className="w-4 h-4 mr-2 text-emerald-600" />
              Supabase Connection & Database Schema
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Status: {isSupabaseConfigured() ? 'Live Connected to Supabase' : 'Offline Engine Active (Pending Keys)'}
            </p>
          </div>
          <button
            onClick={onOpenSupabaseModal}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors"
          >
            Manage Database Keys & SQL
          </button>
        </div>
      ) : (
        <div className="bg-slate-50 rounded-2xl border border-slate-200/80 p-4 text-xs text-slate-500 flex items-center space-x-2">
          <Lock className="w-4 h-4 text-slate-400 shrink-0" />
          <span>Supabase backend credentials and database architecture are restricted to CEO Administrator.</span>
        </div>
      )}

      {/* ADMIN-ONLY SECTION: FACTORY RESET (GLOBAL CLEAR DATA) */}
      {isAdmin && (
        <div className="bg-rose-50/70 rounded-2xl border border-rose-200 p-6 shadow-xs space-y-3">
          <div className="flex items-center space-x-2 text-rose-800 font-bold text-sm">
            <AlertTriangle className="w-5 h-5 text-rose-600" />
            <span>Executive Danger Zone: Clear Global Database (All Users)</span>
          </div>
          <p className="text-xs text-rose-900/80">
            Wipes all records across the entire database for <strong>all users</strong>. This will delete all poultry flock entries, egg logs, brooding schedules, hatch records, sales receipts, and farm expenses from Supabase.
          </p>
          <button
            onClick={() => {
              setConfirmText('');
              setIsResetModalOpen(true);
            }}
            className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center space-x-1.5"
          >
            <Trash2 className="w-4 h-4" />
            <span>{t.clearDatabase}</span>
          </button>
        </div>
      )}

      {/* Reset Confirmation Dialog */}
      {isResetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 border border-slate-200 space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h3 className="text-base font-bold text-slate-900">Confirm Global Farm Data Wipe</h3>
              <p className="text-xs text-slate-600 mt-1">
                This action is executed by <strong>CEO Junior Jackson</strong> and <strong className="text-rose-600">CANNOT</strong> be undone. It wipes all tables throughout all user accounts:
              </p>
              <ul className="text-[11px] text-slate-500 mt-2 list-disc list-inside text-left bg-slate-50 p-2.5 rounded-xl space-y-0.5">
                <li>All registered poultry flocks & birds</li>
                <li>All daily egg production logs</li>
                <li>All brooding incubation batches (21d & 40d)</li>
                <li>All recorded hatchings</li>
                <li>All customer sales receipts</li>
                <li>All operating farm expenses</li>
              </ul>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 block">
                Type <span className="font-mono text-rose-600 font-bold">RESET</span> to confirm:
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="RESET"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm uppercase tracking-wider font-mono focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
              />
            </div>

            <div className="flex space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setIsResetModalOpen(false)}
                className="flex-1 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteReset}
                disabled={confirmText.trim().toUpperCase() !== 'RESET' || isResetting}
                className="flex-1 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-colors flex items-center justify-center space-x-1"
              >
                {isResetting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1" />
                    Clearing...
                  </>
                ) : (
                  'Confirm & Wipe'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
