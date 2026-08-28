import { Link } from 'next-view-transitions';
import type { Metadata } from 'next';
import { getLocale, getTranslations } from 'next-intl/server';
import { Heart, Zap, Sparkles, ShieldCheck, Mail, Send } from 'lucide-react';
import { api, type Category, type Facets } from '@/lib/api';
import { Reveal } from '@/components/reveal';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('about');
  return { title: t('title'), description: t('subtitle'), alternates: { canonical: '/haqida' } };
}

async function safe<T>(p: Promise<T>, f: T): Promise<T> { try { return await p; } catch { return f; } }

export default async function AboutPage() {
  const t = await getTranslations('about');
  const locale = await getLocale();
  const [cats, facets] = await Promise.all([
    safe<Category[]>(api.categories(locale), []),
    safe<Facets>(api.facets('', locale), { total: 0, categories: [] }),
  ]);

  const stats = [
    { value: `${facets.total || 57}+`, label: t('statPlaces') },
    { value: `${cats.length || 12}`, label: t('statCategories') },
    { value: '3', label: t('statCities') },
    { value: '24/7', label: t('statSupport') },
  ];
  const values = [
    { icon: ShieldCheck, t: t('v1t'), d: t('v1d'), c: 'text-teal-500 bg-teal-50' },
    { icon: Sparkles, t: t('v2t'), d: t('v2d'), c: 'text-brand bg-brand-50' },
    { icon: Zap, t: t('v3t'), d: t('v3d'), c: 'text-amber-500 bg-amber-50' },
    { icon: Heart, t: t('v4t'), d: t('v4d'), c: 'text-violet-500 bg-violet-50' },
  ];

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-aurora">
        <div className="pointer-events-none absolute -right-16 -top-16 h-72 w-72 rounded-full bg-teal/25 blur-3xl" />
        <div className="container-wide relative py-16 text-center md:py-24">
          <h1 className="mx-auto max-w-3xl font-display text-3xl font-bold leading-tight text-white md:text-5xl">{t('title')}</h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-white/80">{t('subtitle')}</p>
        </div>
      </section>

      {/* Stats */}
      <section className="container-wide -mt-10 relative z-10">
        <div className="grid grid-cols-2 gap-4 rounded-2xl border border-line bg-surface p-6 shadow-card md:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <div className="font-display text-3xl font-bold text-navy">{s.value}</div>
              <div className="mt-1 text-sm text-muted">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Mission */}
      <section className="container-wide py-16">
        <Reveal>
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="font-display text-2xl font-bold text-navy md:text-3xl">{t('missionTitle')}</h2>
            <p className="mt-4 text-lg leading-relaxed text-ink">{t('mission')}</p>
          </div>
        </Reveal>
      </section>

      {/* Values */}
      <section className="container-wide pb-8">
        <Reveal><h2 className="text-center font-display text-2xl font-bold text-navy md:text-3xl">{t('valuesTitle')}</h2></Reveal>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {values.map((v, i) => (
            <Reveal key={v.t} delay={i * 70}>
              <div className="h-full rounded-2xl border border-line bg-surface p-6">
                <div className={`grid h-12 w-12 place-items-center rounded-xl ${v.c}`}><v.icon size={24} /></div>
                <h3 className="mt-4 font-display font-bold text-navy">{v.t}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted">{v.d}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Contact */}
      <section id="kontakt" className="container-wide py-16 scroll-mt-24">
        <div className="mx-auto max-w-2xl rounded-3xl border border-line bg-aurora-soft p-8 text-center md:p-12">
          <h2 className="font-display text-2xl font-bold text-navy">{t('contactTitle')}</h2>
          <p className="mt-2 text-muted">{t('contactText')}</p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <a href="mailto:info@izla.uz" className="inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-700">
              <Mail size={16} /> info@izla.uz
            </a>
            <a href="https://t.me/IzlaXizmat_bot" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-line bg-surface px-5 py-3 text-sm font-semibold text-navy transition hover:border-brand/40">
              <Send size={16} className="text-brand" /> {t('telegram')}
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
