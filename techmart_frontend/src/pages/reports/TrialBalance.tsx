import React from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { reportsService } from '../../api/services';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Loading } from '../../components/ui/Loading';
import { formatCurrency, formatDateWithTime } from '../../utils/format';
import { Download, Loader2 } from 'lucide-react';
import { Badge } from '../../components/ui/Badge';
import { PrintButton } from '../../components/ui/PrintButton';
import toast from 'react-hot-toast';

export const TrialBalance = () => {
  const { t } = useTranslation();
  const [isExporting, setIsExporting] = React.useState(false);
  const { data, isLoading, isError } = useQuery({
    queryKey: ['trial-balance'],
    queryFn: () => reportsService.getTrialBalance(),
  });

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const { blob, filename } = await reportsService.exportTrialBalanceCsv();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error(t('reports.export_failed', 'CSV export failed. Please try again.'));
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) return <Loading text={t('reports.loading')} />;
  if (isError || !data) return <div className="text-red-500">{t('reports.error')}</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold">{t('reports.trial_balance')}</h1>
          <p className="text-textMain/60 text-sm mt-1">
            {t('reports.generated_at')} {formatDateWithTime(data.generated_at)}
          </p>
        </div>
        <div className="flex items-center gap-2 no-print">
          <PrintButton title={t('reports.print')} />
          <button 
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-borderBase text-textMain px-4 py-2 rounded-lg font-medium hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          >
            {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            {isExporting ? t('auth.sending', 'Sending...') : t('reports.export_csv')}
          </button>
        </div>
      </div>

      <Card>
        <CardBody className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800/30 border-b border-borderBase text-xs uppercase font-semibold text-textMain/60">
                <tr>
                  <th className="px-6 py-4">{t('accounts.code')}</th>
                  <th className="px-6 py-4">{t('accounts.name')}</th>
                  <th className="px-6 py-4">{t('accounts.type')}</th>
                  <th className="px-6 py-4 text-right">{t('journal_form.debit')}</th>
                  <th className="px-6 py-4 text-right">{t('journal_form.credit')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.accounts.map((acc) => {
                  const balance = parseFloat(acc.balance);
                  const isDebitNormal = ['A', 'X'].includes(acc.account_type);
                  // Determine display column based on normal balance rules
                  const debitValue = isDebitNormal ? balance : 0;
                  const creditValue = !isDebitNormal ? balance : 0;

                  return (
                    <tr key={acc.account_code} className="hover:bg-gray-50/50">
                      <td className="px-6 py-3 font-medium">{acc.account_code}</td>
                      <td className="px-6 py-3">{acc.account_name}</td>
                      <td className="px-6 py-3 text-textMain/60">{acc.account_type_display}</td>
                      <td className="px-6 py-3 text-right">
                        {debitValue > 0 ? formatCurrency(debitValue) : '-'}
                      </td>
                      <td className="px-6 py-3 text-right">
                        {creditValue > 0 ? formatCurrency(creditValue) : '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-gray-50 dark:bg-gray-800/30 border-t-2 border-borderBase">
                <tr>
                  <td colSpan={3} className="px-6 py-4 text-right font-bold uppercase text-textMain/60">
                    {t('reports.grand_totals')}
                  </td>
                  <td className={`px-6 py-4 text-right font-bold ${data.is_balanced ? 'text-green-600' : 'text-red-500'}`}>
                    {formatCurrency(data.grand_totals.total_debits)}
                  </td>
                  <td className={`px-6 py-4 text-right font-bold ${data.is_balanced ? 'text-green-600' : 'text-red-500'}`}>
                    {formatCurrency(data.grand_totals.total_credits)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
          
          <div className="p-4 border-t border-borderBase flex justify-end">
             {data.is_balanced ? (
               <Badge variant="success">{t('reports.is_balanced')}</Badge>
             ) : (
               <Badge variant="error">{t('reports.is_unbalanced')}</Badge>
             )}
          </div>
        </CardBody>
      </Card>
    </div>
  );
};
