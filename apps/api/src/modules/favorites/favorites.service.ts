import { Injectable } from '@nestjs/common';
import { Prisma } from '@izla/db';
import { PrismaService } from '../../prisma/prisma.service';
import { localizedName, type Lang } from '../../common/i18n';

const CATEGORY_SELECT = { slug: true, name: true, nameRu: true, nameEn: true, icon: true } as const;

@Injectable()
export class FavoritesService {
  constructor(private readonly prisma: PrismaService) {}

  /** Vendorni sevimlilarga qo'shish/olib tashlash (toggle). */
  async toggleVendor(userId: string, vendorId: string): Promise<{ favorited: boolean }> {
    const existing = await this.prisma.favorite.findFirst({ where: { userId, vendorId } });
    if (existing) {
      await this.prisma.favorite.delete({ where: { id: existing.id } });
      return { favorited: false };
    }
    try {
      await this.prisma.favorite.create({ data: { userId, vendorId } });
    } catch (e) {
      // Poyga: bir vaqtda ikki marta bosilsa — allaqachon bor deb hisoblaymiz
      if (!(e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002')) throw e;
    }
    return { favorited: true };
  }

  /** Sevimli vendor id'lari (kartochkalarda yurak holati uchun). */
  async vendorIds(userId: string): Promise<string[]> {
    const favs = await this.prisma.favorite.findMany({
      where: { userId, vendorId: { not: null } },
      select: { vendorId: true },
    });
    return favs.map((f) => f.vendorId!).filter(Boolean);
  }

  /** To'liq sevimlilar ro'yxati (vendor + kategoriya, lokalizatsiya). */
  async list(userId: string, lang: Lang = 'uz') {
    const favs = await this.prisma.favorite.findMany({
      where: { userId, vendorId: { not: null } },
      orderBy: { createdAt: 'desc' },
      select: { vendorId: true },
    });
    const ids = favs.map((f) => f.vendorId!);
    if (ids.length === 0) return [];

    const vendors = await this.prisma.vendor.findMany({
      where: { id: { in: ids }, status: 'ACTIVE' },
      include: { category: { select: CATEGORY_SELECT } },
    });
    // Saqlangan tartibni saqlaymiz (eng yangi birinchi)
    const rank = new Map(ids.map((id, i) => [id, i]));
    vendors.sort((a, b) => (rank.get(a.id) ?? 0) - (rank.get(b.id) ?? 0));

    return vendors.map((v) => {
      const cat = v.category
        ? { slug: v.category.slug, name: localizedName(v.category, lang), icon: v.category.icon ?? undefined }
        : undefined;
      return {
        id: v.id, slug: v.slug, name: v.name, description: v.description,
        district: v.district, lat: v.lat, lng: v.lng, address: v.address, phone: v.phone,
        rating: v.rating, reviewCount: v.reviewCount, photos: v.photos, verified: v.verified,
        category: cat,
      };
    });
  }
}
