'use client';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { CheckCircle2 } from 'lucide-react';
import { haptic } from '@/lib/telegram';
import { Sheet, TgButton } from './tg-ui';

/** Umumiy lead (ariza) sheet — ism + telefon. `submit` async, xatoni qaytaradi. */
export function LeadSheet({
  open,
  onClose,
  title,
  summary,
  submit,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  summary?: React.ReactNode;
  submit: (name: string, phone: string) => Promise<void>;
}) {
  const t = useTranslations('tg');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('+998');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  async function go() {
    if (!name.trim() || phone.trim().length < 7) return;
    setBusy(true);
    setError('');
    try {
      await submit(name.trim(), phone.trim());
      haptic.notify('success');
      setDone(true);
    } catch (e) {
      haptic.notify('error');
      setError(e instanceof Error ? e.message : 'Xatolik');
    } finally {
      setBusy(false);
    }
  }

  function close() {
    setDone(false);
    setError('');
    onClose();
  }

  return (
    <Sheet open={open} onClose={close} title={done ? undefined : title}>
      {done ? (
        <div className="flex flex-col items-center py-6 text-center">
          <CheckCircle2 className="h-16 w-16 text-teal-500" />
          <p className="mt-4 font-display text-lg font-bold text-navy">{t('common.applyDone')}</p>
          <div className="mt-5 w-full">
            <TgButton full onClick={close}>{t('vendor.ok')}</TgButton>
          </div>
        </div>
      ) : (
        <>
          {summary && <div className="mb-4">{summary}</div>}
          <div className="space-y-3">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('common.name')}
              className="w-full rounded-2xl border border-line bg-bg px-4 py-3.5 text-[15px] text-ink outline-none focus:border-brand"
            />
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              inputMode="tel"
              placeholder={t('common.phone')}
              className="w-full rounded-2xl border border-line bg-bg px-4 py-3.5 text-[15px] text-ink outline-none focus:border-brand"
            />
          </div>
          {error && <p className="mt-2 text-center text-[13px] text-danger">{error}</p>}
          <div className="mt-4">
            <TgButton full size="lg" loading={busy} disabled={!name.trim() || phone.trim().length < 7} onClick={go}>
              {t('common.send')}
            </TgButton>
          </div>
        </>
      )}
    </Sheet>
  );
}
