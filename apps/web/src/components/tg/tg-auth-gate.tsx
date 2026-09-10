'use client';
import { useTranslations } from 'next-intl';
import { Lock } from 'lucide-react';
import { useAuth } from '@/components/auth-provider';
import { TgSpinner, TgEmpty, TgButton } from './tg-ui';

/** Avtorizatsiya talab qiladigan tab'lar uchun. Telegram ichida sessiya avtomatik ochiladi. */
export function TgAuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading, openLogin } = useAuth();
  const t = useTranslations('tg.auth');

  if (loading) return <TgSpinner className="py-24" />;
  if (!user) {
    return (
      <div className="flex flex-col items-center">
        <TgEmpty icon={Lock} title={t('needTitle')} sub={t('needSub')} />
        <TgButton onClick={() => openLogin()}>{t('login')}</TgButton>
      </div>
    );
  }
  return <>{children}</>;
}
