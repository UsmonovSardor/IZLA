# Izla.uz

> O'zbekiston №1 xizmatlar super-platformasi — barcha xizmatlar bitta ilovada.

Ko'p-vendorli (multi-vendor) super-app: qidiruv → xarita → bron → to'lov → eslatma → taksi → sharh.
Agentic AI yordamchi (Claude), ichki to'lov (escrow), coin sodiqlik tizimi, ko'chmas mulk vertikali,
va **Telegram Mini App**. TZ v2.0 asosida qurilgan.

## Monorepo tuzilishi

```
izla/
├── apps/
│   ├── api/        # NestJS backend (modular monolith)
│   └── web/        # Next.js 15 — sayt (PWA) + Telegram Mini App (/tg)
├── packages/
│   ├── db/         # Prisma schema, migratsiya, seed (Postgres + PostGIS + pgvector)
│   └── config/     # umumiy tsconfig
└── docker/         # Postgres(PostGIS+pgvector), Redis, Meilisearch
```

## Texnologiyalar
- **Frontend:** Next.js 15 (App Router), React 19, TypeScript, Tailwind, shadcn-style UI
- **Backend:** NestJS, TypeScript, Prisma
- **DB:** PostgreSQL 16 + PostGIS + pgvector
- **Kesh/Qidiruv:** Redis, Meilisearch
- **AI:** Claude API (tool use) + RAG (pgvector)
- **Telegram:** Bot API + Mini App (WebApp SDK, initData HMAC validatsiya)

## Ishga tushirish

```bash
# 1. Bog'liqliklar
pnpm install

# 2. Infratuzilma (Postgres+PostGIS+pgvector, Redis, Meilisearch)
pnpm infra:up

# 3. Env
cp .env.example .env   # kerakli qiymatlarni to'ldiring (TELEGRAM_BOT_TOKEN, ...)

# 4. Baza: migratsiya + seed
pnpm db:migrate
pnpm db:seed

# 5. Dev (api :4000, web :3000)
pnpm dev
```

- Sayt: http://localhost:3000
- Telegram Mini App: http://localhost:3000/tg
- API + Swagger: http://localhost:4000/docs

## Bosqichlar (Roadmap)
0. Poydevor (monorepo, DB, arxitektura) — **joriy**
1. MVP: auth, katalog, qidiruv+xarita, vendor sahifa, bron, sharh
2. To'lov + kabinetlar
3. AI yordamchi (Izla Assistant)
4. Coin + Taksi + Telegram bot
5. Ko'chmas mulk vertikali (RE-1..RE-4)

Batafsil: TZ hujjati (`Izla_uz_TZ_va_Arxitektura_TOLIQ.docx`).
