import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useMutation } from '@tanstack/react-query';
import { accountsService, journalService } from '../api/services';
import { Card, CardHeader, CardBody } from '../components/ui/Card';
import { Loading } from '../components/ui/Loading';
import { formatCurrency } from '../utils/format';
import { Trash2, Plus, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

const entryLineSchema = z.object({
  account: z.coerce.number().min(1, 'Account is required'),
  debit: z.coerce.number().min(0).default(0),
  credit: z.coerce.number().min(0).default(0),
  memo: z.string().optional(),
}).refine(data => {
  return !(data.debit > 0 && data.credit > 0);
}, { message: "Cannot have both debit and credit on one line", path: ['debit'] });

const journalSchema = z.object({
  date: z.string().min(1, 'Date is required'),
  description: z.string().min(1, 'Description is required'),
  reference: z.string().optional(),
  currency: z.string().default('UZS'),
  lines: z.array(entryLineSchema).min(2, 'At least 2 lines are required'),
});

type JournalForm = z.infer<typeof journalSchema>;

export const CreateJournalEntry = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const { data: accountsData, isLoading: loadingAccounts } = useQuery({
    queryKey: ['all-accounts'],
    queryFn: () => accountsService.getAllAccounts(),
  });

  const { register, control, handleSubmit, formState: { errors } } = useForm<JournalForm>({
    resolver: zodResolver(journalSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      reference: '',
      description: '',
      currency: 'UZS',
      lines: [
        { account: 0, debit: 0, credit: 0, memo: '' },
        { account: 0, debit: 0, credit: 0, memo: '' },
      ],
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'lines'
  });

  // useWatch is reactive on each keystroke (unlike watch which only re-renders on form state changes)
  const watchLines = useWatch({ control, name: 'lines' });
  const watchCurrency = useWatch({ control, name: 'currency' });
  
  const { totalDebit, totalCredit } = useMemo(() => {
    return (watchLines || []).reduce((acc: any, line: any) => {
      acc.totalDebit  += parseFloat(String(line?.debit  || 0)) || 0;
      acc.totalCredit += parseFloat(String(line?.credit || 0)) || 0;
      return acc;
    }, { totalDebit: 0, totalCredit: 0 });
  }, [watchLines]);

  const createMutation = useMutation({
    mutationFn: journalService.createEntry,
    onSuccess: () => {
      toast.success(t('journal_form.success'));
      navigate('/journal');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || t('journal_form.success')); // fallback just in case
    }
  });

  const onSubmit = (data: JournalForm) => {
    // Structural check is handled by Zod. We format the lines back to string amounts
    const formattedData = {
      ...data,
      lines: data.lines.map(l => ({
        ...l,
        debit: l.debit.toFixed(2),
        credit: l.credit.toFixed(2),
      }))
    };
    
    // Note: React frontend does NOT prevent submission if unbalanced, 
    // we let the backend enforce the core business rules and return 400.
    // However, we could prevent it here if desired.
    
    createMutation.mutate(formattedData);
  };

  if (loadingAccounts) return <Loading text={t('reports.loading')} />;

  const isBalanced = totalDebit === totalCredit && totalDebit > 0;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-start sm:items-center gap-3 sm:gap-4 mb-8">
        <button 
          onClick={() => navigate('/journal')}
          className="p-2 bg-card border border-borderBase rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-500" />
        </button>
        <div>
          <h1 className="text-2xl font-bold">{t('journal_form.title')}</h1>
          <p className="text-textMain/60 text-sm mt-1">{t('journal_form.subtitle')}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader title={t('journal_form.title')} />
          <CardBody className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            <div>
              <label className="block text-sm font-medium mb-1">{t('journal_form.date')}</label>
              <input 
                type="date" 
                {...register('date')}
                className="w-full px-3 py-2 border border-borderBase bg-transparent rounded-lg shadow-sm focus:ring-primary focus:border-primary text-sm"
              />
              {errors.date && <p className="text-xs text-red-500 mt-1">{errors.date.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('common.currency')}</label>
              <select 
                {...register('currency')}
                className="w-full px-3 py-2 border border-borderBase bg-transparent rounded-lg shadow-sm focus:ring-primary focus:border-primary text-sm"
              >
                <option value="UZS">UZS - {t('currency.uzs')}</option>
                <option value="RUB">RUB - {t('currency.rub')}</option>
                <option value="USD">USD - {t('currency.usd')}</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('journal_form.reference')}</label>
              <input 
                type="text" 
                placeholder={t('journal_form.ref_placeholder')}
                {...register('reference')}
                className="w-full px-3 py-2 border border-borderBase bg-transparent rounded-lg shadow-sm focus:ring-primary focus:border-primary text-sm"
              />
            </div>
            <div className="md:col-span-3">
              <label className="block text-sm font-medium mb-1">{t('journals.description')}</label>
              <input 
                type="text" 
                placeholder={t('journal_form.desc_placeholder')}
                {...register('description')}
                className="w-full px-3 py-2 border border-borderBase bg-transparent rounded-lg shadow-sm focus:ring-primary focus:border-primary text-sm"
              />
              {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description.message}</p>}
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title={t('journals.lines')}>
            <button
              type="button"
              onClick={() => append({ account: 0, debit: 0, credit: 0, memo: '' })}
              className="flex items-center text-sm text-primary font-medium hover:text-primary-hover"
            >
              <Plus className="w-4 h-4 mr-1" /> {t('journal_form.add_line')}
            </button>
          </CardHeader>
          <CardBody className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 border-b border-borderBase dark:bg-gray-800/30 text-xs uppercase font-semibold text-textMain/60">
                  <tr>
                    <th className="px-4 sm:px-6 py-3 w-1/3">{t('journal_form.account')}</th>
                    <th className="px-4 sm:px-6 py-3 w-1/4">{t('journal_form.memo')}</th>
                    <th className="px-4 sm:px-6 py-3 w-1/6 text-right">{t('journal_form.debit')}</th>
                    <th className="px-4 sm:px-6 py-3 w-1/6 text-right">{t('journal_form.credit')}</th>
                    <th className="px-4 py-3 w-12"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {fields.map((field, index) => (
                    <tr key={field.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                      <td className="px-4 sm:px-6 py-3">
                        <select 
                          {...register(`lines.${index}.account` as const)}
                          className="w-full px-2 py-1.5 border border-borderBase bg-transparent rounded-md focus:ring-primary focus:border-primary text-sm"
                        >
                          <option value="0" disabled>{t('journal_form.account_placeholder')}</option>
                          {accountsData?.results?.map(acc => (
                            <option key={acc.id} value={acc.id}>
                              [{acc.code}] {acc.name}
                            </option>
                          ))}
                        </select>
                        {errors.lines?.[index]?.account && <p className="text-[10px] text-red-500 mt-1">{errors.lines[index]?.account?.message}</p>}
                      </td>
                      <td className="px-4 sm:px-6 py-3">
                        <input 
                          type="text" 
                          {...register(`lines.${index}.memo` as const)}
                          placeholder={t('journal_form.memo')}
                          className="w-full px-2 py-1.5 border border-borderBase bg-transparent rounded-md focus:ring-primary focus:border-primary text-sm"
                        />
                      </td>
                      <td className="px-4 sm:px-6 py-3">
                        <input 
                          type="number"
                          step="0.01"
                          min="0"
                          {...register(`lines.${index}.debit` as const)}
                          className="w-full px-2 py-1.5 border border-borderBase bg-transparent rounded-md focus:ring-primary focus:border-primary text-sm text-right"
                        />
                         {errors.lines?.[index]?.debit && <p className="text-[10px] text-red-500 mt-1">{errors.lines[index]?.debit?.message}</p>}
                      </td>
                      <td className="px-4 sm:px-6 py-3">
                        <input 
                          type="number"
                          step="0.01"
                          min="0"
                          {...register(`lines.${index}.credit` as const)}
                          className="w-full px-2 py-1.5 border border-borderBase bg-transparent rounded-md focus:ring-primary focus:border-primary text-sm text-right"
                        />
                         {errors.lines?.[index]?.credit && <p className="text-[10px] text-red-500 mt-1">{errors.lines[index]?.credit?.message}</p>}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          type="button"
                          onClick={() => remove(index)}
                          className="text-red-400 hover:text-red-600 transition-colors p-1"
                          disabled={fields.length <= 2}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50 border-t border-borderBase dark:bg-gray-800/30">
                  <tr>
                    <td colSpan={2} className="px-4 sm:px-6 py-4 text-right font-medium text-textMain/60">
                      {t('reports.total')}
                    </td>
                    <td className={`px-4 sm:px-6 py-4 text-right font-bold ${isBalanced ? 'text-green-600' : 'text-textMain'}`}>
                      {formatCurrency(totalDebit, watchCurrency)}
                    </td>
                    <td className={`px-4 sm:px-6 py-4 text-right font-bold ${isBalanced ? 'text-green-600' : 'text-textMain'}`}>
                      {formatCurrency(totalCredit, watchCurrency)}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
            
            {/* Balance warning visible to user even before backend validates */}
            {!isBalanced && totalDebit > 0 && totalCredit > 0 && (
              <div className="bg-red-50/50 dark:bg-red-900/20 text-red-700 dark:text-red-500 px-4 sm:px-6 py-3 text-sm font-medium border-t border-borderBase flex items-center justify-center text-center">
                {t('journal_form.difference')}: {formatCurrency(Math.abs(totalDebit - totalCredit), watchCurrency)}
              </div>
            )}
            
            {errors.lines?.root && (
              <div className="px-6 py-3 text-red-600 text-sm font-medium border-t border-borderBase mt-0 pt-3">
                {errors.lines.root.message}
              </div>
            )}
          </CardBody>
        </Card>

        <div className="flex flex-col sm:flex-row sm:justify-end gap-3 sm:gap-4">
          <button
            type="button"
            onClick={() => navigate('/journal')}
            className="px-6 py-2.5 border border-borderBase rounded-lg text-sm font-medium hover:bg-black/5 dark:hover:bg-white/5 transition-colors w-full sm:w-auto"
          >
            {t('journal_form.cancel')}
          </button>
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="px-6 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-hover transition-colors disabled:opacity-50 w-full sm:w-auto"
          >
            {createMutation.isPending ? t('reports.loading') : t('journal_form.save_draft')}
          </button>
        </div>
      </form>
    </div>
  );
};
