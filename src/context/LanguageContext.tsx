import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'en' | 'sw';

export interface Translations {
  // Navigation & General
  dashboard: string;
  poultryInventory: string;
  eggProduction: string;
  brooding: string;
  hatchingResults: string;
  salesManagement: string;
  expenseTracking: string;
  financialReports: string;
  excelExport: string;
  supabaseDatabase: string;
  settings: string;
  language: string;
  swahili: string;
  english: string;
  liveOnline: string;
  offline: string;
  connected: string;
  syncing: string;
  allSynced: string;
  syncedWithSupabase: string;
  
  // Roles & Users
  ceoAdmin: string;
  staffOperator: string;
  standardUser: string;
  userStatus: string;
  activeUsers: string;
  registeredAccounts: string;
  myAccountStatus: string;
  signOut: string;
  
  // Dashboard Metrics
  totalPoultry: string;
  totalHens: string;
  totalRoosters: string;
  totalDucks: string;
  totalChicks: string;
  eggsCollected: string;
  eggsBrooding: string;
  expectedHatchings: string;
  totalSales: string;
  totalExpenses: string;
  netProfit: string;
  flockValue: string;
  
  // Quick Actions
  addBird: string;
  recordSale: string;
  recordExpense: string;
  collectEggs: string;
  startBrooding: string;
  recordHatch: string;
  
  // Settings & Status
  cloudSyncTitle: string;
  cloudSyncDesc: string;
  userDirectory: string;
  onlineStatus: string;
  lastActive: string;
  clearDatabase: string;
}

const translationsEn: Translations = {
  dashboard: 'Dashboard',
  poultryInventory: 'Poultry Inventory',
  eggProduction: 'Egg Production',
  brooding: 'Brooding (21d / 40d)',
  hatchingResults: 'Hatching Results',
  salesManagement: 'Sales Management',
  expenseTracking: 'Expense Tracking',
  financialReports: 'Financial & Reports',
  excelExport: 'Excel Export',
  supabaseDatabase: 'Supabase Database',
  settings: 'Settings',
  language: 'Language',
  swahili: 'Kiswahili',
  english: 'English',
  liveOnline: 'Cloud Connected',
  offline: 'Offline Mode',
  connected: 'Connected to Supabase',
  syncing: 'Syncing Data...',
  allSynced: 'All Data Synced',
  syncedWithSupabase: 'Data is synchronized with Supabase cloud across all devices',
  
  ceoAdmin: 'CEO Administrator',
  staffOperator: 'Staff Operator',
  standardUser: 'Standard User',
  userStatus: 'User Account Status',
  activeUsers: 'Active System Users',
  registeredAccounts: 'Registered Staff Accounts',
  myAccountStatus: 'My Status',
  signOut: 'Sign Out',
  
  totalPoultry: 'Total Poultry',
  totalHens: 'Total Hens',
  totalRoosters: 'Total Roosters',
  totalDucks: 'Total Ducks',
  totalChicks: 'Total Chicks',
  eggsCollected: 'Eggs Collected',
  eggsBrooding: 'Eggs Brooding',
  expectedHatchings: 'Due to Hatch',
  totalSales: 'Total Revenue',
  totalExpenses: 'Total Expenses',
  netProfit: 'Net Profit',
  flockValue: 'Flock Stock Value',
  
  addBird: 'Add Bird',
  recordSale: 'Record Sale',
  recordExpense: 'Add Expense',
  collectEggs: 'Record Eggs',
  startBrooding: 'Start Brooding',
  recordHatch: 'Record Hatch',
  
  cloudSyncTitle: 'Real-time Supabase Cloud Synchronization',
  cloudSyncDesc: 'Any data entered or updated on this phone is instantly stored in your Supabase database and available when you sign in from any other computer or mobile device.',
  userDirectory: 'Staff & Operator Status Directory',
  onlineStatus: 'Online / Active',
  lastActive: 'Last Active',
  clearDatabase: 'Clear Database (All Users)',
};

const translationsSw: Translations = {
  dashboard: 'Dashibodi',
  poultryInventory: 'Mifugo & Kuku',
  eggProduction: 'Uzalishaji wa Mayai',
  brooding: 'Uatamiaji (Siku 21 / 40)',
  hatchingResults: 'Matokeo ya Kuanguliwa',
  salesManagement: 'Usimamizi wa Mauzo',
  expenseTracking: 'Ufuatiliaji wa Matumizi',
  financialReports: 'Ripoti & Fedha',
  excelExport: 'Hamisha Excel',
  supabaseDatabase: 'Database ya Supabase',
  settings: 'Mipangilio',
  language: 'Lugha',
  swahili: 'Kiswahili',
  english: 'English',
  liveOnline: 'Imeunganishwa Mtandaoni',
  offline: 'Hali ya Nje ya Mtandao',
  connected: 'Imeunganishwa na Supabase',
  syncing: 'Inasawazisha Taarifa...',
  allSynced: 'Taarifa Zote Zimesawazishwa',
  syncedWithSupabase: 'Data imehifadhiwa kwenye Supabase na inapatikana kifaa chochote ukilogin',
  
  ceoAdmin: 'Mkurugenzi Mtendaji (CEO)',
  staffOperator: 'Msimamizi wa Shamba (Staff)',
  standardUser: 'Mtumiaji wa Kawaida',
  userStatus: 'Hali ya Akaunti',
  activeUsers: 'Watumiaji wa Mfumo',
  registeredAccounts: 'Akaunti za Wafanyakazi',
  myAccountStatus: 'Hali Yangu',
  signOut: 'Toka kwenye Akaunti',
  
  totalPoultry: 'Jumla ya Ndege & Kuku',
  totalHens: 'Kuku wa Kutaga',
  totalRoosters: 'Majogoo',
  totalDucks: 'Mabata',
  totalChicks: 'Vifaranga',
  eggsCollected: 'Mayai Yaliyokusanywa',
  eggsBrooding: 'Mayai Yanayoatamiwa',
  expectedHatchings: 'Kukaribia Kuanguliwa',
  totalSales: 'Jumla ya Mauzo',
  totalExpenses: 'Jumla ya Matumizi',
  netProfit: 'Faida Halisi',
  flockValue: 'Thamani ya Mifugo Yote',
  
  addBird: 'Ongeza Ndege',
  recordSale: 'Weka Mauzo',
  recordExpense: 'Weka Matumizi',
  collectEggs: 'Weka Mayai',
  startBrooding: 'Anzisha Uatamiaji',
  recordHatch: 'Weka Matokeo',
  
  cloudSyncTitle: 'Usawazishaji wa Moja kwa Moja na Supabase',
  cloudSyncDesc: 'Taarifa zote unazoingiza kwenye simu hii zinahifadhiwa kwenye database ya Supabase mtandaoni. Ukilogin kwenye simu nyingine au kompyuta kwa akaunti hii hii, taarifa zote zitaonekana kama ulivyoweka!',
  userDirectory: 'Orodha ya Watumiaji & Hali Zao',
  onlineStatus: 'Yuko Hewani / Ameingia',
  lastActive: 'Mara ya Mwisho',
  clearDatabase: 'Futa Database Yote',
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const LANGUAGE_KEY = 'kgp_app_language';

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem(LANGUAGE_KEY);
      if (saved === 'sw' || saved === 'en') return saved;
      return 'en';
    } catch {
      return 'en';
    }
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(LANGUAGE_KEY, lang);
    } catch {
      // ignore
    }
  };

  const t = language === 'sw' ? translationsSw : translationsEn;

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
