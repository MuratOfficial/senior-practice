"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { TOPICS, type Topic } from "@/features/questions/topics";
import { applySm2Rating } from "@/features/review/apply-rating";
import type { Sm2Quality } from "@/features/review/sm2";
import {
  DEFAULT_MOCK_COUNT,
  DEFAULT_MOCK_DURATION_MIN,
  MOCK_COUNTS,
  MOCK_DURATIONS_MIN,
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

  const questions = await prisma.question.findMany({
    where: { status: "published", topic: { in: topics } },
    select: { slug: true, topic: true, difficulty: true, title: true },
  });
  if (questions.length === 0) redirect("/mock");

  const items: MockItem[] = shuffle(questions)
    .slice(0, count)
    .map((q) => ({
      slug: q.slug,
      topic: q.topic as Topic,
      difficulty: q.difficulty,
      title: q.title,
      quality: null,
    }));
  const config: MockConfig = { topics, count: items.length, durationMin };

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

  const parsed = finishSchema.safeParse(input);
  if (!parsed.success) return { error: "Некорректный запрос" };
  const { id, ratings } = parsed.data;

  const row = await prisma.mockSession.findFirst({ where: { id, userId } });
  if (!row) return { error: "Сессия не найдена" };
  if (row.finishedAt) return { error: "Сессия уже завершена" };

  const qualityBySlug = new Map(ratings.map((r) => [r.slug, r.quality]));
  const items = (row.items as unknown as MockItem[]).map((item) => ({
    ...item,
    quality: qualityBySlug.get(item.slug) ?? null,
  }));
  const score = computeScore(items);

  for (const item of items) {
    if (item.quality !== null) {
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

  // Оценки попали в SM-2 — обновляем бейдж «к повторению» в layout
  revalidatePath("/", "layout");
  return { score };
}
