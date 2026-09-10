'use client';
import { useEffect, useState } from 'react';
import { Link } from 'next-view-transitions';
import { useTranslations } from 'next-intl';
import { Landmark, BadgeCheck, Percent, ChevronRight } from 'lucide-react';
import { api, type MortgageProgram } from '@/lib/api';
import { formatUZS } from '@/lib/utils';
import { haptic } from '@/lib/telegram';
import { TgScreen } from '@/components/tg/tg-screen';
import { Skel, TgEmpty } from '@/components/tg/tg-ui';

function ProgramCard({ p }: { p: MortgageProgram }) {
  const t = useTranslations('tg');
  return (
    <Link
      href={`/tg/ipoteka/${p.slug}`}
      onClick={() => haptic.impact('light')}
      className="block rounded-2xl border border-line bg-surface p-4 transition active:scale-[0.99]"
    >
      <div className="flex items-center gap-2.5">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-white font-bold" style={{ backgroundColor: p.bank.color || '#2563EB' }}>
          {p.bank.name.charAt(0)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1 truncate text-[13px] text-muted">
            {p.bank.name} {p.bank.verified && <BadgeCheck className="h-3.5 w-3.5 text-brand" />}
          </p>
          <p className="truncate font-display text-[15px] font-bold text-navy">{p.name}</p>
        </div>
        {p.subsidized && <span className="shrink-0 rounded-full bg-teal/10 px-2 py-0.5 text-[10px] font-bold text-teal-600">{t('mortgage.subsidized')}</span>}
      </div>

      <div className="mt-3 flex items-end justify-between">
        <div>
          <p className="text-[12px] text-muted">{t('mortgage.monthly')} {t('common.from')}</p>
          <p className="font-display text-lg font-bold text-navy">{formatUZS(p.monthlyFrom)}<span className="text-[12px] font-normal text-muted">{t('mortgage.perMonth')}</span></p>
        </div>
        <div className="flex items-center gap-3 text-[12px] text-muted">
          <span className="inline-flex items-center gap-1"><Percent className="h-3.5 w-3.5 text-brand" /> {p.annualRate}%</span>
          <ChevronRight className="h-4 w-4" />
        </div>
      </div>
    </Link>
  );
}

export default function TgMortgage() {
  const t = useTranslations('tg');
  const [items, setItems] = useState<MortgageProgram[] | null>(null);

  useEffect(() => {
    api.mortgagePrograms().then(setItems).catch(() => setItems([]));
  }, []);

  return (
    <TgScreen title={t('mortgage.title')}>
      {!items ? (
        <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skel key={i} className="h-28 rounded-2xl" />)}</div>
      ) : items.length === 0 ? (
        <TgEmpty icon={Landmark} title={t('mortgage.emptyTitle')} />
      ) : (
        <div className="space-y-3">{items.map((p) => <ProgramCard key={p.id} p={p} />)}</div>
      )}
    </TgScreen>
  );
}
