'use client';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Check, Loader2, LogOut, Monitor, Shield, UserCircle2 } from 'lucide-react';
import { useAuth } from '@/components/auth-provider';
import {
  type Session,
  fetchSessions,
  revokeSession,
  updateProfile,
} from '@/lib/auth';
import { Button } from '@/components/ui/button';

const LOCALES = [
  { value: 'uz', label: 'O‘zbekcha' },
  { value: 'ru', label: 'Русский' },
  { value: 'en', label: 'English' },
];
const ROLE_LABEL: Record<string, string> = {
  USER: 'Foydalanuvchi', VENDOR: 'Vendor', MODERATOR: 'Moderator',
  ADMIN: 'Administrator', DEVELOPER: 'Quruvchi', REALTOR: 'Rieltor', SELLER: 'Sotuvchi',
};

function device(ua: string | null): string {
  if (!ua) return 'Noma’lum qurilma';
  const os = /Windows/.test(ua) ? 'Windows' : /Android/.test(ua) ? 'Android' : /iPhone|iPad|iOS/.test(ua) ? 'iOS' : /Mac/.test(ua) ? 'macOS' : /Linux/.test(ua) ? 'Linux' : '';
  const br = /Edg/.test(ua) ? 'Edge' : /Chrome/.test(ua) ? 'Chrome' : /Firefox/.test(ua) ? 'Firefox' : /Safari/.test(ua) ? 'Safari' : 'Brauzer';
  return [br, os].filter(Boolean).join(' · ') || 'Qurilma';
}
function timeAgo(iso: string): string {
  const d = new Date(iso).getTime();
  const m = Math.round((Date.now() - d) / 60000);
  if (m < 1) return 'hozir';
  if (m < 60) return `${m} daqiqa oldin`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} soat oldin`;
  return `${Math.round(h / 24)} kun oldin`;
}

export default function ProfilPage() {
  const { user, loading, applyUser, signOut, openLogin } = useAuth();
  const [name, setName] = useState('');
  const [locale, setLocale] = useState('uz');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [sessions, setSessions] = useState<Session[] | null>(null);
  const [revoking, setRevoking] = useState<string | null>(null);

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
      <div className="flex items-center justify-center gap-2 py-20 text-slate2">
        <Loader2 className="h-5 w-5 animate-spin" /> Yuklanmoqda…
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <UserCircle2 className="mx-auto h-12 w-12 text-brand" />
        <h1 className="mt-3 font-display text-xl font-bold text-navy">Profil</h1>
        <p className="mt-2 text-slate2">Profilingizni ko‘rish uchun tizimga kiring.</p>
        <Button className="mt-4" onClick={() => openLogin({ next: '/profil' })}>Kirish</Button>
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
          <h1 className="truncate font-display text-xl font-bold text-navy">{user.name ?? 'Foydalanuvchi'}</h1>
          <p className="truncate text-sm text-slate2">{user.email ?? user.phone ?? '—'}</p>
          <div className="mt-1.5 flex items-center gap-2">
            <span className="rounded-full bg-brand/10 px-2 py-0.5 text-[11px] font-medium text-brand">
              {ROLE_LABEL[user.role] ?? user.role}
            </span>
            <span className="text-[11px] text-slate2">🪙 {user.coins} coin</span>
          </div>
        </div>
      </div>

      {/* Tahrirlash */}
      <div className="rounded-2xl border border-line bg-surface p-5 shadow-card">
        <h2 className="mb-3 font-display font-bold text-navy">Ma’lumotlar</h2>
        <div className="space-y-3">
          <label className="block">
            <span className="text-xs font-medium text-slate2">Ism</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ismingiz"
              className="mt-1 w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-brand"
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-slate2">Til</span>
            <select
              value={locale}
              onChange={(e) => setLocale(e.target.value)}
              className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm outline-none focus:border-brand"
            >
              {LOCALES.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
            </select>
          </label>
          <Button onClick={save} disabled={saving} className="w-full sm:w-auto">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <><Check className="h-4 w-4" /> Saqlandi</> : 'Saqlash'}
          </Button>
        </div>
      </div>

      {/* Sessiyalar */}
      <div className="rounded-2xl border border-line bg-surface p-5 shadow-card">
        <h2 className="mb-1 flex items-center gap-2 font-display font-bold text-navy">
          <Shield className="h-4 w-4 text-brand" /> Faol sessiyalar
        </h2>
        <p className="mb-3 text-xs text-slate2">Hisobingizga kirgan qurilmalar. Notanishlarini chiqarib yuboring.</p>
        {!sessions ? (
          <div className="flex items-center gap-2 py-4 text-sm text-slate2"><Loader2 className="h-4 w-4 animate-spin" /> Yuklanmoqda…</div>
        ) : (
          <ul className="divide-y divide-line">
            {sessions.map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-3 py-3">
                <div className="flex items-center gap-3 min-w-0">
                  <Monitor className="h-5 w-5 shrink-0 text-slate2" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink">
                      {device(s.userAgent)}
                      {s.current && <span className="ml-2 rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-medium text-success">Joriy</span>}
                    </p>
                    <p className="text-xs text-slate2">{s.ip ?? '—'} · {timeAgo(s.lastUsedAt)}</p>
                  </div>
                </div>
                {!s.current && (
                  <button
                    onClick={() => revoke(s.id)}
                    disabled={revoking === s.id}
                    className="shrink-0 text-sm text-danger hover:underline disabled:opacity-50"
                  >
                    {revoking === s.id ? '…' : 'Chiqarish'}
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex items-center justify-between">
        <Link href="/bron" className="text-sm text-brand hover:underline">Mening bronlarim →</Link>
        <button onClick={() => void signOut()} className="flex items-center gap-1.5 text-sm text-danger hover:underline">
          <LogOut className="h-4 w-4" /> Chiqish
        </button>
      </div>
    </div>
  );
}
