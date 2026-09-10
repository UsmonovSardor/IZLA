'use client';
import { Link } from 'next-view-transitions';
import { useTranslations } from 'next-intl';
import { Building2, Briefcase, CreditCard, Landmark, ShieldCheck, type LucideIcon } from 'lucide-react';
import { haptic } from '@/lib/telegram';

interface Svc {
  key: string;
  href: string;
  icon: LucideIcon;
  color: string;
  bg: string;
  soon?: boolean;
}
const SERVICES: Svc[] = [
  { key: 'realEstate', href: '/tg/uylar', icon: Building2, color: 'text-brand', bg: 'bg-brand/[0.08]' },
  { key: 'jobs', href: '/tg/ish', icon: Briefcase, color: 'text-teal-600', bg: 'bg-teal/[0.1]' },
  { key: 'nasiya', href: '/tg/nasiya', icon: CreditCard, color: 'text-violet', bg: 'bg-violet/[0.1]', soon: true },
  { key: 'mortgage', href: '/tg/ipoteka', icon: Landmark, color: 'text-brand-600', bg: 'bg-brand/[0.08]', soon: true },
  { key: 'insurance', href: '/tg/sugurta', icon: ShieldCheck, color: 'text-teal-600', bg: 'bg-teal/[0.1]', soon: true },
];

export function TgServices() {
  const t = useTranslations('tg.services');

  const tile = (s: Svc) => (
    <div className="flex flex-col items-center gap-2">
      <span className={`grid h-14 w-14 place-items-center rounded-2xl ${s.bg} ${s.color} transition active:scale-90`}>
        <s.icon className="h-6 w-6" />
      </span>
      <span className="text-center text-[11.5px] font-semibold leading-tight text-ink">{t(s.key)}</span>
    </div>
  );

  return (
    <div className="grid grid-cols-4 gap-3">
      {SERVICES.map((s) =>
        s.soon ? (
          <div key={s.key} className="relative opacity-45" aria-disabled>
            {tile(s)}
            <span className="absolute -top-1 right-1 rounded-full bg-line px-1.5 py-0.5 text-[8px] font-bold text-muted">
              {t('soon')}
            </span>
          </div>
        ) : (
          <Link key={s.key} href={s.href} onClick={() => haptic.impact('light')}>
            {tile(s)}
          </Link>
        ),
      )}
    </div>
  );
}
