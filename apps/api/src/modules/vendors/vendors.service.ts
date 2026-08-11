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
  verified?: boolean;
  minRating?: number;
  priceMin?: number;
  priceMax?: number;
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
    const lang: Lang = query.lang ?? 'uz';
    const take = query.take ?? 50;

    // ── Matnli qidiruv → intellektual (full-text + ko'p-maydon + ranking) ──
    if (query.q && query.q.trim()) {
      const ids = await this.searchIds(query, take);
      if (ids.length === 0) return [];
      const vendors = await this.prisma.vendor.findMany({
        where: { id: { in: ids } },
        include: { category: { select: CATEGORY_SELECT } },
      });
      // Relevantlik tartibini (raw natija) saqlab qolamiz
      const rank = new Map(ids.map((id, i) => [id, i]));
      vendors.sort((a, b) => (rank.get(a.id) ?? 0) - (rank.get(b.id) ?? 0));
      return this.shape(vendors, query, lang);
    }

    // ── Oddiy ko'rish → Prisma filtrlar + saralash ──
    const where: Prisma.VendorWhereInput = { status: 'ACTIVE' };
    if (query.category) where.category = { slug: query.category };
    if (query.district) where.district = query.district;
    if (query.verified) where.verified = true;
    if (query.minRating != null) where.rating = { gte: query.minRating };
    if (query.priceMin != null || query.priceMax != null) {
      where.services = {
        some: {
          active: true,
          price: {
            ...(query.priceMin != null ? { gte: query.priceMin } : {}),
            ...(query.priceMax != null ? { lte: query.priceMax } : {}),
          },
        },
      };
    }

    const vendors = await this.prisma.vendor.findMany({
      where,
      take,
      include: { category: { select: CATEGORY_SELECT } },
      orderBy: query.sort === 'rating' ? { rating: 'desc' } : { createdAt: 'desc' },
    });
    return this.shape(vendors, query, lang);
  }

  /** Lokalizatsiya + masofa hisoblash + (kerak bo'lsa) masofa bo'yicha saralash. */
  private shape<
    T extends { lat: number; lng: number; category: { name: string; nameRu?: string | null; nameEn?: string | null } | null },
  >(vendors: T[], query: VendorQuery, lang: Lang) {
    let result = vendors.map((v) =>
      localizeCategory(
        {
          ...v,
          distanceKm:
            query.lat != null && query.lng != null ? haversineKm(query.lat, query.lng, v.lat, v.lng) : null,
        },
        lang,
      ),
    );
    if (query.sort === 'distance' && query.lat != null && query.lng != null) {
      result = result.sort((a, b) => (a.distanceKm ?? 1e9) - (b.distanceKm ?? 1e9));
    }
    return result;
  }

  /**
   * Intellektual qidiruv — Postgres full-text (tsvector/websearch_to_tsquery) + ko'p-maydon
   * (nom, tavsif, tuman, kategoriya uz/ru/en, xizmatlar nomi) + ILIKE recall + ranking (ts_rank + rating).
   * Relevantlik bo'yicha tartiblangan vendor id'larini qaytaradi. pg_trgm SHART EMAS (core FTS).
   */
  private async searchIds(query: VendorQuery, take: number): Promise<string[]> {
    const term = query.q!.trim();
    const like = `%${term}%`;

    const conds: Prisma.Sql[] = [Prisma.sql`v.status = 'ACTIVE'`];
    if (query.category) conds.push(Prisma.sql`c.slug = ${query.category}`);
    if (query.district) conds.push(Prisma.sql`v.district = ${query.district}`);
    if (query.verified) conds.push(Prisma.sql`v.verified = true`);
    if (query.minRating != null) conds.push(Prisma.sql`v.rating >= ${query.minRating}`);
    if (query.priceMin != null) conds.push(Prisma.sql`svc.min_price >= ${query.priceMin}`);
    if (query.priceMax != null) conds.push(Prisma.sql`svc.max_price <= ${query.priceMax}`);
    const where = Prisma.join(conds, ' AND ');

    const rows = await this.prisma.$queryRaw<Array<{ id: string }>>(Prisma.sql`
      WITH svc AS (
        SELECT "vendorId",
               string_agg(name, ' ') AS service_names,
               MIN(price) AS min_price,
               MAX(price) AS max_price
        FROM services WHERE active = true GROUP BY "vendorId"
      ),
      scored AS (
        SELECT v.id,
          (coalesce(v.name, '') || ' ' || coalesce(v.description, '') || ' ' || coalesce(v.district, '') || ' ' ||
           coalesce(c.name, '') || ' ' || coalesce(c."nameRu", '') || ' ' || coalesce(c."nameEn", '') || ' ' ||
           coalesce(svc.service_names, '')) AS doc,
          v.name AS vname,
          v.rating AS rating
        FROM vendors v
        JOIN categories c ON c.id = v."categoryId"
        LEFT JOIN svc ON svc."vendorId" = v.id
        WHERE ${where}
      )
      SELECT id FROM scored
      WHERE to_tsvector('simple', doc) @@ websearch_to_tsquery('simple', ${term})
         OR doc ILIKE ${like}
      ORDER BY (
        ts_rank(to_tsvector('simple', doc), websearch_to_tsquery('simple', ${term})) * 4
        + (CASE WHEN vname ILIKE ${like} THEN 2 ELSE 0 END)
        + rating / 5.0
      ) DESC
      LIMIT ${take}
    `);
    return rows.map((r) => r.id);
  }

  /** Autocomplete — yozayotganda vendor takliflari (prefiks urg'u + reyting). */
  async suggest(term: string, lang: Lang = 'uz', take = 6) {
    const t = term.trim();
    if (t.length < 2) return [];
    const like = `%${t}%`;
    const prefix = `${t}%`;

    const rows = await this.prisma.$queryRaw<
      Array<{ id: string; slug: string; name: string; categoryName: string; categoryNameRu: string | null; categoryNameEn: string | null; icon: string | null }>
    >(Prisma.sql`
      SELECT v.id, v.slug, v.name,
             c.name AS "categoryName", c."nameRu" AS "categoryNameRu", c."nameEn" AS "categoryNameEn", c.icon AS icon
      FROM vendors v
      JOIN categories c ON c.id = v."categoryId"
      WHERE v.status = 'ACTIVE'
        AND (
          v.name ILIKE ${like}
          OR c.name ILIKE ${like}
          OR to_tsvector('simple', coalesce(v.name, '') || ' ' || coalesce(v.description, '')) @@ websearch_to_tsquery('simple', ${t})
        )
      ORDER BY (
        (CASE WHEN v.name ILIKE ${prefix} THEN 3 WHEN v.name ILIKE ${like} THEN 2 ELSE 0 END)
        + v.rating / 5.0
      ) DESC
      LIMIT ${take}
    `);

    return rows.map((r) => ({
      id: r.id,
      slug: r.slug,
      name: r.name,
      icon: r.icon ?? undefined,
      category: localizedName({ name: r.categoryName, nameRu: r.categoryNameRu, nameEn: r.categoryNameEn }, lang),
    }));
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
