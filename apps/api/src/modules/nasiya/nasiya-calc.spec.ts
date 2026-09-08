import { describe, it, expect } from 'vitest';
import { computeNasiya, merchantFeeFor } from './nasiya-calc';

describe('computeNasiya — bo‘lib to‘lash', () => {
  const terms = { '3': 0, '6': 0.09, '12': 0.2 };

  it('ustamasiz muddat (0%) → jami = summa, oylik teng bo‘linadi', () => {
    const q = computeNasiya(3_000_000, 3, terms);
    expect(q.totalPayment).toBe(3_000_000);
    expect(q.monthlyPayment).toBe(1_000_000);
    expect(q.overpayment).toBe(0);
    expect(q.markupPct).toBe(0);
  });

  it('ustamali muddat → jami = summa×(1+ustama), ortiqcha to‘g‘ri', () => {
    const q = computeNasiya(1_000_000, 6, terms);
    expect(q.totalPayment).toBe(1_090_000);
    expect(q.monthlyPayment).toBe(Math.round(1_090_000 / 6));
    expect(q.overpayment).toBe(90_000);
    expect(q.markupPct).toBe(9);
  });

  it('terms‘da yo‘q muddat → available=false', () => {
    expect(computeNasiya(1_000_000, 9, terms).available).toBe(false);
  });

  it('summa min chegaradan past → available=false', () => {
    expect(computeNasiya(100_000, 6, terms, { min: 500_000, max: null }).available).toBe(false);
  });

  it('summa max chegaradan yuqori → available=false', () => {
    expect(computeNasiya(50_000_000, 6, terms, { min: null, max: 10_000_000 }).available).toBe(false);
  });

  it('chegara ichida + mavjud muddat → available=true', () => {
    expect(computeNasiya(1_000_000, 6, terms, { min: 500_000, max: 10_000_000 }).available).toBe(true);
  });

  it('manfiy summa → 0 ga cheklanadi', () => {
    expect(computeNasiya(-5000, 6, terms).amount).toBe(0);
  });
});

describe('merchantFeeFor — Izla ulushi', () => {
  it('foizni to‘g‘ri hisoblaydi', () => {
    expect(merchantFeeFor(1_000_000, 0.03)).toBe(30_000);
  });
  it('satr stavkani ham qabul qiladi', () => {
    expect(merchantFeeFor(1_000_000, '0.03')).toBe(30_000);
  });
  it('noto‘g‘ri stavka → 0', () => {
    expect(merchantFeeFor(1_000_000, Number.NaN)).toBe(0);
  });
});
