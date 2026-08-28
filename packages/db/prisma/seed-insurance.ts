/* Sug'urta vertikali — seed (NON-DESTRUCTIVE, idempotent).
 * Sug'urta kompaniyalari (Kafil anchor + boshqalar) va mahsulotlar (OSAGO/KASKO/
 * TRAVEL/PROPERTY/ACCIDENT/HEALTH). Slug bo'yicha upsert.
 * Ishga tushirish: pnpm --filter @izla/db exec tsx prisma/seed-insurance.ts (yoki Dockerfile CMD).
 */
import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

type InsType = 'OSAGO' | 'KASKO' | 'TRAVEL' | 'PROPERTY' | 'ACCIDENT' | 'HEALTH';

interface InsurerSeed {
  slug: string;
  name: string;
  license: string;
  rating: number;
  verified: boolean;
  color: string;
  phone: string;
  description: string;
}

interface ProductSeed {
  insurer: string; // insurer slug
  type: InsType;
  slug: string;
  name: string;
  summary: string;
  tariff: Record<string, unknown>;
  commissionRate: number;
  priceFrom: number;
  coverageFrom: number;
  features: string[];
  termsMonths: number[];
  rating: number;
  popular?: boolean;
}

const INSURERS: InsurerSeed[] = [
  { slug: 'kafil', name: 'Kafil Sug‘urta', license: 'FR-0001', rating: 4.8, verified: true, color: '#cf3337', phone: '+998 78 140 44 44', description: 'O‘zbekistonning yetakchi raqamli sug‘urta kompaniyasi. Onlayn rasmiylashtirish, 24/7 qo‘llab-quvvatlash.' },
  { slug: 'apex', name: 'Apex Insurance', license: 'FR-0042', rating: 4.6, verified: true, color: '#2563EB', phone: '+998 71 200 00 42', description: 'Keng qamrovli sug‘urta yechimlari, tez to‘lovlar.' },
  { slug: 'gross', name: 'Gross Insurance', license: 'FR-0088', rating: 4.5, verified: true, color: '#0EA5A4', phone: '+998 71 205 88 88', description: 'Biznes va shaxsiy sug‘urta bo‘yicha ishonchli hamkor.' },
  { slug: 'trust', name: 'Trust Insurance', license: 'FR-0113', rating: 4.4, verified: true, color: '#7C3AED', phone: '+998 71 113 11 13', description: 'Avtomobil va mol-mulk sug‘urtasida tajribali.' },
  { slug: 'alskom', name: 'Alskom', license: 'FR-0007', rating: 4.3, verified: true, color: '#EA580C', phone: '+998 71 140 07 07', description: 'Sayohat va tibbiy sug‘urta bo‘yicha keng tarmoq.' },
];

