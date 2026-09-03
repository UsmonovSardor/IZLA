import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { partnerPlanConfig } from '../../common/partner-plans';

const dec = (v: unknown): number => (v == null ? 0 : Number(v));
const round = (n: number) => Math.round(n);

/**
 * Izla Biznes — yagona daromad konsoli (admin).
 * Barcha kanal komissiyasi bir joyda:
 *  ① sug'urta commissionAmount · ② ipoteka referralFee(FUNDED) · ③ bron take-rate
 *  ④ nasiya merchant fee(ISSUED) · ⑤ obuna (to'langan invoice) + MRR.
 */
@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async revenue() {
    const [
      insAgg,
      bookingAgg,
      fundedLeads,
      issuedLeads,
      invoiceAgg,
      activePaidPartners,
      partnersByStatus,
      partnersByPlan,
      totalPartners,
    ] = await Promise.all([
      // ① Sug'urta — bekor qilinmagan polislar komissiyasi
      this.prisma.insurancePolicy.aggregate({ _sum: { commissionAmount: true }, _count: { _all: true }, where: { status: { not: 'CANCELLED' } } }),
      // ③ Bron take-rate — to'langan to'lovlar
      this.prisma.payment.aggregate({ _sum: { commissionAmount: true }, _count: { _all: true }, where: { status: 'PAID', bookingId: { not: null } } }),
      // ② Ipoteka — FUNDED lidlar × dastur referralFee
      this.prisma.mortgageLead.findMany({ where: { status: 'FUNDED' }, select: { program: { select: { referralFee: true } } } }),
      // ④ Nasiya — ISSUED lidlar: summa × provider.merchantFee
      this.prisma.nasiyaLead.findMany({ where: { status: 'ISSUED' }, select: { amount: true, provider: { select: { merchantFee: true } } } }),
      // ⑤ Obuna — to'langan hisob-fakturalar
      this.prisma.invoice.aggregate({ _sum: { amount: true }, _count: { _all: true }, where: { status: 'PAID' } }),
      // MRR uchun: faol pullik homiylar
      this.prisma.partnerAccount.findMany({ where: { billingStatus: 'ACTIVE', plan: { not: 'FREE' } }, select: { plan: true } }),
      this.prisma.partnerAccount.groupBy({ by: ['billingStatus'], _count: { _all: true } }),
      this.prisma.partnerAccount.groupBy({ by: ['plan'], _count: { _all: true } }),
      this.prisma.partnerAccount.count(),
    ]);

    const insurance = { amount: round(dec(insAgg._sum.commissionAmount)), count: insAgg._count._all };
    const booking = { amount: round(dec(bookingAgg._sum.commissionAmount)), count: bookingAgg._count._all };
    const mortgage = {
      amount: round(fundedLeads.reduce((s, l) => s + dec(l.program?.referralFee), 0)),
      count: fundedLeads.length,
    };
    const nasiya = {
      amount: round(issuedLeads.reduce((s, l) => s + dec(l.amount) * dec(l.provider?.merchantFee), 0)),
      count: issuedLeads.length,
    };
    const subscription = { amount: round(dec(invoiceAgg._sum.amount)), count: invoiceAgg._count._all };

    const grandTotal = insurance.amount + mortgage.amount + booking.amount + nasiya.amount + subscription.amount;

    // MRR — faol pullik obunalarning oylik summasi
    const mrr = activePaidPartners.reduce((s, p) => s + partnerPlanConfig(p.plan).priceMonthly, 0);

    const statusCounts: Record<string, number> = {};
    for (const r of partnersByStatus) statusCounts[r.billingStatus] = r._count._all;
    const planCounts: Record<string, number> = {};
    for (const r of partnersByPlan) planCounts[r.plan] = r._count._all;

    return {
      totals: {
        grandTotal,
        byChannel: { insurance, mortgage, booking, nasiya, subscription },
      },
      mrr,
      arr: mrr * 12,
      partners: {
        total: totalPartners,
        active: statusCounts['ACTIVE'] ?? 0,
        pastDue: statusCounts['PAST_DUE'] ?? 0,
        suspended: statusCounts['SUSPENDED'] ?? 0,
        byPlan: {
          FREE: planCounts['FREE'] ?? 0,
          GROWTH: planCounts['GROWTH'] ?? 0,
          ENTERPRISE: planCounts['ENTERPRISE'] ?? 0,
        },
      },
    };
  }

  /** Barcha homiylar ro'yxati (admin nazorati). */
  async partners() {
    const rows = await this.prisma.partnerAccount.findMany({
      orderBy: { createdAt: 'desc' },
      take: 200,
      select: {
        id: true, name: true, slug: true, plan: true, status: true, billingStatus: true,
        planExpiresAt: true, createdAt: true,
        _count: { select: { insurers: true, banks: true, nasiyaProviders: true, vendors: true } },
      },
    });
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      slug: r.slug,
      plan: r.plan,
      status: r.status,
      billingStatus: r.billingStatus,
      planExpiresAt: r.planExpiresAt,
      createdAt: r.createdAt,
      monthlyValue: partnerPlanConfig(r.plan).priceMonthly,
      entities: r._count.insurers + r._count.banks + r._count.nasiyaProviders + r._count.vendors,
    }));
  }
}
