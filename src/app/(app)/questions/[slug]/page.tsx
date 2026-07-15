import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Markdown } from "@/components/markdown";
import { AnswerReveal } from "@/features/questions/answer-reveal";
import { BookmarkButton } from "@/features/questions/bookmark-button";
import { getQuestionBySlug } from "@/features/questions/queries";
import {
  DIFFICULTY_LABELS,
  TOPIC_LABELS,
} from "@/features/questions/topics";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";

interface Params {
  slug: string;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const question = await getQuestionBySlug(slug);
  return { title: question?.title ?? "Вопрос не найден" };
}

export default async function QuestionPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const question = await getQuestionBySlug(slug);
  if (!question) notFound();

  const session = await auth();
  const bookmark = session?.user?.id
    ? await prisma.bookmark.findUnique({
        where: {
          userId_itemSlug_itemType: {
            userId: session.user.id,
            itemSlug: question.slug,
            itemType: "QUESTION",
          },
        },
      })
    : null;

  return (
    <article className="mx-auto max-w-3xl space-y-6">
      <Link
        href="/questions"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />К списку вопросов
      </Link>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">{TOPIC_LABELS[question.topic]}</Badge>
          <Badge
            variant={question.difficulty === "senior" ? "default" : "secondary"}
          >
            {DIFFICULTY_LABELS[question.difficulty]}
          </Badge>
          {question.tags.map((tag) => (
            <span key={tag} className="text-xs text-muted-foreground">
              #{tag}
            </span>
          ))}
        </div>
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-2xl font-bold tracking-tight">
            {question.title}
          </h1>
          <BookmarkButton
            slug={question.slug}
            itemType="QUESTION"
            initialBookmarked={Boolean(bookmark)}
          />
        </div>
      </div>

      <Markdown>{question.body}</Markdown>

      <Separator />

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Эталонный ответ</h2>
        <AnswerReveal>
          <Markdown>{question.answer}</Markdown>
        </AnswerReveal>
      </section>

      {question.followUps.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-lg font-semibold">
            Follow-up вопросы интервьюера
          </h2>
          <ul className="list-disc space-y-1 pl-5 text-sm">
            {question.followUps.map((fu) => (
              <li key={fu}>{fu}</li>
            ))}
          </ul>
        </section>
      )}

      {question.references.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-lg font-semibold">Материалы</h2>
          <ul className="space-y-1 text-sm">
            {question.references.map((ref) => (
              <li key={ref.url}>
                <a
                  href={ref.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-primary hover:underline"
                >
                  {ref.title}
                  <ExternalLink className="size-3" />
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}
