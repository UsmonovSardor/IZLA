import Image from 'next/image';
import Link from 'next/link';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { formatUZS } from '@/lib/utils';
import type { Property } from '@/lib/api';

const TYPE_LABEL: Record<string, string> = { NEW: 'Yangi', CONSTRUCTION: 'Qurilayotgan', SECONDARY: 'Ikkilamchi', RENT: 'Ijara' };
const TYPE_STYLE: Record<string, string> = {
  NEW: 'bg-teal/10 text-teal', CONSTRUCTION: 'bg-warning/10 text-warning',
  SECONDARY: 'bg-slate2/10 text-slate2', RENT: 'bg-brand/10 text-brand',
};

export function PropertyCard({ p }: { p: Property }) {
  return (
    <Link href={`/uylar/${p.id}`}>
      <Card className="hover:shadow-pop transition group">
        <div className="relative aspect-[4/3] bg-bg">
          <Image src={p.photos[0] ?? 'https://picsum.photos/seed/uy/800/600'} alt={p.title} fill className="object-cover group-hover:scale-105 transition" sizes="(max-width:768px) 100vw, 33vw" />
          <Badge className={`absolute top-2 left-2 ${TYPE_STYLE[p.type]}`}>{TYPE_LABEL[p.type]}</Badge>
          {p.type === 'CONSTRUCTION' && p.complex && (
            <Badge className="absolute top-2 right-2 bg-white/90 text-ink">{p.complex.readinessPercent}% tayyor</Badge>
          )}
        </div>
        <div className="p-3">
          <div className="font-display font-bold text-navy">{formatUZS(p.price)}</div>
          <div className="text-xs text-slate2">{formatUZS(p.pricePerM2 ?? 0)}/m²</div>
          <h3 className="mt-1 text-sm font-medium text-ink line-clamp-2">{p.title}</h3>
          <p className="mt-1 text-xs text-slate2">{p.rooms}-xona · {p.areaM2} m² · {p.district}</p>
        </div>
      </Card>
    </Link>
  );
}
