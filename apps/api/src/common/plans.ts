/**
 * Vendor obuna tariflari (monetizatsiya: platforma take-rate).
 * Yagona haqiqat manbasi — kabinet, narxlar sahifasi, komissiya hisobi shu yerdan.
 */
export type PlanId = 'FREE' | 'PRO' | 'PREMIUM';

export interface PlanConfig {
  id: PlanId;
  priceMonthly: number; // so'm/oy
  commissionRate: number; // bron komissiyasi (0..1) — Izla take-rate
  photoLimit: number;
  rankBoost: number; // qidiruv reytingiga qo'shimcha
  featured: boolean; // badge + yuqori joylashuv
  analytics: boolean;
  featureKeys: string[]; // i18n afzallik kalitlari (frontend)
}

export const PLANS: Record<PlanId, PlanConfig> = {
  FREE: {
    id: 'FREE', priceMonthly: 0, commissionRate: 0.15, photoLimit: 5, rankBoost: 0,
    featured: false, analytics: false, featureKeys: ['listing', 'photos5', 'bookingOnline', 'support'],
  },
  PRO: {
    id: 'PRO', priceMonthly: 199_000, commissionRate: 0.1, photoLimit: 20, rankBoost: 1,
    featured: true, analytics: true, featureKeys: ['everythingFree', 'badge', 'photos20', 'analytics', 'higherRanking', 'commission10'],
  },
  PREMIUM: {
    id: 'PREMIUM', priceMonthly: 499_000, commissionRate: 0.07, photoLimit: 100, rankBoost: 2,
    featured: true, analytics: true, featureKeys: ['everythingPro', 'topRanking', 'photos100', 'prioritySupport', 'featuredHome', 'commission7'],
  },
};

export const PLAN_LIST: PlanConfig[] = [PLANS.FREE, PLANS.PRO, PLANS.PREMIUM];

const isPlan = (v: string): v is PlanId => v === 'FREE' || v === 'PRO' || v === 'PREMIUM';

export function planConfig(plan?: string | null): PlanConfig {
  return plan && isPlan(plan) ? PLANS[plan] : PLANS.FREE;
}

/** Bron komissiya stavkasi (vendor tarifiga qarab). */
export function commissionRateFor(plan?: string | null): number {
  return planConfig(plan).commissionRate;
}

/** Qidiruv reyting boosti (tarifga qarab). */
export function rankBoostFor(plan?: string | null): number {
  return planConfig(plan).rankBoost;
}
