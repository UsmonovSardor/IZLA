import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { computeNasiya } from './nasiya-calc';

const dec = (v: unknown): number => (v == null ? 0 : Number(v));

@Injectable()
export class NasiyaService {
  constructor(private readonly prisma: PrismaService) {}

  private shape(p: {
    id: string; name: string; slug: string; logoUrl: string | null; color: string | null;
    rating: number; verified: boolean; terms: unknown; minAmount: unknown; maxAmount: unknown;
    features: unknown; popular: boolean;
  }) {
    return {
      id: p.id, name: p.name, slug: p.slug, logoUrl: p.logoUrl, color: p.color,
      rating: p.rating, verified: p.verified,
      terms: (p.terms as Record<string, number>) ?? {},
      months: Object.keys((p.terms as Record<string, number>) ?? {}).map(Number).sort((a, b) => a - b),
      minAmount: p.minAmount != null ? dec(p.minAmount) : null,
      maxAmount: p.maxAmount != null ? dec(p.maxAmount) : null,
      features: (p.features as string[]) ?? [],
      popular: p.popular,
    };
  }

  private readonly select = {
    id: true, name: true, slug: true, logoUrl: true, color: true, rating: true, verified: true,
    terms: true, minAmount: true, maxAmount: true, features: true, popular: true,
  } as const;

  async providers() {
    const rows = await this.prisma.nasiyaProvider.findMany({
      where: { active: true },
      orderBy: [{ popular: 'desc' }, { rating: 'desc' }],
      select: this.select,
    });
    return rows.map((r) => this.shape(r));
  }

  /** Kotirovka: providerId berilsa bitta, aks holda BARCHA provayderlar (taqqoslash). */
  async quote(amount: number, months: number, providerId?: string) {
    if (!amount || amount <= 0) throw new BadRequestException('Summa noto‘g‘ri');
    const where = { active: true, ...(providerId ? { id: providerId } : {}) };
    const providers = await this.prisma.nasiyaProvider.findMany({ where, select: this.select });
    return providers
      .map((p) => {
        const shaped = this.shape(p);
        const q = computeNasiya(amount, months, shaped.terms, { min: shaped.minAmount, max: shaped.maxAmount });
        return { provider: { id: shaped.id, name: shaped.name, slug: shaped.slug, logoUrl: shaped.logoUrl, color: shaped.color, rating: shaped.rating, popular: shaped.popular, features: shaped.features, months: shaped.months }, ...q };
      })
      .sort((a, b) => (a.available === b.available ? a.monthlyPayment - b.monthlyPayment : a.available ? -1 : 1));
  }

  async apply(userId: string, dto: { providerId: string; amount: number; months: number; vendorId?: string; serviceId?: string; name: string; phone: string }) {
    const provider = await this.prisma.nasiyaProvider.findUnique({ where: { id: dto.providerId }, select: { id: true, active: true, terms: true, minAmount: true, maxAmount: true } });
    if (!provider || !provider.active) throw new NotFoundException('Provayder topilmadi');
    const q = computeNasiya(dto.amount, dto.months, (provider.terms as Record<string, number>) ?? {}, { min: provider.minAmount != null ? dec(provider.minAmount) : null, max: provider.maxAmount != null ? dec(provider.maxAmount) : null });
    if (!q.available) throw new BadRequestException('Summa yoki muddat bu provayderда mavjud emas');

    const lead = await this.prisma.nasiyaLead.create({
      data: {
        providerId: provider.id, userId, vendorId: dto.vendorId ?? null, serviceId: dto.serviceId ?? null,
        amount: q.amount, months: q.months, monthlyPayment: q.monthlyPayment, totalPayment: q.totalPayment,
        name: dto.name.trim(), phone: dto.phone.trim(), status: 'NEW',
      },
      select: { id: true, status: true, months: true, monthlyPayment: true, totalPayment: true, createdAt: true },
    });
    return { ...lead, monthlyPayment: dec(lead.monthlyPayment), totalPayment: dec(lead.totalPayment) };
  }

  async myLeads(userId: string) {
    const rows = await this.prisma.nasiyaLead.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, status: true, amount: true, months: true, monthlyPayment: true, totalPayment: true, createdAt: true,
        provider: { select: { name: true, slug: true, logoUrl: true, color: true } },
      },
    });
    return rows.map((r) => ({ ...r, amount: dec(r.amount), monthlyPayment: dec(r.monthlyPayment), totalPayment: dec(r.totalPayment) }));
  }
}
