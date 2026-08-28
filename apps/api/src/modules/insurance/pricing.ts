/**
 * Sug'urta premiyasi hisoblash dvigateli (shaffof, senior).
 *
 * Har bir tur uchun premiya ANIQ formula bilan hisoblanadi va natijaga
 * `breakdown` — har bir koeffitsentni tushuntiruvchi ro'yxat — qo'shiladi.
 * Shu bois mijoz «nega bu summa» ekanini to'liq ko'radi (shaffoflik).
 *
 * Pul birligi: so'm (UZS). Barcha stavkalar illyustrativ/demo — real tarif
 * sug'urta kompaniyasi (Kafil) shartnomasiga qarab `product.tariff` JSON'da
 * boshqariladi (bu yerdagi DEFAULTS faqat zaxira).
 */

export type InsType = 'OSAGO' | 'KASKO' | 'TRAVEL' | 'PROPERTY' | 'ACCIDENT' | 'HEALTH';

export interface BreakdownRow {
  label: string; // koeffitsent / bosqich nomi
  factor?: number; // ko'paytuvchi (agar koeffitsent bo'lsa)
  value?: number; // so'mdagi qiymat (agar bosqich bo'lsa)
  note?: string; // qo'shimcha izoh (mijozga)
}

export interface QuoteResult {
  premium: number; // mijoz to'laydigan yakuniy summa (so'm)
  insuredSum: number; // sug'urta qoplamasi (so'm)
  breakdown: BreakdownRow[];
}

// so'mni 100 so'mga yaxlitlash (chiройli ko'rinishi uchun)
const round = (n: number) => Math.max(0, Math.round(n / 100) * 100);
const num = (v: unknown, def: number) => (typeof v === 'number' && isFinite(v) ? v : def);

type Tariff = Record<string, unknown>;

// ============================================================
// DEFAULT tariflar (zaxira — product.tariff bo'sh bo'lsa ishlatiladi)
// ============================================================
const DEFAULTS: Record<InsType, Tariff> = {
  OSAGO: {
    base: 120000, // bazaviy yillik premiya (so'm)
    insuredSum: 40_000_000, // qonuniy qoplama limiti
    vehicle: { car: 1.0, suv: 1.2, truck: 1.6, bus: 1.9, moto: 0.6 },
    region: { toshkent_shahar: 1.0, toshkent_viloyat: 0.9, boshqa: 0.75 },
    drivers: { limited: 1.0, unlimited: 1.5 },
    experience: { lt2: 1.3, mid: 1.1, exp: 1.0 }, // haydovchi staji: <2y / 2-5y / >5y
    period: { '12': 1.0, '6': 0.7 },
  },
  KASKO: {
    insuredSumDefault: 200_000_000, // avto qiymati (so'm)
    rateByAge: { new: 0.035, mid: 0.045, old: 0.06 }, // 0-3y / 3-7y / 7y+
    franchise: { none: 1.0, low: 0.9, high: 0.8 }, // franshiza 0 / 1% / 3%
    minPremium: 900000,
  },
  TRAVEL: {
    dailyBase: 8000, // 1 kun bazaviy (so'm)
    coverage: { '30000': 1.0, '50000': 1.4, '100000': 2.2 }, // qoplama (USD)
    usdRate: 12800, // qoplamani so'mda ko'rsatish uchun
    region: { cis: 0.7, schengen: 1.2, world: 1.5 },
    age: { child: 0.7, adult: 1.0, senior: 1.8 }, // 0-17 / 18-64 / 65+
    minPremium: 30000,
  },
  PROPERTY: {
    insuredSumDefault: 300_000_000,
    rate: 0.003, // 0.3%/yil
    kind: { apartment: 1.0, house: 1.15, dacha: 1.3 },
    minPremium: 250000,
  },
  ACCIDENT: {
    insuredSumDefault: 50_000_000,
    rate: 0.02, // 2%/yil
    occupation: { office: 1.0, worker: 1.4, extreme: 2.0 },
    persons: 1,
    minPremium: 120000,
  },
  HEALTH: {
    base: 1_800_000, // yillik bazaviy VMD paket (so'm)
    insuredSum: 100_000_000,
    plan: { standart: 1.0, kengaytirilgan: 1.6, premium: 2.4 },
    age: { young: 1.0, mid: 1.3, senior: 2.0 }, // 18-35 / 36-55 / 56+
    dental: 1.15, // stomatologiya qo'shilsa
    minPremium: 900000,
  },
};

