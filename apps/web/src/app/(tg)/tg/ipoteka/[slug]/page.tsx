'use client';
import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { BadgeCheck } from 'lucide-react';
import { api, type MortgageProgramDetail, type MortgageCalcResult } from '@/lib/api';
import { formatUZS } from '@/lib/utils';
import { haptic } from '@/lib/telegram';
import { useAuth } from '@/components/auth-provider';
import { TgScreen } from '@/components/tg/tg-screen';
import { Chip, Skel, TgButton } from '@/components/tg/tg-ui';
import { LeadSheet } from '@/components/tg/lead-sheet';

export default function TgMortgageDetail() {
  const t = useTranslations('tg');
  const params = useParams<{ slug: string }>();
  const slug = params?.slug;
  const { user, openLogin } = useAuth();

  const [prog, setProg] = useState<MortgageProgramDetail | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [price, setPrice] = useState(0);
  const [downPct, setDownPct] = useState(0);
  const [term, setTerm] = useState(0);
  const [calc, setCalc] = useState<MortgageCalcResult | null>(null);
  const [lead, setLead] = useState(false);

  useEffect(() => {
    if (!slug) return;
    api.mortgageProgram(slug).then((p) => {
      setProg(p);
      setPrice(p.preview.price || 500_000_000);
      setDownPct(p.minDownPct);
      setTerm(p.preview.termMonths || p.maxTermMonths);
    }).catch(() => setNotFound(true));
  }, [slug]);

  const termChips = useMemo(() => {
    if (!prog) return [];
    return [120, 180, 240, 300].filter((m) => m <= prog.maxTermMonths);
  }, [prog]);
  const downChips = useMemo(() => {
    if (!prog) return [];
    return [prog.minDownPct, 25, 40, 50].filter((v, i, a) => v >= prog.minDownPct && a.indexOf(v) === i);
  }, [prog]);

  useEffect(() => {
    if (!prog || !price) return;
    let alive = true;
    const h = setTimeout(() => {
      api.mortgageCalc({ programId: prog.id, price, downPct, termMonths: term })
        .then((r) => alive && setCalc(r)).catch(() => {});
    }, 300);
    return () => { alive = false; clearTimeout(h); };
  }, [prog, price, downPct, term]);

  function openApply() {
    if (!user) { openLogin({ onDone: () => setLead(true) }); return; }
    setLead(true);
  }

  if (notFound) return <div className="px-6 py-24 text-center text-muted">{t('mortgage.notFound')}</div>;
  if (!prog) return <div className="space-y-4 p-4"><Skel className="h-8 w-2/3" /><Skel className="h-40 w-full rounded-2xl" /></div>;

  return (
    <TgScreen title={prog.name}>
      {/* Bank */}
      <div className="flex items-center gap-2.5">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-white font-bold" style={{ backgroundColor: prog.bank.color || '#2563EB' }}>
          {prog.bank.name.charAt(0)}
        </span>
        <div>
          <p className="flex items-center gap-1 text-[13px] text-muted">{prog.bank.name} {prog.bank.verified && <BadgeCheck className="h-3.5 w-3.5 text-brand" />}</p>
          <p className="font-display text-[15px] font-bold text-navy">{prog.annualRate}% · {t('mortgage.rate')}</p>
        </div>
      </div>

      {/* Kalkulyator */}
      <div className="mt-4 rounded-2xl border border-line bg-surface p-4">
        <label className="text-[13px] font-semibold text-muted">{t('mortgage.price')}</label>
        <div className="mt-1.5 flex items-baseline gap-2">
          <input
            value={price ? price.toLocaleString('ru-RU') : ''}
            onChange={(e) => setPrice(Number(e.target.value.replace(/\D/g, '')) || 0)}
            inputMode="numeric"
            className="min-w-0 flex-1 bg-transparent font-display text-2xl font-bold text-navy outline-none"
          />
          <span className="shrink-0 text-sm text-muted">so‘m</span>
        </div>

        <label className="mt-4 block text-[13px] font-semibold text-muted">{t('mortgage.down')}</label>
        <div className="mt-1.5 flex flex-wrap gap-2">
          {downChips.map((d) => (
            <Chip key={d} active={downPct === d} onClick={() => setDownPct(d)}>{d}%</Chip>
          ))}
        </div>

        <label className="mt-4 block text-[13px] font-semibold text-muted">{t('mortgage.term')}</label>
        <div className="mt-1.5 flex flex-wrap gap-2">
          {termChips.map((m) => (
            <Chip key={m} active={term === m} onClick={() => setTerm(m)}>{t('common.months', { n: m })}</Chip>
          ))}
        </div>
      </div>

      {/* Natija */}
      {calc && (
        <div className="mt-4 rounded-2xl bg-gradient-to-br from-brand/[0.07] to-teal/[0.07] p-5 text-center">
          <p className="text-[13px] text-muted">{t('mortgage.monthly')}</p>
          <p className="font-display text-3xl font-bold text-navy">{formatUZS(calc.monthlyPayment)}</p>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            <Stat label={t('mortgage.loan')} value={formatUZS(calc.loanAmount)} />
            <Stat label={t('mortgage.total')} value={formatUZS(calc.totalPayment)} />
            <Stat label={t('mortgage.overpay')} value={formatUZS(calc.overpayment)} />
          </div>
        </div>
      )}

      <div className="mt-4">
        <TgButton full size="lg" onClick={openApply}>{t('mortgage.apply')}</TgButton>
      </div>

      <LeadSheet
        open={lead}
        onClose={() => setLead(false)}
        title={prog.name}
        summary={calc ? (
          <div className="flex items-center justify-between rounded-2xl bg-bg px-4 py-3 text-[13px]">
            <span className="text-muted">{formatUZS(price)} · {downPct}% · {t('common.months', { n: term })}</span>
            <span className="font-display font-bold text-navy">{formatUZS(calc.monthlyPayment)}{t('mortgage.perMonth')}</span>
          </div>
        ) : undefined}
        submit={async (name, phone) => {
          await api.applyMortgage({ programId: prog.id, price, downPct, termMonths: term, name, phone });
        }}
      />
    </TgScreen>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] text-muted">{label}</p>
      <p className="mt-0.5 text-[12.5px] font-bold text-navy">{value}</p>
    </div>
  );
}
