"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { applySm2Rating } from "./apply-rating";
import type { Sm2Quality } from "./sm2";

const rateQuestionSchema = z.object({
  slug: z.string().min(1),
  quality: z.number().int().min(0).max(5),
});

type RateQuestionResult = { interval: number } | { error: string };

/** Самооценка ответа на вопрос: пересчитывает SM-2 и планирует следующее повторение. */
export async function rateQuestion(input: {
  slug: string;
  quality: number;
}): Promise<RateQuestionResult> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Не авторизован" };

  const parsed = rateQuestionSchema.safeParse(input);
  if (!parsed.success) return { error: "Некорректный запрос" };

  const { slug } = parsed.data;
  const quality = parsed.data.quality as Sm2Quality;
  const userId = session.user.id;

  const question = await prisma.question.findFirst({
    where: { slug, status: "published" },
    select: { slug: true },
  });
  if (!question) return { error: "Вопрос не найден" };

  const interval = await applySm2Rating(userId, slug, quality);

  // Обновляем и очередь повторения, и бейдж в сайдбаре (живёт в layout)
  revalidatePath("/", "layout");
  return { interval };
}
