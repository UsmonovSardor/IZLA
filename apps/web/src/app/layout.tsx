import type { Metadata, Viewport } from 'next';
import { Sora, Inter, JetBrains_Mono } from 'next/font/google';
import Link from 'next/link';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages, getTranslations } from 'next-intl/server';
import { Search, Home, Sparkles, User } from 'lucide-react';
import { AuthProvider } from '@/components/auth-provider';
import { HeaderAuth } from '@/components/header-auth';
import { HeroMarquee } from '@/components/hero-marquee';
import { LanguageSwitcher } from '@/components/language-switcher';
import { Logo } from '@/components/logo';
import { SmoothScroll } from '@/components/smooth-scroll';
import { AiAssistant } from '@/components/ai-assistant';
import { PwaRegister } from '@/components/pwa-register';
import { Analytics } from '@/components/analytics';
import { JsonLd } from '@/components/json-ld';
import { SITE_URL, organizationJsonLd, websiteJsonLd } from '@/lib/seo';
import './globals.css';

const OG_LOCALE: Record<string, string> = { uz: 'uz_UZ', ru: 'ru_RU', en: 'en_US' };

const sora = Sora({ subsets: ['latin'], variable: '--font-sora', display: 'swap' });
const inter = Inter({ subsets: ['latin', 'cyrillic'], variable: '--font-inter', display: 'swap' });
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono', display: 'swap' });

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('metadata');
  const locale = await getLocale();
  const title = t('title');
  const description = t('description');
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: title, template: '%s — Izla.uz' },
    description,
    applicationName: 'Izla.uz',
    manifest: '/manifest.webmanifest',
    keywords: ['izla', 'xizmatlar', 'online bron', 'klinika', 'stomatologiya', 'salon', 'restoran', 'fitnes', 'uy-joy', 'Toshkent', "O'zbekiston"],
    authors: [{ name: 'Izla.uz' }],
    openGraph: {
      type: 'website',
      siteName: 'Izla.uz',
      title,
      description,
      url: SITE_URL,
      locale: OG_LOCALE[locale] ?? 'uz_UZ',
    },
    twitter: { card: 'summary_large_image', title, description },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1, 'max-video-preview': -1 },
    },
    formatDetection: { telephone: true },
  };
}

export const viewport: Viewport = {
  themeColor: '#2563EB',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const messages = await getMessages();
  const t = await getTranslations();

  const navLinks = [
    { href: '/qidiruv', label: t('nav.search') },
    { href: '/uylar', label: t('nav.realEstate') },
    { href: '/bron', label: t('nav.bookings') },
    { href: '/tg', label: t('nav.telegram') },
  ];
  const mobileTabs = [
    { href: '/', icon: Home, label: t('mobileNav.home') },
    { href: '/qidiruv', icon: Search, label: t('mobileNav.search') },
    { href: '/uylar', icon: Sparkles, label: t('mobileNav.realEstate') },
    { href: '/profil', icon: User, label: t('mobileNav.profile') },
  ];

  return (
    <html lang={locale} className={`${sora.variable} ${inter.variable} ${mono.variable}`}>
      <body className="font-sans min-h-screen bg-bg bg-aurora-soft pb-20 md:pb-0">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <SmoothScroll />
          <JsonLd data={[organizationJsonLd(), websiteJsonLd()]} />
          <AuthProvider>
            {/* Qiymat-taklif lentasi — eng tepada (navbar'dan yuqorida), kafil uslubi */}
            <HeroMarquee />

            <header className="sticky top-0 z-40 border-b border-white/50 bg-white/70 backdrop-blur-xl">
              <div className="container-wide h-16 flex items-center justify-between gap-4">
                <Link href="/" aria-label="Izla.uz" className="shrink-0">
                  <Logo />
                </Link>
                <nav className="hidden md:flex items-center gap-1 text-sm font-medium text-ink">
                  {navLinks.map((l) => (
                    <Link
                      key={l.href}
                      href={l.href}
                      className="rounded-full px-4 py-2 text-slate2 transition hover:bg-brand-50 hover:text-brand"
                    >
                      {l.label}
                    </Link>
                  ))}
                </nav>
                <div className="flex items-center gap-2">
                  <LanguageSwitcher />
                  <HeaderAuth />
                </div>
              </div>
            </header>

            <main>{children}</main>

            {/* AI yordamchi — global suzuvchi widget (pastki-o'ng) */}
            <AiAssistant />

            {/* PWA: service worker registratsiyasi + o'rnatish banneri */}
            <PwaRegister />

            {/* Analitika (PostHog — kalitsiz o'chiq) */}
            <Analytics />

            {/* Footer */}
            <footer className="mt-20 border-t border-line bg-white/60">
              <div className="container-wide py-10 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-slate2">
                <div className="flex items-center gap-2">
                  <Logo />
                </div>
                <p>
                  © {new Date().getFullYear()} Izla.uz — {t('footer.tagline')}
                </p>
                <div className="flex items-center gap-4">
                  <Link href="/qidiruv" className="hover:text-brand">
                    {t('nav.search')}
                  </Link>
                  <Link href="/uylar" className="hover:text-brand">
                    {t('nav.realEstate')}
                  </Link>
                  <Link href="/tg" className="hover:text-brand">
                    {t('nav.telegram')}
                  </Link>
                </div>
              </div>
            </footer>

            {/* Mobil bottom-nav (TZ: mobil-birinchi) */}
            <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-white/50 bg-white/80 backdrop-blur-xl grid grid-cols-4 h-16">
              {mobileTabs.map((tab) => (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className="flex flex-col items-center justify-center gap-0.5 text-[11px] text-slate2 hover:text-brand"
                >
                  <tab.icon className="h-5 w-5" />
                  {tab.label}
                </Link>
              ))}
            </nav>
          </AuthProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
