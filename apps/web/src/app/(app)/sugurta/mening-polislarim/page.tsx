'use client';

import { useEffect, useState } from 'react';
import { Link } from 'next-view-transitions';
import { useTranslations } from 'next-intl';
import { ShieldCheck, LogIn, ArrowRight, FileText } from 'lucide-react';
import { api, type MyPolicy } from '@/lib/api';
import { TYPE_ICON, TYPE_ACCENT } from '@/lib/insurance-meta';
import { formatUZS } from '@/lib/utils';
import { useAuth } from '@/components/auth-provider';

const STATUS_STYLE: Record<string, string> = {
  DRAFT: 'bg-slate-100 text-slate-600',
  PENDING: 'bg-amber-100 text-amber-700',
  ACTIVE: 'bg-emerald-100 text-emerald-700',
  EXPIRED: 'bg-slate-100 text-slate-500',
  CANCELLED: 'bg-rose-100 text-rose-700',
};

export default function MyPoliciesPage() {
  const t = useTranslations('sugurta');
  const { user, loading, openLogin } = useAuth();
  const [policies, setPolicies] = useState<MyPolicy[] | null>(null);

  useEffect(() => {
    if (!user) return;
    api.myPolicies().then(setPolicies).catch(() => setPolicies([]));
  }, [user]);

  return (
    <section className="container-wide py-10 md:py-14">
      <div className="mb-6 flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-brand/10 text-brand">
          <FileText className="h-5 w-5" />
        </span>
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-heading">{t('policies.title')}</h1>
          <p className="text-sm text-muted">{t('policies.subtitle')}</p>
        </div>
      </div>

      {loading ? (
        <div className="rounded-3xl border border-line bg-surface p-12 text-center text-muted">…</div>
      ) : !user ? (
        <div className="rounded-3xl border border-dashed border-line bg-surface p-12 text-center">
          <ShieldCheck className="mx-auto h-10 w-10 text-brand/50" />
          <p className="mt-3 text-muted">{t('policies.loginNeeded')}</p>
          <button onClick={() => openLogin({ next: '/sugurta/mening-polislarim' })} className="mt-4 inline-flex items-center gap-2 rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-110">
            <LogIn className="h-4 w-4" /> {t('policies.login')}
          </button>
        </div>
      ) : policies && policies.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-line bg-surface p-12 text-center">
          <p className="text-muted">{t('policies.empty')}</p>
          <Link href="/sugurta" className="mt-4 inline-flex items-center gap-2 rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-110">
            {t('policies.emptyCta')} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {(policies ?? []).map((p) => {
            const Icon = TYPE_ICON[p.type];
            const accent = TYPE_ACCENT[p.type];
            return (
              <div key={p.id} className="flex flex-col gap-3 rounded-3xl border border-line bg-surface p-5 shadow-card">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="grid h-11 w-11 place-items-center rounded-2xl" style={{ background: `${accent}1a`, color: accent }}>
                      <Icon className="h-5 w-5" />
                    </span>
                    <div>
                      <h3 className="font-display text-base font-bold text-heading">{p.product.name}</h3>
                      <p className="text-xs text-muted">{p.product.insurer.name}</p>
                    </div>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${STATUS_STYLE[p.status] ?? 'bg-slate-100 text-slate-600'}`}>
                    {t(`policies.status.${p.status}`)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 rounded-2xl bg-bg p-3 text-sm">
                  <div>
                    <div className="text-xs text-muted">{t('calc.premium')}</div>
                    <div className="font-bold text-heading" style={{ fontVariantNumeric: 'tabular-nums' }}>{formatUZS(p.premium)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted">{t('calc.coverage')}</div>
                    <div className="font-bold text-heading" style={{ fontVariantNumeric: 'tabular-nums' }}>{formatUZS(p.insuredSum)}</div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-muted">
                  {p.policyNumber && <span className="font-mono">{p.policyNumber}</span>}
                  {p.endsAt && <span>{t('policies.until')}: {new Date(p.endsAt).toLocaleDateString('ru-RU')}</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
