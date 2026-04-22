import React from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { reportsService } from '../../api/services';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Loading } from '../../components/ui/Loading';
import { formatCurrency, formatDateWithTime } from '../../utils/format';
import { Download } from 'lucide-react';
import { PrintButton } from '../../components/ui/PrintButton';
import { downloadCsv } from '../../utils/csv';
import toast from 'react-hot-toast';

export const BalanceSheet = () => {
  const { t } = useTranslation();
  const { data, isLoading, isError } = useQuery({
    queryKey: ['balance-sheet'],
    queryFn: () => reportsService.getBalanceSheet(),
  });

  const handleExport = () => {
    if (!data) return;

    try {
      const rows: Array<Array<string | number>> = [
        ['Report', 'Balance Sheet'],
        ['Generated At', data.generated_at],
        [],
        ['Section', 'Account Code', 'Account Name', 'Balance'],
        ...data.assets.map((item) => ['Asset', item.account_code, item.account_name, item.balance]),
        ...data.liabilities.map((item) => ['Liability', item.account_code, item.account_name, item.balance]),
        ...data.equity.map((item) => ['Equity', item.account_code, item.account_name, item.balance]),
        [],
        ['Total Assets', '', '', data.total_assets],
        ['Total Liabilities', '', '', data.total_liabilities],
        ['Total Equity', '', '', data.total_equity],
        ['Total Liabilities + Equity', '', '', data.total_liabilities_and_equity],
        ['Is Balanced', '', '', data.is_balanced ? 'YES' : 'NO'],
      ];

      downloadCsv(rows, `balance_sheet_${new Date().toISOString().slice(0, 10)}.csv`);
    } catch {
      toast.error(t('reports.export_failed', 'CSV export failed. Please try again.'));
    }
  };

  if (isLoading) return <Loading text={t('reports.loading')} />;
  if (isError || !data) return <div className="text-red-500">{t('reports.error')}</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-8">
        <div>
          <h1 className="text-2xl font-bold">{t('reports.balance_sheet')}</h1>
          <p className="text-textMain/60 text-sm mt-1">
            {t('reports.as_of')} {formatDateWithTime(data.generated_at)}
          </p>
        </div>

        <div className="flex items-center gap-2 no-print w-full sm:w-auto">
          <PrintButton title={t('reports.print')} />
          <button
            onClick={handleExport}
            className="flex items-center justify-center gap-2 bg-white dark:bg-gray-800 border border-borderBase text-textMain px-4 py-2 rounded-lg font-medium hover:bg-black/5 dark:hover:bg-white/5 transition-colors flex-1 sm:flex-initial"
          >
            <Download className="w-4 h-4" /> {t('reports.export_csv')}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Assets Form */}
        <Card>
          <CardHeader title={t('reports.assets')} />
          <CardBody className="p-0">
            <div className="w-full text-left text-sm py-4">
               {data.assets.length === 0 && <span className="px-6 text-gray-400">-</span>}
                 {data.assets.map(acc => (
                   <div key={acc.account_code} className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-4 sm:px-6 py-2 gap-1">
                   <span>[{acc.account_code}] {acc.account_name}</span>
                   <span>{formatCurrency(acc.balance)}</span>
                 </div>
               ))}
               <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between font-bold px-4 sm:px-6 py-4 border-t border-borderBase mt-4 bg-gray-50 dark:bg-gray-800/30 text-green-700 dark:text-green-500 gap-1">
                  <span>{t('reports.total')} {t('reports.assets')}</span>
                  <span>{formatCurrency(data.total_assets)}</span>
               </div>
            </div>
          </CardBody>
        </Card>

        {/* Liabilities and Equity */}
        <div className="space-y-8">
          <Card>
            <CardHeader title={t('reports.liabilities')} />
            <CardBody className="p-0">
              <div className="w-full text-left text-sm py-4">
                 {data.liabilities.length === 0 && <span className="px-6 text-gray-400">-</span>}
                 {data.liabilities.map(acc => (
                   <div key={acc.account_code} className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-4 sm:px-6 py-2 gap-1">
                     <span>[{acc.account_code}] {acc.account_name}</span>
                     <span>{formatCurrency(acc.balance)}</span>
                   </div>
                 ))}
                 <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between font-bold px-4 sm:px-6 py-4 border-t border-borderBase mt-4 bg-gray-50 dark:bg-gray-800/30 text-red-700 dark:text-red-500 gap-1">
                    <span>{t('reports.total')} {t('reports.liabilities')}</span>
                    <span>{formatCurrency(data.total_liabilities)}</span>
                 </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title={t('reports.equity')} />
            <CardBody className="p-0">
              <div className="w-full text-left text-sm py-4">
                 {data.equity.length === 0 && <span className="px-6 text-gray-400">-</span>}
                 {data.equity.map(acc => (
                   <div key={acc.account_code} className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-4 sm:px-6 py-2 gap-1">
                     <span className={acc.account_code === 'RETAINED' ? 'italic' : ''}>
                       {acc.account_code !== 'RETAINED' && `[${acc.account_code}]`} {acc.account_name}
                     </span>
                     <span>{formatCurrency(acc.balance)}</span>
                   </div>
                 ))}
                 <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between font-bold px-4 sm:px-6 py-4 border-t border-borderBase mt-4 bg-gray-50 dark:bg-gray-800/30 text-blue-700 dark:text-blue-500 gap-1">
                    <span>{t('reports.total')} {t('reports.equity')}</span>
                    <span>{formatCurrency(data.total_equity)}</span>
                 </div>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
      
      {/* Verification Check */}
      <Card className="mt-8 relative overflow-hidden">
        <CardBody className={`flex flex-col gap-3 sm:gap-0 sm:flex-row sm:justify-between sm:items-center text-base sm:text-lg font-bold p-4 sm:p-6 ${data.is_balanced ? 'bg-green-50/50 dark:bg-green-900/20 text-green-800 dark:text-green-500' : 'bg-red-50/50 dark:bg-red-900/20 text-red-800 dark:text-red-500'}`}>
          <span>Balance Check ({t('reports.assets')} = Liab + Equity)</span>
          <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
             <span>{formatCurrency(data.total_assets)}</span>
             <span>=</span>
             <span>{formatCurrency(data.total_liabilities_and_equity)}</span>
             <span>{data.is_balanced ? '✅ OK' : '❌ ERR'}</span>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};
