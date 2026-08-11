import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@izla/db';
import { PrismaService } from '../../prisma/prisma.service';
import { localizedName, type Lang } from '../../common/i18n';

export interface VendorQuery {
  category?: string;
  district?: string;
  q?: string;
  lat?: number;
  lng?: number;
  sort?: 'rating' | 'distance' | 'popular';
  take?: number;
  lang?: Lang;
}

/** Include qilingan kategoriya nomini tanlangan tilga o'girib, Ru/En maydonlarni tashlaydi. */
function localizeCategory<T extends { category: { name: string; nameRu?: string | null; nameEn?: string | null } | null }>(
  row: T,
  lang: Lang,
): T {
  if (row.category) {
    const { nameRu, nameEn, ...rest } = row.category;
    (row as { category: unknown }).category = { ...rest, name: localizedName({ name: rest.name, nameRu, nameEn }, lang) };
  }
  return row;
}

const CATEGORY_SELECT = { slug: true, name: true, nameRu: true, nameEn: true, icon: true } as const;

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
      include: { category: { select: CATEGORY_SELECT } },
      orderBy: query.sort === 'rating' ? { rating: 'desc' } : { createdAt: 'desc' },
    });

    const lang: Lang = query.lang ?? 'uz';
    let result = vendors.map((v) =>
      localizeCategory(
        {
          ...v,
          distanceKm:
            query.lat != null && query.lng != null
              ? haversineKm(query.lat, query.lng, v.lat, v.lng)
              : null,
        },
        lang,
      ),
    );

    if (query.sort === 'distance' && query.lat != null && query.lng != null) {
      result = result.sort((a, b) => (a.distanceKm ?? 1e9) - (b.distanceKm ?? 1e9));
    }
    return result;
  }

  async detail(slug: string, lang: Lang = 'uz') {
    const vendor = await this.prisma.vendor.findUnique({
      where: { slug },
      include: {
        category: { select: CATEGORY_SELECT },
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
    return localizeCategory(vendor, lang);
  }
}
