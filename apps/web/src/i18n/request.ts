import { getRequestConfig } from 'next-intl/server';
import { cookies } from 'next/headers';
import { LOCALE_COOKIE, defaultLocale, isLocale, type Locale } from './config';

/** Har so'rovda cookie'dan tilni o'qib, mos xabarlar to'plamini yuklaydi. */
export default getRequestConfig(async () => {
  const store = await cookies();
  const cookieLocale = store.get(LOCALE_COOKIE)?.value;
  const locale: Locale = isLocale(cookieLocale) ? cookieLocale : defaultLocale;

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
