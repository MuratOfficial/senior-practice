import "server-only";
import { prisma } from "@/lib/db/prisma";
import type { PathSection } from "./content-schema";

export interface PathSummary {
  slug: string;
  title: string;
  description: string;
  total: number;
  done: number;
}

export interface PathItemDetail {
  type: "question" | "challenge";
  slug: string;
  title: string;
  href: string;
  done: boolean;
}

export interface PathSectionDetail {
  title: string;
  items: PathItemDetail[];
}

export interface PathDetail {
  slug: string;
  title: string;
  description: string;
  total: number;
  done: number;
  sections: PathSectionDetail[];
}

/**
 * Прогресс по треку выводится из существующих данных, отдельного стейта нет:
 * вопрос «изучен», если по нему есть ReviewState (хоть раз оценён);
 * задача «решена», если есть PASSED-сабмишен.
 */
async function loadProgress(
  userId: string,
  questionSlugs: string[],
  challengeSlugs: string[]
): Promise<{ ratedQuestions: Set<string>; solvedChallenges: Set<string> }> {
  const [reviewStates, passed] = await Promise.all([
    questionSlugs.length > 0
      ? prisma.reviewState.findMany({
          where: { userId, questionSlug: { in: questionSlugs } },
          select: { questionSlug: true },
        })
      : [],
    challengeSlugs.length > 0
      ? prisma.submission.findMany({
          where: {
            userId,
            status: "PASSED",
            challengeSlug: { in: challengeSlugs },
          },
          select: { challengeSlug: true },
          distinct: ["challengeSlug"],
        })
      : [],
  ]);
  return {
    ratedQuestions: new Set(reviewStates.map((r) => r.questionSlug)),
    solvedChallenges: new Set(passed.map((s) => s.challengeSlug)),
  };
}

function collectSlugs(sections: PathSection[]) {
  const questionSlugs: string[] = [];
  const challengeSlugs: string[] = [];
  for (const section of sections) {
    for (const item of section.items) {
      (item.type === "question" ? questionSlugs : challengeSlugs).push(
        item.slug
      );
    }
  }
  return { questionSlugs, challengeSlugs };
}

export async function listLearningPaths(
  userId: string
): Promise<PathSummary[]> {
  const rows = await prisma.learningPath.findMany({
    where: { status: "published" },
    orderBy: { title: "asc" },
  });
  if (rows.length === 0) return [];

  const all = rows.map((row) => ({
    row,
    ...collectSlugs(row.sections as unknown as PathSection[]),
  }));
  const { ratedQuestions, solvedChallenges } = await loadProgress(
    userId,
    all.flatMap((p) => p.questionSlugs),
    all.flatMap((p) => p.challengeSlugs)
  );

  return all.map(({ row, questionSlugs, challengeSlugs }) => ({
    slug: row.slug,
    title: row.title,
    description: row.description,
    total: questionSlugs.length + challengeSlugs.length,
    done:
      questionSlugs.filter((s) => ratedQuestions.has(s)).length +
      challengeSlugs.filter((s) => solvedChallenges.has(s)).length,
  }));
}

export async function getLearningPath(
  userId: string,
  slug: string
): Promise<PathDetail | null> {
  const row = await prisma.learningPath.findFirst({
    where: { slug, status: "published" },
  });
  if (!row) return null;

  const sections = row.sections as unknown as PathSection[];
  const { questionSlugs, challengeSlugs } = collectSlugs(sections);

  const [questions, challenges, progress] = await Promise.all([
    questionSlugs.length > 0
      ? prisma.question.findMany({
          where: { slug: { in: questionSlugs }, status: "published" },
          select: { slug: true, title: true },
        })
      : [],
    challengeSlugs.length > 0
      ? prisma.challenge.findMany({
          where: { slug: { in: challengeSlugs }, status: "published" },
          select: { slug: true, title: true },
        })
      : [],
    loadProgress(userId, questionSlugs, challengeSlugs),
  ]);
  const questionTitles = new Map(questions.map((q) => [q.slug, q.title]));
  const challengeTitles = new Map(challenges.map((c) => [c.slug, c.title]));

  const sectionDetails: PathSectionDetail[] = sections.map((section) => ({
    title: section.title,
    // Контент мог быть распубликован после сида трека — такие пункты скрываем
    items: section.items.flatMap((item): PathItemDetail[] => {
      const titles =
        item.type === "question" ? questionTitles : challengeTitles;
      const title = titles.get(item.slug);
      if (!title) return [];
      return [
        {
          type: item.type,
          slug: item.slug,
          title,
          href:
            item.type === "question"
              ? `/questions/${item.slug}`
              : `/challenges/${item.slug}`,
          done:
            item.type === "question"
              ? progress.ratedQuestions.has(item.slug)
              : progress.solvedChallenges.has(item.slug),
        },
      ];
    }),
  }));

  const items = sectionDetails.flatMap((s) => s.items);
  return {
    slug: row.slug,
    title: row.title,
    description: row.description,
    total: items.length,
    done: items.filter((i) => i.done).length,
    sections: sectionDetails,
  };
}
