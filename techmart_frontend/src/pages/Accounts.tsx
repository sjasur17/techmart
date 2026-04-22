import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { accountsService } from '../api/services';
import { Card, CardHeader, CardBody } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { formatCurrency, formatDateWithTime } from '../utils/format';
import { FileText, Search, Plus, X, Loader2 } from 'lucide-react';
import { SkeletonTable } from '../components/ui/Skeleton';
import toast from 'react-hot-toast';
import { apiClient } from '../api/axios';

/* ─── New Account Modal ─── */
interface NewAccountModalProps { onClose: () => void; }
const ACCOUNT_TYPES = [
  { value: 'A', label: 'Asset' },
  { value: 'L', label: 'Liability' },
  { value: 'E', label: 'Equity' },
  { value: 'R', label: 'Revenue' },
  { value: 'X', label: 'Expense' },
];

const NewAccountModal = ({ onClose }: NewAccountModalProps) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ code: '', name: '', account_type: 'A', description: '' });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.code || !form.name) { toast.error(t('common.error_code_name_required', 'Code and Name are required')); return; }
    setSaving(true);
    try {
      await apiClient.post('/accounts/', form);
      toast.success(t('common.account_created', 'Account created!'));
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || err.response?.data?.code?.[0] || t('common.account_create_failed', 'Failed to create account'));
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-md card-base p-6 animate-scale-in">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-bold">{t('accounts.new_account', 'New Account')}</h2>
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>{t('accounts.new_account_desc', 'Add a new ledger account')}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide block mb-1.5" style={{ color: 'var(--color-text-muted)' }}>
                {t('accounts.code', 'Account Code')} *
              </label>
              <input
                className="input-base w-full"
                placeholder="e.g. 1010"
                value={form.code}
                onChange={e => setForm(p => ({ ...p, code: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide block mb-1.5" style={{ color: 'var(--color-text-muted)' }}>
                {t('accounts.type', 'Type')} *
              </label>
              <select
                className="input-base w-full"
                value={form.account_type}
                onChange={e => setForm(p => ({ ...p, account_type: e.target.value }))}
              >
                {ACCOUNT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wide block mb-1.5" style={{ color: 'var(--color-text-muted)' }}>
              {t('accounts.name', 'Account Name')} *
            </label>
            <input
              className="input-base w-full"
              placeholder="e.g. Cash and Cash Equivalents"
              value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
            />
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wide block mb-1.5" style={{ color: 'var(--color-text-muted)' }}>
              {t('common.description', 'Description')}
            </label>
            <textarea
              className="input-base w-full resize-none"
              rows={2}
              placeholder={t('common.optional_desc', 'Optional description...')}
              value={form.description}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              {saving ? t('common.creating', 'Creating...') : t('common.create_account', 'Create Account')}
            </button>
            <button type="button" onClick={onClose} className="btn-secondary px-4">
              {t('common.cancel', 'Cancel')}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

/* ─── Main Component ─── */
export const Accounts = () => {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['accounts', page, searchTerm],
    queryFn: () => accountsService.getAccounts({ page, search: searchTerm }),
  });

  const getBadgeVariant = (type: string) => {
    switch (type) {
      case 'A': return 'info';
      case 'L': return 'warning';
      case 'E': return 'default';
      case 'R': return 'success';
      case 'X': return 'error';
      default:  return 'default';
    }
  };

  return (
    <div className="space-y-6">
      {showModal && <NewAccountModal onClose={() => setShowModal(false)} />}

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('accounts.title')}</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{t('accounts.subtitle')}</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary"
        >
          <Plus className="w-4 h-4" />
          {t('accounts.new_account')}
        </button>
      </div>

      <Card>
        <CardHeader>
          <div className="relative w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-muted)' }} />
            <input
              type="text"
              placeholder={t('accounts.search')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-base pl-9 w-full"
            />
          </div>
        </CardHeader>
        <CardBody className="p-0">
          {isLoading ? (
            <SkeletonTable rows={6} />
          ) : isError ? (
            <div className="p-8 text-center" style={{ color: 'var(--color-danger)' }}>{t('accounts.error')}</div>
          ) : data?.results?.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="w-10 h-10 mx-auto mb-3 opacity-20" />
              <p className="text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>{t('accounts.no_accounts')}</p>
              <button onClick={() => setShowModal(true)} className="btn-primary mt-4 mx-auto">
                <Plus className="w-4 h-4" /> {t('accounts.new_account', 'Add first account')}
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table-premium">
                <thead>
                  <tr>
                    <th>{t('accounts.code')}</th>
                    <th>{t('accounts.name')}</th>
                    <th>{t('accounts.type')}</th>
                    <th className="text-right">{t('accounts.balance')}</th>
                    <th>{t('common.status')}</th>
                    <th className="text-right">{t('accounts.updated')}</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.results?.map((acc) => (
                    <tr key={acc.id}>
                      <td className="font-mono font-semibold text-xs"
                        style={{ color: 'var(--color-primary)' }}>{acc.code}</td>
                      <td className="font-medium">{acc.name}</td>
                      <td>
                        <Badge variant={getBadgeVariant(acc.account_type)}>
                          {acc.account_type_display}
                        </Badge>
                      </td>
                      <td className="text-right font-semibold">{formatCurrency(acc.balance)}</td>
                      <td>
                        <Badge variant={acc.is_active ? 'success' : 'error'}>
                          {acc.is_active ? t('accounts.active') : t('accounts.inactive')}
                        </Badge>
                      </td>
                      <td className="text-right text-xs" style={{ color: 'var(--color-text-muted)' }}>
                        {formatDateWithTime(acc.updated_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {data && (data.next || data.previous) && (
            <div className="px-5 py-4 border-t flex items-center justify-between" style={{ borderColor: 'var(--color-border)' }}>
              <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>{t('accounts.total')}: {data.count}</span>
              <div className="flex gap-2">
                <button disabled={!data.previous} onClick={() => setPage(p => p - 1)} className="btn-secondary px-3 py-1.5 text-xs disabled:opacity-40">
                  {t('accounts.prev')}
                </button>
                <button disabled={!data.next} onClick={() => setPage(p => p + 1)} className="btn-secondary px-3 py-1.5 text-xs disabled:opacity-40">
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
