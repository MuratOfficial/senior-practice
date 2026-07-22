"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { checkRateLimit, RATE_LIMIT_ERROR } from "@/lib/rate-limit";
import { isStaleUserError, STALE_SESSION_ERROR } from "@/lib/errors";
import { TOPICS, type Topic } from "@/features/questions/topics";
import { applySm2Rating } from "@/features/review/apply-rating";
import type { Sm2Quality } from "@/features/review/sm2";
import {
  DEFAULT_MOCK_CHALLENGES,
  DEFAULT_MOCK_COUNT,
  DEFAULT_MOCK_DURATION_MIN,
  MOCK_CHALLENGE_COUNTS,
  MOCK_COUNTS,
  MOCK_DURATIONS_MIN,
  normalizeMockItem,
  type MockConfig,
  type MockItem,
} from "./config";
import { computeScore } from "./score";

function shuffle<T>(input: T[]): T[] {
  const arr = [...input];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** Создаёт mock-сессию из формы конфигуратора и открывает её. */
export async function createMockSession(formData: FormData): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");
  // Лимит превышен — молча возвращаем на конфигуратор (форма без состояния ошибки)
  if (
    !(await checkRateLimit(session.user.id, "create-mock", {
      limit: 6,
      windowSec: 60,
    }))
  ) {
    redirect("/mock");
  }

  const selected = formData
    .getAll("topics")
    .map(String)
    .filter((t): t is Topic => (TOPICS as readonly string[]).includes(t));
  const topics = selected.length > 0 ? selected : [...TOPICS];

  const countRaw = Number(formData.get("count"));
  const count = (MOCK_COUNTS as readonly number[]).includes(countRaw)
    ? countRaw
    : DEFAULT_MOCK_COUNT;

  const durationRaw = Number(formData.get("duration"));
  const durationMin = (MOCK_DURATIONS_MIN as readonly number[]).includes(
    durationRaw
  )
    ? durationRaw
    : DEFAULT_MOCK_DURATION_MIN;

  const challengesRaw = Number(formData.get("challenges"));
  const challengeCount = (MOCK_CHALLENGE_COUNTS as readonly number[]).includes(
    challengesRaw
  )
    ? challengesRaw
    : DEFAULT_MOCK_CHALLENGES;

  const [questions, challenges] = await Promise.all([
    prisma.question.findMany({
      where: { status: "published", topic: { in: topics } },
      select: { slug: true, topic: true, difficulty: true, title: true },
    }),
    challengeCount > 0
      ? prisma.challenge.findMany({
          where: { status: "published" },
          select: { slug: true, category: true, difficulty: true, title: true },
        })
      : [],
  ]);
  if (questions.length === 0) redirect("/mock");

  // Вопросы — в начале, coding-задачи — в конце, как на реальном интервью
  const items: MockItem[] = [
    ...shuffle(questions)
      .slice(0, count)
      .map(
        (q): MockItem => ({
          itemType: "question",
          slug: q.slug,
          topic: q.topic,
          difficulty: q.difficulty,
          title: q.title,
          quality: null,
        })
      ),
    ...shuffle(challenges)
      .slice(0, challengeCount)
      .map(
        (c): MockItem => ({
          itemType: "challenge",
          slug: c.slug,
          topic: c.category,
          difficulty: c.difficulty,
          title: c.title,
          quality: null,
        })
      ),
  ];
  const config: MockConfig = {
    topics,
    count: items.filter((i) => i.itemType === "question").length,
    challengeCount: items.filter((i) => i.itemType === "challenge").length,
    durationMin,
  };

  const created = await prisma.mockSession.create({
    data: {
      userId: session.user.id,
      config: JSON.parse(JSON.stringify(config)),
      items: JSON.parse(JSON.stringify(items)),
    },
    select: { id: true },
  });

  redirect(`/mock/${created.id}`);
}

const finishSchema = z.object({
  id: z.string().min(1),
  ratings: z
    .array(
      z.object({
        slug: z.string().min(1),
        quality: z.number().int().min(0).max(5).nullable(),
      })
    )
    .max(50),
});

type FinishResult = { score: number | null } | { error: string };

/**
 * Завершает сессию: фиксирует самооценки, считает балл и прогоняет
 * оценённые вопросы через SM-2 — mock-интервью пополняет очередь повторения.
 */
export async function finishMockSession(input: {
  id: string;
  ratings: { slug: string; quality: number | null }[];
}): Promise<FinishResult> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Не авторизован" };
  const userId = session.user.id;
  if (
    !(await checkRateLimit(userId, "finish-mock", { limit: 12, windowSec: 60 }))
  ) {
    return { error: RATE_LIMIT_ERROR };
  }

  const parsed = finishSchema.safeParse(input);
  if (!parsed.success) return { error: "Некорректный запрос" };
  const { id, ratings } = parsed.data;

  const row = await prisma.mockSession.findFirst({ where: { id, userId } });
  if (!row) return { error: "Сессия не найдена" };
  if (row.finishedAt) return { error: "Сессия уже завершена" };

  const qualityBySlug = new Map(ratings.map((r) => [r.slug, r.quality]));
  const items = (row.items as unknown as MockItem[]).map((raw) => {
    const item = normalizeMockItem(raw);
    return { ...item, quality: qualityBySlug.get(item.slug) ?? null };
  });
  const score = computeScore(items);

  try {
    // В SM-2 уходят только вопросы: у задач прогресс отслеживается сабмишенами
    for (const item of items) {
      if (item.itemType === "question" && item.quality !== null) {
        await applySm2Rating(userId, item.slug, item.quality as Sm2Quality);
      }
    }

    await prisma.mockSession.update({
      where: { id },
      data: {
        items: JSON.parse(JSON.stringify(items)),
        score,
        finishedAt: new Date(),
      },
    });
  } catch (error) {
    if (isStaleUserError(error)) return { error: STALE_SESSION_ERROR };
    throw error;
  }

  // Оценки попали в SM-2 — точечно обновляем страницы с этими данными
  revalidatePath("/review");
  revalidatePath("/dashboard");
  revalidatePath(`/mock/${id}`);
  revalidatePath("/mock");
  return { score };
}
