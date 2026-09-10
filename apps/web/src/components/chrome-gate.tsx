'use client';
import { usePathname } from 'next/navigation';

/**
 * Sayt "chrome"ini (marquee, header, footer, mobil-nav, widgetlar) `/tg` (Telegram
 * Mini App) ostida YASHIRADI — mini app o'zining native shell'ini beradi. Boshqa
 * barcha sahifalarda to'liq sayt tuzilishi o'zgarishsiz render bo'ladi.
 */
export function ChromeGate({
  skipLink,
  marquee,
  header,
  extras,
  footer,
  mobileNav,
  children,
}: {
  skipLink: React.ReactNode;
  marquee: React.ReactNode;
  header: React.ReactNode;
  extras: React.ReactNode;
  footer: React.ReactNode;
  mobileNav: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isMiniApp = pathname === '/tg' || pathname?.startsWith('/tg/');

  if (isMiniApp) {
    // Mini app: chrome yo'q — sahifa o'z shell'ini (tg layout) beradi.
    return <>{children}</>;
  }

  return (
    <>
      {skipLink}
      {marquee}
      {header}
      <main id="main" tabIndex={-1} className="pb-20 md:pb-0">
        {children}
      </main>
      {extras}
      {footer}
      {mobileNav}
    </>
  );
}
