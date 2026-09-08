import { describe, it, expect } from 'vitest';
import { computeQuote, commissionFor, type InsType } from './pricing';

describe('computeQuote — sug‘urta premiyasi (DEFAULT tariflar)', () => {
  it('OSAGO standart (barcha koeffitsent 1.0) → bazaviy premiya', () => {
    const q = computeQuote('OSAGO', { vehicle: 'car', region: 'toshkent_shahar', drivers: 'limited', experience: 'exp', period: '12' });
    expect(q.premium).toBe(120_000);
    expect(q.insuredSum).toBe(40_000_000);
    expect(q.breakdown.length).toBeGreaterThan(0);
  });

  it('OSAGO cheklanmagan haydovchi → premiya oshadi (×1.5)', () => {
    const base = computeQuote('OSAGO', { drivers: 'limited' }).premium;
    const unlimited = computeQuote('OSAGO', { drivers: 'unlimited' }).premium;
    expect(unlimited).toBeGreaterThan(base);
  });

  it('har bir tur musbat premiya + breakdown qaytaradi', () => {
    const types: InsType[] = ['OSAGO', 'KASKO', 'TRAVEL', 'PROPERTY', 'ACCIDENT', 'HEALTH'];
    for (const t of types) {
      const q = computeQuote(t, {});
      expect(q.premium, `${t} premiya`).toBeGreaterThan(0);
      expect(q.insuredSum, `${t} qoplama`).toBeGreaterThan(0);
      expect(Array.isArray(q.breakdown)).toBe(true);
    }
  });

  it('KASKO minimal premiyadan past bo‘lmaydi', () => {
    const q = computeQuote('KASKO', { carValue: 1_000_000 }); // juda kichik → min qo‘llanadi
    expect(q.premium).toBeGreaterThanOrEqual(900_000);
  });

  it('TRAVEL kunlar soniga proporsional', () => {
    const d7 = computeQuote('TRAVEL', { days: 7 }).premium;
    const d14 = computeQuote('TRAVEL', { days: 14 }).premium;
    expect(d14).toBeGreaterThan(d7);
  });

  it('tariff override DEFAULTS ustiga yoziladi (base o‘zgaradi)', () => {
    const q = computeQuote('OSAGO', { vehicle: 'car', region: 'toshkent_shahar', drivers: 'limited', experience: 'exp', period: '12' }, { base: 200_000 });
    expect(q.premium).toBe(200_000);
  });

  it('noma’lum tur → xato', () => {
    expect(() => computeQuote('XYZ' as InsType, {})).toThrow();
  });

  it('premiya 100 so‘mga yaxlitlanadi', () => {
    const q = computeQuote('OSAGO', {});
    expect(q.premium % 100).toBe(0);
  });
});

describe('commissionFor — Izla komissiyasi', () => {
  it('foizni to‘g‘ri hisoblaydi (15%)', () => {
    expect(commissionFor(120_000, 0.15)).toBe(18_000);
  });
  it('satr stavka', () => {
    expect(commissionFor(120_000, '0.15')).toBe(18_000);
  });
  it('noto‘g‘ri stavka → 0', () => {
    expect(commissionFor(120_000, Number.NaN)).toBe(0);
  });
});
