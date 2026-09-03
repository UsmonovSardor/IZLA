import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { PartnerPortal } from '@/components/partner/portal';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('biznes');
  return {
    title: t('portal.metaTitle'),
    description: t('portal.metaDesc'),
    robots: { index: false }, // shaxsiy kabinet — indekslanmaydi
  };
}

export default function BiznesKabinetPage() {
  return (
    <div className="container-wide">
      <PartnerPortal />
    </div>
  );
}
