'use client';

import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import {
  Briefcase, CalendarClock, Check, Loader2, Plus, Star, Trash2, Wallet,
} from 'lucide-react';
import { useAuth } from '@/components/auth-provider';
import { api, type KabinetVendor, type KabinetVendorDetail, type KabinetStats, type KabinetBooking, type PlanConfig, type VendorEarnings, type VendorPlanId } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { PlanCards } from '@/components/plans/plan-cards';
import { useToast } from '@/components/toast';
import { formatUZS } from '@/lib/utils';

type Tab = 'profile' | 'services' | 'bookings' | 'plan';
const STATUS_STYLE: Record<string, string> = {
  PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
  CONFIRMED: 'bg-blue-50 text-brand border-blue-200',
  COMPLETED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  CANCELLED: 'bg-rose-50 text-rose-600 border-rose-200',
  NO_SHOW: 'bg-slate-100 text-slate-500 border-slate-200',
};

export default function KabinetPage() {
  const { user, loading, openLogin } = useAuth();
  const t = useTranslations('kabinet');
  const locale = useLocale();

  const [vendors, setVendors] = useState<KabinetVendor[] | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('profile');

  useEffect(() => {
    if (!user) return;
    api.kabinetVendors().then((v) => {
      setVendors(v);
      if (v.length) setActiveId(v[0].id);
    }).catch(() => setVendors([]));
  }, [user]);

  if (loading) {
    return <div className="py-24 text-center"><Loader2 className="mx-auto animate-spin text-brand" /></div>;
  }
  if (!user) {
    return (
      <div className="py-24 text-center">
        <Briefcase className="mx-auto text-slate-300" size={44} />
        <h1 className="font-display text-2xl font-bold text-navy mt-4">{t('title')}</h1>
        <p className="text-muted mt-2">{t('loginNeeded')}</p>
        <Button onClick={() => openLogin()} className="mt-5">{t('login')}</Button>
      </div>
    );
  }
  if (vendors === null) {
    return <div className="py-24 text-center"><Loader2 className="mx-auto animate-spin text-brand" /></div>;
  }
  if (vendors.length === 0) {
    return (
      <div className="py-24 text-center">
        <Briefcase className="mx-auto text-slate-300" size={44} />
        <h1 className="font-display text-2xl font-bold text-navy mt-4">{t('noVendor')}</h1>
        <p className="text-muted mt-2 max-w-sm mx-auto">{t('noVendorHint')}</p>
      </div>
    );
  }

  return (
    <div className="py-8 md:py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-navy">{t('title')}</h1>
          <p className="text-muted mt-1">{t('subtitle')}</p>
        </div>
        {vendors.length > 1 && (
          <select
            value={activeId ?? ''}
            onChange={(e) => setActiveId(e.target.value)}
            className="rounded-xl border border-slate-200 bg-surface px-3 py-2 text-sm"
          >
            {vendors.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
          </select>
        )}
      </div>

      {activeId && <VendorDashboard key={activeId} vendorId={activeId} tab={tab} setTab={setTab} locale={locale} />}
    </div>
  );
}

function VendorDashboard({ vendorId, tab, setTab, locale }: { vendorId: string; tab: Tab; setTab: (t: Tab) => void; locale: string }) {
  const t = useTranslations('kabinet');
  const [detail, setDetail] = useState<KabinetVendorDetail | null>(null);
  const [stats, setStats] = useState<KabinetStats | null>(null);

  const reload = useCallback(() => {
    api.kabinetVendor(vendorId).then(setDetail).catch(() => {});
    api.kabinetStats(vendorId).then(setStats).catch(() => {});
  }, [vendorId]);

  useEffect(() => { reload(); }, [reload]);

  const nf = new Intl.NumberFormat(locale === 'en' ? 'en-US' : 'ru-RU');

  return (
    <>
      {/* Statistika */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={<CalendarClock size={18} />} label={t('stats.totalBookings')} value={stats ? String(stats.totalBookings) : '—'} />
        <StatCard icon={<Check size={18} />} label={t('stats.confirmed')} value={stats ? String(stats.bookingsByStatus.CONFIRMED ?? 0) : '—'} />
        <StatCard icon={<Star size={18} />} label={t('stats.rating')} value={stats ? stats.rating.toFixed(1) : '—'} />
        <StatCard icon={<Wallet size={18} />} label={t('stats.revenue')} value={stats ? `${nf.format(Number(stats.revenue))} ${t('sum')}` : '—'} />
      </div>

      {/* Tablar */}
      <div className="mt-8 flex gap-1 border-b border-slate-200">
        {(['profile', 'services', 'bookings', 'plan'] as Tab[]).map((tb) => (
          <button
            key={tb}
            onClick={() => setTab(tb)}
            className={`relative px-4 py-2.5 text-sm font-medium transition ${tab === tb ? 'text-brand' : 'text-muted hover:text-navy'}`}
          >
            {t(`tabs.${tb}`)}
            {tab === tb && <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-brand" />}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === 'profile' && detail && <ProfileForm detail={detail} onSaved={reload} />}
        {tab === 'services' && detail && <ServicesTab detail={detail} onChange={reload} />}
        {tab === 'bookings' && <BookingsTab vendorId={vendorId} locale={locale} />}
        {tab === 'plan' && <PlanTab vendorId={vendorId} />}
      </div>
    </>
  );
}

function StatCard({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-surface p-4">
      <div className="flex items-center gap-2 text-slate-400">{icon}<span className="text-xs text-muted">{label}</span></div>
      <div className="font-display text-xl font-bold text-navy mt-1 tabular-nums">{value}</div>
    </div>
  );
}

function ProfileForm({ detail, onSaved }: { detail: KabinetVendorDetail; onSaved: () => void }) {
  const t = useTranslations('kabinet');
  const [f, setF] = useState({
    name: detail.name ?? '', description: detail.description ?? '', phone: detail.phone ?? '',
    address: detail.address ?? '', district: detail.district ?? '',
  });
  const hours0 = detail.hours ?? {};
  const [hours, setHours] = useState<Record<string, string>>({
    mon_fri: hours0.mon_fri ?? '', sat: hours0.sat ?? '', sun: hours0.sun ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const save = async () => {
    setSaving(true); setSaved(false);
    try {
      await api.kabinetUpdateVendor(detail.id, { ...f, hours });
      setSaved(true); onSaved();
      setTimeout(() => setSaved(false), 2000);
    } finally { setSaving(false); }
  };

  const field = 'w-full rounded-xl border border-slate-200 bg-surface px-3.5 py-2.5 text-sm focus:border-brand focus:outline-none';
  const days: [string, string][] = [['mon_fri', t('profile.monFri')], ['sat', t('profile.sat')], ['sun', t('profile.sun')]];

  return (
    <div className="max-w-2xl space-y-4">
      <div><label className="text-sm text-muted">{t('profile.name')}</label>
        <input className={field} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
      <div><label className="text-sm text-muted">{t('profile.description')}</label>
        <textarea rows={3} className={field} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></div>
      <div className="grid sm:grid-cols-2 gap-4">
        <div><label className="text-sm text-muted">{t('profile.phone')}</label>
          <input className={field} value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></div>
        <div><label className="text-sm text-muted">{t('profile.district')}</label>
          <input className={field} value={f.district} onChange={(e) => setF({ ...f, district: e.target.value })} /></div>
      </div>
      <div><label className="text-sm text-muted">{t('profile.address')}</label>
        <input className={field} value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} /></div>
      <div>
        <label className="text-sm text-muted">{t('profile.hours')}</label>
        <div className="grid sm:grid-cols-3 gap-3 mt-1">
          {days.map(([k, lbl]) => (
            <div key={k}>
              <span className="text-xs text-slate-400">{lbl}</span>
              <input className={field} placeholder="09:00-18:00" value={hours[k]} onChange={(e) => setHours({ ...hours, [k]: e.target.value })} />
            </div>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-3 pt-2">
        <Button onClick={save} disabled={saving}>
          {saving ? <Loader2 size={16} className="animate-spin" /> : saved ? <Check size={16} /> : null}
          {saved ? t('profile.saved') : t('profile.save')}
        </Button>
      </div>
    </div>
  );
}

function ServicesTab({ detail, onChange }: { detail: KabinetVendorDetail; onChange: () => void }) {
  const t = useTranslations('kabinet');
  const [services, setServices] = useState(detail.services);
  const [adding, setAdding] = useState({ name: '', price: '', durationMin: '30' });
  const [busy, setBusy] = useState(false);

  useEffect(() => setServices(detail.services), [detail.services]);

  const add = async () => {
    if (!adding.name || !adding.price) return;
    setBusy(true);
    try {
      await api.kabinetCreateService(detail.id, { name: adding.name, price: Number(adding.price), durationMin: Number(adding.durationMin) || 30 });
      setAdding({ name: '', price: '', durationMin: '30' });
      onChange();
    } finally { setBusy(false); }
  };
  const toggle = async (id: string, active: boolean) => { await api.kabinetUpdateService(id, { active: !active }); onChange(); };
  const remove = async (id: string) => { await api.kabinetDeleteService(id); onChange(); };

  const field = 'rounded-xl border border-slate-200 bg-surface px-3 py-2 text-sm focus:border-brand focus:outline-none';

  return (
    <div className="max-w-2xl">
      {/* Qo'shish */}
      <div className="rounded-2xl border border-slate-200 bg-surface p-4 flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[140px]"><span className="text-xs text-slate-400">{t('services.name')}</span>
          <input className={`${field} w-full mt-1`} value={adding.name} onChange={(e) => setAdding({ ...adding, name: e.target.value })} /></div>
        <div className="w-28"><span className="text-xs text-slate-400">{t('services.price')}</span>
          <input type="number" className={`${field} w-full mt-1`} value={adding.price} onChange={(e) => setAdding({ ...adding, price: e.target.value })} /></div>
        <div className="w-24"><span className="text-xs text-slate-400">{t('services.duration')}</span>
          <input type="number" className={`${field} w-full mt-1`} value={adding.durationMin} onChange={(e) => setAdding({ ...adding, durationMin: e.target.value })} /></div>
        <Button onClick={add} disabled={busy}><Plus size={16} />{t('services.add')}</Button>
      </div>

      {/* Ro'yxat */}
      <div className="mt-4 space-y-2">
        {services.length === 0 && <p className="text-muted text-sm py-6 text-center">{t('services.empty')}</p>}
        {services.map((s) => (
          <div key={s.id} className={`flex items-center gap-3 rounded-xl border p-3 ${s.active ? 'border-slate-200 bg-surface' : 'border-slate-100 bg-slate-50 opacity-70'}`}>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-navy text-sm truncate">{s.name}</div>
              <div className="text-xs text-muted">{Number(s.price).toLocaleString('ru-RU')} {t('sum')} · {s.durationMin} {t('services.duration').replace(/\s*\(.*\)/, '')}</div>
            </div>
            <button onClick={() => toggle(s.id, s.active)} className={`text-xs rounded-lg px-2.5 py-1.5 border ${s.active ? 'border-emerald-200 text-emerald-700 bg-emerald-50' : 'border-slate-200 text-slate-500'}`}>
              {s.active ? t('services.active') : t('services.inactive')}
            </button>
            <button onClick={() => remove(s.id)} className="text-slate-400 hover:text-rose-500 p-1.5" aria-label={t('services.delete')}><Trash2 size={16} /></button>
          </div>
        ))}
      </div>
    </div>
  );
}

function BookingsTab({ vendorId, locale }: { vendorId: string; locale: string }) {
  const t = useTranslations('kabinet');
  const [items, setItems] = useState<KabinetBooking[] | null>(null);

  const reload = useCallback(() => { api.kabinetBookings(vendorId).then(setItems).catch(() => setItems([])); }, [vendorId]);
  useEffect(() => { reload(); }, [reload]);

  const setStatus = async (id: string, status: string) => { await api.kabinetUpdateBooking(id, status); reload(); };
  const dtf = new Intl.DateTimeFormat(locale === 'en' ? 'en-US' : 'ru-RU', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Tashkent', hour12: false });

  if (items === null) return <Loader2 className="mx-auto my-8 animate-spin text-brand" />;
  if (items.length === 0) return <p className="text-muted text-sm py-10 text-center">{t('bookings.empty')}</p>;

  return (
    <div className="space-y-2 max-w-3xl">
      {items.map((b) => (
        <div key={b.id} className="rounded-xl border border-slate-200 bg-surface p-3.5 flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[160px]">
            <div className="font-medium text-navy text-sm">{b.service?.name ?? t('bookings.noService')}</div>
            <div className="text-xs text-muted mt-0.5">
              {dtf.format(new Date(b.slotStart))} · {b.user?.name || b.user?.phone || t('bookings.customer')}
            </div>
          </div>
          <span className={`text-xs rounded-full border px-2.5 py-1 ${STATUS_STYLE[b.status] ?? ''}`}>{t(`status.${b.status}`)}</span>
          <div className="flex gap-1">
            {b.status === 'PENDING' && (
              <button onClick={() => setStatus(b.id, 'CONFIRMED')} className="text-xs rounded-lg bg-brand text-white px-2.5 py-1.5">{t('bookings.confirm')}</button>
            )}
            {(b.status === 'PENDING' || b.status === 'CONFIRMED') && (
              <button onClick={() => setStatus(b.id, 'CANCELLED')} className="text-xs rounded-lg border border-slate-200 text-muted px-2.5 py-1.5">{t('bookings.cancel')}</button>
            )}
            {b.status === 'CONFIRMED' && (
              <button onClick={() => setStatus(b.id, 'COMPLETED')} className="text-xs rounded-lg border border-emerald-200 text-emerald-700 px-2.5 py-1.5">{t('bookings.complete')}</button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function PlanTab({ vendorId }: { vendorId: string }) {
  const t = useTranslations('kabinet');
  const { toast, dismiss } = useToast();
  const [plans, setPlans] = useState<PlanConfig[] | null>(null);
  const [earnings, setEarnings] = useState<VendorEarnings | null>(null);
  const [busy, setBusy] = useState<VendorPlanId | null>(null);

  const load = useCallback(() => {
    api.plans().then(setPlans).catch(() => setPlans([]));
    api.kabinetEarnings(vendorId).then(setEarnings).catch(() => {});
  }, [vendorId]);
  useEffect(load, [load]);

  const select = async (plan: VendorPlanId) => {
    setBusy(plan);
    const id = toast({ variant: 'loading', title: t('plans.activating') });
    try {
      await api.kabinetSelectPlan(vendorId, plan);
      dismiss(id);
      toast({ variant: 'success', title: t('plans.activated') });
      load();
    } catch (e) {
      dismiss(id);
      toast({ variant: 'error', title: (e as Error).message || 'Xatolik' });
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Daromad paneli — take-rate shaffofligi */}
      <div>
        <h3 className="font-display text-lg font-bold text-navy">{t('plans.earningsTitle')}</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-4">
          <EarnCard label={t('plans.revenue')} value={earnings ? formatUZS(earnings.revenue) : '—'} />
          <EarnCard label={t('plans.commission')} value={earnings ? `− ${formatUZS(earnings.commission)}` : '—'} accent="#B45309" />
          <EarnCard label={t('plans.net')} value={earnings ? formatUZS(earnings.net) : '—'} accent="#059669" strong />
          <EarnCard label={t('plans.paidCount')} value={earnings ? String(earnings.paidCount) : '—'} />
        </div>
      </div>

      {/* Tariflar */}
      <div>
        <h3 className="font-display text-lg font-bold text-navy">{t('plans.pickPlan')}</h3>
        <div className="mt-3">
          {plans && <PlanCards plans={plans} currentPlan={earnings?.plan} onSelect={select} busyPlan={busy} />}
        </div>
      </div>
    </div>
  );
}

function EarnCard({ label, value, accent, strong }: { label: string; value: string; accent?: string; strong?: boolean }) {
  return (
    <div className="rounded-2xl border border-line bg-surface px-4 py-3 shadow-card">
      <div className="text-xs text-muted">{label}</div>
      <div className={`mt-0.5 font-display ${strong ? 'text-xl' : 'text-lg'} font-bold tabular-nums`} style={{ color: accent ?? 'var(--c-heading)' }}>{value}</div>
    </div>
  );
}
