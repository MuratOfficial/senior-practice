import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Bookmark } from "lucide-react";
import { QuestionCard } from "@/features/questions/question-card";
import { listBookmarkedQuestions } from "@/features/questions/queries";
import { auth } from "@/lib/auth";

export const metadata: Metadata = { title: "Закладки" };

export default async function BookmarksPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");

  const items = await listBookmarkedQuestions(session.user.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Закладки</h1>
        <p className="text-muted-foreground">
          Вопросы, отмеченные для возвращения. Сохранено: {items.length}.
        </p>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <Bookmark className="size-8 text-muted-foreground" />
          <p className="text-muted-foreground">
            Пока пусто — нажмите «В закладки» на странице вопроса.
          </p>
          <Link href="/questions" className="text-sm text-primary hover:underline">
            К базе вопросов
          </Link>
        </div>
      ) : (
        <div className="grid gap-3">
          {items.map((item) => (
            <QuestionCard key={item.slug} question={item} />
          ))}
        </div>
      )}
    </div>
  );
}
