import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, PartyPopper } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Markdown } from "@/components/markdown";
import { ReviewSessionCard } from "@/features/review/review-session-card";
import { listDueQuestions } from "@/features/review/queries";
import { getQuestionBySlug } from "@/features/questions/queries";
import {
  DIFFICULTY_LABELS,
  TOPIC_LABELS,
} from "@/features/questions/topics";
import { auth } from "@/lib/auth";

export const metadata: Metadata = { title: "Сессия повторения" };

export default async function ReviewSessionPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");

  const due = await listDueQuestions(session.user.id);

  if (due.length === 0) {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center gap-4 py-16 text-center">
        <PartyPopper className="size-10 text-primary" />
        <h1 className="text-2xl font-bold tracking-tight">
          На сегодня всё повторено
        </h1>
        <p className="text-muted-foreground">
          Возвращайтесь завтра — или изучите новые вопросы, чтобы пополнить
          очередь.
        </p>
        <div className="flex gap-4 text-sm">
          <Link href="/questions" className="text-primary hover:underline">
            К базе вопросов
          </Link>
          <Link href="/dashboard" className="text-primary hover:underline">
            На дашборд
          </Link>
        </div>
      </div>
    );
  }

  const current = due[0];
  const question = await getQuestionBySlug(current.slug);
  if (!question) redirect("/review"); // осиротевшая запись — очередь разберётся

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/review"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Выйти из сессии
        </Link>
        <span className="text-sm tabular-nums text-muted-foreground">
          осталось: {due.length}
        </span>
      </div>

      <ReviewSessionCard
        key={question.slug}
        slug={question.slug}
        question={
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">{TOPIC_LABELS[question.topic]}</Badge>
              <Badge
                variant={
                  question.difficulty === "senior" ? "default" : "secondary"
                }
              >
                {DIFFICULTY_LABELS[question.difficulty]}
              </Badge>
            </div>
            <h1 className="text-xl font-bold tracking-tight">
              {question.title}
            </h1>
            <Markdown>{question.body}</Markdown>
          </div>
        }
        answer={<Markdown>{question.answer}</Markdown>}
      />
    </div>
  );
}
