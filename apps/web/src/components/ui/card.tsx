import { cn } from '@/lib/utils';
import type { HTMLAttributes } from 'react';
export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('rounded-lg bg-surface border border-line shadow-card overflow-hidden', className)} {...props} />;
}
