import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@izla/db';
import { PrismaService } from '../../prisma/prisma.service';
import { computeMortgage } from './mortgage-calc';

export interface ProgramFilter {
  bank?: string; // slug
  maxRate?: number; // yillik % (gacha)
  minTerm?: number; // oy (kamida)
  maxDown?: number; // boshlang'ich % (gacha)
  propertyType?: string; // NEW/SECONDARY/...
  subsidized?: boolean;
  q?: string;
  sort?: 'popular' | 'rate_asc' | 'monthly_asc' | 'rating';
}

const dec = (v: unknown): number => (v == null ? 0 : Number(v));

@Injectable()
export class MortgageService {
  constructor(private readonly prisma: PrismaService) {}

  private buildWhere(f: ProgramFilter): Prisma.MortgageProgramWhereInput {
    const where: Prisma.MortgageProgramWhereInput = { active: true };
    if (f.bank) where.bank = { slug: f.bank };
    if (typeof f.maxRate === 'number') where.annualRate = { lte: f.maxRate };
    if (typeof f.minTerm === 'number') where.maxTermMonths = { gte: f.minTerm };
    if (typeof f.maxDown === 'number') where.minDownPct = { lte: f.maxDown };
    if (f.subsidized) where.subsidized = true;
    if (f.propertyType) where.propertyTypes = { has: f.propertyType };
    if (f.q && f.q.trim().length >= 2) {
      const q = f.q.trim();
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { summary: { contains: q, mode: 'insensitive' } },
      ];
    }
    return where;
  }

  private orderBy(sort?: string): Prisma.MortgageProgramOrderByWithRelationInput[] {
    switch (sort) {
      case 'rate_asc':
        return [{ annualRate: 'asc' }, { popular: 'desc' }];
      case 'monthly_asc':
        return [{ monthlyFrom: 'asc' }];
      case 'rating':
        return [{ rating: 'desc' }, { popular: 'desc' }];
      default:
        return [{ popular: 'desc' }, { subsidized: 'desc' }, { annualRate: 'asc' }];
    }
  }

  private readonly select = {
    id: true,
    bankId: true,
    name: true,
    slug: true,
    summary: true,
    annualRate: true,
    maxTermMonths: true,
    minDownPct: true,
    maxAmount: true,
    propertyTypes: true,
    features: true,
    monthlyFrom: true,
    rating: true,
    popular: true,
    subsidized: true,
    bank: { select: { name: true, slug: true, logoUrl: true, rating: true, verified: true, color: true } },
  } as const;

  private shape(p: {
    id: string; name: string; slug: string; summary: string | null;
    annualRate: unknown; maxTermMonths: number; minDownPct: number; maxAmount: unknown;
    propertyTypes: string[]; features: unknown; monthlyFrom: unknown; rating: number; popular: boolean; subsidized: boolean;
    bank: { name: string; slug: string; logoUrl: string | null; rating: number; verified: boolean; color: string | null };
  }) {
    return {
      id: p.id, name: p.name, slug: p.slug, summary: p.summary,
      annualRate: dec(p.annualRate), maxTermMonths: p.maxTermMonths, minDownPct: p.minDownPct,
      maxAmount: p.maxAmount != null ? dec(p.maxAmount) : null,
      propertyTypes: p.propertyTypes ?? [], features: (p.features as string[]) ?? [],
      monthlyFrom: dec(p.monthlyFrom), rating: p.rating, popular: p.popular, subsidized: p.subsidized,
      bank: p.bank,
    };
  }

  async programs(f: ProgramFilter) {
    const rows = await this.prisma.mortgageProgram.findMany({
      where: this.buildWhere(f),
      orderBy: this.orderBy(f.sort),
      select: this.select,
      take: 60,
    });
    return rows.map((r) => this.shape(r));
  }

  async facets(f: ProgramFilter) {
    const where = this.buildWhere(f);
    const [byBank, agg, sub, total] = await Promise.all([
      this.prisma.mortgageProgram.groupBy({ by: ['bankId'], where, _count: { _all: true } }),
      this.prisma.mortgageProgram.aggregate({ where, _min: { annualRate: true }, _max: { annualRate: true } }),
      this.prisma.mortgageProgram.count({ where: { ...where, subsidized: true } }),
      this.prisma.mortgageProgram.count({ where }),
    ]);
    const banks = await this.prisma.bank.findMany({ select: { id: true, name: true, slug: true, logoUrl: true } });
    const bankMap = new Map(banks.map((b) => [b.id, b]));
    return {
      total,
      subsidized: sub,
      banks: byBank
        .map((b) => {
          const bank = bankMap.get(b.bankId);
          return bank ? { slug: bank.slug, name: bank.name, logoUrl: bank.logoUrl, count: b._count._all } : null;
        })
        .filter(Boolean),
      rateRange:
        agg._min.annualRate != null && agg._max.annualRate != null
          ? { min: dec(agg._min.annualRate), max: dec(agg._max.annualRate) }
          : null,
    };
  }

  async program(slug: string) {
    const p = await this.prisma.mortgageProgram.findUnique({ where: { slug }, select: this.select });
    if (!p) throw new NotFoundException('Dastur topilmadi');
    const shaped = this.shape(p);
    // demo hisob: default narx = maxAmount/(1-down) yoki 700 mln; default muddat
    const demoPrice = 700_000_000;
    const preview = computeMortgage({
      price: demoPrice,
      downPct: shaped.minDownPct,
      termMonths: Math.min(shaped.maxTermMonths, 240),
      annualRate: shaped.annualRate,
    });
    return { ...shaped, preview };
  }

  /** Kalkulyator — programId berilsa uning stavkasi+cheklovlari, aks holda annualRate. */
  async calc(dto: { programId?: string; price: number; downPct?: number; downAmount?: number; termMonths: number; annualRate?: number }) {
    let annualRate = dto.annualRate ?? 0;
    let maxTerm = 360;
    let minDownPct = 0;
    let program: { id: string; name: string; slug: string; bank: { name: string; slug: string } } | null = null;

    if (dto.programId) {
      const p = await this.prisma.mortgageProgram.findUnique({
        where: { id: dto.programId },
        select: { id: true, name: true, slug: true, annualRate: true, maxTermMonths: true, minDownPct: true, active: true, bank: { select: { name: true, slug: true } } },
      });
      if (!p || !p.active) throw new NotFoundException('Dastur topilmadi');
      annualRate = dec(p.annualRate);
      maxTerm = p.maxTermMonths;
      minDownPct = p.minDownPct;
      program = { id: p.id, name: p.name, slug: p.slug, bank: p.bank };
    }

    const termMonths = Math.min(Math.max(1, Math.round(dto.termMonths || 240)), maxTerm);
    // boshlang'ich to'lov dastur minimumidan past bo'lmasin
    let downPct = dto.downPct;
    if (dto.downAmount == null && downPct != null && downPct < minDownPct) downPct = minDownPct;

    const res = computeMortgage({ price: dto.price, termMonths, annualRate, downPct, downAmount: dto.downAmount });
    return { ...res, program, minDownPct, maxTermMonths: maxTerm };
  }

  async apply(userId: string, dto: { programId?: string; price: number; downPct?: number; downAmount?: number; termMonths: number; propertyId?: string; complexId?: string; name: string; phone: string }) {
    const calc = await this.calc({ programId: dto.programId, price: dto.price, downPct: dto.downPct, downAmount: dto.downAmount, termMonths: dto.termMonths });
    if (calc.loanAmount <= 0) throw new BadRequestException('Kredit summasi noto‘g‘ri');

    const lead = await this.prisma.mortgageLead.create({
      data: {
        programId: dto.programId ?? null,
        propertyId: dto.propertyId ?? null,
        complexId: dto.complexId ?? null,
        userId,
        amount: calc.loanAmount,
        propertyPrice: calc.price,
        downPayment: calc.downPayment,
        termMonths: calc.termMonths,
        monthlyPayment: calc.monthlyPayment,
        name: dto.name.trim(),
        phone: dto.phone.trim(),
        status: 'NEW',
      },
      select: { id: true, status: true, amount: true, monthlyPayment: true, termMonths: true, createdAt: true },
    });
    return { ...lead, amount: dec(lead.amount), monthlyPayment: dec(lead.monthlyPayment) };
  }

  async myLeads(userId: string) {
    const rows = await this.prisma.mortgageLead.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, status: true, amount: true, propertyPrice: true, downPayment: true,
        monthlyPayment: true, termMonths: true, createdAt: true,
        program: { select: { name: true, slug: true, annualRate: true, bank: { select: { name: true, slug: true, logoUrl: true, color: true } } } },
      },
    });
    return rows.map((r) => ({
      ...r,
      amount: dec(r.amount), propertyPrice: dec(r.propertyPrice), downPayment: dec(r.downPayment), monthlyPayment: dec(r.monthlyPayment),
      program: r.program ? { ...r.program, annualRate: dec(r.program.annualRate) } : null,
    }));
  }
}
