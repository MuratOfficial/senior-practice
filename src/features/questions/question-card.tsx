import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DIFFICULTY_LABELS, TOPIC_LABELS } from "./topics";
import type { QuestionListItem } from "./queries";

export function QuestionCard({ question }: { question: QuestionListItem }) {
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
          </div>
          <CardTitle className="text-base">{question.title}</CardTitle>
          <CardDescription>{question.tags.join(" · ")}</CardDescription>
        </CardHeader>
      </Card>
    </Link>
  );
}
