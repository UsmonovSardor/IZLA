import { describe, it, expect } from 'vitest';
import {
  tashkentToUtc,
  tashkentDateStr,
  isValidDateStr,
  windowForDay,
  isOpenNow,
  generateSlots,
  type Hours,
} from './slots';

const HOURS: Hours = { mon_fri: '09:00-18:00', sat: '10:00-15:00', sun: 'off' };

describe('slots.tashkentToUtc', () => {
  it('Toshkent 09:00 → 04:00 UTC (UTC+5)', () => {
    // 2026-06-15 dushanba, mahalliy 09:00 = 540 daqiqa
    expect(tashkentToUtc('2026-06-15', 540).toISOString()).toBe('2026-06-15T04:00:00.000Z');
  });
  it('yarim tundan oldingi ofset avvalgi kunga o‘tadi', () => {
    // mahalliy 02:00 (120 daq) → 21:00 UTC oldingi kun
    expect(tashkentToUtc('2026-06-15', 120).toISOString()).toBe('2026-06-14T21:00:00.000Z');
  });
});

describe('slots.tashkentDateStr', () => {
  it('UTC instant tegishli Toshkent sanasini beradi', () => {
    // 2026-06-14T21:00Z = Toshkent 2026-06-15 02:00
    expect(tashkentDateStr(new Date('2026-06-14T21:00:00Z'))).toBe('2026-06-15');
  });
});

describe('slots.isValidDateStr', () => {
  it('to‘g‘ri sanalar', () => {
    expect(isValidDateStr('2026-06-15')).toBe(true);
    expect(isValidDateStr('2024-02-29')).toBe(true); // kabisa yili
  });
  it('noto‘g‘ri sanalar', () => {
    expect(isValidDateStr('2026-13-01')).toBe(false);
    expect(isValidDateStr('2026-02-30')).toBe(false);
    expect(isValidDateStr('2026-6-5')).toBe(false);
    expect(isValidDateStr('nonsense')).toBe(false);
  });
});

describe('slots.windowForDay', () => {
  it('ish kuni oynasi (daqiqada)', () => {
    expect(windowForDay(HOURS, 1)).toEqual([540, 1080]); // dushanba 09:00-18:00
    expect(windowForDay(HOURS, 6)).toEqual([600, 900]); // shanba 10:00-15:00
  });
  it('yopiq kun → null', () => {
    expect(windowForDay(HOURS, 0)).toBeNull(); // yakshanba off
  });
  it('buzuq format → null', () => {
    expect(windowForDay({ mon_fri: 'buzuq' }, 1)).toBeNull();
    expect(windowForDay({ mon_fri: '18:00-09:00' }, 1)).toBeNull(); // close <= open
  });
});

describe('slots.isOpenNow', () => {
  it('ish vaqti ichida ochiq', () => {
    // 2026-06-15 dushanba, Toshkent 12:00 = UTC 07:00
    expect(isOpenNow(HOURS, new Date('2026-06-15T07:00:00Z'))).toBe(true);
  });
  it('ish vaqtidan tashqarida yopiq', () => {
    // Toshkent 20:00 = UTC 15:00
    expect(isOpenNow(HOURS, new Date('2026-06-15T15:00:00Z'))).toBe(false);
  });
  it('yakshanba yopiq', () => {
    // 2026-06-14 yakshanba, Toshkent 12:00 = UTC 07:00
    expect(isOpenNow(HOURS, new Date('2026-06-14T07:00:00Z'))).toBe(false);
  });
});

describe('slots.generateSlots', () => {
  const now = new Date('2026-06-15T00:00:00Z'); // Toshkent 05:00 — hammasidan oldin

  it('davomiylik va oyna asosida to‘g‘ri sonli slot', () => {
    // 09:00-18:00 = 540 daqiqa; 60 daqiqalik slot = 9 ta
    const slots = generateSlots({ dateStr: '2026-06-15', hours: HOURS, durationMin: 60, taken: [], now });
    expect(slots.length).toBe(9);
    expect(slots[0]!.start).toBe('2026-06-15T04:00:00.000Z'); // 09:00 Toshkent
    expect(slots.every((s) => s.available)).toBe(true);
  });

  it('band bron bilan kesishgan slot available:false', () => {
    const taken = [{ start: new Date('2026-06-15T04:00:00Z'), end: new Date('2026-06-15T05:00:00Z') }];
    const slots = generateSlots({ dateStr: '2026-06-15', hours: HOURS, durationMin: 60, taken, now });
    expect(slots[0]!.available).toBe(false); // 09:00 band
    expect(slots[1]!.available).toBe(true); // 10:00 bo‘sh
  });

  it('o‘tgan vaqtdagi slot available:false', () => {
    const lateNow = new Date('2026-06-15T08:00:00Z'); // Toshkent 13:00
    const slots = generateSlots({ dateStr: '2026-06-15', hours: HOURS, durationMin: 60, taken: [], now: lateNow });
    expect(slots[0]!.available).toBe(false); // 09:00 o‘tgan
    const oneClock = slots.find((s) => s.start === '2026-06-15T09:00:00.000Z'); // 14:00 Toshkent
    expect(oneClock?.available).toBe(true);
  });

  it('yopiq kun → bo‘sh massiv', () => {
    expect(generateSlots({ dateStr: '2026-06-14', hours: HOURS, durationMin: 60, taken: [], now }).length).toBe(0);
  });

  it('stepMin durationMin dan farqli bo‘lsa qadamni hurmat qiladi', () => {
    // 30 daq qadam, 60 daq davomiylik: 09:00,09:30,...,17:00 = oxirgi 17:00+60=18:00
    const slots = generateSlots({ dateStr: '2026-06-15', hours: HOURS, durationMin: 60, stepMin: 30, taken: [], now });
    expect(slots.length).toBe(17);
  });
});
