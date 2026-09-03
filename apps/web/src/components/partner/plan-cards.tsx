'use client';

import { useTranslations } from 'next-intl';
import { Check, Loader2, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import type { PartnerPlanConfig, PartnerPlanId } from '@/lib/api';
import { formatUZS } from '@/lib/utils';

/**
 * Homiy obuna tariflari kartochkalari (Izla Biznes).
 * Landing sahifada (onSelect'siz) va portal "Tarif" tabida (onSelect bilan) ishlaydi.
 */
export function PartnerPlanCards({
  plans,
  currentPlan,
  onSelect,
  busyPlan,
  ctaLabel,
}: {
  plans: PartnerPlanConfig[];
  currentPlan?: PartnerPlanId;
  onSelect?: (plan: PartnerPlanId) => void;
  busyPlan?: PartnerPlanId | null;
  ctaLabel?: string;
}) {
  const t = useTranslations('biznes');

  return (
    <div className="grid gap-5 md:grid-cols-3">
      {plans.map((p, i) => {
        const highlighted = p.id === 'GROWTH';
        const isCurrent = currentPlan === p.id;
        return (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.08 }}
            className={`relative flex flex-col rounded-3xl border p-6 shadow-card ${
              highlighted ? 'border-brand bg-brand/[0.03]' : 'border-line bg-surface'
            }`}
          >
            {highlighted && (
              <span className="absolute -top-3 left-6 inline-flex items-center gap-1 rounded-full bg-brand px-3 py-1 text-xs font-semibold text-white">
                <Sparkles className="h-3 w-3" /> {t('plans.popular')}
              </span>
            )}
            <h3 className="font-display text-xl font-bold text-heading">{t(`plans.${p.id}.name`)}</h3>
            <p className="mt-1 text-sm text-muted">{t(`plans.${p.id}.tagline`)}</p>

            <div className="mt-4 flex items-baseline gap-1">
              <span className="font-display text-3xl font-extrabold tracking-tight text-heading" style={{ fontVariantNumeric: 'tabular-nums' }}>
                {p.priceMonthly === 0 ? t('plans.free') : formatUZS(p.priceMonthly)}
              </span>
              {p.priceMonthly > 0 && <span className="text-sm text-muted">/ {t('plans.month')}</span>}
            </div>

            <ul className="mt-5 flex flex-1 flex-col gap-2.5 text-sm">
              {p.featureKeys.map((k) => (
                <li key={k} className="flex items-start gap-2 text-ink">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                  <span>{t(`features.${k}`)}</span>
                </li>
              ))}
            </ul>

            {onSelect && (
              <button
                onClick={() => onSelect(p.id)}
                disabled={isCurrent || busyPlan != null}
                className={`mt-6 flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-bold transition disabled:opacity-60 ${
                  highlighted ? 'bg-brand text-white hover:brightness-110' : 'border border-line text-heading hover:bg-bg'
                }`}
              >
                {busyPlan === p.id && <Loader2 className="h-4 w-4 animate-spin" />}
                {isCurrent ? t('plans.current') : ctaLabel ?? t('plans.choose')}
              </button>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
