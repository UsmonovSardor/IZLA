'use client';
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'next-view-transitions';
import { useTranslations } from 'next-intl';
import { Check, Loader2, LogOut, Monitor, Shield, UserCircle2, Coins, CalendarCheck, Star, Gift } from 'lucide-react';
import { useAuth } from '@/components/auth-provider';
import {
  type Session,
  fetchSessions,
  revokeSession,
  updateProfile,
} from '@/lib/auth';
import { api, type CoinsSummary } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { LevelCard } from '@/components/level-card';

const LOCALES = [
  { value: 'uz', label: "O'zbekcha" },
  { value: 'ru', label: 'Русский' },
  { value: 'en', label: 'English' },
];

function device(ua: string | null, unknown: string): string {
  if (!ua) return unknown;
  const os = /Windows/.test(ua) ? 'Windows' : /Android/.test(ua) ? 'Android' : /iPhone|iPad|iOS/.test(ua) ? 'iOS' : /Mac/.test(ua) ? 'macOS' : /Linux/.test(ua) ? 'Linux' : '';
  const br = /Edg/.test(ua) ? 'Edge' : /Chrome/.test(ua) ? 'Chrome' : /Firefox/.test(ua) ? 'Firefox' : /Safari/.test(ua) ? 'Safari' : 'Browser';
  return [br, os].filter(Boolean).join(' · ') || unknown;
}

