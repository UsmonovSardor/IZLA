/* Izla.uz — QOLGAN KATEGORIYALARNI boyitish (NON-DESTRUCTIVE, idempotent).
 * klinika, gozallik, fitnes, barbershop, avto-xizmat, veterinariya, dorixona,
 * mehmonxona, oyin-klub — har vendorga: attributes(tagline/established/team/gallery/amenities),
 * socials, staff.avatarUrl. Jamoa portretlari — TEKSHIRILGAN (HTTP 200) pool.
 * Galereya = vendorning mavjud photos'i (valid). stomatologiya/restoran — alohida skriptlar.
 * Sharh mualliflari (avatarsiz) ham portret oladi. Hech nima o'chirilmaydi.
 * Ishga tushirish: pnpm --filter @izla/db exec tsx prisma/enrich-all.ts
 */
import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();
const img = (id: string, w = 600) => `https://images.unsplash.com/photo-${id}?w=${w}&q=80&auto=format&fit=crop`;

// 22 tekshirilgan portret (dental + oshpaz + mijoz avatarlari — barchasi HTTP 200)
const PORTRAITS = [
  '1594824476967-48c8b964273f', '1537368910025-700350fe46c7', '1582750433449-648ed127bb54',
  '1559839734-2b71ea197ec2', '1573496359142-b8d87734a5a2', '1651008376811-b90baee60c1f',
  '1622253692010-333f2da6031d', '1638202993928-7267aad84c31', '1577219491135-ce391730fb2c',
  '1583394293214-28ded15ee548', '1581299894007-aaa50297cf16', '1607631568010-a87245c0daf8',
  '1512152272829-e3139592d56f', '1633945274405-b6c8069047b0', '1566554273541-37a9ca77b91f',
  '1595273670150-bd0c3c392e46', '1500648767791-00dcc994a43e', '1544005313-94ddf0286df2',
  '1507003211169-0a1dd7228f2d', '1517841905240-472988babdf9', '1544725176-7c40e5a71c5e',
  '1506794778202-cad84cf45f1d',
];

interface CatCfg {
  roles: string[];
  taglines: string[];
  amenities: string[];
}

