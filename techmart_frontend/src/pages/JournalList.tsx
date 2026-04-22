import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { journalService } from '../api/services';
import { Card, CardHeader, CardBody } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Loading } from '../components/ui/Loading';
import { formatDateWithTime, formatDate } from '../utils/format';
import { CheckCircle2, RotateCcw } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/useAuthStore';

export const JournalList = () => {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [searchParams] = useSearchParams();
  const statusFilter = searchParams.get('status');
  const isPostedFilter = statusFilter === 'draft' ? false : statusFilter === 'posted' ? true : undefined;
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const isAdmin = user?.is_staff || user?.is_superuser;

  useEffect(() => {
    setPage(1);
  }, [statusFilter]);

  const { data, isLoading } = useQuery({
    queryKey: ['journal', page, statusFilter],
    queryFn: () => {
      const params: Record<string, any> = { page };
      if (isPostedFilter !== undefined) {
        params.is_posted = isPostedFilter;
      }
      return journalService.getEntries(params);
    },
  });

  const postMutation = useMutation({
    mutationFn: journalService.postEntry,
    onSuccess: () => {
      toast.success(t('journals.post_success'));
      queryClient.invalidateQueries({ queryKey: ['journal'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || t('journals.post_fail'));
    }
  });

  const unpostMutation = useMutation({
    mutationFn: journalService.unpostEntry,
    onSuccess: () => {
      toast.success(t('journals.unpost_success'));
      queryClient.invalidateQueries({ queryKey: ['journal'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || t('journals.unpost_fail'));
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold">{t('journals.title')}</h1>
          <p className="text-textMain/60 text-sm mt-1">{t('journals.subtitle')}</p>
          {statusFilter === 'draft' && (
            <p className="text-xs mt-2 px-2.5 py-1 rounded-full inline-flex bg-orange-100 text-orange-700">
              {t('journals.draft_filter_active', 'Showing draft transactions only')}
            </p>
          )}
        </div>
        <Link 
          to="/journal/new" 
          className="bg-primary text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-hover transition-colors"
        >
          {t('journals.new_entry')}
        </Link>
      </div>

      <Card>
        <CardBody className="p-0">
          {isLoading ? (
            <Loading text={t('journals.loading')} />
          ) : data?.results.length === 0 ? (
            <div className="p-8 text-center text-textMain/50">{t('journals.no_entries')}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 border-b border-borderBase dark:bg-gray-800/30 text-xs uppercase font-semibold text-textMain/60">
                  <tr>
                    <th className="px-6 py-4">{t('journals.id_ref')}</th>
                    <th className="px-6 py-4">{t('journals.date')}</th>
                    <th className="px-6 py-4">{t('journals.description')}</th>
                    <th className="px-6 py-4">{t('journals.created_by')}</th>
                    <th className="px-6 py-4">{t('journals.status')}</th>
                    <th className="px-6 py-4 text-right">{t('journals.actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data?.results.map((entry) => (
                    <tr key={entry.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-primary">#{entry.id}</div>
                        <div className="text-xs text-textMain/50">{entry.reference}</div>
                      </td>
                      <td className="px-6 py-4 font-medium">{formatDate(entry.date)}</td>
                      <td className="px-6 py-4">
                        <div className="font-medium">{entry.description}</div>
                        <div className="text-xs text-textMain/50">{entry.line_count} {t('journals.lines')}</div>
                      </td>
                      <td className="px-6 py-4">{entry.created_by_name}</td>
                      <td className="px-6 py-4">
                        <Badge variant={entry.is_posted ? 'success' : 'warning'}>
                          {entry.is_posted ? t('journals.posted') : t('journals.draft')}
                        </Badge>
                        {entry.posted_at && (
                          <div className="text-[10px] text-textMain/40 mt-1">
                            {formatDateWithTime(entry.posted_at)}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {!entry.is_posted ? (
                          <button 
                            onClick={() => {
                              if(window.confirm(t('journals.post_confirm'))) {
                                postMutation.mutate(entry.id);
                              }
                            }}
                            disabled={postMutation.isPending}
                            className="text-green-600 hover:bg-green-50/20 p-2 rounded-lg transition-colors flex items-center justify-center ml-auto"
                            title="Post Entry"
                          >
                            <CheckCircle2 className="w-5 h-5" />
                          </button>
                        ) : isAdmin ? (
                          <button 
                            onClick={() => {
                              if(window.confirm(t('journals.unpost_confirm'))) {
                                unpostMutation.mutate(entry.id);
                              }
                            }}
                            disabled={unpostMutation.isPending}
                            className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors flex items-center justify-center ml-auto"
                            title="Unpost Entry (Admin Only)"
                          >
                            <RotateCcw className="w-5 h-5" />
                          </button>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {data && (data.next || data.previous) && (
            <div className="px-6 py-4 border-t border-borderBase flex items-center justify-between">
              <span className="text-sm text-textMain/60">{t('accounts.total')}: {data.count}</span>
              <div className="flex gap-2">
                <button 
                  disabled={!data.previous} 
                  onClick={() => setPage(p => p - 1)}
                  className="px-3 py-1 rounded border border-borderBase text-sm disabled:opacity-50 hover:bg-black/5 dark:hover:bg-white/5"
                >
                  {t('accounts.prev')}
                </button>
                <button 
                  disabled={!data.next} 
                  onClick={() => setPage(p => p + 1)}
                  className="px-3 py-1 rounded border border-borderBase text-sm disabled:opacity-50 hover:bg-black/5 dark:hover:bg-white/5"
                >
                  {t('accounts.next')}
                </button>
              </div>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
};
