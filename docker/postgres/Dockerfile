FROM postgis/postgis:16-3.4
# pgvector'ni O'RNATAMIZ (yaratishni Prisma migratsiyasi bajaradi — postgresqlExtensions)
RUN apt-get update \
    && apt-get install -y --no-install-recommends postgresql-16-pgvector \
    && rm -rf /var/lib/apt/lists/*
