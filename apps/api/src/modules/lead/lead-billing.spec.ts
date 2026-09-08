import { describe, it, expect } from 'vitest';
import { decideCharge } from './lead-billing';
import { leadPriceFor, PARTNER_PLANS } from '../../common/partner-plans';

describe('CPL — lead narxi (tarif chegirmasi bilan)', () => {
  it('FREE — chegirmasiz bazaviy narx', () => {
    expect(leadPriceFor('FREE')).toBe(25_000);
  });

  it('GROWTH — 15% chegirma', () => {
    expect(leadPriceFor('GROWTH')).toBe(Math.round(25_000 * 0.85)); // 21 250
  });

  it('ENTERPRISE — 30% chegirma (eng arzon lead)', () => {
    expect(leadPriceFor('ENTERPRISE')).toBe(Math.round(25_000 * 0.7)); // 17 500
  });

  it('pullik tarif leadi FREE dan arzon (rag‘bat)', () => {
    expect(leadPriceFor('GROWTH')).toBeLessThan(leadPriceFor('FREE'));
    expect(leadPriceFor('ENTERPRISE')).toBeLessThan(leadPriceFor('GROWTH'));
  });

  it('noma’lum tarif → FREE narxi', () => {
    expect(leadPriceFor(null)).toBe(PARTNER_PLANS.FREE.leadBasePrice);
    expect(leadPriceFor('XYZ')).toBe(25_000);
  });
});

describe('CPL — hisob qarori (prepaid gate)', () => {
  it('balans yetarli → yetkaziladi, CPL yechiladi', () => {
    expect(decideCharge(100_000, 25_000)).toEqual({ deliver: true, charge: 25_000, balanceAfter: 75_000 });
  });

  it('balans aynan CPL ga teng → yetkaziladi (balans 0 bo‘ladi)', () => {
    expect(decideCharge(25_000, 25_000)).toEqual({ deliver: true, charge: 25_000, balanceAfter: 0 });
  });

  it('balans yetmaydi → BLOCKED, balans o‘zgarmaydi, hech narsa yechilmaydi', () => {
    expect(decideCharge(10_000, 25_000)).toEqual({ deliver: false, charge: 0, balanceAfter: 10_000 });
  });

  it('balans 0 → BLOCKED (manfiy balans yo‘q)', () => {
    expect(decideCharge(0, 25_000)).toEqual({ deliver: false, charge: 0, balanceAfter: 0 });
  });

  it('CPL 0 (o‘chirilgan) → tekin yetkaziladi', () => {
    expect(decideCharge(0, 0)).toEqual({ deliver: true, charge: 0, balanceAfter: 0 });
  });

  it('noto‘g‘ri kirish (NaN) → xavfsiz standart', () => {
    expect(decideCharge(Number.NaN, 25_000)).toEqual({ deliver: false, charge: 0, balanceAfter: 0 });
  });
});