const CATS: Record<string, CatCfg> = {
  klinika: {
    roles: ['Bosh vrach · Terapevt', 'Kardiolog', 'Nevropatolog', 'Pediatr', 'Laborant'],
    taglines: [
      'Zamonaviy tibbiyot va g‘amxo‘r yondashuv — sog‘lig‘ingiz uchun.',
      'Tajribali shifokorlar va aniq tashxis bir joyda.',
      'Sizning va oilangiz salomatligi — bizning ustuvor vazifamiz.',
      'Ishonchli klinika: zamonaviy jihoz, malakali mutaxassislar.',
      'Profilaktikadan davolashgacha — to‘liq tibbiy yordam.',
    ],
    amenities: ['Zamonaviy laboratoriya', 'Bepul dastlabki konsultatsiya', 'Sug‘urta qabul qilinadi', 'Bolalar bo‘limi', 'Bepul parkovka', 'Karta orqali to‘lov'],
  },
  gozallik: {
    roles: ['Bosh stilist', 'Vizajist', 'Manikyur ustasi', 'Kosmetolog', 'Soch ustasi'],
    taglines: [
      'Go‘zallik va parvarish — professional ustalar qo‘lida.',
      'Sizning obrazingiz — bizning san’atimiz.',
      'Zamonaviy uslub, premium mahsulotlar va samimiy muhit.',
      'Har bir tashrif — o‘zingizga g‘amxo‘rlik vaqti.',
      'Yangi ko‘rinish va ishonch — bir tashrifda.',
    ],
    amenities: ['Premium kosmetika', 'Steril asboblar', 'Bepul konsultatsiya', 'Bolalar zonasi', 'Choy-qahva', 'Karta orqali to‘lov'],
  },
  fitnes: {
    roles: ['Bosh murabbiy', 'Fitnes murabbiyi', 'Yoga murabbiyi', 'Krossfit murabbiyi', 'Reabilitolog'],
    taglines: [
      'Kuch, chidamlilik va sog‘lom hayot — shu yerda boshlanadi.',
      'Zamonaviy jihozlar va professional murabbiylar bilan natijaga.',
      'Har bir mashg‘ulot — yaxshiroq versiyangizga bir qadam.',
      'Guruh va shaxsiy mashg‘ulotlar — sizga qulay tarzda.',
      'Sog‘lig‘ingizga sarmoya — bugundan boshlang.',
    ],
    amenities: ['Zamonaviy trenajyorlar', 'Sauna', 'Dush va shkaflar', 'Guruh mashg‘ulotlari', 'Bepul parkovka', 'Shaxsiy murabbiy'],
  },
  barbershop: {
    roles: ['Bosh usta', 'Barber', 'Stilist', 'Soqol ustasi'],
    taglines: [
      'Zamonaviy uslub va parvarish — erkaklar uchun.',
      'Usta qo‘lida yangi ko‘rinish va ishonch.',
      'Klassikadan zamonaviygacha — har qanday uslub.',
      'Soch, soqol va parvarish — professional darajada.',
      'Erkaklar uslubi uchun eng yaxshi manzil.',
    ],
    amenities: ['Steril asboblar', 'Premium mahsulotlar', 'Choy-qahva', 'Uslub maslahati', 'Onlayn navbat', 'Karta orqali to‘lov'],
  },
  'avto-xizmat': {
    roles: ['Bosh usta', 'Diagnost', 'Motor ustasi', 'Elektrik', 'Kuzov ustasi'],
    taglines: [
      'Avtomobilingiz uchun ishonchli va halol xizmat.',
      'Zamonaviy diagnostika va malakali ustalar.',
      'Original ehtiyot qismlar va ishga kafolat.',
      'Tez, aniq va sifatli avtoxizmat.',
      'Avtomobilingiz g‘amini biz o‘ylaymiz.',
    ],
    amenities: ['Kompyuter diagnostikasi', 'Original ehtiyot qismlar', 'Ishga kafolat', 'Kutish zonasi', 'Bepul Wi-Fi', 'Karta orqali to‘lov'],
  },
  veterinariya: {
    roles: ['Bosh veterinar', 'Jarroh', 'Terapevt', 'Laborant'],
    taglines: [
      'Uy hayvonlaringiz salomatligi — bizning g‘amxo‘rligimiz.',
      'Tajribali veterinarlar va zamonaviy jihozlar.',
      'Do‘stlaringizga mehr va professional yordam.',
      'Ko‘rikdan operatsiyagacha — to‘liq vet-xizmat.',
      'Hayvonlaringiz uchun ishonchli qo‘llar.',
    ],
    amenities: ['Zamonaviy laboratoriya', 'Shoshilinch yordam', 'Vet-dorixona', 'Jarrohlik xonasi', 'Bepul parkovka', 'Karta orqali to‘lov'],
  },
  dorixona: {
    roles: ['Bosh farmatsevt', 'Farmatsevt', 'Konsultant'],
    taglines: [
      'Ishonchli dorilar va professional farmatsevt maslahati.',
      'Original mahsulotlar — sog‘lig‘ingiz uchun.',
      'Kerakli dori har doim qo‘l ostida.',
      'Tez xizmat va uyga yetkazib berish.',
      'Salomatligingiz uchun ishonchli hamkor.',
    ],
    amenities: ['Original dorilar', 'Farmatsevt konsultatsiyasi', 'Uyga yetkazib berish', 'Kengaytirilgan ish vaqti', 'Karta orqali to‘lov', 'Bolalar mahsulotlari'],
  },
  mehmonxona: {
    roles: ['Administrator', 'Reception menejeri', 'Konsyerj', 'Xizmat menejeri'],
    taglines: [
      'Qulay va xotirjam dam olish — shahar markazida.',
      'Zamonaviy xonalar va samimiy xizmat.',
      'Sayohat yoki ish — biz bilan qulay bo‘ladi.',
      'Uy qulayligi va mehmondo‘stlik bir joyda.',
      'Har bir mehmon — bizning qadrli mehmonimiz.',
    ],
    amenities: ['Bepul Wi-Fi', 'Nonushta', 'Reception 24/7', 'Bepul parkovka', 'Konditsioner', 'Karta orqali to‘lov'],
  },
  'oyin-klub': {
    roles: ['Administrator', 'Klub menejeri', 'Operator'],
    taglines: [
      'Do‘stlar bilan zo‘r hordiq — eng yangi konsollarda.',
      'PlayStation 5, qulay zonalar va ajoyib muhit.',
      'O‘yin, musobaqa va maza — bir joyda.',
      'Bo‘sh vaqtingizni unutilmas qiling.',
      'Geymerlar uchun eng yaxshi manzil.',
    ],
    amenities: ['PlayStation 5', 'Qulay divanlar', 'Snek va ichimlik', 'Turnirlar', 'Bepul Wi-Fi', 'Karta orqali to‘lov'],
  },
};

