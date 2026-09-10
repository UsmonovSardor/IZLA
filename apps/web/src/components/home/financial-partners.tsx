import { getTranslations } from 'next-intl/server';
import { ShieldCheck, Landmark, CreditCard, Wallet, type LucideIcon } from 'lucide-react';
import { Reveal } from '@/components/reveal';

type PartnerType = 'sugurta' | 'bank' | 'nasiya' | 'tolov';

/** Tur bo'yicha brend intizomi: teal (sug'urta) / brand (bank) / violet (nasiya) / brand-500 (to'lov). */
const TYPE: Record<PartnerType, { Icon: LucideIcon; grad: string; dot: string }> = {
  sugurta: { Icon: ShieldCheck, grad: 'from-teal to-teal-600', dot: 'text-teal-600' },
  bank: { Icon: Landmark, grad: 'from-brand to-brand-600', dot: 'text-brand' },
  nasiya: { Icon: CreditCard, grad: 'from-violet to-brand-500', dot: 'text-violet' },
  tolov: { Icon: Wallet, grad: 'from-brand-500 to-teal', dot: 'text-brand-500' },
};

// Demo homiylar — real O'zbekiston moliyaviy brendlari (logo o'rniga monogramma tayl).
const PARTNERS: { name: string; mono: string; type: PartnerType }[] = [
  { name: 'Kafil Sug‘urta', mono: 'K', type: 'sugurta' },
  { name: 'Ipoteka Bank', mono: 'IB', type: 'bank' },
  { name: 'Uzum Nasiya', mono: 'U', type: 'nasiya' },
  { name: 'Apex Insurance', mono: 'A', type: 'sugurta' },
  { name: 'Aloqabank', mono: 'AL', type: 'bank' },
  { name: 'Payme', mono: 'P', type: 'tolov' },
  { name: 'Anorbank', mono: 'AN', type: 'bank' },
  { name: 'Gross Insurance', mono: 'G', type: 'sugurta' },
  { name: 'Click', mono: 'C', type: 'tolov' },
  { name: 'TBC Bank', mono: 'T', type: 'bank' },
  { name: 'Alskom', mono: 'AS', type: 'sugurta' },
  { name: 'Kapitalbank', mono: 'KB', type: 'bank' },
];

/** Moliyaviy hamkorlar — silliq cheksiz karusel (marquee). Hover'da to'xtaydi, reduced-motion'da statik. */
export async function FinancialPartners() {
  const t = await getTranslations('home');
  const tt = await getTranslations('home.partnerTypes');

  const card = (p: (typeof PARTNERS)[number], key: string) => {
    const cfg = TYPE[p.type];
    return (
      <div
        key={key}
        className="group flex shrink-0 items-center gap-3 rounded-2xl border border-line bg-surface px-5 py-3.5 shadow-sm transition hover:border-brand/30 hover:shadow-card"
      >
        <span
          className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${cfg.grad} font-display text-base font-bold text-white shadow-inner`}
        >
          {p.mono}
        </span>
        <span className="flex flex-col leading-tight">
          <span className="font-display text-sm font-bold text-navy">{p.name}</span>
          <span className="mt-0.5 inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-muted">
            <cfg.Icon className={`h-3 w-3 ${cfg.dot}`} /> {tt(p.type)}
          </span>
        </span>
      </div>
    );
  };

  const track = (n: number) => (
    <div className="marquee-track flex shrink-0 items-center gap-5 pr-5" aria-hidden={n > 0}>
      {PARTNERS.map((p, i) => card(p, `${n}-${i}`))}
    </div>
  );

  return (
    <section className="relative border-y border-line bg-gradient-to-b from-surface/60 via-bg to-surface/60 py-14">
      <Reveal>
        <div className="mx-auto max-w-2xl px-4 text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-brand">{t('trustLabel')}</p>
          <h2 className="mt-2 font-display text-xl font-bold text-navy md:text-2xl">{t('trustSub')}</h2>
        </div>
      </Reveal>

      {/* Karusel — ikki bir xil track seamless loop uchun, chekkalarda fade niqob */}
      <div className="marquee-mask relative mt-8 flex overflow-hidden">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-bg to-transparent sm:w-28" aria-hidden />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-bg to-transparent sm:w-28" aria-hidden />
        {track(0)}
        {track(1)}
      </div>
    </section>
  );
}
