/* Ipoteka vertikali — seed (NON-DESTRUCTIVE, idempotent).
 * Hamkor banklar + ipoteka dasturlari. Slug bo'yicha upsert.
 * monthlyFrom — annuitet bilan namunaviy stsenariyda (500 mln, minDown, maxTerm) hisoblanadi.
 */
import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

// annuitet oylik to'lov (seed uchun inline, api mortgage-calc bilan bir xil formula)
function monthly(price: number, downPct: number, termMonths: number, annualRate: number): number {
  const loan = price - Math.round((price * downPct) / 100);
  const r = annualRate / 100 / 12;
  const m = r === 0 ? loan / termMonths : (loan * r * Math.pow(1 + r, termMonths)) / (Math.pow(1 + r, termMonths) - 1);
  return Math.round(m);
}

interface BankSeed { slug: string; name: string; license: string; rating: number; color: string; phone: string; description: string }
interface ProgramSeed {
  bank: string; slug: string; name: string; summary: string;
  annualRate: number; maxTermMonths: number; minDownPct: number; maxAmount: number;
  propertyTypes: string[]; features: string[]; referralFee: number; rating: number; popular?: boolean; subsidized?: boolean;
}

const BANKS: BankSeed[] = [
  { slug: 'ipoteka-bank', name: 'Ipoteka Bank', license: 'BR-0001', rating: 4.7, color: '#1E4FD8', phone: '+998 78 150 11 11', description: 'O‘zbekistonda ipoteka bo‘yicha yetakchi bank.' },
  { slug: 'sqb', name: 'SQB (Sanoatqurilishbank)', license: 'BR-0002', rating: 4.5, color: '#0B7A4B', phone: '+998 78 147 07 00', description: 'Uy-joy va biznes kreditlari.' },
  { slug: 'hamkorbank', name: 'Hamkorbank', license: 'BR-0013', rating: 4.6, color: '#E11D48', phone: '+998 78 140 20 20', description: 'Oson va tez ipoteka rasmiylashtirish.' },
  { slug: 'kapitalbank', name: 'Kapitalbank', license: 'BR-0021', rating: 4.4, color: '#F59E0B', phone: '+998 71 205 05 05', description: 'Keng ipoteka dasturlari tarmog‘i.' },
  { slug: 'agrobank', name: 'Agrobank', license: 'BR-0008', rating: 4.3, color: '#15803D', phone: '+998 71 231 80 80', description: 'Qishloq va yosh oilalar uchun imtiyozli dasturlar.' },
  { slug: 'tbc', name: 'TBC Bank', license: 'BR-0044', rating: 4.5, color: '#0EA5A4', phone: '+998 78 555 00 00', description: 'To‘liq onlayn raqamli ipoteka.' },
];

