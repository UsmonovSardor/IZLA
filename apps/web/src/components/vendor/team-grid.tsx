import Image from 'next/image';
import { Reveal } from '@/components/reveal';

export interface TeamMember { name: string; role?: string; photo?: string; exp?: string }

const FALLBACK = 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=600&q=80&auto=format&fit=crop';

/** Jamoa/shifokorlar to'ri — foto + ism + rol. */
export function TeamGrid({
  heading, subheading, members, accent, expLabel,
}: {
  heading: string; subheading?: string; members: TeamMember[]; accent: string; expLabel: string;
}) {
  if (!members.length) return null;
  return (
    <section>
      <div className="mx-auto max-w-2xl text-center">
        <span className="text-sm font-bold uppercase tracking-wide" style={{ color: accent }}>{subheading}</span>
        <h2 className="mt-2 font-display text-2xl font-bold text-navy sm:text-3xl">{heading}</h2>
      </div>
      <div className="mt-8 grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
        {members.map((m, i) => (
          <Reveal key={i} delay={i * 80}>
            <div className="group overflow-hidden rounded-2xl border border-line bg-surface shadow-card transition hover:shadow-lg">
              <div className="relative aspect-[4/5] overflow-hidden">
                <Image
                  src={m.photo || FALLBACK}
                  alt={m.name}
                  fill
                  className="object-cover transition duration-500 group-hover:scale-105"
                  sizes="(max-width:640px) 45vw, 22vw"
                />
                {m.exp && (
                  <span
                    className="absolute left-2 top-2 rounded-full px-2 py-0.5 text-[11px] font-semibold text-white shadow"
                    style={{ backgroundColor: accent }}
                  >
                    {expLabel.replace('{years}', m.exp)}
                  </span>
                )}
              </div>
              <div className="p-3 text-center">
                <div className="font-display font-semibold text-navy">{m.name}</div>
                {m.role && <div className="mt-0.5 text-xs text-slate2">{m.role}</div>}
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
