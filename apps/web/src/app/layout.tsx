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
      <body className="font-sans min-h-screen bg-bg bg-aurora-soft pb-20 md:pb-0">
        <AuthProvider>
          <header className="sticky top-0 z-40 border-b border-white/50 bg-white/70 backdrop-blur-xl">
            <div className="container-wide h-16 flex items-center justify-between gap-4">
              <Link href="/" aria-label="Izla.uz bosh sahifa" className="shrink-0">
                <Logo />
              </Link>
              <nav className="hidden md:flex items-center gap-1 text-sm font-medium text-ink">
                {[
                  { href: '/qidiruv', label: 'Qidiruv' },
                  { href: '/uylar', label: 'Ko‘chmas mulk' },
                  { href: '/bron', label: 'Bronlarim' },
                  { href: '/tg', label: 'Telegram' },
                ].map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    className="rounded-full px-4 py-2 text-slate2 transition hover:bg-brand-50 hover:text-brand"
                  >
                    {l.label}
                  </Link>
                ))}
              </nav>
              <HeaderAuth />
            </div>
          </header>

          <main>{children}</main>

          {/* Footer */}
          <footer className="mt-20 border-t border-line bg-white/60">
            <div className="container-wide py-10 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-slate2">
              <div className="flex items-center gap-2">
                <Logo />
              </div>
              <p>© {new Date().getFullYear()} Izla.uz — Barcha xizmatlar bitta ilovada.</p>
              <div className="flex items-center gap-4">
                <Link href="/qidiruv" className="hover:text-brand">Qidiruv</Link>
                <Link href="/uylar" className="hover:text-brand">Ko‘chmas mulk</Link>
                <Link href="/tg" className="hover:text-brand">Telegram</Link>
              </div>
            </div>
          </footer>

          {/* Mobil bottom-nav (TZ: mobil-birinchi) */}
          <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-white/50 bg-white/80 backdrop-blur-xl grid grid-cols-4 h-16">
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
