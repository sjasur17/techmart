import { format, parseISO } from 'date-fns';

export const formatCurrency = (amount: string | number, currency: string = 'UZS') => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  const locale = currency === 'RUB' ? 'ru-RU' : currency === 'USD' ? 'en-US' : 'uz-UZ';
  
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
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
