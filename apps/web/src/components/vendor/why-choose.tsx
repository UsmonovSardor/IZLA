import Image from 'next/image';
import { VendorIcon } from './vendor-icon';
import { Reveal } from '@/components/reveal';

export interface Highlight { icon: string; title: string; text: string }

/** "Nega bizni tanlaydilar" — 6 xususiyat markaziy rasm atrofida (Dentaire uslubi). */
export function WhyChoose({
  heading, subheading, items, image, accent,
}: {
  heading: string; subheading?: string; items: Highlight[]; image: string; accent: string;
}) {
  const left = items.slice(0, 3);
  const right = items.slice(3, 6);
  return (
    <section>
      <div className="mx-auto max-w-2xl text-center">
        <span className="text-sm font-bold uppercase tracking-wide" style={{ color: accent }}>{subheading}</span>
        <h2 className="mt-2 font-display text-2xl font-bold text-navy sm:text-3xl">{heading}</h2>
      </div>

      <div className="mt-10 grid items-center gap-8 lg:grid-cols-[1fr_auto_1fr]">
        <div className="space-y-8">
          {left.map((h, i) => <Item key={i} h={h} accent={accent} align="right" delay={i * 100} />)}
        </div>

        <Reveal className="relative mx-auto hidden aspect-square w-56 shrink-0 lg:block">
          <div className="absolute inset-0 rounded-full" style={{ background: `radial-gradient(circle, ${accent}22, transparent 70%)` }} />
          <div className="relative h-full w-full overflow-hidden rounded-full ring-4 ring-white shadow-xl">
            <Image src={image} alt="" fill className="object-cover" sizes="224px" />
          </div>
        </Reveal>

        <div className="space-y-8">
          {right.map((h, i) => <Item key={i} h={h} accent={accent} align="left" delay={i * 100} />)}
        </div>
      </div>
    </section>
  );
}

function Item({ h, accent, align, delay }: { h: Highlight; accent: string; align: 'left' | 'right'; delay: number }) {
  return (
    <Reveal delay={delay}>
      <div className={`flex items-start gap-4 ${align === 'right' ? 'lg:flex-row-reverse lg:text-right' : ''}`}>
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
          style={{ backgroundColor: accent + '15', color: accent }}
        >
          <VendorIcon name={h.icon} className="h-6 w-6" />
        </div>
        <div>
          <h3 className="font-display font-semibold text-navy">{h.title}</h3>
          <p className="mt-1 text-sm text-muted">{h.text}</p>
        </div>
      </div>
    </Reveal>
  );
}
