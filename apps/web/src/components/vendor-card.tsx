import Image from 'next/image';
import Link from 'next/link';
import { BadgeCheck, MapPin } from 'lucide-react';
import { Card } from './ui/card';
import { Rating } from './ui/rating';
import type { Vendor } from '@/lib/api';

export function VendorCard({ v }: { v: Vendor }) {
  return (
    <Link href={`/vendor/${v.slug}`}>
      <Card className="hover:shadow-pop transition group">
        <div className="relative aspect-[4/3] bg-bg">
          <Image src={v.photos[0] ?? 'https://picsum.photos/seed/izla/800/600'} alt={v.name} fill className="object-cover group-hover:scale-105 transition" sizes="(max-width:768px) 100vw, 33vw" />
          <span className="absolute top-2 left-2 rounded-full bg-white/90 px-2 py-0.5 text-xs">{v.category?.icon} {v.category?.name}</span>
        </div>
        <div className="p-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-semibold text-ink truncate flex items-center gap-1">
              {v.name}
              {v.verified && <BadgeCheck className="h-4 w-4 text-brand shrink-0" />}
            </h3>
            <Rating value={v.rating} count={v.reviewCount} />
          </div>
          <p className="mt-1 text-sm text-slate2 flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" /> {v.district ?? 'Toshkent'}
            {v.distanceKm != null && <span className="ml-auto text-brand">{v.distanceKm} km</span>}
          </p>
        </div>
      </Card>
    </Link>
  );
}
