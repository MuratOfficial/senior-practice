import type { Metadata } from "next";
import { ComingSoon } from "@/components/coming-soon";

export const metadata: Metadata = { title: "Mock-интервью" };

export default function MockPage() {
  return (
    <ComingSoon
      title="Mock-интервью"
      description="Симуляция интервью: конфигуратор по роли и темам, таймер, случайный набор вопросов и задач, итоговый отчёт."
      phase="Фаза 4"
    />
  );
}
