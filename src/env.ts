import { z } from "zod";

/**
 * Валидация переменных окружения на старте сервера.
 * Импортируется везде, где нужен доступ к process.env — падает рано и понятно.
 */
const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL обязателен (см. .env.example)"),
  AUTH_SECRET: z.string().min(1, "AUTH_SECRET обязателен (см. .env.example)"),
  AUTH_GITHUB_ID: z.string().optional(),
  AUTH_GITHUB_SECRET: z.string().optional(),
  AUTH_GOOGLE_ID: z.string().optional(),
  AUTH_GOOGLE_SECRET: z.string().optional(),
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error(
    "❌ Некорректные переменные окружения:",
    z.treeifyError(parsed.error)
  );
  throw new Error("Некорректные переменные окружения — см. .env.example");
}

export const env = parsed.data;
