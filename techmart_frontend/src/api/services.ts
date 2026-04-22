import { apiClient } from './axios';
import { 
  DashboardSummary, 
  PaginatedResponse, 
  JournalEntry, 
  Account, 
  TrialBalanceReport,
  IncomeStatementReport,
  BalanceSheetReport,
  EntryLine
} from '../types';

export const dashboardService = {
  getSummary: (params?: { period?: 'month' | 'year' }) =>
    apiClient.get<DashboardSummary>('/dashboard/', { params }).then(r => r.data),
};

export const accountsService = {
  getAccounts: (params?: any) => apiClient.get<PaginatedResponse<Account>>('/accounts/', { params }).then(r => r.data),
  getAllAccounts: () => apiClient.get<PaginatedResponse<Account>>('/accounts/', { params: { page_size: 1000, is_active: true } }).then(r => r.data),
  getLedger: (id: number, params?: any) => apiClient.get<PaginatedResponse<EntryLine>>(`/accounts/${id}/ledger/`, { params }).then(r => r.data),
};

export const journalService = {
  getEntries: (params?: any) => apiClient.get<PaginatedResponse<JournalEntry>>('/journal/', { params }).then(r => r.data),
  getEntry: (id: number) => apiClient.get<JournalEntry>(`/journal/${id}/`).then(r => r.data),
  createEntry: (data: any) => apiClient.post<JournalEntry>('/journal/', data).then(r => r.data),
  postEntry: (id: number) => apiClient.post<JournalEntry>(`/journal/${id}/post/`).then(r => r.data),
  unpostEntry: (id: number) => apiClient.post<JournalEntry>(`/journal/${id}/unpost/`).then(r => r.data),
};

export const reportsService = {
  getTrialBalance: () => apiClient.get<TrialBalanceReport>('/reports/trial-balance/').then(r => r.data),
  getIncomeStatement: (params?: any) => apiClient.get<IncomeStatementReport>('/reports/income-statement/', { params }).then(r => r.data),
  getBalanceSheet: () => apiClient.get<BalanceSheetReport>('/reports/balance-sheet/').then(r => r.data),
  exportTrialBalanceCsv: () =>
    apiClient
      .get<Blob>('/reports/trial-balance/export/', { responseType: 'blob' })
      .then((response) => {
        let filename = `trial_balance_${new Date().toISOString().slice(0, 10)}.csv`;
        const disposition = response.headers?.['content-disposition'];

        if (typeof disposition === 'string') {
          const match = disposition.match(/filename\*?=(?:UTF-8''|\")?([^\";]+)/i);
          if (match?.[1]) {
            filename = decodeURIComponent(match[1].replace(/\"/g, '').trim());
          }
        }

        return {
          blob: response.data,
          filename,
        };
      }),
  askAssistant: (message: string) => apiClient.post<{reply: string}>('/reports/ai-assistant/', { message }).then(r => r.data),
  askHelpAssistant: (message: string) => apiClient.post<{reply: string}>('/reports/help-assistant/', { message }).then(r => r.data),
};
