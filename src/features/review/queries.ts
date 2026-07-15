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

export async function countDueQuestions(userId: string): Promise<number> {
  return prisma.reviewState.count({
    where: { userId, dueAt: { lte: new Date() } },
  });
}

export async function countTrackedQuestions(userId: string): Promise<number> {
  return prisma.reviewState.count({ where: { userId } });
}
