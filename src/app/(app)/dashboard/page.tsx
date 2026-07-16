import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  BookOpen,
  Bookmark,
  Code2,
  Flame,
  RefreshCw,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getDashboardStats } from "@/features/progress/queries";
import { TOPIC_LABELS } from "@/features/questions/topics";
import { auth } from "@/lib/auth";

export const metadata: Metadata = { title: "Дашборд" };

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");

  const stats = await getDashboardStats(session.user.id);

  const tiles = [
    {
      icon: RefreshCw,
      label: "К повторению сегодня",
      value: stats.dueToday,
      href: "/review",
    },
    {
      icon: BookOpen,
      label: "Вопросов изучено",
      value: `${stats.questionsRated} / ${stats.questionsTotal}`,
      href: "/questions",
    },
    {
      icon: Code2,
      label: "Задач решено",
      value: `${stats.challengesSolved} / ${stats.challengesTotal}`,
      href: "/challenges",
    },
    {
      icon: Flame,
      label: "Дней подряд",
      value: stats.streakDays,
      href: null,
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Дашборд</h1>
          <p className="text-muted-foreground">
            Прогресс подготовки: вопросы, задачи, повторения.
          </p>
        </div>
        {stats.dueToday > 0 && (
          <Button
            nativeButton={false}
            render={<Link href="/review/session" />}
          >
            Начать повторение ({stats.dueToday})
            <ArrowRight className="size-4" />
          </Button>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map((tile) => {
          const inner = (
            <Card className="h-full transition-colors hover:bg-accent/50">
              <CardHeader>
                <tile.icon className="size-5 text-primary" />
                <CardTitle className="text-2xl tabular-nums">
                  {tile.value}
                </CardTitle>
                <p className="text-sm text-muted-foreground">{tile.label}</p>
              </CardHeader>
            </Card>
          );
          return tile.href ? (
            <Link key={tile.label} href={tile.href}>
              {inner}
            </Link>
          ) : (
            <div key={tile.label}>{inner}</div>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Покрытие тем</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats.topics.map((t) => {
              const percent =
                t.total > 0 ? Math.round((t.rated / t.total) * 100) : 0;
              return (
                <Link
                  key={t.topic}
                  href={`/questions?topic=${t.topic}`}
                  className="block space-y-1"
                >
                  <div className="flex items-center justify-between text-sm">
                    <span>{TOPIC_LABELS[t.topic]}</span>
                    <span className="tabular-nums text-muted-foreground">
                      {t.rated} / {t.total}
                    </span>
                  </div>
                  <div
                    className="h-1.5 overflow-hidden rounded-full bg-muted"
                    role="progressbar"
                    aria-valuenow={percent}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  >
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </Link>
              );
            })}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Слабые места</CardTitle>
            </CardHeader>
            <CardContent>
              {stats.weakSpots.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Пока пусто — появятся вопросы, которые даются тяжелее всего
                  (по оценкам повторений).
                </p>
              ) : (
                <ul className="space-y-2">
                  {stats.weakSpots.map((w) => (
                    <li key={w.slug}>
                      <Link
                        href={`/questions/${w.slug}`}
                        className="text-sm text-primary hover:underline"
                      >
                        {w.title}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        сложность для вас: {w.easeFactor.toFixed(2)} · повторений
                        подряд: {w.repetition}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Быстрые ссылки</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <Link
                href="/bookmarks"
                className="flex items-center gap-2 text-primary hover:underline"
              >
                <Bookmark className="size-4" />
                Закладки ({stats.bookmarks})
              </Link>
              <Link
                href="/challenges"
                className="flex items-center gap-2 text-primary hover:underline"
              >
                <Code2 className="size-4" />
                Задачи в процессе (
                {stats.challengesAttempted - stats.challengesSolved})
              </Link>
              <Link
                href="/playground"
                className="flex items-center gap-2 text-primary hover:underline"
              >
                <ArrowRight className="size-4" />
                Playground
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