export default function ProfilPage() {
  const { user, loading, applyUser, signOut, openLogin } = useAuth();
  const t = useTranslations('profile');
  const tc = useTranslations('common');
  const tr = useTranslations('roles');
  const [name, setName] = useState('');
  const [locale, setLocale] = useState('uz');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [sessions, setSessions] = useState<Session[] | null>(null);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [coins, setCoins] = useState<CoinsSummary | null>(null);

  function timeAgo(iso: string): string {
    const d = new Date(iso).getTime();
    const m = Math.round((Date.now() - d) / 60000);
    if (m < 1) return t('now');
    if (m < 60) return t('minAgo', { count: m });
    const h = Math.round(m / 60);
    if (h < 24) return t('hourAgo', { count: h });
    return t('dayAgo', { count: Math.round(h / 24) });
  }

  useEffect(() => {
    if (user) {
      setName(user.name ?? '');
      setLocale(user.locale ?? 'uz');
    }
  }, [user]);

  const loadSessions = useCallback(async () => {
    try {
      setSessions(await fetchSessions());
    } catch {
      setSessions([]);
    }
  }, []);

  useEffect(() => {
    if (user) void loadSessions();
  }, [user, loadSessions]);

  useEffect(() => {
    if (user) api.coins().then(setCoins).catch(() => {});
  }, [user]);

  async function save() {
    setSaving(true);
    setSaved(false);
    try {
      const u = await updateProfile({ name: name.trim() || undefined, locale });
      applyUser(u);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  async function revoke(id: string) {
    setRevoking(id);
    try {
      await revokeSession(id);
      await loadSessions();
    } finally {
      setRevoking(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-20 text-muted">
        <Loader2 className="h-5 w-5 animate-spin" /> {tc('loading')}
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <UserCircle2 className="mx-auto h-12 w-12 text-brand" />
        <h1 className="mt-3 font-display text-xl font-bold text-navy">{t('title')}</h1>
        <p className="mt-2 text-muted">{t('needLogin')}</p>
        <Button className="mt-4" onClick={() => openLogin({ next: '/profil' })}>{tc('login')}</Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Profil sarlavha */}
      <div className="flex items-center gap-4 rounded-2xl border border-line bg-surface p-5 shadow-card">
        {user.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={user.avatarUrl} alt="" className="h-16 w-16 rounded-full object-cover" />
        ) : (
          <span className="grid h-16 w-16 place-items-center rounded-full bg-brand-gradient text-2xl font-bold text-white">
            {(user.name ?? 'U').slice(0, 1).toUpperCase()}
          </span>
        )}
        <div className="min-w-0">
          <h1 className="truncate font-display text-xl font-bold text-navy">{user.name ?? t('anonUser')}</h1>
          <p className="truncate text-sm text-muted">{user.email ?? user.phone ?? '—'}</p>
          <div className="mt-1.5 flex items-center gap-2">
            <span className="rounded-full bg-brand/10 px-2 py-0.5 text-[11px] font-medium text-brand">
              {tr.has(user.role) ? tr(user.role) : user.role}
            </span>
            <span className="text-[11px] text-muted">🪙 {t('coins', { count: user.coins })}</span>
          </div>
        </div>
      </div>

      {/* Sadoqat darajasi */}
      <LevelCard coins={coins ? coins.balance : user.coins} />

      {/* Sadoqat tangalari */}
      <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-card">
        <div className="flex items-center justify-between gap-4 bg-gradient-to-r from-amber-400 to-orange-500 p-5 text-white">
          <div>
            <div className="flex items-center gap-1.5 text-sm font-medium opacity-90"><Coins className="h-4 w-4" /> {t('coinsCard.title')}</div>
            <div className="mt-1 font-display text-3xl font-extrabold tabular-nums">{coins ? coins.balance : user.coins}</div>
          </div>
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-surface/20"><Gift className="h-7 w-7" /></div>
        </div>
        <div className="p-5">
          <p className="text-xs text-muted">{t('coinsCard.sub')}</p>
          {coins && coins.ledger.length > 0 ? (
            <ul className="mt-3 divide-y divide-line">
              {coins.ledger.slice(0, 6).map((l) => {
                const Icon = l.reason === 'booking' ? CalendarCheck : l.reason === 'review' ? Star : Gift;
                const label = ['booking', 'review', 'welcome', 'referral', 'referral_join'].includes(l.reason) ? t(`coinsReasons.${l.reason}`) : t('coinsReasons.default');
                return (
                  <li key={l.id} className="flex items-center justify-between gap-3 py-2.5">
                    <span className="flex items-center gap-2 text-sm text-ink">
                      <span className="grid h-8 w-8 place-items-center rounded-lg bg-amber-50 text-amber-500"><Icon className="h-4 w-4" /></span>
                      {label}
                    </span>
                    <span className={`text-sm font-semibold tabular-nums ${l.delta >= 0 ? 'text-success' : 'text-danger'}`}>
                      {l.delta >= 0 ? '+' : ''}{l.delta}
                    </span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-muted">{t('coinsCard.empty')}</p>
          )}
          <Link href="/taklif" className="mt-4 flex items-center justify-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-700 transition hover:bg-amber-100">
            <Gift className="h-4 w-4" /> {t('coinsCard.invite')}
          </Link>
        </div>
      </div>

      {/* Tahrirlash */}
      <div className="rounded-2xl border border-line bg-surface p-5 shadow-card">
        <h2 className="mb-3 font-display font-bold text-navy">{t('info')}</h2>
        <div className="space-y-3">
          <label className="block">
            <span className="text-xs font-medium text-muted">{t('name')}</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('namePlaceholder')}
              className="mt-1 w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-brand"
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-muted">{t('language')}</span>
            <select
              value={locale}
              onChange={(e) => setLocale(e.target.value)}
              className="mt-1 w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm outline-none focus:border-brand"
            >
              {LOCALES.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
            </select>
          </label>
          <Button onClick={save} disabled={saving} className="w-full sm:w-auto">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <><Check className="h-4 w-4" /> {t('saved')}</> : t('save')}
          </Button>
        </div>
      </div>

      {/* Sessiyalar */}
      <div className="rounded-2xl border border-line bg-surface p-5 shadow-card">
        <h2 className="mb-1 flex items-center gap-2 font-display font-bold text-navy">
          <Shield className="h-4 w-4 text-brand" /> {t('sessions')}
        </h2>
        <p className="mb-3 text-xs text-muted">{t('sessionsSub')}</p>
        {!sessions ? (
          <div className="flex items-center gap-2 py-4 text-sm text-muted"><Loader2 className="h-4 w-4 animate-spin" /> {tc('loading')}</div>
        ) : (
          <ul className="divide-y divide-line">
            {sessions.map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-3 py-3">
                <div className="flex items-center gap-3 min-w-0">
                  <Monitor className="h-5 w-5 shrink-0 text-muted" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink">
                      {device(s.userAgent, t('unknownDevice'))}
                      {s.current && <span className="ml-2 rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-medium text-success">{t('current')}</span>}
                    </p>
                    <p className="text-xs text-muted">{s.ip ?? '—'} · {timeAgo(s.lastUsedAt)}</p>
                  </div>
                </div>
                {!s.current && (
                  <button
                    onClick={() => revoke(s.id)}
                    disabled={revoking === s.id}
                    className="shrink-0 text-sm text-danger hover:underline disabled:opacity-50"
                  >
                    {revoking === s.id ? '…' : t('revoke')}
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex items-center justify-between">
        <Link href="/bron" className="text-sm text-brand hover:underline">{t('myBookings')}</Link>
        <button onClick={() => void signOut()} className="flex items-center gap-1.5 text-sm text-danger hover:underline">
          <LogOut className="h-4 w-4" /> {t('logout')}
        </button>
      </div>
    </div>
  );
}
