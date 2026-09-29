import {
  PoultryItem,
  EggRecord,
  BroodingRecord,
  HatchRecord,
  ExpenseRecord,
  ExpenseCategory,
  SaleRecord,
} from '../types';
import { getSupabaseClient, isSupabaseConfigured } from './supabase';
import { calculateExpectedHatchDate, getBroodingStatusAndCountdown } from '../utils/calculations';

// In-memory / localStorage cache fallback for pre-database setup or offline cache
const STORAGE_PREFIX = 'kgp_db_';

function getLocalData<T>(table: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + table);
    if (!raw) return defaultValue;
    return JSON.parse(raw) as T;
  } catch {
    return defaultValue;
  }
}

function setLocalData<T>(table: string, value: T): void {
  try {
    localStorage.setItem(STORAGE_PREFIX + table, JSON.stringify(value));
  } catch (err) {
    console.error(`Failed to cache ${table}`, err);
  }
}

// Helper to get active user ID from current session
async function getCurrentUserId(): Promise<string | undefined> {
  if (!isSupabaseConfigured()) return undefined;
  try {
    const client = getSupabaseClient();
    const { data: { session } } = await client.auth.getSession();
    return session?.user?.id;
  } catch {
    return undefined;
  }
}

// Initial empty clean start datasets - every table starts completely at zero!
const defaultPoultry: PoultryItem[] = [];
const defaultEggs: EggRecord[] = [];
const defaultBrooding: BroodingRecord[] = [];
const defaultHatch: HatchRecord[] = [];
const defaultExpenses: ExpenseRecord[] = [];
const defaultSales: SaleRecord[] = [];

// Standard expense categories to help farm accounting
const defaultCategories: ExpenseCategory[] = [
  { id: 'cat-1', name: 'Feed', is_default: true },
  { id: 'cat-2', name: 'Vaccines', is_default: true },
  { id: 'cat-3', name: 'Medication', is_default: true },
  { id: 'cat-4', name: 'Poultry purchase', is_default: true },
  { id: 'cat-5', name: 'Equipment', is_default: true },
  { id: 'cat-6', name: 'Housing', is_default: true },
  { id: 'cat-7', name: 'Water', is_default: true },
  { id: 'cat-8', name: 'Electricity', is_default: true },
  { id: 'cat-9', name: 'Transport', is_default: true },
  { id: 'cat-10', name: 'Labour', is_default: true },
  { id: 'cat-11', name: 'Packaging', is_default: true },
  { id: 'cat-12', name: 'Repairs', is_default: true },
  { id: 'cat-13', name: 'Marketing', is_default: true },
  { id: 'cat-14', name: 'Other', is_default: true },
];

