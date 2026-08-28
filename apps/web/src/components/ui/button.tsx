import { cn } from '@/lib/utils';
import type { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'teal';
const variants: Record<Variant, string> = {
  primary: 'bg-brand text-white hover:bg-brand-700 shadow-card',
  teal: 'bg-teal text-white hover:opacity-90 shadow-card',
  secondary: 'bg-surface text-ink border border-line hover:bg-bg',
  ghost: 'text-ink hover:bg-bg',
};

export function Button({
  variant = 'primary',
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium transition min-h-[44px] disabled:opacity-50',
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
