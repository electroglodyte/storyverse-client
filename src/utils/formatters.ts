import { format, formatDistance } from 'date-fns';

export const formatDate = (date: string | Date): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, 'MMM d, yyyy');
};

export const formatDateTime = (date: string | Date): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, 'MMM d, yyyy h:mm a');
};

export const timeAgo = (date: string | Date): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return formatDistance(d, new Date(), { addSuffix: true });
};

export const capitalize = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

export const titleCase = (str: string): string => {
  return str
    .split(' ')
    .map(word => capitalize(word))
    .join(' ');
};

export const truncate = (str: string, length: number = 100): string => {
  if (str.length <= length) return str;
  return str.slice(0, length) + '...';
};

export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat().format(num);
};

export const formatCurrency = (amount: number, currency: string = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount);
};

export const formatPercent = (value: number, decimalPlaces: number = 0): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces,
  }).format(value);
};

export const formatFileSize = (bytes: number): string => {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${Math.round(size * 100) / 100} ${units[unitIndex]}`;
};

export const snakeToTitle = (str: string): string => {
  return titleCase(str.replace(/_/g, ' '));
};
