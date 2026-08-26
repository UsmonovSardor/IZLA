import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@izla/db';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateServiceDto, UpdateBookingStatusDto, UpdateServiceDto, UpdateVendorDto } from './dto';

@Injectable()
export class KabinetService {
  constructor(private readonly prisma: PrismaService) {}

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
}
