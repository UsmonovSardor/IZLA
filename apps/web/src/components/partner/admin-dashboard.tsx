'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import {
  Loader2, ShieldAlert, TrendingUp, Wallet, CalendarClock, Building2,
  ShieldCheck, Landmark, ShoppingBag, CalendarCheck, CreditCard,
} from 'lucide-react';
import { useAuth } from '@/components/auth-provider';
import { formatUZS } from '@/lib/utils';
import { api, type AdminRevenue, type AdminPartnerRow } from '@/lib/api';

const CHANNEL_META = {
  insurance: { icon: ShieldCheck, color: '#0ea5e9' },
  mortgage: { icon: Landmark, color: '#6366f1' },
  booking: { icon: CalendarCheck, color: '#10b981' },
  nasiya: { icon: ShoppingBag, color: '#7c3aed' },
  subscription: { icon: CreditCard, color: '#cf3337' },
} as const;
type ChannelKey = keyof typeof CHANNEL_META;

const BILLING_BADGE: Record<string, string> = {
  ACTIVE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  PAST_DUE: 'bg-amber-50 text-amber-700 border-amber-200',
  SUSPENDED: 'bg-rose-50 text-rose-600 border-rose-200',
  TRIALING: 'bg-blue-50 text-brand border-blue-200',
  CANCELLED: 'bg-slate-100 text-slate-500 border-slate-200',
};

