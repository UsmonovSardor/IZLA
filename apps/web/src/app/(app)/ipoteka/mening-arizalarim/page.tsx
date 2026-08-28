'use client';

import { useEffect, useState } from 'react';
import { Link } from 'next-view-transitions';
import { useTranslations } from 'next-intl';
import { Landmark, LogIn, ArrowRight, FileText } from 'lucide-react';
import { api, type MyMortgageLead } from '@/lib/api';
import { formatUZS } from '@/lib/utils';
import { useAuth } from '@/components/auth-provider';

const ACCENT = '#0F766E';
const STATUS_STYLE: Record<string, string> = {
  NEW: 'bg-sky-100 text-sky-700',
  CONTACTED: 'bg-amber-100 text-amber-700',
  APPROVED: 'bg-emerald-100 text-emerald-700',
  FUNDED: 'bg-teal-100 text-teal-700',
  REJECTED: 'bg-rose-100 text-rose-700',
};

export default function MyMortgagePage() {
  const t = useTranslations('ipoteka');
  const { user, loading, openLogin } = useAuth();
  const [leads, setLeads] = useState<MyMortgageLead[] | null>(null);

  useEffect(() => {
    if (!user) return;
    api.myMortgageLeads().then(setLeads).catch(() => setLeads([]));
  }, [user]);

  return (
    <section className="container-wide py-10 md:py-14">
      <div className="mb-6 flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-2xl" style={{ background: `${ACCENT}1a`, color: ACCENT }}><FileText className="h-5 w-5" /></span>
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-heading">{t('myApps.title')}</h1>
          <p className="text-sm text-muted">{t('myApps.subtitle')}</p>
        </div>
      </div>

      {loading ? (
        <div className="rounded-3xl border border-line bg-surface p-12 text-center text-muted">…</div>
      ) : !user ? (
        <div className="rounded-3xl border border-dashed border-line bg-surface p-12 text-center">
          <Landmark className="mx-auto h-10 w-10" style={{ color: `${ACCENT}80` }} />
          <p className="mt-3 text-muted">{t('myApps.loginNeeded')}</p>
          <button onClick={() => openLogin({ next: '/ipoteka/mening-arizalarim' })} className="mt-4 inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-110" style={{ background: ACCENT }}>
            <LogIn className="h-4 w-4" /> {t('myApps.login')}
          </button>
        </div>
      ) : leads && leads.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-line bg-surface p-12 text-center">
          <p className="text-muted">{t('myApps.empty')}</p>
          <Link href="/ipoteka" className="mt-4 inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-110" style={{ background: ACCENT }}>
            {t('myApps.emptyCta')} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {(leads ?? []).map((l) => (
            <div key={l.id} className="flex flex-col gap-3 rounded-3xl border border-line bg-surface p-5 shadow-card">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-display text-base font-bold text-heading">{l.program?.name ?? t('myApps.generic')}</h3>
                  <p className="text-xs text-muted">{l.program?.bank.name ?? ''}{l.program ? ` · ${l.program.annualRate}%` : ''}</p>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${STATUS_STYLE[l.status] ?? 'bg-slate-100 text-slate-600'}`}>{t(`myApps.status.${l.status}`)}</span>
              </div>
              <div className="grid grid-cols-2 gap-3 rounded-2xl bg-bg p-3 text-sm">
                <div><div className="text-xs text-muted">{t('calc.monthly')}</div><div className="font-bold text-heading" style={{ fontVariantNumeric: 'tabular-nums' }}>{formatUZS(l.monthlyPayment)}</div></div>
                <div><div className="text-xs text-muted">{t('calc.loanAmount')}</div><div className="font-bold text-heading" style={{ fontVariantNumeric: 'tabular-nums' }}>{formatUZS(l.amount)}</div></div>
              </div>
              <div className="flex items-center justify-between text-xs text-muted">
                <span>{t('myApps.price')}: {formatUZS(l.propertyPrice)}</span>
                <span>{new Date(l.createdAt).toLocaleDateString('ru-RU')}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
