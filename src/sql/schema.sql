-- ==============================================================================
-- KINGDOM GROUP POULTRY MANAGEMENT
-- Developed by CEO Junior Jackson Massawe
-- Complete Supabase PostgreSQL Database Schema & Security Setup
-- Fully Synchronized Multi-User & Multi-Device Architecture
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. USER PROFILES TABLE (Linked with Supabase Auth)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
    last_sign_in_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
    is_online BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ensure newly added columns exist if table was already created
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_sign_in_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_online BOOLEAN DEFAULT TRUE;

-- 3. POULTRY INVENTORY TABLE
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

-- 4. EGG PRODUCTION TABLE
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

-- 5. BROODING MANAGEMENT TABLE
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

-- 6. HATCHING RECORDS TABLE
CREATE TABLE IF NOT EXISTS public.hatch_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    brooding_id UUID REFERENCES public.brooding(id) ON DELETE SET NULL,
    brooding_code TEXT,
    poultry_type TEXT,
    breed TEXT,
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

-- 7. EXPENSE CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS public.expense_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. EXPENSES TABLE
CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    expense_code TEXT NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    quantity NUMERIC(10, 2) NOT NULL DEFAULT 1 CHECK (quantity > 0),
    unit_cost NUMERIC(14, 2) NOT NULL CHECK (unit_cost >= 0),
    total_cost NUMERIC(14, 2) NOT NULL CHECK (total_cost >= 0),
    payment_method TEXT NOT NULL,
    supplier TEXT,
    notes TEXT,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9. SALES TABLE
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
    payment_method TEXT NOT NULL,
    poultry_id_linked UUID REFERENCES public.poultry(id) ON DELETE SET NULL,
    notes TEXT,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 10. REALTIME COLLABORATION & MULTI-DEVICE ROW LEVEL SECURITY (RLS)
-- Enables all authenticated farm staff to access synchronized records in real time
-- while granting full administrative wipe & oversight permissions to CEO Junior Jackson
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

-- Profiles: Authenticated users can view member statuses and their own account
DROP POLICY IF EXISTS "Profiles view policy" ON public.profiles;
CREATE POLICY "Profiles view policy" ON public.profiles
    FOR SELECT TO authenticated USING (TRUE);

DROP POLICY IF EXISTS "Profiles update policy" ON public.profiles;
CREATE POLICY "Profiles update policy" ON public.profiles
    FOR ALL TO authenticated USING (auth.uid() = id OR public.is_admin());

-- Farm Data Tables: Authenticated operators & CEO share synchronized records
DROP POLICY IF EXISTS "Poultry shared policy" ON public.poultry;
CREATE POLICY "Poultry shared policy" ON public.poultry
    FOR ALL TO authenticated USING (TRUE) WITH CHECK (TRUE);

DROP POLICY IF EXISTS "Egg records shared policy" ON public.egg_records;
CREATE POLICY "Egg records shared policy" ON public.egg_records
    FOR ALL TO authenticated USING (TRUE) WITH CHECK (TRUE);

DROP POLICY IF EXISTS "Brooding shared policy" ON public.brooding;
CREATE POLICY "Brooding shared policy" ON public.brooding
    FOR ALL TO authenticated USING (TRUE) WITH CHECK (TRUE);

DROP POLICY IF EXISTS "Hatch records shared policy" ON public.hatch_records;
CREATE POLICY "Hatch records shared policy" ON public.hatch_records
    FOR ALL TO authenticated USING (TRUE) WITH CHECK (TRUE);

DROP POLICY IF EXISTS "Categories shared policy" ON public.expense_categories;
CREATE POLICY "Categories shared policy" ON public.expense_categories
    FOR ALL TO authenticated USING (TRUE) WITH CHECK (TRUE);

DROP POLICY IF EXISTS "Expenses shared policy" ON public.expenses;
CREATE POLICY "Expenses shared policy" ON public.expenses
    FOR ALL TO authenticated USING (TRUE) WITH CHECK (TRUE);

DROP POLICY IF EXISTS "Sales shared policy" ON public.sales;
CREATE POLICY "Sales shared policy" ON public.sales
    FOR ALL TO authenticated USING (TRUE) WITH CHECK (TRUE);

-- 11. AUTOMATIC PROFILE TRIGGER FOR NEW USERS
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, is_online, last_sign_in_at)
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
    END,
    TRUE,
    timezone('utc'::text, now())
  )
  ON CONFLICT (id) DO UPDATE SET
    role = CASE WHEN lower(excluded.email) = 'junior.jacksonmass100@gmail.com' THEN 'admin' ELSE public.profiles.role END,
    full_name = CASE WHEN lower(excluded.email) = 'junior.jacksonmass100@gmail.com' THEN 'Junior Jackson' ELSE public.profiles.full_name END,
    is_online = TRUE,
    last_sign_in_at = timezone('utc'::text, now());
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 12. ENABLE SUPABASE REALTIME REPLICATION
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.poultry;
ALTER PUBLICATION supabase_realtime ADD TABLE public.egg_records;
ALTER PUBLICATION supabase_realtime ADD TABLE public.brooding;
ALTER PUBLICATION supabase_realtime ADD TABLE public.hatch_records;
ALTER PUBLICATION supabase_realtime ADD TABLE public.expenses;
ALTER PUBLICATION supabase_realtime ADD TABLE public.sales;
