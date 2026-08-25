import { Clock } from 'lucide-react';
import { Reveal } from '@/components/reveal';
import { formatUZS } from '@/lib/utils';

interface Svc { id: string; name: string; price: string; durationMin: number }

/** Xizmatlar — narx + davomiylik bilan boy kartalar. */
export function ServiceMenu({
  heading, subheading, services, accent, minutesLabel, fromLabel, freeLabel,
}: {
  heading: string; subheading?: string; services: Svc[]; accent: string;
  minutesLabel: string; fromLabel: string; freeLabel: string;
}) {
  if (!services.length) return null;
  return (
    <section>
      <div className="mx-auto max-w-2xl text-center">
        <span className="text-sm font-bold uppercase tracking-wide" style={{ color: accent }}>{subheading}</span>
        <h2 className="mt-2 font-display text-2xl font-bold text-navy sm:text-3xl">{heading}</h2>
      </div>
      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        {services.map((s, i) => {
          const price = Number(s.price);
          return (
            <Reveal key={s.id} delay={i * 60}>
              <div className="flex items-center justify-between gap-4 rounded-2xl border border-line bg-surface p-4 shadow-card transition hover:border-[color:var(--a)] hover:shadow-lg"
                style={{ ['--a' as string]: accent }}>
                <div className="min-w-0">
                  <div className="truncate font-medium text-ink">{s.name}</div>
                  <div className="mt-0.5 flex items-center gap-1 text-xs text-slate2">
                    <Clock className="h-3.5 w-3.5" />
                    {minutesLabel.replace('{count}', String(s.durationMin))}
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  {price > 0 ? (
                    <>
                      <span className="text-[11px] text-slate2">{fromLabel}</span>
                      <div className="font-mono text-base font-bold" style={{ color: accent }}>{formatUZS(price)}</div>
                    </>
                  ) : (
                    <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-600">{freeLabel}</span>
                  )}
                </div>
              </div>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}
