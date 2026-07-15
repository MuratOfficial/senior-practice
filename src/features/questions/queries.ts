import "server-only";
import { cache } from "react";
import { prisma } from "@/lib/db/prisma";
import type { Prisma } from "@/generated/prisma/client";
import {
  DIFFICULTIES,
  TOPICS,
  type Difficulty,
  type Topic,
} from "./topics";

export interface QuestionListItem {
  id: string;
  slug: string;
  topic: Topic;
  difficulty: Difficulty;
  title: string;
  tags: string[];
}

export interface QuestionDetail extends QuestionListItem {
  body: string;
  answer: string;
  followUps: string[];
  references: { title: string; url: string }[];
}

export interface QuestionFilters {
  topic?: string;
  difficulty?: string;
  tag?: string;
  q?: string;
  page?: number;
}

export const QUESTIONS_PAGE_SIZE = 20;

export async function listQuestions(filters: QuestionFilters) {
  const where: Prisma.QuestionWhereInput = { status: "published" };
  if (filters.topic && (TOPICS as readonly string[]).includes(filters.topic)) {
    where.topic = filters.topic;
  }
  if (
    filters.difficulty &&
    (DIFFICULTIES as readonly string[]).includes(filters.difficulty)
  ) {
    where.difficulty = filters.difficulty as Difficulty;
  }
  const tag = filters.tag?.trim();
  if (tag) {
    where.tags = { has: tag };
  }
  const q = filters.q?.trim();
  if (q) {
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { body: { contains: q, mode: "insensitive" } },
    ];
  }

  const page = Math.max(1, filters.page ?? 1);
  const [docs, total] = await Promise.all([
    prisma.question.findMany({
      where,
      // difficulty — Postgres-enum, сортируется по порядку объявления (senior последним → desc даёт senior первым)
      orderBy: [{ topic: "asc" }, { difficulty: "desc" }, { title: "asc" }],
      skip: (page - 1) * QUESTIONS_PAGE_SIZE,
      take: QUESTIONS_PAGE_SIZE,
      select: {
        id: true,
        slug: true,
        topic: true,
        difficulty: true,
        title: true,
        tags: true,
      },
    }),
    prisma.question.count({ where }),
  ]);

  const items: QuestionListItem[] = docs.map((doc) => ({
    ...doc,
    topic: doc.topic as Topic,
  }));

  return { items, total, page, pageSize: QUESTIONS_PAGE_SIZE };
}

/**
 * Обёрнуто в React cache: generateMetadata и страница зовут её в одном рендере —
 * запрос к БД выполняется один раз.
 */
export const getQuestionBySlug = cache(
  async (slug: string): Promise<QuestionDetail | null> => {
    const doc = await prisma.question.findFirst({
      where: { slug, status: "published" },
    });
    if (!doc) return null;

    return {
      id: doc.id,
      slug: doc.slug,
      topic: doc.topic as Topic,
      difficulty: doc.difficulty,
      title: doc.title,
      tags: doc.tags,
      body: doc.body,
      answer: doc.answer,
      followUps: doc.followUps,
      references: (doc.references as { title: string; url: string }[]) ?? [],
    };
  }
);

/** Закладки пользователя на вопросы, свежие первыми (join с контентом по slug). */
export async function listBookmarkedQuestions(
  userId: string
): Promise<QuestionListItem[]> {
  const bookmarks = await prisma.bookmark.findMany({
    where: { userId, itemType: "QUESTION" },
    orderBy: { createdAt: "desc" },
    select: { itemSlug: true },
  });
  if (bookmarks.length === 0) return [];

  const questions = await prisma.question.findMany({
    where: {
      slug: { in: bookmarks.map((b) => b.itemSlug) },
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
  const bySlug = new Map(
    questions.map((q) => [q.slug, { ...q, topic: q.topic as Topic }])
  );

  return bookmarks
    .map((b) => bySlug.get(b.itemSlug))
    .filter((q): q is QuestionListItem => q !== undefined);
}

export async function countQuestionsByTopic() {
  const rows = await prisma.question.groupBy({
    by: ["topic"],
    where: { status: "published" },
    _count: { _all: true },
  });
  return new Map(rows.map((r) => [r.topic, r._count._all]));
}
