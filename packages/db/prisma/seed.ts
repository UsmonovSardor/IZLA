/* Izla.uz — seed: real Toshkent tumanlari + boy (demo) ma'lumot
 * Rasmlar: kuratsiya qilingan, kategoriyaga MOS Unsplash to'plami (verifikatsiya qilingan ID'lar).
 * Qayta seed uchun:  SEED_RESET=1 tsx prisma/seed.ts
 */
import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

const DISTRICTS = [
  'Chilonzor', 'Yunusobod', 'Mirzo Ulug‘bek', 'Yakkasaroy', 'Shayxontohur',
  'Mirobod', 'Olmazor', 'Sergeli', 'Yashnobod', 'Bektemir', 'Uchtepa',
];

// Toshkent markazi ~ 41.311, 69.279 — atrofida real tarqatish
function around(baseLat = 41.311, baseLng = 69.279, spread = 0.09) {
  return {
    lat: +(baseLat + (Math.random() - 0.5) * spread).toFixed(6),
    lng: +(baseLng + (Math.random() - 0.5) * spread).toFixed(6),
  };
}
const rnd = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)]!;

// ===== Kuratsiya qilingan rasm banki (Unsplash, kategoriyaga mos, tekshirilgan) =====
function img(id: string, w = 1200): string {
  return `https://images.unsplash.com/photo-${id}?w=${w}&q=80&auto=format&fit=crop`;
}
const IMG: Record<string, string[]> = {
  klinika: ['1519494026892-80bbd2d6fd0d', '1538108149393-fbbd81895907', '1576091160399-112ba8d25d1d', '1631217868264-e5b90bb7e133', '1586773860418-d37222d8fce3', '1516549655169-df83a0774514'],
  stomatologiya: ['1588776814546-1ffcf47267a5', '1606811841689-23dfddce3e95', '1629909613654-28e377c37b09', '1609840114035-3c981b782dfe', '1519494140681-8b17d830a3e9', '1629909615184-74f495363b67'],
  gozallik: ['1560066984-138dadb4c035', '1522337660859-02fbefca4702', '1595476108010-b4d1f102b1b1', '1487412947147-5cebf100ffc2', '1552693673-1bf958298935', '1633681926035-ec1ac984418a'],
  fitnes: ['1534438327276-14e5300c3a48', '1571902943202-507ec2618e8f', '1517836357463-d25dfeac3438', '1594381898411-846e7d193883', '1637666062717-1c6bcfa4a4df', '1518611012118-696072aa579a'],
  restoran: ['1517248135467-4c7edcad34c4', '1414235077428-338989a2e8c0', '1552566626-52f8b828add9', '1555396273-367ea4eb4db5', '1424847651672-bf20a4b0982b', '1600891964092-4316c288032e'],
  barbershop: ['1503951914875-452162b0f3f1', '1585747860715-2ba37e788b70', '1599351431202-1e0f0137899a', '1622287162716-f311baa1a2b8', '1605497788044-5a32c7078486'],
  'oyin-klub': ['1542751371-adc38448a05e', '1511512578047-dfb367046420', '1493711662062-fa541adb3fc8', '1538481199705-c710c4e965fc', '1550745165-9bc0b252726f', '1616588589676-62b3bd4ff6d2'],
  mehmonxona: ['1566073771259-6a8506099945', '1551882547-ff40c63fe5fa', '1445019980597-93fa8acb246c', '1611892440504-42a792e24d32', '1631049307264-da0ec9d70304', '1618773928121-c32242e63f39'],
  'avto-xizmat': ['1486262715619-67b85e0b08d3', '1487754180451-c456f719a1fc', '1619642751034-765dfdf7c58e', '1625047509168-a7026f36de04', '1530046339160-ce3e530c7d2f'],
  dorixona: ['1587854692152-cbe660dbde88', '1576602976047-174e57a47881', '1631549916768-4119b2e5f926', '1585435557343-3b092031a831', '1607619056574-7b8d3ee536b2', '1584308666744-24d5c474f2ae'],
  veterinariya: ['1516734212186-a967f81ad0d7', '1583337130417-3346a1be7dee', '1548767797-d8c844163c4c', '1601758228041-f3b2795255f1', '1596492784531-6e6eb5ea9993', '1628009368231-7bb7cfcb0def'],
  'kochmas-mulk': ['1560448204-e02f11c3d0e2', '1545324418-cc1a3fa10c00', '1512917774080-9991f1c4c750', '1502672260266-1c1ef2d93688', '1560518883-ce09059eeffa', '1600585154340-be6161a56a0c'],
};
// idx bo'yicha determinstik, n ta noyob rasm (kategoriya pulidan aylanma)
function photosFor(slug: string, idx: number, n = 4): string[] {
  const pool = IMG[slug] ?? IMG.klinika!;
  const out: string[] = [];
  for (let k = 0; k < Math.min(n, pool.length); k++) {
    out.push(img(pool[(idx + k) % pool.length]!));
  }
  return out;
}

