import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ProgressBar } from "@/features/paths/progress-bar";
import { listLearningPaths } from "@/features/paths/queries";
import { auth } from "@/lib/auth";

export const metadata: Metadata = { title: "Треки" };

export default async function PathsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");

  const paths = await listLearningPaths(session.user.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Учебные треки</h1>
        <p className="text-muted-foreground">
          Структурированные планы подготовки по ролям: теория и практика в
          рекомендованном порядке.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {paths.map((p) => (
          <Link key={p.slug} href={`/paths/${p.slug}`}>
            <Card className="h-full transition-colors hover:bg-accent/50">
              <CardHeader>
                <CardTitle className="text-base">{p.title}</CardTitle>
                <CardDescription>{p.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <ProgressBar done={p.done} total={p.total} />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