const PROGRAMS: ProgramSeed[] = [
  { bank: 'ipoteka-bank', slug: 'ipoteka-bank-yangi-uy', name: 'Yangi uy (imtiyozli)', summary: 'Yangi qurilgan uylar uchun imtiyozli ipoteka.', annualRate: 17, maxTermMonths: 240, minDownPct: 15, maxAmount: 1_500_000_000, propertyTypes: ['NEW', 'CONSTRUCTION'], features: ['15% boshlang‘ich to‘lov', '20 yilgacha muddat', 'Onlayn ariza', 'Davlat subsidiyasi'], referralFee: 2_500_000, rating: 4.8, popular: true, subsidized: true },
  { bank: 'ipoteka-bank', slug: 'ipoteka-bank-ikkilamchi', name: 'Ikkilamchi uy-joy', summary: 'Eski (ikkilamchi) uylar uchun ipoteka.', annualRate: 24, maxTermMonths: 180, minDownPct: 25, maxAmount: 1_200_000_000, propertyTypes: ['SECONDARY'], features: ['15 yilgacha', 'Tez ko‘rib chiqish', 'Ekspertiza xizmati'], referralFee: 2_000_000, rating: 4.5 },
  { bank: 'sqb', slug: 'sqb-ipoteka-plus', name: 'Ipoteka Plus', summary: 'Universal ipoteka — yangi va ikkilamchi uylar.', annualRate: 22, maxTermMonths: 240, minDownPct: 20, maxAmount: 1_400_000_000, propertyTypes: ['NEW', 'SECONDARY', 'CONSTRUCTION'], features: ['Barcha turdagi uylar', '20 yilgacha', 'Kafolatlangan stavka'], referralFee: 2_200_000, rating: 4.5 },
  { bank: 'hamkorbank', slug: 'hamkorbank-oson-ipoteka', name: 'Oson ipoteka', summary: 'Minimal hujjat bilan tez rasmiylashtirish.', annualRate: 23, maxTermMonths: 180, minDownPct: 20, maxAmount: 1_000_000_000, propertyTypes: ['NEW', 'SECONDARY'], features: ['24 soatda javob', 'Minimal hujjat', 'Onlayn to‘lov'], referralFee: 2_000_000, rating: 4.6, popular: true },
  { bank: 'kapitalbank', slug: 'kapitalbank-novostroyka', name: 'Novostroyka', summary: 'Novostroyka kvartiralari uchun.', annualRate: 20, maxTermMonths: 240, minDownPct: 20, maxAmount: 1_600_000_000, propertyTypes: ['NEW', 'CONSTRUCTION'], features: ['Quruvchilar bilan hamkorlik', '20 yilgacha', 'Bosqichma-bosqich to‘lov'], referralFee: 2_400_000, rating: 4.4 },
  { bank: 'kapitalbank', slug: 'kapitalbank-kvartira', name: 'Kvartira', summary: 'Ikkilamchi bozor kvartiralari.', annualRate: 26, maxTermMonths: 120, minDownPct: 25, maxAmount: 900_000_000, propertyTypes: ['SECONDARY'], features: ['10 yilgacha', 'Tez qaror', 'Kredit ta’tili'], referralFee: 1_800_000, rating: 4.2 },
  { bank: 'agrobank', slug: 'agrobank-qishloq-uy', name: 'Qishloq uy-joy (imtiyozli)', summary: 'Qishloq joylar uchun imtiyozli davlat dasturi.', annualRate: 10, maxTermMonths: 240, minDownPct: 15, maxAmount: 800_000_000, propertyTypes: ['NEW', 'CONSTRUCTION'], features: ['Eng past stavka', 'Davlat subsidiyasi', '20 yilgacha'], referralFee: 3_000_000, rating: 4.7, popular: true, subsidized: true },
  { bank: 'agrobank', slug: 'agrobank-yosh-oila', name: 'Yosh oila (imtiyozli)', summary: 'Yosh oilalar uchun imtiyozli ipoteka.', annualRate: 14, maxTermMonths: 240, minDownPct: 15, maxAmount: 1_000_000_000, propertyTypes: ['NEW', 'SECONDARY'], features: ['Yosh oilalarga', 'Past stavka', 'Subsidiya'], referralFee: 2_600_000, rating: 4.6, subsidized: true },
  { bank: 'tbc', slug: 'tbc-raqamli-ipoteka', name: 'Raqamli ipoteka', summary: 'To‘liq onlayn — filialsiz rasmiylashtirish.', annualRate: 27, maxTermMonths: 120, minDownPct: 30, maxAmount: 700_000_000, propertyTypes: ['NEW', 'SECONDARY'], features: ['100% onlayn', 'Ilovadan boshqarish', 'Tez qaror'], referralFee: 1_600_000, rating: 4.5 },
  { bank: 'sqb', slug: 'sqb-yoshlar-uy', name: 'Yoshlar uy-joyi', summary: 'Yoshlar uchun maxsus shartlar.', annualRate: 19, maxTermMonths: 240, minDownPct: 20, maxAmount: 1_100_000_000, propertyTypes: ['NEW', 'CONSTRUCTION'], features: ['Yoshlarga imtiyoz', '20 yilgacha', 'Onlayn ariza'], referralFee: 2_300_000, rating: 4.4, subsidized: true },
];

async function main() {
  const idBySlug = new Map<string, string>();
  for (const b of BANKS) {
    const row = await prisma.bank.upsert({
      where: { slug: b.slug },
      update: { name: b.name, license: b.license, rating: b.rating, verified: true, color: b.color, phone: b.phone, description: b.description },
      create: { slug: b.slug, name: b.name, license: b.license, rating: b.rating, verified: true, color: b.color, phone: b.phone, description: b.description },
      select: { id: true },
    });
    idBySlug.set(b.slug, row.id);
  }

  let n = 0;
  for (const p of PROGRAMS) {
    const bankId = idBySlug.get(p.bank);
    if (!bankId) continue;
    const monthlyFrom = monthly(500_000_000, p.minDownPct, p.maxTermMonths, p.annualRate);
    const data = {
      bankId, name: p.name, summary: p.summary,
      annualRate: new Prisma.Decimal(p.annualRate), maxTermMonths: p.maxTermMonths, minDownPct: p.minDownPct,
      maxAmount: new Prisma.Decimal(p.maxAmount), propertyTypes: p.propertyTypes,
      features: p.features as Prisma.InputJsonValue, referralFee: new Prisma.Decimal(p.referralFee),
      monthlyFrom: new Prisma.Decimal(monthlyFrom), rating: p.rating, popular: !!p.popular, subsidized: !!p.subsidized, active: true,
    };
    await prisma.mortgageProgram.upsert({ where: { slug: p.slug }, update: data, create: { slug: p.slug, ...data } });
    n++;
  }
  console.log(`[seed-mortgage] ${BANKS.length} bank, ${n} dastur upsert qilindi.`);
}

main()
  .catch((e) => { console.error('[seed-mortgage] xato:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
