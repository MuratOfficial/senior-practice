import { prisma } from "@/lib/db/prisma";

export const RATE_LIMIT_ERROR = "Слишком много запросов — попробуйте позже";

// Окна живут секунды; строку старше часа можно удалять. Чистим лениво и редко,
// чтобы не добавлять запись в каждый запрос (таблица иначе растёт бесконечно).
const CLEANUP_PROBABILITY = 0.02;
const STALE_AFTER_MS = 60 * 60 * 1000;

async function maybeCleanup(): Promise<void> {
  if (Math.random() >= CLEANUP_PROBABILITY) return;
  try {
    await prisma.rateLimit.deleteMany({
      where: { windowStart: { lt: new Date(Date.now() - STALE_AFTER_MS) } },
    });
  } catch {
    // чистка не критична — молча игнорируем сбой
  }
}

/**
 * Fixed-window rate limit в Postgres (работает и на serverless-инстансах
 * Vercel, где память не разделяется). Не идеально атомарен — параллельные
 * запросы на границе окна могут проскочить, для тренажёра этого достаточно.
 *
 * @returns true — запрос разрешён; false — лимит исчерпан
 */
export async function checkRateLimit(
  userId: string,
  action: string,
  { limit, windowSec }: { limit: number; windowSec: number }
): Promise<boolean> {
  void maybeCleanup();

  const key = `${action}:${userId}`;
  const now = new Date();
  const windowStartMin = new Date(now.getTime() - windowSec * 1000);

  const existing = await prisma.rateLimit.findUnique({ where: { key } });

  if (!existing || existing.windowStart < windowStartMin) {
    // Новое окно (или первого запроса ещё не было)
    await prisma.rateLimit.upsert({
      where: { key },
      update: { windowStart: now, count: 1 },
      create: { key, windowStart: now, count: 1 },
    });
    return true;
  }

  const updated = await prisma.rateLimit.update({
    where: { key },
    data: { count: { increment: 1 } },
  });
  return updated.count <= limit;
}
