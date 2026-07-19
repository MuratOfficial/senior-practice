import { prisma } from "@/lib/db/prisma";

export const RATE_LIMIT_ERROR = "Слишком много запросов — попробуйте позже";

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
