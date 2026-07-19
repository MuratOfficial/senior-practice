import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Markdown } from "@/components/markdown";
import { MockRunner } from "@/features/mock/mock-runner";
import { getMockSession } from "@/features/mock/queries";
import type { MockItem } from "@/features/mock/config";
import { listQuestionsBySlugs } from "@/features/questions/queries";
import {
  DIFFICULTY_LABELS,
  TOPIC_LABELS,
} from "@/features/questions/topics";
import { auth } from "@/lib/auth";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Mock-сессия" };

interface Params {
  id: string;
}

function assessment(quality: number | null): {
  label: string;
  className: string;
} {
  if (quality === null)
    return { label: "Пропущен", className: "text-muted-foreground" };
  if (quality >= 4)
    return { label: "Знал", className: "text-green-600 dark:text-green-500" };
  if (quality >= 2)
    return {
      label: "Частично",
      className: "text-amber-600 dark:text-amber-500",
    };
  return { label: "Не знал", className: "text-red-600 dark:text-red-500" };
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

  // Активная сессия: рендерим вопросы/ответы на сервере, слоты — в клиентский раннер
  const questions = await listQuestionsBySlugs(mock.items.map((i) => i.slug));
  const bySlug = new Map(questions.map((q) => [q.slug, q]));
  const items = mock.items.filter((i) => bySlug.has(i.slug));
  const deadline = new Date(
    mock.startedAt.getTime() + mock.config.durationMin * 60_000
  );

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
        items={items.map(({ slug, topic, difficulty, title }) => ({
          slug,
          topic,
          difficulty,
          title,
        }))}
        deadlineIso={deadline.toISOString()}
        questionPanels={items.map((i) => (
          <Markdown key={i.slug}>{bySlug.get(i.slug)!.body}</Markdown>
        ))}
        answerPanels={items.map((i) => (
          <Markdown key={i.slug}>{bySlug.get(i.slug)!.answer}</Markdown>
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
    ? Math.max(1, Math.round((mock.finishedAt.getTime() - mock.startedAt.getTime()) / 60_000))
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
          Оценено {rated} из {mock.items.length} вопросов
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
          const a = assessment(item.quality);
          return (
            <Link
              key={item.slug}
              href={`/questions/${item.slug}`}
              className="flex items-center justify-between gap-3 rounded-lg border p-3 transition-colors hover:bg-accent/50"
            >
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">{TOPIC_LABELS[item.topic]}</Badge>
                  <Badge
                    variant={
                      item.difficulty === "senior" ? "default" : "secondary"
                    }
                  >
                    {DIFFICULTY_LABELS[item.difficulty]}
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
