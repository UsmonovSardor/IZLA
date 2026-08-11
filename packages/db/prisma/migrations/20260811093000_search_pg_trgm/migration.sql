-- Faza 2: typo-tolerant (fuzzy) qidiruv uchun pg_trgm.
-- pg_trgm PG13+ da "trusted" extension — DB egasi superuser'siz ham yarata oladi.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Trigram GIN indekslar (similarity/word_similarity va ILIKE tezligi uchun).
CREATE INDEX IF NOT EXISTS "vendors_name_trgm_idx" ON "vendors" USING gin ("name" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "vendors_description_trgm_idx" ON "vendors" USING gin ("description" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "categories_name_trgm_idx" ON "categories" USING gin ("name" gin_trgm_ops);
