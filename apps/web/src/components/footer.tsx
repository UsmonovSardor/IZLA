import { Link } from 'next-view-transitions';
import { getTranslations } from 'next-intl/server';
import { Instagram, Send, Facebook, ArrowUpRight } from 'lucide-react';
import { Logo } from '@/components/logo';

/** Kichkina O'zbekiston bayrog'i (inline SVG — emoji Windows'da "uz" bo'lib chiqadi). */
function UzFlag() {
  return (
    <svg viewBox="0 0 30 20" width="20" height="14" className="rounded-[3px] ring-1 ring-black/5" aria-hidden>
      <rect width="30" height="20" fill="#fff" />
      <rect width="30" height="6.2" fill="#0099B5" />
      <rect width="30" height="6.2" y="13.8" fill="#1EB53A" />
      <rect width="30" height="0.8" y="6.2" fill="#CE1126" />
      <rect width="30" height="0.8" y="13" fill="#CE1126" />
      <circle cx="6" cy="3.1" r="1.9" fill="#fff" />
      <circle cx="7" cy="3.1" r="1.9" fill="#0099B5" />
    </svg>
  );
}

/**
 * Ko'p-ustunli footer — YORQIN va naqshli (nozik nuqta-grid + yumshoq brend nuri).
 * Mavzuga mos: light rejimda ochiq, dark rejimda token'lar avtomatik to'qlashadi.
 */
export async function Footer() {
  const t = await getTranslations('footer');
  const tn = await getTranslations('nav');
  const year = new Date().getFullYear();

  const cols: { title: string; links: { label: string; href: string }[] }[] = [
    {
      title: t('company'),
      links: [
        { label: t('about'), href: '/haqida' },
        { label: tn('business'), href: '/biznes' },
        { label: tn('partner'), href: '/hamkor' },
        { label: tn('pricing'), href: '/narxlar' },
        { label: t('careers'), href: '/ish' },
        { label: t('contact'), href: '/haqida#kontakt' },
      ],
    },
    {
      title: t('services'),
      links: [
        { label: tn('search'), href: '/qidiruv' },
        { label: tn('insurance'), href: '/sugurta' },
        { label: tn('mortgage'), href: '/ipoteka' },
        { label: tn('installment'), href: '/nasiya' },
        { label: tn('jobs'), href: '/ish' },
        { label: tn('realEstate'), href: '/uylar' },
        { label: t('byDistrict'), href: '/xizmatlar' },
        { label: t('invite'), href: '/taklif' },
      ],
    },
    {
      title: t('help'),
      links: [
        { label: t('faq'), href: '/yordam' },
        { label: t('terms'), href: '/shartlar' },
        { label: t('privacy'), href: '/maxfiylik' },
      ],
    },
  ];

  const socials = [
    { Icon: Instagram, href: 'https://instagram.com', label: 'Instagram' },
    { Icon: Send, href: 'https://t.me/IzlaXizmat_bot', label: 'Telegram' },
    { Icon: Facebook, href: 'https://facebook.com', label: 'Facebook' },
  ];

  return (
    <footer className="relative mt-20 overflow-hidden border-t border-line bg-bg">
      {/* Yuqori brend aksent chizig'i */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-brand/50 to-transparent" />
      {/* Nozik nuqta-grid naqsh */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          backgroundImage: 'radial-gradient(var(--c-line) 1px, transparent 1px)',
          backgroundSize: '22px 22px',
          maskImage: 'linear-gradient(to bottom, transparent, #000 22%, #000 82%, transparent)',
          WebkitMaskImage: 'linear-gradient(to bottom, transparent, #000 22%, #000 82%, transparent)',
        }}
      />
      {/* Yumshoq brend nuri */}
      <div aria-hidden className="pointer-events-none absolute -top-24 left-[14%] h-56 w-56 rounded-full bg-brand/[0.07] blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -top-16 right-[12%] h-48 w-48 rounded-full bg-teal/[0.07] blur-3xl" />

      <div className="container-wide relative py-14">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1fr]">
          {/* Brend bloki */}
          <div className="md:col-span-2 lg:col-span-1">
            <Logo />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted">{t('blurb')}</p>

            {/* Telegram CTA */}
            <a
              href="https://t.me/IzlaXizmat_bot"
              target="_blank"
              rel="noopener noreferrer"
              className="group mt-6 inline-flex items-center gap-2 rounded-full bg-brand/[0.06] px-4 py-2.5 text-sm font-semibold text-brand ring-1 ring-brand/20 transition hover:bg-brand hover:text-white hover:ring-brand"
            >
              <Send className="h-4 w-4" />
              Telegram bot
              <ArrowUpRight className="h-3.5 w-3.5 opacity-60 transition group-hover:opacity-100" />
            </a>

            <div className="mt-6 flex gap-2.5">
              {socials.map(({ Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="grid h-9 w-9 place-items-center rounded-full border border-line bg-surface text-muted transition hover:border-brand hover:bg-brand hover:text-white"
                >
                  <Icon className="h-[17px] w-[17px]" />
                </a>
              ))}
            </div>
          </div>

          {/* Havola ustunlari */}
          {cols.map((col) => (
            <div key={col.title}>
              <h3 className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted">{col.title}</h3>
              <ul className="mt-4 space-y-3">
                {col.links.map((l) => (
                  <li key={l.href + l.label}>
                    <Link
                      href={l.href}
                      className="group inline-flex items-center gap-1.5 text-sm text-ink transition hover:text-brand"
                    >
                      <span className="h-1 w-1 rounded-full bg-teal opacity-0 transition group-hover:opacity-100" aria-hidden />
                      <span className="transition group-hover:translate-x-0.5">{l.label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Pastki qator */}
        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-line pt-7 text-sm text-muted sm:flex-row">
          <p>© {year} Izla.uz — {t('tagline')}</p>
          <p className="inline-flex items-center gap-2">
            {t('madeIn')} <UzFlag />
          </p>
        </div>
      </div>
    </footer>
  );
}
