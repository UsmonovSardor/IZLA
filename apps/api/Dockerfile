# Izla API — NestJS (pnpm monorepo). Build context: repo root.
FROM node:20-slim AS base
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
RUN corepack enable
WORKDIR /app

FROM base AS build
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @izla/db generate
RUN pnpm --filter @izla/db build
RUN pnpm --filter @izla/api build

FROM base AS runtime
ENV NODE_ENV=production
COPY --from=build /app /app
WORKDIR /app
EXPOSE 4000
# Har deploy'da migratsiyani qo'llaymiz, so'ng serverni ishga tushiramiz
CMD ["sh", "-c", "pnpm --filter @izla/db exec prisma migrate deploy && node apps/api/dist/main.js"]
