'use client';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'next-view-transitions';
import { useTranslations } from 'next-intl';
import { CalendarClock, ChevronDown, LayoutDashboard, LogOut, User as UserIcon } from 'lucide-react';
import { useAuth } from './auth-provider';
import { Button } from './ui/button';

function initials(name?: string | null): string {
  if (!name) return 'U';
  return name.trim().slice(0, 1).toUpperCase();
}

export function HeaderAuth() {
  const { user, loading, openLogin, signOut } = useAuth();
  const t = useTranslations('headerAuth');
  const tc = useTranslations('common');
  const tr = useTranslations('roles');
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  if (loading) {
    return <div className="h-9 w-9 rounded-full bg-line/60 animate-pulse" />;
  }

  if (!user) {
    return (
      <Button className="h-9 px-4 text-sm" onClick={() => openLogin()}>
        {tc('login')}
      </Button>
    );
  }

  const isStaff = user.role !== 'USER';
  const roleLabel = tr.has(user.role) ? tr(user.role) : user.role;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-full border border-line bg-surface py-1 pl-1 pr-2 hover:border-brand/40"
      >
        {user.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={user.avatarUrl} alt="" className="h-7 w-7 rounded-full object-cover" />
        ) : (
          <span className="grid h-7 w-7 place-items-center rounded-full bg-brand-gradient text-xs font-bold text-white">
            {initials(user.name)}
          </span>
        )}
        <span className="hidden sm:block max-w-[100px] truncate text-sm font-medium text-ink">
          {user.name ?? user.phone ?? t('fallbackName')}
        </span>
        <ChevronDown className="h-4 w-4 text-muted" />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-xl border border-line bg-surface shadow-xl">
          <div className="border-b border-line px-4 py-3">
            <p className="truncate text-sm font-semibold text-navy">{user.name ?? t('anonUser')}</p>
            <p className="truncate text-xs text-muted">{user.email ?? user.phone ?? roleLabel}</p>
            {isStaff && (
              <span className="mt-1.5 inline-block rounded-full bg-brand/10 px-2 py-0.5 text-[11px] font-medium text-brand">
                {roleLabel}
              </span>
            )}
          </div>
          <nav className="p-1 text-sm">
            <Link href="/profil" onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-lg px-3 py-2 text-ink hover:bg-bg">
              <UserIcon className="h-4 w-4 text-muted" /> {t('profile')}
            </Link>
            <Link href="/bron" onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-lg px-3 py-2 text-ink hover:bg-bg">
              <CalendarClock className="h-4 w-4 text-muted" /> {t('myBookings')}
            </Link>
            {isStaff && (
              <Link href="/kabinet" onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-lg px-3 py-2 text-ink hover:bg-bg">
                <LayoutDashboard className="h-4 w-4 text-muted" /> {t('cabinet')}
              </Link>
            )}
            <button
              onClick={() => {
                setOpen(false);
                void signOut();
              }}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-danger hover:bg-danger/5"
            >
              <LogOut className="h-4 w-4" /> {t('logout')}
            </button>
          </nav>
        </div>
      )}
    </div>
  );
}
