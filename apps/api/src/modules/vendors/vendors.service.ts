import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@izla/db';
import { PrismaService } from '../../prisma/prisma.service';
import { localizedName, type Lang } from '../../common/i18n';
import { isOpenNow, tashkentNow } from '../bookings/slots';

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
  openNow?: boolean;
  radiusKm?: number;
}

/**
 * Radius uchun tez Prisma pre-filtri — lat/lng bo'yicha bounding box (to'rtburchak).
 * Aniq radius (doira) JS haversine bilan keyin qirqiladi; bu faqat nomzodlarni toraytiradi.
 */
function bboxWhere(lat: number, lng: number, radiusKm: number): Prisma.VendorWhereInput {
  const latDelta = radiusKm / 111.0; // 1° kenglik ≈ 111 km
  const cosLat = Math.max(Math.cos((lat * Math.PI) / 180), 0.01);
  const lngDelta = radiusKm / (111.0 * cosLat);
  return {
    lat: { gte: lat - latDelta, lte: lat + latDelta },
    lng: { gte: lng - lngDelta, lte: lng + lngDelta },
  };
}

/** Vendordan (`v.lat`/`v.lng`) berilgan nuqtagacha masofa (km) — haversine, PostGIS'siz sof SQL. */
function haversineSqlKm(lat: number, lng: number): Prisma.Sql {
  return Prisma.sql`(6371 * 2 * asin(sqrt(
    power(sin(radians((v.lat - ${lat}) / 2)), 2) +
    cos(radians(${lat})) * cos(radians(v.lat)) * power(sin(radians((v.lng - ${lng}) / 2)), 2)
  )))`;
}

/**
 * Vendor `hours` JSON dan berilgan kun kaliti (mon_fri/sat/sun) uchun "hozir ochiq"
 * SQL sharti. Format `"HH:MM-HH:MM"` (bo'shliqlarga bardoshli); noto'g'ri/`off`/bo'sh → false.
 * `::int` cast xatosidan saqlanish uchun avval regex CASE-guard qilinadi.
 */
