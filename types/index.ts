
export type Currency = 'SAR' | 'SDG';
export type TxType = 'income' | 'expense';

export interface Transaction {
  id: string;
  type: TxType;
  amount: number;
  currency: Currency;
  category: string;
  date: string; // ISO
  note?: string;
}

export interface Settings {
  budgetSAR?: number;
  budgetSDG?: number;
  theme?: 'light' | 'dark';
  locale?: 'en' | 'ar';
}
