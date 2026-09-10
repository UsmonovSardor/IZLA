'use client';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'next-view-transitions';
import { useTranslations } from 'next-intl';
import { ShieldCheck, BadgeCheck, Star } from 'lucide-react';
import { api, type InsuranceProduct, type InsuranceFacets } from '@/lib/api';
import { formatUZS } from '@/lib/utils';
import { haptic } from '@/lib/telegram';
import { TgScreen } from '@/components/tg/tg-screen';
import { Chip, Skel, TgEmpty } from '@/components/tg/tg-ui';

export default function TgInsurance() {
  const t = useTranslations('tg');
  const [facets, setFacets] = useState<InsuranceFacets | null>(null);
  const [type, setType] = useState('');
  const [items, setItems] = useState<InsuranceProduct[] | null>(null);

  useEffect(() => {
    api.insuranceFacets().then(setFacets).catch(() => setFacets(null));
  }, []);

  useEffect(() => {
    let alive = true;
    setItems(null);
    api.insuranceProducts(type ? `?type=${type}` : '')
      .then((r) => alive && setItems(r)).catch(() => alive && setItems([]));
    return () => { alive = false; };
  }, [type]);

  const types = useMemo(() => facets?.types ?? [], [facets]);

  return (
    <TgScreen title={t('insurance.title')}>
      {/* Tur filtri */}
      {types.length > 0 && (
        <div className="-mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-1 tg-noscroll">
          <Chip active={type === ''} onClick={() => setType('')}>{t('insurance.all')}</Chip>
          {types.map((ty) => (
            <Chip key={ty.type} active={type === ty.type} onClick={() => setType(type === ty.type ? '' : ty.type)}>
              {t(`insurance.types.${ty.type}`)}
            </Chip>
          ))}
        </div>
      )}

      {!items ? (
        <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skel key={i} className="h-32 rounded-2xl" />)}</div>
      ) : items.length === 0 ? (
        <TgEmpty icon={ShieldCheck} title={t('insurance.emptyTitle')} />
      ) : (
        <div className="space-y-3">
          {items.map((p) => (
            <Link
              key={p.id}
              href={`/tg/sugurta/${p.slug}`}
              onClick={() => haptic.impact('light')}
              className="block rounded-2xl border border-line bg-surface p-4 transition active:scale-[0.99]"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="rounded-lg bg-teal/10 px-2 py-0.5 text-[11px] font-bold text-teal-600">{t(`insurance.types.${p.type}`)}</span>
                <span className="inline-flex items-center gap-1 text-[12px] text-muted"><Star className="h-3 w-3 fill-amber-400 text-amber-400" /> {p.rating.toFixed(1)}</span>
              </div>
              <p className="mt-2 font-display text-[15px] font-bold text-navy">{p.name}</p>
              <p className="mt-0.5 flex items-center gap-1 text-[13px] text-muted">
                {p.insurer.name} {p.insurer.verified && <BadgeCheck className="h-3.5 w-3.5 text-brand" />}
              </p>
              <div className="mt-2.5 flex items-end justify-between">
                <div>
                  <p className="text-[11px] text-muted">{t('insurance.priceFrom')}</p>
                  <p className="font-display text-lg font-bold text-navy">{formatUZS(p.priceFrom)}</p>
                </div>
                {p.coverageFrom > 0 && (
                  <div className="text-right">
                    <p className="text-[11px] text-muted">{t('insurance.coverage')}</p>
                    <p className="text-[13px] font-bold text-teal-600">{formatUZS(p.coverageFrom)}</p>
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </TgScreen>
  );
}
