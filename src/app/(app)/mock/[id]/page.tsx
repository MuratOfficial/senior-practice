import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, BookOpen, Code2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Markdown } from "@/components/markdown";
import { MockRunner, type RunnerItem } from "@/features/mock/mock-runner";
import { getMockSession } from "@/features/mock/queries";
import type { MockItem } from "@/features/mock/config";
import { listQuestionsBySlugs } from "@/features/questions/queries";
import { listChallengeContentBySlugs } from "@/features/challenges/queries";
import {
  CHALLENGE_CATEGORY_LABELS,
  CHALLENGE_DIFFICULTY_LABELS,
  type ChallengeCategory,
  type ChallengeDifficultyId,
} from "@/features/challenges/categories";
import {
  DIFFICULTY_LABELS,
  TOPIC_LABELS,
  type Difficulty,
  type Topic,
} from "@/features/questions/topics";
import { auth } from "@/lib/auth";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Mock-сессия" };

interface Params {
  id: string;
}

/** Метки бейджей: у вопросов — тема/уровень, у задач — категория/сложность */
function itemLabels(item: MockItem): {
  topicLabel: string;
  difficultyLabel: string;
  accent: boolean;
} {
  if (item.itemType === "challenge") {
    return {
      topicLabel:
        CHALLENGE_CATEGORY_LABELS[item.topic as ChallengeCategory] ??
        item.topic,
      difficultyLabel:
        CHALLENGE_DIFFICULTY_LABELS[item.difficulty as ChallengeDifficultyId] ??
        item.difficulty,
      accent: item.difficulty === "hard",
    };
  }
  return {
    topicLabel: TOPIC_LABELS[item.topic as Topic] ?? item.topic,
    difficultyLabel: DIFFICULTY_LABELS[item.difficulty as Difficulty] ?? item.difficulty,
    accent: item.difficulty === "senior",
  };
}

function assessment(item: MockItem): { label: string; className: string } {
  const q = item.quality;
  if (q === null)
    return { label: "Пропущен", className: "text-muted-foreground" };
  const labels =
    item.itemType === "challenge"
      ? { good: "Решил", mid: "Частично", bad: "Не решил" }
      : { good: "Знал", mid: "Частично", bad: "Не знал" };
  if (q >= 4)
    return { label: labels.good, className: "text-green-600 dark:text-green-500" };
  if (q >= 2)
    return { label: labels.mid, className: "text-amber-600 dark:text-amber-500" };
  return { label: labels.bad, className: "text-red-600 dark:text-red-500" };
}

export default async function MockSessionPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");

  const mock = await getMockSession(session.user.id, id);
  if (!mock) notFound();

  if (mock.finishedAt) {
    return <MockReport mock={mock} />;
  }

  // Активная сессия: рендерим контент на сервере, слоты — в клиентский раннер
  const questionSlugs = mock.items
    .filter((i) => i.itemType === "question")
    .map((i) => i.slug);
  const challengeSlugs = mock.items
    .filter((i) => i.itemType === "challenge")
    .map((i) => i.slug);
  const [questions, challenges] = await Promise.all([
    listQuestionsBySlugs(questionSlugs),
    listChallengeContentBySlugs(challengeSlugs),
  ]);
  const questionBySlug = new Map(questions.map((q) => [q.slug, q]));
  const challengeBySlug = new Map(challenges.map((c) => [c.slug, c]));

  const items = mock.items.filter((i) =>
    i.itemType === "question"
      ? questionBySlug.has(i.slug)
      : challengeBySlug.has(i.slug)
  );
  const deadline = new Date(
    mock.startedAt.getTime() + mock.config.durationMin * 60_000
  );

  const runnerItems: RunnerItem[] = items.map((i) => ({
    itemType: i.itemType,
    slug: i.slug,
    title: i.title,
    ...itemLabels(i),
  }));

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        href="/mock"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />К mock-интервью
      </Link>

      <MockRunner
        sessionId={mock.id}
        items={runnerItems}
        deadlineIso={deadline.toISOString()}
        questionPanels={items.map((i) => (
          <Markdown key={i.slug}>
            {i.itemType === "question"
              ? questionBySlug.get(i.slug)!.body
              : challengeBySlug.get(i.slug)!.statement}
          </Markdown>
        ))}
        answerPanels={items.map((i) => (
          <Markdown key={i.slug}>
            {i.itemType === "question"
              ? questionBySlug.get(i.slug)!.answer
              : challengeBySlug.get(i.slug)!.explanation}
          </Markdown>
        ))}
      />
    </div>
  );
}

function MockReport({
  mock,
}: {
  mock: {
    items: MockItem[];
    score: number | null;
    startedAt: Date;
    finishedAt: Date | null;
  };
}) {
  const durationMin = mock.finishedAt
    ? Math.max(
        1,
        Math.round(
          (mock.finishedAt.getTime() - mock.startedAt.getTime()) / 60_000
        )
      )
    : null;
  const rated = mock.items.filter((i) => i.quality !== null).length;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        href="/mock"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />К mock-интервью
      </Link>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">Отчёт сессии</h1>
        <p className="text-muted-foreground">
          Оценено {rated} из {mock.items.length}
          {durationMin !== null && <> · {durationMin} мин</>}. Слабые места —
          хорошие кандидаты на закладки и повторение.
        </p>
      </div>

      <div className="rounded-lg border p-6 text-center">
        <p className="text-sm text-muted-foreground">Итоговый балл</p>
        <p className="text-4xl font-bold">
          {mock.score !== null ? `${mock.score}%` : "—"}
        </p>
      </div>

      <div className="grid gap-2">
        {mock.items.map((item) => {
          const a = assessment(item);
          const labels = itemLabels(item);
          const href =
            item.itemType === "question"
              ? `/questions/${item.slug}`
              : `/challenges/${item.slug}`;
          const TypeIcon = item.itemType === "question" ? BookOpen : Code2;
          return (
            <Link
              key={`${item.itemType}-${item.slug}`}
              href={href}
              className="flex items-center justify-between gap-3 rounded-lg border p-3 transition-colors hover:bg-accent/50"
            >
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <TypeIcon className="size-3.5 text-muted-foreground" />
                  <Badge variant="outline">{labels.topicLabel}</Badge>
                  <Badge variant={labels.accent ? "default" : "secondary"}>
                    {labels.difficultyLabel}
                  </Badge>
                </div>
                <p className="truncate text-sm font-medium">{item.title}</p>
              </div>
              <span className={cn("shrink-0 text-sm font-medium", a.className)}>
                {a.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
