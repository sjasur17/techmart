import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  LineChart, Line, PieChart, Pie, Legend,
} from 'recharts';
import { ArrowUpRight, ArrowDownRight, DollarSign, Activity, Landmark, TrendingUp, PieChart as PieChartIcon } from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/format';
import { dashboardService } from '../api/services';
import { Card, CardHeader, CardBody } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { SkeletonDashboard } from '../components/ui/Skeleton';

// Filo UI colorful progress bar combinations
const PROGRESS_BARS = [
  { w1: '40%', c1: '#B28CFF', w2: '35%', c2: '#FF8A65', w3: '20%', c3: '#FF80FF' }, // Purple, Orange, Pink
  { w1: '50%', c1: '#3B82F6', w2: '25%', c2: '#10B981', w3: '15%', c3: '#F59E0B' }, // Blue, Green, Yellow
  { w1: '30%', c1: '#EF4444', w2: '45%', c2: '#8B5CF6', w3: '20%', c3: '#EC4899' }, // Red, Purple, Pink
  { w1: '60%', c1: '#10B981', w2: '20%', c2: '#3B82F6', w3: '10%', c3: '#6366F1' }, // Green, Blue, Indigo
];

interface StatCardProps {
  title: string;
  amount: string;
  icon: React.ElementType;
  trend?: number;
  isPositive?: boolean;
  sparkSeed?: number;
  color?: 'green' | 'red' | 'blue' | 'purple' | 'orange';
}

