/**
 * Sentry init — main.ts'da ENG BIRINCHI import bo'lishi kerak.
 * SENTRY_DSN bo'sh bo'lsa hech narsa qilmaydi (no-op).
 */
import * as Sentry from '@sentry/node';

const dsn = process.env.SENTRY_DSN;
if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV ?? 'development',
    tracesSampleRate: process.env.SENTRY_TRACES_SAMPLE_RATE
      ? Number(process.env.SENTRY_TRACES_SAMPLE_RATE)
      : 0.1,
  });
}

export const sentryEnabled = Boolean(dsn);
