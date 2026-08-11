import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.string().default('development'),
  API_PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string(),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
  JWT_ACCESS_SECRET: z.string().default('dev-access'),
  JWT_REFRESH_SECRET: z.string().default('dev-refresh'),
  JWT_ACCESS_TTL: z.string().default('15m'),
  JWT_REFRESH_TTL: z.string().default('30d'),
  TELEGRAM_BOT_TOKEN: z.string().optional().default(''),

  // Web (redirect return_url uchun). CORS_ORIGIN'ning birinchi qiymatiga fallback.
  WEB_URL: z.string().optional().default(''),
  // Ommaviy API URL (Google OAuth redirect, Telegram webhook default).
  PUBLIC_API_URL: z.string().optional().default(''),
  // Prod'da cookie SameSite=None;Secure kerak (cross-site). Dev'da Lax.
  COOKIE_SECURE: z.coerce.boolean().optional().default(false),

  // --- Google OAuth — bo'sh bo'lsa Google kirish o'chiq ---
  GOOGLE_CLIENT_ID: z.string().optional().default(''),
  GOOGLE_CLIENT_SECRET: z.string().optional().default(''),
  GOOGLE_REDIRECT_URI: z.string().optional().default(''),

  // --- SMS (Eskiz) — bo'sh bo'lsa SMS o'chiq (log rejimi) ---
  ESKIZ_EMAIL: z.string().optional().default(''),
  ESKIZ_PASSWORD: z.string().optional().default(''),
  ESKIZ_FROM: z.string().default('4546'),
  ESKIZ_BASE: z.string().default('https://notify.eskiz.uz/api'),

  // --- Payme (Paycom) Merchant API ---
  PAYME_MERCHANT_ID: z.string().optional().default(''),
  // Endpoint Basic-auth kaliti (test yoki prod). Bo'sh bo'lsa Payme callback'lari o'chiq.
  PAYME_MERCHANT_KEY: z.string().optional().default(''),
  PAYME_CHECKOUT_URL: z.string().default('https://checkout.paycom.uz'),

  // --- Click Merchant (SHOP) API ---
  CLICK_SERVICE_ID: z.string().optional().default(''),
  CLICK_MERCHANT_ID: z.string().optional().default(''),
  CLICK_SECRET_KEY: z.string().optional().default(''),
  CLICK_CHECKOUT_URL: z.string().default('https://my.click.uz/services/pay'),

  // AI Izla Assistant (Claude) — kalitsiz o'chiq
  ANTHROPIC_API_KEY: z.string().optional().default(''),
  ASSISTANT_MODEL: z.string().default('claude-opus-5'),
});

export const env = schema.parse(process.env);
export type Env = z.infer<typeof schema>;
