/* Izla Ish — vakansiya seed (NON-DESTRUCTIVE, idempotent).
 * Demo egaga (+998900000000) tegishli realistik kompaniyalar + vakansiyalar.
 * Kompaniya slug bo'yicha upsert; vakansiyalar faqat kompaniyada hali yo'q bo'lsa yaratiladi.
 * Ishga tushirish: railway run/ssh ... npx tsx prisma/enrich-jobs.ts (yoki Dockerfile CMD)
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

type Employment = 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERNSHIP';
type Experience = 'NONE' | 'JUNIOR' | 'MIDDLE' | 'SENIOR';
type JobSeed = {
  title: string; category: string; employment: Employment;
  experience: Experience; remote?: boolean;
  salaryMin: number; salaryMax: number; skills: string[]; featured?: boolean; description: string;
};

const COMPANIES: { slug: string; name: string; industry: string; size: string; about: string; district: string; cover: string; jobs: JobSeed[] }[] = [
  {
    slug: 'izla-technologies', name: 'Izla Technologies', industry: 'IT / Dasturiy taʼminot', size: '51-200',
    district: 'Toshkent', cover: img('1522071820081-009f0129c71c'),
    about: 'O‘zbekistonning yetakchi super-platformasi ortidagi jamoa. Zamonaviy stack, kuchli muhandislik madaniyati.',
    jobs: [
      { title: 'Senior Frontend Dasturchi', category: 'IT', employment: 'FULL_TIME', experience: 'SENIOR', remote: true, salaryMin: 18_000_000, salaryMax: 25_000_000, skills: ['React', 'Next.js', 'TypeScript', 'Tailwind'], featured: true, description: 'Next.js 15 va React 19 asosidagi mahsulotni rivojlantirish. Dizayn tizimi, performans, animatsiyalar.' },
      { title: 'Backend Dasturchi (NestJS)', category: 'IT', employment: 'FULL_TIME', experience: 'MIDDLE', remote: true, salaryMin: 15_000_000, salaryMax: 22_000_000, skills: ['NestJS', 'PostgreSQL', 'Prisma', 'Node.js'], description: 'API va mikroservislar, to‘lov integratsiyalari, ma’lumotlar bazasi dizayni.' },
      { title: 'Product Designer (UI/UX)', category: 'Dizayn', employment: 'FULL_TIME', experience: 'MIDDLE', salaryMin: 12_000_000, salaryMax: 18_000_000, skills: ['Figma', 'UI/UX', 'Prototyping'], description: 'Foydalanuvchi tajribasi, dizayn tizimi va yangi funksiyalar dizayni.' },
    ],
  },
  {
    slug: 'silk-road-digital', name: 'Silk Road Digital', industry: 'Marketing / Reklama', size: '11-50',
    district: 'Toshkent', cover: img('1460925895917-afdab827c52f'),
    about: 'To‘liq tsiklli raqamli marketing agentligi. Brendlar uchun o‘sish va kreativ kampaniyalar.',
    jobs: [
      { title: 'SMM menejer', category: 'Marketing', employment: 'FULL_TIME', experience: 'JUNIOR', salaryMin: 7_000_000, salaryMax: 11_000_000, skills: ['SMM', 'Content', 'Instagram', 'Analytics'], description: 'Ijtimoiy tarmoqlar strategiyasi, kontent-reja, targeting va tahlil.' },
      { title: 'Grafik dizayner', category: 'Dizayn', employment: 'FULL_TIME', experience: 'JUNIOR', remote: true, salaryMin: 6_000_000, salaryMax: 10_000_000, skills: ['Photoshop', 'Illustrator', 'Figma'], description: 'Kreativ vizuallar, banner va brend materiallari.' },
      { title: 'Marketing menejeri', category: 'Marketing', employment: 'FULL_TIME', experience: 'MIDDLE', salaryMin: 10_000_000, salaryMax: 16_000_000, skills: ['Strategiya', 'Google Ads', 'Analytics'], featured: true, description: 'Kampaniyalar boshqaruvi, byudjet, o‘sish metrikalari.' },
    ],
  },
  {
    slug: 'toshkent-fintech', name: 'Toshkent Fintech', industry: 'Moliya / Fintech', size: '200+',
    district: 'Toshkent', cover: img('1450101499163-c8848c66ca85'),
    about: 'Zamonaviy to‘lov va bank xizmatlari. Millionlab foydalanuvchilar uchun ishonchli tizimlar.',
    jobs: [
      { title: 'Moliyaviy tahlilchi', category: 'Moliya', employment: 'FULL_TIME', experience: 'MIDDLE', salaryMin: 12_000_000, salaryMax: 18_000_000, skills: ['Excel', 'Moliyaviy modellashtirish', 'SQL'], description: 'Moliyaviy hisobotlar, prognozlar va biznes tahlili.' },
      { title: 'DevOps muhandis', category: 'IT', employment: 'FULL_TIME', experience: 'SENIOR', remote: true, salaryMin: 20_000_000, salaryMax: 30_000_000, skills: ['Docker', 'Kubernetes', 'CI/CD', 'AWS'], featured: true, description: 'Infratuzilma, monitoring, xavfsizlik va avtomatlashtirish.' },
      { title: 'Mijozlarni qo‘llab-quvvatlash', category: 'Mijozlar', employment: 'FULL_TIME', experience: 'NONE', salaryMin: 5_000_000, salaryMax: 8_000_000, skills: ['Muloqot', 'CRM'], description: 'Mijozlar bilan ishlash, murojaatlarni hal qilish.' },
    ],
  },
  {
    slug: 'bahor-retail', name: 'Bahor Retail', industry: 'Savdo / Riteyl', size: '200+',
    district: 'Toshkent', cover: img('1441986300917-64674bd600d8'),
    about: 'O‘zbekiston bo‘ylab savdo tarmog‘i. Mijozlarga qulaylik va sifat.',
    jobs: [
      { title: 'Savdo menejeri', category: 'Sotuv', employment: 'FULL_TIME', experience: 'JUNIOR', salaryMin: 6_000_000, salaryMax: 12_000_000, skills: ['Sotuv', 'Muzokara', 'CRM'], description: 'Mijozlar bazasi, savdo rejalari va hisobotlar.' },
      { title: 'Do‘kon administratori', category: 'Menejment', employment: 'FULL_TIME', experience: 'MIDDLE', salaryMin: 8_000_000, salaryMax: 12_000_000, skills: ['Menejment', 'Jamoa', 'Inventar'], description: 'Do‘kon ishini tashkil etish, xodimlar va inventar nazorati.' },
    ],
  },
  {
    slug: 'orient-software', name: 'Orient Software', industry: 'IT / Autsorsing', size: '51-200',
    district: 'Toshkent', cover: img('1497366216548-37526070297c'),
    about: 'Xalqaro mijozlar uchun dasturiy yechimlar. O‘sish va zamonaviy texnologiyalar.',
    jobs: [
      { title: 'QA muhandis (Avtomatlashtirish)', category: 'IT', employment: 'FULL_TIME', experience: 'MIDDLE', remote: true, salaryMin: 13_000_000, salaryMax: 19_000_000, skills: ['Playwright', 'Testing', 'CI/CD'], description: 'Avtomatlashtirilgan testlar, sifat nazorati, pipeline.' },
      { title: 'Mobil dasturchi (Flutter)', category: 'IT', employment: 'FULL_TIME', experience: 'MIDDLE', remote: true, salaryMin: 14_000_000, salaryMax: 21_000_000, skills: ['Flutter', 'Dart', 'REST'], featured: true, description: 'iOS/Android ilovalar, chiroyli UI va performans.' },
      { title: 'IT loyiha menejeri', category: 'Menejment', employment: 'FULL_TIME', experience: 'SENIOR', salaryMin: 18_000_000, salaryMax: 26_000_000, skills: ['Agile', 'Scrum', 'Jira'], description: 'Loyihalarni boshqarish, jamoa va mijozlar bilan aloqa.' },
    ],
  },
  {
    slug: 'zamin-hr', name: 'Zamin Consulting', industry: 'Konsalting / HR', size: '11-50',
    district: 'Toshkent', cover: img('1521737604893-d14cc237f11d'),
    about: 'Biznes va HR konsalting. Kompaniyalarga iste’dodlarni topishda yordam.',
    jobs: [
      { title: 'HR menejer', category: 'HR', employment: 'FULL_TIME', experience: 'MIDDLE', salaryMin: 9_000_000, salaryMax: 14_000_000, skills: ['Recruiting', 'HR', 'Muloqot'], description: 'Iste’dod izlash, intervyu va onboarding jarayonlari.' },
      { title: 'Kontent-menejer', category: 'Marketing', employment: 'PART_TIME', experience: 'JUNIOR', remote: true, salaryMin: 4_000_000, salaryMax: 7_000_000, skills: ['Copywriting', 'SEO', 'Content'], description: 'Blog, ijtimoiy tarmoq va veb-sayt uchun kontent.' },
      { title: 'Biznes tahlilchi (stajyor)', category: 'Menejment', employment: 'INTERNSHIP', experience: 'NONE', salaryMin: 3_000_000, salaryMax: 5_000_000, skills: ['Excel', 'Tahlil'], description: 'Biznes jarayonlarini o‘rganish va tahlil qilishda amaliyot.' },
    ],
  },
];

function img(id: string) {
  return `https://images.unsplash.com/photo-${id}?w=1200&q=80&auto=format&fit=crop`;
}

async function main() {
  const owner = await prisma.user.findUnique({ where: { phone: '+998900000000' } });
  if (!owner) throw new Error('Demo owner topilmadi (seed ishlamagan?)');

  let companyCount = 0;
  let jobCount = 0;
  for (const c of COMPANIES) {
    const company = await prisma.company.upsert({
      where: { slug: c.slug },
      update: { name: c.name, industry: c.industry, size: c.size, about: c.about, district: c.district, cover: c.cover, verified: true },
      create: { slug: c.slug, name: c.name, industry: c.industry, size: c.size, about: c.about, district: c.district, cover: c.cover, verified: true, ownerId: owner.id },
    });
    companyCount++;

    const existing = await prisma.job.count({ where: { companyId: company.id } });
    if (existing > 0) continue; // idempotent — allaqachon seed qilingan

    await prisma.job.createMany({
      data: c.jobs.map((j) => ({
        companyId: company.id,
        title: j.title,
        description: j.description,
        employment: j.employment,
        experience: j.experience,
        remote: j.remote ?? false,
        region: 'Toshkent',
        salaryMin: j.salaryMin,
        salaryMax: j.salaryMax,
        skills: j.skills,
        category: j.category,
        featured: j.featured ?? false,
        status: 'ACTIVE',
      })),
    });
    jobCount += c.jobs.length;
    console.log(`  ✓ ${c.name} — ${c.jobs.length} vakansiya`);
  }

  console.log(`✅ Izla Ish seed: ${companyCount} kompaniya, ${jobCount} yangi vakansiya`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
