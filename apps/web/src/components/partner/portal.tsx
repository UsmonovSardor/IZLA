'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import {
  Building2, Loader2, LayoutDashboard, Inbox, Package, CreditCard, Wallet,
  TrendingUp, ShieldCheck, Landmark, ShoppingBag, ArrowUpRight, Phone, Check,
} from 'lucide-react';
import { useAuth } from '@/components/auth-provider';
import { useToast } from '@/components/toast';
import { formatUZS } from '@/lib/utils';
import {
  api, type PartnerAccountBrief, type PartnerDashboard, type PartnerLead,
  type PartnerProducts, type PartnerPlanConfig, type PartnerPlanId,
} from '@/lib/api';
import { PartnerPlanCards } from './plan-cards';

type Tab = 'overview' | 'leads' | 'products' | 'plan';

const CHANNEL_ICON = { insurance: ShieldCheck, mortgage: Landmark, nasiya: ShoppingBag } as const;
const STATUS_STYLE: Record<string, string> = {
  NEW: 'bg-blue-50 text-brand border-blue-200',
  PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
  CONTACTED: 'bg-indigo-50 text-indigo-600 border-indigo-200',
  APPROVED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  ACTIVE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  FUNDED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  ISSUED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  REJECTED: 'bg-rose-50 text-rose-600 border-rose-200',
  CANCELLED: 'bg-rose-50 text-rose-600 border-rose-200',
  EXPIRED: 'bg-slate-100 text-slate-500 border-slate-200',
};

