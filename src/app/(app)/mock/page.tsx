import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Play, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createMockSession } from "@/features/mock/actions";
import {
  DEFAULT_MOCK_COUNT,
  DEFAULT_MOCK_DURATION_MIN,
  MOCK_COUNTS,
  MOCK_DURATIONS_MIN,
} from "@/features/mock/config";
import {
  findActiveMockSession,
  listFinishedMockSessions,
} from "@/features/mock/queries";
import { TOPIC_LABELS, TOPICS } from "@/features/questions/topics";
import { auth } from "@/lib/auth";

export const metadata: Metadata = { title: "Mock-интервью" };

const dateFormat = new Intl.DateTimeFormat("ru-RU", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

export default async function MockPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");

  const [active, history] = await Promise.all([
    findActiveMockSession(session.user.id),
    listFinishedMockSessions(session.user.id),
  ]);

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Mock-интервью</h1>
        <p className="text-muted-foreground">
          Случайный набор вопросов по выбранным темам, таймер и самооценки —
          как на реальном интервью. Оценки уходят в систему повторения.
        </p>
      </div>

      {active && (
        <Card className="border-primary/50">
          <CardHeader>
            <CardTitle className="text-base">
              Есть незавершённая сессия
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between gap-4">
            <span className="text-sm text-muted-foreground">
              Начата {dateFormat.format(active.startedAt)}
            </span>
            <Button
              size="sm"
              nativeButton={false}
              render={<Link href={`/mock/${active.id}`} />}
            >
              <Play className="size-4" />
              Продолжить
            </Button>
          </CardContent>
        </Card>
      )}

      <form action={createMockSession} className="space-y-5 rounded-lg border p-5">
        <div className="space-y-2">
          <p className="text-sm font-medium">Темы</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {TOPICS.map((t) => (
              <label
                key={t}
                className="flex cursor-pointer items-center gap-2 text-sm"
              >
                <input
                  type="checkbox"
                  name="topics"
                  value={t}
                  defaultChecked
                  className="size-4 accent-primary"
                />
                {TOPIC_LABELS[t]}
              </label>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-6">
          <label className="space-y-1 text-sm">
            <span className="font-medium">Вопросов</span>
            <select
              name="count"
              defaultValue={DEFAULT_MOCK_COUNT}
              className="block h-9 rounded-md border bg-background px-3 text-sm"
            >
              {MOCK_COUNTS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1 text-sm">
            <span className="font-medium">Длительность</span>
            <select
              name="duration"
              defaultValue={DEFAULT_MOCK_DURATION_MIN}
              className="block h-9 rounded-md border bg-background px-3 text-sm"
            >
              {MOCK_DURATIONS_MIN.map((d) => (
                <option key={d} value={d}>
                  {d} мин
                </option>
              ))}
            </select>
          </label>
        </div>

        <Button type="submit">
          <Timer className="size-4" />
          Начать интервью
        </Button>
      </form>

      {history.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Прошлые сессии</h2>
          <div className="grid gap-2">
            {history.map((s) => (
              <Link
                key={s.id}
                href={`/mock/${s.id}`}
                className="flex items-center justify-between gap-4 rounded-lg border p-3 text-sm transition-colors hover:bg-accent/50"
              >
                <span className="text-muted-foreground">
                  {dateFormat.format(s.finishedAt)} · {s.rated} из {s.total}{" "}
                  вопросов
                </span>
                <span className="inline-flex items-center gap-2 font-medium">
                  {s.score !== null ? `${s.score}%` : "—"}
                  <ArrowRight className="size-4 text-muted-foreground" />
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
