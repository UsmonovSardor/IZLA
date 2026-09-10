import { getTranslations } from 'next-intl/server';
import { ShieldCheck, Landmark, CreditCard, Wallet, type LucideIcon } from 'lucide-react';
import { Reveal } from '@/components/reveal';

type PartnerType = 'sugurta' | 'bank' | 'nasiya' | 'tolov';

/** Tur badge'i uchun ikonka + rang (brend intizomi). */
const TYPE: Record<PartnerType, { Icon: LucideIcon; dot: string }> = {
  sugurta: { Icon: ShieldCheck, dot: 'text-teal-600' },
  bank: { Icon: Landmark, dot: 'text-brand' },
  nasiya: { Icon: CreditCard, dot: 'text-violet' },
  tolov: { Icon: Wallet, dot: 'text-brand-500' },
};

// Har bir homiy uchun noyob logo-belgi (dizayn qilingan SVG — trademark nusxa emas),
// real brend rangida. currentColor tayl rangidan meros oladi.
type LogoId =
  | 'kafil' | 'ipoteka' | 'uzum' | 'apex' | 'aloqa' | 'payme'
  | 'anor' | 'gross' | 'click' | 'tbc' | 'alskom' | 'kapital';

function Mark({ id }: { id: LogoId }) {
  const p = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  switch (id) {
    case 'kafil': // qalqon + belgi
      return (
        <svg viewBox="0 0 24 24" width={24} height={24} className="h-6 w-6">
          <path d="M12 2.5 4.5 5.2v5.6c0 4.7 3.2 8 7.5 10.2 4.3-2.2 7.5-5.5 7.5-10.2V5.2L12 2.5Z" fill="currentColor" opacity=".14" />
          <path d="M12 2.5 4.5 5.2v5.6c0 4.7 3.2 8 7.5 10.2 4.3-2.2 7.5-5.5 7.5-10.2V5.2L12 2.5Z" {...p} />
          <path d="m8.6 12 2.4 2.4 4.4-4.9" {...p} strokeWidth={2} />
        </svg>
      );
    case 'ipoteka': // ustunli bank + tom
      return (
        <svg viewBox="0 0 24 24" width={24} height={24} className="h-6 w-6">
          <path d="M12 3 3.5 8.8h17L12 3Z" fill="currentColor" />
          <path d="M5.5 9v8M9.8 9v8M14.2 9v8M18.5 9v8" {...p} strokeWidth={1.9} />
          <path d="M3.8 20.5h16.4" {...p} strokeWidth={2} />
        </svg>
      );
    case 'uzum': // yumaloq "U"
      return (
        <svg viewBox="0 0 24 24" width={24} height={24} className="h-6 w-6">
          <path d="M6.8 5v6.6a5.2 5.2 0 0 0 10.4 0V5" {...p} strokeWidth={2.6} />
          <circle cx="12" cy="6" r="1.6" fill="currentColor" />
        </svg>
      );
    case 'apex': // cho'qqi (apex)
      return (
        <svg viewBox="0 0 24 24" width={24} height={24} className="h-6 w-6">
          <path d="M3.5 19 12 5l8.5 14" {...p} strokeWidth={2} />
          <path d="M8.7 19 12 13.2 15.3 19Z" fill="currentColor" />
        </svg>
      );
    case 'aloqa': // ulangan halqalar
      return (
        <svg viewBox="0 0 24 24" width={24} height={24} className="h-6 w-6">
          <circle cx="9" cy="12" r="5" {...p} strokeWidth={2} />
          <circle cx="15" cy="12" r="5" {...p} strokeWidth={2} opacity=".55" />
        </svg>
      );
    case 'payme': // yumaloq kvadrat "P"
      return (
        <svg viewBox="0 0 24 24" width={24} height={24} className="h-6 w-6">
          <rect x="3" y="3" width="18" height="18" rx="6" fill="currentColor" opacity=".16" />
          <path d="M9 7.5v9m0-9h3.6a2.7 2.7 0 0 1 0 5.4H9" {...p} strokeWidth={2} />
        </svg>
      );
    case 'anor': // anor (doira + toj + urug'lar)
      return (
        <svg viewBox="0 0 24 24" width={24} height={24} className="h-6 w-6">
          <circle cx="12" cy="13.5" r="6.6" fill="currentColor" opacity=".16" />
          <circle cx="12" cy="13.5" r="6.6" {...p} />
          <path d="M12 6.9c0-2 1.4-3.4 3.3-3.4-.2 2-1.4 3.4-3.3 3.4Z" fill="currentColor" />
          <circle cx="9.6" cy="12.6" r="1" fill="currentColor" />
          <circle cx="14.4" cy="12.6" r="1" fill="currentColor" />
          <circle cx="12" cy="16" r="1" fill="currentColor" />
        </svg>
      );
    case 'gross': // doiradagi plyus
      return (
        <svg viewBox="0 0 24 24" width={24} height={24} className="h-6 w-6">
          <circle cx="12" cy="12" r="8.6" fill="currentColor" opacity=".14" />
          <circle cx="12" cy="12" r="8.6" {...p} />
          <path d="M12 8v8M8 12h8" {...p} strokeWidth={2.1} />
        </svg>
      );
    case 'click': // kursor/click strelka
      return (
        <svg viewBox="0 0 24 24" width={24} height={24} className="h-6 w-6">
          <path d="M5 3.2 11 19l2.1-5.9L19 11 5 3.2Z" fill="currentColor" />
        </svg>
      );
    case 'tbc': // yumaloq kvadrat "T"
      return (
        <svg viewBox="0 0 24 24" width={24} height={24} className="h-6 w-6">
          <rect x="3" y="3" width="18" height="18" rx="6" fill="currentColor" opacity=".16" />
          <path d="M8 8.2h8M12 8.2v7.6" {...p} strokeWidth={2.1} />
        </svg>
      );
    case 'alskom': // ustma-ust doiralar
      return (
        <svg viewBox="0 0 24 24" width={24} height={24} className="h-6 w-6">
          <circle cx="9.6" cy="12" r="5.6" {...p} strokeWidth={2} />
          <circle cx="14.4" cy="12" r="5.6" {...p} strokeWidth={2} opacity=".5" />
        </svg>
      );
    case 'kapital': // "K"
      return (
        <svg viewBox="0 0 24 24" width={24} height={24} className="h-6 w-6">
          <path d="M7 4v16M7 12l7.5-8M7 12l7.5 8" {...p} strokeWidth={2.3} />
        </svg>
      );
  }
}

