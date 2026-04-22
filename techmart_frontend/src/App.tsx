import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import './i18n';
import { useSettingsStore } from './store/useSettingsStore';
import { Layout } from './components/layout/Layout';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { ForgotPassword } from './pages/ForgotPassword';
import { Dashboard } from './pages/Dashboard';
import { Accounts } from './pages/Accounts';
import { JournalList } from './pages/JournalList';
import { CreateJournalEntry } from './pages/CreateJournalEntry';
import { TrialBalance } from './pages/reports/TrialBalance';
import { IncomeStatement } from './pages/reports/IncomeStatement';
import { BalanceSheet } from './pages/reports/BalanceSheet';
import { AIAssistant } from './pages/AIAssistant';
import { Settings } from './pages/Settings';
import { Profile } from './pages/Profile';
import { HelpCenter } from './pages/HelpCenter';

export const App = () => {
  const { theme } = useSettingsStore();

  React.useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3200,
          className: 'ios-smooth',
          style: {
            background: 'rgba(255, 255, 255, 0.9)',
            color: 'var(--color-text-main)',
            border: '1px solid rgba(255,255,255,0.65)',
            borderRadius: '18px',
            fontSize: '14px',
            fontWeight: 600,
            padding: '14px 18px',
            boxShadow: '0 18px 50px rgba(15, 23, 42, 0.14)',
            backdropFilter: 'blur(18px)',
            WebkitBackdropFilter: 'blur(18px)',
          },
          success: {
            style: {
              background: 'linear-gradient(135deg, rgba(240,253,244,0.96), rgba(255,255,255,0.92))',
              border: '1px solid rgba(34,197,94,0.18)',
            },
            iconTheme: { primary: '#22c55e', secondary: 'white' },
          },
          error: {
            style: {
              background: 'linear-gradient(135deg, rgba(254,242,242,0.96), rgba(255,255,255,0.92))',
              border: '1px solid rgba(239,68,68,0.18)',
            },
            iconTheme: { primary: '#ef4444', secondary: 'white' },
          },
        }}
      />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        
        {/* Protected Dashboard Routes */}
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="accounts" element={<Accounts />} />
          <Route path="journal" element={<JournalList />} />
          <Route path="journal/new" element={<CreateJournalEntry />} />
          
          <Route path="reports/trial-balance" element={<TrialBalance />} />
          <Route path="reports/income-statement" element={<IncomeStatement />} />
          <Route path="reports/balance-sheet" element={<BalanceSheet />} />
          <Route path="ai-assistant" element={<AIAssistant />} />
          <Route path="settings" element={<Settings />} />
          <Route path="profile" element={<Profile />} />
          <Route path="help" element={<HelpCenter />} />
          
          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