const COLOR_MAP = {
  green:  { bg: 'rgba(16,185,129,0.10)',  icon: '#10B981', stroke: '#10B981', badge: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-400' },
  red:    { bg: 'rgba(239,68,68,0.10)',   icon: '#EF4444', stroke: '#EF4444', badge: 'text-red-500 bg-red-50 dark:bg-red-950/30 dark:text-red-400' },
  blue:   { bg: 'rgba(59,130,246,0.10)',  icon: '#3B82F6', stroke: '#3B82F6', badge: 'text-blue-600 bg-blue-50 dark:bg-blue-950/30 dark:text-blue-400' },
  purple: { bg: 'rgba(139,92,246,0.10)',  icon: '#8B5CF6', stroke: '#8B5CF6', badge: 'text-violet-600 bg-violet-50 dark:bg-violet-950/30 dark:text-violet-400' },
  orange: { bg: 'rgba(244,82,45,0.10)',   icon: '#F4522D', stroke: '#F4522D', badge: 'text-orange-600 bg-orange-50 dark:bg-orange-950/30 dark:text-orange-400' },
};

const PIE_COLORS = {
  posted: '#22c55e',
  draft: '#f59e0b',
  assets: '#3b82f6',
  liabilities: '#ef4444',
  equity: '#8b5cf6',
};

const StatCard = ({ title, amount, icon: Icon, trend = 0, isPositive = true, sparkSeed = 50, color = 'orange' }: StatCardProps) => {
  const c = COLOR_MAP[color];
  return (
    <div className="card-base ios-smooth p-5 hover-lift flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>{title}</span>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: c.bg }}>
          <Icon className="w-4 h-4" style={{ color: c.icon }} />
        </div>
      </div>

      <div>
        <div className="text-2xl font-bold tracking-tight" style={{ letterSpacing: '-0.03em' }}>{amount}</div>
        {trend ? (
          <div className={`inline-flex items-center gap-1 mt-1.5 text-xs font-semibold px-2 py-0.5 rounded-full ${isPositive ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-400' : 'text-red-500 bg-red-50 dark:bg-red-950/30'}`}>
            {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {trend}% vs last month
          </div>
        ) : null}
      </div>

      {/* Filo style colorful horizontal progress bars */}
      <div className="mt-2 flex items-center gap-2 w-full">
        <div style={{ width: PROGRESS_BARS[sparkSeed % 4].w1, height: '8px', background: PROGRESS_BARS[sparkSeed % 4].c1, borderRadius: '99px' }} />
        <div style={{ width: PROGRESS_BARS[sparkSeed % 4].w2, height: '8px', background: PROGRESS_BARS[sparkSeed % 4].c2, borderRadius: '99px' }} />
        <div style={{ width: PROGRESS_BARS[sparkSeed % 4].w3, height: '8px', background: PROGRESS_BARS[sparkSeed % 4].c3, borderRadius: '99px' }} />
      </div>
    </div>
  );
};


export const Dashboard = () => {
  const { t, i18n } = useTranslation();
  const [period, setPeriod] = React.useState<'month' | 'year'>('month');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['dashboard', period],
    queryFn: () => dashboardService.getSummary({ period }),
  });

  if (isLoading) return <SkeletonDashboard />;
  if (isError || !data) return <div className="text-red-500 p-4 card-base">Failed to load dashboard data.</div>;

  const { 
    total_revenue = "0", 
    total_expenses = "0", 
    net_income = "0", 
    total_assets = "0",
    total_liabilities = "0",
    total_equity = "0",
    net_margin_percent = "0",
    balance_sheet_is_balanced = true,
    balance_sheet_out_of_balance_amount = "0",
    monthly_trend = [],
    posted_entries_count = 0,
    draft_entries_count = 0,
    recent_entries = []
  } = data;

  const comparisonData = [
    { name: t('dashboard.total_revenue'), amount: parseFloat(total_revenue) || 0, color: '#22c55e' },
    { name: t('dashboard.total_expenses'), amount: parseFloat(total_expenses) || 0, color: '#ef4444' },
  ];

  const trendData = monthly_trend.map((row) => ({
    month: row.month,
    revenue: parseFloat(row.revenue) || 0,
    expenses: parseFloat(row.expenses) || 0,
    net_income: parseFloat(row.net_income) || 0,
  }));

  const statusData = [
    { name: t('dashboard.posted', 'Posted'), value: posted_entries_count, color: PIE_COLORS.posted },
    { name: t('dashboard.draft', 'Draft'), value: draft_entries_count, color: PIE_COLORS.draft },
  ];

  const structureData = [
    { name: t('reports.assets', 'Assets'), value: parseFloat(total_assets) || 0, color: PIE_COLORS.assets },
    { name: t('reports.liabilities', 'Liabilities'), value: parseFloat(total_liabilities) || 0, color: PIE_COLORS.liabilities },
    { name: t('reports.equity', 'Equity'), value: parseFloat(total_equity) || 0, color: PIE_COLORS.equity },
  ];

  const hasStatusData = statusData.some((item) => item.value > 0);
  const hasStructureData = structureData.some((item) => item.value > 0);
  const netMargin = parseFloat(net_margin_percent) || 0;
  const netMarginWidth = Math.min(Math.abs(netMargin), 100);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? t('dashboard.morning', 'Good morning') : hour < 18 ? t('dashboard.afternoon', 'Good afternoon') : t('dashboard.evening', 'Good evening');
  const today = new Date().toLocaleDateString(i18n.language === 'uz' ? 'uz-UZ' : i18n.language === 'ru' ? 'ru-RU' : 'en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <div className="space-y-6 animate-page-enter">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-3 sm:gap-4">
        <div>
          <p className="text-sm font-medium mb-1" style={{ color: 'var(--color-text-muted)' }}>{today}</p>
          <h1 className="text-2xl font-bold tracking-tight">{greeting} 👋</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{t('dashboard.subtitle')}</p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="flex rounded-xl border border-borderBase p-1 w-full sm:w-auto">
            <button
              onClick={() => setPeriod('month')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex-1 sm:flex-initial ${period === 'month' ? 'bg-primary text-white' : 'text-textMain/70 hover:bg-black/5 dark:hover:bg-white/5'}`}
            >
              {t('dashboard.this_month', 'This Month')}
            </button>
            <button
              onClick={() => setPeriod('year')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex-1 sm:flex-initial ${period === 'year' ? 'bg-primary text-white' : 'text-textMain/70 hover:bg-black/5 dark:hover:bg-white/5'}`}
            >
              {t('dashboard.this_year', 'This Year')}
            </button>
          </div>
          <div
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium"
            style={{ background: 'var(--color-success-light)', color: 'var(--color-success)' }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
            {t('dashboard.live', 'Live')}
          </div>
        </div>
      </div>

      {draft_entries_count > 0 && (
        <div className="rounded-2xl border border-orange-300/60 bg-orange-50 dark:bg-orange-950/20 px-4 py-3 text-sm text-orange-800 dark:text-orange-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <p className="font-semibold">
              {t('dashboard.draft_warning_title', {
                count: draft_entries_count,
                defaultValue: 'You have {{count}} unposted draft transactions.',
              })}
            </p>
            <p className="text-xs mt-1 opacity-90">
              {t('dashboard.draft_warning_desc', 'These are not included in financial totals.')}
            </p>
          </div>
          <Link to="/journal?status=draft" className="text-xs font-semibold underline whitespace-nowrap self-start sm:self-center">
            {t('dashboard.view_drafts', 'View drafts')}
          </Link>
        </div>
      )}

      {!balance_sheet_is_balanced && (
        <div className="rounded-2xl border border-red-300/60 bg-red-50 dark:bg-red-950/20 px-4 py-3 text-sm text-red-700 dark:text-red-200">
          <p className="font-semibold">
            {t('dashboard.balance_warning_title', {
              amount: formatCurrency(balance_sheet_out_of_balance_amount),
              defaultValue: 'Balance Sheet is out of balance by {{amount}}',
            })}
          </p>
          <p className="text-xs mt-1 opacity-90">
            {t('dashboard.balance_warning_desc', 'Review posted entries and account mappings.')}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5 stagger-children">
        <StatCard 
          title={t('dashboard.total_revenue')} 
          amount={formatCurrency(total_revenue)} 
          icon={DollarSign} isPositive sparkSeed={80} color="green"
        />
        <StatCard 
          title={t('dashboard.total_expenses')} 
          amount={formatCurrency(total_expenses)} 
          icon={Activity} isPositive={false} sparkSeed={45} color="red"
        />
        <StatCard 
          title={t('dashboard.net_income')} 
          amount={formatCurrency(net_income)} 
          icon={DollarSign} isPositive={parseFloat(net_income) >= 0} sparkSeed={60} color="blue"
        />
        <StatCard 
          title={t('dashboard.total_assets')} 
          amount={formatCurrency(total_assets)} 
          icon={Landmark} isPositive sparkSeed={95} color="purple"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader title={t('dashboard.vs')} />
            <CardBody>
              <div className="h-64 sm:h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={comparisonData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }} barCategoryGap="35%">
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false}
                      tick={{ fill: 'var(--color-text-muted)', fontSize: 12, fontWeight: 500 }} />
                    <YAxis axisLine={false} tickLine={false}
                      tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }}
                      tickFormatter={(v) => `${(v/1000000).toFixed(0)}M`} width={40} />
                    <Tooltip
                      contentStyle={{ background: 'var(--color-card-bg)', border: '1px solid var(--color-border)', borderRadius: 12, boxShadow: 'var(--shadow-md)', fontSize: 13 }}
                      cursor={{ fill: 'var(--color-primary-dim)', radius: 4 }}
                      formatter={(val: number) => [formatCurrency(val), 'Amount']}
                    />
                    <Bar dataKey="amount" radius={[6, 6, 0, 0]} maxBarSize={52}>
                      {comparisonData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardBody>
          </Card>
        </div>

        <div>
          <Card className="h-full">
            <CardHeader title={t('dashboard.transaction_status', 'Transaction Status')}>
              <PieChartIcon className="w-4 h-4 text-textMain/50" />
            </CardHeader>
            <CardBody>
              {hasStatusData ? (
                <div className="h-64 sm:h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusData}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={58}
                        outerRadius={84}
                        paddingAngle={4}
                        stroke="none"
                      >
                        {statusData.map((entry, idx) => (
                          <Cell key={`status-${idx}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => [value, t('dashboard.entries', 'entries')]} />
                      <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-72 flex items-center justify-center text-sm text-textMain/50">
                  {t('dashboard.no_chart_data', 'No data available for chart')}
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader title={t('dashboard.monthly_trend', '6-Month Financial Trend')}>
              <TrendingUp className="w-4 h-4 text-textMain/50" />
            </CardHeader>
            <CardBody>
              <div className="h-64 sm:h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData} margin={{ top: 8, right: 12, left: 8, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false}
                      tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }} />
                    <YAxis axisLine={false} tickLine={false}
                      tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }}
                      tickFormatter={(v) => `${(v / 1000000).toFixed(0)}M`} />
                    <Tooltip
                      contentStyle={{ background: 'var(--color-card-bg)', border: '1px solid var(--color-border)', borderRadius: 12, boxShadow: 'var(--shadow-md)', fontSize: 13 }}
                      formatter={(val: number) => [formatCurrency(val), 'Amount']}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="revenue" stroke="#22c55e" strokeWidth={2.5} dot={{ r: 3 }} name={t('dashboard.total_revenue')} />
                    <Line type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2.5} dot={{ r: 3 }} name={t('dashboard.total_expenses')} />
                    <Line type="monotone" dataKey="net_income" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 3 }} name={t('dashboard.net_income')} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardBody>
          </Card>
        </div>

        <div>
          <Card className="h-full">
            <CardHeader title={t('dashboard.financial_structure', 'Financial Structure')}>
              <PieChartIcon className="w-4 h-4 text-textMain/50" />
            </CardHeader>
            <CardBody>
              {hasStructureData ? (
                <>
                  <div className="h-52 sm:h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={structureData}
                          dataKey="value"
                          nameKey="name"
                          innerRadius={44}
                          outerRadius={74}
                          paddingAngle={3}
                          stroke="none"
                        >
                          {structureData.map((entry, idx) => (
                            <Cell key={`structure-${idx}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => [formatCurrency(value), t('common.amount', 'Amount')]} />
                        <Legend verticalAlign="bottom" height={30} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="mt-2">
                    <div className="flex items-center justify-between text-xs text-textMain/60 mb-1">
                      <span>{t('dashboard.net_margin', 'Net Margin')}</span>
                      <span className={netMargin >= 0 ? 'text-emerald-600' : 'text-red-600'}>{netMargin.toFixed(2)}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-black/5 dark:bg-white/10 overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${netMarginWidth}%`,
                          background: netMargin >= 0 ? '#22c55e' : '#ef4444',
                        }}
                      />
                    </div>
                  </div>
                </>
              ) : (
                <div className="h-72 flex items-center justify-center text-sm text-textMain/50">
                  {t('dashboard.no_chart_data', 'No data available for chart')}
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      </div>

      <div>
        <Card>
          <CardHeader title={t('dashboard.activity')} />
          <CardBody className="p-0">
            <div className="px-4 sm:px-6 py-4 flex items-center justify-between border-b border-borderBase bg-gray-50/50 dark:bg-gray-800/30 gap-3">
              <div>
                <h3 className="font-bold text-lg">{t('dashboard.activity')}</h3>
                <p className="text-sm text-textMain/50">{t('dashboard.activity_latest', 'Latest transaction logs')}</p>
              </div>
              <Link to="/journal" className="text-primary text-sm font-semibold hover:underline flex items-center gap-1 group">
                {t('dashboard.view_all', 'View All')} <ArrowUpRight className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </Link>
            </div>
            <ul className="divide-y divide-gray-100 dark:divide-gray-800">
              {recent_entries?.map((entry: any) => (
                <li key={entry.id} className="p-4 sm:p-6 hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                  {(() => {
                    const status = entry.status || (entry.is_posted ? 'posted' : 'draft');
                    const badgeVariant = status === 'cancelled' ? 'error' : status === 'posted' ? 'success' : 'warning';
                    return (
                      <>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-1 gap-2">
                          <span className="font-medium text-sm pr-4 break-words">{entry.description}</span>
                          <Badge variant={badgeVariant}>
                            {status === 'cancelled' ? t('dashboard.cancelled', 'Cancelled') : status === 'posted' ? t('dashboard.posted') : t('dashboard.draft')}
                          </Badge>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs text-textMain/50 gap-1">
                          <span>{entry.reference || `REF #${entry.id}`}</span>
                          <span className="font-semibold text-textMain/80">{formatCurrency(entry.amount || '0')}</span>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs text-textMain/50 mt-1 gap-1">
                          <span>{entry.created_by_name}</span>
                          <span>{formatDate(entry.date)}</span>
                        </div>
                      </>
                    );
                  })()}
                </li>
              ))}
              {(!recent_entries || recent_entries.length === 0) && (
                <li className="p-6 text-center text-sm text-textMain/50">{t('dashboard.no_entries')}</li>
              )}
            </ul>
          </CardBody>
        </Card>
      </div>
    </div>
  );
};
