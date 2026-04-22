import { format, parseISO } from 'date-fns';

export const formatCurrency = (amount: string | number) => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('uz-UZ', {
    style: 'currency',
    currency: 'UZS',
    minimumFractionDigits: 2,
  }).format(num);
};

export const formatDate = (dateString: string) => {
  if (!dateString) return '';
  return format(parseISO(dateString), 'MMM dd, yyyy');
};

export const formatDateWithTime = (dateString: string) => {
  if (!dateString) return '';
  return format(parseISO(dateString), 'MMM dd, yyyy HH:mm');
};
