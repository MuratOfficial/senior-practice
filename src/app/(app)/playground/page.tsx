import type { Metadata } from "next";
import { PlaygroundClient } from "@/features/playground/playground-client";
import { prisma } from "@/lib/db/prisma";

export const metadata: Metadata = { title: "Playground" };

const EDITOR_LANGUAGES = ["javascript", "typescript", "python"] as const;
type EditorLanguage = (typeof EDITOR_LANGUAGES)[number];

export default async function PlaygroundPage({
  searchParams,
}: {
  searchParams: Promise<{ s?: string }>;
}) {
  const { s } = await searchParams;

  let initialLanguage: EditorLanguage | null = null;
  let initialCode: string | null = null;
  if (s) {
    const snippet = await prisma.snippet.findUnique({
      where: { id: s },
      select: { language: true, code: true },
    });
    if (
      snippet &&
      (EDITOR_LANGUAGES as readonly string[]).includes(snippet.language)
    ) {
      initialLanguage = snippet.language as EditorLanguage;
      initialCode = snippet.code;
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Playground</h1>
        <p className="text-muted-foreground">
          JS/TS/Python выполняются прямо в браузере. «Поделиться» сохраняет
          сниппет и копирует ссылку.
        </p>
      </div>
      <PlaygroundClient
        initialLanguage={initialLanguage}
        initialCode={initialCode}
      />
    </div>
  );
}
