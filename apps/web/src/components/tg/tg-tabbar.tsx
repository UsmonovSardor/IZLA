'use client';
import { Link } from 'next-view-transitions';
import { usePathname } from 'next/navigation';
import { Home, Search, CalendarCheck, User, type LucideIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { haptic } from '@/lib/telegram';

interface Tab {
  href: string;
  icon: LucideIcon;
  key: string;
  exact?: boolean;
}
const TABS: Tab[] = [
  { href: '/tg', icon: Home, key: 'home', exact: true },
  { href: '/tg/qidiruv', icon: Search, key: 'search' },
  { href: '/tg/bronlar', icon: CalendarCheck, key: 'bookings' },
  { href: '/tg/profil', icon: User, key: 'profile' },
];

export function TgTabbar() {
  const pathname = usePathname();
  const t = useTranslations('tg.tabs');

  return (
    <nav
      className="tg-tabbar relative z-20 grid shrink-0 grid-cols-4 border-t border-line bg-surface/95 backdrop-blur-xl"
      aria-label="Mini app"
    >
      {TABS.map((tab) => {
        const active = tab.exact ? pathname === tab.href : pathname?.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            onClick={() => haptic.select()}
            className="relative flex flex-col items-center justify-center gap-1 py-2 transition-colors"
            aria-current={active ? 'page' : undefined}
          >
            <span
              className={`grid h-8 w-14 place-items-center rounded-full transition-all duration-300 ${
                active ? 'bg-brand/10 text-brand' : 'text-muted'
              }`}
            >
              <tab.icon className="h-[22px] w-[22px]" strokeWidth={active ? 2.4 : 2} />
            </span>
            <span
              className={`text-[10.5px] font-semibold leading-none transition-colors ${
                active ? 'text-brand' : 'text-muted'
              }`}
            >
              {t(tab.key)}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