function tariffFor(type: InsType, override?: Tariff): Tariff {
  const base = DEFAULTS[type];
  if (!override || Object.keys(override).length === 0) return base;
  return { ...base, ...override };
}

const pick = <T,>(map: Record<string, T>, key: string, fallbackKey: string): T =>
  map[key] ?? map[fallbackKey];

// ============================================================
// KALKULYATORLAR
// ============================================================
function quoteOsago(t: Tariff, p: Record<string, unknown>): QuoteResult {
  const base = num(t.base, 120000);
  const vehicle = t.vehicle as Record<string, number>;
  const region = t.region as Record<string, number>;
  const drivers = t.drivers as Record<string, number>;
  const experience = t.experience as Record<string, number>;
  const period = t.period as Record<string, number>;

  const kVeh = pick(vehicle, String(p.vehicle ?? 'car'), 'car');
  const kReg = pick(region, String(p.region ?? 'toshkent_shahar'), 'toshkent_shahar');
  const kDrv = pick(drivers, String(p.drivers ?? 'limited'), 'limited');
  const kExp = pick(experience, String(p.experience ?? 'exp'), 'exp');
  const kPer = pick(period, String(p.period ?? '12'), '12');

  const premium = round(base * kVeh * kReg * kDrv * kExp * kPer);
  const insuredSum = num(t.insuredSum, 40_000_000);

  const breakdown: BreakdownRow[] = [
    { label: 'Bazaviy tarif', value: base },
    { label: 'Transport turi', factor: kVeh },
    { label: 'Hudud', factor: kReg },
    { label: 'Haydovchilar', factor: kDrv, note: p.drivers === 'unlimited' ? 'Cheklanmagan' : 'Cheklangan' },
    { label: 'Haydovchi staji', factor: kExp },
    { label: 'Muddat', factor: kPer, note: `${p.period ?? 12} oy` },
  ];
  return { premium, insuredSum, breakdown };
}

function quoteKasko(t: Tariff, p: Record<string, unknown>): QuoteResult {
  const carValue = num(p.carValue, num(t.insuredSumDefault, 200_000_000));
  const rateByAge = t.rateByAge as Record<string, number>;
  const franchise = t.franchise as Record<string, number>;
  const rate = pick(rateByAge, String(p.age ?? 'mid'), 'mid');
  const kFr = pick(franchise, String(p.franchise ?? 'none'), 'none');

  let premium = carValue * rate * kFr;
  const minPremium = num(t.minPremium, 900000);
  const bumped = premium < minPremium;
  premium = round(Math.max(premium, minPremium));

  const breakdown: BreakdownRow[] = [
    { label: 'Avto qiymati (qoplama)', value: carValue },
    { label: 'Yillik stavka (avto yoshi)', factor: rate },
    { label: 'Franshiza', factor: kFr },
    ...(bumped ? [{ label: 'Minimal premiya qo‘llandi', note: 'Hisob minimaldan past edi' }] : []),
  ];
  return { premium, insuredSum: carValue, breakdown };
}

function quoteTravel(t: Tariff, p: Record<string, unknown>): QuoteResult {
  const days = Math.max(1, Math.round(num(p.days, 7)));
  const dailyBase = num(t.dailyBase, 8000);
  const coverage = t.coverage as Record<string, number>;
  const region = t.region as Record<string, number>;
  const age = t.age as Record<string, number>;
  const travelers = Math.max(1, Math.round(num(p.travelers, 1)));

  const covKey = String(p.coverage ?? '30000');
  const kCov = pick(coverage, covKey, '30000');
  const kReg = pick(region, String(p.region ?? 'schengen'), 'schengen');
  const kAge = pick(age, String(p.age ?? 'adult'), 'adult');

  let premium = days * dailyBase * kCov * kReg * kAge * travelers;
  const minPremium = num(t.minPremium, 30000);
  premium = round(Math.max(premium, minPremium));

  const usdRate = num(t.usdRate, 12800);
  const insuredSum = Number(covKey) * usdRate;

  const breakdown: BreakdownRow[] = [
    { label: 'Kunlik tarif', value: dailyBase },
    { label: 'Kunlar soni', factor: days },
    { label: 'Qoplama (USD)', factor: kCov, note: `$${Number(covKey).toLocaleString('en-US')}` },
    { label: 'Yo‘nalish', factor: kReg },
    { label: 'Yosh guruhi', factor: kAge },
    ...(travelers > 1 ? [{ label: 'Sayohatchilar', factor: travelers }] : []),
  ];
  return { premium, insuredSum, breakdown };
}

