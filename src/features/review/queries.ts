import "server-only";
import { prisma } from "@/lib/db/prisma";
import type { QuestionListItem } from "@/features/questions/queries";
import type { Topic } from "@/features/questions/topics";

export interface DueQuestion extends QuestionListItem {
  dueAt: Date;
  repetition: number;
}

/** Очередь повторения: вопросы с dueAt <= now, самые просроченные первыми. */
export async function listDueQuestions(userId: string): Promise<DueQuestion[]> {
  const states = await prisma.reviewState.findMany({
    where: { userId, dueAt: { lte: new Date() } },
    orderBy: { dueAt: "asc" },
    select: { questionSlug: true, dueAt: true, repetition: true },
  });
  if (states.length === 0) return [];

  const questions = await prisma.question.findMany({
    where: {
      slug: { in: states.map((s) => s.questionSlug) },
      status: "published",
    },
    select: {
      id: true,
      slug: true,
      topic: true,
      difficulty: true,
      title: true,
      tags: true,
    },
  });
  const bySlug = new Map(questions.map((q) => [q.slug, q]));

  return states.flatMap((s) => {
    const q = bySlug.get(s.questionSlug);
    if (!q) return [];
    return [
      {
        ...q,
        topic: q.topic as Topic,
        dueAt: s.dueAt,
        repetition: s.repetition,
      },
    ];
  });
}

/**
 * Счёт только по существующим published-вопросам: ReviewState ссылается на slug
 * без FK, и после prune в сиде могут оставаться осиротевшие записи — иначе
 * бейдж показывал бы N, а очередь была бы пустой.
 */
async function countExistingQuestions(
  states: { questionSlug: string }[]
): Promise<number> {
  if (states.length === 0) return 0;
  return prisma.question.count({
    where: {
      slug: { in: states.map((s) => s.questionSlug) },
      status: "published",
    },
  });
}

/** SRS-статусы для набора вопросов (бейджи в каталоге): due — пора повторить. */
export async function getReviewBadges(
  userId: string,
  slugs: string[]
): Promise<Map<string, "due" | "scheduled">> {
  if (slugs.length === 0) return new Map();
  const states = await prisma.reviewState.findMany({
    where: { userId, questionSlug: { in: slugs } },
    select: { questionSlug: true, dueAt: true },
  });
  const now = new Date();
  return new Map(
    states.map((s) => [s.questionSlug, s.dueAt <= now ? "due" : "scheduled"])
  );
}

export async function countDueQuestions(userId: string): Promise<number> {
  const states = await prisma.reviewState.findMany({
    where: { userId, dueAt: { lte: new Date() } },
    select: { questionSlug: true },
  });
  return countExistingQuestions(states);
}

export async function countTrackedQuestions(userId: string): Promise<number> {
  const states = await prisma.reviewState.findMany({
    where: { userId },
    select: { questionSlug: true },
  });
  return countExistingQuestions(states);
}
