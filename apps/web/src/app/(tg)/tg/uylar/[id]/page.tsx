'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Maximize2, BedDouble, MapPin, Building2, BadgeCheck, Layers, ImageOff } from 'lucide-react';
import { api, type PropertyDetail } from '@/lib/api';
import { formatUZS } from '@/lib/utils';
import { TgScreen } from '@/components/tg/tg-screen';
import { Skel } from '@/components/tg/tg-ui';

export default function TgPropertyDetail() {
  const t = useTranslations('tg');
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const [p, setP] = useState<PropertyDetail | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) return;
    api.property(id).then(setP).catch(() => setNotFound(true));
  }, [id]);

  if (notFound) return <div className="px-6 py-24 text-center text-muted">{t('property.notFound')}</div>;
  if (!p) {
    return (
      <div>
        <Skel className="h-60 w-full rounded-none" />
        <div className="space-y-4 p-4"><Skel className="h-8 w-1/2" /><Skel className="h-24 w-full rounded-2xl" /></div>
      </div>
    );
  }

  return (
    <div className="pb-6">
      {/* Hero */}
      <div className="relative h-60 w-full bg-line">
        {p.photos?.[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={p.photos[0]} alt={p.title} className="h-full w-full object-cover" />
        ) : (
          <div className="grid h-full w-full place-items-center text-muted"><ImageOff className="h-10 w-10" /></div>
        )}
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-navy/70 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-4">
          <p className="font-display text-2xl font-bold text-white drop-shadow">{formatUZS(p.price)}</p>
        </div>
      </div>

      {/* Gallereya */}
      {p.photos && p.photos.length > 1 && (
        <div className="flex gap-2 overflow-x-auto px-4 pt-4 tg-noscroll">
          {p.photos.slice(1, 8).map((ph, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={i} src={ph} alt="" loading="lazy" className="h-20 w-28 shrink-0 rounded-xl object-cover" />
          ))}
        </div>
      )}

      <div className="px-4 pt-4">
        <h1 className="font-display text-xl font-bold text-navy">{p.title}</h1>

        {/* Xususiyatlar */}
        <div className="mt-4 grid grid-cols-3 gap-2.5">
          <Spec icon={BedDouble} label={t('property.rooms', { n: p.rooms })} />
          <Spec icon={Maximize2} label={t('property.area', { n: p.areaM2 })} />
          {typeof p.floor === 'number' && typeof p.totalFloors === 'number' && (
            <Spec icon={Layers} label={t('property.floor', { a: p.floor, b: p.totalFloors })} />
          )}
        </div>

        {p.district && (
          <p className="mt-4 flex items-center gap-2 text-[14px] text-ink"><MapPin className="h-4 w-4 text-violet" /> {p.district}</p>
        )}

        {p.description && <p className="mt-3 whitespace-pre-line text-[14px] leading-relaxed text-ink">{p.description}</p>}

        {/* Turar-joy majmuasi */}
        {p.complex && (
          <div className="mt-5 rounded-2xl border border-line bg-surface p-4">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-brand" />
              <p className="font-display font-bold text-navy">{p.complex.name}</p>
            </div>
            <p className="mt-1.5 text-[13px] text-muted">{t('property.readiness', { p: p.complex.readinessPercent })}</p>
            {p.complex.developer && (
              <p className="mt-1 flex items-center gap-1.5 text-[13px] text-ink">
                {t('property.developer')}: <span className="font-semibold">{p.complex.developer.name}</span>
                {p.complex.developer.verified && <BadgeCheck className="h-4 w-4 text-brand" />}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Spec({ icon: Icon, label }: { icon: typeof BedDouble; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-2xl border border-line bg-surface py-3">
      <Icon className="h-5 w-5 text-brand" />
      <span className="text-[12px] font-semibold text-ink">{label}</span>
    </div>
  );
}
