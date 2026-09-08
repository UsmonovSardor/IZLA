import { describe, it, expect } from 'vitest';
import { computeMortgage } from './mortgage-calc';

describe('computeMortgage — annuitet', () => {
  it('0% stavka → oylik = kredit / muddat, ortiqcha to‘lov 0', () => {
    const r = computeMortgage({ price: 120_000_000, downAmount: 0, annualRate: 0, termMonths: 12 });
    expect(r.loanAmount).toBe(120_000_000);
    expect(r.monthlyPayment).toBe(10_000_000);
    expect(r.overpayment).toBe(0);
  });

  it('foizli kredit → oylik to‘lov kredit/muddatdan katta (foiz qo‘shiladi)', () => {
    const r = computeMortgage({ price: 100_000_000, downAmount: 0, annualRate: 12, termMonths: 12 });
    expect(r.monthlyPayment).toBeGreaterThan(100_000_000 / 12);
    expect(r.overpayment).toBeGreaterThan(0);
    // annuitet: jami to‘lov = oylik×muddat (boshlang‘ich 0)
    expect(r.totalPayment).toBe(r.monthlyPayment * 12);
  });

  it('boshlang‘ich to‘lov (downPct) kredit summasini kamaytiradi', () => {
    const r = computeMortgage({ price: 500_000_000, downPct: 20, annualRate: 10, termMonths: 120 });
    expect(r.downPayment).toBe(100_000_000);
    expect(r.loanAmount).toBe(400_000_000);
  });

  it('downAmount narxdan oshsa — narxgacha cheklanadi (kredit 0)', () => {
    const r = computeMortgage({ price: 200_000_000, downAmount: 300_000_000, annualRate: 10, termMonths: 60 });
    expect(r.downPayment).toBe(200_000_000);
    expect(r.loanAmount).toBe(0);
    expect(r.monthlyPayment).toBe(0);
  });

  it('noto‘g‘ri kirish → xavfsiz standart (crash yo‘q)', () => {
    const r = computeMortgage({ price: Number.NaN, annualRate: Number.NaN, termMonths: 0 });
    expect(r.price).toBe(0);
    expect(r.termMonths).toBeGreaterThanOrEqual(1);
    expect(r.monthlyPayment).toBe(0);
  });

  it('downPct 0..100 oralig‘iga cheklanadi', () => {
    const r = computeMortgage({ price: 100_000_000, downPct: 150, annualRate: 0, termMonths: 12 });
    expect(r.downPayment).toBe(100_000_000); // 100% dan oshmaydi
  });
});
