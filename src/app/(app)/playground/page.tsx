import type { Metadata } from "next";
import { ComingSoon } from "@/components/coming-soon";

export const metadata: Metadata = { title: "Playground" };

export default function PlaygroundPage() {
  return (
    <ComingSoon
      title="Playground"
      description="Свободный редактор кода: JavaScript, TypeScript и Python выполняются прямо в браузере (Web Worker + Pyodide)."
      phase="Фаза 2"
    />
  );
}
