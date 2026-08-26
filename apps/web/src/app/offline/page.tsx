import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

export const dynamic = 'force-static';

export default async function OfflinePage() {
  const t = await getTranslations('pwa');
  return (
    <div className="py-24 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-3xl">
        📡
      </div>
      <h1 className="font-display text-3xl font-bold text-navy mt-6">{t('offlineTitle')}</h1>
      <p className="text-slate2 mt-3 max-w-sm mx-auto">{t('offlineBody')}</p>
      <Link href="/" className="mt-6 inline-block rounded-xl bg-brand px-5 py-2.5 font-medium text-white">
        {t('home')}
      </Link>
    </div>
  );
}
