'use client';
import { useEffect } from 'react';
import { Loader2, Star, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { haptic } from '@/lib/telegram';

/* ---------- Button ---------- */
export function TgButton({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  full,
  loading,
  disabled,
  className,
  type = 'button',
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  full?: boolean;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
  type?: 'button' | 'submit';
}) {
  const variants = {
    primary: 'bg-brand text-white shadow-[0_8px_20px_-8px_rgba(37,99,235,.6)] active:bg-brand-700',
    secondary: 'bg-brand/[0.08] text-brand active:bg-brand/[0.14]',
    ghost: 'bg-surface text-ink border border-line active:bg-bg',
    danger: 'bg-danger/[0.1] text-danger active:bg-danger/20',
  };
  const sizes = { sm: 'h-9 px-4 text-sm', md: 'h-12 px-5 text-[15px]', lg: 'h-14 px-6 text-base' };
  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={() => {
        if (disabled || loading) return;
        haptic.impact('medium');
        onClick?.();
      }}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-2xl font-bold transition active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100',
        variants[variant],
        sizes[size],
        full && 'w-full',
        className,
      )}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}

/* ---------- Card ---------- */
export function TgCard({ children, className, onClick }: { children: React.ReactNode; className?: string; onClick?: () => void }) {
  return (
    <div
      onClick={onClick ? () => { haptic.impact('light'); onClick(); } : undefined}
      className={cn(
        'rounded-2xl border border-line bg-surface',
        onClick && 'cursor-pointer transition active:scale-[0.98]',
        className,
      )}
    >
      {children}
    </div>
  );
}

/* ---------- Skeleton ---------- */
export function Skel({ className }: { className?: string }) {
  return <div className={cn('skeleton rounded-xl bg-line/70', className)} />;
}

/* ---------- Spinner ---------- */
export function TgSpinner({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center justify-center py-10', className)}>
      <Loader2 className="h-6 w-6 animate-spin text-brand" />
    </div>
  );
}

/* ---------- Star rating (read-only yoki interaktiv) ---------- */
export function StarRating({
  value,
  size = 16,
  onChange,
}: {
  value: number;
  size?: number;
  onChange?: (v: number) => void;
}) {
  return (
    <div className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          disabled={!onChange}
          onClick={() => { if (onChange) { haptic.select(); onChange(i); } }}
          className={onChange ? 'transition active:scale-90' : 'pointer-events-none'}
        >
          <Star
            style={{ width: size, height: size }}
            className={i <= Math.round(value) ? 'fill-amber-400 text-amber-400' : 'fill-line text-line'}
          />
        </button>
      ))}
    </div>
  );
}

/* ---------- Chip ---------- */
export function Chip({
  children,
  active,
  onClick,
  icon: Icon,
}: {
  children: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
  icon?: LucideIcon;
}) {
  return (
    <button
      type="button"
      onClick={() => { haptic.select(); onClick?.(); }}
      className={cn(
        'inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 py-2 text-[13px] font-semibold transition active:scale-95',
        active ? 'border-brand bg-brand text-white' : 'border-line bg-surface text-muted',
      )}
    >
      {Icon && <Icon className="h-3.5 w-3.5" />}
      {children}
    </button>
  );
}

/* ---------- Empty state ---------- */
export function TgEmpty({ icon: Icon, title, sub }: { icon: LucideIcon; title: string; sub?: string }) {
  return (
    <div className="flex flex-col items-center justify-center px-8 py-16 text-center">
      <div className="grid h-16 w-16 place-items-center rounded-3xl bg-brand/[0.07] text-brand">
        <Icon className="h-8 w-8" />
      </div>
      <p className="mt-4 font-display text-base font-bold text-navy">{title}</p>
      {sub && <p className="mt-1 text-sm text-muted">{sub}</p>}
    </div>
  );
}

/* ---------- Bottom sheet ---------- */
export function Sheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[80] flex flex-col justify-end" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-navy/50 backdrop-blur-sm tg-fade" onClick={onClose} />
      <div className="tg-sheet relative max-h-[85%] overflow-y-auto rounded-t-3xl border-t border-line bg-surface pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="sticky top-0 z-10 flex items-center justify-center bg-surface pt-3">
          <span className="h-1.5 w-10 rounded-full bg-line" />
        </div>
        {title && <h3 className="px-5 pb-1 pt-2 text-center font-display text-lg font-bold text-navy">{title}</h3>}
        <div className="px-5 pb-4 pt-2">{children}</div>
      </div>
    </div>
  );
}
