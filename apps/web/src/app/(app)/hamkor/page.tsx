'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { Store, CalendarCheck, LineChart, ShieldCheck, ArrowRight, Loader2, Check } from 'lucide-react';
import { api, type Category } from '@/lib/api';
import { useAuth } from '@/components/auth-provider';
import { useToast } from '@/components/toast';

export default function PartnerPage() {
  const t = useTranslations('partner');
  const locale = useLocale();
  const router = useRouter();
  const { user, loading, openLogin } = useAuth();
  const { toast, dismiss } = useToast();

  const [categories, setCategories] = useState<Category[]>([]);
  const [districts, setDistricts] = useState<string[]>([]);
  const [form, setForm] = useState({ name: '', categoryId: '', district: '', phone: '', address: '', description: '' });
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    api.categories(locale).then((c) => setCategories(c)).catch(() => {});
    api.districts().then((d) => setDistricts(d.map((x) => x.district))).catch(() => {});
  }, [locale]);

  const canSubmit = useMemo(
    () => form.name.trim().length >= 2 && form.categoryId && !busy,
    [form.name, form.categoryId, busy],
  );

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return openLogin({ next: '/hamkor#ariza' });
    if (!canSubmit) return;
    setBusy(true);
    const id = toast({ title: t('submitting'), variant: 'loading' });
    try {
      await api.registerVendor({
        name: form.name.trim(),
        categoryId: form.categoryId,
        phone: form.phone.trim() || undefined,
        district: form.district.trim() || undefined,
        address: form.address.trim() || undefined,
        description: form.description.trim() || undefined,
      });
      dismiss(id);
      toast({ title: t('successTitle'), description: t('successBody'), variant: 'success' });
      setDone(true);
      setTimeout(() => router.push('/kabinet'), 1400);
    } catch (err) {
      dismiss(id);
      toast({ title: t('errorTitle'), description: (err as Error).message, variant: 'error' });
      setBusy(false);
    }
  }

  const benefits = [
    { icon: Store, t: t('b1t'), d: t('b1d') },
    { icon: CalendarCheck, t: t('b2t'), d: t('b2d') },
    { icon: LineChart, t: t('b3t'), d: t('b3d') },
    { icon: ShieldCheck, t: t('b4t'), d: t('b4d') },
  ];

  return (
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden bg-aurora">
        <div className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full bg-teal/25 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute -bottom-16 left-1/4 h-72 w-72 rounded-full bg-brand/25 blur-3xl" aria-hidden />
        <div className="container-wide relative z-10 py-16 md:py-24 text-center">
          <span className="chip mx-auto bg-surface/10 text-white/90 border border-white/20">
            <Store className="h-3.5 w-3.5 text-teal-400" /> {t('badge')}
          </span>
          <h1 className="mx-auto mt-5 max-w-3xl font-display text-4xl md:text-5xl font-bold leading-[1.08] text-white">
            {t('title')}
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-white/80">{t('subtitle')}</p>
          <a href="#ariza" className="mt-8 inline-flex items-center gap-2 rounded-xl bg-surface px-7 py-3.5 text-sm font-semibold text-navy shadow-pop transition hover:scale-105">
            {t('cta')} <ArrowRight className="h-4 w-4 text-brand" />
          </a>
        </div>
      </section>

      {/* AFZALLIKLAR */}
      <section className="container-wide py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {benefits.map((b) => (
            <div key={b.t} className="reveal rounded-2xl border border-line bg-surface p-6 shadow-card">
              <span className="grid h-12 w-12 place-items-center rounded-xl bg-brand-50 text-brand">
                <b.icon className="h-6 w-6" />
              </span>
              <h3 className="mt-4 font-display text-lg font-bold text-navy">{b.t}</h3>
              <p className="mt-1.5 text-sm text-slate2">{b.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ARIZA FORMASI */}
      <section id="ariza" className="container-wide pb-24">
        <div className="mx-auto max-w-xl rounded-3xl border border-line bg-surface p-7 md:p-9 shadow-card">
          {done ? (
            <div className="py-8 text-center">
              <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-success/15 text-success">
                <Check className="h-7 w-7" />
              </span>
              <h2 className="mt-4 font-display text-2xl font-bold text-navy">{t('successTitle')}</h2>
              <p className="mt-2 text-slate2">{t('successBody')}</p>
            </div>
          ) : (
            <>
              <h2 className="font-display text-2xl font-bold text-navy">{t('formTitle')}</h2>
              <p className="mt-1.5 text-sm text-slate2">{t('formSub')}</p>

              {!loading && !user && (
                <div className="mt-5 rounded-xl border border-brand/20 bg-brand-50 p-4 text-sm text-ink">
                  {t('loginNote')}{' '}
                  <button onClick={() => openLogin({ next: '/hamkor#ariza' })} className="font-semibold text-brand underline">
                    {t('loginCta')}
                  </button>
                </div>
              )}

              <form onSubmit={submit} className="mt-6 space-y-4">
                <Field label={t('fName')} required>
                  <input value={form.name} onChange={set('name')} required maxLength={160}
                    placeholder={t('phName')} className="fld" />
                </Field>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label={t('fCategory')} required>
                    <select value={form.categoryId} onChange={set('categoryId')} required className="fld">
                      <option value="" disabled>{t('phCategory')}</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label={t('fDistrict')}>
                    <select value={form.district} onChange={set('district')} className="fld">
                      <option value="">{t('phDistrict')}</option>
                      {districts.map((d) => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </Field>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label={t('fPhone')}>
                    <input value={form.phone} onChange={set('phone')} maxLength={40}
                      placeholder="+998 90 123 45 67" className="fld" />
                  </Field>
                  <Field label={t('fAddress')}>
                    <input value={form.address} onChange={set('address')} maxLength={300}
                      placeholder={t('phAddress')} className="fld" />
                  </Field>
                </div>
                <Field label={t('fDescription')}>
                  <textarea value={form.description} onChange={set('description')} maxLength={2000} rows={3}
                    placeholder={t('phDescription')} className="fld resize-none" />
                </Field>

                <button type="submit" disabled={!canSubmit}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-6 py-3.5 text-sm font-semibold text-white shadow-pop transition hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed">
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Store className="h-4 w-4" />}
                  {t('submit')}
                </button>
                <p className="text-center text-xs text-slate2">{t('moderationNote')}</p>
              </form>
            </>
          )}
        </div>
      </section>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-ink">
        {label}{required && <span className="text-danger"> *</span>}
      </span>
      {children}
    </label>
  );
}