export const db = {
  // POULTRY
  async getPoultry(): Promise<PoultryItem[]> {
    if (isSupabaseConfigured()) {
      try {
        const client = getSupabaseClient();
        const { data, error } = await client
          .from('poultry')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data) {
          setLocalData('poultry', data);
          return data;
        }
      } catch (err) {
        console.warn('Supabase fetch poultry error, fallback to cache:', err);
      }
    }
    return getLocalData('poultry', defaultPoultry);
  },

  async addPoultry(item: Omit<PoultryItem, 'id' | 'created_at' | 'updated_at'>): Promise<PoultryItem> {
    const uid = await getCurrentUserId();
    const newItem: PoultryItem = {
      ...item,
      id: crypto.randomUUID ? crypto.randomUUID() : 'p-' + Date.now(),
      user_id: uid,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured()) {
      try {
        const client = getSupabaseClient();
        const { data, error } = await client.from('poultry').insert([newItem]).select().single();
        if (error) throw new Error(error.message);
        if (data) {
          const list = await db.getPoultry();
          setLocalData('poultry', [data, ...list.filter(x => x.id !== data.id)]);
          return data;
        }
      } catch (err: unknown) {
        console.warn('Supabase add poultry error, saving locally:', err);
      }
    }

    const current = getLocalData('poultry', defaultPoultry);
    const updated = [newItem, ...current];
    setLocalData('poultry', updated);
    return newItem;
  },

  async updatePoultry(id: string, updates: Partial<PoultryItem>): Promise<PoultryItem | null> {
    if (isSupabaseConfigured()) {
      try {
        const client = getSupabaseClient();
        const { data, error } = await client
          .from('poultry')
          .update({ ...updates, updated_at: new Date().toISOString() })
          .eq('id', id)
          .select()
          .single();
        if (error) throw new Error(error.message);
        if (data) {
          const list = await db.getPoultry();
          setLocalData('poultry', list.map(item => item.id === id ? data : item));
          return data;
        }
      } catch (err: unknown) {
        console.warn('Supabase update poultry error:', err);
      }
    }

    const current = getLocalData('poultry', defaultPoultry);
    let updatedItem: PoultryItem | null = null;
    const updated = current.map(item => {
      if (item.id === id) {
        updatedItem = { ...item, ...updates, updated_at: new Date().toISOString() };
        return updatedItem;
      }
      return item;
    });
    setLocalData('poultry', updated);
    return updatedItem;
  },

  async deletePoultry(id: string): Promise<boolean> {
    if (isSupabaseConfigured()) {
      try {
        const client = getSupabaseClient();
        const { error } = await client.from('poultry').delete().eq('id', id);
        if (error) throw new Error(error.message);
      } catch (err: unknown) {
        console.warn('Supabase delete poultry error:', err);
      }
    }

    const current = getLocalData('poultry', defaultPoultry);
    const updated = current.filter(item => item.id !== id);
    setLocalData('poultry', updated);
    return true;
  },

  // EGG RECORDS
  async getEggs(): Promise<EggRecord[]> {
    if (isSupabaseConfigured()) {
      try {
        const client = getSupabaseClient();
        const { data, error } = await client
          .from('egg_records')
          .select('*')
          .order('date', { ascending: false });

        if (!error && data) {
          setLocalData('egg_records', data);
          return data;
        }
      } catch (err) {
        console.warn('Supabase fetch eggs error:', err);
      }
    }
    return getLocalData('egg_records', defaultEggs);
  },

  async addEggRecord(record: Omit<EggRecord, 'id' | 'created_at'>): Promise<EggRecord> {
    const uid = await getCurrentUserId();
    const newRecord: EggRecord = {
      ...record,
      id: crypto.randomUUID ? crypto.randomUUID() : 'egg-' + Date.now(),
      user_id: uid,
      created_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured()) {
      try {
        const client = getSupabaseClient();
        const { data, error } = await client.from('egg_records').insert([newRecord]).select().single();
        if (error) throw new Error(error.message);
        if (data) {
          const list = await db.getEggs();
          setLocalData('egg_records', [data, ...list.filter(x => x.id !== data.id)]);
          return data;
        }
      } catch (err: unknown) {
        console.warn('Supabase add egg record error:', err);
      }
    }

    const current = getLocalData('egg_records', defaultEggs);
    const updated = [newRecord, ...current];
    setLocalData('egg_records', updated);
    return newRecord;
  },

  async deleteEggRecord(id: string): Promise<boolean> {
    if (isSupabaseConfigured()) {
      try {
        const client = getSupabaseClient();
        const { error } = await client.from('egg_records').delete().eq('id', id);
        if (error) throw new Error(error.message);
      } catch (err) {
        console.warn('Supabase delete egg error:', err);
      }
    }
    const current = getLocalData('egg_records', defaultEggs);
    setLocalData('egg_records', current.filter(x => x.id !== id));
    return true;
  },

  // BROODING
  async getBrooding(): Promise<BroodingRecord[]> {
    if (isSupabaseConfigured()) {
      try {
        const client = getSupabaseClient();
        const { data, error } = await client
          .from('brooding')
          .select('*')
          .order('start_date', { ascending: false });

        if (!error && data) {
          const enriched = data.map(item => {
            const { status } = getBroodingStatusAndCountdown(
              item.start_date,
              item.expected_hatch_date,
              item.actual_hatch_date,
              item.hatched_count,
              item.status
            );
            return { ...item, status };
          });
          setLocalData('brooding', enriched);
          return enriched;
        }
      } catch (err) {
        console.warn('Supabase fetch brooding error:', err);
      }
    }
    const current = getLocalData('brooding', defaultBrooding);
    return current.map(item => {
      const { status } = getBroodingStatusAndCountdown(
        item.start_date,
        item.expected_hatch_date,
        item.actual_hatch_date,
        item.hatched_count,
        item.status
      );
      return { ...item, status };
    });
  },

  async addBrooding(record: Omit<BroodingRecord, 'id' | 'created_at' | 'updated_at'>): Promise<BroodingRecord> {
    const expected = record.expected_hatch_date || calculateExpectedHatchDate(record.start_date, record.poultry_type);
    const { status } = getBroodingStatusAndCountdown(record.start_date, expected);
    const uid = await getCurrentUserId();

    const newRecord: BroodingRecord = {
      ...record,
      expected_hatch_date: expected,
      status,
      user_id: uid,
      id: crypto.randomUUID ? crypto.randomUUID() : 'brd-' + Date.now(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured()) {
      try {
        const client = getSupabaseClient();
        const { data, error } = await client.from('brooding').insert([newRecord]).select().single();
        if (error) throw new Error(error.message);
        if (data) {
          const list = await db.getBrooding();
          setLocalData('brooding', [data, ...list.filter(x => x.id !== data.id)]);
          return data;
        }
      } catch (err: unknown) {
        console.warn('Supabase add brooding error:', err);
      }
    }

    const current = getLocalData('brooding', defaultBrooding);
    const updated = [newRecord, ...current];
    setLocalData('brooding', updated);
    return newRecord;
  },

  async updateBrooding(id: string, updates: Partial<BroodingRecord>): Promise<BroodingRecord | null> {
    if (isSupabaseConfigured()) {
      try {
        const client = getSupabaseClient();
        const { data, error } = await client
          .from('brooding')
          .update({ ...updates, updated_at: new Date().toISOString() })
          .eq('id', id)
          .select()
          .single();
        if (error) throw new Error(error.message);
        if (data) {
          const list = await db.getBrooding();
          setLocalData('brooding', list.map(item => item.id === id ? data : item));
          return data;
        }
      } catch (err: unknown) {
        console.warn('Supabase update brooding error:', err);
      }
    }

    const current = getLocalData('brooding', defaultBrooding);
    let updatedItem: BroodingRecord | null = null;
    const updated = current.map(item => {
      if (item.id === id) {
        updatedItem = { ...item, ...updates, updated_at: new Date().toISOString() };
        return updatedItem;
      }
      return item;
    });
    setLocalData('brooding', updated);
    return updatedItem;
  },

  async deleteBrooding(id: string): Promise<boolean> {
    if (isSupabaseConfigured()) {
      try {
        const client = getSupabaseClient();
        const { error } = await client.from('brooding').delete().eq('id', id);
        if (error) throw new Error(error.message);
      } catch (err) {
        console.warn('Supabase delete brooding error:', err);
      }
    }
    const current = getLocalData('brooding', defaultBrooding);
    setLocalData('brooding', current.filter(x => x.id !== id));
    return true;
  },

  // HATCHING
  async getHatchRecords(): Promise<HatchRecord[]> {
    if (isSupabaseConfigured()) {
      try {
        const client = getSupabaseClient();
        const { data, error } = await client
          .from('hatch_records')
          .select('*')
          .order('date', { ascending: false });

        if (!error && data) {
          setLocalData('hatch_records', data);
          return data;
        }
      } catch (err) {
        console.warn('Supabase fetch hatch error:', err);
      }
    }
    return getLocalData('hatch_records', defaultHatch);
  },

  async addHatchRecord(
    record: Omit<HatchRecord, 'id' | 'created_at'>,
    addToInventory: boolean = true
  ): Promise<{ hatch: HatchRecord; createdPoultry?: PoultryItem }> {
    let inventoryPoultryId = record.inventory_poultry_id;
    let createdPoultry: PoultryItem | undefined;

    if (addToInventory && record.chicks_produced > 0) {
      const birdType = record.poultry_type === 'Duck' ? 'Duck' : 'Chick';
      const newPoultryCode = `KGP-${birdType === 'Duck' ? 'DK' : 'CHK'}-${Date.now().toString().slice(-4)}`;
      
      const newBird = await db.addPoultry({
        poultry_id: newPoultryCode,
        type: birdType,
        breed: record.breed || 'Improved Kienyeji',
        sex: 'Unknown',
        quantity: record.chicks_produced,
        date_acquired: record.date || new Date().toISOString().split('T')[0],
        age_weeks: 0,
        source: 'Hatched on farm',
        purchase_price: 0,
        estimated_unit_value: birdType === 'Duck' ? 10000 : 6000,
        current_status: 'Growing',
        notes: `Automatically added from hatch event (Brooding ID: ${record.brooding_id})`,
      });

      inventoryPoultryId = newBird.poultry_id;
      createdPoultry = newBird;
    }

    const uid = await getCurrentUserId();
    const newHatch: HatchRecord = {
      ...record,
      added_to_inventory: addToInventory,
      inventory_poultry_id: inventoryPoultryId,
      user_id: uid,
      id: crypto.randomUUID ? crypto.randomUUID() : 'htch-' + Date.now(),
      created_at: new Date().toISOString(),
    };

    if (record.brooding_id) {
      await db.updateBrooding(record.brooding_id, {
        actual_hatch_date: record.date,
        hatched_count: record.eggs_hatched,
        failed_count: record.eggs_failed,
        status: 'Hatched',
      });
    }

    if (isSupabaseConfigured()) {
      try {
        const client = getSupabaseClient();
        const { data, error } = await client.from('hatch_records').insert([newHatch]).select().single();
        if (error) throw new Error(error.message);
        if (data) {
          const list = await db.getHatchRecords();
          setLocalData('hatch_records', [data, ...list.filter(x => x.id !== data.id)]);
          return { hatch: data, createdPoultry };
        }
      } catch (err: unknown) {
        console.warn('Supabase add hatch record error:', err);
      }
    }

    const current = getLocalData('hatch_records', defaultHatch);
    const updated = [newHatch, ...current];
    setLocalData('hatch_records', updated);
    return { hatch: newHatch, createdPoultry };
  },

  async deleteHatchRecord(id: string): Promise<boolean> {
    if (isSupabaseConfigured()) {
      try {
        const client = getSupabaseClient();
        const { error } = await client.from('hatch_records').delete().eq('id', id);
        if (error) throw new Error(error.message);
      } catch (err) {
        console.warn('Supabase delete hatch record error:', err);
      }
    }
    const current = getLocalData('hatch_records', defaultHatch);
    setLocalData('hatch_records', current.filter(x => x.id !== id));
    return true;
  },

  // EXPENSE CATEGORIES
  async getExpenseCategories(): Promise<ExpenseCategory[]> {
    if (isSupabaseConfigured()) {
      try {
        const client = getSupabaseClient();
        const { data, error } = await client
          .from('expense_categories')
          .select('*')
          .order('name', { ascending: true });

        if (!error && data && data.length > 0) {
          setLocalData('expense_categories', data);
          return data;
        }
      } catch (err) {
        console.warn('Supabase fetch categories error:', err);
      }
    }
    return getLocalData('expense_categories', defaultCategories);
  },

  async addExpenseCategory(name: string): Promise<ExpenseCategory> {
    const uid = await getCurrentUserId();
    const newCat: ExpenseCategory = {
      id: crypto.randomUUID ? crypto.randomUUID() : 'cat-' + Date.now(),
      name: name.trim(),
      is_default: false,
      user_id: uid,
      created_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured()) {
      try {
        const client = getSupabaseClient();
        const { data, error } = await client.from('expense_categories').insert([newCat]).select().single();
        if (error) throw new Error(error.message);
        if (data) {
          const list = await db.getExpenseCategories();
          setLocalData('expense_categories', [...list, data]);
          return data;
        }
      } catch (err: unknown) {
        console.warn('Supabase add category error:', err);
      }
    }

    const current = getLocalData('expense_categories', defaultCategories);
    const updated = [...current, newCat];
    setLocalData('expense_categories', updated);
    return newCat;
  },

  // EXPENSES
  async getExpenses(): Promise<ExpenseRecord[]> {
    if (isSupabaseConfigured()) {
      try {
        const client = getSupabaseClient();
        const { data, error } = await client
          .from('expenses')
          .select('*')
          .order('date', { ascending: false });

        if (!error && data) {
          setLocalData('expenses', data);
          return data;
        }
      } catch (err) {
        console.warn('Supabase fetch expenses error:', err);
      }
    }
    return getLocalData('expenses', defaultExpenses);
  },

  async addExpense(record: Omit<ExpenseRecord, 'id' | 'created_at'>): Promise<ExpenseRecord> {
    const total_cost = Math.round(Number(record.quantity) * Number(record.unit_cost));
    const uid = await getCurrentUserId();
    const newRecord: ExpenseRecord = {
      ...record,
      total_cost,
      user_id: uid,
      id: crypto.randomUUID ? crypto.randomUUID() : 'exp-' + Date.now(),
      created_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured()) {
      try {
        const client = getSupabaseClient();
        const { data, error } = await client.from('expenses').insert([newRecord]).select().single();
        if (error) throw new Error(error.message);
        if (data) {
          const list = await db.getExpenses();
          setLocalData('expenses', [data, ...list.filter(x => x.id !== data.id)]);
          return data;
        }
      } catch (err: unknown) {
        console.warn('Supabase add expense error:', err);
      }
    }

    const current = getLocalData('expenses', defaultExpenses);
    const updated = [newRecord, ...current];
    setLocalData('expenses', updated);
    return newRecord;
  },

  async deleteExpense(id: string): Promise<boolean> {
    if (isSupabaseConfigured()) {
      try {
        const client = getSupabaseClient();
        const { error } = await client.from('expenses').delete().eq('id', id);
        if (error) throw new Error(error.message);
      } catch (err) {
        console.warn('Supabase delete expense error:', err);
      }
    }
    const current = getLocalData('expenses', defaultExpenses);
    setLocalData('expenses', current.filter(x => x.id !== id));
    return true;
  },

  // SALES
  async getSales(): Promise<SaleRecord[]> {
    if (isSupabaseConfigured()) {
      try {
        const client = getSupabaseClient();
        const { data, error } = await client
          .from('sales')
          .select('*')
          .order('date', { ascending: false });

        if (!error && data) {
          setLocalData('sales', data);
          return data;
        }
      } catch (err) {
        console.warn('Supabase fetch sales error:', err);
      }
    }
    return getLocalData('sales', defaultSales);
  },

  async addSale(
    record: Omit<SaleRecord, 'id' | 'created_at'>,
    deductFromPoultryId?: string,
    deductQuantity: number = 0
  ): Promise<SaleRecord> {
    const total_amount = Math.round(Number(record.quantity) * Number(record.unit_price));
    const uid = await getCurrentUserId();
    const newRecord: SaleRecord = {
      ...record,
      total_amount,
      user_id: uid,
      poultry_id_linked: deductFromPoultryId,
      id: crypto.randomUUID ? crypto.randomUUID() : 'sal-' + Date.now(),
      created_at: new Date().toISOString(),
    };

    if (deductFromPoultryId && deductQuantity > 0) {
      const poultryList = await db.getPoultry();
      const targetBird = poultryList.find(b => b.id === deductFromPoultryId);
      if (targetBird) {
        const newQty = Math.max(0, targetBird.quantity - deductQuantity);
        await db.updatePoultry(deductFromPoultryId, {
          quantity: newQty,
          current_status: newQty === 0 ? 'Sold' : targetBird.current_status,
        });
      }
    }

    if (isSupabaseConfigured()) {
      try {
        const client = getSupabaseClient();
        const { data, error } = await client.from('sales').insert([newRecord]).select().single();
        if (error) throw new Error(error.message);
        if (data) {
          const list = await db.getSales();
          setLocalData('sales', [data, ...list.filter(x => x.id !== data.id)]);
          return data;
        }
      } catch (err: unknown) {
        console.warn('Supabase add sale error:', err);
      }
    }

    const current = getLocalData('sales', defaultSales);
    const updated = [newRecord, ...current];
    setLocalData('sales', updated);
    return newRecord;
  },

  async deleteSale(id: string): Promise<boolean> {
    if (isSupabaseConfigured()) {
      try {
        const client = getSupabaseClient();
        const { error } = await client.from('sales').delete().eq('id', id);
        if (error) throw new Error(error.message);
      } catch (err) {
        console.warn('Supabase delete sale error:', err);
      }
    }
    const current = getLocalData('sales', defaultSales);
    setLocalData('sales', current.filter(x => x.id !== id));
    return true;
  },

  // RESET ALL DATA (FACTORY RESET)
  async resetAllData(): Promise<{ success: boolean; message: string }> {
    try {
      if (isSupabaseConfigured()) {
        const client = getSupabaseClient();
        await client.from('hatch_records').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await client.from('brooding').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await client.from('egg_records').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await client.from('sales').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await client.from('expenses').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await client.from('poultry').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      }

      setLocalData('poultry', []);
      setLocalData('egg_records', []);
      setLocalData('brooding', []);
      setLocalData('hatch_records', []);
      setLocalData('sales', []);
      setLocalData('expenses', []);
      setLocalData('expense_categories', defaultCategories);

      return { success: true, message: 'All database records and farm data have been completely wiped.' };
    } catch (err: unknown) {
      console.error('Error resetting database:', err);
      return {
        success: false,
        message: err instanceof Error ? err.message : 'Failed to clear data.',
      };
    }
  },

  // REALTIME SUBSCRIPTION
  subscribeToChanges(callback: () => void): () => void {
    if (!isSupabaseConfigured()) return () => {};

    try {
      const client = getSupabaseClient();
      const channel = client
        .channel('kgp_poultry_realtime')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public' },
          (payload) => {
            console.log('Realtime change detected:', payload);
            callback();
          }
        )
        .subscribe();

      return () => {
        client.removeChannel(channel);
      };
    } catch (err) {
      console.warn('Realtime subscription error:', err);
      return () => {};
    }
  },
};
