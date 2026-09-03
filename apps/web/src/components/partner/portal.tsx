'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import {
  Building2, Loader2, LayoutDashboard, Inbox, Package, CreditCard, Wallet,
  TrendingUp, ShieldCheck, Landmark, ShoppingBag, Phone, Check, Plus, Trash2, ExternalLink,
  AlertTriangle, Clock, Receipt, CheckCircle2, Zap,
} from 'lucide-react';
import { Link } from 'next-view-transitions';
import { useAuth } from '@/components/auth-provider';
import { useToast } from '@/components/toast';
import { formatUZS } from '@/lib/utils';
import {
  api, type PartnerAccountBrief, type PartnerDashboard, type PartnerLead,
  type PartnerProducts, type PartnerPlanConfig, type PartnerPlanId, type PartnerBank,
  type PartnerBillingOverview, type PartnerInvoice,
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

// ─── Products (ipoteka self-serve boshqaruvi + boshqa kanallar read-only) ────
function Products({ partnerId }: { partnerId: string }) {
  const t = useTranslations('biznes');
  const [p, setP] = useState<PartnerProducts | null>(null);
  const reload = useCallback(() => { api.partnerProducts(partnerId).then(setP).catch(() => setP(null)); }, [partnerId]);
  useEffect(() => { setP(null); reload(); }, [partnerId, reload]);

  if (!p) return <Centered><Loader2 className="animate-spin text-brand" /></Centered>;

  const others = [...p.insurance, ...p.nasiya, ...p.vendors];

  return (
    <div className="flex flex-col gap-8">
      {/* Ipoteka — tahrirlanadigan */}
      <MortgageManager partnerId={partnerId} programs={p.mortgage} onChanged={reload} />

      {/* Boshqa kanallar — read-only */}
      {others.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-heading">{t('products.otherChannels')}</h3>
          <p className="mt-1 text-xs text-muted">{t('products.readonly')}</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {others.map((row) => (
              <div key={`${row.channel}-${row.id}`} className="rounded-2xl border border-line bg-surface p-4 shadow-card">
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-bg px-2.5 py-0.5 text-xs font-semibold text-muted">{t(`channel.${row.channel}`)}</span>
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
        </div>
      )}
    </div>
  );
}

// ─── Ipoteka self-serve menejeri ─────────────────────────────────────────────
function MortgageManager({ partnerId, programs, onChanged }: { partnerId: string; programs: PartnerProducts['mortgage']; onChanged: () => void }) {
  const t = useTranslations('biznes');
  const { toast } = useToast();
  const [banks, setBanks] = useState<PartnerBank[] | null>(null);
  const [showBank, setShowBank] = useState(false);
  const [showProgram, setShowProgram] = useState(false);
  const [bankName, setBankName] = useState('');
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ bankId: '', name: '', annualRate: '18', maxTermMonths: '240', minDownPct: '15', maxAmount: '' });
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const loadBanks = useCallback(() => { api.partnerBanks(partnerId).then(setBanks).catch(() => setBanks([])); }, [partnerId]);
  useEffect(() => { loadBanks(); }, [loadBanks]);

  async function createBank() {
    if (bankName.trim().length < 2) return;
    setBusy(true);
    try {
      await api.partnerCreateBank(partnerId, { name: bankName.trim() });
      toast({ variant: 'success', title: t('products.mortgage.bankCreated') });
      setBankName(''); setShowBank(false); loadBanks();
    } catch (e) { toast({ variant: 'error', title: (e as Error).message }); }
    finally { setBusy(false); }
  }

  async function createProgram() {
    const bankId = form.bankId || banks?.[0]?.id;
    if (!bankId || form.name.trim().length < 2) { toast({ variant: 'error', title: t('products.mortgage.fillRequired') }); return; }
    setBusy(true);
    try {
      await api.partnerCreateProgram(partnerId, {
        bankId,
        name: form.name.trim(),
        annualRate: Number(form.annualRate),
        maxTermMonths: Number(form.maxTermMonths),
        minDownPct: Number(form.minDownPct),
        maxAmount: form.maxAmount ? Number(form.maxAmount) : undefined,
      });
      toast({ variant: 'success', title: t('products.mortgage.programLive') });
      setShowProgram(false);
      setForm({ bankId: '', name: '', annualRate: '18', maxTermMonths: '240', minDownPct: '15', maxAmount: '' });
      onChanged();
    } catch (e) { toast({ variant: 'error', title: (e as Error).message }); }
    finally { setBusy(false); }
  }

  async function toggle(programId: string, active: boolean) {
    try { await api.partnerUpdateProgram(partnerId, programId, { active: !active }); onChanged(); }
    catch (e) { toast({ variant: 'error', title: (e as Error).message }); }
  }

  async function remove(programId: string) {
    if (!confirm(t('products.mortgage.deleteConfirm'))) return;
    try { await api.partnerDeleteProgram(partnerId, programId); toast({ variant: 'success', title: t('products.mortgage.deleted') }); onChanged(); }
    catch (e) { toast({ variant: 'error', title: (e as Error).message }); }
  }

  const hasBank = (banks?.length ?? 0) > 0;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Landmark className="h-5 w-5 text-brand" />
          <h3 className="font-display text-lg font-bold text-heading">{t('products.mortgage.title')}</h3>
        </div>
        <div className="flex gap-2">
          <Link href="/ipoteka" target="_blank" className="inline-flex items-center gap-1.5 rounded-full border border-line px-3.5 py-2 text-xs font-semibold text-heading transition hover:bg-bg">
            <ExternalLink className="h-3.5 w-3.5" /> {t('products.mortgage.viewLive')}
          </Link>
          {hasBank && (
            <button onClick={() => { setShowProgram((v) => !v); setShowBank(false); }} className="inline-flex items-center gap-1.5 rounded-full bg-brand px-3.5 py-2 text-xs font-bold text-white transition hover:brightness-110">
              <Plus className="h-3.5 w-3.5" /> {t('products.mortgage.addProgram')}
            </button>
          )}
        </div>
      </div>
      <p className="mt-1 text-xs text-muted">{t('products.mortgage.liveHint')}</p>

      {/* Bank yo'q → yaratish */}
      {banks === null ? (
        <div className="mt-4"><Loader2 className="h-5 w-5 animate-spin text-brand" /></div>
      ) : !hasBank ? (
        <div className="mt-4 rounded-2xl border border-dashed border-line p-6 text-center">
          <p className="text-sm text-muted">{t('products.mortgage.noBank')}</p>
          {!showBank ? (
            <button onClick={() => setShowBank(true)} className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-brand px-4 py-2.5 text-sm font-bold text-white transition hover:brightness-110">
              <Plus className="h-4 w-4" /> {t('products.mortgage.createBank')}
            </button>
          ) : (
            <div className="mx-auto mt-3 flex max-w-sm gap-2">
              <input value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder={t('products.mortgage.bankNamePh')}
                className="flex-1 rounded-xl border border-line bg-bg px-3 py-2.5 text-sm text-heading outline-none focus:border-brand" />
              <button onClick={createBank} disabled={busy} className="rounded-xl bg-brand px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : t('common.add')}
              </button>
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Dastur qo'shish formasi */}
          {showProgram && (
            <div className="mt-4 rounded-2xl border border-line bg-surface p-5 shadow-card">
              <div className="grid gap-4 sm:grid-cols-2">
                {(banks.length > 1) && (
                  <div className="sm:col-span-2">
                    <label className="text-sm font-medium text-muted">{t('products.mortgage.selectBank')}</label>
                    <select value={form.bankId || banks[0].id} onChange={(e) => set('bankId', e.target.value)}
                      className="mt-1.5 w-full rounded-xl border border-line bg-bg px-3 py-2.5 text-sm text-heading">
                      {banks.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                  </div>
                )}
                <NumField label={t('products.mortgage.programName')} text value={form.name} onChange={(v) => set('name', v)} placeholder={t('products.mortgage.programNamePh')} full />
                <NumField label={`${t('products.mortgage.rate')} (%)`} value={form.annualRate} onChange={(v) => set('annualRate', v)} />
                <NumField label={t('products.mortgage.term')} value={form.maxTermMonths} onChange={(v) => set('maxTermMonths', v)} />
                <NumField label={`${t('products.mortgage.down')} (%)`} value={form.minDownPct} onChange={(v) => set('minDownPct', v)} />
                <NumField label={t('products.mortgage.maxAmount')} value={form.maxAmount} onChange={(v) => set('maxAmount', v)} placeholder="0" />
              </div>
              <div className="mt-4 flex gap-2">
                <button onClick={createProgram} disabled={busy} className="inline-flex items-center gap-2 rounded-full bg-brand px-5 py-2.5 text-sm font-bold text-white transition hover:brightness-110 disabled:opacity-60">
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} {t('products.mortgage.publish')}
                </button>
                <button onClick={() => setShowProgram(false)} className="rounded-full border border-line px-5 py-2.5 text-sm font-semibold text-heading transition hover:bg-bg">{t('common.cancel')}</button>
              </div>
            </div>
          )}

          {/* Dasturlar ro'yxati */}
          {programs.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-dashed border-line py-10 text-center text-sm text-muted">{t('products.mortgage.noProgram')}</div>
          ) : (
            <div className="mt-4 flex flex-col gap-2">
              {programs.map((row) => (
                <div key={row.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-surface p-4 shadow-card">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-heading">{row.name}</span>
                      <span className="rounded-full bg-brand/10 px-2 py-0.5 text-xs font-semibold text-brand">{row.meta}</span>
                    </div>
                    <div className="mt-0.5 text-xs text-muted">{row.brand}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => toggle(row.id, row.active)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${row.active ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-line text-muted hover:bg-bg'}`}>
                      {row.active ? t('products.active') : t('products.inactive')}
                    </button>
                    <button onClick={() => remove(row.id)} className="grid h-8 w-8 place-items-center rounded-full border border-line text-rose-500 transition hover:bg-rose-50" title={t('common.delete')}>
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function NumField({ label, value, onChange, placeholder, text, full }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; text?: boolean; full?: boolean }) {
  return (
    <div className={full ? 'sm:col-span-2' : ''}>
      <label className="text-sm font-medium text-muted">{label}</label>
      <input
        type={text ? 'text' : 'number'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1.5 w-full rounded-xl border border-line bg-bg px-3 py-2.5 text-sm text-heading outline-none transition focus:border-brand"
      />
    </div>
  );
}

// ─── Plan / Billing tab ──────────────────────────────────────────────────────
const BILLING_BADGE: Record<string, string> = {
  ACTIVE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  TRIALING: 'bg-blue-50 text-brand border-blue-200',
  PAST_DUE: 'bg-amber-50 text-amber-700 border-amber-200',
  SUSPENDED: 'bg-rose-50 text-rose-600 border-rose-200',
  CANCELLED: 'bg-slate-100 text-slate-500 border-slate-200',
};

function PlanTab({ partnerId, currentPlan, onChanged }: { partnerId: string; currentPlan: PartnerPlanId; onChanged: () => void }) {
  const t = useTranslations('biznes');
  const { toast } = useToast();
  const [plans, setPlans] = useState<PartnerPlanConfig[] | null>(null);
  const [billing, setBilling] = useState<PartnerBillingOverview | null>(null);
  const [invoices, setInvoices] = useState<PartnerInvoice[]>([]);
  const [busyPlan, setBusyPlan] = useState<PartnerPlanId | null>(null);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [simBusy, setSimBusy] = useState<number | null>(null);

  const reload = useCallback(() => {
    Promise.all([api.partnerBilling(partnerId), api.partnerInvoices(partnerId)])
      .then(([b, inv]) => { setBilling(b); setInvoices(inv); })
      .catch(() => {});
  }, [partnerId]);

  useEffect(() => {
    api.partnerPlans().then(setPlans).catch(() => setPlans([]));
    reload();
  }, [reload]);

  async function select(plan: PartnerPlanId) {
    setBusyPlan(plan);
    try {
      const res = await api.partnerSelectPlan(partnerId, plan);
      if (res.activated) toast({ variant: 'success', title: t('plans.activated') });
      else toast({ variant: 'success', title: t('billing.invoiceCreated') });
      reload();
      onChanged();
    } catch (e) {
      toast({ variant: 'error', title: (e as Error).message || 'Xatolik' });
    } finally {
      setBusyPlan(null);
    }
  }

  async function pay(invoiceId: string) {
    setPayingId(invoiceId);
    try {
      await api.partnerPayInvoice(partnerId, invoiceId);
      toast({ variant: 'success', title: t('billing.paidOk') });
      reload();
      onChanged();
    } catch (e) {
      toast({ variant: 'error', title: (e as Error).message || 'Xatolik' });
    } finally {
      setPayingId(null);
    }
  }

  async function simulate(daysPast: number) {
    setSimBusy(daysPast);
    try {
      await api.partnerSimulateBilling(partnerId, daysPast);
      toast({ variant: 'success', title: t('billing.simDone') });
      reload();
      onChanged();
    } catch (e) {
      toast({ variant: 'error', title: (e as Error).message || 'Xatolik' });
    } finally {
      setSimBusy(null);
    }
  }

  if (!plans || !billing) return <Centered><Loader2 className="animate-spin text-brand" /></Centered>;

  const bs = billing.billingStatus;

  return (
    <div className="flex flex-col gap-6">
      {/* Billing holati banneri */}
      <div className="rounded-2xl border border-line bg-surface p-5 shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-brand/10 text-brand"><CreditCard className="h-5 w-5" /></div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-heading">{t(`plans.${billing.plan}.name`)}</span>
                <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${BILLING_BADGE[bs] ?? 'border-line text-muted'}`}>{t(`billing.status.${bs}`)}</span>
              </div>
              <div className="mt-0.5 text-xs text-muted">
                {billing.plan === 'FREE'
                  ? t('billing.freeActive')
                  : billing.planExpiresAt
                    ? `${bs === 'PAST_DUE' || bs === 'SUSPENDED' ? t('billing.expiredOn') : t('billing.renewsOn')} ${new Date(billing.planExpiresAt).toLocaleDateString('uz')}`
                    : ''}
              </div>
            </div>
          </div>
          {billing.priceMonthly > 0 && (
            <div className="text-right">
              <div className="font-display text-xl font-bold text-heading" style={{ fontVariantNumeric: 'tabular-nums' }}>{formatUZS(billing.priceMonthly)}</div>
              <div className="text-xs text-muted">/ {t('plans.month')}</div>
            </div>
          )}
        </div>

        {/* Grace / suspended ogohlantirish */}
        {bs === 'PAST_DUE' && (
          <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            <Clock className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{t('billing.graceHint')}{billing.gracePeriodEnds ? ` (${new Date(billing.gracePeriodEnds).toLocaleDateString('uz')})` : ''}</span>
          </div>
        )}
        {bs === 'SUSPENDED' && (
          <div className="mt-4 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{t('billing.suspendedHint')}</span>
          </div>
        )}

        {/* Ochiq hisob-faktura → to'lash */}
        {billing.openInvoice && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-brand/20 bg-brand/[0.03] p-4">
            <div className="flex items-center gap-3">
              <Receipt className="h-5 w-5 text-brand" />
              <div>
                <div className="text-sm font-semibold text-heading">{t('billing.openInvoice')} · {billing.openInvoice.number}</div>
                <div className="text-xs text-muted">{formatUZS(billing.openInvoice.amount)}{billing.openInvoice.dueAt ? ` · ${t('billing.due')} ${new Date(billing.openInvoice.dueAt).toLocaleDateString('uz')}` : ''}</div>
              </div>
            </div>
            <button onClick={() => pay(billing.openInvoice!.id)} disabled={payingId != null}
              className="inline-flex items-center gap-2 rounded-full bg-brand px-5 py-2.5 text-sm font-bold text-white transition hover:brightness-110 disabled:opacity-60">
              {payingId ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} {t('billing.payDemo')}
            </button>
          </div>
        )}
      </div>

      {/* Tariflar */}
      <div>
        <p className="mb-5 max-w-2xl text-sm text-muted">{t('plans.portalHint')}</p>
        <PartnerPlanCards plans={plans} currentPlan={currentPlan} onSelect={select} busyPlan={busyPlan} />
      </div>

      {/* Hisob-fakturalar tarixi */}
      {invoices.length > 0 && (
        <div className="rounded-2xl border border-line bg-surface p-5 shadow-card">
          <h3 className="text-sm font-semibold text-heading">{t('billing.invoicesTitle')}</h3>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[520px] text-sm">
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id} className="border-b border-line/60 last:border-0">
                    <td className="py-2.5 font-mono text-xs text-muted">{inv.number}</td>
                    <td className="py-2.5 text-ink">{inv.plan ? t(`plans.${inv.plan}.name`) : '—'}</td>
                    <td className="py-2.5 text-right font-semibold text-heading" style={{ fontVariantNumeric: 'tabular-nums' }}>{formatUZS(inv.amount)}</td>
                    <td className="py-2.5 pl-3">
                      <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${inv.status === 'PAID' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : inv.status === 'OPEN' ? 'border-amber-200 bg-amber-50 text-amber-700' : 'border-line text-muted'}`}>
                        {t(`billing.invStatus.${inv.status}`)}
                      </span>
                    </td>
                    <td className="py-2.5 pl-3 text-right text-xs text-muted">{new Date(inv.createdAt).toLocaleDateString('uz')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* DEMO: lifecycle simulyatori */}
      {billing.plan !== 'FREE' && (
        <div className="rounded-2xl border border-dashed border-line bg-bg/40 p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-heading"><Zap className="h-4 w-4 text-brand" /> {t('billing.demoTitle')}</div>
          <p className="mt-1 text-xs text-muted">{t('billing.demoHint')}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {([['-3', -3], ['+3', 3], ['+6', 6], ['+8', 8]] as [string, number][]).map(([label, d]) => (
              <button key={d} onClick={() => simulate(d)} disabled={simBusy != null}
                className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3.5 py-2 text-xs font-semibold text-heading transition hover:bg-bg disabled:opacity-60">
                {simBusy === d ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Clock className="h-3.5 w-3.5" />} {t('billing.simDay', { d: label })}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return <div className="grid place-items-center py-24 text-center">{children}</div>;
}
