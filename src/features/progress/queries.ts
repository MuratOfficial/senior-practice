import "server-only";
import { prisma } from "@/lib/db/prisma";
import { TOPICS, type Topic } from "@/features/questions/topics";

export interface TopicCoverage {
  topic: Topic;
  total: number;
  rated: number;
}

export interface WeakSpot {
  slug: string;
  title: string;
  easeFactor: number;
  repetition: number;
}

export interface DashboardStats {
  questionsTotal: number;
  questionsRated: number;
  dueToday: number;
  challengesTotal: number;
  challengesSolved: number;
  challengesAttempted: number;
  bookmarks: number;
  streakDays: number;
  topics: TopicCoverage[];
  weakSpots: WeakSpot[];
}

/** Локальная дата YYYY-MM-DD — для расчёта streak по дням активности. */
function toDayKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

/**
 * Streak — число подряд идущих дней с активностью (оценка вопроса или сдача
 * задачи), заканчивая сегодня или вчера (сегодняшнее занятие ещё впереди —
 * серия не считается прерванной).
 */
export function computeStreak(activityDates: Date[], now = new Date()): number {
  const days = new Set(activityDates.map(toDayKey));
  const cursor = new Date(now);
  if (!days.has(toDayKey(cursor))) {
    cursor.setDate(cursor.getDate() - 1); // сегодня ещё не занимался — от вчера
  }
  let streak = 0;
  while (days.has(toDayKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export async function getDashboardStats(
  userId: string
): Promise<DashboardStats> {
  const [
    totalsByTopic,
    reviewStates,
    challengesTotal,
    submissions,
    bookmarks,
  ] = await Promise.all([
    prisma.question.groupBy({
      by: ["topic"],
      where: { status: "published" },
      _count: { _all: true },
    }),
    prisma.reviewState.findMany({
      where: { userId },
      select: {
        questionSlug: true,
        easeFactor: true,
        repetition: true,
        dueAt: true,
        updatedAt: true,
      },
    }),
    prisma.challenge.count({ where: { status: "published" } }),
    prisma.submission.findMany({
      where: { userId },
      select: { challengeSlug: true, status: true, createdAt: true },
    }),
    prisma.bookmark.count({ where: { userId } }),
  ]);

  // ReviewState ссылается по slug без FK — учитываем только живые published-вопросы
  const trackedSlugs = reviewStates.map((s) => s.questionSlug);
  const trackedQuestions =
    trackedSlugs.length > 0
      ? await prisma.question.findMany({
          where: { slug: { in: trackedSlugs }, status: "published" },
          select: { slug: true, topic: true, title: true },
        })
      : [];
  const questionBySlug = new Map(trackedQuestions.map((q) => [q.slug, q]));
  const liveStates = reviewStates.filter((s) =>
    questionBySlug.has(s.questionSlug)
  );

  const ratedByTopic = new Map<string, number>();
  for (const state of liveStates) {
    const topic = questionBySlug.get(state.questionSlug)!.topic;
    ratedByTopic.set(topic, (ratedByTopic.get(topic) ?? 0) + 1);
  }
  const totalByTopic = new Map(
    totalsByTopic.map((r) => [r.topic, r._count._all])
  );
  const topics: TopicCoverage[] = TOPICS.map((topic) => ({
    topic,
    total: totalByTopic.get(topic) ?? 0,
    rated: ratedByTopic.get(topic) ?? 0,
  })).filter((t) => t.total > 0);

  const now = new Date();
  const dueToday = liveStates.filter((s) => s.dueAt <= now).length;

  const attemptedSlugs = new Set(submissions.map((s) => s.challengeSlug));
  const solvedSlugs = new Set(
    submissions.filter((s) => s.status === "PASSED").map((s) => s.challengeSlug)
  );

  // Слабые места: низкий easeFactor = вопрос регулярно даётся тяжело
  const weakSpots: WeakSpot[] = [...liveStates]
    .sort((a, b) => a.easeFactor - b.easeFactor)
    .slice(0, 5)
    .filter((s) => s.easeFactor < 2.5)
    .map((s) => ({
      slug: s.questionSlug,
      title: questionBySlug.get(s.questionSlug)!.title,
      easeFactor: s.easeFactor,
      repetition: s.repetition,
    }));

  const streakDays = computeStreak([
    ...liveStates.map((s) => s.updatedAt),
    ...submissions.map((s) => s.createdAt),
  ]);

  return {
    questionsTotal: totalsByTopic.reduce((sum, r) => sum + r._count._all, 0),
    questionsRated: liveStates.length,
    dueToday,
    challengesTotal,
    challengesSolved: solvedSlugs.size,
    challengesAttempted: attemptedSlugs.size,
    bookmarks,
    streakDays,
    topics,
    weakSpots,
  };
}
