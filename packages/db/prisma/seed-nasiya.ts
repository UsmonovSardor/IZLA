/* Nasiya / BNPL — seed (idempotent). Provayderlar + muddat ustamalari (terms).
 * terms = {oy: ustama-koeffitsent}. Slug bo'yicha upsert.
 */
import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

interface P {
  slug: string; name: string; color: string; rating: number; popular?: boolean;
  terms: Record<string, number>; merchantFee: number; min: number; max: number; features: string[]; description: string;
}

const PROVIDERS: P[] = [
  { slug: 'uzum-nasiya', name: 'Uzum Nasiya', color: '#7C3AED', rating: 4.8, popular: true,
    terms: { '3': 0, '6': 0.10, '9': 0.16, '12': 0.22 }, merchantFee: 0.04, min: 300_000, max: 30_000_000,
    features: ['3 oy 0% ustama', 'Ilovadan onlayn', 'Bir necha daqiqada qaror', 'Keng qamrov'], description: 'Eng mashhur nasiya xizmati — ilovadan bir necha daqiqada.' },
  { slug: 'alif-nasiya', name: 'Alif Nasiya', color: '#16A34A', rating: 4.6,
    terms: { '3': 0, '6': 0.09, '12': 0.20 }, merchantFee: 0.05, min: 200_000, max: 50_000_000,
    features: ['Yuqori limit (50 mln)', '3 oy 0%', 'Tez rasmiylashtirish'], description: 'Katta xaridlar uchun yuqori limitli nasiya.' },
  { slug: 'anor-nasiya', name: 'Anor', color: '#2563EB', rating: 4.5,
    terms: { '3': 0.03, '6': 0.12, '9': 0.18, '12': 0.24 }, merchantFee: 0.045, min: 500_000, max: 25_000_000,
    features: ['Moslashuvchan muddat', 'Onlayn ariza', 'Karta bilan boshqarish'], description: 'Bank asosidagi ishonchli nasiya.' },
  { slug: 'zoodpay', name: 'ZoodPay', color: '#EA580C', rating: 4.3,
    terms: { '3': 0, '4': 0.06, '6': 0.11 }, merchantFee: 0.06, min: 100_000, max: 15_000_000,
    features: ['Kichik xaridlarga', '4 to‘lov', 'Tez tasdiq'], description: 'Kichik va o‘rta xaridlar uchun qulay bo‘lib to‘lash.' },
  { slug: 'payme-nasiya', name: 'Payme Nasiya', color: '#00C4B4', rating: 4.6,
    terms: { '3': 0, '6': 0.10, '12': 0.21 }, merchantFee: 0.04, min: 300_000, max: 40_000_000,
    features: ['Payme ilovasida', '3 oy 0%', 'Avtomatik to‘lov'], description: 'Payme ekotizimidagi nasiya.' },
];

async function main() {
  let n = 0;
  for (const p of PROVIDERS) {
    const data = {
      name: p.name, color: p.color, rating: p.rating, verified: true, popular: !!p.popular,
      terms: p.terms as Prisma.InputJsonValue, merchantFee: new Prisma.Decimal(p.merchantFee),
      minAmount: new Prisma.Decimal(p.min), maxAmount: new Prisma.Decimal(p.max),
      features: p.features as Prisma.InputJsonValue, description: p.description, active: true,
    };
    await prisma.nasiyaProvider.upsert({ where: { slug: p.slug }, update: data, create: { slug: p.slug, ...data } });
    n++;
  }
  console.log(`[seed-nasiya] ${n} provayder upsert qilindi.`);
}

main().catch((e) => { console.error('[seed-nasiya] xato:', e); process.exit(1); }).finally(() => prisma.$disconnect());
