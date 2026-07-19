"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink, Eye, Flag, TimerIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { finishMockSession } from "./actions";

/** Элемент для раннера: метки посчитаны на сервере (тема/категория, сложность) */
export interface RunnerItem {
  itemType: "question" | "challenge";
  slug: string;
  title: string;
  topicLabel: string;
  difficultyLabel: string;
  /** Акцентный бейдж сложности (senior / hard) */
  accent: boolean;
}

const QUESTION_RATINGS = [
  { label: "Не знал", quality: 1 },
  { label: "Частично", quality: 3 },
  { label: "Знал", quality: 5 },
] as const;

const CHALLENGE_RATINGS = [
  { label: "Не решил", quality: 1 },
  { label: "Частично", quality: 3 },
  { label: "Решил", quality: 5 },
] as const;

function formatRemaining(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const mm = String(Math.floor(total / 60)).padStart(2, "0");
  const ss = String(total % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

/**
 * Режим интервью: вопросы и coding-задачи по одному, таймер, самооценка после
 * раскрытия ответа/разбора. Панели контента отрендерены на сервере (слоты).
 * Задачу можно открыть в отдельной вкладке и решить в песочнице — здесь
 * фиксируется только самооценка.
 */
export function MockRunner({
  sessionId,
  items,
  deadlineIso,
  questionPanels,
  answerPanels,
}: {
  sessionId: string;
  items: RunnerItem[];
  deadlineIso: string;
  questionPanels: React.ReactNode[];
  answerPanels: React.ReactNode[];
}) {
  const router = useRouter();
  const [idx, setIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [ratings, setRatings] = useState<(number | null)[]>(() =>
    items.map(() => null)
  );
  const [remainingMs, setRemainingMs] = useState(
    () => new Date(deadlineIso).getTime() - Date.now()
  );
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timer = setInterval(
      () => setRemainingMs(new Date(deadlineIso).getTime() - Date.now()),
      1000
    );
    return () => clearInterval(timer);
  }, [deadlineIso]);

  const finished = idx >= items.length;
  const ratedCount = ratings.filter((r) => r !== null).length;
  const timeUp = remainingMs <= 0;
  const current = finished ? null : items[idx];
  const isChallenge = current?.itemType === "challenge";

  function advance(quality: number | null) {
    setRatings((prev) => {
      const next = [...prev];
      next[idx] = quality;
      return next;
    });
    setRevealed(false);
    setIdx((i) => i + 1);
  }

  function submit(finalRatings: (number | null)[]) {
    startTransition(async () => {
      setError(null);
      const result = await finishMockSession({
        id: sessionId,
        ratings: items.map((item, i) => ({
          slug: item.slug,
          quality: finalRatings[i],
        })),
      });
      if ("error" in result) {
        setError(result.error);
        return;
      }
      router.refresh(); // сессия завершена — сервер отдаст отчёт
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm text-muted-foreground">
          {finished
            ? `Оценено: ${ratedCount} из ${items.length}`
            : `${isChallenge ? "Задача" : "Вопрос"} ${idx + 1} из ${items.length}`}
        </span>
        <div className="flex items-center gap-3">
          <span
            className={cn(
              "inline-flex items-center gap-1 font-mono text-sm",
              timeUp ? "text-destructive" : "text-muted-foreground"
            )}
          >
            <TimerIcon className="size-4" />
            {timeUp ? "Время вышло" : formatRemaining(remainingMs)}
          </span>
          {!finished && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIdx(items.length)}
            >
              <Flag className="size-4" />
              Завершить досрочно
            </Button>
          )}
        </div>
      </div>

      {current ? (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">{current.topicLabel}</Badge>
            <Badge variant={current.accent ? "default" : "secondary"}>
              {current.difficultyLabel}
            </Badge>
          </div>
          <h2 className="text-xl font-bold tracking-tight">{current.title}</h2>

          {questionPanels[idx]}

          {isChallenge && (
            <Button
              variant="outline"
              size="sm"
              nativeButton={false}
              render={
                <a
                  href={`/challenges/${current.slug}`}
                  target="_blank"
                  rel="noreferrer"
                />
              }
            >
              <ExternalLink className="size-4" />
              Открыть задачу в песочнице
            </Button>
          )}

          {!revealed ? (
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => setRevealed(true)}>
                <Eye className="size-4" />
                {isChallenge ? "Показать разбор" : "Показать ответ"}
              </Button>
              <Button variant="ghost" onClick={() => advance(null)}>
                Пропустить
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-lg border p-4">{answerPanels[idx]}</div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  {isChallenge
                    ? "Удалось ли решить задачу?"
                    : "Насколько хорошо вы ответили?"}
                </p>
                <div className="flex flex-wrap gap-2">
                  {(isChallenge ? CHALLENGE_RATINGS : QUESTION_RATINGS).map(
                    (r) => (
                      <Button
                        key={r.quality}
                        variant="outline"
                        onClick={() => advance(r.quality)}
                      >
                        {r.label}
                      </Button>
                    )
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4 rounded-lg border py-12 text-center">
          <p className="text-lg font-semibold">Интервью пройдено</p>
          <p className="text-sm text-muted-foreground">
            Оценено {ratedCount} из {items.length}. Оценки вопросов уйдут в
            систему повторения (SM-2).
          </p>
          <Button disabled={isPending} onClick={() => submit(ratings)}>
            {isPending ? "Сохраняем…" : "Завершить и посмотреть отчёт"}
          </Button>
          {ratedCount < items.length && (
            <Button
              variant="ghost"
              size="sm"
              disabled={isPending}
              onClick={() => {
                const firstUnrated = ratings.findIndex((r) => r === null);
                setIdx(firstUnrated === -1 ? items.length - 1 : firstUnrated);
                setRevealed(false);
              }}
            >
              Вернуться к неоценённым
            </Button>
          )}
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
      )}
    </div>
  );
}
