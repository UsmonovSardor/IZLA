import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { FileText } from 'lucide-react';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('legal');
  return { title: t('termsTitle'), alternates: { canonical: '/shartlar' } };
}

export default async function TermsPage() {
  const t = await getTranslations('legal');
  const sections = [1, 2, 3, 4, 5].map((n) => ({ h: t(`t${n}h`), b: t(`t${n}b`) }));
  return (
    <div className="container-wide max-w-3xl py-10 md:py-16">
      <div className="flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-2xl bg-brand-50 text-brand"><FileText size={22} /></div>
        <div>
          <h1 className="font-display text-2xl font-bold text-navy md:text-3xl">{t('termsTitle')}</h1>
          <p className="mt-0.5 text-sm text-slate2">{t('updated')}: {t('updatedDate')}</p>
        </div>
      </div>
      <div className="mt-8 space-y-7">
        {sections.map((s, i) => (
          <section key={i}>
            <h2 className="font-display text-lg font-bold text-navy">{s.h}</h2>
            <p className="mt-2 leading-relaxed text-slate2">{s.b}</p>
          </section>
        ))}
      </div>
    </div>
  );
}
