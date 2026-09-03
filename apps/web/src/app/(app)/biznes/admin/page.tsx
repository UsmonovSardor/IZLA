import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { AdminDashboard } from '@/components/partner/admin-dashboard';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('biznes');
  return {
    title: t('admin.title'),
    robots: { index: false }, // ichki admin panel
  };
}

export default function BiznesAdminPage() {
  return (
    <div className="container-wide">
      <AdminDashboard />
    </div>
  );
}
