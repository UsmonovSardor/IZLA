// Sadoqat darajalari — jami tangalar asosida (sof hisob, backend kerak emas).

export interface Tier {
  key: string; // i18n kaliti (levels.<key>)
  emoji: string;
  min: number;
  from: string; // gradient boshi
  to: string; // gradient oxiri
}

export const TIERS: Tier[] = [
  { key: 'newcomer', emoji: '🌱', min: 0, from: '#94a3b8', to: '#cbd5e1' },
  { key: 'bronze', emoji: '🥉', min: 200, from: '#b45309', to: '#f59e0b' },
  { key: 'silver', emoji: '🥈', min: 600, from: '#64748b', to: '#cbd5e1' },
  { key: 'gold', emoji: '🥇', min: 1500, from: '#d97706', to: '#fbbf24' },
  { key: 'platinum', emoji: '💎', min: 4000, from: '#0e7490', to: '#22d3ee' },
  { key: 'diamond', emoji: '👑', min: 10000, from: '#7c3aed', to: '#c4b5fd' },
];

export interface LevelInfo {
  tier: Tier;
  next: Tier | null;
  index: number;
  coins: number;
  toNext: number; // keyingi darajagacha qolgan tanga
  progress: number; // 0..1 (joriy daraja ichida)
}

export function levelForCoins(coins: number): LevelInfo {
  let index = 0;
  for (let i = 0; i < TIERS.length; i++) {
    if (coins >= TIERS[i].min) index = i;
  }
  const tier = TIERS[index];
  const next = index < TIERS.length - 1 ? TIERS[index + 1] : null;
  const span = next ? next.min - tier.min : 1;
  const progress = next ? Math.min(1, Math.max(0, (coins - tier.min) / span)) : 1;
  const toNext = next ? Math.max(0, next.min - coins) : 0;
  return { tier, next, index, coins, toNext, progress };
}
