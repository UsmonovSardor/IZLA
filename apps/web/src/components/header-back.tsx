'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ArrowLeft } from 'lucide-react';

/** Header'dagi global "Orqaga" strelkasi — bosh sahifadan tashqari har joyda. */
export function HeaderBack() {
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations('common');

  // Bosh sahifada orqaga kerak emas
  if (pathname === '/') return null;

  const onClick = () => {
    // Tarix bo'lsa orqaga, aks holda bosh sahifaga (to'g'ridan-to'g'ri kirilgan bo'lsa)
    if (typeof window !== 'undefined' && window.history.length > 1) router.back();
    else router.push('/');
  };

  return (
    <button
      onClick={onClick}
      aria-label={t('back')}
      title={t('back')}
      className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-line bg-white text-slate2 transition hover:border-brand-200 hover:bg-brand-50 hover:text-brand active:scale-95"
    >
      <ArrowLeft size={18} />
    </button>
  );
}
