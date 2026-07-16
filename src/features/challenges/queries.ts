import "server-only";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import {
  challengeLanguageSchema,
  type ChallengeLanguageDef,
} from "./content-schema";
import {
  CHALLENGE_CATEGORIES,
  CHALLENGE_DIFFICULTIES,
  type ChallengeCategory,
  type ChallengeDifficultyId,
} from "./categories";

const languagesJsonSchema = z.array(challengeLanguageSchema);

export interface ChallengeListItem {
  slug: string;
  category: ChallengeCategory;
  difficulty: ChallengeDifficultyId;
  title: string;
  tags: string[];
  languageIds: string[];
  /** null — не пробовал; PASSED/FAILED — лучший результат пользователя */
  userStatus: "PASSED" | "FAILED" | null;
}

export interface ChallengeFilters {
  category?: string;
  difficulty?: string;
}

export async function listChallenges(
  filters: ChallengeFilters,
  userId: string
): Promise<ChallengeListItem[]> {
  const where: Record<string, unknown> = { status: "published" };
  if (
    filters.category &&
    (CHALLENGE_CATEGORIES as readonly string[]).includes(filters.category)
  ) {
    where.category = filters.category;
  }
  if (
    filters.difficulty &&
    (CHALLENGE_DIFFICULTIES as readonly string[]).includes(filters.difficulty)
  ) {
    where.difficulty = filters.difficulty;
  }

  const [challenges, submissions] = await Promise.all([
    prisma.challenge.findMany({
      where,
      orderBy: [{ category: "asc" }, { difficulty: "asc" }, { title: "asc" }],
      select: {
        slug: true,
        category: true,
        difficulty: true,
        title: true,
        tags: true,
        languages: true,
      },
    }),
    prisma.submission.groupBy({
      by: ["challengeSlug"],
      where: { userId, status: "PASSED" },
    }),
    // FAILED учитываем отдельно ниже — один groupBy не даёт "лучший" статус
  ]);

  const attempted = await prisma.submission.groupBy({
    by: ["challengeSlug"],
    where: { userId },
  });
  const passedSlugs = new Set(submissions.map((s) => s.challengeSlug));
  const attemptedSlugs = new Set(attempted.map((s) => s.challengeSlug));

  return challenges.map((c) => {
    const languages = languagesJsonSchema.safeParse(c.languages);
    return {
      slug: c.slug,
      category: c.category as ChallengeCategory,
      difficulty: c.difficulty as ChallengeDifficultyId,
      title: c.title,
      tags: c.tags,
      languageIds: languages.success ? languages.data.map((l) => l.id) : [],
      userStatus: passedSlugs.has(c.slug)
        ? "PASSED"
        : attemptedSlugs.has(c.slug)
          ? "FAILED"
          : null,
    };
  });
}

export interface ChallengeDetail {
  slug: string;
  category: ChallengeCategory;
  difficulty: ChallengeDifficultyId;
  title: string;
  tags: string[];
  statement: string;
  hints: string[];
  /** Для клиента-раннера: без эталонных решений */
  languages: Omit<ChallengeLanguageDef, "solution">[];
  /** Разбор и решения открываются после первой сдачи */
  unlocked: boolean;
  explanation: string | null;
  solutions: { id: string; code: string }[] | null;
  solved: boolean;
}

export async function getChallengeBySlug(
  slug: string,
  userId: string
): Promise<ChallengeDetail | null> {
  const challenge = await prisma.challenge.findFirst({
    where: { slug, status: "published" },
  });
  if (!challenge) return null;

  const languages = languagesJsonSchema.parse(challenge.languages);

  const [attempts, passed] = await Promise.all([
    prisma.submission.count({ where: { userId, challengeSlug: slug } }),
    prisma.submission.count({
      where: { userId, challengeSlug: slug, status: "PASSED" },
    }),
  ]);
  const unlocked = attempts > 0;

  return {
    slug: challenge.slug,
    category: challenge.category as ChallengeCategory,
    difficulty: challenge.difficulty as ChallengeDifficultyId,
    title: challenge.title,
    tags: challenge.tags,
    statement: challenge.statement,
    hints: challenge.hints,
    languages: languages.map(({ id, starter, tests }) => ({
      id,
      starter,
      tests,
    })),
    unlocked,
    explanation: unlocked ? challenge.explanation : null,
    solutions: unlocked
      ? languages.map(({ id, solution }) => ({ id, code: solution }))
      : null,
    solved: passed > 0,
  };
}

/** Число тестов по языкам — для серверной проверки totalTests при сдаче */
export async function getChallengeTestCounts(
  slug: string
): Promise<Map<string, number> | null> {
  const challenge = await prisma.challenge.findFirst({
    where: { slug, status: "published" },
    select: { languages: true },
  });
  if (!challenge) return null;
  const languages = languagesJsonSchema.parse(challenge.languages);
  return new Map(languages.map((l) => [l.id, l.tests.length]));
}
