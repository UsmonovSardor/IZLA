import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma, PartnerMemberRole } from '@izla/db';
import { PrismaService } from '../../prisma/prisma.service';
import { partnerPlanConfig, PARTNER_PLAN_LIST } from '../../common/partner-plans';
import { CreateMortgageProgramDto, RegisterPartnerDto, UpdateMortgageProgramDto, UpdatePartnerDto } from './dto';

const dec = (v: unknown): number => (v == null ? 0 : Number(v));

function slugify(s: string): string {
  return (
    s
      .toLowerCase()
      .replace(/['`’]/g, '')
      .replace(/[^a-z0-9Ѐ-ӿ]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 48) || 'homiy'
  );
}

// Birlashgan lead inbox uchun umumiy ko'rinish
interface UnifiedLead {
  id: string;
  channel: 'insurance' | 'mortgage' | 'nasiya';
  name: string | null;
  phone: string | null;
  amount: number; // premiya / kredit / xarid summasi (so'm)
  status: string;
  product: string | null; // mahsulot/dastur nomi
  brand: string | null; // kompaniya nomi
  createdAt: Date;
}

@Injectable()
export class PartnerService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Egalik (membership) guard ────────────────────────────────────────────
  /** Foydalanuvchi shu kompaniya a'zosimi? A'zolikni qaytaradi yoki 403/404. */
  private async assertMember(
    userId: string,
    partnerId: string,
    roles?: PartnerMemberRole[],
  ): Promise<{ role: PartnerMemberRole }> {
    const m = await this.prisma.partnerMember.findUnique({
      where: { partnerId_userId: { partnerId, userId } },
      select: { role: true },
    });
    if (!m) throw new ForbiddenException('Bu kompaniyaga ruxsatingiz yo‘q');
    if (roles && !roles.includes(m.role)) {
      throw new ForbiddenException('Bu amal uchun huquqingiz yetarli emas');
    }
    return m;
  }

  // ─── Onboarding: kompaniya yaratish ───────────────────────────────────────
  async register(userId: string, dto: RegisterPartnerDto) {
    const base = slugify(dto.name);
    let slug = `${base}-${Math.random().toString(36).slice(2, 6)}`;
    for (let i = 0; i < 4; i++) {
      const exists = await this.prisma.partnerAccount.findUnique({ where: { slug }, select: { id: true } });
      if (!exists) break;
      slug = `${base}-${Math.random().toString(36).slice(2, 7)}`;
    }

    const partner = await this.prisma.$transaction(async (tx) => {
      const p = await tx.partnerAccount.create({
        data: {
          name: dto.name.trim(),
          slug,
          legalName: dto.legalName?.trim() || null,
          taxId: dto.taxId?.trim() || null,
          phone: dto.phone?.trim() || null,
          email: dto.email?.trim() || null,
          website: dto.website?.trim() || null,
          color: dto.color?.trim() || null,
          status: 'PENDING',
          plan: 'FREE',
          members: { create: { userId, role: 'OWNER' } },
          wallet: { create: {} },
        },
        select: { id: true, slug: true, name: true, status: true, plan: true },
      });
      // Foydalanuvchi rolini PARTNER'ga ko'tarish (oddiy USER bo'lsa)
      await tx.user.updateMany({ where: { id: userId, role: 'USER' }, data: { role: 'PARTNER' } });
      return p;
    });

    return partner;
  }

  // ─── Foydalanuvchining kompaniyalari ──────────────────────────────────────
  async me(userId: string) {
    const memberships = await this.prisma.partnerMember.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
      select: {
        role: true,
        partner: {
          select: {
            id: true,
            name: true,
            slug: true,
            logoUrl: true,
            color: true,
            status: true,
            plan: true,
            planExpiresAt: true,
          },
        },
      },
    });
    return memberships.map((m) => ({ ...m.partner, memberRole: m.role }));
  }

  // ─── Kompaniya profili ────────────────────────────────────────────────────
  async get(userId: string, partnerId: string) {
    await this.assertMember(userId, partnerId);
    const p = await this.prisma.partnerAccount.findUnique({
      where: { id: partnerId },
      select: {
        id: true, name: true, slug: true, legalName: true, taxId: true, logoUrl: true,
        website: true, phone: true, email: true, color: true, status: true, plan: true,
        planActivatedAt: true, planExpiresAt: true, createdAt: true,
      },
    });
    if (!p) throw new NotFoundException('Kompaniya topilmadi');
    return { ...p, planConfig: partnerPlanConfig(p.plan) };
  }

  async update(userId: string, partnerId: string, dto: UpdatePartnerDto) {
    await this.assertMember(userId, partnerId, ['OWNER', 'MANAGER']);
    const p = await this.prisma.partnerAccount.update({
      where: { id: partnerId },
      data: {
        name: dto.name?.trim() ?? undefined,
        legalName: dto.legalName?.trim() ?? undefined,
        taxId: dto.taxId?.trim() ?? undefined,
        phone: dto.phone?.trim() ?? undefined,
        email: dto.email?.trim() ?? undefined,
        website: dto.website?.trim() ?? undefined,
        color: dto.color?.trim() ?? undefined,
        logoUrl: dto.logoUrl?.trim() ?? undefined,
      },
      select: { id: true, name: true, slug: true },
    });
    return p;
  }

  // ─── Dashboard: yagona ko'rsatkichlar paneli ──────────────────────────────
  async dashboard(userId: string, partnerId: string) {
    await this.assertMember(userId, partnerId);
    const since = new Date(Date.now() - 30 * 24 * 3600 * 1000);

    const [partner, wallet, insurerIds, bankIds, nasiyaIds, vendorCount] = await Promise.all([
      this.prisma.partnerAccount.findUnique({
        where: { id: partnerId },
        select: { id: true, name: true, slug: true, plan: true, status: true, planExpiresAt: true },
      }),
      this.prisma.partnerWallet.findUnique({ where: { partnerId }, select: { balance: true, currency: true } }),
      this.prisma.insurer.findMany({ where: { partnerId }, select: { id: true } }),
      this.prisma.bank.findMany({ where: { partnerId }, select: { id: true } }),
      this.prisma.nasiyaProvider.findMany({ where: { partnerId }, select: { id: true } }),
      this.prisma.vendor.count({ where: { partnerId } }),
    ]);
    if (!partner) throw new NotFoundException('Kompaniya topilmadi');

    const insIds = insurerIds.map((x) => x.id);
    const bnkIds = bankIds.map((x) => x.id);
    const nsIds = nasiyaIds.map((x) => x.id);

    const [insProducts, mortPrograms, insLeads, insLeads30, mortLeads, mortLeads30, nasLeads, nasLeads30] =
      await Promise.all([
        this.prisma.insuranceProduct.count({ where: { insurerId: { in: insIds } } }),
        this.prisma.mortgageProgram.count({ where: { bankId: { in: bnkIds } } }),
        this.prisma.insurancePolicy.count({ where: { product: { insurerId: { in: insIds } } } }),
        this.prisma.insurancePolicy.count({ where: { product: { insurerId: { in: insIds } }, createdAt: { gte: since } } }),
        this.prisma.mortgageLead.count({ where: { program: { bankId: { in: bnkIds } } } }),
        this.prisma.mortgageLead.count({ where: { program: { bankId: { in: bnkIds } }, createdAt: { gte: since } } }),
        this.prisma.nasiyaLead.count({ where: { providerId: { in: nsIds } } }),
        this.prisma.nasiyaLead.count({ where: { providerId: { in: nsIds }, createdAt: { gte: since } } }),
      ]);

    const cfg = partnerPlanConfig(partner.plan);
    const totalProducts = insProducts + mortPrograms + nsIds.length + vendorCount;

    return {
      partner,
      plan: cfg,
      wallet: { balance: dec(wallet?.balance), currency: wallet?.currency ?? 'UZS' },
      counts: {
        insurers: insIds.length,
        banks: bnkIds.length,
        nasiyaProviders: nsIds.length,
        vendors: vendorCount,
        products: totalProducts,
      },
      leads: {
        total: insLeads + mortLeads + nasLeads,
        last30d: insLeads30 + mortLeads30 + nasLeads30,
        byChannel: { insurance: insLeads, mortgage: mortLeads, nasiya: nasLeads },
      },
      featured: { used: 0, limit: cfg.featuredSlots },
      limits: { products: cfg.productLimit, productsUsed: totalProducts },
    };
  }

  // ─── Egalik ostidagi mahsulotlar (kanallar bo'ylab) ───────────────────────
  async products(userId: string, partnerId: string) {
    await this.assertMember(userId, partnerId);
    const [insurers, banks, providers, vendors] = await Promise.all([
      this.prisma.insurer.findMany({
        where: { partnerId },
        select: { id: true, name: true, slug: true, products: { select: { id: true, name: true, slug: true, type: true, active: true, priceFrom: true } } },
      }),
      this.prisma.bank.findMany({
        where: { partnerId },
        select: { id: true, name: true, slug: true, programs: { select: { id: true, name: true, slug: true, annualRate: true, active: true } } },
      }),
      this.prisma.nasiyaProvider.findMany({
        where: { partnerId },
        select: { id: true, name: true, slug: true, active: true, terms: true, merchantFee: true },
      }),
      this.prisma.vendor.findMany({
        where: { partnerId },
        select: { id: true, name: true, slug: true, status: true, plan: true },
      }),
    ]);

    return {
      insurance: insurers.flatMap((i) =>
        i.products.map((p) => ({ id: p.id, channel: 'insurance' as const, name: p.name, slug: p.slug, meta: p.type, active: p.active, price: dec(p.priceFrom), brand: i.name })),
      ),
      mortgage: banks.flatMap((b) =>
        b.programs.map((p) => ({ id: p.id, channel: 'mortgage' as const, name: p.name, slug: p.slug, meta: `${dec(p.annualRate)}%`, active: p.active, brand: b.name })),
      ),
      nasiya: providers.map((p) => ({ id: p.id, channel: 'nasiya' as const, name: p.name, slug: p.slug, meta: `${Object.keys((p.terms as Record<string, unknown>) ?? {}).length} muddat`, active: p.active, brand: p.name })),
      vendors: vendors.map((v) => ({ id: v.id, channel: 'vendor' as const, name: v.name, slug: v.slug, meta: v.plan, active: v.status === 'ACTIVE', brand: v.name })),
    };
  }

  // ─── Birlashgan lead inbox (3 kanal) ──────────────────────────────────────
  async leads(userId: string, partnerId: string, filter: { channel?: string; status?: string } = {}) {
    await this.assertMember(userId, partnerId);
    const [insurerIds, bankIds, nasiyaIds] = await Promise.all([
      this.prisma.insurer.findMany({ where: { partnerId }, select: { id: true } }),
      this.prisma.bank.findMany({ where: { partnerId }, select: { id: true } }),
      this.prisma.nasiyaProvider.findMany({ where: { partnerId }, select: { id: true } }),
    ]);
    const insIds = insurerIds.map((x) => x.id);
    const bnkIds = bankIds.map((x) => x.id);
    const nsIds = nasiyaIds.map((x) => x.id);

    const wantInsurance = !filter.channel || filter.channel === 'insurance';
    const wantMortgage = !filter.channel || filter.channel === 'mortgage';
    const wantNasiya = !filter.channel || filter.channel === 'nasiya';

    const [insPolicies, mortLeads, nasLeads] = await Promise.all([
      wantInsurance && insIds.length
        ? this.prisma.insurancePolicy.findMany({
            where: { product: { insurerId: { in: insIds } }, ...(filter.status ? { status: filter.status as never } : {}) },
            orderBy: { createdAt: 'desc' },
            take: 100,
            select: {
              id: true, premium: true, status: true, createdAt: true,
              user: { select: { name: true, phone: true } },
              product: { select: { name: true, insurer: { select: { name: true } } } },
            },
          })
        : Promise.resolve([]),
      wantMortgage && bnkIds.length
        ? this.prisma.mortgageLead.findMany({
            where: { program: { bankId: { in: bnkIds } }, ...(filter.status ? { status: filter.status as never } : {}) },
            orderBy: { createdAt: 'desc' },
            take: 100,
            select: {
              id: true, amount: true, status: true, createdAt: true, name: true, phone: true,
              program: { select: { name: true, bank: { select: { name: true } } } },
            },
          })
        : Promise.resolve([]),
      wantNasiya && nsIds.length
        ? this.prisma.nasiyaLead.findMany({
            where: { providerId: { in: nsIds }, ...(filter.status ? { status: filter.status as never } : {}) },
            orderBy: { createdAt: 'desc' },
            take: 100,
            select: {
              id: true, amount: true, status: true, createdAt: true, name: true, phone: true,
              provider: { select: { name: true } },
            },
          })
        : Promise.resolve([]),
    ]);

    const unified: UnifiedLead[] = [
      ...insPolicies.map((p) => ({
        id: p.id, channel: 'insurance' as const, name: p.user?.name ?? null, phone: p.user?.phone ?? null,
        amount: dec(p.premium), status: p.status, product: p.product?.name ?? null,
        brand: p.product?.insurer?.name ?? null, createdAt: p.createdAt,
      })),
      ...mortLeads.map((l) => ({
        id: l.id, channel: 'mortgage' as const, name: l.name, phone: l.phone,
        amount: dec(l.amount), status: l.status, product: l.program?.name ?? null,
        brand: l.program?.bank?.name ?? null, createdAt: l.createdAt,
      })),
      ...nasLeads.map((l) => ({
        id: l.id, channel: 'nasiya' as const, name: l.name, phone: l.phone,
        amount: dec(l.amount), status: l.status, product: l.provider?.name ?? null,
        brand: l.provider?.name ?? null, createdAt: l.createdAt,
      })),
    ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return unified;
  }

  // ─── Obuna tarifini tanlash (FAZA 1: demo darrov faollashadi) ─────────────
  async selectPlan(userId: string, partnerId: string, plan: 'FREE' | 'GROWTH' | 'ENTERPRISE') {
    await this.assertMember(userId, partnerId, ['OWNER']);
    const cfg = partnerPlanConfig(plan);
    const now = new Date();
    const expires = plan === 'FREE' ? null : new Date(now.getTime() + 30 * 24 * 3600 * 1000);

    await this.prisma.$transaction(async (tx) => {
      await tx.partnerAccount.update({
        where: { id: partnerId },
        data: {
          plan,
          planActivatedAt: plan === 'FREE' ? null : now,
          planExpiresAt: expires,
          // FAZA 1 demo: tanlagach ACTIVE bo'ladi (real moderatsiya keyin)
          status: 'ACTIVE',
        },
      });
      // Billing audit izi (FAZA 1: demo yozuv — real yechim FAZA 2)
      if (cfg.priceMonthly > 0) {
        await tx.ledgerEntry.create({
          data: {
            partnerId,
            kind: 'DEBIT',
            amount: cfg.priceMonthly,
            reason: `Obuna: ${plan} (demo)`,
            refType: 'subscription',
          },
        });
      }
    });

    return { plan, planExpiresAt: expires, priceMonthly: cfg.priceMonthly };
  }

  // ═══ Self-serve: bank + ipoteka dasturi boshqaruvi ═══════════════════════

  /** Homiyning jami faol mahsulotlari (tarif chegarasi uchun). */
  private async totalProductCount(partnerId: string): Promise<number> {
    const [insurerIds, bankIds, nasiya, vendors] = await Promise.all([
      this.prisma.insurer.findMany({ where: { partnerId }, select: { id: true } }),
      this.prisma.bank.findMany({ where: { partnerId }, select: { id: true } }),
      this.prisma.nasiyaProvider.count({ where: { partnerId } }),
      this.prisma.vendor.count({ where: { partnerId } }),
    ]);
    const [ins, mort] = await Promise.all([
      this.prisma.insuranceProduct.count({ where: { insurerId: { in: insurerIds.map((x) => x.id) } } }),
      this.prisma.mortgageProgram.count({ where: { bankId: { in: bankIds.map((x) => x.id) } } }),
    ]);
    return ins + mort + nasiya + vendors;
  }

  private async assertUnderLimit(partnerId: string, plan: string) {
    const limit = partnerPlanConfig(plan).productLimit;
    const used = await this.totalProductCount(partnerId);
    if (used >= limit) {
      throw new BadRequestException(`Tarif chegarasi (${limit} mahsulot) to‘ldi. Tarifni oshiring.`);
    }
  }

  private async uniqueSlug(base: string, exists: (slug: string) => Promise<boolean>): Promise<string> {
    let slug = `${base}-${Math.random().toString(36).slice(2, 6)}`;
    for (let i = 0; i < 5; i++) {
      if (!(await exists(slug))) return slug;
      slug = `${base}-${Math.random().toString(36).slice(2, 7)}`;
    }
    return slug;
  }

  /** Homiyning banklari (dastur qo'shish formasi uchun). */
  async myBanks(userId: string, partnerId: string) {
    await this.assertMember(userId, partnerId);
    return this.prisma.bank.findMany({
      where: { partnerId },
      orderBy: { createdAt: 'asc' },
      select: { id: true, name: true, slug: true, color: true, verified: true },
    });
  }

  /** Homiy o'z bank brendini yaratadi. */
  async createBank(userId: string, partnerId: string, dto: { name: string; color?: string; logoUrl?: string; description?: string }) {
    await this.assertMember(userId, partnerId, ['OWNER', 'MANAGER']);
    const slug = await this.uniqueSlug(slugify(dto.name), async (s) => !!(await this.prisma.bank.findUnique({ where: { slug: s }, select: { id: true } })));
    const bank = await this.prisma.bank.create({
      data: {
        name: dto.name.trim(),
        slug,
        color: dto.color?.trim() || null,
        logoUrl: dto.logoUrl?.trim() || null,
        description: dto.description?.trim() || null,
        verified: false, // moderatsiya keyin (tasdiqlangan nishon berilmaydi)
        partnerId,
      },
      select: { id: true, name: true, slug: true },
    });
    return bank;
  }

  private async assertOwnedBank(partnerId: string, bankId: string) {
    const bank = await this.prisma.bank.findUnique({ where: { id: bankId }, select: { partnerId: true } });
    if (!bank || bank.partnerId !== partnerId) throw new ForbiddenException('Bank sizga tegishli emas');
  }

  private async assertOwnedProgram(partnerId: string, programId: string) {
    const prog = await this.prisma.mortgageProgram.findUnique({
      where: { id: programId },
      select: { bank: { select: { partnerId: true } } },
    });
    if (!prog || prog.bank.partnerId !== partnerId) throw new ForbiddenException('Dastur sizga tegishli emas');
  }

  /** Ipoteka dasturi yaratish → darrov /ipoteka marketplace + kalkulyatorda jonli. */
  async createMortgageProgram(userId: string, partnerId: string, dto: CreateMortgageProgramDto) {
    const { role } = await this.assertMember(userId, partnerId, ['OWNER', 'MANAGER']);
    void role;
    await this.assertOwnedBank(partnerId, dto.bankId);
    const partner = await this.prisma.partnerAccount.findUnique({ where: { id: partnerId }, select: { plan: true } });
    await this.assertUnderLimit(partnerId, partner?.plan ?? 'FREE');

    const slug = await this.uniqueSlug(slugify(dto.name), async (s) => !!(await this.prisma.mortgageProgram.findUnique({ where: { slug: s }, select: { id: true } })));
    const prog = await this.prisma.mortgageProgram.create({
      data: {
        bankId: dto.bankId,
        name: dto.name.trim(),
        slug,
        summary: dto.summary?.trim() || null,
        annualRate: dto.annualRate,
        maxTermMonths: dto.maxTermMonths,
        minDownPct: dto.minDownPct,
        maxAmount: dto.maxAmount ?? null,
        propertyTypes: dto.propertyTypes ?? [],
        features: (dto.features ?? []) as unknown as Prisma.InputJsonValue,
        subsidized: dto.subsidized ?? false,
        active: true,
        // referralFee (Izla ulushi) — platforma belgilaydi; homiy tahrirlay olmaydi.
        referralFee: 0,
      },
      select: { id: true, name: true, slug: true, active: true, annualRate: true },
    });
    return { ...prog, annualRate: dec(prog.annualRate) };
  }

  async updateMortgageProgram(userId: string, partnerId: string, programId: string, dto: UpdateMortgageProgramDto) {
    await this.assertMember(userId, partnerId, ['OWNER', 'MANAGER']);
    await this.assertOwnedProgram(partnerId, programId);
    const prog = await this.prisma.mortgageProgram.update({
      where: { id: programId },
      data: {
        name: dto.name?.trim() ?? undefined,
        summary: dto.summary?.trim() ?? undefined,
        annualRate: dto.annualRate ?? undefined,
        maxTermMonths: dto.maxTermMonths ?? undefined,
        minDownPct: dto.minDownPct ?? undefined,
        maxAmount: dto.maxAmount ?? undefined,
        propertyTypes: dto.propertyTypes ?? undefined,
        features: dto.features != null ? (dto.features as unknown as Prisma.InputJsonValue) : undefined,
        subsidized: dto.subsidized ?? undefined,
        active: dto.active ?? undefined,
      },
      select: { id: true, name: true, active: true, annualRate: true },
    });
    return { ...prog, annualRate: dec(prog.annualRate) };
  }

  async deleteMortgageProgram(userId: string, partnerId: string, programId: string) {
    await this.assertMember(userId, partnerId, ['OWNER', 'MANAGER']);
    await this.assertOwnedProgram(partnerId, programId);
    await this.prisma.mortgageProgram.delete({ where: { id: programId } });
    return { ok: true };
  }

  // ─── Ochiq: tariflar ro'yxati ─────────────────────────────────────────────
  plans() {
    return PARTNER_PLAN_LIST;
  }
}
