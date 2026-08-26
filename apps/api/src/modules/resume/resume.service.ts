import { Injectable } from '@nestjs/common';
import { Prisma } from '@izla/db';
import { PrismaService } from '../../prisma/prisma.service';
import { UpsertResumeDto } from './dto';

@Injectable()
export class ResumeService {
  constructor(private readonly prisma: PrismaService) {}

  /** Foydalanuvchi rezyumesi (yo'q bo'lsa null). */
  me(userId: string) {
    return this.prisma.resume.findUnique({ where: { userId } });
  }

  /** Rezyume yaratish yoki yangilash (foydalanuvchiga bitta). */
  upsert(userId: string, dto: UpsertResumeDto) {
    const experience = (dto.experience ?? []) as unknown as Prisma.InputJsonValue;
    const education = (dto.education ?? []) as unknown as Prisma.InputJsonValue;
    const base = {
      headline: dto.headline.trim(),
      summary: dto.summary?.trim() || null,
      skills: (dto.skills ?? []).map((s) => s.trim()).filter(Boolean),
      experienceYears: dto.experienceYears ?? 0,
      phone: dto.phone?.trim() || null,
      email: dto.email?.trim() || null,
      experience,
      education,
    };
    return this.prisma.resume.upsert({
      where: { userId },
      create: { userId, ...base },
      update: base,
    });
  }
}
