import "server-only";
import { cache } from "react";
import { prisma } from "@/lib/db/prisma";
import { Prisma } from "@/generated/prisma/client";
import {
  DIFFICULTIES,
  TOPICS,
  type Difficulty,
  type Topic,
} from "./topics";

/**
 * Порог word_similarity для fuzzy-поиска. word_similarity(q, title) меряет, насколько
 * запрос похож на лучшее слово/участок заголовка — в отличие от similarity() не штрафует
 * за длину заголовка. 0.4 ловит опечатки (напр. «замыкане» → «Замыкания» ≈ 0.78), отсекая шум.
 */
const TRGM_WORD_SIMILARITY_THRESHOLD = 0.4;

export interface QuestionListItem {
  id: string;
  slug: string;
  topic: Topic;
  difficulty: Difficulty;
  title: string;
  tags: string[];
}

export interface FollowUp {
  q: string;
  a: string | null;
}

export interface QuestionDetail extends QuestionListItem {
  body: string;
  answer: string;
  followUps: FollowUp[];
  applications: string[];
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
  const topic =
    filters.topic && (TOPICS as readonly string[]).includes(filters.topic)
      ? filters.topic
      : undefined;
  const difficulty =
    filters.difficulty &&
    (DIFFICULTIES as readonly string[]).includes(filters.difficulty)
      ? (filters.difficulty as Difficulty)
      : undefined;
  const tag = filters.tag?.trim() || undefined;
  const q = filters.q?.trim() || undefined;
  const page = Math.max(1, filters.page ?? 1);

  // Полнотекстовый поиск — отдельный путь: триграммное ранжирование по релевантности
  // (ускорено GIN-индексами pg_trgm), терпит опечатки в заголовке. Без q — обычный Prisma.
  if (q) {
    return searchQuestions({ q, topic, difficulty, tag, page });
  }

  const where: Prisma.QuestionWhereInput = { status: "published" };
  if (topic) where.topic = topic;
  if (difficulty) where.difficulty = difficulty;
  if (tag) where.tags = { has: tag };

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
 * Поиск по каталогу через pg_trgm. Совпадение — подстрока (ILIKE) в заголовке/теле
 * ИЛИ триграммное сходство заголовка выше порога (терпит опечатки). Ранжирование:
 * сначала точные вхождения в заголовок, затем по similarity заголовка, потом тело.
 */
async function searchQuestions(params: {
  q: string;
  topic?: string;
  difficulty?: Difficulty;
  tag?: string;
  page: number;
}) {
  const { q, topic, difficulty, tag, page } = params;
  const like = `%${q}%`;

  const conditions: Prisma.Sql[] = [Prisma.sql`status = 'published'`];
  if (topic) conditions.push(Prisma.sql`topic = ${topic}`);
  if (difficulty)
    conditions.push(Prisma.sql`difficulty = ${difficulty}::"Difficulty"`);
  if (tag) conditions.push(Prisma.sql`${tag} = ANY(tags)`);
  conditions.push(
    Prisma.sql`(title ILIKE ${like} OR body ILIKE ${like} OR word_similarity(${q}, title) > ${TRGM_WORD_SIMILARITY_THRESHOLD})`
  );
  const whereSql = Prisma.join(conditions, " AND ");

  const offset = (page - 1) * QUESTIONS_PAGE_SIZE;
  const [rows, countRows] = await Promise.all([
    prisma.$queryRaw<
      {
        id: string;
        slug: string;
        topic: string;
        difficulty: Difficulty;
        title: string;
        tags: string[];
      }[]
    >`
      SELECT id, slug, topic, difficulty, title, tags
      FROM "Question"
      WHERE ${whereSql}
      ORDER BY
        (title ILIKE ${like}) DESC,
        word_similarity(${q}, title) DESC,
        title ASC
      LIMIT ${QUESTIONS_PAGE_SIZE} OFFSET ${offset}
    `,
    prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*) AS count FROM "Question" WHERE ${whereSql}
    `,
  ]);

  const items: QuestionListItem[] = rows.map((row) => ({
    ...row,
    topic: row.topic as Topic,
  }));
  const total = Number(countRows[0]?.count ?? 0);

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
      followUps: (doc.followUps as unknown as FollowUp[]) ?? [],
      applications: doc.applications,
      references: (doc.references as { title: string; url: string }[]) ?? [],
    };
  }
);

/** Полные вопросы по набору slug'ов (для mock-сессии); порядок — как в slugs. */
export async function listQuestionsBySlugs(
  slugs: string[]
): Promise<QuestionDetail[]> {
  if (slugs.length === 0) return [];
  const docs = await prisma.question.findMany({
    where: { slug: { in: slugs }, status: "published" },
  });
  const bySlug = new Map(docs.map((doc) => [doc.slug, doc]));
  return slugs.flatMap((slug) => {
    const doc = bySlug.get(slug);
    if (!doc) return [];
    return [
      {
        id: doc.id,
        slug: doc.slug,
        topic: doc.topic as Topic,
        difficulty: doc.difficulty,
        title: doc.title,
        tags: doc.tags,
        body: doc.body,
        answer: doc.answer,
        followUps: (doc.followUps as unknown as FollowUp[]) ?? [],
        applications: doc.applications,
        references: (doc.references as { title: string; url: string }[]) ?? [],
      },
    ];
  });
}

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
