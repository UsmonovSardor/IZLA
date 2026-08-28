import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@izla/db';
import { PrismaService } from '../../prisma/prisma.service';
import { computeQuote, commissionFor, type InsType } from './pricing';
import { FORM_SCHEMAS, defaultParams } from './forms';

export interface ProductFilter {
  type?: string;
  insurer?: string; // slug
  maxPrice?: number;
  minCoverage?: number;
  term?: number; // oy
  popular?: boolean;
  q?: string;
  sort?: 'popular' | 'price_asc' | 'price_desc' | 'rating';
}

const TYPES: InsType[] = ['OSAGO', 'KASKO', 'TRAVEL', 'PROPERTY', 'ACCIDENT', 'HEALTH'];
const dec = (v: unknown): number => (v == null ? 0 : Number(v));

@Injectable()
export class InsuranceService {
  constructor(private readonly prisma: PrismaService) {}

  // --- Filtr WHERE quruvchi (products + facets bir xil mantiqni ishlatadi) ---
  private buildWhere(f: ProductFilter, opts: { ignoreType?: boolean } = {}): Prisma.InsuranceProductWhereInput {
    const where: Prisma.InsuranceProductWhereInput = { active: true };
    if (!opts.ignoreType && f.type && TYPES.includes(f.type as InsType)) {
      where.type = f.type as InsType;
    }
    if (f.insurer) where.insurer = { slug: f.insurer };
    if (typeof f.maxPrice === 'number') where.priceFrom = { lte: f.maxPrice };
    if (typeof f.minCoverage === 'number') where.coverageFrom = { gte: f.minCoverage };
    if (typeof f.term === 'number') where.termsMonths = { has: f.term };
    if (f.popular) where.popular = true;
    if (f.q && f.q.trim().length >= 2) {
      const q = f.q.trim();
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { summary: { contains: q, mode: 'insensitive' } },
      ];
    }
    return where;
  }

  private orderBy(sort?: string): Prisma.InsuranceProductOrderByWithRelationInput[] {
    switch (sort) {
      case 'price_asc':
        return [{ priceFrom: 'asc' }, { popular: 'desc' }];
      case 'price_desc':
        return [{ priceFrom: 'desc' }];
      case 'rating':
        return [{ rating: 'desc' }, { popular: 'desc' }];
      default:
        return [{ popular: 'desc' }, { rating: 'desc' }, { createdAt: 'asc' }];
    }
  }

  private shape(p: {
    id: string;
    insurerId: string;
    type: string;
    name: string;
    slug: string;
    summary: string | null;
    commissionRate: unknown;
    priceFrom: unknown;
    coverageFrom: unknown;
    features: unknown;
    termsMonths: number[];
    rating: number;
    popular: boolean;
    insurer: { name: string; slug: string; logoUrl: string | null; rating: number; verified: boolean; color: string | null };
  }) {
    return {
      id: p.id,
      type: p.type,
      name: p.name,
      slug: p.slug,
      summary: p.summary,
      priceFrom: dec(p.priceFrom),
      coverageFrom: dec(p.coverageFrom),
      features: (p.features as string[]) ?? [],
      termsMonths: p.termsMonths ?? [],
      rating: p.rating,
      popular: p.popular,
      insurer: p.insurer,
    };
  }

  private readonly productSelect = {
    id: true,
    insurerId: true,
    type: true,
    name: true,
    slug: true,
    summary: true,
    commissionRate: true,
    priceFrom: true,
    coverageFrom: true,
    features: true,
    termsMonths: true,
    rating: true,
    popular: true,
    insurer: { select: { name: true, slug: true, logoUrl: true, rating: true, verified: true, color: true } },
  } as const;

  /** Mahsulotlar ro'yxati (senior filtr + saralash). */
  async products(f: ProductFilter) {
    const rows = await this.prisma.insuranceProduct.findMany({
      where: this.buildWhere(f),
      orderBy: this.orderBy(f.sort),
      select: this.productSelect,
      take: 60,
    });
    return rows.map((r) => this.shape(r));
  }

  /**
   * Filtr paneli uchun agregatlar: har tur va har kompaniya bo'yicha sanoq,
   * narx diapazoni. Tur sanog'i turdan TASHQARI kontekstda hisoblanadi
   * (foydalanuvchi turni almashtira olsin).
   */
  async facets(f: ProductFilter) {
    const whereNoType = this.buildWhere(f, { ignoreType: true });
    const whereFull = this.buildWhere(f);

    const [byType, byInsurer, agg, total] = await Promise.all([
      this.prisma.insuranceProduct.groupBy({
        by: ['type'],
        where: whereNoType,
        _count: { _all: true },
      }),
      this.prisma.insuranceProduct.groupBy({
        by: ['insurerId'],
        where: whereFull,
        _count: { _all: true },
      }),
      this.prisma.insuranceProduct.aggregate({
        where: whereFull,
        _min: { priceFrom: true },
        _max: { priceFrom: true },
      }),
      this.prisma.insuranceProduct.count({ where: whereFull }),
    ]);

    // kompaniya nomlarini yuklash
    const insurers = await this.prisma.insurer.findMany({
      select: { id: true, name: true, slug: true, logoUrl: true },
    });
    const insurerMap = new Map(insurers.map((i) => [i.id, i]));

    return {
      total,
      types: byType.map((t) => ({ type: t.type, count: t._count._all })),
      insurers: byInsurer
        .map((b) => {
          const ins = insurerMap.get(b.insurerId);
          return ins ? { slug: ins.slug, name: ins.name, logoUrl: ins.logoUrl, count: b._count._all } : null;
        })
        .filter(Boolean),
      priceRange:
        agg._min.priceFrom != null && agg._max.priceFrom != null
          ? { min: Math.floor(dec(agg._min.priceFrom)), max: Math.ceil(dec(agg._max.priceFrom)) }
          : null,
    };
  }

  /** Bitta mahsulot (slug) — kalkulyator forma sxemasi bilan. */
  async product(slug: string) {
    const p = await this.prisma.insuranceProduct.findUnique({
      where: { slug },
      select: { ...this.productSelect, tariff: true, createdAt: true },
    });
    if (!p || !(await this.isActive(p.id))) throw new NotFoundException('Mahsulot topilmadi');
    const shaped = this.shape(p);
    const type = p.type as InsType;
    // demo kotirovkasi (default parametrlar bilan) — sahifa darrov summa ko'rsatsin
    const preview = this.quoteRaw(type, defaultParams(type), p.tariff, p.commissionRate);
    return {
      ...shaped,
      form: FORM_SCHEMAS[type] ?? [],
      defaults: defaultParams(type),
      preview,
    };
  }

  private async isActive(id: string): Promise<boolean> {
    const row = await this.prisma.insuranceProduct.findUnique({ where: { id }, select: { active: true } });
    return !!row?.active;
  }

  private quoteRaw(type: InsType, params: Record<string, unknown>, tariff: unknown, commissionRate: unknown) {
    const q = computeQuote(type, params, (tariff as Record<string, unknown>) ?? {});
    const commission = commissionFor(q.premium, dec(commissionRate));
    return { premium: q.premium, insuredSum: q.insuredSum, breakdown: q.breakdown, commission };
  }

  /** Premiya kotirovkasi (sotib olmasdan). Server — yagona haqiqat manbasi. */
  async quote(productId: string, params: Record<string, unknown> = {}) {
    const p = await this.prisma.insuranceProduct.findUnique({
      where: { id: productId },
      select: { id: true, type: true, name: true, slug: true, tariff: true, commissionRate: true, active: true, insurer: { select: { name: true, slug: true } } },
    });
    if (!p || !p.active) throw new NotFoundException('Mahsulot topilmadi');
    const q = this.quoteRaw(p.type as InsType, params, p.tariff, p.commissionRate);
    return {
      productId: p.id,
      type: p.type,
      name: p.name,
      slug: p.slug,
      insurer: p.insurer,
      ...q,
    };
  }

  private genPolicyNumber(type: string): string {
    const pref = type.slice(0, 3).toUpperCase();
    const rand = Math.floor(100000 + Math.random() * 900000);
    const yr = new Date().getFullYear();
    return `IZ-${pref}-${yr}-${rand}`;
  }

  /** Polis rasmiylashtirish. Premiya SERVERДА qayta hisoblanadi (klientga ishonilmaydi). */
  async buy(userId: string, dto: { productId: string; params?: Record<string, unknown>; termMonths?: number }) {
    const p = await this.prisma.insuranceProduct.findUnique({
      where: { id: dto.productId },
      select: { id: true, type: true, tariff: true, commissionRate: true, active: true, termsMonths: true },
    });
    if (!p || !p.active) throw new NotFoundException('Mahsulot topilmadi');

    const type = p.type as InsType;
    const params = dto.params ?? defaultParams(type);
    const q = computeQuote(type, params, (p.tariff as Record<string, unknown>) ?? {});
    const commission = commissionFor(q.premium, dec(p.commissionRate));

    let term = dto.termMonths ?? (p.termsMonths?.[0] ?? 12);
    if (p.termsMonths?.length && !p.termsMonths.includes(term)) term = p.termsMonths[0];
    if (q.premium <= 0) throw new BadRequestException('Premiya noto‘g‘ri hisoblandi');

    const startsAt = new Date();
    const endsAt = new Date(startsAt);
    endsAt.setMonth(endsAt.getMonth() + term);

    const policy = await this.prisma.insurancePolicy.create({
      data: {
        productId: p.id,
        userId,
        type,
        status: 'PENDING',
        params: params as Prisma.InputJsonValue,
        premium: q.premium,
        insuredSum: q.insuredSum,
        commissionAmount: commission,
        breakdown: q.breakdown as unknown as Prisma.InputJsonValue,
        termMonths: term,
        policyNumber: this.genPolicyNumber(type),
        startsAt,
        endsAt,
      },
      select: { id: true, policyNumber: true, premium: true, insuredSum: true, status: true, termMonths: true, endsAt: true },
    });
    return { ...policy, premium: dec(policy.premium), insuredSum: dec(policy.insuredSum) };
  }

  /** Foydalanuvchi polislari. */
  async myPolicies(userId: string) {
    const rows = await this.prisma.insurancePolicy.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        type: true,
        status: true,
        premium: true,
        insuredSum: true,
        breakdown: true,
        params: true,
        termMonths: true,
        policyNumber: true,
        startsAt: true,
        endsAt: true,
        createdAt: true,
        product: { select: { name: true, slug: true, insurer: { select: { name: true, slug: true, logoUrl: true, color: true } } } },
      },
    });
    return rows.map((r) => ({
      ...r,
      premium: dec(r.premium),
      insuredSum: dec(r.insuredSum),
    }));
  }
}
