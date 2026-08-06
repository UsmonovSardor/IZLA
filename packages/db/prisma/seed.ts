/* Izla.uz — seed: real Toshkent tumanlari + namunaviy (demo) ma'lumot */
import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

const DISTRICTS = [
  'Chilonzor',
  'Yunusobod',
  'Mirzo Ulug‘bek',
  'Yakkasaroy',
  'Shayxontohur',
  'Mirobod',
  'Olmazor',
  'Sergeli',
  'Yashnobod',
];

// Toshkent markazi ~ 41.31, 69.28 — atrofida tarqatamiz
function around(baseLat = 41.311, baseLng = 69.279, spread = 0.08) {
  return {
    lat: +(baseLat + (Math.random() - 0.5) * spread).toFixed(6),
    lng: +(baseLng + (Math.random() - 0.5) * spread).toFixed(6),
  };
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

const VENDOR_SEED: Array<{ cat: string; name: string; services: Array<[string, number, number]> }> = [
  { cat: 'stomatologiya', name: 'DentaLux Klinika', services: [['Konsultatsiya', 50000, 30], ['Tish davolash', 350000, 60], ['Implantatsiya', 4500000, 90]] },
  { cat: 'stomatologiya', name: 'White Smile', services: [['Tish oqartirish', 600000, 60], ['Gigiena', 250000, 45]] },
  { cat: 'gozallik', name: 'Bella Beauty Studio', services: [['Soch turmagi', 120000, 60], ['Manikür', 90000, 60], ['Makiyaj', 250000, 90]] },
  { cat: 'barbershop', name: 'Gentleman Barbershop', services: [['Soch olish', 80000, 45], ['Soqol', 50000, 30], ['Kombo', 120000, 60]] },
  { cat: 'restoran', name: 'Osh Markazi Milliy', services: [['Stol bron (2 kishi)', 0, 120], ['Stol bron (4 kishi)', 0, 120]] },
  { cat: 'fitnes', name: 'PowerHouse Gym', services: [['Kunlik kirish', 40000, 90], ['Shaxsiy trener', 150000, 60]] },
  { cat: 'oyin-klub', name: 'Cyber Arena PS5', services: [['PS5 (1 soat)', 30000, 60], ['VIP zal (1 soat)', 60000, 60]] },
  { cat: 'klinika', name: 'MedLife Diagnostika', services: [['Umumiy ko‘rik', 100000, 30], ['UZI', 180000, 30], ['MRT', 700000, 45]] },
];

async function main() {
  console.log('🌱 Seed boshlandi...');

  // Idempotent: baza allaqachon to'ldirilgan bo'lsa — o'tkazib yuboramiz
  const existing = await prisma.category.count();
  if (existing > 0) {
    console.log(`ℹ️  Baza allaqachon seed qilingan (${existing} kategoriya) — o'tkazib yuborildi.`);
    return;
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

  // Demo mijoz
  const customer = await prisma.user.upsert({
    where: { phone: '+998901112233' },
    update: {},
    create: { phone: '+998901112233', name: 'Sardor', role: 'USER', coins: 150 },
  });

  // Vendorlar + xizmatlar + xodim + sharh
  let vCount = 0;
  for (let i = 0; i < VENDOR_SEED.length; i++) {
    const v = VENDOR_SEED[i]!;
    const geo = around();
    const district = DISTRICTS[i % DISTRICTS.length]!;
    const slug = v.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + i;
    const rating = +(4 + Math.random()).toFixed(1) > 5 ? 5 : +(4 + Math.random()).toFixed(1);

    const vendor = await prisma.vendor.upsert({
      where: { slug },
      update: {},
      create: {
        ownerId: owner.id,
        categoryId: catMap.get(v.cat)!,
        name: v.name,
        slug,
        description: `${v.name} — professional xizmat, qulay narx va tez bron. ${district} tumanida.`,
        lat: geo.lat,
        lng: geo.lng,
        district,
        status: 'ACTIVE',
        verified: true,
        rating,
        reviewCount: Math.floor(Math.random() * 200) + 10,
        phone: '+99871' + (2000000 + i),
        hours: { mon_fri: '09:00-20:00', sat: '10:00-18:00', sun: 'off' } as Prisma.InputJsonValue,
        photos: [`https://picsum.photos/seed/${slug}/800/600`],
      },
    });

    const staff = await prisma.staff.create({
      data: { vendorId: vendor.id, name: ['Aziz', 'Kamola', 'Jasur', 'Nilufar'][i % 4]!, schedule: {} },
    });

    for (const [name, price, dur] of v.services) {
      await prisma.service.create({
        data: { vendorId: vendor.id, name, price: new Prisma.Decimal(price), durationMin: dur, staffId: staff.id },
      });
    }

    await prisma.review.create({
      data: {
        userId: customer.id,
        vendorId: vendor.id,
        rating: 5,
        text: 'Juda zo‘r xizmat, tavsiya qilaman! Tez va sifatli.',
        criteria: { service: 5, cleanliness: 5, price: 4, staff: 5 } as Prisma.InputJsonValue,
        status: 'PUBLISHED',
      },
    });
    vCount++;
  }
  console.log(`✓ ${vCount} vendor (xizmat + xodim + sharh bilan)`);

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
      projectsCount: 3,
      ...around(),
    },
  });

  const complexes = [
    { name: 'JK Yangi Hayot', slug: 'jk-yangi-hayot', status: 'CONSTRUCTION' as const, readiness: 45, priceFrom: 480_000_000, pm2: 9_500_000 },
    { name: 'JK Bahor Residence', slug: 'jk-bahor-residence', status: 'ACTIVE' as const, readiness: 100, priceFrom: 620_000_000, pm2: 12_000_000 },
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
        district: DISTRICTS[i % DISTRICTS.length]!,
        description: `${c.name} — zamonaviy turar-joy majmuasi, qulay infratuzilma.`,
        status: c.status,
        readinessPercent: c.readiness,
        completionDate: c.status === 'ACTIVE' ? new Date() : new Date(Date.now() + 1000 * 60 * 60 * 24 * 400),
        priceFrom: new Prisma.Decimal(c.priceFrom),
        pricePerM2: new Prisma.Decimal(c.pm2),
        amenities: ['Yer osti avtoturargoh', 'Bolalar maydonchasi', 'Yopiq hudud', 'Lift'] as Prisma.InputJsonValue,
        photos: [`https://picsum.photos/seed/${c.slug}/1000/700`],
        lat: geo.lat,
        lng: geo.lng,
      },
    });

    // kvartiralar
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
          photos: [`https://picsum.photos/seed/${c.slug}-${rooms}/800/600`],
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
      photos: ['https://picsum.photos/seed/secondary-1/800/600'],
      ...around(),
    },
  });

  console.log('✓ Ko‘chmas mulk: 1 developer, 2 JK, kvartiralar, 1 ikkilamchi uy');
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
