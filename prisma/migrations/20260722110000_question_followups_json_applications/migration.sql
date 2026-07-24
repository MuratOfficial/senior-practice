-- followUps: text[] -> jsonb (массив объектов [{ q, a }]).
-- Данные пересоздаются из markdown через `npm run seed`, поэтому пересоздаём колонку.
ALTER TABLE "Question" DROP COLUMN "followUps";
ALTER TABLE "Question" ADD COLUMN "followUps" JSONB NOT NULL DEFAULT '[]';

-- applications: новый блок «Где применяется».
ALTER TABLE "Question" ADD COLUMN "applications" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