const PRODUCTS: ProductSeed[] = [
  // ---------------- OSAGO ----------------
  {
    insurer: 'kafil', type: 'OSAGO', slug: 'kafil-osago', name: 'Kafil OSAGO',
    summary: 'Majburiy avtojavobgarlik sug‘urtasi — 2 daqiqada onlayn.',
    tariff: { base: 120000, insuredSum: 40_000_000 }, commissionRate: 0.2, priceFrom: 90000, coverageFrom: 40_000_000,
    features: ['2 daqiqada onlayn rasmiylashtirish', 'E-polis (elektron)', '24/7 avariya komissari', 'Butun O‘zbekiston bo‘ylab'], termsMonths: [12, 6], rating: 4.8, popular: true,
  },
  {
    insurer: 'apex', type: 'OSAGO', slug: 'apex-osago', name: 'Apex OSAGO',
    summary: 'Ishonchli majburiy sug‘urta, tez to‘lov.',
    tariff: { base: 128000, insuredSum: 40_000_000 }, commissionRate: 0.18, priceFrom: 96000, coverageFrom: 40_000_000,
    features: ['E-polis', 'Onlayn ariza', 'SMS eslatma yangilanish'], termsMonths: [12, 6], rating: 4.5,
  },
  {
    insurer: 'gross', type: 'OSAGO', slug: 'gross-osago', name: 'Gross OSAGO',
    summary: 'Eng arzon bazaviy tarif.',
    tariff: { base: 112000, insuredSum: 40_000_000 }, commissionRate: 0.15, priceFrom: 84000, coverageFrom: 40_000_000,
    features: ['Eng arzon tarif', 'E-polis', 'Onlayn to‘lov'], termsMonths: [12, 6], rating: 4.4,
  },
  // ---------------- KASKO ----------------
  {
    insurer: 'kafil', type: 'KASKO', slug: 'kafil-kasko', name: 'Kafil KASKO Premium',
    summary: 'Avtomobilingiz uchun to‘liq himoya — o‘g‘irlik, avariya, tabiat.',
    tariff: { rateByAge: { new: 0.035, mid: 0.045, old: 0.06 }, minPremium: 900000 }, commissionRate: 0.15, priceFrom: 900000, coverageFrom: 200_000_000,
    features: ['O‘g‘irlik va yong‘indan himoya', 'Evakuator xizmati', 'Franshizasiz variant', 'Butun dunyo qoplamasi'], termsMonths: [12], rating: 4.7, popular: true,
  },
  {
    insurer: 'trust', type: 'KASKO', slug: 'trust-kasko', name: 'Trust KASKO',
    summary: 'Moslashuvchan franshiza bilan tejamkor KASKO.',
    tariff: { rateByAge: { new: 0.04, mid: 0.05, old: 0.065 }, minPremium: 1100000 }, commissionRate: 0.12, priceFrom: 1100000, coverageFrom: 150_000_000,
    features: ['Moslashuvchan franshiza', 'Tezkor ekspertiza', 'Servis tarmog‘i'], termsMonths: [12], rating: 4.4,
  },
  // ---------------- TRAVEL ----------------
  {
    insurer: 'kafil', type: 'TRAVEL', slug: 'kafil-travel', name: 'Kafil Sayohat',
    summary: 'Chet elga xavfsiz sayohat — tibbiy xarajatlar qoplanadi.',
    tariff: { dailyBase: 8000, usdRate: 12800 }, commissionRate: 0.3, priceFrom: 30000, coverageFrom: 384_000_000,
    features: ['Shengen viza uchun mos', 'Tibbiy xarajatlar $30k dan', 'COVID qoplamasi', 'Onlayn e-polis'], termsMonths: [12], rating: 4.8, popular: true,
  },
  {
    insurer: 'apex', type: 'TRAVEL', slug: 'apex-travel', name: 'Apex Travel',
    summary: 'Butun dunyo bo‘ylab keng qoplama.',
    tariff: { dailyBase: 9500, usdRate: 12800 }, commissionRate: 0.25, priceFrom: 42000, coverageFrom: 384_000_000,
    features: ['$100k gacha qoplama', 'Bagaj sug‘urtasi', '24/7 assistans'], termsMonths: [12], rating: 4.5,
  },
  {
    insurer: 'alskom', type: 'TRAVEL', slug: 'alskom-travel-world', name: 'Alskom Travel World',
    summary: 'Faol dam olish va sport uchun.',
    tariff: { dailyBase: 11000, usdRate: 12800 }, commissionRate: 0.22, priceFrom: 56000, coverageFrom: 640_000_000,
    features: ['Ekstremal sport qoplamasi', 'Butun dunyo', 'Reys kechikishi'], termsMonths: [12], rating: 4.3,
  },
  // ---------------- PROPERTY ----------------
  {
    insurer: 'kafil', type: 'PROPERTY', slug: 'kafil-uy', name: 'Kafil Uy-Joy',
    summary: 'Kvartira va uy — yong‘in, suv toshqini, o‘g‘irlikdan himoya.',
    tariff: { rate: 0.003, minPremium: 250000 }, commissionRate: 0.2, priceFrom: 250000, coverageFrom: 300_000_000,
    features: ['Yong‘in va suv toshqini', 'Uy jihozlari qoplamasi', 'Uchinchi shaxs oldida javobgarlik', 'Ipoteka uchun mos'], termsMonths: [12], rating: 4.6, popular: true,
  },
  {
    insurer: 'gross', type: 'PROPERTY', slug: 'gross-uy', name: 'Gross Uy-Joy',
    summary: 'Uy-joy uchun bazaviy himoya paketi.',
    tariff: { rate: 0.0028, minPremium: 220000 }, commissionRate: 0.18, priceFrom: 220000, coverageFrom: 250_000_000,
    features: ['Bazaviy risklar', 'Tez rasmiylashtirish', 'Arzon tarif'], termsMonths: [12], rating: 4.3,
  },
  // ---------------- ACCIDENT ----------------
  {
    insurer: 'kafil', type: 'ACCIDENT', slug: 'kafil-baxtsiz-hodisa', name: 'Kafil Baxtsiz Hodisa',
    summary: 'Sog‘lig‘ingiz uchun kafolat — baxtsiz hodisadan himoya.',
    tariff: { rate: 0.02, minPremium: 120000 }, commissionRate: 0.25, priceFrom: 120000, coverageFrom: 50_000_000,
    features: ['24/7 himoya', 'Oila paketi', 'Sport shikastlanishlari', 'Tez to‘lov'], termsMonths: [12], rating: 4.7, popular: true,
  },
  {
    insurer: 'trust', type: 'ACCIDENT', slug: 'trust-accident', name: 'Trust Baxtsiz Hodisa',
    summary: 'Xodimlar va jamoalar uchun guruh sug‘urtasi.',
    tariff: { rate: 0.018, minPremium: 110000 }, commissionRate: 0.2, priceFrom: 110000, coverageFrom: 40_000_000,
    features: ['Guruh chegirmasi', 'Ish beruvchilar uchun', 'Kengaytiriladigan qoplama'], termsMonths: [12], rating: 4.3,
  },
  // ---------------- HEALTH ----------------
  {
    insurer: 'kafil', type: 'HEALTH', slug: 'kafil-vmd', name: 'Kafil Tibbiy (VMD)',
    summary: 'Ixtiyoriy tibbiy sug‘urta — eng yaxshi klinikalar tarmog‘i.',
    tariff: { base: 1_800_000, insuredSum: 100_000_000 }, commissionRate: 0.2, priceFrom: 900000, coverageFrom: 100_000_000,
    features: ['Poliklinika va statsionar', 'Stomatologiya opsiyasi', 'Tez tibbiy yordam', 'Onlayn shifokor'], termsMonths: [12], rating: 4.6, popular: true,
  },
  {
    insurer: 'apex', type: 'HEALTH', slug: 'apex-health', name: 'Apex Health',
    summary: 'Oila uchun qulay tibbiy paket.',
    tariff: { base: 1_600_000, insuredSum: 80_000_000 }, commissionRate: 0.18, priceFrom: 800000, coverageFrom: 80_000_000,
    features: ['Oila tarifi', 'Profilaktika', 'Keng klinika tarmog‘i'], termsMonths: [12], rating: 4.4,
  },
];

