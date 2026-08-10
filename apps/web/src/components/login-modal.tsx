'use client';
import { useEffect } from 'react';
import { X } from 'lucide-react';
import { type AuthUser, type Providers } from '@/lib/auth';
import { LoginForm } from './login-form';
import { LogoMark } from './logo';

export function LoginModal({
  open,
  providers,
  onClose,
  onSuccess,
}: {
  open: boolean;
  providers: Providers;
  onClose: () => void;
  onSuccess: (u: AuthUser) => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-navy/40 backdrop-blur-sm animate-[fadeIn_.15s_ease]" onClick={onClose} />
      <div className="relative z-10 w-full max-w-sm rounded-t-2xl sm:rounded-2xl border border-line bg-surface p-6 shadow-xl animate-[slideUp_.2s_ease]">
        <button
          onClick={onClose}
          aria-label="Yopish"
          className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full text-slate2 hover:bg-bg hover:text-ink"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="mb-4 text-center">
          <LogoMark size={48} variant="tile" animate="drop" className="mx-auto" />
          <h2 className="mt-2 font-display text-lg font-bold text-navy">Izla.uz ga kirish</h2>
          <p className="text-sm text-slate2">Bron, sevimlilar va profil uchun</p>
        </div>
        <LoginForm providers={providers} onSuccess={onSuccess} />
      </div>
      <style jsx global>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { transform: translateY(12px); opacity: .6 } to { transform: translateY(0); opacity: 1 } }
      `}</style>
    </div>
  );
}
