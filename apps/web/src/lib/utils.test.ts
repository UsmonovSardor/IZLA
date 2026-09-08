import { describe, it, expect } from 'vitest';
import { cn, formatUZS } from './utils';

describe('formatUZS — pul formatlash (so‘m)', () => {
  it('0 yoki falsy → "Bepul"', () => {
    expect(formatUZS(0)).toBe('Bepul');
    expect(formatUZS('')).toBe('Bepul');
  });

  it('million ostidagi summa → to‘liq raqam + "so\'m"', () => {
    expect(formatUZS(25_000)).toContain("so'm");
    expect(formatUZS(25_000)).not.toContain('mln');
  });

  it('milliondan katta → "mln so\'m" ixcham', () => {
    expect(formatUZS(2_000_000)).toContain('mln');
    expect(formatUZS(2_000_000)).toContain('2');
  });

  it('satr kirishni ham qabul qiladi', () => {
    expect(formatUZS('1500000')).toContain('mln');
  });

  it('CPL narxlari to‘g‘ri (million ostida, ixcham emas)', () => {
    expect(formatUZS(21_250)).not.toContain('mln');
    expect(formatUZS(17_500)).not.toContain('mln');
  });
});

describe('cn — class birlashtirish (twMerge)', () => {
  it('sinflarni birlashtiradi', () => {
    expect(cn('a', 'b')).toBe('a b');
  });
  it('tailwind ziddiyatida oxirgisi yutadi', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4');
  });
  it('shartli/falsy sinflarni tashlab yuboradi', () => {
    expect(cn('a', false, null, undefined, 'b')).toBe('a b');
  });
});