const CATEGORIES: Array<{ slug: string; name: string; nameRu: string; nameEn: string; icon: string }> = [
  { slug: 'klinika', name: 'Klinikalar', nameRu: 'Клиники', nameEn: 'Clinics', icon: '🏥' },
  { slug: 'stomatologiya', name: 'Stomatologiya', nameRu: 'Стоматология', nameEn: 'Dentistry', icon: '🦷' },
  { slug: 'gozallik', name: 'Go‘zallik salonlari', nameRu: 'Салоны красоты', nameEn: 'Beauty', icon: '💅' },
  { slug: 'fitnes', name: 'Sport & Fitness', nameRu: 'Спорт и фитнес', nameEn: 'Fitness', icon: '🏋️' },
  { slug: 'restoran', name: 'Restoran / Kafe', nameRu: 'Рестораны', nameEn: 'Restaurants', icon: '🍽️' },
  { slug: 'barbershop', name: 'Barbershop', nameRu: 'Барбершоп', nameEn: 'Barbershop', icon: '✂️' },
  { slug: 'oyin-klub', name: 'O‘yin klublari', nameRu: 'Игровые клубы', nameEn: 'Game clubs', icon: '🎮' },
  { slug: 'mehmonxona', name: 'Mehmonxonalar', nameRu: 'Отели', nameEn: 'Hotels', icon: '🏨' },
  { slug: 'avto-xizmat', name: 'Avto-xizmat', nameRu: 'Автосервис', nameEn: 'Auto service', icon: '🚗' },
  { slug: 'dorixona', name: 'Dorixonalar', nameRu: 'Аптеки', nameEn: 'Pharmacies', icon: '💊' },
  { slug: 'veterinariya', name: 'Veterinariya', nameRu: 'Ветеринария', nameEn: 'Veterinary', icon: '🐾' },
  { slug: 'kochmas-mulk', name: 'Ko‘chmas mulk', nameRu: 'Недвижимость', nameEn: 'Real estate', icon: '🏠' },
];

