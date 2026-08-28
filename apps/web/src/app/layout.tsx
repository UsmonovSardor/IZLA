import type { Metadata, Viewport } from 'next';
import { Sora, Inter } from 'next/font/google';
import Link from 'next/link';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages, getTranslations } from 'next-intl/server';
import { Search, Home, Sparkles, User } from 'lucide-react';
import { AuthProvider } from '@/components/auth-provider';
import { FavoritesProvider } from '@/components/favorites-provider';
import { SavedJobsProvider } from '@/components/saved-jobs-provider';
import { ToastProvider } from '@/components/toast';
import { HeaderAuth } from '@/components/header-auth';
import { HeaderBack } from '@/components/header-back';
import { HeroMarquee } from '@/components/hero-marquee';
import { LanguageSwitcher } from '@/components/language-switcher';
import { FavoritesNavIcon } from '@/components/favorites-nav-icon';
import { NotificationsBell } from '@/components/notifications-bell';
import { Footer } from '@/components/footer';
import { Logo } from '@/components/logo';
import { SmoothScroll } from '@/components/smooth-scroll';
import { DeferredWidgets } from '@/components/deferred-widgets';
import { PwaRegister } from '@/components/pwa-register';
import { Analytics } from '@/components/analytics';
import { JsonLd } from '@/components/json-ld';
import { SITE_URL, organizationJsonLd, websiteJsonLd } from '@/lib/seo';
import './globals.css';

const OG_LOCALE: Record<string, string> = { uz: 'uz_UZ', ru: 'ru_RU', en: 'en_US' };

const sora = Sora({ subsets: ['latin'], variable: '--font-sora', display: 'swap' });
const inter = Inter({ subsets: ['latin', 'cyrillic'], variable: '--font-inter', display: 'swap' });

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
  // maximumScale/userScalable QO'YILMAYDI — a11y: foydalanuvchi pinch-zoom qila olsin
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const messages = await getMessages();
  const t = await getTranslations();

  const navLinks = [
    { href: '/qidiruv', label: t('nav.search') },
    { href: '/ish', label: t('nav.jobs') },
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
    <html lang={locale} className={`${sora.variable} ${inter.variable}`}>
      <body className="font-sans min-h-screen bg-bg bg-aurora-soft pb-20 md:pb-0">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <SmoothScroll />
          <JsonLd data={[organizationJsonLd(), websiteJsonLd()]} />
          <ToastProvider>
          <AuthProvider>
          <FavoritesProvider>
          <SavedJobsProvider>
            {/* Qiymat-taklif lentasi — eng tepada (navbar'dan yuqorida), kafil uslubi */}
            <HeroMarquee />

            <header className="sticky top-0 z-40 border-b border-white/50 bg-white/70 backdrop-blur-xl">
              <div className="container-wide h-16 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 shrink-0">
                  <HeaderBack />
                  <Link href="/" aria-label="Izla.uz" className="shrink-0">
                    <Logo />
                  </Link>
                </div>
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
                  <NotificationsBell />
                  <FavoritesNavIcon />
                  <LanguageSwitcher />
                  <HeaderAuth />
                </div>
              </div>
            </header>

            <main>{children}</main>

            {/* ⌘K panel + AI yordamchi — initial bundle'dan chiqarilgan, idle'da yuklanadi */}
            <DeferredWidgets />

            {/* PWA: service worker registratsiyasi + o'rnatish banneri */}
            <PwaRegister />

            {/* Analitika (PostHog — kalitsiz o'chiq) */}
            <Analytics />

            {/* Footer */}
            <Footer />

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
          </SavedJobsProvider>
          </FavoritesProvider>
          </AuthProvider>
          </ToastProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
