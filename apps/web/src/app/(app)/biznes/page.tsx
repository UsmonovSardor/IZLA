import type { Metadata } from 'next';
import { Link } from 'next-view-transitions';
import { getTranslations } from 'next-intl/server';
import { Building2, TrendingUp, Inbox, BarChart3, ShieldCheck, Landmark, ShoppingBag, ArrowRight, Wallet } from 'lucide-react';
import { api, type PartnerPlanConfig } from '@/lib/api';
import { PartnerPlanCards } from '@/components/partner/plan-cards';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('biznes');
  return {
    title: t('landing.metaTitle'),
    description: t('landing.metaDesc'),
    alternates: { canonical: '/biznes' },
  };
}

export default async function BiznesPage() {
  const t = await getTranslations('biznes');
  const plans = await api.partnerPlans().catch(() => [] as PartnerPlanConfig[]);

  const value = [
    { icon: Inbox, key: 'leads' },
    { icon: TrendingUp, key: 'ranking' },
    { icon: BarChart3, key: 'analytics' },
    { icon: Building2, key: 'selfServe' },
  ];
  const channels = [
    { icon: ShieldCheck, key: 'insurance' },
    { icon: Landmark, key: 'mortgage' },
    { icon: ShoppingBag, key: 'nasiya' },
  ];

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-line">
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -left-24 -top-28 h-[420px] w-[420px] rounded-full bg-brand/12 blur-3xl" />
          <div className="absolute right-0 top-6 h-[340px] w-[340px] rounded-full bg-indigo-500/12 blur-3xl" />
        </div>
        <div className="container-wide grid items-center gap-12 py-14 md:py-20 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand/5 px-3 py-1 text-xs font-semibold text-brand">
              <Building2 className="h-3.5 w-3.5" /> {t('landing.badge')}
            </span>
            <h1 className="mt-5 max-w-2xl font-display text-4xl font-extrabold leading-[1.08] tracking-tight text-heading md:text-5xl">
              {t('landing.title')}
            </h1>
            <p className="mt-4 max-w-xl text-lg text-muted">{t('landing.subtitle')}</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/biznes/kabinet" className="inline-flex items-center gap-2 rounded-full bg-brand px-6 py-3.5 text-sm font-bold text-white shadow-lg transition hover:brightness-110">
                {t('landing.cta')} <ArrowRight className="h-4 w-4" />
              </Link>
              <a href="#tariflar" className="inline-flex items-center gap-2 rounded-full border border-line px-6 py-3.5 text-sm font-semibold text-heading transition hover:bg-bg">
                {t('landing.ctaPlans')}
              </a>
            </div>

            {/* Kanallar */}
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm">
              {channels.map((c) => (
                <span key={c.key} className="inline-flex items-center gap-2 text-ink">
                  <c.icon className="h-4 w-4 text-brand" /> {t(`channel.${c.key}`)}
                </span>
              ))}
            </div>
          </div>

          {/* Mahsulot ko'rinishi — real konsol KPI'larini aks ettiruvchi preview */}
          <ConsolePreview t={t} />
        </div>
      </section>

      {/* Nega Izla Biznes */}
      <section className="container-wide py-12 md:py-16">
        <h2 className="font-display text-2xl font-bold text-heading md:text-3xl">{t('landing.whyTitle')}</h2>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {value.map((v) => (
            <div key={v.key} className="rounded-2xl border border-line bg-surface p-6 shadow-card">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-brand/10 text-brand"><v.icon className="h-5 w-5" /></div>
              <h3 className="mt-4 font-semibold text-heading">{t(`landing.value.${v.key}.title`)}</h3>
              <p className="mt-1.5 text-sm text-muted">{t(`landing.value.${v.key}.desc`)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Ishonch qatori — nima taklif qilinishi bir qarashda */}
      <section className="border-y border-line bg-surface">
        <div className="container-wide grid grid-cols-2 gap-6 py-8 sm:grid-cols-4">
          {([
            ['trust.channels', '4'],
            ['trust.revenue', '5'],
            ['trust.selfServe', '24/7'],
            ['trust.billing', '∞'],
          ] as const).map(([key, val]) => (
            <div key={key} className="text-center">
              <div className="font-display text-3xl font-extrabold text-heading" style={{ fontVariantNumeric: 'tabular-nums' }}>{val}</div>
              <div className="mt-1 text-xs text-muted sm:text-sm">{t(`landing.${key}`)}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Tariflar */}
      <section id="tariflar" className="border-t border-line bg-bg/40">
        <div className="container-wide py-12 md:py-16">
          <div className="text-center">
            <h2 className="font-display text-2xl font-bold text-heading md:text-3xl">{t('landing.plansTitle')}</h2>
            <p className="mx-auto mt-2 max-w-xl text-muted">{t('landing.plansSubtitle')}</p>
          </div>
          <div className="mt-10">
            <PartnerPlanCards plans={plans} />
          </div>
          <div className="mt-10 text-center">
            <Link href="/biznes/kabinet" className="inline-flex items-center gap-2 rounded-full bg-brand px-6 py-3.5 text-sm font-bold text-white shadow-lg transition hover:brightness-110">
              {t('landing.cta')} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

/** Mahsulot ko'rinishi — homiy daromad konsolining brend-intizomli preview'i (statik). */
function ConsolePreview({ t }: { t: (k: string) => string }) {
  const kpis = [
    { icon: TrendingUp, label: t('landing.preview.revenue'), value: '48.2M', accent: 'text-brand', bg: 'bg-brand/[0.07]' },
    { icon: Wallet, label: t('landing.preview.mrr'), value: '12.9M', accent: 'text-teal-600', bg: 'bg-teal/[0.08]' },
    { icon: Inbox, label: t('landing.preview.leads'), value: '1 240', accent: 'text-brand', bg: 'bg-brand/[0.07]' },
  ];
  const bars = [
    { label: t('channel.insurance'), pct: 82 },
    { label: t('channel.mortgage'), pct: 64 },
    { label: t('channel.nasiya'), pct: 41 },
  ];
  return (
    <div className="relative">
      <div className="pointer-events-none absolute -inset-4 -z-10 rounded-[32px] bg-brand/[0.05] blur-2xl" aria-hidden />
      <div className="rounded-[22px] border border-line bg-surface p-5 shadow-pop">
        {/* Sarlavha */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold text-heading">
            <BarChart3 className="h-4 w-4 text-brand" /> {t('landing.preview.title')}
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-teal/[0.1] px-2.5 py-1 text-[11px] font-semibold text-teal-600">
            <span className="h-1.5 w-1.5 rounded-full bg-teal-600" /> {t('landing.preview.live')}
          </span>
        </div>
        {/* KPI plitalar */}
        <div className="mt-4 grid grid-cols-3 gap-2.5">
          {kpis.map((k) => (
            <div key={k.label} className="rounded-xl border border-line/70 p-3">
              <div className={`grid h-7 w-7 place-items-center rounded-lg ${k.bg} ${k.accent}`}><k.icon className="h-4 w-4" /></div>
              <div className="mt-2 font-display text-lg font-bold text-heading" style={{ fontVariantNumeric: 'tabular-nums' }}>{k.value}</div>
              <div className="text-[11px] leading-tight text-muted">{k.label}</div>
            </div>
          ))}
        </div>
        {/* Kanal bo'yicha ulush */}
        <div className="mt-4 space-y-2.5">
          {bars.map((b) => (
            <div key={b.label}>
              <div className="mb-1 flex justify-between text-[11px] text-muted"><span>{b.label}</span><span>{b.pct}%</span></div>
              <div className="h-2 overflow-hidden rounded-full bg-bg">
                <div className="h-full rounded-full bg-gradient-to-r from-brand to-teal" style={{ width: `${b.pct}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
