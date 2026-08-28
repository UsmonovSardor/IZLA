'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'next-view-transitions';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Loader2, Landmark, Check, ArrowRight, Info, X } from 'lucide-react';
import { api, type MortgageProgramDetail, type MortgageCalcResult } from '@/lib/api';
import { formatUZS } from '@/lib/utils';
import { useAuth } from '@/components/auth-provider';
import { useToast } from '@/components/toast';

const ACCENT = '#0F766E'; // moliya (teal-green) aksenti

export function MortgageCalculator({
  program,
  initialPrice,
  propertyId,
}: {
  program?: MortgageProgramDetail;
  initialPrice?: number;
  propertyId?: string;
}) {
  const t = useTranslations('ipoteka');
  const { user, openLogin } = useAuth();
  const { toast, dismiss } = useToast();
  const reduce = useReducedMotion();

  const hasProgram = !!program;
  const maxTerm = program?.maxTermMonths ?? 240;
  const minDown = program?.minDownPct ?? 15;

  const [price, setPrice] = useState<number>(initialPrice ?? program?.preview.price ?? 700_000_000);
  const [downPct, setDownPct] = useState<number>(minDown);
  const [termMonths, setTermMonths] = useState<number>(Math.min(240, maxTerm));
  const [rate, setRate] = useState<number>(program?.annualRate ?? 20);

  const [res, setRes] = useState<MortgageCalcResult | null>(program?.preview ?? null);
  const [calcing, setCalcing] = useState(false);
  const [applyOpen, setApplyOpen] = useState(false);
  const [form, setForm] = useState({ name: user?.name ?? '', phone: '' });
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const seq = useRef(0);

  const recompute = useCallback(() => {
    const id = ++seq.current;
    setCalcing(true);
    api
      .mortgageCalc({
        programId: program?.id,
        price,
        downPct,
        termMonths,
        annualRate: hasProgram ? undefined : rate,
      })
      .then((r) => {
        if (id === seq.current) setRes(r);
      })
      .catch(() => {})
      .finally(() => {
        if (id === seq.current) setCalcing(false);
      });
  }, [program?.id, hasProgram, price, downPct, termMonths, rate]);

  useEffect(() => {
    const h = setTimeout(recompute, 220);
    return () => clearTimeout(h);
  }, [recompute]);

  async function submitApply(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return openLogin({ next: `/ipoteka/${program?.slug ?? ''}` });
    if (form.name.trim().length < 2 || form.phone.trim().length < 7) return;
    setBusy(true);
    const tid = toast({ variant: 'loading', title: t('apply.sending') });
    try {
      await api.applyMortgage({
        programId: program?.id,
        price,
        downPct,
        termMonths,
        propertyId,
        name: form.name,
        phone: form.phone,
      });
      dismiss(tid);
      toast({ variant: 'success', title: t('apply.done') });
      setApplyOpen(false);
      setDone(true);
    } catch (err) {
      dismiss(tid);
      toast({ variant: 'error', title: (err as Error).message || 'Xatolik' });
    } finally {
      setBusy(false);
    }
  }

  const monthly = res?.monthlyPayment ?? 0;
  const termYears = Math.round((termMonths / 12) * 10) / 10;

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      {/* Kirish */}
      <div className="rounded-3xl border border-line bg-surface p-6 shadow-card">
        <h3 className="font-display text-lg font-bold text-heading">{t('calc.configure')}</h3>
        <div className="mt-5 flex flex-col gap-5">
          <Slider label={t('calc.price')} value={price} min={50_000_000} max={3_000_000_000} step={10_000_000} onChange={setPrice} fmt={formatUZS} accent={ACCENT} />
          <div>
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-muted">{t('calc.downPayment')}</label>
              <span className="font-semibold text-heading" style={{ fontVariantNumeric: 'tabular-nums' }}>
                {downPct}% · {formatUZS(Math.round((price * downPct) / 100))}
              </span>
            </div>
            <input type="range" min={minDown} max={90} step={1} value={downPct} onChange={(e) => setDownPct(Number(e.target.value))} className="izla-range mt-3 w-full" style={{ accentColor: ACCENT }} />
            {hasProgram && <p className="mt-1 text-xs text-muted">{t('calc.minDown', { pct: minDown })}</p>}
          </div>
          <div>
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-muted">{t('calc.term')}</label>
              <span className="font-semibold text-heading" style={{ fontVariantNumeric: 'tabular-nums' }}>{termYears} {t('calc.years')} ({termMonths} {t('calc.months')})</span>
            </div>
            <input type="range" min={12} max={maxTerm} step={12} value={termMonths} onChange={(e) => setTermMonths(Number(e.target.value))} className="izla-range mt-3 w-full" style={{ accentColor: ACCENT }} />
          </div>

          {hasProgram ? (
            <div className="flex items-center justify-between rounded-xl bg-bg px-3 py-2.5">
              <span className="text-sm text-muted">{t('calc.rate')}</span>
              <span className="font-display text-lg font-bold" style={{ color: ACCENT }}>{program!.annualRate}%</span>
            </div>
          ) : (
            <Slider label={t('calc.rate')} value={rate} min={5} max={30} step={0.5} onChange={setRate} fmt={(n) => `${n}%`} accent={ACCENT} />
          )}
        </div>
      </div>

      {/* Natija */}
      <div className="lg:sticky lg:top-24 self-start rounded-3xl border p-6 shadow-card" style={{ borderColor: `${ACCENT}33`, background: `linear-gradient(180deg, ${ACCENT}0d, var(--c-surface) 55%)` }}>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted">{t('calc.monthly')}</span>
          {calcing && <Loader2 className="h-4 w-4 animate-spin text-muted" />}
        </div>
        <div className="mt-1">
          <AnimatePresence mode="popLayout">
            <motion.div
              key={monthly}
              initial={reduce ? false : { y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={reduce ? undefined : { y: -10, opacity: 0 }}
              transition={{ duration: 0.28 }}
              className="font-display text-4xl font-extrabold tracking-tight text-heading"
              style={{ fontVariantNumeric: 'tabular-nums' }}
            >
              {formatUZS(monthly)}
              <span className="ml-1 text-base font-medium text-muted">/ {t('calc.perMonth')}</span>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="mt-4 flex flex-col divide-y divide-line/60 text-sm">
          <Row label={t('calc.loanAmount')} value={formatUZS(res?.loanAmount ?? 0)} />
          <Row label={t('calc.downPaid')} value={formatUZS(res?.downPayment ?? 0)} />
          <Row label={t('calc.total')} value={formatUZS(res?.totalPayment ?? 0)} />
          <Row label={t('calc.overpayment')} value={formatUZS(res?.overpayment ?? 0)} strong accent={ACCENT} />
        </div>

        {hasProgram ? (
          done ? (
            <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-center text-emerald-800">
              <Check className="mx-auto h-6 w-6" />
              <p className="mt-1 text-sm font-semibold">{t('apply.doneTitle')}</p>
              <p className="text-xs">{t('apply.doneMsg')}</p>
              <Link href="/ipoteka/mening-arizalarim" className="mt-2 inline-block text-sm font-semibold text-emerald-700 underline-offset-2 hover:underline">{t('apply.myApps')} →</Link>
            </div>
          ) : (
            <button onClick={() => (user ? setApplyOpen(true) : openLogin({ next: `/ipoteka/${program!.slug}` }))} className="mt-5 flex w-full items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm font-bold text-white shadow-lg transition hover:brightness-110" style={{ background: ACCENT }}>
              <Landmark className="h-4 w-4" /> {user ? t('apply.cta') : t('apply.loginCta')}
            </button>
          )
        ) : (
          <Link href="/ipoteka#dasturlar" className="mt-5 flex w-full items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm font-bold text-white shadow-lg transition hover:brightness-110" style={{ background: ACCENT }}>
            {t('calc.chooseProgram')} <ArrowRight className="h-4 w-4" />
          </Link>
        )}
        <p className="mt-2 flex items-center justify-center gap-1 text-center text-xs text-muted/80"><Info className="h-3 w-3" /> {t('calc.disclaimer')}</p>
      </div>

      {/* Ariza modal */}
      <AnimatePresence>
        {applyOpen && (
          <motion.div className="fixed inset-0 z-[70] grid place-items-center bg-black/40 p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setApplyOpen(false)}>
            <motion.form
              onClick={(e) => e.stopPropagation()}
              onSubmit={submitApply}
              initial={reduce ? false : { scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={reduce ? undefined : { scale: 0.95, opacity: 0 }}
              className="w-full max-w-sm rounded-3xl border border-line bg-surface p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-display text-lg font-bold text-heading">{t('apply.title')}</h3>
                <button type="button" onClick={() => setApplyOpen(false)} className="text-muted hover:text-heading"><X className="h-5 w-5" /></button>
              </div>
              <p className="mt-1 text-sm text-muted">{t('apply.subtitle', { bank: program!.bank.name })}</p>
              <div className="mt-3 rounded-xl bg-bg p-3 text-sm">
                <div className="flex justify-between"><span className="text-muted">{t('calc.monthly')}</span><strong className="text-heading">{formatUZS(monthly)}</strong></div>
                <div className="flex justify-between"><span className="text-muted">{t('calc.loanAmount')}</span><strong className="text-heading">{formatUZS(res?.loanAmount ?? 0)}</strong></div>
              </div>
              <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder={t('apply.name')} className="fld mt-3 w-full" required />
              <input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} placeholder="+998 90 123 45 67" className="fld mt-2 w-full" required />
              <button disabled={busy} className="mt-4 flex w-full items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-bold text-white transition hover:brightness-110 disabled:opacity-60" style={{ background: ACCENT }}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} {t('apply.submit')}
              </button>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Slider({ label, value, min, max, step, onChange, fmt, accent }: { label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void; fmt: (n: number) => string; accent: string }) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-muted">{label}</label>
        <span className="font-semibold text-heading" style={{ fontVariantNumeric: 'tabular-nums' }}>{fmt(value)}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="izla-range mt-3 w-full" style={{ accentColor: accent }} />
    </div>
  );
}

function Row({ label, value, strong, accent }: { label: string; value: string; strong?: boolean; accent?: string }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <span className="text-muted">{label}</span>
      <span className={strong ? 'font-bold' : 'font-medium text-heading'} style={{ fontVariantNumeric: 'tabular-nums', color: strong ? accent : undefined }}>{value}</span>
    </div>
  );
}
