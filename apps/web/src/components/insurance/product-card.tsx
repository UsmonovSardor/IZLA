import { Link } from 'next-view-transitions';
import { Star, Check, ArrowRight, ShieldCheck } from 'lucide-react';
import type { InsuranceProduct } from '@/lib/api';
import { TYPE_ICON, TYPE_ACCENT } from '@/lib/insurance-meta';
import { formatUZS } from '@/lib/utils';

export function InsuranceProductCard({
  p,
  labels,
}: {
  p: InsuranceProduct;
  labels: { from: string; coverage: string; calculate: string; popular: string; typeName: string };
}) {
  const Icon = TYPE_ICON[p.type];
  const accent = TYPE_ACCENT[p.type];
  return (
    <Link
      href={`/sugurta/${p.slug}`}
      className="group relative flex flex-col overflow-hidden rounded-3xl border border-line bg-surface p-5 shadow-card transition hover:-translate-y-1 hover:shadow-lg"
    >
      {p.popular && (
        <span className="absolute right-4 top-4 rounded-full px-2.5 py-1 text-[11px] font-bold text-white" style={{ background: accent }}>
          {labels.popular}
        </span>
      )}
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-2xl" style={{ background: `${accent}1a`, color: accent }}>
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <span className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: accent }}>{labels.typeName}</span>
          <h3 className="truncate font-display text-base font-bold text-heading">{p.name}</h3>
        </div>
      </div>

      <div className="mt-2 flex items-center gap-2 text-xs text-muted">
        <span className="inline-flex items-center gap-1">
          {p.insurer.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={p.insurer.logoUrl} alt="" className="h-4 w-4 rounded-full object-cover" />
          ) : (
            <ShieldCheck className="h-3.5 w-3.5" />
          )}
          {p.insurer.name}
        </span>
        <span className="inline-flex items-center gap-0.5">
          <Star className="h-3 w-3 fill-amber-400 text-amber-400" /> {p.rating.toFixed(1)}
        </span>
      </div>

      {p.summary && <p className="mt-2 line-clamp-2 text-sm text-muted">{p.summary}</p>}

      {p.features.length > 0 && (
        <ul className="mt-3 flex flex-col gap-1.5">
          {p.features.slice(0, 3).map((f, i) => (
            <li key={i} className="flex items-center gap-2 text-sm text-ink">
              <Check className="h-3.5 w-3.5 shrink-0" style={{ color: accent }} /> <span className="truncate">{f}</span>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-auto flex items-end justify-between pt-4">
        <div>
          <div className="text-[11px] text-muted">{labels.from}</div>
          <div className="font-display text-lg font-extrabold text-heading" style={{ fontVariantNumeric: 'tabular-nums' }}>
            {formatUZS(p.priceFrom)}
          </div>
          <div className="text-[11px] text-muted">{labels.coverage}: {formatUZS(p.coverageFrom)}</div>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full px-3 py-2 text-sm font-semibold text-white transition group-hover:gap-2" style={{ background: accent }}>
          {labels.calculate} <ArrowRight className="h-4 w-4" />
        </span>
      </div>
    </Link>
  );
}
