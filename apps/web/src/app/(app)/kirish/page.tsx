'use client';
import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/components/auth-provider';
import { LoginForm } from '@/components/login-form';
import { LogoMark } from '@/components/logo';

const ERROR_KEY: Record<string, string> = {
  google_off: 'googleOff',
  google_state: 'googleState',
  google_failed: 'googleFailed',
};

function KirishInner() {
  const { user, loading, providers, applyUser, refreshUser } = useAuth();
  const t = useTranslations('auth');
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get('next') || '/';
  const [finishing, setFinishing] = useState(params.get('ok') === '1');
  const error = params.get('error');
  const errorMsg = error && ERROR_KEY[error] ? t(ERROR_KEY[error]) : null;

  // Google redirect keyin: cookie o'rnatilgan → sessiyani tiklaymiz
  useEffect(() => {
    if (params.get('ok') !== '1') return;
    void refreshUser().then((u) => {
      if (u) router.replace(next);
      else setFinishing(false);
    });
  }, [params, refreshUser, router, next]);

  // Allaqachon kirgan bo'lsa — yo'naltiramiz
  useEffect(() => {
    if (!loading && user && !finishing) router.replace(next);
  }, [loading, user, finishing, router, next]);

  if (finishing || (loading && !error)) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center gap-2 text-muted">
        <Loader2 className="h-5 w-5 animate-spin" /> {t('signingIn')}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-sm py-10">
      <div className="rounded-2xl border border-line bg-surface p-6 shadow-card">
        <div className="mb-5 text-center">
          <LogoMark size={52} variant="tile" animate="drop" className="mx-auto" />
          <h1 className="mt-3 font-display text-xl font-bold text-navy">{t('welcome')}</h1>
          <p className="text-sm text-muted">{t('welcomeSub')}</p>
        </div>
        {errorMsg && (
          <p className="mb-4 rounded-lg bg-danger/5 px-3 py-2 text-sm text-danger">{errorMsg}</p>
        )}
        <LoginForm
          providers={providers}
          onSuccess={(u) => {
            applyUser(u);
            router.replace(next);
          }}
        />
      </div>
    </div>
  );
}

export default function KirishPage() {
  const tc = useTranslations('common');
  return (
    <Suspense fallback={<div className="py-16 text-center text-muted">{tc('loading')}</div>}>
      <KirishInner />
    </Suspense>
  );
}
