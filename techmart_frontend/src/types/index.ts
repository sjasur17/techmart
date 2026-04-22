export interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  first_name: string;
  last_name: string;
  department: string;
  phone: string;
  avatar_url?: string | null;
  is_accountant: boolean;
  is_staff: boolean;
  date_joined: string;
  last_login?: string;
  is_superuser?: boolean;
}

export interface AuthTokens {
  access: string;
  refresh: string;
  user: User;
}

export interface Account {
  id: number;
  code: string;
  name: string;
  account_type: 'A' | 'L' | 'E' | 'R' | 'X';
  account_type_display: string;
  balance: string; // decimal string
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface EntryLine {
  id: number;
  journal: number;
  account: {
    id: number;
    code: string;
    name: string;
    account_type: string;
  };
  debit: string;
  credit: string;
  memo: string;
}

export interface JournalEntry {
  id: number;
  date: string;
  description: string;
  reference: string;
  created_by_name: string;
  is_posted: boolean;
  posted_at?: string;
  is_balanced: boolean;
  total_debit: string;
  total_credit: string;
  lines: EntryLine[];
  created_at: string;
  updated_at: string;
  line_count?: number;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface DashboardSummary {
  period: 'month' | 'year';
  date_from: string;
  date_to: string;
  total_revenue: string;
  total_expenses: string;
  net_income: string;
  net_margin_percent: string;
  total_assets: string;
  total_liabilities: string;
  total_equity: string;
  balance_sheet_is_balanced: boolean;
  balance_sheet_out_of_balance_amount: string;
  monthly_trend: Array<{
    month: string;
    revenue: string;
    expenses: string;
    net_income: string;
  }>;
  posted_entries_count: number;
  draft_entries_count: number;
  recent_entries: Array<{
    id: number;
    date: string;
    description: string;
    reference: string;
    created_by_name: string;
    status: 'posted' | 'draft' | 'cancelled';
    amount: string;
    is_posted: boolean;
    posted_at: string | null;
    line_count: number;
    created_at: string;
  }>;
}

export interface TrialBalanceReport {
  generated_at: string;
  accounts: Array<{
    account_id: number;
    account_code: string;
    account_name: string;
    account_type: string;
    account_type_display: string;
    total_debits: string;
    total_credits: string;
    balance: string;
  }>;
  grand_totals: {
    total_debits: string;
    total_credits: string;
  };
  is_balanced: boolean;
}

export interface IncomeStatementReport {
  date_from: string;
  date_to: string;
  generated_at: string;
  revenues: Array<{ account_id: number, account_code: string, account_name: string, amount: string }>;
  expenses: Array<{ account_id: number, account_code: string, account_name: string, amount: string }>;
  total_revenue: string;
  total_expenses: string;
  net_income: string;
}

export interface BalanceSheetReport {
  generated_at: string;
  assets: Array<{ account_id: number, account_code: string, account_name: string, balance: string }>;
  liabilities: Array<{ account_id: number, account_code: string, account_name: string, balance: string }>;
  equity: Array<{ account_id: number, account_code: string, account_name: string, balance: string }>;
  total_assets: string;
  total_liabilities: string;
  total_equity: string;
  total_liabilities_and_equity: string;
  is_balanced: boolean;
}
