import { describe, it, expect } from 'vitest';
import { toTiyin, tiyinMatches, sumMatches, toMs } from './money';

describe('money.toTiyin', () => {
  it('so‘mni tiyinga aylantiradi (butun)', () => {
    expect(toTiyin(100)).toBe(10000n);
    expect(toTiyin('50000')).toBe(5000000n);
    expect(toTiyin(0)).toBe(0n);
  });

  it('kasr so‘mni to‘g‘ri yaxlitlaydi', () => {
    expect(toTiyin('99.99')).toBe(9999n);
    expect(toTiyin('0.01')).toBe(1n);
    expect(toTiyin('12345.67')).toBe(1234567n);
  });

  it('float aniqlik xatosisiz (0.1+0.2 muammosi yo‘q)', () => {
    expect(toTiyin('0.10')).toBe(10n);
    expect(toTiyin('0.20')).toBe(20n);
  });
});

describe('money.tiyinMatches (Payme)', () => {
  it('tiyin summa mos kelsa true', () => {
    expect(tiyinMatches('50000', 5000000)).toBe(true);
    expect(tiyinMatches('50000', '5000000')).toBe(true);
  });
  it('mos kelmasa false', () => {
    expect(tiyinMatches('50000', 5000001)).toBe(false);
    expect(tiyinMatches('50000', 4999999)).toBe(false);
  });
});

describe('money.sumMatches (Click)', () => {
  it('so‘m summa mos kelsa true (tiyin aniqligida)', () => {
    expect(sumMatches('50000', '50000')).toBe(true);
    expect(sumMatches('50000', '50000.00')).toBe(true);
  });
  it('bir tiyin farq bo‘lsa false', () => {
    expect(sumMatches('50000', '50000.01')).toBe(false);
  });
});

describe('money.toMs', () => {
  it('Date → epoch ms', () => {
    const d = new Date('2026-01-01T00:00:00.000Z');
    expect(toMs(d)).toBe(d.getTime());
  });
  it('null/undefined → 0', () => {
    expect(toMs(null)).toBe(0);
    expect(toMs(undefined)).toBe(0);
  });
});
