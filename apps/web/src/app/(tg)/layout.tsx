import { TgApp } from '@/components/tg/tg-app';

// Mini app to'liq klient (Telegram SDK) — statik render qilinmasin.
export const dynamic = 'force-dynamic';

export default function TgGroupLayout({ children }: { children: React.ReactNode }) {
  return <TgApp>{children}</TgApp>;
}
