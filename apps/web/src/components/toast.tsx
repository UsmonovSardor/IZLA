'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { CheckCircle2, XCircle, Info, Loader2, X } from 'lucide-react';

export type ToastVariant = 'success' | 'error' | 'info' | 'loading';
export interface ToastOptions {
  title: string;
  description?: string;
  variant?: ToastVariant;
  /** ms; 0 = avto-yopilmaydi (loading uchun). Default 4000. */
  duration?: number;
}
interface ToastItem extends Required<Omit<ToastOptions, 'description'>> {
  id: number;
  description?: string;
}

interface ToastApi {
  toast: (o: ToastOptions) => number;
  dismiss: (id: number) => void;
}

const ToastCtx = createContext<ToastApi | null>(null);

/** Global toast bildirishnoma tizimi — stack, avto-yopilish, motion. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const [mounted, setMounted] = useState(false);
  const seq = useRef(0);
  useEffect(() => setMounted(true), []);

  const dismiss = useCallback((id: number) => {
    setItems((list) => list.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((o: ToastOptions) => {
    const id = ++seq.current;
    const item: ToastItem = {
      id,
      title: o.title,
      description: o.description,
      variant: o.variant ?? 'info',
      duration: o.duration ?? (o.variant === 'loading' ? 0 : 4000),
    };
    // Ko'pi bilan 4 ta — eskisini olib tashlaymiz
    setItems((list) => [...list.slice(-3), item]);
    if (item.duration > 0) setTimeout(() => dismiss(id), item.duration);
    return id;
  }, [dismiss]);

  return (
    <ToastCtx.Provider value={{ toast, dismiss }}>
      {children}
      {mounted && createPortal(
        <ToastViewport items={items} onDismiss={dismiss} />,
        document.body,
      )}
    </ToastCtx.Provider>
  );
}

const STYLE: Record<ToastVariant, { icon: typeof CheckCircle2; ring: string; iconCls: string }> = {
  success: { icon: CheckCircle2, ring: 'border-emerald-200', iconCls: 'text-emerald-500' },
  error: { icon: XCircle, ring: 'border-rose-200', iconCls: 'text-rose-500' },
  info: { icon: Info, ring: 'border-brand/30', iconCls: 'text-brand' },
  loading: { icon: Loader2, ring: 'border-line', iconCls: 'text-slate-400 animate-spin' },
};

function ToastViewport({ items, onDismiss }: { items: ToastItem[]; onDismiss: (id: number) => void }) {
  const reduce = useReducedMotion();
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-20 z-[90] flex flex-col items-center gap-2 px-4 sm:bottom-6 sm:right-6 sm:left-auto sm:items-end">
      <AnimatePresence initial={false}>
        {items.map((t) => {
          const s = STYLE[t.variant];
          const Icon = s.icon;
          return (
            <motion.div
              key={t.id}
              layout
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: 20, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, x: 40, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              className={`pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl border ${s.ring} bg-surface/95 px-4 py-3 shadow-[0_16px_50px_-12px_rgba(15,31,51,.28)] backdrop-blur-md`}
              role="status"
            >
              <Icon className={`mt-0.5 h-5 w-5 flex-none ${s.iconCls}`} />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-navy">{t.title}</div>
                {t.description && <div className="mt-0.5 text-[13px] text-muted">{t.description}</div>}
              </div>
              <button
                onClick={() => onDismiss(t.id)}
                aria-label="Yopish"
                className="mt-0.5 grid h-6 w-6 flex-none place-items-center rounded-lg text-slate-400 transition hover:bg-bg hover:text-ink"
              >
                <X size={14} />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

/** Toast chaqirish uchun hook. Provider tashqarisida no-op qaytaradi (xavfsiz). */
export function useToast(): ToastApi {
  const ctx = useContext(ToastCtx);
  if (!ctx) return { toast: () => 0, dismiss: () => {} };
  return ctx;
}
