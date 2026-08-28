'use client';

import { Link } from 'next-view-transitions';
import { useTranslations } from 'next-intl';
import { Check, Loader2, Crown, Zap, Sparkles } from 'lucide-react';
import type { PlanConfig, VendorPlanId } from '@/lib/api';
import { formatUZS } from '@/lib/utils';

const STYLE: Record<VendorPlanId, { accent: string; Icon: typeof Zap }> = {
  FREE: { accent: '#64748B', Icon: Zap },
  PRO: { accent: '#2563EB', Icon: Sparkles },
  PREMIUM: { accent: '#B45309', Icon: Crown },
};

export function PlanCards({
  plans,
  currentPlan,
  onSelect,
  busyPlan,
}: {
  plans: PlanConfig[];
  currentPlan?: VendorPlanId;
  onSelect?: (plan: VendorPlanId) => void;
  busyPlan?: VendorPlanId | null;
}) {
  const t = useTranslations('narxlar');
  return (
    <div className="grid gap-5 md:grid-cols-3">
      {plans.map((p) => {
        const s = STYLE[p.id];
        const isCurrent = currentPlan === p.id;
        const highlight = p.id === 'PRO';
        return (
          <div
            key={p.id}
            className="relative flex flex-col rounded-3xl border bg-surface p-6 shadow-card transition hover:-translate-y-1"
            style={{ borderColor: highlight ? s.accent : 'var(--c-line)', boxShadow: highlight ? `0 10px 40px -12px ${s.accent}55` : undefined }}
          >
            {highlight && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 text-[11px] font-bold text-white" style={{ background: s.accent }}>
                {t('popular')}
              </span>
            )}
            <div className="flex items-center gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-xl" style={{ background: `${s.accent}1a`, color: s.accent }}>
                <s.Icon className="h-5 w-5" />
              </span>
              <div>
                <h3 className="font-display text-lg font-bold text-heading">{t(`plan.${p.id}.name`)}</h3>
                <p className="text-xs text-muted">{t(`plan.${p.id}.desc`)}</p>
              </div>
            </div>

            <div className="mt-4">
              <span className="font-display text-3xl font-extrabold text-heading" style={{ fontVariantNumeric: 'tabular-nums' }}>
                {p.priceMonthly === 0 ? t('free') : formatUZS(p.priceMonthly)}
              </span>
              {p.priceMonthly > 0 && <span className="ml-1 text-sm text-muted">{t('perMonth')}</span>}
            </div>
            <p className="mt-1 text-sm font-medium" style={{ color: s.accent }}>{t('commission', { rate: Math.round(p.commissionRate * 100) })}</p>

            <ul className="mt-4 flex flex-1 flex-col gap-2">
              {p.featureKeys.map((k) => (
                <li key={k} className="flex items-start gap-2 text-sm text-ink">
                  <Check className="mt-0.5 h-4 w-4 shrink-0" style={{ color: s.accent }} /> {t(`feat.${k}`)}
                </li>
              ))}
            </ul>

            {onSelect ? (
              <button
                onClick={() => onSelect(p.id)}
                disabled={isCurrent || busyPlan === p.id}
                className="mt-6 flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold transition disabled:opacity-60"
                style={isCurrent ? { background: 'var(--c-bg)', color: 'var(--c-muted)' } : { background: s.accent, color: '#fff' }}
              >
                {busyPlan === p.id && <Loader2 className="h-4 w-4 animate-spin" />}
                {isCurrent ? t('ctaCurrent') : t('cta')}
              </button>
            ) : (
              <Link href="/kabinet" className="mt-6 flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold text-white transition hover:brightness-110" style={{ background: s.accent }}>
                {t('cta')}
              </Link>
            )}
          </div>
        );
      })}
    </div>
  );
}
