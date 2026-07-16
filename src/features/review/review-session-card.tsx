"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Eye, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { rateQuestion } from "./actions";

const RATINGS = [
  { label: "Не знал", key: "1", quality: 1 },
  { label: "Частично", key: "2", quality: 3 },
  { label: "Знал", key: "3", quality: 5 },
] as const;

/**
 * Карточка сессии повторения: вопрос → ответ (Space/Enter) → оценка (1/2/3).
 * После оценки router.refresh() — сервер отдаёт следующий due-вопрос.
 * Монтируется с key={slug}, поэтому состояние сбрасывается на каждом вопросе.
 */
export function ReviewSessionCard({
  slug,
  question,
  answer,
}: {
  slug: string;
  question: React.ReactNode;
  answer: React.ReactNode;
}) {
  const router = useRouter();
  const [revealed, setRevealed] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function rate(quality: number) {
    startTransition(async () => {
      setError(null);
      const result = await rateQuestion({ slug, quality });
      if ("error" in result) {
        setError(result.error);
        return;
      }
      router.refresh(); // сервер отдаст следующий вопрос очереди
    });
  }

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.target instanceof HTMLElement) {
        const tag = event.target.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA") return;
      }
      if (!revealed && (event.code === "Space" || event.code === "Enter")) {
        event.preventDefault();
        setRevealed(true);
        return;
      }
      if (revealed && !isPending) {
        const rating = RATINGS.find((r) => r.key === event.key);
        if (rating) {
          event.preventDefault();
          rate(rating.quality);
        }
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revealed, isPending, slug]);

  return (
    <div className="space-y-6">
      {question}

      {!revealed ? (
        <div className="rounded-lg border border-dashed p-6 text-center">
          <p className="mb-3 text-sm text-muted-foreground">
            Сформулируйте ответ вслух, затем сверьтесь с эталоном.
          </p>
          <Button onClick={() => setRevealed(true)}>
            <Eye className="size-4" />
            Показать ответ
            <kbd className="ml-1 rounded border px-1.5 text-xs opacity-70">
              Space
            </kbd>
          </Button>
        </div>
      ) : (
        <>
          <div className="rounded-lg border p-4">{answer}</div>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Насколько хорошо вы ответили?
            </p>
            <div className="flex flex-wrap gap-2">
              {RATINGS.map((r) => (
                <Button
                  key={r.quality}
                  variant="outline"
                  disabled={isPending}
                  onClick={() => rate(r.quality)}
                >
                  {isPending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <kbd className="rounded border px-1.5 text-xs opacity-70">
                      {r.key}
                    </kbd>
                  )}
                  {r.label}
                </Button>
              ))}
            </div>
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>
        </>
      )}
    </div>
  );
}
