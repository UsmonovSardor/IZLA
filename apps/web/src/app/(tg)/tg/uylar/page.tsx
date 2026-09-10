'use client';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'next-view-transitions';
import { useTranslations } from 'next-intl';
import { Building2, Maximize2, BedDouble, MapPin, ImageOff } from 'lucide-react';
import { api, type Property } from '@/lib/api';
import { formatUZS } from '@/lib/utils';
import { haptic } from '@/lib/telegram';
import { TgScreen } from '@/components/tg/tg-screen';
import { Chip, Skel, TgEmpty } from '@/components/tg/tg-ui';

const TYPES = ['SECONDARY', 'NEW', 'CONSTRUCTION'] as const;
type SortKey = 'new' | 'cheap' | 'expensive';

function PropertyCard({ p }: { p: Property }) {
  const t = useTranslations('tg.property');
  return (
    <Link
      href={`/tg/uylar/${p.id}`}
      onClick={() => haptic.impact('light')}
      className="block overflow-hidden rounded-2xl border border-line bg-surface transition active:scale-[0.99]"
    >
      <div className="relative h-40 w-full bg-line">
        {p.photos?.[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={p.photos[0]} alt={p.title} loading="lazy" className="h-full w-full object-cover" />
        ) : (
          <div className="grid h-full w-full place-items-center text-muted"><ImageOff className="h-7 w-7" /></div>
        )}
        {p.complex && (
          <span className="absolute left-3 top-3 rounded-full bg-navy/70 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur">
            {t('readiness', { p: p.complex.readinessPercent })}
          </span>
        )}
      </div>
      <div className="p-3.5">
        <p className="font-display text-lg font-bold text-navy">{formatUZS(p.price)}</p>
        <p className="mt-0.5 line-clamp-1 text-[14px] text-ink">{p.title}</p>
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12.5px] text-muted">
          <span className="inline-flex items-center gap-1"><BedDouble className="h-3.5 w-3.5" /> {t('rooms', { n: p.rooms })}</span>
          <span className="inline-flex items-center gap-1"><Maximize2 className="h-3.5 w-3.5" /> {t('area', { n: p.areaM2 })}</span>
          {p.district && <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {p.district}</span>}
        </div>
      </div>
    </Link>
  );
}

export default function TgProperties() {
  const t = useTranslations('tg');
  const [type, setType] = useState('');
  const [sort, setSort] = useState<SortKey>('new');
  const [items, setItems] = useState<Property[] | null>(null);

  useEffect(() => {
    let alive = true;
    setItems(null);
    api.properties(type ? `?type=${type}` : '')
      .then((r) => alive && setItems(r)).catch(() => alive && setItems([]));
    return () => { alive = false; };
  }, [type]);

  const sorted = useMemo(() => {
    if (!items) return null;
    if (sort === 'new') return items;
    const arr = [...items].sort((a, b) => Number(a.price) - Number(b.price));
    return sort === 'cheap' ? arr : arr.reverse();
  }, [items, sort]);

  return (
    <TgScreen title={t('property.title')}>
      {/* Tur filtri */}
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 tg-noscroll">
        <Chip active={type === ''} onClick={() => setType('')}>{t('property.all')}</Chip>
        {TYPES.map((ty) => (
          <Chip key={ty} active={type === ty} onClick={() => setType(type === ty ? '' : ty)}>{t(`property.types.${ty}`)}</Chip>
        ))}
      </div>
      {/* Saralash */}
      <div className="mt-2 flex gap-2">
        {(['new', 'cheap', 'expensive'] as SortKey[]).map((s) => (
          <Chip key={s} active={sort === s} onClick={() => setSort(s)}>
            {t(s === 'new' ? 'property.sortNew' : s === 'cheap' ? 'property.sortCheap' : 'property.sortExpensive')}
          </Chip>
        ))}
      </div>

      <div className="mt-4">
        {!sorted ? (
          <div className="space-y-4">{Array.from({ length: 4 }).map((_, i) => <Skel key={i} className="h-64 rounded-2xl" />)}</div>
        ) : sorted.length === 0 ? (
          <TgEmpty icon={Building2} title={t('property.emptyTitle')} sub={t('property.emptySub')} />
        ) : (
          <div className="space-y-4">{sorted.map((p) => <PropertyCard key={p.id} p={p} />)}</div>
        )}
      </div>
    </TgScreen>
  );
}
