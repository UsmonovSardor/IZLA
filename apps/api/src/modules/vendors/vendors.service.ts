import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@izla/db';
import { PrismaService } from '../../prisma/prisma.service';

export interface VendorQuery {
  category?: string;
  district?: string;
  q?: string;
  lat?: number;
  lng?: number;
  sort?: 'rating' | 'distance' | 'popular';
  take?: number;
}

function haversineKm(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6371;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((aLat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return +(R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s))).toFixed(2);
}

@Injectable()
export class VendorsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: VendorQuery) {
    const where: Prisma.VendorWhereInput = { status: 'ACTIVE' };
    if (query.category) where.category = { slug: query.category };
    if (query.district) where.district = query.district;
    if (query.q) where.name = { contains: query.q, mode: 'insensitive' };

    const vendors = await this.prisma.vendor.findMany({
      where,
      take: query.take ?? 50,
      include: { category: { select: { slug: true, name: true, icon: true } } },
      orderBy: query.sort === 'rating' ? { rating: 'desc' } : { createdAt: 'desc' },
    });

    let result = vendors.map((v) => ({
      ...v,
      distanceKm:
        query.lat != null && query.lng != null
          ? haversineKm(query.lat, query.lng, v.lat, v.lng)
          : null,
    }));

    if (query.sort === 'distance' && query.lat != null && query.lng != null) {
      result = result.sort((a, b) => (a.distanceKm ?? 1e9) - (b.distanceKm ?? 1e9));
    }
    return result;
  }

  async detail(slug: string) {
    const vendor = await this.prisma.vendor.findUnique({
      where: { slug },
      include: {
        category: { select: { slug: true, name: true, icon: true } },
        services: { where: { active: true }, orderBy: { price: 'asc' } },
        staff: true,
        reviews: {
          where: { status: 'PUBLISHED' },
          take: 20,
          orderBy: { createdAt: 'desc' },
          include: { user: { select: { name: true, avatarUrl: true } } },
        },
      },
    });
    if (!vendor) throw new NotFoundException('Vendor topilmadi');
    return vendor;
  }
}
