import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@izla/db';
import { PrismaService } from '../../prisma/prisma.service';
import { JobsQueryDto } from './dto';
import { ApplyDto } from './apply.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { AssistantService } from '../assistant/assistant.service';

@Injectable()
export class JobsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly assistant: AssistantService,
  ) {}

  /** AI moslik bahosini fon rejimida hisoblab, arizaga yozadi (best-effort). */
  private async scoreInBackground(applicationId: string, jobId: string, resumeId: string) {
    try {
      const [job, resume] = await Promise.all([
        this.prisma.job.findUnique({ where: { id: jobId }, select: { title: true, description: true, skills: true, experience: true } }),
        this.prisma.resume.findUnique({ where: { id: resumeId }, select: { headline: true, summary: true, skills: true, experienceYears: true } }),
      ]);
      if (!job || !resume) return;
      const score = await this.assistant.scoreApplication({ job, resume });
      if (score != null) {
        await this.prisma.jobApplication.update({ where: { id: applicationId }, data: { aiScore: score } });
      }
    } catch { /* best-effort — ariza oqimini bloklamaydi */ }
  }

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

  // ---- Ariza oqimi (avtorizatsiyali) ----

  /** Foydalanuvchi vakansiyaga ariza topshiradi. Rezyume bo'lsa avto-bog'lanadi. */
  async apply(jobId: string, userId: string, dto: ApplyDto) {
    const job = await this.prisma.job.findUnique({ where: { id: jobId }, select: { id: true, status: true, title: true } });
    if (!job || job.status !== 'ACTIVE') throw new NotFoundException('Vakansiya topilmadi');

    const resume = await this.prisma.resume.findUnique({ where: { userId }, select: { id: true } });
    const coverNote = dto.coverNote?.trim() || null;
    try {
      const app = await this.prisma.jobApplication.create({
        data: { jobId, userId, resumeId: resume?.id ?? null, coverNote },
        select: { id: true, status: true, createdAt: true },
      });
      void this.notifications.pushInApp(userId, 'job_application', {
        title: 'Ariza topshirildi', body: job.title, href: '/ish/arizalarim',
      });
      // Rezyume bo'lsa AI moslik bahosini fon rejimida hisoblaymiz
      if (resume) void this.scoreInBackground(app.id, jobId, resume.id);
      return { ...app, hasResume: !!resume };
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException('Siz bu vakansiyaga allaqachon ariza topshirgansiz');
      }
      throw e;
    }
  }

  /** Foydalanuvchi shu vakansiyaga ariza topshirganmi (tugma holati uchun). */
  async applicationStatus(jobId: string, userId: string) {
    const app = await this.prisma.jobApplication.findUnique({
      where: { jobId_userId: { jobId, userId } },
      select: { id: true, status: true, createdAt: true },
    });
    return { applied: !!app, application: app };
  }

  /** Foydalanuvchining barcha arizalari (nomzod kabineti). */
  async myApplications(userId: string) {
    const apps = await this.prisma.jobApplication.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, status: true, coverNote: true, createdAt: true,
        job: {
          select: {
            id: true, title: true, employment: true, remote: true, region: true,
            salaryMin: true, salaryMax: true, currency: true, status: true,
            company: { select: { name: true, slug: true, logo: true, verified: true } },
          },
        },
      },
    });
    return apps.map((a) => ({
      id: a.id,
      status: a.status,
      coverNote: a.coverNote,
      createdAt: a.createdAt,
      job: a.job,
    }));
  }

  // ---- Saqlangan vakansiyalar (bookmark) ----

  /** Vakansiyani saqlash/olib tashlash (toggle). Poyga-xavfsiz. */
  async toggleSaved(jobId: string, userId: string): Promise<{ saved: boolean }> {
    const existing = await this.prisma.savedJob.findUnique({
      where: { userId_jobId: { userId, jobId } },
    });
    if (existing) {
      await this.prisma.savedJob.delete({ where: { id: existing.id } });
      return { saved: false };
    }
    // Vakansiya mavjud va ochiqligini tekshiramiz
    const job = await this.prisma.job.findUnique({ where: { id: jobId }, select: { id: true, status: true } });
    if (!job || job.status !== 'ACTIVE') throw new NotFoundException('Vakansiya topilmadi');
    try {
      await this.prisma.savedJob.create({ data: { userId, jobId } });
    } catch (e) {
      // Bir vaqtda ikki marta bosilsa — allaqachon saqlangan deb hisoblaymiz
      if (!(e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002')) throw e;
    }
    return { saved: true };
  }

  /** Saqlangan vakansiya id'lari (kartochkalarda bookmark holati uchun). */
  async savedIds(userId: string): Promise<string[]> {
    const rows = await this.prisma.savedJob.findMany({
      where: { userId },
      select: { jobId: true },
    });
    return rows.map((r) => r.jobId);
  }

  /** To'liq saqlangan vakansiyalar ro'yxati (job + kompaniya, eng yangi birinchi). */
  async listSaved(userId: string) {
    const rows = await this.prisma.savedJob.findMany({
      where: { userId, job: { status: 'ACTIVE' } },
      orderBy: { createdAt: 'desc' },
      select: {
        createdAt: true,
        job: {
          include: {
            company: { select: { name: true, slug: true, logo: true, verified: true, district: true } },
          },
        },
      },
    });
    return rows.map((r) => ({ savedAt: r.createdAt, ...shape(r.job) }));
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
