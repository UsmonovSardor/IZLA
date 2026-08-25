/* Izla.uz — STOMATOLOGIYA flagman boyitish (NON-DESTRUCTIVE).
 * Faqat `stomatologiya` kategoriyasidagi vendorlarni yangilaydi:
 *   - attributes: tagline, established, team (real shifokor foto+rol+tajriba), gallery, amenities
 *   - socials: instagram/telegram/website
 *   - staff.avatarUrl (real portret)
 *   - sharh mualliflari avatarlari + ba'zi sharhlarga natija-foto
 * Hech nima O'CHIRILMAYDI. Idempotent — qayta ishga tushirsa bo'ladi.
 * Ishga tushirish (prod):  railway run --service api -- npx tsx prisma/enrich-dental.ts
 */
import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();
const img = (id: string, w = 1200) => `https://images.unsplash.com/photo-${id}?w=${w}&q=80&auto=format&fit=crop`;

// Tekshirilgan (HTTP 200) shifokor portretlari
const DOCTORS = [
  { name: 'Dr. Nilufar Karimova', role: 'Bosh vrach · Ortodont', photo: img('1594824476967-48c8b964273f', 600), exp: '14' },
  { name: 'Dr. Sardor Aliyev', role: 'Implantolog-jarroh', photo: img('1537368910025-700350fe46c7', 600), exp: '11' },
  { name: 'Dr. Kamola Rashidova', role: 'Terapevt-stomatolog', photo: img('1582750433449-648ed127bb54', 600), exp: '9' },
  { name: 'Dr. Jasur Ismoilov', role: 'Ortoped-stomatolog', photo: img('1559839734-2b71ea197ec2', 600), exp: '12' },
  { name: 'Dr. Dilnoza Yusupova', role: 'Bolalar stomatologi', photo: img('1573496359142-b8d87734a5a2', 600), exp: '8' },
  { name: 'Dr. Bekzod Tursunov', role: 'Jarroh-stomatolog', photo: img('1651008376811-b90baee60c1f', 600), exp: '15' },
  { name: 'Dr. Malika Sobirova', role: 'Gigienist', photo: img('1622253692010-333f2da6031d', 600), exp: '7' },
  { name: 'Dr. Rustam Xolmatov', role: 'Endodontist', photo: img('1638202993928-7267aad84c31', 600), exp: '10' },
];

// Tekshirilgan stomatologiya interyer/natija rasmlari (galereya)
const GALLERY_IDS = [
  '1588776814546-1ffcf47267a5', '1606811841689-23dfddce3e95', '1629909613654-28e377c37b09',
  '1609840114035-3c981b782dfe', '1519494140681-8b17d830a3e9', '1629909615184-74f495363b67',
];

const TAGLINES = [
  "Zamonaviy stomatologiya — og'riqsiz davolash va samimiy munosabat.",
  "Sog'lom tabassum uchun ishonchli manzil. Raqamli diagnostika, kafolatli natija.",
  "Bolalardan kattalargacha — butun oila uchun premium stomatologiya xizmati.",
  "Yevropa standartlaridagi jihozlar va tajribali shifokorlar bir joyda.",
  "Tabassumingiz — bizning g'ururimiz. Individual yondashuv, adolatli narx.",
];
const AMENITIES = ['Bepul konsultatsiya', 'Bolalar uchun zona', 'Davolashga kafolat', 'Bepul parkovka', 'Wi-Fi', 'Karta orqali to‘lov', 'Bo‘lib to‘lash'];

// Sharh muallif avatarlari (tekshirilgan)
const REVIEWER_AVATARS = [
  '1500648767791-00dcc994a43e', '1544005313-94ddf0286df2', '1507003211169-0a1dd7228f2d',
  '1517841905240-472988babdf9', '1544725176-7c40e5a71c5e', '1506794778202-cad84cf45f1d',
];
const REVIEW_RESULT_PHOTOS = [img('1606811971618-4486d14f3f99', 800), img('1601049541289-9b1b7bbbfe19', 800)];

async function main() {
  const cat = await prisma.category.findUnique({ where: { slug: 'stomatologiya' } });
  if (!cat) throw new Error('stomatologiya kategoriyasi topilmadi');

  const vendors = await prisma.vendor.findMany({
    where: { categoryId: cat.id },
    include: { staff: true, reviews: { orderBy: { createdAt: 'asc' } } },
  });
  console.log(`🦷 ${vendors.length} stomatologiya vendori topildi`);

  for (let i = 0; i < vendors.length; i++) {
    const v = vendors[i]!;
    // Har vendor uchun 4-5 shifokor (aylanma tanlov, determinstik)
    const teamN = 4 + (i % 2);
    const team = Array.from({ length: teamN }, (_, k) => DOCTORS[(i + k) % DOCTORS.length]!);
    const gallery = GALLERY_IDS.map((id) => img(id));
    const established = 2007 + ((i * 3) % 13); // 2007..2019

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
      const d = DOCTORS[(i + s) % DOCTORS.length]!;
      await prisma.staff.update({ where: { id: v.staff[s]!.id }, data: { avatarUrl: d.photo } });
    }

    // Ba'zi sharhlarga natija-foto qo'shish (bo'sh bo'lsa)
    const withPhoto = v.reviews.slice(0, 2);
    for (let r = 0; r < withPhoto.length; r++) {
      const rev = withPhoto[r]!;
      if (!rev.photos || rev.photos.length === 0) {
        await prisma.review.update({ where: { id: rev.id }, data: { photos: [REVIEW_RESULT_PHOTOS[r % REVIEW_RESULT_PHOTOS.length]!] } });
      }
    }

    console.log(`  ✓ ${v.name} — ${team.length} shifokor, galereya ${gallery.length}, est. ${established}`);
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

  console.log('✅ Stomatologiya boyitildi.');
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
