"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { Prisma } from "@/generated/prisma/client";

const toggleBookmarkSchema = z.object({
  slug: z.string().min(1),
  itemType: z.enum(["QUESTION", "CHALLENGE"]),
});

type ToggleBookmarkResult = { bookmarked: boolean } | { error: string };

export async function toggleBookmark(input: {
  slug: string;
  itemType: "QUESTION" | "CHALLENGE";
}): Promise<ToggleBookmarkResult> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Не авторизован" };

  const parsed = toggleBookmarkSchema.safeParse(input);
  if (!parsed.success) return { error: "Некорректный запрос" };

  const { slug, itemType } = parsed.data;
  const userId = session.user.id;

  // deleteMany + create вместо find-then-act: устойчиво к двойному клику
  // (у параллельного запроса deleteMany вернёт 0, а create упрётся в unique)
  let bookmarked: boolean;
  const deleted = await prisma.bookmark.deleteMany({
    where: { userId, itemSlug: slug, itemType },
  });
  if (deleted.count > 0) {
    bookmarked = false;
  } else {
    try {
      await prisma.bookmark.create({
        data: { userId, itemSlug: slug, itemType },
      });
      bookmarked = true;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        bookmarked = true; // параллельный запрос уже создал закладку
      } else {
        throw error;
      }
    }
  }

  revalidatePath(
    itemType === "QUESTION" ? `/questions/${slug}` : `/challenges/${slug}`
  );
  return { bookmarked };
}
