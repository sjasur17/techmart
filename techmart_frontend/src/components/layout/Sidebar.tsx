import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard, BookOpen, FileText, BarChart3,
  TrendingUp, Scale, Sparkles, Settings as SettingsIcon,
  LogOut, Headphones,
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { apiClient } from '../../api/axios';

interface NavItemProps {
  to: string;
  icon: React.ElementType;
  label: string;
  end?: boolean;
}

const NavItem = ({ to, icon: Icon, label, end }: NavItemProps) => (
  <NavLink
    to={to}
    end={end}
    className={({ isActive }) =>
      `nav-item ios-smooth group ${isActive ? 'active' : ''}`
    }
  >
    {({ isActive }) => (
      <>
        <span 
          className={`flex items-center justify-center w-8 h-8 rounded-[11px] transition-all duration-300 relative ${
            isActive ? 'border' : ''
          }`}
          style={{
            borderColor: isActive ? 'var(--color-border-strong)' : 'transparent',
            background: isActive ? 'var(--color-card-bg)' : 'transparent',
            boxShadow: isActive ? 'var(--shadow-xs)' : 'none',
          }}
        >
          <Icon 
            className={`w-[18px] h-[18px] transition-all ${isActive ? 'text-textMain' : 'text-textMuted group-hover:text-textMain'}`} 
            strokeWidth={isActive ? 2.5 : 2} 
          />
        </span>
        <span className={`flex-1 ${isActive ? 'font-semibold text-textMain' : 'font-medium text-textMuted group-hover:text-textMain'}`}>{label}</span>
      </>
    )}
  </NavLink>
);

export const Sidebar = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { logout, refreshToken } = useAuthStore();

  const handleLogout = async () => {
    try {
      const refresh = refreshToken || localStorage.getItem('refresh_token');
      await apiClient.post('/auth/logout/', { refresh });
    } catch (e) {
      console.error(e);
    } finally {
      logout();
      navigate('/login');
    }
  };

  return (
    <div
      className="w-64 h-screen flex flex-col border-r relative overflow-hidden shrink-0 ios-smooth"
      style={{ background: 'var(--color-sidebar)', borderColor: 'var(--color-border)' }}
    >
      {/* Top ambient glow */}
      <div
        className="absolute -top-20 -left-10 w-56 h-56 rounded-full opacity-[0.06] blur-3xl pointer-events-none"
        style={{ background: 'var(--color-primary)' }}
      />

      {/* Logo */}
      <div className="flex items-center gap-3 px-6 h-[72px] border-b shrink-0" style={{ borderColor: 'transparent' }}>
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm shrink-0"
          style={{ background: '#FF5C35' }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="4" />
            <path d="M8 12h8" />
            <path d="M12 8v8" />
          </svg>
        </div>
        <div>
          <span className="font-bold text-lg tracking-tight" style={{ color: 'var(--color-text-main)' }}>Filo</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {/* Main */}
        <div className="px-3 pb-2">
          <span className="text-[9px] font-bold uppercase tracking-[0.12em]"
            style={{ color: 'var(--color-text-muted)', opacity: 0.6 }}>
            {t('sidebar.main', 'Main')}
          </span>
        </div>
        <NavItem to="/" icon={LayoutDashboard} label={t('sidebar.dashboard')} end />
        <NavItem to="/journal" icon={BookOpen} label={t('sidebar.journal_entries')} />
        <NavItem to="/accounts" icon={FileText} label={t('sidebar.chart_of_accounts')} />

        {/* Reports */}
        <div className="px-3 pt-5 pb-2">
          <span className="text-[9px] font-bold uppercase tracking-[0.12em]"
            style={{ color: 'var(--color-text-muted)', opacity: 0.6 }}>
            {t('sidebar.reports')}
          </span>
        </div>
        <NavItem to="/reports/trial-balance"    icon={BarChart3}    label={t('sidebar.trial_balance')} />
        <NavItem to="/reports/income-statement" icon={TrendingUp}   label={t('sidebar.income_statement')} />
        <NavItem to="/reports/balance-sheet"    icon={Scale}        label={t('sidebar.balance_sheet')} />

        {/* AI */}
        <div className="px-3 pt-5 pb-2">
          <span className="text-[9px] font-bold uppercase tracking-[0.12em]"
            style={{ color: 'var(--color-primary)', opacity: 0.7 }}>
            {t('sidebar.intelligence')}
          </span>
        </div>
        <NavItem to="/ai-assistant" icon={Sparkles} label={t('sidebar.ai_assistant')} />
      </nav>

      {/* Footer / System */}
      <div className="px-3 pb-6 pt-4 mt-auto space-y-1" style={{ borderTop: 'none', background: 'var(--color-sidebar)' }}>
        <NavItem to="/help" icon={Headphones} label={t('sidebar.help_center', 'Help Center')} />
        <NavItem to="/settings" icon={SettingsIcon} label={t('sidebar.settings')} />
        
        {/* We can keep logout here or move to profile dropdown, keeping it simple for now */}
        <button
          onClick={handleLogout}
          className="nav-item ios-smooth w-full hover:!bg-red-50 dark:hover:!bg-red-950/30 hover:!text-red-500 group"
        >
          <span className="flex items-center justify-center w-8 h-8 rounded-xl text-textMain/40 group-hover:text-red-500 group-hover:bg-red-50 dark:group-hover:bg-red-950/30 transition-all">
            <LogOut className="w-4 h-4" />
          </span>
          <span>{t('sidebar.logout')}</span>
        </button>
      </div>
    </div>
  );
};
