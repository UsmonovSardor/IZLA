/* Izla Biznes — homiy portali seed (NON-DESTRUCTIVE, idempotent).
 * Demo homiy kompaniyalari yaratadi va mavjud kanal obyektlarini (Insurer/Bank/
 * NasiyaProvider) ularga biriktiradi — shunda egalik + dashboard agregatsiyasi
 * jonli ma'lumot bilan ishlaydi. Slug bo'yicha upsert.
 * Ishga tushirish: pnpm --filter @izla/db exec tsx prisma/seed-partners.ts (yoki Dockerfile CMD).
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

type PartnerPlan = 'FREE' | 'GROWTH' | 'ENTERPRISE';

interface PartnerSeed {
  slug: string;
  name: string;
  legalName: string;
  taxId: string;
  color: string;
  phone: string;
  email: string;
  website: string;
  plan: PartnerPlan;
  // Biriktiriladigan kanal obyektlari (slug bo'yicha)
  insurers?: string[];
  banks?: string[];
  nasiyaProviders?: string[];
}

const PARTNERS: PartnerSeed[] = [
  {
    slug: 'kafil-group',
    name: 'Kafil Sug‘urta',
    legalName: '“Kafil Sug‘urta Kompaniyasi” MChJ',
    taxId: '301234567',
    color: '#cf3337',
    phone: '+998 71 200 00 00',
    email: 'biznes@kafil.uz',
    website: 'https://kafil.uz',
    plan: 'GROWTH',
    insurers: ['kafil'],
  },
  {
    slug: 'ipoteka-bank-group',
    name: 'Ipoteka Bank',
    legalName: '“Ipoteka Bank” ATIB',
    taxId: '300123456',
    color: '#0b5cff',
    phone: '+998 71 150 11 11',
    email: 'partner@ipotekabank.uz',
    website: 'https://ipotekabank.uz',
    plan: 'ENTERPRISE',
    banks: ['ipoteka-bank'],
  },
  {
    slug: 'uzum-nasiya-group',
    name: 'Uzum Nasiya',
    legalName: '“Uzum” MChJ',
    taxId: '309876543',
    color: '#7C3AED',
    phone: '+998 78 555 00 00',
    email: 'partners@uzum.uz',
    website: 'https://uzum.uz',
    plan: 'FREE',
    nasiyaProviders: ['uzum-nasiya'],
  },
];

async function main() {
  const now = new Date();
  const in30 = new Date(now.getTime() + 30 * 24 * 3600 * 1000);

  for (const p of PARTNERS) {
    const partner = await prisma.partnerAccount.upsert({
      where: { slug: p.slug },
      update: {
        name: p.name,
        legalName: p.legalName,
        taxId: p.taxId,
        color: p.color,
        phone: p.phone,
        email: p.email,
        website: p.website,
        plan: p.plan,
        status: 'ACTIVE',
        planActivatedAt: p.plan === 'FREE' ? null : now,
        planExpiresAt: p.plan === 'FREE' ? null : in30,
      },
      create: {
        slug: p.slug,
        name: p.name,
        legalName: p.legalName,
        taxId: p.taxId,
        color: p.color,
        phone: p.phone,
        email: p.email,
        website: p.website,
        plan: p.plan,
        status: 'ACTIVE',
        planActivatedAt: p.plan === 'FREE' ? null : now,
        planExpiresAt: p.plan === 'FREE' ? null : in30,
      },
      select: { id: true, name: true },
    });

    // Hamyon (bo'lmasa yaratamiz)
    await prisma.partnerWallet.upsert({
      where: { partnerId: partner.id },
      update: {},
      create: { partnerId: partner.id, balance: 0 },
    });

    // Kanal obyektlarini biriktirish (idempotent: partnerId o'rnatiladi)
    if (p.insurers?.length) {
      await prisma.insurer.updateMany({ where: { slug: { in: p.insurers } }, data: { partnerId: partner.id } });
    }
    if (p.banks?.length) {
      await prisma.bank.updateMany({ where: { slug: { in: p.banks } }, data: { partnerId: partner.id } });
    }
    if (p.nasiyaProviders?.length) {
      await prisma.nasiyaProvider.updateMany({ where: { slug: { in: p.nasiyaProviders } }, data: { partnerId: partner.id } });
    }

    console.log(`✓ homiy: ${partner.name} (${p.plan})`);
  }

  const total = await prisma.partnerAccount.count();
  console.log(`Izla Biznes seed tugadi. Jami homiy: ${total}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
