'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import {
  Building2, Loader2, LayoutDashboard, Inbox, Package, CreditCard, Wallet,
  TrendingUp, ShieldCheck, Landmark, ShoppingBag, Phone, Check, Plus, Trash2, ExternalLink,
  AlertTriangle, Clock, Receipt, CheckCircle2, Zap, Lock, ArrowDownRight, ArrowUpRight,
} from 'lucide-react';
import { Link } from 'next-view-transitions';
import { useAuth } from '@/components/auth-provider';
import { useToast } from '@/components/toast';
import { formatUZS } from '@/lib/utils';
import {
  api, type PartnerAccountBrief, type PartnerDashboard, type PartnerLead,
  type PartnerProducts, type PartnerPlanConfig, type PartnerPlanId, type PartnerBank,
  type PartnerBillingOverview, type PartnerInvoice, type PartnerInsurer, type InsuranceType,
  type PartnerWallet, type PartnerWalletEntry,
} from '@/lib/api';
import { PartnerPlanCards } from './plan-cards';

type Tab = 'overview' | 'leads' | 'wallet' | 'products' | 'plan';

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
        <div className="flex items-center gap-3">
          {user?.role === 'ADMIN' && (
            <Link href="/biznes/admin" className="inline-flex items-center gap-1.5 rounded-full border border-brand/30 bg-brand/5 px-4 py-2.5 text-sm font-semibold text-brand transition hover:bg-brand/10">
              <TrendingUp className="h-4 w-4" /> {t('admin.consoleLink')}
            </Link>
          )}
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
      </div>

      {/* Tablar */}
      <div className="mt-6 flex flex-wrap gap-2 border-b border-line">
        {([
          ['overview', LayoutDashboard],
          ['leads', Inbox],
          ['wallet', Wallet],
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
        {tab === 'overview' && <Overview partnerId={active.id} onGoToWallet={() => setTab('wallet')} />}
        {tab === 'leads' && <Leads partnerId={active.id} onGoToWallet={() => setTab('wallet')} />}
        {tab === 'wallet' && <WalletTab partnerId={active.id} />}
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
function Overview({ partnerId, onGoToWallet }: { partnerId: string; onGoToWallet?: () => void }) {
  const t = useTranslations('biznes');
  const [d, setD] = useState<PartnerDashboard | null>(null);
  useEffect(() => { setD(null); api.partnerDashboard(partnerId).then(setD).catch(() => setD(null)); }, [partnerId]);

  if (!d) return <Centered><Loader2 className="animate-spin text-brand" /></Centered>;

  const stats = [
    { label: t('overview.products'), value: String(d.counts.products), icon: Package, note: `${d.limits.productsUsed}/${d.limits.products === 999 ? '∞' : d.limits.products}`, onClick: undefined },
    { label: t('overview.leadsTotal'), value: String(d.leads.total), icon: Inbox, note: undefined, onClick: undefined },
    { label: t('overview.leads30d'), value: String(d.leads.last30d), icon: TrendingUp, note: undefined, onClick: undefined },
    { label: t('overview.balance'), value: formatUZS(d.wallet.balance), icon: Wallet, note: t('wallet.manage'), onClick: onGoToWallet },
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
            onClick={s.onClick}
            className={`rounded-2xl border border-line bg-surface p-5 shadow-card ${s.onClick ? 'cursor-pointer transition hover:border-brand/40 hover:shadow-md' : ''}`}>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted">{s.label}</span>
              <s.icon className="h-4 w-4 text-brand" />
            </div>
            <div className="mt-2 font-display text-2xl font-bold text-heading" style={{ fontVariantNumeric: 'tabular-nums' }}>{s.value}</div>
            {s.note && <div className={`mt-0.5 text-xs ${s.onClick ? 'font-semibold text-brand' : 'text-muted'}`}>{s.note}</div>}
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
function Leads({ partnerId, onGoToWallet }: { partnerId: string; onGoToWallet?: () => void }) {
  const t = useTranslations('biznes');
  const [leads, setLeads] = useState<PartnerLead[] | null>(null);
  const [channel, setChannel] = useState<'' | 'insurance' | 'mortgage' | 'nasiya'>('');

  useEffect(() => {
    setLeads(null);
    api.partnerLeads(partnerId, channel ? `?channel=${channel}` : '').then(setLeads).catch(() => setLeads([]));
  }, [partnerId, channel]);

  const blockedCount = leads?.filter((l) => l.locked).length ?? 0;

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

      {/* Bloklangan leadlar bannerи — hamyonни to'ldirsa ochiladi */}
      {blockedCount > 0 && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-amber-100 text-amber-700"><Lock className="h-4 w-4" /></div>
            <div className="text-sm">
              <div className="font-semibold text-amber-900">{t('leads.blockedTitle', { count: blockedCount })}</div>
              <div className="text-xs text-amber-700">{t('leads.blockedHint')}</div>
            </div>
          </div>
          <button onClick={onGoToWallet} className="inline-flex items-center gap-1.5 rounded-full bg-amber-600 px-4 py-2 text-sm font-bold text-white transition hover:brightness-110">
            <Wallet className="h-4 w-4" /> {t('wallet.topUp')}
          </button>
        </div>
      )}

      {leads === null ? (
        <Centered><Loader2 className="animate-spin text-brand" /></Centered>
      ) : leads.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-line py-16 text-center text-muted">
          <Inbox className="mx-auto h-8 w-8 text-slate-300" />
          <p className="mt-2 text-sm">{t('leads.empty')}</p>
        </div>
      ) : (
        <div className="mt-5 overflow-x-auto rounded-2xl border border-line bg-surface shadow-card">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
                <th className="px-4 py-3 font-semibold">{t('leads.client')}</th>
                <th className="px-4 py-3 font-semibold">{t('leads.channel')}</th>
                <th className="px-4 py-3 font-semibold">{t('leads.product')}</th>
                <th className="px-4 py-3 text-right font-semibold">{t('leads.amount')}</th>
                <th className="px-4 py-3 font-semibold">{t('leads.status')}</th>
                <th className="px-4 py-3 text-right font-semibold">{t('leads.cpl')}</th>
                <th className="px-4 py-3 font-semibold">{t('leads.date')}</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((l) => {
                const Icon = CHANNEL_ICON[l.channel];
                return (
                  <tr key={`${l.channel}-${l.id}`} className={`border-b border-line/60 last:border-0 ${l.locked ? 'bg-amber-50/40' : ''}`}>
                    <td className="px-4 py-3">
                      {l.locked ? (
                        <div className="flex items-center gap-1.5 text-sm text-amber-700"><Lock className="h-3.5 w-3.5" /> {t('leads.locked')}</div>
                      ) : (
                        <>
                          <div className="font-medium text-heading">{l.name ?? '—'}</div>
                          {l.phone && <a href={`tel:${l.phone}`} className="flex items-center gap-1 text-xs text-brand hover:underline"><Phone className="h-3 w-3" /> {l.phone}</a>}
                        </>
                      )}
                    </td>
                    <td className="px-4 py-3"><span className="inline-flex items-center gap-1.5 text-muted"><Icon className="h-4 w-4 text-brand" /> {t(`channel.${l.channel}`)}</span></td>
                    <td className="px-4 py-3 text-ink">{l.product ?? '—'}</td>
                    <td className="px-4 py-3 text-right font-semibold text-heading" style={{ fontVariantNumeric: 'tabular-nums' }}>{formatUZS(l.amount)}</td>
                    <td className="px-4 py-3"><span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLE[l.status] ?? 'border-line text-muted'}`}>{l.status}</span></td>
                    <td className="px-4 py-3 text-right text-xs" style={{ fontVariantNumeric: 'tabular-nums' }}>
                      {l.delivery === 'DELIVERED' && l.billed != null ? (
                        <span className="font-semibold text-emerald-600">−{formatUZS(l.billed)}</span>
                      ) : l.locked ? (
                        <span className="font-semibold text-amber-600">{t('leads.pendingPay')}</span>
                      ) : <span className="text-muted">—</span>}
                    </td>
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

// ─── CPL hamyon ──────────────────────────────────────────────────────────────
const TOPUP_PRESETS = [500_000, 1_000_000, 2_000_000, 5_000_000];

function WalletTab({ partnerId }: { partnerId: string }) {
  const t = useTranslations('biznes');
  const { toast } = useToast();
  const [w, setW] = useState<PartnerWallet | null>(null);
  const [ledger, setLedger] = useState<PartnerWalletEntry[] | null>(null);
  const [busy, setBusy] = useState<number | null>(null);

  const reload = useCallback(() => {
    api.partnerWallet(partnerId).then(setW).catch(() => setW(null));
    api.partnerWalletLedger(partnerId).then(setLedger).catch(() => setLedger([]));
  }, [partnerId]);
  useEffect(() => { setW(null); setLedger(null); reload(); }, [reload]);

  async function topUp(amount: number) {
    setBusy(amount);
    try {
      const r = await api.partnerTopUp(partnerId, amount);
      toast({
        variant: 'success',
        title: t('wallet.toppedUp', { amount: formatUZS(r.toppedUp) }),
        description: r.flushed > 0 ? t('wallet.flushed', { count: r.flushed }) : undefined,
      });
      reload();
    } catch (e) {
      toast({ variant: 'error', title: (e as Error).message });
    } finally {
      setBusy(null);
    }
  }

  if (!w) return <Centered><Loader2 className="animate-spin text-brand" /></Centered>;

  const low = w.leadsRunway <= 5;

  return (
    <div className="flex flex-col gap-6">
      {/* Balans + CPL */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-brand/20 bg-gradient-to-br from-brand/[0.06] to-transparent p-6 lg:col-span-2">
          <div className="flex items-center gap-2 text-sm text-muted"><Wallet className="h-4 w-4 text-brand" /> {t('wallet.balance')}</div>
          <div className="mt-2 font-display text-4xl font-bold text-heading" style={{ fontVariantNumeric: 'tabular-nums' }}>{formatUZS(w.balance)}</div>
          <div className={`mt-2 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${low ? 'bg-amber-100 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>
            {low && <AlertTriangle className="h-3.5 w-3.5" />} {t('wallet.runway', { count: w.leadsRunway })}
          </div>
          {w.blocked > 0 && (
            <div className="mt-3 flex items-center gap-1.5 text-sm text-amber-700"><Lock className="h-4 w-4" /> {t('wallet.blockedWaiting', { count: w.blocked })}</div>
          )}
        </div>
        <div className="rounded-2xl border border-line bg-surface p-6 shadow-card">
          <div className="text-sm text-muted">{t('wallet.cplPrice')}</div>
          <div className="mt-2 font-display text-2xl font-bold text-heading" style={{ fontVariantNumeric: 'tabular-nums' }}>{formatUZS(w.cplPrice)}</div>
          <div className="mt-4 border-t border-line pt-3 text-sm">
            <div className="flex justify-between"><span className="text-muted">{t('wallet.delivered')}</span><span className="font-semibold text-heading">{w.delivered.count}</span></div>
            <div className="mt-1 flex justify-between"><span className="text-muted">{t('wallet.spent')}</span><span className="font-semibold text-heading" style={{ fontVariantNumeric: 'tabular-nums' }}>{formatUZS(w.delivered.spent)}</span></div>
          </div>
        </div>
      </div>

      {/* To'ldirish */}
      <div className="rounded-2xl border border-line bg-surface p-6 shadow-card">
        <h3 className="text-sm font-semibold text-heading">{t('wallet.topUpTitle')}</h3>
        <p className="mt-1 text-xs text-muted">{t('wallet.topUpHint')}</p>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {TOPUP_PRESETS.map((amount) => (
            <button key={amount} onClick={() => topUp(amount)} disabled={busy != null}
              className="flex flex-col items-center gap-1 rounded-xl border border-line bg-bg px-4 py-4 text-sm font-bold text-heading transition hover:border-brand hover:bg-brand/5 disabled:opacity-50">
              {busy === amount ? <Loader2 className="h-5 w-5 animate-spin text-brand" /> : <Plus className="h-5 w-5 text-brand" />}
              <span style={{ fontVariantNumeric: 'tabular-nums' }}>{formatUZS(amount)}</span>
            </button>
          ))}
        </div>
        <p className="mt-3 text-[11px] text-muted">{t('wallet.demoNote')}</p>
      </div>

      {/* Harakatlar tarixi */}
      <div className="overflow-x-auto rounded-2xl border border-line bg-surface shadow-card">
        <div className="border-b border-line px-5 py-3 text-sm font-semibold text-heading">{t('wallet.history')}</div>
        {ledger === null ? (
          <Centered><Loader2 className="animate-spin text-brand" /></Centered>
        ) : ledger.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted">{t('wallet.historyEmpty')}</div>
        ) : (
          <table className="w-full min-w-[560px] text-sm">
            <tbody>
              {ledger.map((e) => {
                const credit = e.kind === 'CREDIT';
                return (
                  <tr key={e.id} className="border-b border-line/60 last:border-0">
                    <td className="px-5 py-3">
                      <span className={`inline-flex h-7 w-7 items-center justify-center rounded-full ${credit ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-500'}`}>
                        {credit ? <ArrowDownRight className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                      </span>
                    </td>
                    <td className="px-2 py-3 text-ink">{e.reason}</td>
                    <td className="px-4 py-3 text-right font-semibold" style={{ fontVariantNumeric: 'tabular-nums' }}>
                      <span className={credit ? 'text-emerald-600' : 'text-rose-500'}>{credit ? '+' : '−'}{formatUZS(e.amount)}</span>
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-muted" style={{ fontVariantNumeric: 'tabular-nums' }}>{e.balanceAfter != null ? formatUZS(e.balanceAfter) : '—'}</td>
                    <td className="px-5 py-3 text-right text-xs text-muted">{new Date(e.createdAt).toLocaleDateString('uz')}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
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

  return (
    <div className="flex flex-col gap-10">
      <InsuranceManager partnerId={partnerId} products={p.insurance} onChanged={reload} />
      <MortgageManager partnerId={partnerId} programs={p.mortgage} onChanged={reload} />
      <NasiyaManager partnerId={partnerId} providers={p.nasiya} onChanged={reload} />

      {/* Xizmat vendorlari — read-only (bu portalda emas, vendor kabinetida boshqariladi) */}
      {p.vendors.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-heading">{t('channel.vendor')}</h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {p.vendors.map((row) => (
              <div key={row.id} className="rounded-2xl border border-line bg-surface p-4 shadow-card">
                <div className="font-semibold text-heading">{row.name}</div>
                <div className="mt-0.5 text-xs text-muted">{row.meta}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Umumiy: mahsulot ro'yxati qatori (toggle + o'chirish) ───────────────────
function ProductRow({ name, meta, brand, active, onToggle, onDelete, t }: {
  name: string; meta: string; brand: string; active: boolean;
  onToggle: () => void; onDelete: () => void; t: (k: string) => string;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-surface p-4 shadow-card">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-heading">{name}</span>
          <span className="rounded-full bg-brand/10 px-2 py-0.5 text-xs font-semibold text-brand">{meta}</span>
        </div>
        <div className="mt-0.5 text-xs text-muted">{brand}</div>
      </div>
      <div className="flex items-center gap-2">
        <button onClick={onToggle} className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${active ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-line text-muted hover:bg-bg'}`}>
          {active ? t('products.active') : t('products.inactive')}
        </button>
        <button onClick={onDelete} className="grid h-8 w-8 place-items-center rounded-full border border-line text-rose-500 transition hover:bg-rose-50" title={t('common.delete')}>
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// ─── Sug'urta self-serve menejeri ────────────────────────────────────────────
const INS_TYPES: { value: string; }[] = [
  { value: 'OSAGO' }, { value: 'KASKO' }, { value: 'TRAVEL' }, { value: 'PROPERTY' }, { value: 'ACCIDENT' }, { value: 'HEALTH' },
];

function InsuranceManager({ partnerId, products, onChanged }: { partnerId: string; products: PartnerProducts['insurance']; onChanged: () => void }) {
  const t = useTranslations('biznes');
  const { toast } = useToast();
  const [insurers, setInsurers] = useState<PartnerInsurer[] | null>(null);
  const [showBrand, setShowBrand] = useState(false);
  const [showProduct, setShowProduct] = useState(false);
  const [brandName, setBrandName] = useState('');
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ insurerId: '', type: 'OSAGO', name: '', priceFrom: '', coverageFrom: '', basePremium: '' });
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const loadInsurers = useCallback(() => { api.partnerInsurers(partnerId).then(setInsurers).catch(() => setInsurers([])); }, [partnerId]);
  useEffect(() => { loadInsurers(); }, [loadInsurers]);

  async function createBrand() {
    if (brandName.trim().length < 2) return;
    setBusy(true);
    try { await api.partnerCreateInsurer(partnerId, { name: brandName.trim() }); toast({ variant: 'success', title: t('products.ins.brandCreated') }); setBrandName(''); setShowBrand(false); loadInsurers(); }
    catch (e) { toast({ variant: 'error', title: (e as Error).message }); } finally { setBusy(false); }
  }

  async function createProduct() {
    const insurerId = form.insurerId || insurers?.[0]?.id;
    if (!insurerId || form.name.trim().length < 2) { toast({ variant: 'error', title: t('products.mortgage.fillRequired') }); return; }
    setBusy(true);
    try {
      await api.partnerCreateInsProduct(partnerId, {
        insurerId, type: form.type as InsuranceType, name: form.name.trim(),
        priceFrom: form.priceFrom ? Number(form.priceFrom) : undefined,
        coverageFrom: form.coverageFrom ? Number(form.coverageFrom) : undefined,
        basePremium: form.basePremium ? Number(form.basePremium) : undefined,
      });
      toast({ variant: 'success', title: t('products.ins.productLive') });
      setShowProduct(false);
      setForm({ insurerId: '', type: 'OSAGO', name: '', priceFrom: '', coverageFrom: '', basePremium: '' });
      onChanged();
    } catch (e) { toast({ variant: 'error', title: (e as Error).message }); } finally { setBusy(false); }
  }

  const hasBrand = (insurers?.length ?? 0) > 0;

  return (
    <div>
      <ManagerHeader icon={ShieldCheck} title={t('products.ins.title')} live="/sugurta" liveLabel={t('products.mortgage.viewLive')}
        onAdd={hasBrand ? () => { setShowProduct((v) => !v); setShowBrand(false); } : undefined} addLabel={t('products.ins.addProduct')} t={t} />
      <p className="mt-1 text-xs text-muted">{t('products.ins.liveHint')}</p>

      {insurers === null ? <div className="mt-4"><Loader2 className="h-5 w-5 animate-spin text-brand" /></div> : !hasBrand ? (
        <BrandCreate label={t('products.ins.noBrand')} btn={t('products.ins.createBrand')} ph={t('products.ins.brandPh')} show={showBrand} setShow={setShowBrand} value={brandName} setValue={setBrandName} onCreate={createBrand} busy={busy} t={t} />
      ) : (
        <>
          {showProduct && (
            <div className="mt-4 rounded-2xl border border-line bg-surface p-5 shadow-card">
              <div className="grid gap-4 sm:grid-cols-2">
                {insurers.length > 1 && (
                  <div className="sm:col-span-2">
                    <label className="text-sm font-medium text-muted">{t('products.ins.brand')}</label>
                    <select value={form.insurerId || insurers[0].id} onChange={(e) => set('insurerId', e.target.value)} className="mt-1.5 w-full rounded-xl border border-line bg-bg px-3 py-2.5 text-sm text-heading">
                      {insurers.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-muted">{t('products.ins.type')}</label>
                  <select value={form.type} onChange={(e) => set('type', e.target.value)} className="mt-1.5 w-full rounded-xl border border-line bg-bg px-3 py-2.5 text-sm text-heading">
                    {INS_TYPES.map((o) => <option key={o.value} value={o.value}>{t(`insType.${o.value}`)}</option>)}
                  </select>
                </div>
                <NumField label={t('products.ins.name')} text value={form.name} onChange={(v) => set('name', v)} placeholder={t('products.ins.namePh')} />
                <NumField label={t('products.ins.priceFrom')} value={form.priceFrom} onChange={(v) => set('priceFrom', v)} placeholder="0" />
                <NumField label={t('products.ins.coverageFrom')} value={form.coverageFrom} onChange={(v) => set('coverageFrom', v)} placeholder="0" />
                <NumField label={t('products.ins.basePremium')} value={form.basePremium} onChange={(v) => set('basePremium', v)} placeholder={t('products.ins.optional')} />
              </div>
              <div className="mt-4 flex gap-2">
                <button onClick={createProduct} disabled={busy} className="inline-flex items-center gap-2 rounded-full bg-brand px-5 py-2.5 text-sm font-bold text-white transition hover:brightness-110 disabled:opacity-60">
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} {t('products.mortgage.publish')}
                </button>
                <button onClick={() => setShowProduct(false)} className="rounded-full border border-line px-5 py-2.5 text-sm font-semibold text-heading transition hover:bg-bg">{t('common.cancel')}</button>
              </div>
            </div>
          )}
          {products.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-dashed border-line py-10 text-center text-sm text-muted">{t('products.ins.noProduct')}</div>
          ) : (
            <div className="mt-4 flex flex-col gap-2">
              {products.map((row) => (
                <ProductRow key={row.id} name={row.name} meta={t(`insType.${row.meta}`)} brand={row.brand} active={row.active} t={t}
                  onToggle={async () => { try { await api.partnerUpdateInsProduct(partnerId, row.id, { active: !row.active }); onChanged(); } catch (e) { toast({ variant: 'error', title: (e as Error).message }); } }}
                  onDelete={async () => { if (!confirm(t('products.ins.deleteConfirm'))) return; try { await api.partnerDeleteInsProduct(partnerId, row.id); onChanged(); } catch (e) { toast({ variant: 'error', title: (e as Error).message }); } }} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Nasiya self-serve menejeri ──────────────────────────────────────────────
const NASIYA_MONTHS = [3, 6, 9, 12];

function NasiyaManager({ partnerId, providers, onChanged }: { partnerId: string; providers: PartnerProducts['nasiya']; onChanged: () => void }) {
  const t = useTranslations('biznes');
  const { toast } = useToast();
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState('');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [markup, setMarkup] = useState<Record<number, string>>({ 3: '0', 6: '9', 9: '', 12: '20' });

  async function create() {
    const terms: Record<string, number> = {};
    for (const m of NASIYA_MONTHS) { const v = markup[m]; if (v !== '' && v != null) terms[String(m)] = Number(v) / 100; }
    if (name.trim().length < 2 || Object.keys(terms).length === 0) { toast({ variant: 'error', title: t('products.nasiya.fillRequired') }); return; }
    setBusy(true);
    try {
      await api.partnerCreateProvider(partnerId, { name: name.trim(), terms, minAmount: minAmount ? Number(minAmount) : undefined, maxAmount: maxAmount ? Number(maxAmount) : undefined });
      toast({ variant: 'success', title: t('products.nasiya.live') });
      setShow(false); setName(''); setMinAmount(''); setMaxAmount(''); setMarkup({ 3: '0', 6: '9', 9: '', 12: '20' });
      onChanged();
    } catch (e) { toast({ variant: 'error', title: (e as Error).message }); } finally { setBusy(false); }
  }

  return (
    <div>
      <ManagerHeader icon={ShoppingBag} title={t('products.nasiya.title')} live="/nasiya" liveLabel={t('products.mortgage.viewLive')}
        onAdd={() => setShow((v) => !v)} addLabel={t('products.nasiya.add')} t={t} />
      <p className="mt-1 text-xs text-muted">{t('products.nasiya.liveHint')}</p>

      {show && (
        <div className="mt-4 rounded-2xl border border-line bg-surface p-5 shadow-card">
          <div className="grid gap-4 sm:grid-cols-2">
            <NumField label={t('products.nasiya.name')} text value={name} onChange={setName} placeholder={t('products.nasiya.namePh')} full />
            <NumField label={t('products.nasiya.minAmount')} value={minAmount} onChange={setMinAmount} placeholder="0" />
            <NumField label={t('products.nasiya.maxAmount')} value={maxAmount} onChange={setMaxAmount} placeholder="0" />
          </div>
          <div className="mt-4">
            <label className="text-sm font-medium text-muted">{t('products.nasiya.terms')}</label>
            <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {NASIYA_MONTHS.map((m) => (
                <div key={m}>
                  <div className="text-xs text-muted">{m} {t('plans.month')}</div>
                  <div className="mt-1 flex items-center gap-1">
                    <input type="number" value={markup[m]} onChange={(e) => setMarkup((x) => ({ ...x, [m]: e.target.value }))}
                      className="w-full rounded-xl border border-line bg-bg px-3 py-2 text-sm text-heading outline-none focus:border-brand" placeholder="—" />
                    <span className="text-sm text-muted">%</span>
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-1.5 text-xs text-muted/80">{t('products.nasiya.termsHint')}</p>
          </div>
          <div className="mt-4 flex gap-2">
            <button onClick={create} disabled={busy} className="inline-flex items-center gap-2 rounded-full bg-brand px-5 py-2.5 text-sm font-bold text-white transition hover:brightness-110 disabled:opacity-60">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} {t('products.mortgage.publish')}
            </button>
            <button onClick={() => setShow(false)} className="rounded-full border border-line px-5 py-2.5 text-sm font-semibold text-heading transition hover:bg-bg">{t('common.cancel')}</button>
          </div>
        </div>
      )}

      {providers.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-dashed border-line py-10 text-center text-sm text-muted">{t('products.nasiya.empty')}</div>
      ) : (
        <div className="mt-4 flex flex-col gap-2">
          {providers.map((row) => (
            <ProductRow key={row.id} name={row.name} meta={row.meta} brand={row.brand} active={row.active} t={t}
              onToggle={async () => { try { await api.partnerUpdateProvider(partnerId, row.id, { active: !row.active }); onChanged(); } catch (e) { toast({ variant: 'error', title: (e as Error).message }); } }}
              onDelete={async () => { if (!confirm(t('products.nasiya.deleteConfirm'))) return; try { await api.partnerDeleteProvider(partnerId, row.id); onChanged(); } catch (e) { toast({ variant: 'error', title: (e as Error).message }); } }} />
          ))}
        </div>
      )}
    </div>
  );
}

// Umumiy menejer sarlavhasi + "jonli ko'rish" + "qo'shish"
function ManagerHeader({ icon: Icon, title, live, liveLabel, onAdd, addLabel, t }: {
  icon: typeof ShieldCheck; title: string; live: string; liveLabel: string; onAdd?: () => void; addLabel: string; t: (k: string) => string;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <Icon className="h-5 w-5 text-brand" />
        <h3 className="font-display text-lg font-bold text-heading">{title}</h3>
      </div>
      <div className="flex gap-2">
        <Link href={live} target="_blank" className="inline-flex items-center gap-1.5 rounded-full border border-line px-3.5 py-2 text-xs font-semibold text-heading transition hover:bg-bg">
          <ExternalLink className="h-3.5 w-3.5" /> {liveLabel}
        </Link>
        {onAdd && (
          <button onClick={onAdd} className="inline-flex items-center gap-1.5 rounded-full bg-brand px-3.5 py-2 text-xs font-bold text-white transition hover:brightness-110">
            <Plus className="h-3.5 w-3.5" /> {addLabel}
          </button>
        )}
      </div>
    </div>
  );
}

// Umumiy brend yaratish bloki (insurer/bank)
function BrandCreate({ label, btn, ph, show, setShow, value, setValue, onCreate, busy, t }: {
  label: string; btn: string; ph: string; show: boolean; setShow: (v: boolean) => void; value: string; setValue: (v: string) => void; onCreate: () => void; busy: boolean; t: (k: string) => string;
}) {
  return (
    <div className="mt-4 rounded-2xl border border-dashed border-line p-6 text-center">
      <p className="text-sm text-muted">{label}</p>
      {!show ? (
        <button onClick={() => setShow(true)} className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-brand px-4 py-2.5 text-sm font-bold text-white transition hover:brightness-110">
          <Plus className="h-4 w-4" /> {btn}
        </button>
      ) : (
        <div className="mx-auto mt-3 flex max-w-sm gap-2">
          <input value={value} onChange={(e) => setValue(e.target.value)} placeholder={ph} className="flex-1 rounded-xl border border-line bg-bg px-3 py-2.5 text-sm text-heading outline-none focus:border-brand" />
          <button onClick={onCreate} disabled={busy} className="rounded-xl bg-brand px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : t('common.add')}
          </button>
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