function openNowSql(dayKey: string, nowMin: number): Prisma.Sql {
  const val = Prisma.sql`btrim(v.hours->>${dayKey})`;
  const openMin = Prisma.sql`(split_part(btrim(split_part(${val}, '-', 1)), ':', 1)::int * 60 + split_part(btrim(split_part(${val}, '-', 1)), ':', 2)::int)`;
  const closeMin = Prisma.sql`(split_part(btrim(split_part(${val}, '-', 2)), ':', 1)::int * 60 + split_part(btrim(split_part(${val}, '-', 2)), ':', 2)::int)`;
  return Prisma.sql`CASE WHEN ${val} ~ '^[0-9]{1,2}:[0-9]{2}[[:space:]]*-[[:space:]]*[0-9]{1,2}:[0-9]{2}$' THEN ${nowMin} >= ${openMin} AND ${nowMin} < ${closeMin} ELSE false END`;
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

    // Radius: bounding-box tez pre-filtri (aniq doira JS haversine bilan quyida qirqiladi).
    const hasGeo = query.radiusKm != null && query.lat != null && query.lng != null;
    if (hasGeo) Object.assign(where, bboxWhere(query.lat!, query.lng!, query.radiusKm!));

    // "Hozir ochiq" (JSON `hours`) va radius (aniq masofa) JS'da baholanadi — kesilishdan
    // oldin kerakli soni qolishi uchun mos kelmaydiganlarni hisobga olib ko'proq olamiz.
    const needsPostFilter = query.openNow || hasGeo;
    const vendors = await this.prisma.vendor.findMany({
      where,
      take: needsPostFilter ? Math.max(take * 5, 200) : take,
      include: { category: { select: CATEGORY_SELECT } },
      orderBy: query.sort === 'rating' ? { rating: 'desc' } : { createdAt: 'desc' },
    });

    // shape() masofani hisoblaydi va sort (masofa/reyting) qo'llaydi.
    let result = this.shape(vendors, query, lang);
    if (query.openNow) result = result.filter((v) => isOpenNow(v.hours));
    if (hasGeo) {
      const r = query.radiusKm!;
      result = result.filter((v) => v.distanceKm != null && v.distanceKm <= r);
    }
    return needsPostFilter ? result.slice(0, take) : result;
  }

  /** Lokalizatsiya + masofa hisoblash + (kerak bo'lsa) saralash (masofa/reyting). */
  private shape<
    T extends { lat: number; lng: number; rating: number; category: { name: string; nameRu?: string | null; nameEn?: string | null } | null },
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
    } else if (query.sort === 'rating') {
      result = result.sort((a, b) => b.rating - a.rating);
    }
    return result;
  }

  /**
   * Intellektual qidiruv — Postgres full-text (tsvector/websearch_to_tsquery) + ko'p-maydon
   * (nom, tavsif, tuman, kategoriya uz/ru/en, xizmatlar nomi) + pg_trgm typo-tolerantlik
   * (similarity/word_similarity) + ILIKE recall + ranking. Relevantlik bo'yicha tartiblangan id'lar.
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
    if (query.openNow) {
      const { dayKey, minute } = tashkentNow();
      conds.push(openNowSql(dayKey, minute));
    }
    if (query.radiusKm != null && query.lat != null && query.lng != null) {
      conds.push(Prisma.sql`${haversineSqlKm(query.lat, query.lng)} <= ${query.radiusKm}`);
    }
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
         OR word_similarity(${term}, doc) > 0.4
      ORDER BY (
        ts_rank(to_tsvector('simple', doc), websearch_to_tsquery('simple', ${term})) * 4
        + similarity(vname, ${term}) * 3
        + word_similarity(${term}, doc) * 2
        + (CASE WHEN vname ILIKE ${like} THEN 1.5 ELSE 0 END)
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
          OR word_similarity(${t}, v.name) > 0.4
          OR word_similarity(${t}, c.name) > 0.4
          OR to_tsvector('simple', coalesce(v.name, '') || ' ' || coalesce(v.description, '')) @@ websearch_to_tsquery('simple', ${t})
        )
      ORDER BY (
        (CASE WHEN v.name ILIKE ${prefix} THEN 3 WHEN v.name ILIKE ${like} THEN 2 ELSE 0 END)
        + similarity(v.name, ${t}) * 2
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

  /**
   * Facets — joriy so'rov+filtrlar (KATEGORIYADAN tashqari) bo'yicha kategoriya sanoqlari.
   * Foydalanuvchi kategoriyalar orasida almashtira olishi uchun kategoriya filtri hisobga olinmaydi.
   */
  async facets(query: VendorQuery) {
    const lang: Lang = query.lang ?? 'uz';
    const term = query.q?.trim();
    const like = term ? `%${term}%` : '';

    const conds: Prisma.Sql[] = [Prisma.sql`v.status = 'ACTIVE'`];
    if (query.district) conds.push(Prisma.sql`v.district = ${query.district}`);
    if (query.verified) conds.push(Prisma.sql`v.verified = true`);
    if (query.minRating != null) conds.push(Prisma.sql`v.rating >= ${query.minRating}`);
    if (query.priceMin != null) conds.push(Prisma.sql`svc.min_price >= ${query.priceMin}`);
    if (query.priceMax != null) conds.push(Prisma.sql`svc.max_price <= ${query.priceMax}`);
    if (query.openNow) {
      const { dayKey, minute } = tashkentNow();
      conds.push(openNowSql(dayKey, minute));
    }
    if (query.radiusKm != null && query.lat != null && query.lng != null) {
      conds.push(Prisma.sql`${haversineSqlKm(query.lat, query.lng)} <= ${query.radiusKm}`);
    }
    const where = Prisma.join(conds, ' AND ');

    const textMatch = term
      ? Prisma.sql`(to_tsvector('simple', doc) @@ websearch_to_tsquery('simple', ${term}) OR doc ILIKE ${like} OR word_similarity(${term}, doc) > 0.4)`
      : Prisma.sql`TRUE`;

    const rows = await this.prisma.$queryRaw<
      Array<{ slug: string; name: string; nameRu: string | null; nameEn: string | null; icon: string | null; count: number }>
    >(Prisma.sql`
      WITH svc AS (
        SELECT "vendorId", string_agg(name, ' ') AS service_names, MIN(price) AS min_price, MAX(price) AS max_price
        FROM services WHERE active = true GROUP BY "vendorId"
      ),
      docs AS (
        SELECT v.id, v."categoryId",
          (coalesce(v.name, '') || ' ' || coalesce(v.description, '') || ' ' || coalesce(v.district, '') || ' ' ||
           coalesce(c.name, '') || ' ' || coalesce(c."nameRu", '') || ' ' || coalesce(c."nameEn", '') || ' ' ||
           coalesce(svc.service_names, '')) AS doc
        FROM vendors v
        JOIN categories c ON c.id = v."categoryId"
        LEFT JOIN svc ON svc."vendorId" = v.id
        WHERE ${where}
      ),
      matched AS ( SELECT id, "categoryId" FROM docs WHERE ${textMatch} )
      SELECT c.slug, c.name, c."nameRu" AS "nameRu", c."nameEn" AS "nameEn", c.icon, COUNT(m.id)::int AS count
      FROM categories c
      JOIN matched m ON m."categoryId" = c.id
      GROUP BY c.id, c.slug, c.name, c."nameRu", c."nameEn", c.icon, c."sortOrder"
      ORDER BY count DESC, c."sortOrder" ASC
    `);

    const categories = rows.map((r) => ({
      slug: r.slug,
      name: localizedName({ name: r.name, nameRu: r.nameRu, nameEn: r.nameEn }, lang),
      icon: r.icon ?? undefined,
      count: Number(r.count),
    }));
    return { total: categories.reduce((s, c) => s + c.count, 0), categories };
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
