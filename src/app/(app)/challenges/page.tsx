import type { Metadata } from "next";
import { ComingSoon } from "@/components/coming-soon";

export const metadata: Metadata = { title: "Задачи" };

export default function ChallengesPage() {
  return (
    <ComingSoon
      title="Задачи с автопроверкой"
      description="Алгоритмы и практические задачи (debounce, event emitter, хуки, async) с тестами, подсказками и разбором эталонного решения."
      phase="Фаза 2"
    />
  );
}
