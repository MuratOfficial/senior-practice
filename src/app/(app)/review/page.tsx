import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { QuestionCard } from "@/features/questions/question-card";
import {
  countTrackedQuestions,
  listDueQuestions,
} from "@/features/review/queries";
import { auth } from "@/lib/auth";

export const metadata: Metadata = { title: "Повторение" };

export default async function ReviewPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");

  const [due, tracked] = await Promise.all([
    listDueQuestions(session.user.id),
    countTrackedQuestions(session.user.id),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Повторение</h1>
        <p className="text-muted-foreground">
          Spaced repetition (SM-2). К повторению сегодня: {due.length}, всего
          отслеживается: {tracked}.
        </p>
      </div>

      {due.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <CheckCircle2 className="size-8 text-primary" />
          <p className="text-muted-foreground">
            {tracked === 0
              ? "Очередь пуста. Оцените свой ответ на странице любого вопроса — он попадёт в систему повторения."
              : "На сегодня всё повторено. Возвращайтесь завтра."}
          </p>
          <Link href="/questions" className="text-sm text-primary hover:underline">
            К базе вопросов
          </Link>
        </div>
      ) : (
        <div className="grid gap-3">
          {due.map((item) => (
            <QuestionCard key={item.slug} question={item} />
          ))}
        </div>
      )}
    </div>
  );
}