// [nomi, narx(so'm), davomiylik(min)]
type Svc = [string, number, number];
const SERVICES: Record<string, Svc[]> = {
  klinika: [['Shifokor konsultatsiyasi', 80000, 30], ['Umumiy ko‘rik', 120000, 30], ['UZI tekshiruvi', 180000, 30], ['Qon tahlili (kompleks)', 150000, 20], ['MRT', 700000, 45]],
  stomatologiya: [['Konsultatsiya', 50000, 30], ['Tish davolash', 350000, 60], ['Professional gigiena', 250000, 45], ['Tish oqartirish', 600000, 60], ['Implantatsiya', 4500000, 90]],
  gozallik: [['Soch turmagi', 120000, 60], ['Manikür', 90000, 60], ['Pedikür', 110000, 60], ['Makiyaj', 250000, 90], ['Kirpik ulash', 200000, 120]],
  fitnes: [['Kunlik kirish', 40000, 90], ['Oylik abonement', 350000, 30], ['Shaxsiy trener (1 mashg‘ulot)', 150000, 60], ['Guruh mashg‘uloti', 60000, 60]],
  restoran: [['Stol bron (2 kishi)', 0, 120], ['Stol bron (4 kishi)', 0, 120], ['Banket zali (10+ kishi)', 0, 180]],
  barbershop: [['Soch olish', 80000, 45], ['Soqol olish', 50000, 30], ['Kombo (soch+soqol)', 120000, 60], ['Bolalar soch olish', 60000, 30]],
  'oyin-klub': [['PS5 — 1 soat', 30000, 60], ['VIP zal — 1 soat', 60000, 60], ['PC gaming — 1 soat', 25000, 60]],
  mehmonxona: [['Standart xona (1 kecha)', 450000, 60], ['Lyuks xona (1 kecha)', 850000, 60], ['Suite (1 kecha)', 1500000, 60]],
  'avto-xizmat': [['Moy almashtirish', 120000, 45], ['Kompyuter diagnostika', 90000, 30], ['Avto yuvish (premium)', 70000, 45], ['Shina montaji', 60000, 30]],
  dorixona: [['Farmatsevt konsultatsiyasi', 0, 15], ['Uyga yetkazib berish', 25000, 30], ['Bosim o‘lchash', 0, 15]],
  veterinariya: [['Umumiy ko‘rik', 80000, 30], ['Emlash', 120000, 30], ['Gigiena (groming)', 150000, 60], ['Jarrohlik konsultatsiyasi', 200000, 45]],
  'kochmas-mulk': [['Obyekt ko‘rigi', 0, 60], ['Yuridik konsultatsiya', 0, 45]],
};

// Kategoriya bo'yicha vendor nomlari (realistik Toshkent uslubi)
const VENDOR_NAMES: Record<string, string[]> = {
  klinika: ['MedLife Diagnostika', 'Akfa Medline', 'Shox Medical Center', 'Zdravie Klinika', 'Grand Medikal', 'Doctor D'],
  stomatologiya: ['DentaLux Klinika', 'White Smile', 'Dental Art', 'Bio Dent', 'Prezident Dental'],
  gozallik: ['Bella Beauty Studio', 'Glamour Salon', 'Nur Beauty', 'Milena Style', 'Aura Spa & Beauty'],
  fitnes: ['PowerHouse Gym', 'Fitness First', 'Titan Sport Club', 'Olympia Fitness', 'FlexZone'],
  restoran: ['Osh Markazi Milliy', 'Beshqozon', 'Caravan', 'Milano Pizza', 'Sette Ristorante', 'Afsona'],
  barbershop: ['Gentleman Barbershop', 'Firdavs Barber', 'Old School Barber', 'King‘s Cut', 'Bratva Barber'],
  'oyin-klub': ['Cyber Arena PS5', 'GG Club', 'Loud PC Zone', 'Nexus Gaming', 'PixelPlay'],
  mehmonxona: ['City Palace Hotel', 'Grand Nur Hotel', 'Silk Road Inn', 'Boutique Rax', 'Central Hotel'],
  'avto-xizmat': ['Avto Profi', 'Turbo Service', 'Master Auto', 'Elite Detailing', 'Auto Lux Servis'],
  dorixona: ['Oxymed Apteka', 'Farmvita', 'Salomat Apteka', 'Vita Plus', 'Dori-Darmon'],
  veterinariya: ['VetLife Klinika', 'Dr. Zoo', 'Aybolit', 'Panda Vet', 'PetCare'],
  'kochmas-mulk': ['Golden House Realty', 'Makon Invest', 'Bright Estate'],
};

const STAFF_NAMES = ['Aziz', 'Kamola', 'Jasur', 'Nilufar', 'Sardor', 'Dilnoza', 'Bekzod', 'Malika', 'Rustam', 'Zarina'];

