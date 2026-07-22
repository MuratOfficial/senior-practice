-- Триграммный поиск: extension нужен до создания GIN-индексов с gin_trgm_ops.
-- Не управляется Prisma-схемой (datasource.extensions — preview), поэтому создаём вручную.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- CreateIndex
CREATE INDEX "Question_title_idx" ON "Question" USING GIN ("title" gin_trgm_ops);

-- CreateIndex
CREATE INDEX "Question_body_idx" ON "Question" USING GIN ("body" gin_trgm_ops);