async function main() {
  // 1) Kompaniyalar
  const idBySlug = new Map<string, string>();
  for (const ins of INSURERS) {
    const row = await prisma.insurer.upsert({
      where: { slug: ins.slug },
      update: { name: ins.name, license: ins.license, rating: ins.rating, verified: ins.verified, color: ins.color, phone: ins.phone, description: ins.description },
      create: { slug: ins.slug, name: ins.name, license: ins.license, rating: ins.rating, verified: ins.verified, color: ins.color, phone: ins.phone, description: ins.description },
      select: { id: true },
    });
    idBySlug.set(ins.slug, row.id);
  }

  // 2) Mahsulotlar
  let created = 0;
  for (const p of PRODUCTS) {
    const insurerId = idBySlug.get(p.insurer);
    if (!insurerId) continue;
    await prisma.insuranceProduct.upsert({
      where: { slug: p.slug },
      update: {
        insurerId, type: p.type, name: p.name, summary: p.summary,
        tariff: p.tariff as Prisma.InputJsonValue, commissionRate: new Prisma.Decimal(p.commissionRate),
        priceFrom: new Prisma.Decimal(p.priceFrom), coverageFrom: new Prisma.Decimal(p.coverageFrom),
        features: p.features as Prisma.InputJsonValue, termsMonths: p.termsMonths, rating: p.rating, popular: !!p.popular, active: true,
      },
      create: {
        insurerId, type: p.type, name: p.name, slug: p.slug, summary: p.summary,
        tariff: p.tariff as Prisma.InputJsonValue, commissionRate: new Prisma.Decimal(p.commissionRate),
        priceFrom: new Prisma.Decimal(p.priceFrom), coverageFrom: new Prisma.Decimal(p.coverageFrom),
        features: p.features as Prisma.InputJsonValue, termsMonths: p.termsMonths, rating: p.rating, popular: !!p.popular,
      },
    });
    created++;
  }

  console.log(`[seed-insurance] ${INSURERS.length} kompaniya, ${created} mahsulot upsert qilindi.`);
}

main()
  .catch((e) => {
    console.error('[seed-insurance] xato:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
