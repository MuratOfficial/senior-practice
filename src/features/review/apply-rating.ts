import "server-only";
import { prisma } from "@/lib/db/prisma";
import { SM2_INITIAL, nextDueAt, sm2, type Sm2Quality } from "./sm2";

/**
 * Применяет самооценку к SM-2-состоянию вопроса (upsert ReviewState).
 * Общая логика для оценки на странице вопроса и итогов mock-интервью.
 * Возвращает новый интервал в днях.
 */
export async function applySm2Rating(
  userId: string,
  questionSlug: string,
  quality: Sm2Quality
): Promise<number> {
  const where = { userId_questionSlug: { userId, questionSlug } };
  const existing = await prisma.reviewState.findUnique({ where });
  const next = sm2(existing ?? SM2_INITIAL, quality);
  const dueAt = nextDueAt(next.interval);

  await prisma.reviewState.upsert({
    where,
    update: { ...next, dueAt },
    create: { userId, questionSlug, ...next, dueAt },
  });

  return next.interval;
}
