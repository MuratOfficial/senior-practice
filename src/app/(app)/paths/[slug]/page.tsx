import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, BookOpen, CheckCircle2, Circle, Code2 } from "lucide-react";
import { ProgressBar } from "@/features/paths/progress-bar";
import { getLearningPath } from "@/features/paths/queries";
import { auth } from "@/lib/auth";
import { cn } from "@/lib/utils";

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
  if (!session?.user?.id) return { title: "Трек" };
  const path = await getLearningPath(session.user.id, slug);
  return { title: path?.title ?? "Трек не найден" };
}

export default async function PathPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");

  const path = await getLearningPath(session.user.id, slug);
  if (!path) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        href="/paths"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />К трекам
      </Link>

      <div className="space-y-3">
        <h1 className="text-2xl font-bold tracking-tight">{path.title}</h1>
        <p className="text-muted-foreground">{path.description}</p>
        <ProgressBar done={path.done} total={path.total} className="max-w-sm" />
      </div>

      <div className="space-y-6">
        {path.sections.map((section) => (
          <section key={section.title} className="space-y-2">
            <h2 className="text-lg font-semibold">{section.title}</h2>
            <div className="grid gap-1.5">
              {section.items.map((item) => (
                <Link
                  key={`${item.type}-${item.slug}`}
                  href={item.href}
                  className="flex items-center gap-3 rounded-lg border p-3 text-sm transition-colors hover:bg-accent/50"
                >
                  {item.done ? (
                    <CheckCircle2 className="size-4 shrink-0 text-green-600 dark:text-green-500" />
                  ) : (
                    <Circle className="size-4 shrink-0 text-muted-foreground/50" />
                  )}
                  <span
                    className={cn(
                      "min-w-0 flex-1 truncate",
                      item.done && "text-muted-foreground"
                    )}
                  >
                    {item.title}
                  </span>
                  {item.type === "question" ? (
                    <span className="inline-flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                      <BookOpen className="size-3.5" /> вопрос
                    </span>
                  ) : (
                    <span className="inline-flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                      <Code2 className="size-3.5" /> задача
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