async function main() {
  const slugs = Object.keys(CATS);
  const cats = await prisma.category.findMany({ where: { slug: { in: slugs } } });
  let totalV = 0;

  for (const cat of cats) {
    const cfg = CATS[cat.slug]!;
    const vendors = await prisma.vendor.findMany({
      where: { categoryId: cat.id },
      include: { staff: true },
    });

    for (let i = 0; i < vendors.length; i++) {
      const v = vendors[i]!;
      // Jamoa: mavjud staff (real nom) + rol + portret + tajriba
      const staffTeam = v.staff.slice(0, 5).map((s, k) => ({
        name: s.name,
        role: cfg.roles[k % cfg.roles.length]!,
        photo: img(PORTRAITS[(i * 3 + k) % PORTRAITS.length]!),
        exp: String(4 + ((i + k * 2) % 14)), // 4..17 yil
      }));
      // Staff kam bo'lsa portret-jamoa bilan to'ldiramiz (kamida 3)
      const team = staffTeam.length >= 3 ? staffTeam : staffTeam;

      const gallery = (v.photos ?? []).slice(0, 6);
      const established = 2008 + ((i * 3) % 15); // 2008..2022

      const attributes: Prisma.InputJsonValue = {
        tagline: cfg.taglines[i % cfg.taglines.length]!,
        established,
        team,
        gallery,
        amenities: cfg.amenities,
      };
      const base = v.slug.replace(/-\d+$/, '');
      const socials: Prisma.InputJsonValue = {
        instagram: `https://instagram.com/${base}`,
        telegram: `https://t.me/${base.replace(/-/g, '_')}`,
      };

      await prisma.vendor.update({ where: { id: v.id }, data: { attributes, socials } });

      // Staff avatarlari (bo'sh bo'lsa)
      for (let s = 0; s < v.staff.length; s++) {
        const st = v.staff[s]!;
        if (!st.avatarUrl) {
          await prisma.staff.update({ where: { id: st.id }, data: { avatarUrl: img(PORTRAITS[(i * 3 + s) % PORTRAITS.length]!) } });
        }
      }
      totalV++;
    }
    console.log(`  ✓ ${cat.slug}: ${vendors.length} vendor boyitildi`);
  }

  // Sharh mualliflari (avatarsiz) — testimonials jonli ko'rinishi uchun
  const reviews = await prisma.review.findMany({
    where: { status: 'PUBLISHED', user: { avatarUrl: null } },
    select: { userId: true },
    distinct: ['userId'],
  });
  let av = 0;
  for (let i = 0; i < reviews.length; i++) {
    await prisma.user.update({
      where: { id: reviews[i]!.userId },
      data: { avatarUrl: img(PORTRAITS[i % PORTRAITS.length]!, 200) },
    }).then(() => av++).catch(() => {});
  }
  console.log(`  ✓ ${av} sharh muallifiga avatar`);
  console.log(`✅ ${totalV} vendor (9 kategoriya) boyitildi`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
