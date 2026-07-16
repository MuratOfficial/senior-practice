import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, CheckCircle2, Lightbulb } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Markdown } from "@/components/markdown";
import { ChallengeRunner } from "@/features/challenges/challenge-runner";
import { getChallengeBySlug } from "@/features/challenges/queries";
import {
  CHALLENGE_CATEGORY_LABELS,
  CHALLENGE_DIFFICULTY_LABELS,
} from "@/features/challenges/categories";
import { auth } from "@/lib/auth";

interface Params {
  slug: string;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const session = await auth();
  if (!session?.user?.id) return { title: "Задача" };
  const challenge = await getChallengeBySlug(slug, session.user.id);
  return { title: challenge?.title ?? "Задача не найдена" };
}

export default async function ChallengePage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");

  const challenge = await getChallengeBySlug(slug, session.user.id);
  if (!challenge) notFound();

  return (
    <div className="space-y-6">
      <Link
        href="/challenges"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />К списку задач
      </Link>

      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">
            {CHALLENGE_CATEGORY_LABELS[challenge.category]}
          </Badge>
          <Badge variant="secondary">
            {CHALLENGE_DIFFICULTY_LABELS[challenge.difficulty]}
          </Badge>
          {challenge.solved && (
            <span className="inline-flex items-center gap-1 text-xs text-green-600">
              <CheckCircle2 className="size-3.5" /> решено
            </span>
          )}
        </div>
        <h1 className="text-2xl font-bold tracking-tight">{challenge.title}</h1>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div className="space-y-4">
          <Markdown>{challenge.statement}</Markdown>

          {challenge.hints.length > 0 && (
            <div className="space-y-2">
              {challenge.hints.map((hint, i) => (
                <details key={i} className="group rounded-lg border p-3">
                  <summary className="flex cursor-pointer items-center gap-2 text-sm font-medium text-muted-foreground group-open:text-foreground">
                    <Lightbulb className="size-4" />
                    Подсказка {i + 1}
                  </summary>
                  <div className="pt-2 text-sm">
                    <Markdown>{hint}</Markdown>
                  </div>
                </details>
              ))}
            </div>
          )}

          {challenge.unlocked && challenge.explanation && (
            <>
              <Separator />
              <section className="space-y-3">
                <h2 className="text-lg font-semibold">Разбор решения</h2>
                <Markdown>{challenge.explanation}</Markdown>
                {challenge.solutions?.map((solution) => (
                  <details key={solution.id} className="rounded-lg border p-3">
                    <summary className="cursor-pointer text-sm font-medium">
                      Эталонное решение (
                      {solution.id === "python" ? "Python" : "JavaScript"})
                    </summary>
                    <div className="pt-2">
                      <Markdown>
                        {`\`\`\`${solution.id}\n${solution.code}\n\`\`\``}
                      </Markdown>
                    </div>
                  </details>
                ))}
              </section>
            </>
          )}

          {!challenge.unlocked && (
            <p className="rounded-lg border border-dashed p-3 text-xs text-muted-foreground">
              Разбор и эталонное решение откроются после первой сдачи (кнопка
              «Сдать»).
            </p>
          )}
        </div>

        <ChallengeRunner slug={challenge.slug} languages={challenge.languages} />
      </div>
    </div>
  );
}
