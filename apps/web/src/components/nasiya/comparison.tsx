'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'next-view-transitions';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Loader2, CreditCard, Check, Star, X, BadgeCheck } from 'lucide-react';
import { api, type NasiyaProvider, type NasiyaQuoteRow } from '@/lib/api';
import { formatUZS } from '@/lib/utils';
import { useAuth } from '@/components/auth-provider';
import { useToast } from '@/components/toast';

const ACCENT = '#7C3AED';

export function NasiyaComparison({
  providers,
  initialAmount,
  vendorId,
  serviceId,
}: {
  providers: NasiyaProvider[];
  initialAmount?: number;
  vendorId?: string;
  serviceId?: string;
}) {
  const t = useTranslations('nasiya');
  const { user, openLogin } = useAuth();
  const { toast, dismiss } = useToast();
  const reduce = useReducedMotion();

  const [amount, setAmount] = useState<number>(initialAmount && initialAmount >= 100_000 ? Math.round(initialAmount) : 5_000_000);
  const [months, setMonths] = useState<number>(6);
  const [rows, setRows] = useState<NasiyaQuoteRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [applyFor, setApplyFor] = useState<NasiyaQuoteRow | null>(null);
  const [form, setForm] = useState({ name: user?.name ?? '', phone: '' });
  const [busy, setBusy] = useState(false);
  const [doneId, setDoneId] = useState<string | null>(null);
  const seq = useRef(0);

  const monthOptions = Array.from(new Set(providers.flatMap((p) => p.months))).sort((a, b) => a - b);

  const recompute = useCallback(() => {
    const id = ++seq.current;
    setLoading(true);
    api.nasiyaQuote(amount, months).then((r) => { if (id === seq.current) setRows(r); }).catch(() => {}).finally(() => { if (id === seq.current) setLoading(false); });
  }, [amount, months]);

  useEffect(() => {
    const h = setTimeout(recompute, 220);
    return () => clearTimeout(h);
  }, [recompute]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!applyFor) return;
    if (!user) return openLogin({ next: '/nasiya' });
    if (form.name.trim().length < 2 || form.phone.trim().length < 7) return;
    setBusy(true);
    const tid = toast({ variant: 'loading', title: t('apply.sending') });
    try {
      const lead = await api.applyNasiya({ providerId: applyFor.provider.id, amount, months, vendorId, serviceId, name: form.name, phone: form.phone });
      dismiss(tid);
      toast({ variant: 'success', title: t('apply.done') });
      setApplyFor(null);
      setDoneId(lead.id);
    } catch (err) {
      dismiss(tid);
      toast({ variant: 'error', title: (err as Error).message || 'Xatolik' });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      {/* Kirish paneli */}
      <div className="rounded-3xl border border-line bg-surface p-6 shadow-card">
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-muted">{t('amount')}</label>
              <span className="font-display text-lg font-bold text-heading" style={{ fontVariantNumeric: 'tabular-nums' }}>{formatUZS(amount)}</span>
            </div>
            <input type="range" min={100_000} max={50_000_000} step={100_000} value={amount} onChange={(e) => setAmount(Number(e.target.value))} className="izla-range mt-3 w-full" style={{ accentColor: ACCENT }} />
          </div>
          <div>
            <label className="text-sm font-medium text-muted">{t('term')}</label>
            <div className="mt-2 flex flex-wrap gap-2">
              {monthOptions.map((m) => (
                <button key={m} onClick={() => setMonths(m)} className="rounded-full border px-4 py-2 text-sm font-semibold transition" style={months === m ? { background: ACCENT, borderColor: ACCENT, color: '#fff' } : { borderColor: 'var(--c-line)', color: 'var(--c-ink)' }}>
                  {m} {t('months')}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Provayderlar taqqoslash */}
      <div className="mt-6 flex items-center justify-between">
        <h2 className="font-display text-lg font-bold text-heading">{t('providersHeading')}</h2>
        {loading && <Loader2 className="h-4 w-4 animate-spin text-muted" />}
      </div>

      <motion.div layout className="mt-3 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <AnimatePresence mode="popLayout">
          {rows.map((r) => {
            const c = r.provider.color ?? ACCENT;
            const isDone = false;
            return (
              <motion.div key={r.provider.id} layout={!reduce} initial={reduce ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={reduce ? undefined : { opacity: 0, scale: 0.97 }} transition={{ duration: 0.2 }}
                className={`relative flex flex-col rounded-3xl border bg-surface p-5 shadow-card ${r.available ? '' : 'opacity-60'}`} style={{ borderColor: r.markupPct === 0 && r.available ? `${c}55` : 'var(--c-line)' }}>
                {r.markupPct === 0 && r.available && (
                  <span className="absolute right-4 top-4 rounded-full px-2.5 py-1 text-[11px] font-bold text-white" style={{ background: c }}>0% {t('markup')}</span>
                )}
                <div className="flex items-center gap-3">
                  <span className="grid h-11 w-11 place-items-center rounded-2xl font-bold text-white" style={{ background: c }}>
                    {r.provider.logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={r.provider.logoUrl} alt="" className="h-6 w-6 rounded object-cover" />
                    ) : (
                      r.provider.name.slice(0, 1)
                    )}
                  </span>
                  <div>
                    <h3 className="inline-flex items-center gap-1 font-display text-base font-bold text-heading">{r.provider.name} {r.provider.popular && <BadgeCheck className="h-4 w-4" style={{ color: c }} />}</h3>
                    <span className="inline-flex items-center gap-0.5 text-xs text-muted"><Star className="h-3 w-3 fill-amber-400 text-amber-400" /> {r.provider.rating.toFixed(1)}</span>
                  </div>
                </div>

                {r.available ? (
                  <>
                    <div className="mt-4">
                      <div className="text-xs text-muted">{t('monthly')}</div>
                      <div className="font-display text-2xl font-extrabold text-heading" style={{ fontVariantNumeric: 'tabular-nums' }}>{formatUZS(r.monthlyPayment)}</div>
                    </div>
                    <div className="mt-2 flex flex-col divide-y divide-line/60 text-sm">
                      <div className="flex justify-between py-1.5"><span className="text-muted">{t('total')}</span><span className="font-medium text-heading" style={{ fontVariantNumeric: 'tabular-nums' }}>{formatUZS(r.totalPayment)}</span></div>
                      <div className="flex justify-between py-1.5"><span className="text-muted">{t('overpay')}</span><span className="font-medium" style={{ fontVariantNumeric: 'tabular-nums', color: r.overpayment === 0 ? '#059669' : undefined }}>{r.overpayment === 0 ? t('free') : `+ ${formatUZS(r.overpayment)}`}</span></div>
                    </div>
                    <button onClick={() => (user ? setApplyFor(r) : openLogin({ next: '/nasiya' }))} className="mt-4 flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold text-white transition hover:brightness-110" style={{ background: c }}>
                      <CreditCard className="h-4 w-4" /> {user ? t('apply.cta') : t('apply.loginCta')}
                    </button>
                  </>
                ) : (
                  <p className="mt-4 flex-1 text-sm text-muted">{t('notAvailable')}</p>
                )}
                {isDone && <span />}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </motion.div>

      {doneId && (
        <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-center text-emerald-800">
          <Check className="mx-auto h-6 w-6" />
          <p className="mt-1 text-sm font-semibold">{t('apply.doneTitle')}</p>
          <p className="text-xs">{t('apply.doneMsg')}</p>
          <Link href="/nasiya/mening-arizalarim" className="mt-2 inline-block text-sm font-semibold text-emerald-700 underline-offset-2 hover:underline">{t('apply.myApps')} →</Link>
        </div>
      )}

      {/* Ariza modal */}
      <AnimatePresence>
        {applyFor && (
          <motion.div className="fixed inset-0 z-[70] grid place-items-center bg-black/40 p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setApplyFor(null)}>
            <motion.form onClick={(e) => e.stopPropagation()} onSubmit={submit} initial={reduce ? false : { scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={reduce ? undefined : { scale: 0.95, opacity: 0 }} className="w-full max-w-sm rounded-3xl border border-line bg-surface p-6 shadow-2xl">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-lg font-bold text-heading">{t('apply.title')}</h3>
                <button type="button" onClick={() => setApplyFor(null)} className="text-muted hover:text-heading"><X className="h-5 w-5" /></button>
              </div>
              <p className="mt-1 text-sm text-muted">{t('apply.subtitle', { provider: applyFor.provider.name })}</p>
              <div className="mt-3 rounded-xl bg-bg p-3 text-sm">
                <div className="flex justify-between"><span className="text-muted">{t('monthly')}</span><strong className="text-heading">{formatUZS(applyFor.monthlyPayment)} × {months}</strong></div>
                <div className="flex justify-between"><span className="text-muted">{t('total')}</span><strong className="text-heading">{formatUZS(applyFor.totalPayment)}</strong></div>
              </div>
              <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder={t('apply.name')} className="fld mt-3 w-full" required />
              <input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} placeholder="+998 90 123 45 67" className="fld mt-2 w-full" required />
              <button disabled={busy} className="mt-4 flex w-full items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-bold text-white transition hover:brightness-110 disabled:opacity-60" style={{ background: applyFor.provider.color ?? ACCENT }}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} {t('apply.submit')}
              </button>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
