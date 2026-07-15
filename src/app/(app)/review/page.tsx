import type { Metadata } from "next";
import { ComingSoon } from "@/components/coming-soon";

export const metadata: Metadata = { title: "Повторение" };

export default function ReviewPage() {
  return (
    <ComingSoon
      title="Повторение"
      description="Spaced repetition (SM-2): ежедневная очередь вопросов к повторению, чтобы теория не забывалась."
      phase="Фаза 3"
    />
  );
}
