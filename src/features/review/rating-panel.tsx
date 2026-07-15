"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { rateQuestion } from "./actions";

const RATINGS = [
  { label: "Не знал", quality: 1 },
  { label: "Частично", quality: 3 },
  { label: "Знал", quality: 5 },
] as const;

/**
 * Самооценка после раскрытия ответа: оценка уходит в SM-2 и планирует
 * следующее повторение вопроса.
 */
export function RatingPanel({ slug }: { slug: string }) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<
    { interval: number } | { error: string } | null
  >(null);

  if (result && "interval" in result) {
    return (
      <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-accent/30 p-4 text-sm">
        <Check className="size-4 text-primary" />
        <span>
          Записано — следующее повторение через {result.interval}{" "}
          {result.interval === 1 ? "день" : "дн."}
        </span>
        <Link href="/review" className="text-primary hover:underline">
          К очереди повторения
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-2 rounded-lg border p-4">
      <p className="text-sm text-muted-foreground">
        Насколько хорошо вы ответили? Оценка планирует следующее повторение.
      </p>
      <div className="flex flex-wrap gap-2">
        {RATINGS.map((r) => (
          <Button
            key={r.quality}
            variant="outline"
            size="sm"
            disabled={isPending}
            onClick={() =>
              startTransition(async () => {
                setResult(await rateQuestion({ slug, quality: r.quality }));
              })
            }
          >
            {r.label}
          </Button>
        ))}
      </div>
      {result && "error" in result && (
        <p className="text-xs text-destructive">{result.error}</p>
      )}
    </div>
  );
}
