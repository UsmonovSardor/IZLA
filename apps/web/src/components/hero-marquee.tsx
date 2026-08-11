'use client';
import { useTranslations } from 'next-intl';
import { BadgeCheck, Clock, MapPin, ShieldCheck, Zap } from 'lucide-react';

const ITEMS = [
  { key: 'm1', Icon: Zap },
  { key: 'm2', Icon: MapPin },
  { key: 'm3', Icon: ShieldCheck },
  { key: 'm4', Icon: BadgeCheck },
  { key: 'm5', Icon: Clock },
] as const;

/** Hero tepasidagi qiymat-taklif lentasi (marquee). Hover'da to'xtaydi. */
export function HeroMarquee() {
  const t = useTranslations('hero');
  const row = (
    <div className="marquee-track flex shrink-0 items-center gap-8 pr-8">
      {ITEMS.map(({ key, Icon }) => (
        <span key={key} className="flex items-center gap-2 whitespace-nowrap text-sm text-white/75">
          <Icon className="h-4 w-4 text-teal-400" />
          {t(key)}
        </span>
      ))}
    </div>
  );
  return (
    <div className="marquee-mask relative flex overflow-hidden border-b border-white/10 bg-gradient-to-r from-[#091627] via-[#12294a] to-[#091627] py-2">
      {row}
      {row}
    </div>
  );
}
