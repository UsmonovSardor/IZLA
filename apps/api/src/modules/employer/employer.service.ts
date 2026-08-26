import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@izla/db';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateCompanyDto, CreateJobDto, UpdateApplicationStatusDto, UpdateCompanyDto, UpdateJobDto,
} from './dto';

/** Nomdan URL-xavfsiz slug (lotin + raqam), tasodifiy qo'shimcha bilan noyob. */
function slugify(name: string): string {
  const base = name
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 40) || 'kompaniya';
  return `${base}-${Math.random().toString(36).slice(2, 7)}`;
}

@Injectable()
export class EmployerService {
  constructor(private readonly prisma: PrismaService) {}

  // ---------- Egalik yordamchilari ----------

  private async ownedCompany(companyId: string, userId: string) {
    const company = await this.prisma.company.findUnique({ where: { id: companyId } });
    if (!company) throw new NotFoundException('Kompaniya topilmadi');
    if (company.ownerId !== userId) throw new ForbiddenException('Bu kompaniya sizga tegishli emas');
    return company;
  }

  private async ownedJob(jobId: string, userId: string) {
    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
      include: { company: { select: { ownerId: true } } },
    });
    if (!job) throw new NotFoundException('Vakansiya topilmadi');
    if (job.company.ownerId !== userId) throw new ForbiddenException('Ruxsat yo‘q');
    return job;
  }

  // ---------- Kompaniya ----------

  async myCompanies(userId: string) {
    const companies = await this.prisma.company.findMany({
      where: { ownerId: userId },
      orderBy: { createdAt: 'asc' },
      include: { _count: { select: { jobs: true } } },
    });
    return companies.map((c) => ({
      id: c.id, slug: c.slug, name: c.name, logo: c.logo, cover: c.cover,
      industry: c.industry, size: c.size, about: c.about, district: c.district,
      website: c.website, verified: c.verified, jobCount: c._count.jobs,
    }));
  }

  async createCompany(userId: string, dto: CreateCompanyDto) {
    return this.prisma.company.create({
      data: {
        ownerId: userId,
        slug: slugify(dto.name),
        name: dto.name.trim(),
        industry: dto.industry?.trim() || null,
        size: dto.size?.trim() || null,
        about: dto.about?.trim() || null,
        district: dto.district?.trim() || null,
        website: dto.website?.trim() || null,
        logo: dto.logo?.trim() || null,
        cover: dto.cover?.trim() || null,
      },
    });
  }

  async companyDetail(companyId: string, userId: string) {
    return this.ownedCompany(companyId, userId);
  }

  async updateCompany(companyId: string, userId: string, dto: UpdateCompanyDto) {
    await this.ownedCompany(companyId, userId);
    const data: Prisma.CompanyUpdateInput = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.industry !== undefined) data.industry = dto.industry;
    if (dto.size !== undefined) data.size = dto.size;
    if (dto.about !== undefined) data.about = dto.about;
    if (dto.district !== undefined) data.district = dto.district;
    if (dto.website !== undefined) data.website = dto.website;
    if (dto.logo !== undefined) data.logo = dto.logo;
    if (dto.cover !== undefined) data.cover = dto.cover;
    return this.prisma.company.update({ where: { id: companyId }, data });
  }

  async companyStats(companyId: string, userId: string) {
    await this.ownedCompany(companyId, userId);
    const [jobsByStatus, appsByStatus, totalViews] = await Promise.all([
      this.prisma.job.groupBy({ by: ['status'], where: { companyId }, _count: { _all: true } }),
      this.prisma.jobApplication.groupBy({
        by: ['status'], where: { job: { companyId } }, _count: { _all: true },
      }),
      this.prisma.job.aggregate({ where: { companyId }, _sum: { views: true } }),
    ]);
    const jobStatus: Record<string, number> = {};
    let jobsTotal = 0;
    for (const g of jobsByStatus) { jobStatus[g.status] = g._count._all; jobsTotal += g._count._all; }
    const appStatus: Record<string, number> = {};
    let appsTotal = 0;
    for (const g of appsByStatus) { appStatus[g.status] = g._count._all; appsTotal += g._count._all; }
    return {
      jobsTotal,
      jobsActive: jobStatus['ACTIVE'] ?? 0,
      jobsByStatus: jobStatus,
      applicationsTotal: appsTotal,
      applicationsByStatus: appStatus,
      applicationsNew: appStatus['NEW'] ?? 0,
      hired: appStatus['HIRED'] ?? 0,
      views: totalViews._sum.views ?? 0,
    };
  }

  // ---------- Vakansiyalar ----------

  async companyJobs(companyId: string, userId: string) {
    await this.ownedCompany(companyId, userId);
    const jobs = await this.prisma.job.findMany({
      where: { companyId },
      orderBy: [{ createdAt: 'desc' }],
      include: { _count: { select: { applications: true } } },
    });
    return jobs.map((j) => ({
      id: j.id, title: j.title, description: j.description, employment: j.employment,
      remote: j.remote, region: j.region, experience: j.experience,
      salaryMin: j.salaryMin, salaryMax: j.salaryMax, currency: j.currency,
      skills: j.skills, category: j.category, status: j.status, featured: j.featured,
      views: j.views, createdAt: j.createdAt, applicants: j._count.applications,
    }));
  }

  async createJob(companyId: string, userId: string, dto: CreateJobDto) {
    await this.ownedCompany(companyId, userId);
    return this.prisma.job.create({
      data: {
        companyId,
        title: dto.title.trim(),
        description: dto.description.trim(),
        employment: dto.employment ?? 'FULL_TIME',
        remote: dto.remote ?? false,
        region: dto.region?.trim() || null,
        experience: dto.experience ?? 'JUNIOR',
        salaryMin: dto.salaryMin ?? null,
        salaryMax: dto.salaryMax ?? null,
        currency: dto.currency?.trim() || 'UZS',
        skills: (dto.skills ?? []).map((s) => s.trim()).filter(Boolean),
        category: dto.category?.trim() || null,
        status: dto.status ?? 'ACTIVE',
      },
    });
  }

  async updateJob(jobId: string, userId: string, dto: UpdateJobDto) {
    await this.ownedJob(jobId, userId);
    const data: Prisma.JobUpdateInput = {};
    if (dto.title !== undefined) data.title = dto.title.trim();
    if (dto.description !== undefined) data.description = dto.description.trim();
    if (dto.employment !== undefined) data.employment = dto.employment;
    if (dto.remote !== undefined) data.remote = dto.remote;
    if (dto.region !== undefined) data.region = dto.region.trim() || null;
    if (dto.experience !== undefined) data.experience = dto.experience;
    if (dto.salaryMin !== undefined) data.salaryMin = dto.salaryMin;
    if (dto.salaryMax !== undefined) data.salaryMax = dto.salaryMax;
    if (dto.currency !== undefined) data.currency = dto.currency.trim() || 'UZS';
    if (dto.skills !== undefined) data.skills = dto.skills.map((s) => s.trim()).filter(Boolean);
    if (dto.category !== undefined) data.category = dto.category.trim() || null;
    if (dto.status !== undefined) data.status = dto.status;
    return this.prisma.job.update({ where: { id: jobId }, data });
  }

  /** Vakansiyani arxivlash (soft — arizalar saqlanadi). */
  async archiveJob(jobId: string, userId: string) {
    await this.ownedJob(jobId, userId);
    return this.prisma.job.update({ where: { id: jobId }, data: { status: 'ARCHIVED' } });
  }

  // ---------- Mini-ATS: arizalar ----------

  async jobApplications(jobId: string, userId: string) {
    await this.ownedJob(jobId, userId);
    const apps = await this.prisma.jobApplication.findMany({
      where: { jobId },
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { name: true, phone: true, email: true, avatarUrl: true } },
        resume: {
          select: {
            headline: true, summary: true, skills: true, experienceYears: true,
            phone: true, email: true, experience: true, education: true,
          },
        },
      },
    });
    return apps.map((a) => ({
      id: a.id,
      status: a.status,
      coverNote: a.coverNote,
      aiScore: a.aiScore,
      createdAt: a.createdAt,
      applicant: {
        // Telegram foydalanuvchida phone `tg:<id>` bo'lishi mumkin — ATS'da yashiramiz
        name: a.user.name,
        phone: a.user.phone && !a.user.phone.startsWith('tg:') && !a.user.phone.startsWith('google:') ? a.user.phone : null,
        email: a.user.email,
        avatarUrl: a.user.avatarUrl,
      },
      resume: a.resume,
    }));
  }

  async updateApplicationStatus(applicationId: string, userId: string, dto: UpdateApplicationStatusDto) {
    const app = await this.prisma.jobApplication.findUnique({
      where: { id: applicationId },
      include: { job: { include: { company: { select: { ownerId: true } } } } },
    });
    if (!app) throw new NotFoundException('Ariza topilmadi');
    if (app.job.company.ownerId !== userId) throw new ForbiddenException('Ruxsat yo‘q');
    const updated = await this.prisma.jobApplication.update({
      where: { id: applicationId },
      data: { status: dto.status },
      select: { id: true, status: true },
    });
    return updated;
  }
}