export function AdminDashboard() {
  const t = useTranslations('biznes');
  const { user, loading, openLogin } = useAuth();
  const [rev, setRev] = useState<AdminRevenue | null>(null);
  const [partners, setPartners] = useState<AdminPartnerRow[] | null>(null);
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    if (!user) return;
    Promise.all([api.adminRevenue(), api.adminPartners()])
      .then(([r, p]) => { setRev(r); setPartners(p); })
      .catch((e) => { if ((e as { status?: number }).status === 403) setDenied(true); });
  }, [user]);

  if (loading) return <Centered><Loader2 className="animate-spin text-brand" /></Centered>;
  if (!user) {
    return (
      <Centered>
        <ShieldAlert className="text-slate-300" size={44} />
        <p className="mt-3 text-muted">{t('admin.loginNeeded')}</p>
        <button onClick={() => openLogin({ next: '/biznes/admin' })} className="mt-4 rounded-full bg-brand px-6 py-3 text-sm font-bold text-white transition hover:brightness-110">{t('portal.login')}</button>
      </Centered>
    );
  }
  if (denied || user.role !== 'ADMIN') {
    return (
      <Centered>
        <ShieldAlert className="text-rose-300" size={44} />
        <h1 className="mt-3 font-display text-xl font-bold text-heading">{t('admin.deniedTitle')}</h1>
        <p className="mt-1 text-muted">{t('admin.denied')}</p>
      </Centered>
    );
  }
  if (!rev || !partners) return <Centered><Loader2 className="animate-spin text-brand" /></Centered>;

  const kpis = [
    { label: t('admin.grandTotal'), value: formatUZS(rev.totals.grandTotal), icon: TrendingUp, accent: '#cf3337' },
    { label: t('admin.mrr'), value: formatUZS(rev.mrr), icon: Wallet, accent: '#10b981' },
    { label: t('admin.arr'), value: formatUZS(rev.arr), icon: CalendarClock, accent: '#6366f1' },
    { label: t('admin.activePartners'), value: `${rev.partners.active}/${rev.partners.total}`, icon: Building2, accent: '#0ea5e9' },
  ];

  const channels = (Object.keys(CHANNEL_META) as ChannelKey[]).map((k) => ({ key: k, ...rev.totals.byChannel[k] }));
  const maxCh = Math.max(1, ...channels.map((c) => c.amount));

  return (
    <div className="py-8 md:py-12">
      <div>
        <h1 className="font-display text-2xl font-bold text-heading md:text-3xl">{t('admin.title')}</h1>
        <p className="mt-1 text-muted">{t('admin.subtitle')}</p>
      </div>

      {/* KPI */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k, i) => (
          <motion.div key={k.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
            className="rounded-2xl border border-line bg-surface p-5 shadow-card">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted">{k.label}</span>
              <k.icon className="h-4 w-4" style={{ color: k.accent }} />
            </div>
            <div className="mt-2 font-display text-2xl font-bold text-heading" style={{ fontVariantNumeric: 'tabular-nums' }}>{k.value}</div>
          </motion.div>
        ))}
      </div>

      {/* Kanal bo'yicha daromad */}
      <div className="mt-6 rounded-2xl border border-line bg-surface p-6 shadow-card">
        <h2 className="font-semibold text-heading">{t('admin.byChannel')}</h2>
        <div className="mt-5 flex flex-col gap-4">
          {channels.map((c) => {
            const M = CHANNEL_META[c.key];
            return (
              <div key={c.key}>
                <div className="flex items-center justify-between text-sm">
                  <span className="inline-flex items-center gap-2 text-heading"><M.icon className="h-4 w-4" style={{ color: M.color }} /> {t(`admin.channel.${c.key}`)}</span>
                  <span className="font-semibold text-heading" style={{ fontVariantNumeric: 'tabular-nums' }}>{formatUZS(c.amount)} <span className="ml-1 text-xs font-normal text-muted">· {c.count} {t('admin.tx')}</span></span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-bg">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${(c.amount / maxCh) * 100}%` }} transition={{ duration: 0.6 }} className="h-full rounded-full" style={{ background: M.color }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Homiy statistikasi */}
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <StatMini label={t('billing.status.ACTIVE')} value={rev.partners.active} tone="emerald" />
        <StatMini label={t('billing.status.PAST_DUE')} value={rev.partners.pastDue} tone="amber" />
        <StatMini label={t('billing.status.SUSPENDED')} value={rev.partners.suspended} tone="rose" />
      </div>

      {/* Homiylar jadvali */}
      <div className="mt-6 overflow-x-auto rounded-2xl border border-line bg-surface shadow-card">
        <table className="w-full min-w-[680px] text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
              <th className="px-4 py-3 font-semibold">{t('admin.col.name')}</th>
              <th className="px-4 py-3 font-semibold">{t('admin.col.plan')}</th>
              <th className="px-4 py-3 font-semibold">{t('admin.col.status')}</th>
              <th className="px-4 py-3 text-right font-semibold">{t('admin.col.entities')}</th>
              <th className="px-4 py-3 text-right font-semibold">{t('admin.col.monthly')}</th>
              <th className="px-4 py-3 font-semibold">{t('admin.col.expires')}</th>
            </tr>
          </thead>
          <tbody>
            {partners.map((p) => (
              <tr key={p.id} className="border-b border-line/60 last:border-0">
                <td className="px-4 py-3 font-medium text-heading">{p.name}</td>
                <td className="px-4 py-3 text-ink">{t(`plans.${p.plan}.name`)}</td>
                <td className="px-4 py-3"><span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${BILLING_BADGE[p.billingStatus] ?? 'border-line text-muted'}`}>{t(`billing.status.${p.billingStatus}`)}</span></td>
                <td className="px-4 py-3 text-right" style={{ fontVariantNumeric: 'tabular-nums' }}>{p.entities}</td>
                <td className="px-4 py-3 text-right font-semibold text-heading" style={{ fontVariantNumeric: 'tabular-nums' }}>{p.monthlyValue > 0 ? formatUZS(p.monthlyValue) : '—'}</td>
                <td className="px-4 py-3 text-xs text-muted">{p.planExpiresAt ? new Date(p.planExpiresAt).toLocaleDateString('uz') : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatMini({ label, value, tone }: { label: string; value: number; tone: 'emerald' | 'amber' | 'rose' }) {
  const map = {
    emerald: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    amber: 'border-amber-200 bg-amber-50 text-amber-700',
    rose: 'border-rose-200 bg-rose-50 text-rose-600',
  } as const;
  return (
    <div className={`rounded-2xl border p-4 ${map[tone]}`}>
      <div className="text-xs font-medium opacity-80">{label}</div>
      <div className="mt-1 font-display text-2xl font-bold" style={{ fontVariantNumeric: 'tabular-nums' }}>{value}</div>
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return <div className="grid place-items-center py-24 text-center">{children}</div>;
}
