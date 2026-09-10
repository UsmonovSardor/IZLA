'use client';
import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { CreditCard, BadgeCheck, Star } from 'lucide-react';
import { api, type NasiyaProvider, type NasiyaQuoteRow } from '@/lib/api';
import { formatUZS } from '@/lib/utils';
import { haptic } from '@/lib/telegram';
import { useAuth } from '@/components/auth-provider';
import { TgScreen } from '@/components/tg/tg-screen';
import { Chip, Skel, TgButton, TgEmpty } from '@/components/tg/tg-ui';
import { LeadSheet } from '@/components/tg/lead-sheet';

const DEFAULT_MONTHS = [3, 6, 9, 12, 18, 24];

export default function TgNasiya() {
  const t = useTranslations('tg');
  const { user, openLogin } = useAuth();
  const [providers, setProviders] = useState<NasiyaProvider[]>([]);
  const [amount, setAmount] = useState(5_000_000);
  const [months, setMonths] = useState(12);
  const [rows, setRows] = useState<NasiyaQuoteRow[] | null>(null);
  const [lead, setLead] = useState<NasiyaQuoteRow | null>(null);

  useEffect(() => {
    api.nasiyaProviders().then(setProviders).catch(() => setProviders([]));
  }, []);

  const termChips = useMemo(() => {
    const set = new Set<number>();
    providers.forEach((p) => p.months.forEach((m) => set.add(m)));
    const arr = [...set].sort((a, b) => a - b);
    return arr.length ? arr : DEFAULT_MONTHS;
  }, [providers]);

  useEffect(() => {
    let alive = true;
    setRows(null);
    const h = setTimeout(() => {
      if (amount < 100_000) { setRows([]); return; }
      api.nasiyaQuote(amount, months).then((r) => alive && setRows(r)).catch(() => alive && setRows([]));
    }, 300);
    return () => { alive = false; clearTimeout(h); };
  }, [amount, months]);

  function openApply(row: NasiyaQuoteRow) {
    if (!user) { openLogin({ onDone: () => setLead(row) }); return; }
    setLead(row);
  }

  return (
    <TgScreen title={t('nasiya.title')}>
      {/* Kalkulyator */}
      <div className="rounded-2xl border border-line bg-surface p-4">
        <label className="text-[13px] font-semibold text-muted">{t('nasiya.amount')}</label>
        <div className="mt-1.5 flex items-baseline gap-2">
          <input
            value={amount ? amount.toLocaleString('ru-RU') : ''}
            onChange={(e) => setAmount(Number(e.target.value.replace(/\D/g, '')) || 0)}
            inputMode="numeric"
            className="min-w-0 flex-1 bg-transparent font-display text-2xl font-bold text-navy outline-none"
          />
          <span className="shrink-0 text-sm text-muted">so‘m</span>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {[3_000_000, 5_000_000, 10_000_000, 20_000_000].map((a) => (
            <Chip key={a} active={amount === a} onClick={() => setAmount(a)}>{formatUZS(a)}</Chip>
          ))}
        </div>
        <label className="mt-4 block text-[13px] font-semibold text-muted">{t('nasiya.choose')}</label>
        <div className="mt-1.5 -mx-1 flex gap-2 overflow-x-auto px-1 pb-1 tg-noscroll">
          {termChips.map((m) => (
            <Chip key={m} active={months === m} onClick={() => setMonths(m)}>{t('common.months', { n: m })}</Chip>
          ))}
        </div>
      </div>

      {/* Kvotalar */}
      <div className="mt-4 space-y-3">
        {!rows ? (
          Array.from({ length: 4 }).map((_, i) => <Skel key={i} className="h-28 rounded-2xl" />)
        ) : rows.length === 0 ? (
          <TgEmpty icon={CreditCard} title={t('nasiya.emptyTitle')} sub={t('nasiya.calcHint')} />
        ) : (
          rows.map((r) => (
            <div key={r.provider.id} className={`rounded-2xl border border-line bg-surface p-4 ${!r.available ? 'opacity-55' : ''}`}>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-white font-bold" style={{ backgroundColor: r.provider.color || '#7C3AED' }}>
                    {r.provider.name.charAt(0)}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-display text-[15px] font-bold text-navy">{r.provider.name}</p>
                    <p className="flex items-center gap-1 text-[12px] text-muted"><Star className="h-3 w-3 fill-amber-400 text-amber-400" /> {r.provider.rating.toFixed(1)}</p>
                  </div>
                </div>
                {r.provider.popular && <BadgeCheck className="h-5 w-5 shrink-0 text-brand" />}
              </div>

              {r.available ? (
                <>
                  <div className="mt-3 flex items-end justify-between">
                    <div>
                      <p className="text-[12px] text-muted">{t('nasiya.monthly')}</p>
                      <p className="font-display text-xl font-bold text-navy">{formatUZS(r.monthlyPayment)}</p>
                    </div>
                    <div className="text-right text-[12px] text-muted">
                      <p>{t('nasiya.overpay')}: <span className="font-semibold text-ink">{formatUZS(r.overpayment)}</span></p>
                      <p>{t('nasiya.markup', { p: r.markupPct.toFixed(0) })}</p>
                    </div>
                  </div>
                  <div className="mt-3">
                    <TgButton size="sm" full onClick={() => openApply(r)}>{t('nasiya.apply')}</TgButton>
                  </div>
                </>
              ) : (
                <p className="mt-3 text-[13px] text-muted">{t('nasiya.notAvailable')}</p>
              )}
            </div>
          ))
        )}
      </div>

      <LeadSheet
        open={!!lead}
        onClose={() => setLead(null)}
        title={lead?.provider.name ?? ''}
        summary={
          lead ? (
            <div className="flex items-center justify-between rounded-2xl bg-bg px-4 py-3 text-[13px]">
              <span className="text-muted">{formatUZS(amount)} · {t('common.months', { n: months })}</span>
              <span className="font-display font-bold text-navy">{formatUZS(lead.monthlyPayment)}/{t('mortgage.perMonth')}</span>
            </div>
          ) : undefined
        }
        submit={async (name, phone) => {
          if (!lead) return;
          await api.applyNasiya({ providerId: lead.provider.id, amount, months, name, phone });
          haptic.notify('success');
        }}
      />
    </TgScreen>
  );
}
