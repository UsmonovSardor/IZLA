/** Ko'p tillilik yordamchilari (backend).
 *  Baza `name` (uz) + ixtiyoriy `nameRu`/`nameEn` saqlaydi. Klient `?lang=` query
 *  yoki `Accept-Language` header yuboradi; biz mos nomni tanlaymiz (fallback: uz). */

export type Lang = 'uz' | 'ru' | 'en';
const SUPPORTED: Lang[] = ['uz', 'ru', 'en'];

/** query `lang` (ustuvor) yoki Accept-Language header'dan tilni aniqlaydi. */
export function resolveLang(query?: string, acceptLanguage?: string): Lang {
  const q = (query ?? '').toLowerCase().trim();
  if (SUPPORTED.includes(q as Lang)) return q as Lang;
  const al = (acceptLanguage ?? '').toLowerCase();
  // Masalan "ru-RU,ru;q=0.9,en;q=0.8" → birinchi qo'llab-quvvatlanadigan
  for (const part of al.split(',')) {
    const code = part.split(';')[0].trim().slice(0, 2);
    if (SUPPORTED.includes(code as Lang)) return code as Lang;
  }
  return 'uz';
}

type Localizable = { name: string; nameRu?: string | null; nameEn?: string | null };

/** Tilga mos nomni qaytaradi (bo'sh bo'lsa uz'ga qaytadi). */
export function localizedName<T extends Localizable>(row: T, lang: Lang): string {
  if (lang === 'ru') return row.nameRu || row.name;
  if (lang === 'en') return row.nameEn || row.name;
  return row.name;
}
