import { BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import type { Prisma, PartnerMemberRole } from '@izla/db';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { partnerPlanConfig } from '../../common/partner-plans';

const DAY = 24 * 60 * 60 * 1000;
const PERIOD_DAYS = 30; // obuna davri
const GRACE_DAYS = 7; // muddat tugagach neaktivgacha imkon (grace)

type PlanId = 'FREE' | 'GROWTH' | 'ENTERPRISE';

/**
 * Dunning bosqichlari (O'RTACHA jadval — user tanlovi):
 *  −3 kun: yaqinlashayotgan yangilanish · 0 kun: muddat tugadi (invoice+PAST_DUE)
 *  +3 kun: ogohlantirish · +6 kun: oxirgi ogohlantirish · +7 kun: SUSPENDED
 * `day` = muddatdan (planExpiresAt) o'tган kunlar (manfiy = oldin).
 */
const DUNNING = [
  { stage: 1, day: -3, type: 'renewal_upcoming' },
  { stage: 2, day: 0, type: 'past_due' },
  { stage: 3, day: 3, type: 'warning' },
  { stage: 4, day: 6, type: 'final_warning' },
  { stage: 5, day: 7, type: 'suspended' },
] as const;

function stageForDaysPast(daysPast: number): number {
  let s = 0;
  for (const d of DUNNING) if (daysPast >= d.day) s = d.stage;
  return s;
}
const typeForStage = (stage: number) => DUNNING.find((d) => d.stage === stage)?.type ?? 'renewal_upcoming';

const dec = (v: unknown): number => (v == null ? 0 : Number(v));

@Injectable()
export class PartnerBillingService {
  private readonly logger = new Logger('PartnerBilling');
  private readonly disabled = process.env.SCHEDULER_DISABLED === '1';

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  // ─── Egalik ────────────────────────────────────────────────────────────────
  private async assertOwner(userId: string, partnerId: string, roles: PartnerMemberRole[] = ['OWNER']) {
    const m = await this.prisma.partnerMember.findUnique({
      where: { partnerId_userId: { partnerId, userId } },
      select: { role: true },
    });
    if (!m) throw new ForbiddenException('Bu kompaniyaga ruxsatingiz yo‘q');
    if (!roles.includes(m.role)) throw new ForbiddenException('Bu amal uchun huquqingiz yetarli emas');
  }

  private genInvoiceNumber(): string {
    const yr = new Date().getFullYear();
    return `IZB-${yr}-${Math.floor(100000 + Math.random() * 900000)}`;
  }

  private periodLabel(d = new Date()): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }

  // ─── Obuna tanlash / yangilash ───────────────────────────────────────────
  /** FREE → darrov faollashadi. Pullik → OPEN invoice yaratiladi (to'lovda faollashadi). */
  async subscribe(userId: string, partnerId: string, plan: PlanId) {
    await this.assertOwner(userId, partnerId);
    const cfg = partnerPlanConfig(plan);

    if (plan === 'FREE' || cfg.priceMonthly === 0) {
      await this.prisma.$transaction(async (tx) => {
        await tx.partnerAccount.update({
          where: { id: partnerId },
          data: {
            plan: 'FREE',
            planActivatedAt: null,
            planExpiresAt: null,
            billingStatus: 'ACTIVE',
            status: 'ACTIVE',
            gracePeriodEnds: null,
            lastDunningStage: 0,
          },
        });
        // Ochiq invoice'larni bekor qilamiz
        await tx.invoice.updateMany({ where: { partnerId, status: 'OPEN' }, data: { status: 'VOID' } });
      });
      return { plan: 'FREE' as const, activated: true };
    }

    // Pullik: hisob-faktura yaratamiz (to'lov kutiladi)
    let number = this.genInvoiceNumber();
    for (let i = 0; i < 5; i++) {
      const dup = await this.prisma.invoice.findUnique({ where: { number }, select: { id: true } });
      if (!dup) break;
      number = this.genInvoiceNumber();
    }
    const now = new Date();
    const invoice = await this.prisma.invoice.create({
      data: {
        partnerId,
        number,
        plan,
        periodLabel: this.periodLabel(now),
        periodStart: now,
        periodEnd: new Date(now.getTime() + PERIOD_DAYS * DAY),
        amount: cfg.priceMonthly,
        status: 'OPEN',
        dueAt: new Date(now.getTime() + 3 * DAY),
        lines: [{ label: `Obuna: ${plan}`, qty: 1, unit: cfg.priceMonthly, amount: cfg.priceMonthly }] as unknown as Prisma.InputJsonValue,
      },
      select: { id: true, number: true, amount: true, plan: true, status: true, dueAt: true },
    });
    return { plan, activated: false, invoice: { ...invoice, amount: dec(invoice.amount) }, checkout: { demo: true } };
  }

  // ─── Invoice to'lash (DEMO — real Payme/Click webhook ham markInvoicePaid'ni chaqiradi) ──
  async payInvoiceDemo(userId: string, partnerId: string, invoiceId: string) {
    await this.assertOwner(userId, partnerId);
    const invoice = await this.prisma.invoice.findUnique({ where: { id: invoiceId }, select: { id: true, partnerId: true, status: true, amount: true } });
    if (!invoice || invoice.partnerId !== partnerId) throw new NotFoundException('Hisob-faktura topilmadi');
    if (invoice.status === 'PAID') throw new BadRequestException('Bu hisob-faktura allaqachon to‘langan');

    // Audit uchun Payment yozuvi (kelajakdagi daromad konsoli uchun)
    await this.prisma.payment.create({
      data: {
        invoiceId: invoice.id,
        userId,
        amount: invoice.amount,
        provider: 'PAYME',
        status: 'PAID',
        paidAt: new Date(),
      },
    });
    await this.markInvoicePaid(invoiceId);
    return this.overview(userId, partnerId);
  }

  /** Hisob-faktura to'landi → obuna faollashadi/uzayadi, neaktiv bo'lsa TIKLANADI. Idempotent. */
  async markInvoicePaid(invoiceId: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.findUnique({
        where: { id: invoiceId },
        select: { id: true, partnerId: true, status: true, plan: true, amount: true, partner: { select: { plan: true, planExpiresAt: true } } },
      });
      if (!invoice || invoice.status === 'PAID') return; // idempotent

      const now = new Date();
      const newPlan = (invoice.plan ?? invoice.partner.plan) as PlanId;
      // Faol obuna qolgan bo'lsa — mavjud muddatga qo'shamiz (adolatli), aks holda hozirdan.
      const cur = invoice.partner.planExpiresAt;
      const base = cur && cur > now ? cur : now;
      const newExpiry = new Date(base.getTime() + PERIOD_DAYS * DAY);

      await tx.invoice.update({ where: { id: invoice.id }, data: { status: 'PAID', paidAt: now } });
      await tx.partnerAccount.update({
        where: { id: invoice.partnerId },
        data: {
          plan: newPlan,
          planActivatedAt: now,
          planExpiresAt: newExpiry,
          billingStatus: 'ACTIVE', // neaktiv edi bo'lsa → TIKLANADI (mahsulotlar qaytadi)
          status: 'ACTIVE',
          gracePeriodEnds: null,
          lastDunningStage: 0,
        },
      });
      await tx.ledgerEntry.create({
        data: {
          partnerId: invoice.partnerId,
          kind: 'DEBIT',
          amount: invoice.amount,
          reason: `Obuna to‘lovi: ${newPlan}`,
          refType: 'invoice',
          refId: invoice.id,
        },
      });
    });
    await this.notifyOwners(invoiceId ? await this.partnerOfInvoice(invoiceId) : '', 'reactivated', {
      title: 'Obuna faollashtirildi',
      body: 'To‘lov qabul qilindi. Mahsulotlaringiz yana jonli efirda.',
    });
  }

  private async partnerOfInvoice(invoiceId: string): Promise<string> {
    const inv = await this.prisma.invoice.findUnique({ where: { id: invoiceId }, select: { partnerId: true } });
    return inv?.partnerId ?? '';
  }

  // ─── Ko'rinish ────────────────────────────────────────────────────────────
  async overview(userId: string, partnerId: string) {
    await this.assertMemberAny(userId, partnerId);
    const p = await this.prisma.partnerAccount.findUnique({
      where: { id: partnerId },
      select: { id: true, plan: true, status: true, billingStatus: true, planExpiresAt: true, gracePeriodEnds: true, autoRenew: true },
    });
    if (!p) throw new NotFoundException('Kompaniya topilmadi');
    const cfg = partnerPlanConfig(p.plan);
    const openInvoice = await this.prisma.invoice.findFirst({
      where: { partnerId, status: 'OPEN' },
      orderBy: { createdAt: 'desc' },
      select: { id: true, number: true, amount: true, plan: true, dueAt: true, createdAt: true },
    });
    return {
      plan: p.plan,
      priceMonthly: cfg.priceMonthly,
      billingStatus: p.billingStatus,
      status: p.status,
      planExpiresAt: p.planExpiresAt,
      gracePeriodEnds: p.gracePeriodEnds,
      autoRenew: p.autoRenew,
      openInvoice: openInvoice ? { ...openInvoice, amount: dec(openInvoice.amount) } : null,
    };
  }

  async invoices(userId: string, partnerId: string) {
    await this.assertMemberAny(userId, partnerId);
    const rows = await this.prisma.invoice.findMany({
      where: { partnerId },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: { id: true, number: true, amount: true, plan: true, status: true, dueAt: true, paidAt: true, createdAt: true, periodLabel: true },
    });
    return rows.map((r) => ({ ...r, amount: dec(r.amount) }));
  }

  private async assertMemberAny(userId: string, partnerId: string) {
    const m = await this.prisma.partnerMember.findUnique({ where: { partnerId_userId: { partnerId, userId } }, select: { role: true } });
    if (!m) throw new ForbiddenException('Bu kompaniyaga ruxsatingiz yo‘q');
  }

  // ─── DEMO: muddatni surish + darrov lifecycle tekshiruvi ─────────────────
  /** planExpiresAt'ni `daysPast` kun oldinga suradi va lifecycle'ni shu homiy uchun darrov ishga tushiradi. */
  async simulate(userId: string, partnerId: string, daysPast: number) {
    await this.assertOwner(userId, partnerId);
    const p = await this.prisma.partnerAccount.findUnique({ where: { id: partnerId }, select: { plan: true } });
    if (!p || p.plan === 'FREE') throw new BadRequestException('Avval pullik tarifni faollashtiring (demo simulyatsiya uchun)');
    const now = new Date();
    await this.prisma.partnerAccount.update({
      where: { id: partnerId },
      data: {
        planExpiresAt: new Date(now.getTime() - daysPast * DAY),
        billingStatus: 'ACTIVE',
        status: 'ACTIVE',
        gracePeriodEnds: null,
        lastDunningStage: 0,
        autoRenew: true,
      },
    });
    await this.tickPartner(partnerId);
    return this.overview(userId, partnerId);
  }

  // ─── Lifecycle dvigateli ─────────────────────────────────────────────────
  /** Bitta homiy uchun lifecycle bosqichini qo'llaydi (cron + demo shu metodni ishlatadi). */
  async tickPartner(partnerId: string): Promise<void> {
    const p = await this.prisma.partnerAccount.findUnique({
      where: { id: partnerId },
      select: { id: true, plan: true, planExpiresAt: true, billingStatus: true, lastDunningStage: true, autoRenew: true },
    });
    if (!p || p.plan === 'FREE' || !p.planExpiresAt) return;
    if (p.billingStatus === 'CANCELLED') return;

    const daysPast = Math.floor((Date.now() - p.planExpiresAt.getTime()) / DAY);
    const target = stageForDaysPast(daysPast);
    if (target <= p.lastDunningStage) return; // yangi bosqich yo'q

    const data: Prisma.PartnerAccountUpdateInput = { lastDunningStage: target };

    // Bosqich 2+: muddat tugadi → PAST_DUE + grace + yangilash invoice'i
    if (target >= 2 && p.billingStatus !== 'PAST_DUE' && p.billingStatus !== 'SUSPENDED') {
      data.billingStatus = 'PAST_DUE';
      data.gracePeriodEnds = new Date(p.planExpiresAt.getTime() + GRACE_DAYS * DAY);
    }
    if (target >= 2 && p.autoRenew) {
      await this.ensureRenewalInvoice(partnerId, p.plan as PlanId);
    }
    // Bosqich 5: grace o'tdi → SUSPENDED (mahsulotlar yashirin, ma'lumot saqlanadi)
    if (target >= 5) {
      data.billingStatus = 'SUSPENDED';
      data.status = 'SUSPENDED';
    }

    await this.prisma.partnerAccount.update({ where: { id: partnerId }, data });
    await this.notifyStage(partnerId, target);
  }

  private async ensureRenewalInvoice(partnerId: string, plan: PlanId) {
    const open = await this.prisma.invoice.findFirst({ where: { partnerId, status: 'OPEN' }, select: { id: true } });
    if (open) return;
    const cfg = partnerPlanConfig(plan);
    if (cfg.priceMonthly === 0) return;
    let number = this.genInvoiceNumber();
    for (let i = 0; i < 5; i++) {
      const dup = await this.prisma.invoice.findUnique({ where: { number }, select: { id: true } });
      if (!dup) break;
      number = this.genInvoiceNumber();
    }
    const now = new Date();
    await this.prisma.invoice.create({
      data: {
        partnerId, number, plan, periodLabel: this.periodLabel(now),
        periodStart: now, periodEnd: new Date(now.getTime() + PERIOD_DAYS * DAY),
        amount: cfg.priceMonthly, status: 'OPEN', dueAt: new Date(now.getTime() + GRACE_DAYS * DAY),
        lines: [{ label: `Obuna yangilash: ${plan}`, qty: 1, unit: cfg.priceMonthly, amount: cfg.priceMonthly }] as unknown as Prisma.InputJsonValue,
      },
    });
  }

  private async notifyStage(partnerId: string, stage: number) {
    const type = typeForStage(stage);
    const msg: Record<string, { title: string; body: string }> = {
      renewal_upcoming: { title: 'Obuna tez orada yangilanadi', body: 'Obunangiz muddati 3 kundan so‘ng tugaydi. Uzluksiz ishlashi uchun to‘lovni amalga oshiring.' },
      past_due: { title: 'To‘lov muddati keldi', body: 'Obuna muddati tugadi. Hisob-fakturani to‘lang — aks holda mahsulotlar vaqtincha yashiriladi.' },
      warning: { title: 'Ogohlantirish: to‘lov kutilmoqda', body: 'Obuna hali to‘lanmagan. Bir necha kundan so‘ng mahsulotlaringiz platformada ko‘rinmay qoladi.' },
      final_warning: { title: 'Oxirgi ogohlantirish', body: 'Ertaga obuna neaktiv qilinadi va mahsulotlaringiz yashiriladi. Ma’lumotlaringiz saqlanadi — to‘lasangiz darrov tiklanadi.' },
      suspended: { title: 'Obuna neaktiv qilindi', body: 'To‘lov amalga oshirilmadi. Mahsulotlaringiz vaqtincha yashirildi, lekin barcha ma’lumot saqlanmoqda. To‘lasangiz darrov tiklanadi.' },
    };
    await this.notifyOwners(partnerId, type, msg[type] ?? msg.renewal_upcoming);
  }

  private async notifyOwners(partnerId: string, type: string, m: { title: string; body: string }) {
    if (!partnerId) return;
    const members = await this.prisma.partnerMember.findMany({
      where: { partnerId, role: { in: ['OWNER', 'MANAGER'] } },
      select: { userId: true },
    });
    for (const mem of members) {
      await this.notifications.pushInApp(mem.userId, `partner_${type}`, { title: m.title, body: m.body, href: '/biznes/kabinet' }).catch(() => {});
    }
  }

  // ─── CRON: har soatda lifecycle sweep (demo uchun tez-tez; kunlik ham yetarli) ──
  @Cron('7 * * * *')
  async runLifecycle(): Promise<void> {
    if (this.disabled) return;
    const now = new Date();
    const partners = await this.prisma.partnerAccount.findMany({
      where: {
        plan: { not: 'FREE' },
        planExpiresAt: { not: null },
        billingStatus: { in: ['ACTIVE', 'PAST_DUE', 'TRIALING'] },
        // −3 kun oldin boshlanadigan oynaga tushganlar
        OR: [{ planExpiresAt: { lte: new Date(now.getTime() + 3 * DAY) } }],
      },
      select: { id: true },
      take: 500,
    });
    let acted = 0;
    for (const p of partners) {
      const before = await this.prisma.partnerAccount.findUnique({ where: { id: p.id }, select: { lastDunningStage: true } });
      await this.tickPartner(p.id);
      const after = await this.prisma.partnerAccount.findUnique({ where: { id: p.id }, select: { lastDunningStage: true } });
      if (before?.lastDunningStage !== after?.lastDunningStage) acted++;
    }
    if (acted) this.logger.log(`Billing lifecycle: ${acted} homiy bosqichi yangilandi`);
  }
}