// `src` — real brend logosi (/public/partners/*.png). Yo'q bo'lsa `logo` SVG-belgisi (fallback).
const PARTNERS: { name: string; type: PartnerType; logo: LogoId; color: string; src?: string }[] = [
  { name: 'Kafil Sug‘urta', type: 'sugurta', logo: 'kafil', color: '#CF3337', src: '/partners/kafil.png' },
  { name: 'Ipoteka Bank', type: 'bank', logo: 'ipoteka', color: '#1E4FA3', src: '/partners/ipoteka.png' },
  { name: 'Uzum Nasiya', type: 'nasiya', logo: 'uzum', color: '#7C3AED', src: '/partners/uzum.png' },
  { name: 'Apex Insurance', type: 'sugurta', logo: 'apex', color: '#0D9488', src: '/partners/apex.png' },
  { name: 'Aloqabank', type: 'bank', logo: 'aloqa', color: '#2563EB', src: '/partners/aloqa.png' },
  { name: 'Payme', type: 'tolov', logo: 'payme', color: '#17B6B6', src: '/partners/payme.png' },
  { name: 'Anorbank', type: 'bank', logo: 'anor', color: '#E11D48', src: '/partners/anor.png' },
  { name: 'Gross Insurance', type: 'sugurta', logo: 'gross', color: '#059669', src: '/partners/gross.png' },
  { name: 'Click', type: 'tolov', logo: 'click', color: '#1877F2', src: '/partners/click.png' },
  { name: 'TBC Bank', type: 'bank', logo: 'tbc', color: '#1B75BB', src: '/partners/tbc.png' },
  { name: 'Alskom', type: 'sugurta', logo: 'alskom', color: '#0891B2', src: '/partners/alskom.png' },
  { name: 'Kapitalbank', type: 'bank', logo: 'kapital', color: '#F5821F' },
];

/** Moliyaviy hamkorlar — silliq, sekin cheksiz karusel. Hover'da to'xtaydi, reduced-motion'da statik. */
export async function FinancialPartners() {
  const t = await getTranslations('home');
  const tt = await getTranslations('home.partnerTypes');

  const card = (p: (typeof PARTNERS)[number], key: string) => {
    const cfg = TYPE[p.type];
    return (
      <div
        key={key}
        className="group flex shrink-0 items-center gap-3 rounded-2xl border border-line bg-surface px-5 py-3.5 shadow-sm transition hover:-translate-y-0.5 hover:border-brand/30 hover:shadow-card"
      >
        {p.src ? (
          // Real brend logosi — doim oq taylda (dark mode'da ham o'qiladi)
          <span className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-xl bg-white ring-1 ring-inset ring-line/70">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.src} alt={p.name} width={28} height={28} decoding="async" className="h-7 w-7 object-contain" />
          </span>
        ) : (
          // Dizayn qilingan belgi (fallback) — brend rangida tint
          <span
            className="grid h-11 w-11 shrink-0 place-items-center rounded-xl ring-1 ring-inset ring-line/70"
            style={{ color: p.color, backgroundColor: `${p.color}14` }}
          >
            <Mark id={p.logo} />
          </span>
        )}
        <span className="flex flex-col leading-tight">
          <span className="font-display text-sm font-bold text-navy">{p.name}</span>
          <span className="mt-0.5 inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-muted">
            <cfg.Icon className={`h-3 w-3 ${cfg.dot}`} /> {tt(p.type)}
          </span>
        </span>
      </div>
    );
  };

  // Ikki bir xil track → uzilishsiz loop; sekin (55s) + linear = silliq.
  const track = (n: number) => (
    <div
      className="marquee-track flex shrink-0 items-center gap-5 pr-5"
      style={{ animationDuration: '55s' }}
      aria-hidden={n > 0}
    >
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

      <div className="marquee-mask relative mt-8 flex overflow-hidden">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-bg to-transparent sm:w-28" aria-hidden />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-bg to-transparent sm:w-28" aria-hidden />
        {track(0)}
        {track(1)}
      </div>
    </section>
  );
}
