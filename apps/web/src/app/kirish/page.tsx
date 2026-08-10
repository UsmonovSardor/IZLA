'use client';
import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/components/auth-provider';
import { LoginForm } from '@/components/login-form';

const ERRORS: Record<string, string> = {
  google_off: 'Google kirish hozircha yoqilmagan.',
  google_state: 'Google sessiyasi eskirgan. Qayta urinib ko‘ring.',
  google_failed: 'Google orqali kirish muvaffaqiyatsiz tugadi.',
};

function KirishInner() {
  const { user, loading, providers, applyUser, refreshUser } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get('next') || '/';
  const [finishing, setFinishing] = useState(params.get('ok') === '1');
  const error = params.get('error');

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
      <div className="flex min-h-[60vh] items-center justify-center gap-2 text-slate2">
        <Loader2 className="h-5 w-5 animate-spin" /> Kirilmoqda…
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-sm py-10">
      <div className="rounded-2xl border border-line bg-surface p-6 shadow-card">
        <div className="mb-5 text-center">
          <span className="grid h-12 w-12 mx-auto place-items-center rounded-xl bg-brand-gradient text-xl font-display font-bold text-white">
            i
          </span>
          <h1 className="mt-3 font-display text-xl font-bold text-navy">Xush kelibsiz</h1>
          <p className="text-sm text-slate2">Izla.uz hisobingizga kiring yoki ro‘yxatdan o‘ting</p>
        </div>
        {error && ERRORS[error] && (
          <p className="mb-4 rounded-lg bg-danger/5 px-3 py-2 text-sm text-danger">{ERRORS[error]}</p>
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
  return (
    <Suspense fallback={<div className="py-16 text-center text-slate2">Yuklanmoqda…</div>}>
      <KirishInner />
    </Suspense>
  );
}
