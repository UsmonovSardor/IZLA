# Izla.uz — Production runbook

Platforma **arxitekturasi production-tayyor** (CSP enforcing, helmet, rate-limit,
strukturaviy log, Sentry-ready, 94 DB indeks, SEO/PWA). Jonli ishga tushirish uchun
qolgani — **real kalitlar** va **operatsion sozlash**. Barcha integratsiya kaliti
bo'lmasa **no-op / demo / log** rejimida ishlaydi (crash bo'lmaydi).

Railway env qo'shish: `railway variables --service <api|web> --set KEY=VALUE`
(yoki Railway dashboard → Variables).

---

## 🔴 P0 — Jonli pul/foydalanuvchi uchun SHART

### 1. SMS OTP — Eskiz.uz (foydalanuvchi telefon orqali kira olishi uchun)
Kalitsiz: OTP faqat server logida ko'rinadi → **real foydalanuvchi kira olmaydi**.
| Var (api) | Qiymat | Qayerdan |
|---|---|---|
| `ESKIZ_EMAIL` | Eskiz kabinet email | eskiz.uz shartnoma |
| `ESKIZ_PASSWORD` | Eskiz API parol | eskiz.uz kabinet |
| `ESKIZ_FROM` | Tasdiqlangan alfa-nom (masalan `4546` yoki `Izla`) | Eskiz moderatsiya |

**SMS shablon** Eskiz'da tasdiqlanishi shart (masalan: `Izla.uz tasdiqlash kodi: {code}`).
Tekshirish: `/auth/otp/request` → foydalanuvchi telefoniga real SMS keladi.

### 2. To'lov — Payme + Click (real pul yig'ish + obuna/hamyon)
Kalitsiz: to'lov demo (`checkAuth=false`, provider o'chiq).
| Var (api) | Izoh |
|---|---|
| `PAYME_MERCHANT_ID`, `PAYME_MERCHANT_KEY` | Payme merchant kabinet (Paycom) |
| `PAYME_CHECKOUT_URL` | `https://checkout.paycom.uz` |
| `CLICK_SERVICE_ID`, `CLICK_MERCHANT_ID`, `CLICK_SECRET_KEY` | Click merchant kabinet |
| `CLICK_CHECKOUT_URL` | `https://my.click.uz/services/pay` |

**Webhook URL'lar** provayder kabinetiga kiritiladi:
- Payme: `https://<api-domen>/payments/payme`
- Click Prepare: `https://<api-domen>/payments/click/prepare`
- Click Complete: `https://<api-domen>/payments/click/complete`

Webhook `markInvoicePaid` (obuna) va bron to'lovini tasdiqlaydi. Tekshirish:
sandbox to'lov → `orders.state`/policy ACTIVE + bron CONFIRMED.

> **Qolgan ish (feature):** homiy CPL hamyonini **real** to'ldirish hozir `topUpDemo`.
> Real Payme/Click orqali top-up uchun webhook'ni `PartnerBilling.topUp`'ga ulash kerak
> (subscription invoice naqshi tayyor — shuni takrorlash). Kalit kelgach qo'shiladi.

### 3. Xato monitoring — Sentry (prod'da ko'r bo'lmaslik uchun)
Kalitsiz: xatolar faqat log'da (agregatsiya/alert yo'q).
| Var (api) | Izoh |
|---|---|
| `SENTRY_DSN` | sentry.io loyiha DSN |
| `SENTRY_TRACES_SAMPLE_RATE` | `0.1` (10% trace) |

Kod tayyor (`instrument.ts` + `AllExceptionsFilter` → `Sentry.captureException`).
Tekshirish: ataylab 500 → Sentry'da event.

### 4. Custom domen + SSL
Hozir `*.up.railway.app`. Railway → Settings → Domains → `izla.uz` (web),
`api.izla.uz` (api). DNS CNAME. SSL Railway avtomatik (Let's Encrypt).
So'ng yangilash: `CORS_ORIGIN`, `WEB_URL`, `PUBLIC_API_URL`, `NEXT_PUBLIC_API_URL`,
`GOOGLE_REDIRECT_URI`, sitemap/robots domenlari.

### 5. DB backup
Railway Postgres → **avtomatik backup yoqilganini tasdiqlash** (Plugin → Backups).
Oyiga bir marta **restore drill** (test tiklash). `SEED_RESET=0` (allaqachon) — katalog
restartda o'chmaydi.

---

## 🟠 P1 — Ishonchlilik & tezlik

- **Avto-deploy**: `.github/workflows/deploy.yml` (RAILWAY_TOKEN secret kerak — pastga qarang).
- **Staging**: Railway'da 2-muhit (`staging`) — prod'ga tegmay test.
- **Uptime monitoring**: BetterStack/UptimeRobot → `https://<api>/health` (30s), alert Telegram/email.
- **CDN**: Cloudflare (web oldida) — statik/rasm kesh, TTFB uzoq mintaqalarda tez.
- **Rasm**: Cloudflare Images yoki pre-optimize (next/image Railway compute'da qimmat).
- **DB pool**: yuqori yuk uchun PgBouncer + `?connection_limit=` sozlash.
- **Rate-limit**: auth/payment uchun alohida (hozir global 120/60s).
- **E2E**: Playwright (auth/to'lov/bron/CPL); **load**: k6.

---

## 🟢 Boshqa production env (allaqachon kerak/o'rnatilgan)

| Var | Izoh |
|---|---|
| `DATABASE_URL` | Railway avtomatik |
| `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` | **kuchli tasodifiy** (prod safety guard tekshiradi) |
| `COOKIE_SECURE=true`, `PUBLIC_API_URL`, `WEB_URL`, `CORS_ORIGIN` | cross-site cookie/CORS |
| `TELEGRAM_BOT_TOKEN` | Mini App + login + bildirishnoma (o'rnatilgan) |
| `GROQ_API_KEY` | AI yordamchi (o'rnatilgan) |
| `GOOGLE_CLIENT_ID/SECRET/REDIRECT_URI` | Google login (ixtiyoriy) |
| `SEED_RESET=0` | katalog xavfsizligi |

---

## Deploy (hozir)

Qo'lda: `railway up --service api --ci` va `railway up --service web --ci`.
Sxema o'zgarsa API avtomatik `migrate deploy` + seed (Dockerfile CMD).
Backboard timeout bo'lsa 2-4 marta qayta urinish (server tomonda navbatga tushadi;
`railway status` bilan kuzatish).
