'use client';

import { useTranslations } from 'next-intl';
import { motion, useReducedMotion } from 'framer-motion';
import { levelForCoins, TIERS } from '@/lib/levels';

/** Sadoqat darajasi kartasi — joriy tier + keyingisiga progress (profil). */
export function LevelCard({ coins }: { coins: number }) {
  const t = useTranslations('levels');
  const reduce = useReducedMotion();
  const info = levelForCoins(coins);

  return (
    <div className="rounded-2xl border border-line bg-surface p-5 shadow-card">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span
            className="grid h-12 w-12 place-items-center rounded-2xl text-2xl shadow-sm"
            style={{ backgroundImage: `linear-gradient(135deg, ${info.tier.from}, ${info.tier.to})` }}
          >
            {info.tier.emoji}
          </span>
          <div>
            <div className="text-xs font-medium text-slate2">{t('yourLevel')}</div>
            <div className="font-display text-lg font-bold text-navy">{t(info.tier.key)}</div>
          </div>
        </div>
        <div className="text-right">
          <div className="font-display text-xl font-extrabold tabular-nums text-navy">{coins}</div>
          <div className="text-xs text-slate2">🪙</div>
        </div>
      </div>

      {info.next ? (
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-slate2">
            <span>{t(info.tier.key)}</span>
            <span>{t('toNext', { count: info.toNext, next: t(info.next.key) })}</span>
          </div>
          <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-bg">
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundImage: `linear-gradient(90deg, ${info.tier.from}, ${info.tier.to})` }}
              initial={reduce ? false : { width: 0 }}
              animate={{ width: `${Math.round(info.progress * 100)}%` }}
              transition={{ type: 'spring', stiffness: 120, damping: 20 }}
            />
          </div>
        </div>
      ) : (
        <p className="mt-4 text-sm font-medium text-violet-600">{t('maxLevel')}</p>
      )}

      {/* Barcha darajalar mini-ko'rinishi */}
      <div className="mt-4 flex items-center justify-between gap-1">
        {TIERS.map((tier, i) => (
          <div key={tier.key} className="flex flex-1 flex-col items-center gap-1">
            <span className={`text-lg transition ${i <= info.index ? '' : 'opacity-30 grayscale'}`}>{tier.emoji}</span>
            <span className={`text-[10px] ${i === info.index ? 'font-bold text-navy' : 'text-slate-400'}`}>{tier.min}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
