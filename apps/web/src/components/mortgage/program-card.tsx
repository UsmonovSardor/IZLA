import { Link } from 'next-view-transitions';
import { Star, Check, ArrowRight, Landmark, BadgeCheck } from 'lucide-react';
import type { MortgageProgram } from '@/lib/api';
import { formatUZS } from '@/lib/utils';

const ACCENT = '#0F766E';

export function MortgageProgramCard({
  p,
  labels,
}: {
  p: MortgageProgram;
  labels: { rate: string; monthlyFrom: string; minDown: string; upToYears: string; calculate: string; popular: string; subsidized: string };
}) {
  const years = Math.round(p.maxTermMonths / 12);
  return (
    <Link href={`/ipoteka/${p.slug}`} className="group relative flex flex-col overflow-hidden rounded-3xl border border-line bg-surface p-5 shadow-card transition hover:-translate-y-1 hover:shadow-lg">
      <div className="absolute right-4 top-4 flex gap-1.5">
        {p.subsidized && <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-bold text-emerald-700">{labels.subsidized}</span>}
        {p.popular && <span className="rounded-full px-2.5 py-1 text-[11px] font-bold text-white" style={{ background: ACCENT }}>{labels.popular}</span>}
      </div>

      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-2xl" style={{ background: `${ACCENT}1a`, color: ACCENT }}>
          {p.bank.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={p.bank.logoUrl} alt="" className="h-6 w-6 rounded object-cover" />
          ) : (
            <Landmark className="h-5 w-5" />
          )}
        </span>
        <div className="min-w-0">
          <span className="inline-flex items-center gap-1 text-xs text-muted">
            {p.bank.verified && <BadgeCheck className="h-3.5 w-3.5 text-brand" />} {p.bank.name}
          </span>
          <h3 className="truncate font-display text-base font-bold text-heading">{p.name}</h3>
        </div>
      </div>

      <div className="mt-3 flex items-end gap-4">
        <div>
          <div className="text-[11px] text-muted">{labels.rate}</div>
          <div className="font-display text-2xl font-extrabold" style={{ color: ACCENT, fontVariantNumeric: 'tabular-nums' }}>{p.annualRate}%</div>
        </div>
        <div className="ml-auto text-right">
          <div className="text-[11px] text-muted">{labels.monthlyFrom}</div>
          <div className="font-display text-base font-bold text-heading" style={{ fontVariantNumeric: 'tabular-nums' }}>{formatUZS(p.monthlyFrom)}</div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted">
        <span className="rounded-full bg-bg px-2.5 py-1">{labels.minDown}: {p.minDownPct}%</span>
        <span className="rounded-full bg-bg px-2.5 py-1">{years} {labels.upToYears}</span>
        <span className="inline-flex items-center gap-0.5 rounded-full bg-bg px-2.5 py-1"><Star className="h-3 w-3 fill-amber-400 text-amber-400" /> {p.rating.toFixed(1)}</span>
      </div>

      {p.features.length > 0 && (
        <ul className="mt-3 flex flex-col gap-1.5">
          {p.features.slice(0, 3).map((f, i) => (
            <li key={i} className="flex items-center gap-2 text-sm text-ink"><Check className="h-3.5 w-3.5 shrink-0" style={{ color: ACCENT }} /> <span className="truncate">{f}</span></li>
          ))}
        </ul>
      )}

      <span className="mt-4 inline-flex items-center justify-center gap-1 rounded-full px-4 py-2.5 text-sm font-semibold text-white transition group-hover:gap-2" style={{ background: ACCENT }}>
        {labels.calculate} <ArrowRight className="h-4 w-4" />
      </span>
    </Link>
  );
}
