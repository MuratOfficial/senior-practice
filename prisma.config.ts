import { defineConfig } from "prisma/config";

// Prisma CLI не читает .env самостоятельно начиная с v7.
// На Vercel файла .env нет — переменные приходят из окружения, поэтому отсутствие файла не ошибка.
try {
  process.loadEnvFile();
} catch {
  // .env отсутствует (CI/Vercel) — используем process.env как есть
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Для миграций нужен прямой (non-pooled) коннект: на Neon это DATABASE_URL_UNPOOLED,
    // рантайм приложения ходит через пул (DATABASE_URL).
    url: process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL!,
  },
});
