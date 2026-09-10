'use client';
import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { BadgeCheck, Check, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { api, type InsuranceProductDetail, type InsuranceQuote } from '@/lib/api';
import { formatUZS } from '@/lib/utils';
import { haptic } from '@/lib/telegram';
import { useAuth } from '@/components/auth-provider';
import { TgScreen } from '@/components/tg/tg-screen';
import { Chip, Skel, TgButton, Sheet } from '@/components/tg/tg-ui';

export default function TgInsuranceDetail() {
  const t = useTranslations('tg');
  const params = useParams<{ slug: string }>();
  const slug = params?.slug;
  const { user, openLogin } = useAuth();

  const [p, setP] = useState<InsuranceProductDetail | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [form, setForm] = useState<Record<string, unknown>>({});
  const [term, setTerm] = useState<number | undefined>();
  const [quote, setQuote] = useState<InsuranceQuote | null>(null);
  const [buying, setBuying] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!slug) return;
    api.insuranceProduct(slug).then((prod) => {
      setP(prod);
      const init: Record<string, unknown> = { ...prod.defaults };
      prod.form.forEach((f) => { if (init[f.name] === undefined) init[f.name] = f.default; });
      setForm(init);
      setTerm(prod.termsMonths?.[0]);
    }).catch(() => setNotFound(true));
  }, [slug]);

  useEffect(() => {
    if (!p || Object.keys(form).length === 0) return;
    let alive = true;
    const h = setTimeout(() => {
      api.insuranceQuote(p.id, form).then((q) => alive && setQuote(q)).catch(() => {});
    }, 300);
    return () => { alive = false; clearTimeout(h); };
  }, [p, form]);

  const premium = quote?.premium ?? p?.preview.premium ?? 0;
  const insuredSum = quote?.insuredSum ?? p?.preview.insuredSum ?? 0;

  const label = useMemo(() => (name: string) => name.charAt(0).toUpperCase() + name.slice(1).replace(/([A-Z])/g, ' $1'), []);

  async function buy() {
    if (!p) return;
    if (!user) { openLogin({ onDone: () => void doBuy() }); return; }
    void doBuy();
  }
  async function doBuy() {
    if (!p) return;
    setBuying(true); setError('');
    try {
      await api.insuranceBuy({ productId: p.id, params: form, termMonths: term });
      haptic.notify('success');
      setDone(true);
    } catch (e) {
      haptic.notify('error');
      setError(e instanceof Error ? e.message : 'Xatolik');
    } finally { setBuying(false); }
  }

  if (notFound) return <div className="px-6 py-24 text-center text-muted">{t('insurance.notFound')}</div>;
  if (!p) return <div className="space-y-4 p-4"><Skel className="h-8 w-2/3" /><Skel className="h-40 w-full rounded-2xl" /></div>;

  return (
    <TgScreen title={p.name}>
      {/* Sarlavha */}
      <div className="flex items-center justify-between gap-2">
        <span className="rounded-lg bg-teal/10 px-2 py-0.5 text-[11px] font-bold text-teal-600">{t(`insurance.types.${p.type}`)}</span>
        <span className="flex items-center gap-1 text-[13px] text-muted">{p.insurer.name} {p.insurer.verified && <BadgeCheck className="h-4 w-4 text-brand" />}</span>
      </div>
      {p.summary && <p className="mt-2 text-[14px] leading-relaxed text-ink">{p.summary}</p>}

      {p.features.length > 0 && (
        <div className="mt-3 space-y-1.5">
          {p.features.map((f) => (
            <p key={f} className="flex items-center gap-2 text-[13px] text-ink"><Check className="h-4 w-4 shrink-0 text-teal-600" /> {f}</p>
          ))}
        </div>
      )}

      {/* Dinamik forma */}
      {p.form.length > 0 && (
        <div className="mt-5 space-y-4 rounded-2xl border border-line bg-surface p-4">
          {p.form.map((field) => (
            <div key={field.name}>
              <label className="text-[13px] font-semibold text-navy">{label(field.name)}</label>
              {field.kind === 'select' && (
                <div className="mt-1.5 flex flex-wrap gap-2">
                  {(field.options ?? []).map((opt) => (
                    <Chip key={opt} active={String(form[field.name]) === opt} onClick={() => setForm((s) => ({ ...s, [field.name]: opt }))}>{opt}</Chip>
                  ))}
                </div>
              )}
              {field.kind === 'number' && (
                <input
                  value={String(form[field.name] ?? '')}
                  onChange={(e) => setForm((s) => ({ ...s, [field.name]: Number(e.target.value.replace(/\D/g, '')) || 0 }))}
                  inputMode="numeric"
                  className="mt-1.5 w-full rounded-xl border border-line bg-bg px-3.5 py-2.5 text-[15px] text-ink outline-none focus:border-brand"
                />
              )}
              {field.kind === 'bool' && (
                <div className="mt-1.5 flex gap-2">
                  <Chip active={form[field.name] === true} onClick={() => setForm((s) => ({ ...s, [field.name]: true }))}>{t('common.yes')}</Chip>
                  <Chip active={form[field.name] === false} onClick={() => setForm((s) => ({ ...s, [field.name]: false }))}>{t('common.no')}</Chip>
                </div>
              )}
            </div>
          ))}

          {p.termsMonths && p.termsMonths.length > 1 && (
            <div>
              <label className="text-[13px] font-semibold text-navy">{t('insurance.term')}</label>
              <div className="mt-1.5 flex flex-wrap gap-2">
                {p.termsMonths.map((m) => (
                  <Chip key={m} active={term === m} onClick={() => setTerm(m)}>{t('common.months', { n: m })}</Chip>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Narx */}
      <div className="mt-4 rounded-2xl bg-gradient-to-br from-teal/[0.08] to-brand/[0.07] p-5 text-center">
        <p className="text-[13px] text-muted">{t('insurance.premium')}</p>
        <p className="font-display text-3xl font-bold text-navy">{formatUZS(premium)}</p>
        {insuredSum > 0 && <p className="mt-1 text-[13px] text-muted">{t('insurance.insuredSum')}: <span className="font-semibold text-teal-600">{formatUZS(insuredSum)}</span></p>}
      </div>

      <div className="mt-4">
        <TgButton full size="lg" loading={buying} onClick={buy}>
          <ShieldCheck className="h-5 w-5" /> {t('insurance.buy')}
        </TgButton>
      </div>
      {error && <p className="mt-2 text-center text-[13px] text-danger">{error}</p>}

      <Sheet open={done} onClose={() => setDone(false)}>
        <div className="flex flex-col items-center py-6 text-center">
          <CheckCircle2 className="h-16 w-16 text-teal-500" />
          <p className="mt-4 font-display text-lg font-bold text-navy">{t('insurance.bought')}</p>
          <div className="mt-5 w-full"><TgButton full onClick={() => setDone(false)}>{t('vendor.ok')}</TgButton></div>
        </div>
      </Sheet>
    </TgScreen>
  );
}