const REVIEWS: Array<{ text: string; rating: number }> = [
  { text: 'Juda zo‘r xizmat, tavsiya qilaman! Tez va sifatli.', rating: 5 },
  { text: 'Personal juda xushmuomala, hamma narsa toza va zamonaviy.', rating: 5 },
  { text: 'Narxi sifatga to‘liq mos. Yana kelaman.', rating: 4 },
  { text: 'Onlayn bron qildim, navbatsiz qabul qilishdi — juda qulay!', rating: 5 },
  { text: 'Всё понравилось, персонал вежливый, чисто и уютно.', rating: 5 },
  { text: 'Отличное место, записался онлайн — быстро и удобно.', rating: 5 },
  { text: 'Хороший сервис, но пришлось немного подождать.', rating: 4 },
  { text: 'Zamonaviy jihozlar, professional yondashuv. Rahmat!', rating: 5 },
  { text: 'Yaxshi, lekin parkovka biroz muammo.', rating: 4 },
  { text: 'Ajoyib natija, do‘stlarimga ham tavsiya qildim.', rating: 5 },
];

async function resetIfRequested() {
  if (process.env.SEED_RESET !== '1') return false;
  console.log('♻️  SEED_RESET=1 — katalog ma\'lumotini tozalash (foydalanuvchilar saqlanadi)...');
  // Qat'iy bog'liqlik tartibi (Booking/Review/PropertyLead vendor/property'ni Restrict qiladi)
  await prisma.$transaction([
    prisma.paymentTransaction.deleteMany(),
    prisma.payment.deleteMany(),
    prisma.booking.deleteMany(),
    prisma.review.deleteMany(),
    prisma.favorite.deleteMany(),
    prisma.propertyLead.deleteMany(),
    prisma.service.deleteMany(),
    prisma.staff.deleteMany(),
    prisma.constructionUpdate.deleteMany(),
    prisma.property.deleteMany(),
    prisma.complex.deleteMany(),
    prisma.developer.deleteMany(),
    prisma.vendor.deleteMany(),
    prisma.category.deleteMany(),
  ]);
  console.log('✓ Tozalandi.');
  return true;
}

