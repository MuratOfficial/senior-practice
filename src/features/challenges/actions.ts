"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { checkRateLimit, RATE_LIMIT_ERROR } from "@/lib/rate-limit";
import { isStaleUserError, STALE_SESSION_ERROR } from "@/lib/errors";
import { getChallengeTestCounts } from "./queries";

const submitSchema = z.object({
  slug: z.string().min(1),
  language: z.enum(["javascript", "python"]),
  code: z.string().min(1).max(50_000),
  passedTests: z.number().int().min(0),
  totalTests: z.number().int().min(1),
  durationMs: z.number().int().min(0).nullable(),
  hadError: z.boolean(),
});

type SubmitResult =
  | { status: "PASSED" | "FAILED" | "ERROR" }
  | { error: string };

/**
 * Фиксирует сдачу задачи. Тесты выполняются в браузере (см. ARCHITECTURE.md):
 * результату клиента доверяем — это тренажёр, не соревнование. Сервер
 * проверяет только согласованность totalTests с определением задачи.
 */
export async function submitChallenge(input: {
  slug: string;
  language: "javascript" | "python";
  code: string;
  passedTests: number;
  totalTests: number;
  durationMs: number | null;
  hadError: boolean;
}): Promise<SubmitResult> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Не авторизован" };
  if (
    !(await checkRateLimit(session.user.id, "submit-challenge", {
      limit: 20,
      windowSec: 60,
    }))
  ) {
    return { error: RATE_LIMIT_ERROR };
  }

  const parsed = submitSchema.safeParse(input);
  if (!parsed.success) return { error: "Некорректный запрос" };
  const { slug, language, code, passedTests, totalTests, durationMs, hadError } =
    parsed.data;

  const testCounts = await getChallengeTestCounts(slug);
  const expected = testCounts?.get(language);
  if (!expected) return { error: "Задача не найдена" };
  if (totalTests !== expected || passedTests > totalTests) {
    return { error: "Результат не соответствует определению задачи" };
  }

  const status = hadError
    ? "ERROR"
    : passedTests === totalTests
      ? "PASSED"
      : "FAILED";

  try {
    await prisma.submission.create({
      data: {
        userId: session.user.id,
        challengeSlug: slug,
        language,
        code,
        status,
        passedTests,
        totalTests,
        durationMs,
      },
    });
  } catch (error) {
    if (isStaleUserError(error)) return { error: STALE_SESSION_ERROR };
    throw error;
  }

  revalidatePath("/challenges");
  revalidatePath(`/challenges/${slug}`);
  return { status };
}
