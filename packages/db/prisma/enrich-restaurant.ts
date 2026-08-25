/* Izla.uz — RESTORAN flagman boyitish (NON-DESTRUCTIVE).
 * Faqat `restoran` kategoriyasidagi vendorlarni yangilaydi:
 *   - attributes: tagline, established, team (real oshpaz foto+rol+tajriba), gallery, amenities
 *   - socials: instagram/telegram
 *   - staff.avatarUrl (real portret)
 *   - sharh mualliflari avatarlari + ba'zi sharhlarga taom-foto
 * Hech nima O'CHIRILMAYDI. Idempotent — qayta ishga tushirsa bo'ladi.
 * Ishga tushirish (prod):  railway run --service api -- npx tsx prisma/enrich-restaurant.ts
 */
import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();
const img = (id: string, w = 1200) => `https://images.unsplash.com/photo-${id}?w=${w}&q=80&auto=format&fit=crop`;

// Tekshirilgan (HTTP 200) oshpaz portretlari
const CHEFS = [
  { name: "Oshpaz Akmal Yo'ldoshev", role: 'Bosh oshpaz (shef-povar)', photo: img('1577219491135-ce391730fb2c', 600), exp: '16' },
  { name: 'Oshpaz Zafar Rahimov', role: 'Milliy taomlar ustasi', photo: img('1583394293214-28ded15ee548', 600), exp: '12' },
  { name: 'Oshpaz Kamola Nazarova', role: 'Qandolatchi (pastry)', photo: img('1581299894007-aaa50297cf16', 600), exp: '9' },
  { name: 'Oshpaz Bobur Aliyev', role: 'Grill va kabob ustasi', photo: img('1607631568010-a87245c0daf8', 600), exp: '14' },
  { name: 'Oshpaz Nigora Sattorova', role: 'Yevropa oshxonasi', photo: img('1512152272829-e3139592d56f', 600), exp: '10' },
  { name: 'Oshpaz Sardor Umarov', role: 'Sous-chef', photo: img('1633945274405-b6c8069047b0', 600), exp: '8' },
  { name: 'Oshpaz Dilshod Qodirov', role: 'Osiyo oshxonasi', photo: img('1566554273541-37a9ca77b91f', 600), exp: '11' },
  { name: 'Oshpaz Malika Yusupova', role: 'Salat va sovuq taomlar', photo: img('1595273670150-bd0c3c392e46', 600), exp: '7' },
];

// Tekshirilgan interyer/taom rasmlari (galereya)
const GALLERY_IDS = [
  '1517248135467-4c7edcad34c4', '1414235077428-338989a2e8c0', '1552566626-52f8b828add9',
  '1504674900247-0877df9cc836', '1600891964092-4316c288032e', '1540189549336-e6e99c3679fe',
];

const TAGLINES = [
  "Milliy va jahon taomlari — samimiy muhitda, oilangiz bilan.",
  "Har bir taom — mahorat va yangi mahsulotlardan. Sizni kutamiz!",
  "Shahar markazida — mazali taomlar va issiq muloqot.",
  "Do‘stlar davrasi, oilaviy kechalar va bayramlar uchun ideal manzil.",
  "Yangi pishirilgan non hidi, oshpaz mahorati va unutilmas ta'm.",
];
const AMENITIES = ['Yozgi terrassa', 'Bolalar zonasi', 'Bepul Wi-Fi', 'Bepul parkovka', 'Jonli musiqa', 'Yetkazib berish', 'Karta orqali to‘lov', 'Banket zali', 'Halal'];

// Sharh muallif avatarlari (tekshirilgan)
const REVIEWER_AVATARS = [
  '1500648767791-00dcc994a43e', '1544005313-94ddf0286df2', '1507003211169-0a1dd7228f2d',
  '1517841905240-472988babdf9', '1544725176-7c40e5a71c5e', '1506794778202-cad84cf45f1d',
];
// Tekshirilgan taom-foto (sharh natijasi)
const REVIEW_FOOD_PHOTOS = [img('1565299624946-b28f40a0ae38', 800), img('1546069901-ba9599a7e63c', 800)];

async function main() {
  const cat = await prisma.category.findUnique({ where: { slug: 'restoran' } });
  if (!cat) throw new Error('restoran kategoriyasi topilmadi');

  const vendors = await prisma.vendor.findMany({
    where: { categoryId: cat.id },
    include: { staff: true, reviews: { orderBy: { createdAt: 'asc' } } },
  });
  console.log(`🍽️  ${vendors.length} restoran vendori topildi`);

  for (let i = 0; i < vendors.length; i++) {
    const v = vendors[i]!;
    const teamN = 4 + (i % 2); // 4-5 oshpaz (determinstik aylanma)
    const team = Array.from({ length: teamN }, (_, k) => CHEFS[(i + k) % CHEFS.length]!);
    const gallery = GALLERY_IDS.map((id) => img(id));
    const established = 2005 + ((i * 3) % 16); // 2005..2020

    const attributes: Prisma.InputJsonValue = {
      tagline: TAGLINES[i % TAGLINES.length]!,
      established,
      team,
      gallery,
      amenities: AMENITIES,
    };
    const socials: Prisma.InputJsonValue = {
      instagram: `https://instagram.com/${v.slug.replace(/-\d+$/, '')}`,
      telegram: `https://t.me/${v.slug.replace(/-/g, '_')}`,
    };

    await prisma.vendor.update({ where: { id: v.id }, data: { attributes, socials } });

    // Staff avatarlari (real portret)
    for (let s = 0; s < v.staff.length; s++) {
      const c = CHEFS[(i + s) % CHEFS.length]!;
      await prisma.staff.update({ where: { id: v.staff[s]!.id }, data: { avatarUrl: c.photo } });
    }

    // Ba'zi sharhlarga taom-foto (bo'sh bo'lsa)
    const withPhoto = v.reviews.slice(0, 2);
    for (let r = 0; r < withPhoto.length; r++) {
      const rev = withPhoto[r]!;
      if (!rev.photos || rev.photos.length === 0) {
        await prisma.review.update({ where: { id: rev.id }, data: { photos: [REVIEW_FOOD_PHOTOS[r % REVIEW_FOOD_PHOTOS.length]!] } });
      }
    }

    console.log(`  ✓ ${v.name} — ${team.length} oshpaz, galereya ${gallery.length}, est. ${established}`);
  }

  // Sharh mualliflari avatarlari (demo mijozlar, faqat bo'sh bo'lsa)
  const reviewerPhones = Array.from({ length: 6 }, (_, i) => `+99890111${(1000 + i).toString()}`);
  const reviewers = await prisma.user.findMany({ where: { phone: { in: reviewerPhones } } });
  for (let i = 0; i < reviewers.length; i++) {
    const u = reviewers[i]!;
    if (!u.avatarUrl) {
      await prisma.user.update({ where: { id: u.id }, data: { avatarUrl: img(REVIEWER_AVATARS[i % REVIEWER_AVATARS.length]!, 200) } });
    }
  }
  console.log(`  ✓ ${reviewers.length} sharh muallifiga avatar`);

  console.log('✅ Restoran boyitildi.');
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
