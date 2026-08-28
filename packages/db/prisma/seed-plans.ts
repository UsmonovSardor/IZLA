/* Demo vendor tariflari — seed (idempotent).
 * Har kategoriyada 1-vendor PREMIUM, 2-vendor PRO, qolgani FREE — badge va
 * take-rate/ranking demosini ko'rsatish uchun. Deterministik (createdAt tartibi).
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const cats = await prisma.category.findMany({ select: { id: true } });
  const now = new Date();
  const exp = new Date(now.getTime() + 30 * 24 * 3600 * 1000);
  let premium = 0, pro = 0;

  for (const c of cats) {
    const vendors = await prisma.vendor.findMany({
      where: { categoryId: c.id, status: 'ACTIVE' },
      orderBy: { createdAt: 'asc' },
      select: { id: true },
    });
    for (let i = 0; i < vendors.length; i++) {
      const plan = i === 0 ? 'PREMIUM' : i === 1 ? 'PRO' : 'FREE';
      await prisma.vendor.update({
        where: { id: vendors[i].id },
        data: {
          plan: plan as 'FREE' | 'PRO' | 'PREMIUM',
          planActivatedAt: plan === 'FREE' ? null : now,
          planExpiresAt: plan === 'FREE' ? null : exp,
        },
      });
      if (plan === 'PREMIUM') premium++;
      else if (plan === 'PRO') pro++;
    }
  }
  console.log(`[seed-plans] ${premium} PREMIUM, ${pro} PRO tayinlandi.`);
}

main()
  .catch((e) => { console.error('[seed-plans] xato:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
