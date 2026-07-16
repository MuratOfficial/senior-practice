import Link from "next/link";
import { CheckCircle2, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DIFFICULTY_LABELS, TOPIC_LABELS } from "./topics";
import type { QuestionListItem } from "./queries";

/** Статус вопроса в системе повторения (SRS) для текущего пользователя */
export type ReviewBadge = "due" | "scheduled" | null;

export function QuestionCard({
  question,
  reviewBadge = null,
}: {
  question: QuestionListItem;
  reviewBadge?: ReviewBadge;
}) {
  return (
    <Link href={`/questions/${question.slug}`}>
      <Card className="transition-colors hover:bg-accent/50">
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">{TOPIC_LABELS[question.topic]}</Badge>
            <Badge
              variant={question.difficulty === "senior" ? "default" : "secondary"}
            >
              {DIFFICULTY_LABELS[question.difficulty]}
            </Badge>
            {reviewBadge === "due" && (
              <span className="inline-flex items-center gap-1 text-xs text-amber-600 dark:text-amber-500">
                <RefreshCw className="size-3.5" /> повторить сегодня
              </span>
            )}
            {reviewBadge === "scheduled" && (
              <span className="inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-500">
                <CheckCircle2 className="size-3.5" /> в повторении
              </span>
            )}
          </div>
          <CardTitle className="text-base">{question.title}</CardTitle>
          <CardDescription>{question.tags.join(" · ")}</CardDescription>
        </CardHeader>
      </Card>
    </Link>
  );
}
