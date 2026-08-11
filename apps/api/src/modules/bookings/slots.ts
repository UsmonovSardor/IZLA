/**
 * Slot generatsiyasi — Asia/Tashkent (UTC+5, DST yo'q, doimiy ofset).
 * Slotlar DB'da UTC DateTime sifatida saqlanadi; bu yerda Toshkent mahalliy
 * vaqtidan UTC'ga aniq konvertatsiya qilinadi.
 */

export const TZ_OFFSET_MIN = 5 * 60; // Toshkent = UTC+5

export type Hours = Record<string, string>;

export interface Slot {
  start: string; // ISO UTC
  end: string; // ISO UTC
  available: boolean;
}

/** YYYY-MM-DD (Toshkent) + kun ichidagi mahalliy daqiqa → UTC Date. */
export function tashkentToUtc(dateStr: string, minutesOfDay: number): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  // Mahalliy daqiqadan ofsetni ayiramiz → UTC. Date.UTC manfiy/oshib ketgan
  // daqiqalarni to'g'ri normalizatsiya qiladi.
  return new Date(Date.UTC(y!, m! - 1, d!, 0, minutesOfDay - TZ_OFFSET_MIN, 0, 0));
}

/** UTC instant → u tegishli bo'lgan Toshkent kalendar sanasi (YYYY-MM-DD). */
export function tashkentDateStr(utc: Date): string {
  return new Date(utc.getTime() + TZ_OFFSET_MIN * 60_000)
    .toISOString()
    .slice(0, 10);
}

/** YYYY-MM-DD formatini tekshirish. */
export function isValidDateStr(dateStr: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(Date.UTC(y!, m! - 1, d!));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m! - 1 && dt.getUTCDate() === d;
}

/**
 * Vendor `hours` JSON (seed formati: { mon_fri, sat, sun }) dan berilgan hafta
 * kuni uchun ish oynasini [ochilish, yopilish] daqiqalarda qaytaradi.
 * Kun yopiq bo'lsa yoki format noto'g'ri bo'lsa — null.
 */
export function windowForDay(hours: Hours, weekday: number): [number, number] | null {
  // weekday: 0=Yakshanba .. 6=Shanba
  const key = weekday === 0 ? 'sun' : weekday === 6 ? 'sat' : 'mon_fri';
  const val = hours?.[key];
  if (!val || val.toLowerCase() === 'off') return null;
  const m = /^(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})$/.exec(val.trim());
  if (!m) return null;
  const open = Number(m[1]) * 60 + Number(m[2]);
  const close = Number(m[3]) * 60 + Number(m[4]);
  if (close <= open) return null;
  return [open, close];
}

/** Toshkent "hozir": hafta kuni (0=Yak..6=Shan), kun ichidagi daqiqa va hours kaliti. */
export function tashkentNow(now: Date = new Date()): {
  weekday: number;
  minute: number;
  dayKey: 'mon_fri' | 'sat' | 'sun';
} {
  const t = new Date(now.getTime() + TZ_OFFSET_MIN * 60_000);
  const weekday = t.getUTCDay();
  const minute = t.getUTCHours() * 60 + t.getUTCMinutes();
  const dayKey = weekday === 0 ? 'sun' : weekday === 6 ? 'sat' : 'mon_fri';
  return { weekday, minute, dayKey };
}

/** Vendor `hours` JSON asosida hozir ish vaqti oynasida ochiqmi. */
export function isOpenNow(hours: unknown, now: Date = new Date()): boolean {
  const { weekday, minute } = tashkentNow(now);
  const win = windowForDay((hours ?? {}) as Hours, weekday);
  return win != null && minute >= win[0] && minute < win[1];
}

export interface GenerateSlotsOpts {
  dateStr: string;
  hours: Hours;
  durationMin: number;
  /** O'sha kundagi mavjud (band) bronlar — UTC oralig'i. */
  taken: Array<{ start: Date; end: Date }>;
  /** Hozirgi vaqt (UTC) — o'tgan slotlarni band deb belgilash uchun. */
  now: Date;
  /** Slot qadami; ko'rsatilmasa — xizmat davomiyligi. */
  stepMin?: number;
}

/**
 * Vendor ish vaqti + xizmat davomiyligi asosida slotlar to'plamini yasaydi va
 * mavjud bronlar/o'tgan vaqt bilan kesishganlarni `available: false` deb belgilaydi.
 */
export function generateSlots(opts: GenerateSlotsOpts): Slot[] {
  const [y, m, d] = opts.dateStr.split('-').map(Number);
  const weekday = new Date(Date.UTC(y!, m! - 1, d!)).getUTCDay();
  const win = windowForDay(opts.hours, weekday);
  if (!win) return [];

  const step = opts.stepMin && opts.stepMin > 0 ? opts.stepMin : opts.durationMin;
  const nowMs = opts.now.getTime();
  const slots: Slot[] = [];

  for (let t = win[0]; t + opts.durationMin <= win[1]; t += step) {
    const startUtc = tashkentToUtc(opts.dateStr, t);
    const endUtc = tashkentToUtc(opts.dateStr, t + opts.durationMin);
    const isPast = startUtc.getTime() <= nowMs;
    const overlaps = opts.taken.some(
      (b) => startUtc.getTime() < b.end.getTime() && endUtc.getTime() > b.start.getTime(),
    );
    slots.push({
      start: startUtc.toISOString(),
      end: endUtc.toISOString(),
      available: !isPast && !overlaps,
    });
  }
  return slots;
}
