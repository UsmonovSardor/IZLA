'use client';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { CreditCard } from 'lucide-react';
import { api, type PaymentProviderId } from '@/lib/api';
import { formatUZS } from '@/lib/utils';
import { haptic, openLink } from '@/lib/telegram';
import { Sheet, TgButton } from './tg-ui';

const PROVIDERS: { id: PaymentProviderId; label: string; color: string }[] = [
  { id: 'PAYME', label: 'Payme', color: '#17B6B6' },
  { id: 'CLICK', label: 'Click', color: '#1877F2' },
];

export function PaymentSheet({
  open,
  onClose,
  bookingId,
  amount,
}: {
  open: boolean;
  onClose: () => void;
  bookingId: string | null;
  amount: number;
}) {
  const t = useTranslations('tg.pay');
  const [loading, setLoading] = useState<PaymentProviderId | null>(null);
  const [error, setError] = useState('');

  async function pay(provider: PaymentProviderId) {
    if (!bookingId) return;
    setLoading(provider);
    setError('');
    try {
      const invoice = await api.createPayment({ bookingId, provider });
      haptic.notify('success');
      openLink(invoice.checkoutUrl);
      onClose();
    } catch (e) {
      haptic.notify('error');
      setError(e instanceof Error ? e.message : t('failed'));
    } finally {
      setLoading(null);
    }
  }

  return (
    <Sheet open={open} onClose={onClose} title={t('title')}>
      <div className="mb-4 flex items-center justify-between rounded-2xl bg-bg px-4 py-3">
        <span className="text-sm text-muted">{t('amount')}</span>
        <span className="font-display text-lg font-bold text-navy">{formatUZS(amount)}</span>
      </div>
      <p className="mb-3 flex items-center gap-1.5 text-[13px] text-muted">
        <CreditCard className="h-4 w-4" /> {t('choose')}
      </p>
      <div className="grid grid-cols-2 gap-3">
        {PROVIDERS.map((p) => (
          <button
            key={p.id}
            type="button"
            disabled={loading !== null}
            onClick={() => pay(p.id)}
            className="flex h-14 items-center justify-center rounded-2xl font-display text-base font-bold text-white transition active:scale-[0.97] disabled:opacity-50"
            style={{ backgroundColor: p.color }}
          >
            {loading === p.id ? t('redirecting') : p.label}
          </button>
        ))}
      </div>
      {error && <p className="mt-3 text-center text-[13px] text-danger">{error}</p>}
      <p className="mt-4 text-center text-[12px] text-muted">{t('secure')}</p>
      <div className="mt-3">
        <TgButton variant="ghost" full onClick={onClose}>
          {t('later')}
        </TgButton>
      </div>
    </Sheet>
  );
}
