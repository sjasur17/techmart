import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { reportsService } from '../../api/services';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Loading } from '../../components/ui/Loading';
import { formatCurrency, formatDate } from '../../utils/format';
import { Download, Filter } from 'lucide-react';
import { PrintButton } from '../../components/ui/PrintButton';
import { downloadCsv } from '../../utils/csv';
import toast from 'react-hot-toast';

export const IncomeStatement = () => {
  const { t } = useTranslation();
  const [dateFrom, setDateFrom] = useState(new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0]);
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['income-statement', dateFrom, dateTo],
    queryFn: () => reportsService.getIncomeStatement({ date_from: dateFrom, date_to: dateTo }),
  });

  const handleExport = () => {
    if (!data) return;

    try {
      const rows: Array<Array<string | number>> = [
        ['Report', 'Income Statement'],
        ['Date From', data.date_from],
        ['Date To', data.date_to],
        ['Generated At', data.generated_at],
        [],
        ['Section', 'Account Code', 'Account Name', 'Amount'],
        ...data.revenues.map((item) => ['Revenue', item.account_code, item.account_name, item.amount]),
        ...data.expenses.map((item) => ['Expense', item.account_code, item.account_name, item.amount]),
        [],
        ['Total Revenue', '', '', data.total_revenue],
        ['Total Expenses', '', '', data.total_expenses],
        ['Net Income', '', '', data.net_income],
      ];

      downloadCsv(rows, `income_statement_${data.date_from}_to_${data.date_to}.csv`);
    } catch {
      toast.error(t('reports.export_failed', 'CSV export failed. Please try again.'));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 mb-8">
        <div>
          <h1 className="text-2xl font-bold">{t('reports.income_statement')}</h1>
          <p className="text-textMain/60 text-sm mt-1">{t('reports.date_range')} (Profit & Loss)</p>
        </div>
        
        <div className="flex flex-wrap items-center justify-start lg:justify-end gap-2 no-print w-full lg:w-auto">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 bg-white dark:bg-gray-800 p-2 rounded-xl shadow-soft w-full lg:w-auto">
            <Filter className="w-4 h-4 text-gray-400 ml-2" />
            <input 
              type="date" 
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="px-2 py-1 border border-borderBase bg-transparent rounded text-sm focus:outline-none focus:border-primary w-full sm:w-auto"
            />
            <span className="text-gray-400 hidden sm:inline">-</span>
            <input 
              type="date" 
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="px-2 py-1 border border-borderBase bg-transparent rounded text-sm focus:outline-none focus:border-primary w-full sm:w-auto"
            />
          </div>

          <PrintButton title={t('reports.print')} />

          <button
            onClick={handleExport}
            className="flex items-center justify-center gap-2 bg-white dark:bg-gray-800 border border-borderBase text-textMain px-4 py-2 rounded-lg font-medium hover:bg-black/5 dark:hover:bg-white/5 transition-colors w-full sm:w-auto"
          >
            <Download className="w-4 h-4" /> {t('reports.export_csv')}
          </button>
        </div>
      </div>

      {isLoading ? (
        <Loading text={t('reports.loading')} />
      ) : isError || !data ? (
        <div className="text-red-500">{t('reports.error')}</div>
      ) : (
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader title={`${t('reports.from_to')}: ${formatDate(data.date_from)} - ${formatDate(data.date_to)}`} />
            <CardBody className="p-0">
              <div className="px-4 sm:px-8 py-6 space-y-6">
                
                {/* Revenues */}
                <div>
                  <h3 className="uppercase text-xs font-bold text-textMain/50 mb-3 tracking-wider">{t('reports.revenues')}</h3>
                  <div className="space-y-2 border-b border-borderBase pb-4">
                    {data.revenues.map(rev => (
                      <div key={rev.account_code} className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-sm gap-1">
                        <span>{rev.account_name}</span>
                        <span>{formatCurrency(rev.amount)}</span>
                      </div>
                    ))}
                    {data.revenues.length === 0 && <span className="text-sm text-gray-400">-</span>}
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-sm font-semibold pt-4 gap-1">
                    <span>{t('reports.total')} {t('reports.revenues')}</span>
                    <span className="text-green-600">{formatCurrency(data.total_revenue)}</span>
                  </div>
                </div>

                {/* Expenses */}
                <div className="pt-2">
                  <h3 className="uppercase text-xs font-bold text-textMain/50 mb-3 tracking-wider">{t('reports.expenses')}</h3>
                  <div className="space-y-2 border-b border-borderBase pb-4">
                    {data.expenses.map(exp => (
                      <div key={exp.account_code} className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-sm gap-1">
                        <span>{exp.account_name}</span>
                        <span>{formatCurrency(exp.amount)}</span>
                      </div>
                    ))}
                     {data.expenses.length === 0 && <span className="text-sm text-gray-400">-</span>}
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-sm font-semibold pt-4 gap-1">
                    <span>{t('reports.total')} {t('reports.expenses')}</span>
                    <span className="text-red-500">{formatCurrency(data.total_expenses)}</span>
                  </div>
                </div>

              </div>

              {/* Net Income */}
              <div className="bg-gray-50/80 dark:bg-gray-800/80 border-t-2 border-borderBase px-4 sm:px-8 py-6 flex flex-col sm:flex-row sm:items-center sm:justify-between rounded-b-xl gap-2">
                <span className="text-lg font-bold uppercase tracking-wide">{t('reports.net_income')}</span>
                <span className={`text-2xl font-bold ${parseFloat(data.net_income) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(data.net_income)}
                </span>
              </div>
            </CardBody>
          </Card>
        </div>
      )}
    </div>
  );
};
