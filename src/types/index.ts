export type UserRole = 'admin' | 'user';

export interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
  full_name?: string;
  created_at: string;
  updated_at?: string;
  last_sign_in_at?: string;
  is_online?: boolean;
}

export type PoultryType = 'Hen' | 'Rooster' | 'Duck' | 'Drake' | 'Chick' | 'Other';

export type PoultryBreed =
  | 'Kienyeji'
  | 'Chotara'
  | 'Improved Kienyeji'
  | 'Local Duck'
  | 'Improved Duck'
  | 'Sasso'
  | 'Kuroiler'
  | 'Black Australorp'
  | 'Other';

export type PoultrySex = 'Female' | 'Male' | 'Unknown';

export type PoultryStatus =
  | 'Active'
  | 'Sold'
  | 'Dead'
  | 'Brooding'
  | 'Growing'
  | 'Laying'
  | 'Breeding'
  | 'Sick'
  | 'Other';

export type PoultrySource = 'Hatched on farm' | 'Purchased' | 'Gifted' | 'Other';

export interface PoultryItem {
  id: string;
  poultry_id: string; // e.g. "KGP-1001"
  type: PoultryType;
  breed: PoultryBreed | string;
  sex: PoultrySex;
  quantity: number;
  date_acquired: string;
  age_weeks: number;
  source: PoultrySource;
  purchase_price: number; // in TZS
  estimated_unit_value: number; // in TZS (for stock value calculation)
  current_status: PoultryStatus;
  notes?: string;
  user_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface EggRecord {
  id: string;
  hen_id: string; // Hen or batch reference
  date: string;
  total_eggs: number;
  good_eggs: number;
  damaged_eggs: number;
  eggs_brooding: number;
  eggs_sold: number;
  eggs_consumed: number;
  eggs_remaining: number; // Calculated: total - brooding - sold - consumed - damaged
  notes?: string;
  user_id?: string;
  created_at?: string;
}

export type BroodingPoultryType = 'Hen' | 'Duck';

export type BroodingStatus =
  | 'Not Started'
  | 'Active'
  | 'Due Soon'
  | 'Due Today'
  | 'Overdue'
  | 'Hatched'
  | 'Failed'
  | 'Completed';

export interface BroodingRecord {
  id: string;
  brooding_code: string; // e.g. "BRD-2024-001"
  parent_poultry_id: string;
  poultry_type: BroodingPoultryType;
  breed: string;
  eggs_placed: number;
  start_date: string; // YYYY-MM-DD
  expected_hatch_date: string; // Start + 21 days (Hen) or Start + 40 days (Duck)
  actual_hatch_date?: string;
  hatched_count?: number;
  failed_count?: number;
  damaged_count?: number;
  status: BroodingStatus;
  notes?: string;
  user_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface HatchRecord {
  id: string;
  brooding_id: string;
  brooding_code?: string;
  poultry_type?: BroodingPoultryType;
  breed?: string;
  date: string;
  eggs_placed: number;
  eggs_hatched: number;
  eggs_failed: number;
  chicks_produced: number;
  hatch_rate: number; // (hatched / placed) * 100
  mortality_count: number;
  added_to_inventory: boolean;
  inventory_poultry_id?: string;
  notes?: string;
  user_id?: string;
  created_at?: string;
}

export interface ExpenseCategory {
  id: string;
  name: string;
  is_default: boolean;
  user_id?: string;
  created_at?: string;
}

export interface ExpenseRecord {
  id: string;
  expense_code: string; // e.g. "EXP-2024-001"
  date: string;
  category: string;
  description: string;
  quantity: number;
  unit_cost: number;
  total_cost: number; // quantity * unit_cost
  payment_method: string;
  supplier?: string;
  notes?: string;
  user_id?: string;
  created_at?: string;
}

export type SaleProductType =
  | 'Live chicken'
  | 'Ducks'
  | 'Chicks'
  | 'Eggs'
  | 'Hatching eggs'
  | 'Manure'
  | 'Other poultry products';

export interface SaleRecord {
  id: string;
  sale_code: string; // e.g. "SAL-2024-001"
  date: string;
  product: SaleProductType | string;
  category: string;
  quantity: number;
  unit_price: number;
  total_amount: number; // quantity * unit_price
  customer: string;
  payment_method: string;
  poultry_id_linked?: string; // Optional reference to deducted poultry stock
  notes?: string;
  user_id?: string;
  created_at?: string;
}

export interface DashboardMetrics {
  totalPoultry: number;
  totalHens: number;
  totalRoosters: number;
  totalDucks: number;
  totalChicks: number;
  eggsCollected: number;
  eggsBrooding: number;
  expectedHatchings: number;
  totalSales: number;
  totalExpenses: number;
  netProfit: number;
  currentPoultryStockValue: number;
  // Periodic
  revenueToday: number;
  revenueThisWeek: number;
  revenueThisMonth: number;
  revenueThisYear: number;
  expensesToday: number;
  expensesThisWeek: number;
  expensesThisMonth: number;
  expensesThisYear: number;
  profitToday: number;
  profitThisWeek: number;
  profitThisMonth: number;
  profitThisYear: number;
}
