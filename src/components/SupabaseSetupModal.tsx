import React, { useState } from 'react';
import {
  Database,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  Server,
  Key,
  Globe,
  GitBranch,
  X,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import {
  getSupabaseConfig,
  saveSupabaseConfig,
  testSupabaseConnection,
  isSupabaseConfigured,
} from '../services/supabase';

// Raw SQL Schema exported from schema.sql for 1-click copy
const SUPABASE_SCHEMA_SQL = `-- ==============================================================================
-- KINGDOM GROUP POULTRY MANAGEMENT
-- Developed by CEO Junior Jackson Massawe
-- Complete Supabase PostgreSQL Database Schema & Security Setup
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USER PROFILES TABLE (Linked with Supabase Auth)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. POULTRY INVENTORY TABLE
CREATE TABLE IF NOT EXISTS public.poultry (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    poultry_id TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('Hen', 'Rooster', 'Duck', 'Drake', 'Chick', 'Other')),
    breed TEXT NOT NULL,
    sex TEXT NOT NULL CHECK (sex IN ('Female', 'Male', 'Unknown')),
    quantity INTEGER NOT NULL CHECK (quantity >= 0),
    date_acquired DATE NOT NULL DEFAULT CURRENT_DATE,
    age_weeks INTEGER NOT NULL DEFAULT 0 CHECK (age_weeks >= 0),
    source TEXT NOT NULL DEFAULT 'Hatched on farm',
    purchase_price NUMERIC(14, 2) NOT NULL DEFAULT 0 CHECK (purchase_price >= 0),
    estimated_unit_value NUMERIC(14, 2) NOT NULL DEFAULT 15000 CHECK (estimated_unit_value >= 0),
    current_status TEXT NOT NULL DEFAULT 'Active',
    notes TEXT,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. EGG PRODUCTION TABLE
CREATE TABLE IF NOT EXISTS public.egg_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hen_id TEXT NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    total_eggs INTEGER NOT NULL CHECK (total_eggs >= 0),
    good_eggs INTEGER NOT NULL DEFAULT 0 CHECK (good_eggs >= 0),
    damaged_eggs INTEGER NOT NULL DEFAULT 0 CHECK (damaged_eggs >= 0),
    eggs_brooding INTEGER NOT NULL DEFAULT 0 CHECK (eggs_brooding >= 0),
    eggs_sold INTEGER NOT NULL DEFAULT 0 CHECK (eggs_sold >= 0),
    eggs_consumed INTEGER NOT NULL DEFAULT 0 CHECK (eggs_consumed >= 0),
    eggs_remaining INTEGER NOT NULL DEFAULT 0 CHECK (eggs_remaining >= 0),
    notes TEXT,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. BROODING MANAGEMENT TABLE (21d Hens / 40d Ducks)
CREATE TABLE IF NOT EXISTS public.brooding (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    brooding_code TEXT NOT NULL,
    parent_poultry_id TEXT NOT NULL,
    poultry_type TEXT NOT NULL CHECK (poultry_type IN ('Hen', 'Duck')),
    breed TEXT NOT NULL,
    eggs_placed INTEGER NOT NULL CHECK (eggs_placed > 0),
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    expected_hatch_date DATE NOT NULL,
    actual_hatch_date DATE,
    hatched_count INTEGER DEFAULT 0 CHECK (hatched_count >= 0),
    failed_count INTEGER DEFAULT 0 CHECK (failed_count >= 0),
    damaged_count INTEGER DEFAULT 0 CHECK (damaged_count >= 0),
    status TEXT NOT NULL DEFAULT 'Active',
    notes TEXT,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. HATCHING RECORDS TABLE
CREATE TABLE IF NOT EXISTS public.hatch_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    brooding_id UUID REFERENCES public.brooding(id) ON DELETE SET NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    eggs_placed INTEGER NOT NULL CHECK (eggs_placed > 0),
    eggs_hatched INTEGER NOT NULL DEFAULT 0 CHECK (eggs_hatched >= 0),
    eggs_failed INTEGER NOT NULL DEFAULT 0 CHECK (eggs_failed >= 0),
    chicks_produced INTEGER NOT NULL DEFAULT 0 CHECK (chicks_produced >= 0),
    hatch_rate NUMERIC(5, 2) NOT NULL DEFAULT 0 CHECK (hatch_rate >= 0 AND hatch_rate <= 100),
    mortality_count INTEGER NOT NULL DEFAULT 0 CHECK (mortality_count >= 0),
    added_to_inventory BOOLEAN NOT NULL DEFAULT FALSE,
    inventory_poultry_id TEXT,
    notes TEXT,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. EXPENSE CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS public.expense_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. EXPENSES TABLE
CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    expense_code TEXT NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    quantity NUMERIC(10, 2) NOT NULL DEFAULT 1 CHECK (quantity > 0),
    unit_cost NUMERIC(14, 2) NOT NULL CHECK (unit_cost >= 0),
    total_cost NUMERIC(14, 2) NOT NULL CHECK (total_cost >= 0),
    payment_method TEXT NOT NULL DEFAULT 'Cash',
    supplier TEXT,
    notes TEXT,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. SALES TABLE
CREATE TABLE IF NOT EXISTS public.sales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sale_code TEXT NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    product TEXT NOT NULL,
    category TEXT NOT NULL,
    quantity NUMERIC(10, 2) NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(14, 2) NOT NULL CHECK (unit_price >= 0),
    total_amount NUMERIC(14, 2) NOT NULL CHECK (total_amount >= 0),
    customer TEXT NOT NULL,
    payment_method TEXT NOT NULL DEFAULT 'Cash',
    poultry_id_linked TEXT,
    notes TEXT,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS & POLICIES (Multi-Device & Multi-User Shared Sync)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poultry ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.egg_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brooding ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hatch_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE POLICY "Profiles view policy" ON public.profiles FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "Profiles update policy" ON public.profiles FOR ALL TO authenticated USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "Poultry access policy" ON public.poultry FOR ALL TO authenticated USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "Egg records access policy" ON public.egg_records FOR ALL TO authenticated USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "Brooding access policy" ON public.brooding FOR ALL TO authenticated USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "Hatch records access policy" ON public.hatch_records FOR ALL TO authenticated USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "Expense categories policy" ON public.expense_categories FOR ALL TO authenticated USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "Expenses access policy" ON public.expenses FOR ALL TO authenticated USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "Sales access policy" ON public.sales FOR ALL TO authenticated USING (TRUE) WITH CHECK (TRUE);

-- Automatic Profile Creation Trigger with CEO Junior Jackson Admin Grant
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    new.id,
    new.email,
    CASE 
      WHEN lower(new.email) = 'junior.jacksonmass100@gmail.com' THEN 'Junior Jackson'
      ELSE COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
    END,
    CASE 
      WHEN lower(new.email) = 'junior.jacksonmass100@gmail.com' THEN 'admin'
      ELSE COALESCE(new.raw_user_meta_data->>'role', 'user')
    END
  )
  ON CONFLICT (id) DO UPDATE SET
    role = CASE WHEN lower(excluded.email) = 'junior.jacksonmass100@gmail.com' THEN 'admin' ELSE public.profiles.role END,
    full_name = CASE WHEN lower(excluded.email) = 'junior.jacksonmass100@gmail.com' THEN 'Junior Jackson' ELSE public.profiles.full_name END;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Default categories
INSERT INTO public.expense_categories (name, is_default)
VALUES 
  ('Feed', TRUE), ('Vaccines', TRUE), ('Medication', TRUE),
  ('Poultry purchase', TRUE), ('Equipment', TRUE), ('Housing', TRUE),
  ('Water', TRUE), ('Electricity', TRUE), ('Transport', TRUE),
  ('Labour', TRUE), ('Packaging', TRUE), ('Repairs', TRUE),
  ('Marketing', TRUE), ('Other', TRUE)
ON CONFLICT DO NOTHING;

-- Realtime subscriptions
ALTER PUBLICATION supabase_realtime ADD TABLE public.poultry;
ALTER PUBLICATION supabase_realtime ADD TABLE public.egg_records;
ALTER PUBLICATION supabase_realtime ADD TABLE public.brooding;
ALTER PUBLICATION supabase_realtime ADD TABLE public.hatch_records;
ALTER PUBLICATION supabase_realtime ADD TABLE public.expenses;
ALTER PUBLICATION supabase_realtime ADD TABLE public.sales;`;

interface SupabaseSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupabaseSetupModal: React.FC<SupabaseSetupModalProps> = ({ isOpen, onClose }) => {
  const currentConfig = getSupabaseConfig();
  const [url, setUrl] = useState(currentConfig.url);
  const [anonKey, setAnonKey] = useState(currentConfig.anonKey);
  const [copied, setCopied] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  if (!isOpen) return null;

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SCHEMA_SQL);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleSaveAndTest = async () => {
    saveSupabaseConfig(url, anonKey);
    setTesting(true);
    setTestResult(null);
    const result = await testSupabaseConnection(url, anonKey);
    setTestResult(result);
    setTesting(false);
    if (result.success) {
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center font-black">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold">Supabase PostgreSQL & Security Setup</h2>
              <p className="text-xs text-slate-400">
                KINGDOM GROUP POULTRY MANAGEMENT • Developed by CEO Junior Jackson Massawe
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-700">
          {/* Status Alert */}
          <div
            className={`p-4 rounded-xl border flex items-start space-x-3 ${
              isSupabaseConfigured()
                ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                : 'bg-amber-50 border-amber-300 text-amber-900'
            }`}
          >
            <ShieldCheck className="w-5 h-5 mt-0.5 shrink-0 text-emerald-600" />
            <div>
              <span className="font-bold text-sm block">
                {isSupabaseConfigured()
                  ? 'Supabase Integration Active'
                  : 'Supabase Credentials Pending'}
              </span>
              <p className="text-xs mt-1">
                {isSupabaseConfigured()
                  ? 'The application is securely connected to your Supabase project with Row Level Security.'
                  : 'You can test all poultry functions immediately using the live local database engine, or enter your Supabase project credentials below to connect to PostgreSQL.'}
              </p>
            </div>
          </div>

          {/* Connection Form */}
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center">
              <Key className="w-4 h-4 mr-2 text-emerald-600" />
              Supabase Project Connection Keys
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  VITE_SUPABASE_URL
                </label>
                <input
                  type="text"
                  placeholder="https://xyzcompany.supabase.co"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 bg-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  VITE_SUPABASE_ANON_KEY (Public Key)
                </label>
                <input
                  type="password"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  value={anonKey}
                  onChange={(e) => setAnonKey(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 bg-white font-mono"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Never use the Service Role key in frontend code.
                </span>
              </div>
            </div>

            {testResult && (
              <div
                className={`p-3 rounded-xl border text-xs flex items-center ${
                  testResult.success
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                    : 'bg-rose-50 border-rose-300 text-rose-800'
                }`}
              >
                <AlertCircle className="w-4 h-4 mr-2 shrink-0" />
                <span>{testResult.message}</span>
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-slate-500">
                Stored securely in your browser environment.
              </span>
              <button
                type="button"
                onClick={handleSaveAndTest}
                disabled={testing}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center space-x-1.5 shadow-sm transition-all"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin' : ''}`} />
                <span>{testing ? 'Testing Connection...' : 'Save & Test Supabase Connection'}</span>
              </button>
            </div>
          </div>

          {/* SQL Schema Copy Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center">
                  <Database className="w-4 h-4 mr-2 text-emerald-600" />
                  Supabase PostgreSQL SQL Schema
                </h3>
                <span className="text-slate-500 text-[11px]">
                  Copy this SQL and paste it into your Supabase Dashboard -&gt; SQL Editor to create all 8 tables, indexes, and RLS policies.
                </span>
              </div>
              <button
                onClick={handleCopySql}
                className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-sm"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'SQL Copied!' : 'Copy SQL Schema'}</span>
              </button>
            </div>

            <div className="relative">
              <pre className="bg-slate-950 text-slate-300 p-4 rounded-2xl text-[11px] font-mono h-48 overflow-y-auto border border-slate-800">
                {SUPABASE_SCHEMA_SQL}
              </pre>
            </div>
          </div>

          {/* GitHub & Vercel Deployment Checklist */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <h4 className="font-bold text-slate-900 flex items-center mb-1">
                <GitBranch className="w-4 h-4 mr-1.5 text-slate-700" />
                GitHub Repository Setup
              </h4>
              <ol className="list-decimal list-inside space-y-1 text-slate-600 text-[11px]">
                <li>Initialize git repo: <code className="bg-white px-1 py-0.5 rounded border">git init</code></li>
                <li>Add remote: <code className="bg-white px-1 py-0.5 rounded border">git remote add origin ...</code></li>
                <li>Push to your GitHub repository</li>
                <li>Ensure <code className="bg-white px-1 py-0.5 rounded border">.env</code> is excluded by gitignore</li>
              </ol>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <h4 className="font-bold text-slate-900 flex items-center mb-1">
                <Globe className="w-4 h-4 mr-1.5 text-emerald-600" />
                Vercel Production Deployment
              </h4>
              <ol className="list-decimal list-inside space-y-1 text-slate-600 text-[11px]">
                <li>Import your GitHub repo into Vercel</li>
                <li>Framework Preset: <strong>Vite</strong></li>
                <li>Add Environment Variables in Vercel:
                  <ul className="list-disc list-inside pl-2 font-mono text-[10px] text-slate-800">
                    <li>VITE_SUPABASE_URL</li>
                    <li>VITE_SUPABASE_ANON_KEY</li>
                  </ul>
                </li>
                <li>Click <strong>Deploy</strong></li>
              </ol>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-xs"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
