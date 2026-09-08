import { describe, it, expect } from 'vitest';
import { PARTNER_PLANS, PARTNER_PLAN_LIST, partnerPlanConfig, productLimitFor, leadPriceFor } from './partner-plans';

describe('partner-plans — tarif konfiguratsiyasi (yagona manba)', () => {
  it('3 ta tarif: FREE / GROWTH / ENTERPRISE', () => {
    expect(PARTNER_PLAN_LIST.map((p) => p.id)).toEqual(['FREE', 'GROWTH', 'ENTERPRISE']);
  });

  it('narx FREE < GROWTH < ENTERPRISE (oy-ma-oy)', () => {
    expect(PARTNER_PLANS.FREE.priceMonthly).toBe(0);
    expect(PARTNER_PLANS.GROWTH.priceMonthly).toBeLessThan(PARTNER_PLANS.ENTERPRISE.priceMonthly);
    expect(PARTNER_PLANS.FREE.priceMonthly).toBeLessThan(PARTNER_PLANS.GROWTH.priceMonthly);
  });

  it('mahsulot chegarasi tarif bilan oshadi', () => {
    expect(productLimitFor('FREE')).toBeLessThan(productLimitFor('GROWTH'));
    expect(productLimitFor('GROWTH')).toBeLessThan(productLimitFor('ENTERPRISE'));
  });

  it('lead chegirmasi pullik tarifda kattaroq (arzonroq lead)', () => {
    expect(leadPriceFor('FREE')).toBeGreaterThan(leadPriceFor('GROWTH'));
    expect(leadPriceFor('GROWTH')).toBeGreaterThan(leadPriceFor('ENTERPRISE'));
  });

  it('noma’lum/null tarif → FREE konfiguratsiyasi (xavfsiz standart)', () => {
    expect(partnerPlanConfig(null).id).toBe('FREE');
    expect(partnerPlanConfig('XYZ').id).toBe('FREE');
    expect(partnerPlanConfig(undefined).id).toBe('FREE');
  });

  it('har tarifda kerakli maydonlar bor (shakl yaxlitligi)', () => {
    for (const p of PARTNER_PLAN_LIST) {
      expect(typeof p.priceMonthly).toBe('number');
      expect(typeof p.productLimit).toBe('number');
      expect(typeof p.leadBasePrice).toBe('number');
      expect(p.leadDiscount).toBeGreaterThanOrEqual(0);
      expect(p.leadDiscount).toBeLessThanOrEqual(1);
      expect(Array.isArray(p.featureKeys)).toBe(true);
    }
  });
});
