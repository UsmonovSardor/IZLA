import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatUZS(value: number | string): string {
  const n = typeof value === 'string' ? Number(value) : value;
  if (!n) return 'Bepul';
  if (n >= 1_000_000) return `${(n / 1_000_000).toLocaleString('ru-RU', { maximumFractionDigits: 1 })} mln so'm`;
  return `${n.toLocaleString('ru-RU')} so'm`;
}
