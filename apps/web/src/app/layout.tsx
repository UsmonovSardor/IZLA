import type { Metadata, Viewport } from 'next';
import { Sora, Inter, JetBrains_Mono } from 'next/font/google';
import Link from 'next/link';
import { Search, Home, Sparkles, User } from 'lucide-react';
import { AuthProvider } from '@/components/auth-provider';
import { HeaderAuth } from '@/components/header-auth';
import { Logo } from '@/components/logo';
import './globals.css';

const sora = Sora({ subsets: ['latin'], variable: '--font-sora', display: 'swap' });
const inter = Inter({ subsets: ['latin', 'cyrillic'], variable: '--font-inter', display: 'swap' });
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono', display: 'swap' });

export const metadata: Metadata = {
  title: 'Izla.uz — Barcha xizmatlar bitta ilovada',
  description: 'O‘zbekiston №1 xizmatlar super-platformasi. Qidiring, xaritadan toping, online bron qiling.',
  manifest: '/manifest.webmanifest',
};

export const viewport: Viewport = {
  themeColor: '#2563EB',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uz" className={`${sora.variable} ${inter.variable} ${mono.variable}`}>
      <body className="font-sans min-h-screen pb-20 md:pb-0">
        <AuthProvider>
          <header className="sticky top-0 z-40 bg-surface/90 backdrop-blur border-b border-line">
            <div className="mx-auto max-w-6xl px-4 h-16 flex items-center justify-between">
              <Link href="/" aria-label="Izla.uz bosh sahifa">
                <Logo />
              </Link>
              <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-ink">
                <Link href="/qidiruv" className="hover:text-brand">Qidiruv</Link>
                <Link href="/uylar" className="hover:text-brand">Ko‘chmas mulk</Link>
                <Link href="/bron" className="hover:text-brand">Bronlarim</Link>
                <Link href="/tg" className="hover:text-brand">Telegram</Link>
              </nav>
              <HeaderAuth />
            </div>
          </header>

          <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>

          {/* Mobil bottom-nav (TZ: mobil-birinchi) */}
          <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-surface border-t border-line grid grid-cols-4 h-16">
            {[
              { href: '/', icon: Home, label: 'Asosiy' },
              { href: '/qidiruv', icon: Search, label: 'Qidiruv' },
              { href: '/uylar', icon: Sparkles, label: 'Uylar' },
              { href: '/profil', icon: User, label: 'Profil' },
            ].map((t) => (
              <Link key={t.href} href={t.href} className="flex flex-col items-center justify-center gap-0.5 text-[11px] text-slate2 hover:text-brand">
                <t.icon className="h-5 w-5" />
                {t.label}
              </Link>
            ))}
          </nav>
        </AuthProvider>
      </body>
    </html>
  );
}
