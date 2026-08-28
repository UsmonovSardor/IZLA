import { Link } from 'next-view-transitions';
import { getTranslations } from 'next-intl/server';
import { Instagram, Send, Facebook } from 'lucide-react';
import { Logo } from '@/components/logo';

/** To'liq ko'p-ustunli footer — "katta kompaniya" ishonchi. */
export async function Footer() {
  const t = await getTranslations('footer');
  const tn = await getTranslations('nav');
  const year = new Date().getFullYear();

  const cols: { title: string; links: { label: string; href: string }[] }[] = [
    {
      title: t('company'),
      links: [
        { label: t('about'), href: '/haqida' },
        { label: tn('partner'), href: '/hamkor' },
        { label: t('careers'), href: '/ish' },
        { label: t('contact'), href: '/haqida#kontakt' },
      ],
    },
    {
      title: t('services'),
      links: [
        { label: tn('search'), href: '/qidiruv' },
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
    <footer className="mt-20 border-t border-line bg-surface/70">
      <div className="container-wide py-14">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          {/* Brend */}
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-slate2">{t('blurb')}</p>
            <div className="mt-5 flex gap-2">
              {socials.map(({ Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="grid h-9 w-9 place-items-center rounded-full border border-line text-slate2 transition hover:border-transparent hover:bg-brand hover:text-white"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Ustunlar */}
          {cols.map((col) => (
            <div key={col.title}>
              <h3 className="text-xs font-bold uppercase tracking-wide text-slate2">{col.title}</h3>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.href + l.label}>
                    <Link href={l.href} className="text-sm text-ink transition hover:text-brand">{l.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-line pt-6 text-sm text-slate2 sm:flex-row">
          <p>© {year} Izla.uz — {t('tagline')}</p>
          <p className="flex items-center gap-1.5">{t('madeIn')} <span aria-hidden>🇺🇿</span></p>
        </div>
      </div>
    </footer>
  );
}
