import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@izla/db';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateServiceDto, RegisterVendorDto, UpdateBookingStatusDto, UpdateServiceDto, UpdateVendorDto } from './dto';

// Toshkent markazi — onboarding'da default (keyin kabinetda xaritadan aniqlashtiriladi)
const TASHKENT = { lat: 41.311081, lng: 69.240562 };

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/['’ʻʼ`]/g, '')
    .normalize('NFKD')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 60) || 'biznes';
}

@Injectable()
export class KabinetService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Yangi biznes ro'yxatdan o'tkazish (onboarding). Vendor PENDING holatda —
   * moderatsiyadan keyin ACTIVE bo'ladi. Egasi (userId) ownerId, roli VENDOR'ga
   * ko'tariladi (agar USER bo'lsa). lat/lng Toshkent markazi default.
   */
  async register(userId: string, dto: RegisterVendorDto) {
    const category = await this.prisma.category.findUnique({ where: { id: dto.categoryId } });
    if (!category) throw new NotFoundException('Kategoriya topilmadi');

    // Noyob slug: nom + qisqa tasodifiy qo'shimcha (P2002 bo'lsa qayta urinish)
    const base = slugify(dto.name);
    let slug = `${base}-${Math.random().toString(36).slice(2, 6)}`;
    for (let i = 0; i < 4; i++) {
      const exists = await this.prisma.vendor.findUnique({ where: { slug }, select: { id: true } });
      if (!exists) break;
      slug = `${base}-${Math.random().toString(36).slice(2, 7)}`;
    }

    const vendor = await this.prisma.vendor.create({
      data: {
        ownerId: userId,
        categoryId: dto.categoryId,
        name: dto.name.trim(),
        slug,
        description: dto.description?.trim() || null,
        phone: dto.phone?.trim() || null,
        district: dto.district?.trim() || null,
        address: dto.address?.trim() || null,
        lat: TASHKENT.lat,
        lng: TASHKENT.lng,
        status: 'PENDING',
        hours: { mon_fri: '09:00-18:00' },
      },
    });

    // Foydalanuvchi rolini VENDOR'ga ko'tarish (faqat oddiy USER bo'lsa)
    await this.prisma.user.updateMany({
      where: { id: userId, role: 'USER' },
      data: { role: 'VENDOR' },
    });

    return { id: vendor.id, slug: vendor.slug, status: vendor.status };
  }

  /** Egalik tekshiruvi — vendor shu foydalanuvchiniki bo'lmasa 404/403. */
  private async ownedVendor(vendorId: string, userId: string) {
    const vendor = await this.prisma.vendor.findUnique({ where: { id: vendorId } });
    if (!vendor) throw new NotFoundException('Vendor topilmadi');
    if (vendor.ownerId !== userId) throw new ForbiddenException('Bu vendor sizga tegishli emas');
    return vendor;
  }

  /** Joriy foydalanuvchining barcha vendorlari (kabinet ro'yxati). */
  async myVendors(userId: string) {
    const vendors = await this.prisma.vendor.findMany({
      where: { ownerId: userId },
      orderBy: { createdAt: 'asc' },
      include: {
        category: { select: { slug: true, name: true, icon: true } },
        _count: { select: { services: true, bookings: true, reviews: true } },
      },
    });
    return vendors.map((v) => ({
      id: v.id,
      slug: v.slug,
      name: v.name,
      status: v.status,
      verified: v.verified,
      plan: v.plan,
      planExpiresAt: v.planExpiresAt,
      rating: v.rating,
      reviewCount: v.reviewCount,
      photos: v.photos,
      category: v.category,
      counts: v._count,
    }));
  }

  /** Bitta vendor to'liq (kabinet tahriri uchun). */
  async vendorDetail(vendorId: string, userId: string) {
    await this.ownedVendor(vendorId, userId);
    return this.prisma.vendor.findUnique({
      where: { id: vendorId },
      include: {
        category: { select: { slug: true, name: true, icon: true } },
        services: { orderBy: { createdAt: 'asc' } },
      },
    });
  }

  async updateVendor(vendorId: string, userId: string, dto: UpdateVendorDto) {
    await this.ownedVendor(vendorId, userId);
    const data: Prisma.VendorUpdateInput = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.phone !== undefined) data.phone = dto.phone;
    if (dto.address !== undefined) data.address = dto.address;
    if (dto.district !== undefined) data.district = dto.district;
    if (dto.hours !== undefined) data.hours = dto.hours as Prisma.InputJsonValue;
    if (dto.socials !== undefined) data.socials = dto.socials as Prisma.InputJsonValue;
    return this.prisma.vendor.update({ where: { id: vendorId }, data });
  }

  // ---------- Xizmatlar ----------

  async createService(vendorId: string, userId: string, dto: CreateServiceDto) {
    await this.ownedVendor(vendorId, userId);
    return this.prisma.service.create({
      data: {
        vendorId,
        name: dto.name,
        price: new Prisma.Decimal(dto.price),
        durationMin: dto.durationMin,
        active: dto.active ?? true,
      },
    });
  }

  private async ownedService(serviceId: string, userId: string) {
    const service = await this.prisma.service.findUnique({
      where: { id: serviceId },
      include: { vendor: { select: { ownerId: true } } },
    });
    if (!service) throw new NotFoundException('Xizmat topilmadi');
    if (service.vendor.ownerId !== userId) throw new ForbiddenException('Ruxsat yo‘q');
    return service;
  }

  async updateService(serviceId: string, userId: string, dto: UpdateServiceDto) {
    await this.ownedService(serviceId, userId);
    const data: Prisma.ServiceUpdateInput = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.price !== undefined) data.price = new Prisma.Decimal(dto.price);
    if (dto.durationMin !== undefined) data.durationMin = dto.durationMin;
    if (dto.active !== undefined) data.active = dto.active;
    return this.prisma.service.update({ where: { id: serviceId }, data });
  }

  async deleteService(serviceId: string, userId: string) {
    await this.ownedService(serviceId, userId);
    // Bronlar bog'langan bo'lishi mumkin → o'chirmasdan nofaol qilamiz (soft)
    return this.prisma.service.update({ where: { id: serviceId }, data: { active: false } });
  }

  // ---------- Bronlar ----------

  async vendorBookings(vendorId: string, userId: string) {
    await this.ownedVendor(vendorId, userId);
    return this.prisma.booking.findMany({
      where: { vendorId },
      orderBy: { slotStart: 'desc' },
      take: 100,
      include: {
        service: { select: { name: true, price: true, durationMin: true } },
        user: { select: { name: true, phone: true, avatarUrl: true } },
        staff: { select: { name: true } },
        payment: { select: { status: true, amount: true } },
      },
    });
  }

  async updateBookingStatus(bookingId: string, userId: string, dto: UpdateBookingStatusDto) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { vendor: { select: { ownerId: true } } },
    });
    if (!booking) throw new NotFoundException('Bron topilmadi');
    if (booking.vendor.ownerId !== userId) throw new ForbiddenException('Ruxsat yo‘q');
    return this.prisma.booking.update({
      where: { id: bookingId },
      data: { status: dto.status },
    });
  }

  // ---------- Statistika ----------

  async vendorStats(vendorId: string, userId: string) {
    const vendor = await this.ownedVendor(vendorId, userId);
    const [grouped, servicesCount, paidAgg] = await Promise.all([
      this.prisma.booking.groupBy({
        by: ['status'],
        where: { vendorId },
        _count: { _all: true },
      }),
      this.prisma.service.count({ where: { vendorId, active: true } }),
      this.prisma.payment.aggregate({
        where: { booking: { vendorId }, status: 'PAID' },
        _sum: { amount: true },
        _count: { _all: true },
      }),
    ]);
    const byStatus: Record<string, number> = {};
    let total = 0;
    for (const g of grouped) {
      byStatus[g.status] = g._count._all;
      total += g._count._all;
    }
    return {
      totalBookings: total,
      bookingsByStatus: byStatus,
      servicesCount,
      rating: vendor.rating,
      reviewCount: vendor.reviewCount,
      paidCount: paidAgg._count._all,
      revenue: paidAgg._sum.amount?.toString() ?? '0',
    };
  }

  /** Tarifni tanlash/yangilash. DEMO: darrov faollashadi (+30 kun). */
  async selectPlan(vendorId: string, userId: string, plan: string) {
    await this.ownedVendor(vendorId, userId);
    if (!['FREE', 'PRO', 'PREMIUM'].includes(plan)) throw new NotFoundException('Noma‘lum tarif');
    const now = new Date();
    const expires = plan === 'FREE' ? null : new Date(now.getTime() + 30 * 24 * 3600 * 1000);
    const updated = await this.prisma.vendor.update({
      where: { id: vendorId },
      data: { plan: plan as 'FREE' | 'PRO' | 'PREMIUM', planActivatedAt: plan === 'FREE' ? null : now, planExpiresAt: expires },
      select: { id: true, plan: true, planExpiresAt: true },
    });
    return updated;
  }

  /** Vendor daromadi + Izla komissiyasi (take-rate) — tarifga qarab. */
  async earnings(vendorId: string, userId: string) {
    const vendor = await this.ownedVendor(vendorId, userId);
    const { commissionRateFor, planConfig } = await import('../../common/plans');
    const rate = commissionRateFor(vendor.plan);

    const agg = await this.prisma.payment.aggregate({
      where: { booking: { vendorId }, status: 'PAID' },
      _sum: { amount: true, commissionAmount: true },
      _count: { _all: true },
    });
    const revenue = Number(agg._sum.amount ?? 0);
    // Eski to'lovlarda commissionAmount 0 bo'lishi mumkin → joriy stavka bilan hisoblab ko'rsatamiz
    const storedCommission = Number(agg._sum.commissionAmount ?? 0);
    const commission = storedCommission > 0 ? storedCommission : Math.round(revenue * rate);
    const net = revenue - commission;

    return {
      plan: vendor.plan,
      commissionRate: rate,
      paidCount: agg._count._all,
      revenue,
      commission,
      net,
      config: planConfig(vendor.plan),
    };
  }
}
