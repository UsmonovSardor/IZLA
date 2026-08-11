/** Ko'p tillilik konfiguratsiyasi (server + klient uchun umumiy — server-only import yo'q). */
export const locales = ['uz', 'ru', 'en'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'uz';

/** Til almashtirgichda ko'rsatiladigan nomlar. */
export const localeNames: Record<Locale, string> = {
  uz: "O'zbekcha",
  ru: 'Русский',
  en: 'English',
};
export const localeShort: Record<Locale, string> = { uz: 'UZ', ru: 'RU', en: 'EN' };
export const localeFlag: Record<Locale, string> = { uz: '🇺🇿', ru: '🇷🇺', en: '🇬🇧' };

/** Tanlangan til shu cookie'da saqlanadi (backend `getRequestConfig` o'qiydi). */
export const LOCALE_COOKIE = 'NEXT_LOCALE';

export function isLocale(v: unknown): v is Locale {
  return typeof v === 'string' && (locales as readonly string[]).includes(v);
}
