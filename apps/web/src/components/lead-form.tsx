'use client';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from './ui/button';
import { api } from '@/lib/api';

export function LeadForm({ propertyId }: { propertyId: string }) {
  const t = useTranslations('realEstate');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('+998');
  const [msg, setMsg] = useState('');
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${api.base}/properties/${propertyId}/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, message: msg }),
      });
      if (!res.ok) throw new Error('error');
      setDone(true);
    } catch {
      setError(t('leadError'));
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-lg border border-success/30 bg-success/5 p-4 text-center">
        <p className="font-semibold text-success">{t('leadDone')}</p>
        <p className="text-sm text-muted mt-1">{t('leadDoneSub')}</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="rounded-lg border border-line bg-surface p-4 shadow-card space-y-3">
      <h3 className="font-display font-bold text-navy">{t('leadTitle')}</h3>
      <input required value={name} onChange={(e) => setName(e.target.value)} placeholder={t('leadName')}
        className="w-full rounded-md border border-line px-3 py-2.5 text-sm outline-none focus:border-brand" />
      <input required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+998 XX XXX XX XX"
        className="w-full rounded-md border border-line px-3 py-2.5 text-sm outline-none focus:border-brand" />
      <textarea value={msg} onChange={(e) => setMsg(e.target.value)} placeholder={t('leadQuestion')} rows={2}
        className="w-full rounded-md border border-line px-3 py-2.5 text-sm outline-none focus:border-brand" />
      {error && <p className="text-sm text-danger">{error}</p>}
      <Button className="w-full" disabled={loading}>{loading ? t('leadSending') : t('leadSubmit')}</Button>
    </form>
  );
}
