import { Injectable, Logger } from '@nestjs/common';
import type { Prisma } from '@izla/db';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { leadPriceFor } from '../../common/partner-plans';
import { decideCharge } from './lead-billing';

export type LeadKind = 'insurance' | 'mortgage' | 'nasiya';

export type DeliveryOutcome = 'PENDING' | 'DELIVERED' | 'BLOCKED';

export interface DeliveryResult {
  status: DeliveryOutcome;
  billedAmount?: number;
  /** PENDING sababi: egasi yo'q (platforma obyekti) yoki obuna neaktiv. */
  reason?: 'no_owner' | 'suspended' | 'already_delivered' | 'insufficient_balance' | 'delivered';
}

const dec = (v: unknown): number => (v == null ? 0 : Number(v));

/**
 * Izla Biznes — CPL (cost-per-lead) yetkazish dvigateli.
 *
 * Har malakali lead (sug'urta polisi / ipoteka / nasiya arizasi) yaratilgach
 * egasi homiyga YETKAZILADI va homiy hamyonidan bitta lead narxi (CPL, tarifga
 * qarab chegirmali) yechiladi. Hamyon balansi yetmasa — lead BLOCKED bo'ladi
 * (homiy ko'rmaydi, hisoblanmaydi); hamyon to'ldirilsa `flushForPartner` uni
 * yetkazadi. Egasi bo'lmagan (partnerId=null) obyektlar leadlari PENDING qoladi.
 *
 * Idempotent: allaqachon DELIVERED lead qayta hisoblanmaydi (delivery flagi gate).
 */
@Injectable()
export class LeadDeliveryService {
  private readonly logger = new Logger('LeadDelivery');

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  /** Bitta leadni yetkazishga urinadi (charge + notify). Best-effort natija qaytaradi. */
  async deliver(kind: LeadKind, leadId: string): Promise<DeliveryResult> {
    try {
      const ctx = await this.loadLead(kind, leadId);
      if (!ctx) return { status: 'PENDING', reason: 'no_owner' };
      if (ctx.delivery === 'DELIVERED') return { status: 'DELIVERED', reason: 'already_delivered' };

      // Egasi yo'q (platforma obyekti) — yetkazadigan/hisoblaydigan homiy yo'q.
      if (!ctx.partnerId) return { status: 'PENDING', reason: 'no_owner' };

      const partner = await this.prisma.partnerAccount.findUnique({
        where: { id: ctx.partnerId },
        select: { id: true, plan: true, billingStatus: true },
      });
      // Obuna neaktiv — mahsulotlar yashirin, lead yetkazilmaydi.
      if (!partner || partner.billingStatus === 'SUSPENDED') {
        await this.setPartnerId(kind, leadId, ctx.partnerId);
        return { status: 'PENDING', reason: 'suspended' };
      }

      const cpl = leadPriceFor(partner.plan);
      const outcome = await this.charge(kind, leadId, partner.id, cpl);

      if (outcome === 'DELIVERED') {
        // Bildirishnoma — best-effort, chaqiruvchini bloklamaydi.
        void this.notifications.notifyPartnerNewLead(partner.id, {
          channel: kind,
          name: ctx.name,
          phone: ctx.phone,
          product: ctx.product,
          amount: ctx.amount,
        });
        return { status: 'DELIVERED', billedAmount: cpl };
      }
      void this.notifications.notifyPartnerLeadBlocked(partner.id);
      return { status: 'BLOCKED', reason: 'insufficient_balance' };
    } catch (e) {
      this.logger.error(`deliver(${kind}, ${leadId}) xato: ${(e as Error).message}`);
      return { status: 'PENDING' };
    }
  }

  /**
   * Hamyon to'ldirilgach — homiyning BLOCKED leadlarini (eng eskisidan) qayta
   * yetkazadi. Balans tugaganda qolganlar BLOCKED holida qoladi.
   * @returns yetkazilgan leadlar soni.
   */
  async flushForPartner(partnerId: string): Promise<number> {
    const blocked = await this.blockedLeadsFor(partnerId);
    let delivered = 0;
    for (const b of blocked) {
      const r = await this.deliver(b.kind, b.id);
      if (r.status === 'DELIVERED') delivered++;
      else if (r.status === 'BLOCKED') break; // balans tugadi — qolganlari ham yetmaydi
    }
    return delivered;
  }

