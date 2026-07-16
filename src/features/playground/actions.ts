"use server";

import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";

const saveSnippetSchema = z.object({
  language: z.enum(["javascript", "typescript", "python"]),
  code: z.string().min(1).max(50_000),
});

type SaveSnippetResult = { id: string } | { error: string };

export async function saveSnippet(input: {
  language: "javascript" | "typescript" | "python";
  code: string;
}): Promise<SaveSnippetResult> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Не авторизован" };

  const parsed = saveSnippetSchema.safeParse(input);
  if (!parsed.success) return { error: "Некорректный запрос" };

  const snippet = await prisma.snippet.create({
    data: {
      userId: session.user.id,
      language: parsed.data.language,
      code: parsed.data.code,
    },
    select: { id: true },
  });
  return { id: snippet.id };
}
