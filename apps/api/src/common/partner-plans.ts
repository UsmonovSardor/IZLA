/**
 * Izla Biznes — homiy (bank / sug'urta / BNPL) obuna tariflari.
 * Yagona haqiqat manbasi: portal, /biznes/narxlar, billing hisobi shu yerdan.
 *
 * Bu "oy-ma-oy recurring daromad" o'zagi: har homiy platformada turgani uchun
 * oylik to'laydi. Qo'shimcha: lead narxi tarifga qarab arzonlashadi (CPL discount)
 * va featured slotlar soni oshadi (ko'proq ko'rinish).
 * Pul birligi: so'm (UZS). Real narxlar bozor/shartnomaga qarab sozlanadi.
 */
export type PartnerPlanId = 'FREE' | 'GROWTH' | 'ENTERPRISE';

export interface PartnerPlanConfig {
  id: PartnerPlanId;
  priceMonthly: number; // so'm/oy (recurring)
  productLimit: number; // faol mahsulot chegarasi (kanallar bo'ylab jami)
  featuredSlots: number; // marketplace tepasidagi "featured" o'rinlar soni
  leadBasePrice: number; // 1 malakali lead bazaviy narxi (so'm)
  leadDiscount: number; // tarif chegirmasi (0..1) — lead narxidan
  analytics: boolean; // batafsil analitika paneli
  apiAccess: boolean; // lead/quote API kirish huquqi
  prioritySupport: boolean;
  featureKeys: string[]; // i18n afzallik kalitlari (frontend)
}

export const PARTNER_PLANS: Record<PartnerPlanId, PartnerPlanConfig> = {
  FREE: {
    id: 'FREE',
    priceMonthly: 0,
    productLimit: 2,
    featuredSlots: 0,
    leadBasePrice: 25_000,
    leadDiscount: 0,
    analytics: false,
    apiAccess: false,
    prioritySupport: false,
    featureKeys: ['listing2', 'leadsInbox', 'basicProfile', 'emailSupport'],
  },
  GROWTH: {
    id: 'GROWTH',
    priceMonthly: 1_990_000,
    productLimit: 10,
    featuredSlots: 1,
    leadBasePrice: 25_000,
    leadDiscount: 0.15,
    analytics: true,
    apiAccess: false,
    prioritySupport: false,
    featureKeys: ['listing10', 'featured1', 'analytics', 'leadDiscount15', 'verifiedBadge', 'prioritySupport'],
  },
  ENTERPRISE: {
    id: 'ENTERPRISE',
    priceMonthly: 4_990_000,
    productLimit: 999,
    featuredSlots: 5,
    leadBasePrice: 25_000,
    leadDiscount: 0.3,
    analytics: true,
    apiAccess: true,
    prioritySupport: true,
    featureKeys: ['listingUnlimited', 'featured5', 'analyticsPro', 'leadDiscount30', 'apiAccess', 'dedicatedManager'],
  },
};

export const PARTNER_PLAN_LIST: PartnerPlanConfig[] = [
  PARTNER_PLANS.FREE,
  PARTNER_PLANS.GROWTH,
  PARTNER_PLANS.ENTERPRISE,
];

const isPartnerPlan = (v: string): v is PartnerPlanId =>
  v === 'FREE' || v === 'GROWTH' || v === 'ENTERPRISE';

export function partnerPlanConfig(plan?: string | null): PartnerPlanConfig {
  return plan && isPartnerPlan(plan) ? PARTNER_PLANS[plan] : PARTNER_PLANS.FREE;
}

/** Tarifga qarab bitta lead narxi (chegirma qo'llangan). */
export function leadPriceFor(plan?: string | null): number {
  const c = partnerPlanConfig(plan);
  return Math.round(c.leadBasePrice * (1 - c.leadDiscount));
}

/** Faol mahsulot chegarasi (tarifga qarab). */
export function productLimitFor(plan?: string | null): number {
  return partnerPlanConfig(plan).productLimit;
}