function quoteProperty(t: Tariff, p: Record<string, unknown>): QuoteResult {
  const value = num(p.propertyValue, num(t.insuredSumDefault, 300_000_000));
  const rate = num(t.rate, 0.003);
  const kind = t.kind as Record<string, number>;
  const kKind = pick(kind, String(p.kind ?? 'apartment'), 'apartment');

  let premium = value * rate * kKind;
  const minPremium = num(t.minPremium, 250000);
  premium = round(Math.max(premium, minPremium));

  const breakdown: BreakdownRow[] = [
    { label: 'Mol-mulk qiymati (qoplama)', value },
    { label: 'Yillik stavka', factor: rate },
    { label: 'Obyekt turi', factor: kKind },
  ];
  return { premium, insuredSum: value, breakdown };
}

function quoteAccident(t: Tariff, p: Record<string, unknown>): QuoteResult {
  const insuredSum = num(p.insuredSum, num(t.insuredSumDefault, 50_000_000));
  const rate = num(t.rate, 0.02);
  const occ = t.occupation as Record<string, number>;
  const kOcc = pick(occ, String(p.occupation ?? 'office'), 'office');
  const persons = Math.max(1, Math.round(num(p.persons, 1)));

  let premium = insuredSum * rate * kOcc * persons;
  const minPremium = num(t.minPremium, 120000);
  premium = round(Math.max(premium, minPremium));

  const breakdown: BreakdownRow[] = [
    { label: 'Qoplama summasi', value: insuredSum },
    { label: 'Yillik stavka', factor: rate },
    { label: 'Kasb xavfi', factor: kOcc },
    ...(persons > 1 ? [{ label: 'Insonlar soni', factor: persons }] : []),
  ];
  return { premium, insuredSum: insuredSum * persons, breakdown };
}

function quoteHealth(t: Tariff, p: Record<string, unknown>): QuoteResult {
  const base = num(t.base, 1_800_000);
  const plan = t.plan as Record<string, number>;
  const age = t.age as Record<string, number>;
  const kPlan = pick(plan, String(p.plan ?? 'standart'), 'standart');
  const kAge = pick(age, String(p.age ?? 'young'), 'young');
  const kDental = p.dental ? num(t.dental, 1.15) : 1;

  let premium = base * kPlan * kAge * kDental;
  const minPremium = num(t.minPremium, 900000);
  premium = round(Math.max(premium, minPremium));

  const breakdown: BreakdownRow[] = [
    { label: 'Bazaviy paket', value: base },
    { label: 'Paket darajasi', factor: kPlan },
    { label: 'Yosh guruhi', factor: kAge },
    ...(p.dental ? [{ label: 'Stomatologiya', factor: kDental }] : []),
  ];
  return { premium, insuredSum: num(t.insuredSum, 100_000_000), breakdown };
}

const CALCS: Record<InsType, (t: Tariff, p: Record<string, unknown>) => QuoteResult> = {
  OSAGO: quoteOsago,
  KASKO: quoteKasko,
  TRAVEL: quoteTravel,
  PROPERTY: quoteProperty,
  ACCIDENT: quoteAccident,
  HEALTH: quoteHealth,
};

/**
 * Premiyani hisoblaydi. `params` — mijoz kiritgan qiymatlar; `tariff` — mahsulot
 * tarifi (bo'sh bo'lsa DEFAULTS ishlatiladi).
 */
export function computeQuote(
  type: InsType,
  params: Record<string, unknown> = {},
  tariffOverride?: Tariff,
): QuoteResult {
  const calc = CALCS[type];
  if (!calc) throw new Error(`Noma'lum sug'urta turi: ${type}`);
  return calc(tariffFor(type, tariffOverride), params || {});
}

/** Izla komissiyasini hisoblaydi (biznes tomoni). */
export function commissionFor(premium: number, rate: number | string): number {
  const r = typeof rate === 'string' ? Number(rate) : rate;
  return round(premium * (isFinite(r) ? r : 0));
}
