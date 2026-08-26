import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@izla/db';
import { PrismaService } from '../../prisma/prisma.service';
import { JobsQueryDto } from './dto';

@Injectable()
export class JobsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Ochiq vakansiya ro'yxati — filtr + qidiruv + sahifalash. */
  async list(query: JobsQueryDto) {
    const limit = query.limit ?? 20;
    const page = query.page ?? 0;

    const where: Prisma.JobWhereInput = { status: 'ACTIVE' };
    if (query.employment) where.employment = query.employment;
    if (query.experience) where.experience = query.experience;
    if (query.remote === 'true') where.remote = true;
    if (query.region) where.region = { contains: query.region, mode: 'insensitive' };
    if (query.category) where.category = query.category;
    if (query.salaryMin) where.salaryMax = { gte: query.salaryMin };
    if (query.q) {
      const q = query.q.trim();
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { category: { contains: q, mode: 'insensitive' } },
        { skills: { has: q } },
        { company: { name: { contains: q, mode: 'insensitive' } } },
      ];
    }

    const [total, items] = await Promise.all([
      this.prisma.job.count({ where }),
      this.prisma.job.findMany({
        where,
        orderBy: [{ featured: 'desc' }, { createdAt: 'desc' }],
        take: limit,
        skip: page * limit,
        include: {
          company: { select: { name: true, slug: true, logo: true, verified: true, district: true } },
        },
      }),
    ]);

    return { total, page, limit, items: items.map(shape) };
  }

  /** Filtr UI uchun agregatlar (count'lar + variantlar). */
  async facets() {
    const [total, byEmployment, byExperience, categoriesRaw] = await Promise.all([
      this.prisma.job.count({ where: { status: 'ACTIVE' } }),
      this.prisma.job.groupBy({ by: ['employment'], where: { status: 'ACTIVE' }, _count: { _all: true } }),
      this.prisma.job.groupBy({ by: ['experience'], where: { status: 'ACTIVE' }, _count: { _all: true } }),
      this.prisma.job.groupBy({ by: ['category'], where: { status: 'ACTIVE', category: { not: null } }, _count: { _all: true } }),
    ]);
    const toMap = (arr: { _count: { _all: number } }[], key: string) =>
      Object.fromEntries(arr.map((g) => [(g as Record<string, unknown>)[key], g._count._all]));
    return {
      total,
      employment: toMap(byEmployment, 'employment'),
      experience: toMap(byExperience, 'experience'),
      categories: categoriesRaw
        .map((c) => ({ name: c.category as string, count: c._count._all }))
        .sort((a, b) => b.count - a.count),
    };
  }

  /** Bitta vakansiya + ko'rishlar hisobini oshiradi. */
  async detail(id: string) {
    const job = await this.prisma.job.findUnique({
      where: { id },
      include: {
        company: {
          select: { id: true, name: true, slug: true, logo: true, cover: true, about: true, industry: true, size: true, website: true, district: true, verified: true },
        },
        _count: { select: { applications: true } },
      },
    });
    if (!job || job.status !== 'ACTIVE') throw new NotFoundException('Vakansiya topilmadi');
    // Ko'rishlar (fire-and-forget, javobni bloklamaydi)
    void this.prisma.job.update({ where: { id }, data: { views: { increment: 1 } } }).catch(() => {});
    return { ...shape(job), views: job.views + 1, applicants: job._count.applications, company: job.company };
  }
}

/** Job → yengil DTO (ro'yxat uchun). */
function shape(job: {
  id: string; title: string; description: string; employment: string; remote: boolean;
  region: string | null; experience: string; salaryMin: number | null; salaryMax: number | null;
  currency: string; skills: string[]; category: string | null; featured: boolean; views: number;
  createdAt: Date; company?: { name: string; slug: string; logo: string | null; verified: boolean; district?: string | null };
}) {
  return {
    id: job.id,
    title: job.title,
    description: job.description,
    employment: job.employment,
    remote: job.remote,
    region: job.region,
    experience: job.experience,
    salaryMin: job.salaryMin,
    salaryMax: job.salaryMax,
    currency: job.currency,
    skills: job.skills,
    category: job.category,
    featured: job.featured,
    views: job.views,
    createdAt: job.createdAt,
    company: job.company,
  };
}
