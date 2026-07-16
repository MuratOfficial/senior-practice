import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle2, CircleDot } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { listChallenges } from "@/features/challenges/queries";
import {
  CHALLENGE_CATEGORIES,
  CHALLENGE_CATEGORY_LABELS,
  CHALLENGE_DIFFICULTIES,
  CHALLENGE_DIFFICULTY_LABELS,
} from "@/features/challenges/categories";
import { auth } from "@/lib/auth";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Задачи" };

type SearchParams = { [key: string]: string | string[] | undefined };

function param(sp: SearchParams, key: string): string | undefined {
  const v = sp[key];
  return typeof v === "string" && v.length > 0 ? v : undefined;
}

function buildQuery(patch: Record<string, string | undefined>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(patch)) {
    if (value) params.set(key, value);
  }
  const qs = params.toString();
  return qs ? `/challenges?${qs}` : "/challenges";
}

const DIFFICULTY_BADGE: Record<string, string> = {
  easy: "bg-green-500/15 text-green-700 dark:text-green-400",
  medium: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  hard: "bg-red-500/15 text-red-700 dark:text-red-400",
};

export default async function ChallengesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");

  const sp = await searchParams;
  const category = param(sp, "category");
  const difficulty = param(sp, "difficulty");

  const items = await listChallenges({ category, difficulty }, session.user.id);
  const solved = items.filter((i) => i.userStatus === "PASSED").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Задачи</h1>
        <p className="text-muted-foreground">
          Код выполняется прямо в браузере. Решено: {solved} из {items.length}.
        </p>
      </div>

      <div className="flex flex-wrap gap-1.5">
        <FilterChip href={buildQuery({ difficulty })} active={!category}>
          Все категории
        </FilterChip>
        {CHALLENGE_CATEGORIES.map((c) => (
          <FilterChip
            key={c}
            href={buildQuery({ category: c, difficulty })}
            active={category === c}
          >
            {CHALLENGE_CATEGORY_LABELS[c]}
          </FilterChip>
        ))}
      </div>

      <div className="flex flex-wrap gap-1.5">
        <FilterChip href={buildQuery({ category })} active={!difficulty}>
          Любая сложность
        </FilterChip>
        {CHALLENGE_DIFFICULTIES.map((d) => (
          <FilterChip
            key={d}
            href={buildQuery({ category, difficulty: d })}
            active={difficulty === d}
          >
            {CHALLENGE_DIFFICULTY_LABELS[d]}
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
            <Link key={item.slug} href={`/challenges/${item.slug}`}>
              <Card className="transition-colors hover:bg-accent/50">
                <CardHeader>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline">
                      {CHALLENGE_CATEGORY_LABELS[item.category]}
                    </Badge>
                    <Badge
                      variant="secondary"
                      className={DIFFICULTY_BADGE[item.difficulty]}
                    >
                      {CHALLENGE_DIFFICULTY_LABELS[item.difficulty]}
                    </Badge>
                    {item.userStatus === "PASSED" && (
                      <span className="inline-flex items-center gap-1 text-xs text-green-600">
                        <CheckCircle2 className="size-3.5" /> решено
                      </span>
                    )}
                    {item.userStatus === "FAILED" && (
                      <span className="inline-flex items-center gap-1 text-xs text-amber-600">
                        <CircleDot className="size-3.5" /> в процессе
                      </span>
                    )}
                  </div>
                  <CardTitle className="text-base">{item.title}</CardTitle>
                  <CardDescription>{item.tags.join(" · ")}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
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
      aria-current={active ? "true" : undefined}
      className={cn(
        "rounded-full px-3 py-1 text-xs font-medium",
        active
          ? "bg-primary text-primary-foreground"
          : "border text-muted-foreground hover:bg-accent hover:text-foreground"
      )}
    >
      {children}
    </Link>
  );
}
