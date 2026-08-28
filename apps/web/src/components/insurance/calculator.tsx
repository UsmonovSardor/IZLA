'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from 'next-view-transitions';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Loader2, ShieldCheck, Check, ArrowRight, Info } from 'lucide-react';
import { api, type InsuranceProductDetail, type InsuranceQuote } from '@/lib/api';
import { optGroup, fieldLabelKey, TYPE_ACCENT } from '@/lib/insurance-meta';
import { formatUZS } from '@/lib/utils';
import { useAuth } from '@/components/auth-provider';
import { useToast } from '@/components/toast';

export function InsuranceCalculator({ product }: { product: InsuranceProductDetail }) {
  const t = useTranslations('sugurta');
  const { user, openLogin } = useAuth();
  const { toast, dismiss } = useToast();
  const reduce = useReducedMotion();
  const accent = TYPE_ACCENT[product.type];

  const [params, setParams] = useState<Record<string, unknown>>(() => ({ ...product.defaults }));
  const [quote, setQuote] = useState<InsuranceQuote | null>(null);
  const [term, setTerm] = useState<number>(product.termsMonths[0] ?? 12);
  const [calcing, setCalcing] = useState(false);
  const [buying, setBuying] = useState(false);
  const [done, setDone] = useState<{ policyNumber?: string | null } | null>(null);
  const seq = useRef(0);

  // Premiyani serverda hisoblash (debounced) — server yagona haqiqat manbasi.
  const recompute = useCallback(
    (next: Record<string, unknown>) => {
      const id = ++seq.current;
      setCalcing(true);
      api
        .insuranceQuote(product.id, next)
        .then((q) => {
          if (id === seq.current) setQuote(q);
        })
        .catch(() => {})
        .finally(() => {
          if (id === seq.current) setCalcing(false);
        });
    },
    [product.id],
  );

  // boshlang'ich: server preview'dan darrov ko'rsatamiz, keyin aniqlaymiz
  useEffect(() => {
    setQuote({
      productId: product.id,
      type: product.type,
      name: product.name,
      premium: product.preview.premium,
      insuredSum: product.preview.insuredSum,
      commission: product.preview.commission,
      breakdown: product.preview.breakdown,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.id]);

  useEffect(() => {
    const handle = setTimeout(() => recompute(params), 220);
    return () => clearTimeout(handle);
  }, [params, recompute]);

  const setField = (name: string, value: unknown) => setParams((p) => ({ ...p, [name]: value }));

  async function buy() {
    if (!user) return openLogin({ next: `/sugurta/${product.slug}` });
    setBuying(true);
    const tid = toast({ variant: 'loading', title: t('calc.buying') });
    try {
      const policy = await api.insuranceBuy({ productId: product.id, params, termMonths: term });
      dismiss(tid);
      toast({ variant: 'success', title: t('calc.done') });
      setDone({ policyNumber: policy.policyNumber });
    } catch (e) {
      dismiss(tid);
      toast({ variant: 'error', title: (e as Error).message || 'Xatolik' });
    } finally {
      setBuying(false);
    }
  }

  const premium = quote?.premium ?? product.preview.premium;
  const coverage = quote?.insuredSum ?? product.preview.insuredSum ?? product.coverageFrom;

  if (done) {
    return (
      <div className="rounded-3xl border border-line bg-surface p-8 text-center shadow-card">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full" style={{ background: `${accent}1a`, color: accent }}>
          <Check className="h-8 w-8" />
        </div>
        <h3 className="mt-4 font-display text-2xl font-bold text-heading">{t('calc.doneTitle')}</h3>
        <p className="mt-1 text-muted">{t('calc.doneMsg')}</p>
        {done.policyNumber && (
          <div className="mt-4 inline-flex items-center gap-2 rounded-xl border border-line bg-bg px-4 py-2 font-mono text-sm text-heading">
            {t('calc.policyNo')}: <strong>{done.policyNumber}</strong>
          </div>
        )}
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/sugurta/mening-polislarim" className="inline-flex items-center gap-1.5 rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-110">
            {t('calc.viewPolicies')} <ArrowRight className="h-4 w-4" />
          </Link>
          <button onClick={() => setDone(null)} className="rounded-full border border-line px-5 py-2.5 text-sm font-semibold text-heading transition hover:bg-bg">
            {t('calc.again')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      {/* Forma */}
      <div className="rounded-3xl border border-line bg-surface p-6 shadow-card">
        <h3 className="font-display text-lg font-bold text-heading">{t('calc.configure')}</h3>
        <div className="mt-5 flex flex-col gap-5">
          {product.form.map((f) => (
            <Field key={f.name} type={product.type} field={f} value={params[f.name]} onChange={(v) => setField(f.name, v)} accent={accent} />
          ))}

          {/* Muddat */}
          {product.termsMonths.length > 1 && (
            <div>
              <label className="text-sm font-medium text-muted">{t('fields.term')}</label>
              <div className="mt-2 flex flex-wrap gap-2">
                {product.termsMonths.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setTerm(m)}
                    className="rounded-full border px-4 py-2 text-sm font-semibold transition"
                    style={term === m ? { background: accent, borderColor: accent, color: '#fff' } : { borderColor: 'var(--c-line)', color: 'var(--c-ink)' }}
                  >
                    {m} {t('calc.months')}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Natija — aniq summa + breakdown */}
      <div className="lg:sticky lg:top-24 self-start rounded-3xl border p-6 shadow-card" style={{ borderColor: `${accent}33`, background: `linear-gradient(180deg, ${accent}0d, var(--c-surface) 55%)` }}>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted">{t('calc.premium')}</span>
          {calcing && <Loader2 className="h-4 w-4 animate-spin text-muted" />}
        </div>
        <div className="mt-1 flex items-baseline gap-2">
          <AnimatePresence mode="popLayout">
            <motion.span
              key={premium}
              initial={reduce ? false : { y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={reduce ? undefined : { y: -10, opacity: 0 }}
              transition={{ duration: 0.28 }}
              className="font-display text-4xl font-extrabold tracking-tight text-heading"
              style={{ fontVariantNumeric: 'tabular-nums' }}
            >
              {formatUZS(premium)}
            </motion.span>
          </AnimatePresence>
          {term > 0 && <span className="text-sm text-muted">/ {term} {t('calc.months')}</span>}
        </div>

        <div className="mt-3 flex items-center gap-2 rounded-xl bg-bg px-3 py-2 text-sm">
          <ShieldCheck className="h-4 w-4" style={{ color: accent }} />
          <span className="text-muted">{t('calc.coverage')}:</span>
          <strong className="text-heading" style={{ fontVariantNumeric: 'tabular-nums' }}>{formatUZS(coverage)}</strong>
        </div>

        {/* Shaffof hisob-kitob */}
        <div className="mt-4">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted">
            <Info className="h-3.5 w-3.5" /> {t('calc.breakdown')}
          </div>
          <ul className="mt-2 flex flex-col divide-y divide-line/60 text-sm">
            {(quote?.breakdown ?? product.preview.breakdown).map((b, i) => (
              <li key={i} className="flex items-center justify-between gap-3 py-1.5">
                <span className="text-muted">
                  {b.label}
                  {b.note && <span className="ml-1 text-xs text-muted/70">({b.note})</span>}
                </span>
                <span className="font-medium text-heading" style={{ fontVariantNumeric: 'tabular-nums' }}>
                  {b.factor != null ? `×${b.factor}` : b.value != null ? formatUZS(b.value) : ''}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <button
          onClick={buy}
          disabled={buying || premium <= 0}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm font-bold text-white shadow-lg transition hover:brightness-110 disabled:opacity-60"
          style={{ background: accent }}
        >
          {buying ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
          {user ? t('calc.buy') : t('calc.loginBuy')}
        </button>
        <p className="mt-2 text-center text-xs text-muted/80">{t('calc.disclaimer')}</p>
      </div>
    </div>
  );
}

// --- Bitta maydon (select / number / bool) ---
function Field({
  type,
  field,
  value,
  onChange,
  accent,
}: {
  type: InsuranceProductDetail['type'];
  field: InsuranceProductDetail['form'][number];
  value: unknown;
  onChange: (v: unknown) => void;
  accent: string;
}) {
  const t = useTranslations('sugurta');
  const label = t(`fields.${fieldLabelKey(type, field.name)}`);
  const group = optGroup(type, field.name);

  if (field.kind === 'bool') {
    const on = !!value;
    return (
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-heading">{label}</span>
        <button
          type="button"
          onClick={() => onChange(!on)}
          role="switch"
          aria-checked={on}
          className="relative h-6 w-11 rounded-full transition"
          style={{ background: on ? accent : 'var(--c-line)' }}
        >
          <span className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all" style={{ left: on ? '22px' : '2px' }} />
        </button>
      </div>
    );
  }

  if (field.kind === 'select') {
    const opts = field.options ?? [];
    return (
      <div>
        <label className="text-sm font-medium text-muted">{label}</label>
        <div className="mt-2 flex flex-wrap gap-2">
          {opts.map((o) => {
            const active = String(value) === o;
            const text = group ? t(`opt.${group}.${o}`) : o;
            return (
              <button
                key={o}
                type="button"
                onClick={() => onChange(o)}
                className="rounded-full border px-3.5 py-2 text-sm font-medium transition"
                style={active ? { background: accent, borderColor: accent, color: '#fff' } : { borderColor: 'var(--c-line)', color: 'var(--c-ink)' }}
              >
                {text}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // number — katta summalar uchun slider + format, kichiklari uchun stepper
  const min = field.min ?? 0;
  const max = field.max ?? 100;
  const step = field.step ?? 1;
  const n = Number(value ?? field.default ?? min);
  const big = max >= 1_000_000;

  if (big) {
    return (
      <div>
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-muted">{label}</label>
          <span className="font-semibold text-heading" style={{ fontVariantNumeric: 'tabular-nums' }}>{formatUZS(n)}</span>
        </div>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={n}
          onChange={(e) => onChange(Number(e.target.value))}
          className="izla-range mt-3 w-full"
          style={{ accentColor: accent }}
        />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-3">
      <label className="text-sm font-medium text-muted">{label}</label>
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => onChange(Math.max(min, n - step))} className="grid h-8 w-8 place-items-center rounded-full border border-line text-heading transition hover:bg-bg">−</button>
        <span className="w-10 text-center font-semibold text-heading" style={{ fontVariantNumeric: 'tabular-nums' }}>{n}</span>
        <button type="button" onClick={() => onChange(Math.min(max, n + step))} className="grid h-8 w-8 place-items-center rounded-full border border-line text-heading transition hover:bg-bg">+</button>
      </div>
    </div>
  );
}
