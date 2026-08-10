'use client';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { api, type PaymentProviderId } from '@/lib/api';
import { useAuth } from './auth-provider';

const PROVIDERS: { id: PaymentProviderId; label: string; cls: string }[] = [
  { id: 'PAYME', label: 'Payme', cls: 'bg-[#00c4b4] hover:bg-[#00b0a2]' },
  { id: 'CLICK', label: 'Click', cls: 'bg-[#0a74e4] hover:bg-[#0a66c8]' },
];

/**
 * Payme / Click checkout tugmalari. Invoice yaratadi va provayder to'lov
 * sahifasiga yo'naltiradi. Muvaffaqiyatdan so'ng foydalanuvchi /bron'ga qaytadi.
 */
export function PayButtons({ bookingId, label = 'Oldindan to‘lash' }: { bookingId: string; label?: string }) {
  const { user, openLogin } = useAuth();
  const [paying, setPaying] = useState<PaymentProviderId | null>(null);
  const [error, setError] = useState('');

  async function start(provider: PaymentProviderId) {
    if (!user) {
      openLogin();
      return;
    }
    setPaying(provider);
    setError('');
    try {
      const inv = await api.createPayment({ bookingId, provider });
      window.location.href = inv.checkoutUrl;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'To‘lovni boshlab bo‘lmadi');
      setPaying(null);
    }
  }

  return (
    <div>
      {label && <p className="text-xs font-medium text-slate2 mb-1.5">{label}</p>}
      <div className="grid grid-cols-2 gap-2">
        {PROVIDERS.map((p) => (
          <button
            key={p.id}
            disabled={paying !== null}
            onClick={() => start(p.id)}
            className={`flex items-center justify-center gap-2 rounded-md px-3 py-2.5 text-sm font-semibold text-white transition disabled:opacity-60 ${p.cls}`}
          >
            {paying === p.id ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {p.label}
          </button>
        ))}
      </div>
      {error && <p className="mt-1.5 text-sm text-danger">{error}</p>}
    </div>
  );
}