  // ─── Atomik hisob (wallet debit + ledger + lead flag) ────────────────────
  private async charge(kind: LeadKind, leadId: string, partnerId: string, cpl: number): Promise<DeliveryOutcome> {
    return this.prisma.$transaction(async (tx) => {
      const wallet = await tx.partnerWallet.findUnique({ where: { partnerId }, select: { id: true, balance: true } });
      const decision = decideCharge(dec(wallet?.balance), cpl);

      if (!wallet || !decision.deliver) {
        await this.updateLead(tx, kind, leadId, { partnerId, delivery: 'BLOCKED' });
        return 'BLOCKED';
      }

      await tx.partnerWallet.update({ where: { partnerId }, data: { balance: decision.balanceAfter } });
      await tx.ledgerEntry.create({
        data: {
          partnerId,
          kind: 'DEBIT',
          amount: decision.charge,
          reason: `Lead: ${kind}`,
          refType: 'lead',
          refId: leadId,
          balanceAfter: decision.balanceAfter,
        },
      });
      await this.updateLead(tx, kind, leadId, {
        partnerId,
        delivery: 'DELIVERED',
        deliveredAt: new Date(),
        billedAmount: decision.charge,
      });
      return 'DELIVERED';
    });
  }

  // ─── Kanal-spetsifik yordamchilar ────────────────────────────────────────
  private async loadLead(
    kind: LeadKind,
    id: string,
  ): Promise<{ partnerId: string | null; delivery: string; name: string | null; phone: string | null; product: string | null; amount: number } | null> {
    if (kind === 'insurance') {
      const p = await this.prisma.insurancePolicy.findUnique({
        where: { id },
        select: {
          delivery: true, premium: true,
          user: { select: { name: true, phone: true } },
          product: { select: { name: true, insurer: { select: { partnerId: true, name: true } } } },
        },
      });
      if (!p) return null;
      return {
        partnerId: p.product?.insurer?.partnerId ?? null,
        delivery: p.delivery,
        name: p.user?.name ?? null,
        phone: p.user?.phone ?? null,
        product: p.product?.name ?? null,
        amount: dec(p.premium),
      };
    }
    if (kind === 'mortgage') {
      const l = await this.prisma.mortgageLead.findUnique({
        where: { id },
        select: { delivery: true, name: true, phone: true, amount: true, program: { select: { name: true, bank: { select: { partnerId: true } } } } },
      });
      if (!l) return null;
      return {
        partnerId: l.program?.bank?.partnerId ?? null,
        delivery: l.delivery,
        name: l.name,
        phone: l.phone,
        product: l.program?.name ?? null,
        amount: dec(l.amount),
      };
    }
    const l = await this.prisma.nasiyaLead.findUnique({
      where: { id },
      select: { delivery: true, name: true, phone: true, amount: true, provider: { select: { name: true, partnerId: true } } },
    });
    if (!l) return null;
    return {
      partnerId: l.provider?.partnerId ?? null,
      delivery: l.delivery,
      name: l.name,
      phone: l.phone,
      product: l.provider?.name ?? null,
      amount: dec(l.amount),
    };
  }

  private async updateLead(
    tx: Prisma.TransactionClient,
    kind: LeadKind,
    id: string,
    data: { partnerId: string; delivery: 'DELIVERED' | 'BLOCKED'; deliveredAt?: Date; billedAmount?: number },
  ) {
    const payload = {
      partnerId: data.partnerId,
      delivery: data.delivery,
      deliveredAt: data.deliveredAt ?? undefined,
      billedAmount: data.billedAmount ?? undefined,
    };
    if (kind === 'insurance') await tx.insurancePolicy.update({ where: { id }, data: payload });
    else if (kind === 'mortgage') await tx.mortgageLead.update({ where: { id }, data: payload });
    else await tx.nasiyaLead.update({ where: { id }, data: payload });
  }

  private async setPartnerId(kind: LeadKind, id: string, partnerId: string) {
    if (kind === 'insurance') await this.prisma.insurancePolicy.update({ where: { id }, data: { partnerId } });
    else if (kind === 'mortgage') await this.prisma.mortgageLead.update({ where: { id }, data: { partnerId } });
    else await this.prisma.nasiyaLead.update({ where: { id }, data: { partnerId } });
  }

  private async blockedLeadsFor(partnerId: string): Promise<{ kind: LeadKind; id: string; createdAt: Date }[]> {
    const [ins, mort, nas] = await Promise.all([
      this.prisma.insurancePolicy.findMany({ where: { partnerId, delivery: 'BLOCKED' }, select: { id: true, createdAt: true }, orderBy: { createdAt: 'asc' } }),
      this.prisma.mortgageLead.findMany({ where: { partnerId, delivery: 'BLOCKED' }, select: { id: true, createdAt: true }, orderBy: { createdAt: 'asc' } }),
      this.prisma.nasiyaLead.findMany({ where: { partnerId, delivery: 'BLOCKED' }, select: { id: true, createdAt: true }, orderBy: { createdAt: 'asc' } }),
    ]);
    return [
      ...ins.map((r) => ({ kind: 'insurance' as const, id: r.id, createdAt: r.createdAt })),
      ...mort.map((r) => ({ kind: 'mortgage' as const, id: r.id, createdAt: r.createdAt })),
      ...nas.map((r) => ({ kind: 'nasiya' as const, id: r.id, createdAt: r.createdAt })),
    ].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }
}
