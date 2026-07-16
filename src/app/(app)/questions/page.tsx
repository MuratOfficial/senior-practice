import type { Metadata } from "next";
import Link from "next/link";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { QuestionCard } from "@/features/questions/question-card";
import {
  listQuestions,
  QUESTIONS_PAGE_SIZE,
} from "@/features/questions/queries";
import { getReviewBadges } from "@/features/review/queries";
import { auth } from "@/lib/auth";
import {
  DIFFICULTY_LABELS,
  TOPIC_LABELS,
  TOPICS,
  DIFFICULTIES,
} from "@/features/questions/topics";

export const metadata: Metadata = { title: "Вопросы" };

type SearchParams = { [key: string]: string | string[] | undefined };

function param(sp: SearchParams, key: string): string | undefined {
  const v = sp[key];
  return typeof v === "string" && v.length > 0 ? v : undefined;
}

function buildQuery(
  sp: SearchParams,
  patch: Record<string, string | undefined>
): string {
  const params = new URLSearchParams();
  for (const key of ["topic", "difficulty", "tag", "q"]) {
    const value = key in patch ? patch[key] : param(sp, key);
    if (value) params.set(key, value);
  }
  if (patch.page && patch.page !== "1") params.set("page", patch.page);
  const qs = params.toString();
  return qs ? `/questions?${qs}` : "/questions";
}

export default async function QuestionsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const topic = param(sp, "topic");
  const difficulty = param(sp, "difficulty");
  const tag = param(sp, "tag");
  const q = param(sp, "q");
  const page = Number(param(sp, "page") ?? "1") || 1;

  const { items, total } = await listQuestions({
    topic,
    difficulty,
    tag,
    q,
    page,
  });
  const totalPages = Math.max(1, Math.ceil(total / QUESTIONS_PAGE_SIZE));

  const session = await auth();
  const reviewBadges = session?.user?.id
    ? await getReviewBadges(
        session.user.id,
        items.map((i) => i.slug)
      )
    : new Map<string, "due" | "scheduled">();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">База вопросов</h1>
        <p className="text-muted-foreground">
          Найдено: {total}. Выберите тему, сложность или ищите по названию.
        </p>
      </div>

      <form action="/questions" className="flex max-w-md gap-2">
        {topic && <input type="hidden" name="topic" value={topic} />}
        {difficulty && (
          <input type="hidden" name="difficulty" value={difficulty} />
        )}
        {tag && <input type="hidden" name="tag" value={tag} />}
        <Input
          name="q"
          placeholder="Поиск по названию и тексту…"
          defaultValue={q}
        />
        <Button type="submit" variant="outline" aria-label="Искать">
          <Search className="size-4" />
        </Button>
      </form>

      {tag && (
        <Link
          href={buildQuery(sp, { tag: undefined, page: "1" })}
          className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground"
        >
          #{tag}
          <X className="size-3" aria-label="Сбросить фильтр по тегу" />
        </Link>
      )}

      <div className="flex flex-wrap gap-1.5">
        <FilterChip href={buildQuery(sp, { topic: undefined, page: "1" })} active={!topic}>
          Все темы
        </FilterChip>
        {TOPICS.map((t) => (
          <FilterChip
            key={t}
            href={buildQuery(sp, { topic: t, page: "1" })}
            active={topic === t}
          >
            {TOPIC_LABELS[t]}
          </FilterChip>
        ))}
      </div>

      <div className="flex flex-wrap gap-1.5">
        <FilterChip
          href={buildQuery(sp, { difficulty: undefined, page: "1" })}
          active={!difficulty}
        >
          Любая сложность
        </FilterChip>
        {DIFFICULTIES.map((d) => (
          <FilterChip
            key={d}
            href={buildQuery(sp, { difficulty: d, page: "1" })}
            active={difficulty === d}
          >
            {DIFFICULTY_LABELS[d]}
          </FilterChip>
        ))}
      </div>

      {items.length === 0 ? (
        <p className="py-12 text-center text-muted-foreground">
          Ничего не найдено — попробуйте изменить фильтры.
        </p>
      ) : (
        <div className="grid gap-3">
          {items.map((item) => (
            <QuestionCard
              key={item.slug}
              question={item}
              reviewBadge={reviewBadges.get(item.slug) ?? null}
            />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {page > 1 && (
            <Button
              variant="outline"
              size="sm"
              nativeButton={false}
              render={<Link href={buildQuery(sp, { page: String(page - 1) })} />}
            >
              ← Назад
            </Button>
          )}
          <span className="text-sm text-muted-foreground">
            {page} / {totalPages}
          </span>
          {page < totalPages && (
            <Button
              variant="outline"
              size="sm"
              nativeButton={false}
              render={<Link href={buildQuery(sp, { page: String(page + 1) })} />}
            >
              Вперёд →
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

function FilterChip({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={
        active
          ? "rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground"
          : "rounded-full border px-3 py-1 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
      }
    >
      {children}
    </Link>
  );
}