export function PartnerPortal() {
  const { user, loading, openLogin } = useAuth();
  const t = useTranslations('biznes');

  const [partners, setPartners] = useState<PartnerAccountBrief[] | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('overview');

  const loadPartners = useCallback(() => {
    api.partnerMe().then((list) => {
      setPartners(list);
      if (list.length && !activeId) setActiveId(list[0].id);
    }).catch(() => setPartners([]));
  }, [activeId]);

  useEffect(() => {
    if (!user) return;
    loadPartners();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  if (loading) return <Centered><Loader2 className="animate-spin text-brand" /></Centered>;

  if (!user) {
    return (
      <Centered>
        <Building2 className="text-slate-300" size={44} />
        <h1 className="mt-4 font-display text-2xl font-bold text-heading">{t('portal.title')}</h1>
        <p className="mt-2 text-muted">{t('portal.loginNeeded')}</p>
        <button onClick={() => openLogin({ next: '/biznes/kabinet' })} className="mt-5 rounded-full bg-brand px-6 py-3 text-sm font-bold text-white transition hover:brightness-110">
          {t('portal.login')}
        </button>
      </Centered>
    );
  }

  if (partners === null) return <Centered><Loader2 className="animate-spin text-brand" /></Centered>;

  if (partners.length === 0) {
    return <Onboarding onCreated={loadPartners} />;
  }

  const active = partners.find((p) => p.id === activeId) ?? partners[0];

  return (
    <div className="py-8 md:py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-heading md:text-3xl">{t('portal.title')}</h1>
          <p className="mt-1 text-muted">{t('portal.subtitle')}</p>
        </div>
        {partners.length > 1 && (
          <select
            value={active.id}
            onChange={(e) => { setActiveId(e.target.value); setTab('overview'); }}
            className="rounded-xl border border-line bg-surface px-4 py-2.5 text-sm font-semibold text-heading"
          >
            {partners.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        )}
      </div>

      {/* Tablar */}
      <div className="mt-6 flex flex-wrap gap-2 border-b border-line">
        {([
          ['overview', LayoutDashboard],
          ['leads', Inbox],
          ['products', Package],
          ['plan', CreditCard],
        ] as [Tab, typeof Inbox][]).map(([id, Icon]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`-mb-px flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition ${
              tab === id ? 'border-brand text-brand' : 'border-transparent text-muted hover:text-heading'
            }`}
          >
            <Icon className="h-4 w-4" /> {t(`portal.tab.${id}`)}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === 'overview' && <Overview partnerId={active.id} />}
        {tab === 'leads' && <Leads partnerId={active.id} />}
        {tab === 'products' && <Products partnerId={active.id} />}
        {tab === 'plan' && <PlanTab partnerId={active.id} currentPlan={active.plan} onChanged={loadPartners} />}
      </div>
    </div>
  );
}

// ─── Onboarding ─────────────────────────────────────────────────────────────
function Onboarding({ onCreated }: { onCreated: () => void }) {
  const t = useTranslations('biznes');
  const { toast } = useToast();
  const [form, setForm] = useState({ name: '', legalName: '', taxId: '', phone: '', email: '', website: '' });
  const [busy, setBusy] = useState(false);
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const canSubmit = form.name.trim().length >= 2 && !busy;

  async function submit() {
    setBusy(true);
    try {
      await api.partnerRegister({
        name: form.name.trim(),
        legalName: form.legalName.trim() || undefined,
        taxId: form.taxId.trim() || undefined,
        phone: form.phone.trim() || undefined,
        email: form.email.trim() || undefined,
        website: form.website.trim() || undefined,
      });
      toast({ variant: 'success', title: t('onboarding.done') });
      onCreated();
    } catch (e) {
      toast({ variant: 'error', title: (e as Error).message || 'Xatolik' });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="py-10 md:py-14">
      <div className="mx-auto max-w-xl">
        <div className="text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-brand/10 text-brand">
            <Building2 className="h-7 w-7" />
          </div>
          <h1 className="mt-4 font-display text-2xl font-bold text-heading md:text-3xl">{t('onboarding.title')}</h1>
          <p className="mt-2 text-muted">{t('onboarding.subtitle')}</p>
        </div>

        <div className="mt-8 rounded-3xl border border-line bg-surface p-6 shadow-card">
          <div className="flex flex-col gap-4">
            <Field label={t('onboarding.name')} required value={form.name} onChange={(v) => set('name', v)} placeholder={t('onboarding.namePh')} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t('onboarding.legalName')} value={form.legalName} onChange={(v) => set('legalName', v)} />
              <Field label={t('onboarding.taxId')} value={form.taxId} onChange={(v) => set('taxId', v)} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t('onboarding.phone')} value={form.phone} onChange={(v) => set('phone', v)} placeholder="+998" />
              <Field label={t('onboarding.email')} value={form.email} onChange={(v) => set('email', v)} />
            </div>
            <Field label={t('onboarding.website')} value={form.website} onChange={(v) => set('website', v)} placeholder="https://" />
          </div>
          <button
            onClick={submit}
            disabled={!canSubmit}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-brand px-6 py-3.5 text-sm font-bold text-white transition hover:brightness-110 disabled:opacity-60"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            {t('onboarding.submit')}
          </button>
          <p className="mt-3 text-center text-xs text-muted/80">{t('onboarding.note')}</p>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, required }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; required?: boolean }) {
  return (
    <div>
      <label className="text-sm font-medium text-muted">{label}{required && <span className="text-brand"> *</span>}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1.5 w-full rounded-xl border border-line bg-bg px-4 py-2.5 text-sm text-heading outline-none transition focus:border-brand"
      />
    </div>
  );
}

// ─── Overview ───────────────────────────────────────────────────────────────
function Overview({ partnerId }: { partnerId: string }) {
  const t = useTranslations('biznes');
  const [d, setD] = useState<PartnerDashboard | null>(null);
  useEffect(() => { setD(null); api.partnerDashboard(partnerId).then(setD).catch(() => setD(null)); }, [partnerId]);

  if (!d) return <Centered><Loader2 className="animate-spin text-brand" /></Centered>;

  const stats = [
    { label: t('overview.products'), value: String(d.counts.products), icon: Package, note: `${d.limits.productsUsed}/${d.limits.products === 999 ? '∞' : d.limits.products}` },
    { label: t('overview.leadsTotal'), value: String(d.leads.total), icon: Inbox },
    { label: t('overview.leads30d'), value: String(d.leads.last30d), icon: TrendingUp },
    { label: t('overview.balance'), value: formatUZS(d.wallet.balance), icon: Wallet },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Plan holati */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-brand/20 bg-brand/[0.03] p-4">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-brand/10 text-brand"><CreditCard className="h-5 w-5" /></div>
          <div>
            <div className="text-sm font-semibold text-heading">{t(`plans.${d.partner.plan}.name`)}</div>
            <div className="text-xs text-muted">
              {d.partner.planExpiresAt ? `${t('overview.until')} ${new Date(d.partner.planExpiresAt).toLocaleDateString('uz')}` : t('overview.freePlan')}
            </div>
          </div>
        </div>
        <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${STATUS_STYLE[d.partner.status] ?? 'border-line text-muted'}`}>
          {t(`status.${d.partner.status}`)}
        </span>
      </div>

      {/* Stat kartochkalar */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
            className="rounded-2xl border border-line bg-surface p-5 shadow-card">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted">{s.label}</span>
              <s.icon className="h-4 w-4 text-brand" />
            </div>
            <div className="mt-2 font-display text-2xl font-bold text-heading" style={{ fontVariantNumeric: 'tabular-nums' }}>{s.value}</div>
            {s.note && <div className="mt-0.5 text-xs text-muted">{s.note}</div>}
          </motion.div>
        ))}
      </div>

      {/* Kanal bo'yicha lidlar */}
      <div className="rounded-2xl border border-line bg-surface p-5 shadow-card">
        <h3 className="text-sm font-semibold text-heading">{t('overview.leadsByChannel')}</h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {(['insurance', 'mortgage', 'nasiya'] as const).map((ch) => {
            const Icon = CHANNEL_ICON[ch];
            return (
              <div key={ch} className="flex items-center gap-3 rounded-xl bg-bg px-4 py-3">
                <Icon className="h-5 w-5 text-brand" />
                <div>
                  <div className="text-xs text-muted">{t(`channel.${ch}`)}</div>
                  <div className="font-display text-lg font-bold text-heading">{d.leads.byChannel[ch]}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Leads inbox ────────────────────────────────────────────────────────────
function Leads({ partnerId }: { partnerId: string }) {
  const t = useTranslations('biznes');
  const [leads, setLeads] = useState<PartnerLead[] | null>(null);
  const [channel, setChannel] = useState<'' | 'insurance' | 'mortgage' | 'nasiya'>('');

  useEffect(() => {
    setLeads(null);
    api.partnerLeads(partnerId, channel ? `?channel=${channel}` : '').then(setLeads).catch(() => setLeads([]));
  }, [partnerId, channel]);

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {([['', t('leads.all')], ['insurance', t('channel.insurance')], ['mortgage', t('channel.mortgage')], ['nasiya', t('channel.nasiya')]] as const).map(([id, label]) => (
          <button key={id} onClick={() => setChannel(id)}
            className={`rounded-full border px-4 py-2 text-sm font-medium transition ${channel === id ? 'border-brand bg-brand text-white' : 'border-line text-heading hover:bg-bg'}`}>
            {label}
          </button>
        ))}
      </div>

      {leads === null ? (
        <Centered><Loader2 className="animate-spin text-brand" /></Centered>
      ) : leads.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-line py-16 text-center text-muted">
          <Inbox className="mx-auto h-8 w-8 text-slate-300" />
          <p className="mt-2 text-sm">{t('leads.empty')}</p>
        </div>
      ) : (
        <div className="mt-5 overflow-x-auto rounded-2xl border border-line bg-surface shadow-card">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
                <th className="px-4 py-3 font-semibold">{t('leads.client')}</th>
                <th className="px-4 py-3 font-semibold">{t('leads.channel')}</th>
                <th className="px-4 py-3 font-semibold">{t('leads.product')}</th>
                <th className="px-4 py-3 text-right font-semibold">{t('leads.amount')}</th>
                <th className="px-4 py-3 font-semibold">{t('leads.status')}</th>
                <th className="px-4 py-3 font-semibold">{t('leads.date')}</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((l) => {
                const Icon = CHANNEL_ICON[l.channel];
                return (
                  <tr key={`${l.channel}-${l.id}`} className="border-b border-line/60 last:border-0">
                    <td className="px-4 py-3">
                      <div className="font-medium text-heading">{l.name ?? '—'}</div>
                      {l.phone && <div className="flex items-center gap-1 text-xs text-muted"><Phone className="h-3 w-3" /> {l.phone}</div>}
                    </td>
                    <td className="px-4 py-3"><span className="inline-flex items-center gap-1.5 text-muted"><Icon className="h-4 w-4 text-brand" /> {t(`channel.${l.channel}`)}</span></td>
                    <td className="px-4 py-3 text-ink">{l.product ?? '—'}</td>
                    <td className="px-4 py-3 text-right font-semibold text-heading" style={{ fontVariantNumeric: 'tabular-nums' }}>{formatUZS(l.amount)}</td>
                    <td className="px-4 py-3"><span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLE[l.status] ?? 'border-line text-muted'}`}>{l.status}</span></td>
                    <td className="px-4 py-3 text-xs text-muted">{new Date(l.createdAt).toLocaleDateString('uz')}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Products ───────────────────────────────────────────────────────────────
function Products({ partnerId }: { partnerId: string }) {
  const t = useTranslations('biznes');
  const [p, setP] = useState<PartnerProducts | null>(null);
  useEffect(() => { setP(null); api.partnerProducts(partnerId).then(setP).catch(() => setP(null)); }, [partnerId]);

  if (!p) return <Centered><Loader2 className="animate-spin text-brand" /></Centered>;

  const all = [...p.insurance, ...p.mortgage, ...p.nasiya, ...p.vendors];
  if (all.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-line py-16 text-center text-muted">
        <Package className="mx-auto h-8 w-8 text-slate-300" />
        <p className="mt-2 text-sm">{t('products.empty')}</p>
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {all.map((row) => (
        <div key={`${row.channel}-${row.id}`} className="rounded-2xl border border-line bg-surface p-4 shadow-card">
          <div className="flex items-center justify-between">
            <span className="rounded-full bg-bg px-2.5 py-0.5 text-xs font-semibold text-muted">{t(`channel.${row.channel === 'vendor' ? 'vendor' : row.channel}`)}</span>
            <span className={`h-2 w-2 rounded-full ${row.active ? 'bg-emerald-500' : 'bg-slate-300'}`} title={row.active ? t('products.active') : t('products.inactive')} />
          </div>
          <div className="mt-2 font-semibold text-heading">{row.name}</div>
          <div className="mt-0.5 text-xs text-muted">{row.brand} · {row.meta}</div>
          {row.price != null && row.price > 0 && (
            <div className="mt-2 text-sm font-semibold text-heading">{t('products.from')} {formatUZS(row.price)}</div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Plan tab ───────────────────────────────────────────────────────────────
function PlanTab({ partnerId, currentPlan, onChanged }: { partnerId: string; currentPlan: PartnerPlanId; onChanged: () => void }) {
  const t = useTranslations('biznes');
  const { toast } = useToast();
  const [plans, setPlans] = useState<PartnerPlanConfig[] | null>(null);
  const [busyPlan, setBusyPlan] = useState<PartnerPlanId | null>(null);

  useEffect(() => { api.partnerPlans().then(setPlans).catch(() => setPlans([])); }, []);

  async function select(plan: PartnerPlanId) {
    setBusyPlan(plan);
    try {
      await api.partnerSelectPlan(partnerId, plan);
      toast({ variant: 'success', title: t('plans.activated') });
      onChanged();
    } catch (e) {
      toast({ variant: 'error', title: (e as Error).message || 'Xatolik' });
    } finally {
      setBusyPlan(null);
    }
  }

  if (!plans) return <Centered><Loader2 className="animate-spin text-brand" /></Centered>;

  return (
    <div>
      <p className="mb-6 max-w-2xl text-sm text-muted">{t('plans.portalHint')}</p>
      <PartnerPlanCards plans={plans} currentPlan={currentPlan} onSelect={select} busyPlan={busyPlan} />
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return <div className="grid place-items-center py-24 text-center">{children}</div>;
}
