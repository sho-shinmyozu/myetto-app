-- pg_trgm 拡張を有効化（LIKE '%q%' の GIN インデックスに必要）
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- GenericFood: nameJa / nameKana の GIN trigram インデックス
CREATE INDEX "GenericFood_nameJa_trgm_idx"   ON "GenericFood" USING GIN ("nameJa"   gin_trgm_ops);
CREATE INDEX "GenericFood_nameKana_trgm_idx" ON "GenericFood" USING GIN ("nameKana" gin_trgm_ops);

-- BrandedFood: name / nameKana の GIN trigram インデックス
CREATE INDEX "BrandedFood_name_trgm_idx"     ON "BrandedFood" USING GIN ("name"     gin_trgm_ops);
CREATE INDEX "BrandedFood_nameKana_trgm_idx" ON "BrandedFood" USING GIN ("nameKana" gin_trgm_ops);
