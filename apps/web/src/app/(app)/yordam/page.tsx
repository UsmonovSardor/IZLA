import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { ChevronDown, LifeBuoy } from 'lucide-react';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('faq');
  return { title: t('title'), description: t('subtitle'), alternates: { canonical: '/yordam' } };
}

export default async function FaqPage() {
  const t = await getTranslations('faq');
  const items = [1, 2, 3, 4, 5, 6].map((n) => ({ q: t(`q${n}`), a: t(`a${n}`) }));
  return (
    <div className="container-wide max-w-3xl py-10 md:py-16">
      <div className="flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-2xl bg-brand-50 text-brand"><LifeBuoy size={22} /></div>
        <div>
          <h1 className="font-display text-2xl font-bold text-navy md:text-3xl">{t('title')}</h1>
          <p className="mt-0.5 text-slate2">{t('subtitle')}</p>
        </div>
      </div>

      <div className="mt-8 space-y-3">
        {items.map((it, i) => (
          <details key={i} className="group rounded-2xl border border-line bg-surface px-5 py-4 [&_svg]:open:rotate-180">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-display font-semibold text-navy">
              {it.q}
              <ChevronDown className="h-5 w-5 shrink-0 text-slate2 transition-transform" />
            </summary>
            <p className="mt-3 text-sm leading-relaxed text-slate2">{it.a}</p>
          </details>
        ))}
      </div>
    </div>
  );
}
