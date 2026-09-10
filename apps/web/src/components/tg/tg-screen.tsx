'use client';
import { cn } from '@/lib/utils';

/**
 * Mini app sahifa qobig'i — yuqori app-bar (safe-area) + kontent.
 * `large` — katta sarlavha (ildiz tablar uchun). `right` — o'ng slot.
 */
export function TgScreen({
  title,
  subtitle,
  right,
  large,
  children,
  className,
}: {
  title?: string;
  subtitle?: string;
  right?: React.ReactNode;
  large?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className="min-h-full">
      {title && !large && (
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-line/70 bg-surface/85 px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur-xl">
          <h1 className="flex-1 truncate text-center font-display text-[17px] font-bold text-navy">{title}</h1>
          {right && <div className="absolute right-3 top-[max(0.75rem,env(safe-area-inset-top))]">{right}</div>}
        </header>
      )}

      {large && (
        <header className="px-5 pb-2 pt-[max(1.25rem,calc(env(safe-area-inset-top)+0.5rem))]">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 className="font-display text-[26px] font-bold leading-tight text-navy">{title}</h1>
              {subtitle && <p className="mt-0.5 text-[13px] text-muted">{subtitle}</p>}
            </div>
            {right && <div className="shrink-0 pt-1">{right}</div>}
          </div>
        </header>
      )}

      <div className={cn('px-4 pb-8', large ? 'pt-2' : 'pt-4', className)}>{children}</div>
    </div>
  );
}

/** Sahifa ichidagi bo'lim sarlavhasi + ixtiyoriy "hammasi" havolasi. */
export function TgSection({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-6 first:mt-0">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="font-display text-[15px] font-bold text-navy">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}