async function main() {
  console.log('🌱 Seed boshlandi...');
  const didReset = await resetIfRequested();

  if (!didReset) {
    const existing = await prisma.category.count();
    if (existing > 0) {
      console.log(`ℹ️  Baza allaqachon seed qilingan (${existing} kategoriya) — o'tkazib yuborildi. (Qayta uchun SEED_RESET=1)`);
      return;
    }
  }

  // Kategoriyalar
  const catMap = new Map<string, string>();
  for (let i = 0; i < CATEGORIES.length; i++) {
    const c = CATEGORIES[i]!;
    const created = await prisma.category.upsert({
      where: { slug: c.slug },
      update: { name: c.name, nameRu: c.nameRu, nameEn: c.nameEn, icon: c.icon, sortOrder: i },
      create: { slug: c.slug, name: c.name, nameRu: c.nameRu, nameEn: c.nameEn, icon: c.icon, sortOrder: i },
    });
    catMap.set(c.slug, created.id);
  }
  console.log(`✓ ${CATEGORIES.length} kategoriya`);

  // Demo owner
  const owner = await prisma.user.upsert({
    where: { phone: '+998900000000' },
    update: {},
    create: { phone: '+998900000000', name: 'Demo Vendor Owner', role: 'VENDOR' },
  });

  // Sharh mualliflari (bir nechta demo mijoz)
  const reviewerNames = ['Sardor', 'Dilnoza', 'Jahongir', 'Kamola', 'Aziza', 'Bobur'];
  const reviewers = [] as { id: string }[];
  for (let i = 0; i < reviewerNames.length; i++) {
    const u = await prisma.user.upsert({
      where: { phone: `+99890111${(1000 + i).toString()}` },
      update: {},
      create: { phone: `+99890111${(1000 + i).toString()}`, name: reviewerNames[i]!, role: 'USER', coins: rnd(0, 300) },
    });
    reviewers.push({ id: u.id });
  }

  // ===== Vendorlar =====
  let vCount = 0;
  let globalIdx = 0;
  for (const cat of CATEGORIES) {
    if (cat.slug === 'kochmas-mulk') continue; // ko'chmas mulk alohida (complex/property) — pastda
    const names = VENDOR_NAMES[cat.slug] ?? [];
    const svcTemplate = SERVICES[cat.slug] ?? SERVICES.klinika!;

    for (let n = 0; n < names.length; n++) {
      const name = names[n]!;
      const geo = around();
      const district = pick(DISTRICTS);
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + globalIdx;
      const rating = +(4.2 + Math.random() * 0.7).toFixed(1);
      const reviewCount = rnd(18, 240);

      const vendor = await prisma.vendor.upsert({
        where: { slug },
        update: {},
        create: {
          ownerId: owner.id,
          categoryId: catMap.get(cat.slug)!,
          name,
          slug,
          description: `${name} — ${cat.name.toLowerCase()} sohasida professional xizmat. ${district} tumanida, qulay narx va tez onlayn bron.`,
          lat: geo.lat,
          lng: geo.lng,
          district,
          status: 'ACTIVE',
          verified: Math.random() > 0.25,
          rating,
          reviewCount,
          phone: '+99871' + (2000000 + globalIdx),
          hours: { mon_fri: '09:00-20:00', sat: '10:00-18:00', sun: 'off' } as Prisma.InputJsonValue,
          photos: photosFor(cat.slug, n, 4),
        },
      });

      // 2-3 xodim
      const staffCount = rnd(2, 3);
      const staffIds: string[] = [];
      for (let s = 0; s < staffCount; s++) {
        const st = await prisma.staff.create({
          data: { vendorId: vendor.id, name: pick(STAFF_NAMES), schedule: {} },
        });
        staffIds.push(st.id);
      }

      // Xizmatlar (kategoriya shablonidan hammasi)
      for (const [sName, price, dur] of svcTemplate) {
        await prisma.service.create({
          data: {
            vendorId: vendor.id,
            name: sName,
            price: new Prisma.Decimal(price),
            durationMin: dur,
            staffId: pick(staffIds),
          },
        });
      }

      // 2-4 sharh
      const revN = rnd(2, 4);
      const usedReviewers = new Set<string>();
      for (let r = 0; r < revN; r++) {
        const rev = pick(REVIEWS);
        let uid = pick(reviewers).id;
        let guard = 0;
        while (usedReviewers.has(uid) && guard++ < 6) uid = pick(reviewers).id;
        usedReviewers.add(uid);
        await prisma.review.create({
          data: {
            userId: uid,
            vendorId: vendor.id,
            rating: rev.rating,
            text: rev.text,
            criteria: { service: rnd(4, 5), cleanliness: rnd(4, 5), price: rnd(3, 5), staff: rnd(4, 5) } as Prisma.InputJsonValue,
            status: 'PUBLISHED',
          },
        });
      }

      vCount++;
      globalIdx++;
    }
  }
  console.log(`✓ ${vCount} vendor (rasm + xizmat + xodim + sharhlar bilan)`);

  // ===== Ko'chmas mulk =====
  const dev = await prisma.developer.upsert({
    where: { slug: 'golden-house' },
    update: {},
    create: {
      name: 'Golden House Development',
      slug: 'golden-house',
      description: 'O‘zbekistonning yetakchi quruvchi kompaniyalaridan biri.',
      verified: true,
      rating: 4.7,
      phone: '+998712000000',
      projectsCount: 4,
      ...around(),
    },
  });

  const complexes = [
    { name: 'JK Yangi Hayot', slug: 'jk-yangi-hayot', status: 'CONSTRUCTION' as const, readiness: 45, priceFrom: 480_000_000, pm2: 9_500_000 },
    { name: 'JK Bahor Residence', slug: 'jk-bahor-residence', status: 'ACTIVE' as const, readiness: 100, priceFrom: 620_000_000, pm2: 12_000_000 },
    { name: 'JK Boulevard Park', slug: 'jk-boulevard-park', status: 'CONSTRUCTION' as const, readiness: 70, priceFrom: 720_000_000, pm2: 14_000_000 },
    { name: 'JK Silk City', slug: 'jk-silk-city', status: 'ACTIVE' as const, readiness: 100, priceFrom: 950_000_000, pm2: 17_500_000 },
  ];

  for (let i = 0; i < complexes.length; i++) {
    const c = complexes[i]!;
    const geo = around();
    const complex = await prisma.complex.upsert({
      where: { slug: c.slug },
      update: {},
      create: {
        developerId: dev.id,
        name: c.name,
        slug: c.slug,
        district: pick(DISTRICTS),
        description: `${c.name} — zamonaviy turar-joy majmuasi, qulay infratuzilma va yashil hudud.`,
        status: c.status,
        readinessPercent: c.readiness,
        completionDate: c.status === 'ACTIVE' ? new Date() : new Date(Date.now() + 1000 * 60 * 60 * 24 * 400),
        priceFrom: new Prisma.Decimal(c.priceFrom),
        pricePerM2: new Prisma.Decimal(c.pm2),
        amenities: ['Yer osti avtoturargoh', 'Bolalar maydonchasi', 'Yopiq hudud', 'Lift', 'Fitnes zal'] as Prisma.InputJsonValue,
        photos: photosFor('kochmas-mulk', i, 4),
        lat: geo.lat,
        lng: geo.lng,
      },
    });

    // kvartiralar (1-3 xonali)
    for (const rooms of [1, 2, 3]) {
      const area = rooms * 22 + 18;
      const geo2 = around(complex.lat, complex.lng, 0.002);
      await prisma.property.create({
        data: {
          type: c.status === 'CONSTRUCTION' ? 'CONSTRUCTION' : 'NEW',
          complexId: complex.id,
          title: `${rooms}-xonali kvartira, ${area} m² — ${c.name}`,
          description: `Yangi ${rooms}-xonali kvartira, ${complex.district} tumani.`,
          price: new Prisma.Decimal(c.pm2 * area),
          pricePerM2: new Prisma.Decimal(c.pm2),
          areaM2: area,
          rooms,
          floor: rooms + 2,
          totalFloors: 12,
          district: complex.district,
          status: 'AVAILABLE',
          photos: photosFor('kochmas-mulk', rooms + i, 3),
          lat: geo2.lat,
          lng: geo2.lng,
        },
      });
    }

    if (c.status === 'CONSTRUCTION') {
      await prisma.constructionUpdate.create({
        data: { complexId: complex.id, readinessPercent: c.readiness, note: 'Monolit ishlari yakunlandi, fasad boshlandi.', photos: [] },
      });
    }
  }

  // ikkilamchi (eski) uy
  await prisma.property.create({
    data: {
      type: 'SECONDARY',
      title: '3-xonali kvartira, ikkilamchi bozor — Yakkasaroy',
      description: 'Ta’mirlangan, ko‘chib kirishga tayyor.',
      price: new Prisma.Decimal(750_000_000),
      pricePerM2: new Prisma.Decimal(11_000_000),
      areaM2: 68,
      rooms: 3,
      floor: 4,
      totalFloors: 9,
      district: 'Yakkasaroy',
      status: 'AVAILABLE',
      photos: photosFor('kochmas-mulk', 2, 3),
      ...around(),
    },
  });

  console.log(`✓ Ko‘chmas mulk: 1 developer, ${complexes.length} JK, kvartiralar, 1 ikkilamchi uy`);
  console.log('🌱 Seed tugadi.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
