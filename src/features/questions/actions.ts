"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";

const toggleBookmarkSchema = z.object({
  itemId: z.string().min(1),
  itemType: z.enum(["QUESTION", "CHALLENGE"]),
  slug: z.string().min(1),
});

export async function toggleBookmark(input: {
  itemId: string;
  itemType: "QUESTION" | "CHALLENGE";
  slug: string;
}) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Не авторизован");

  const { itemId, itemType, slug } = toggleBookmarkSchema.parse(input);
  const userId = session.user.id;
  const where = {
    userId_itemId_itemType: { userId, itemId, itemType },
  };

  const existing = await prisma.bookmark.findUnique({ where });
  if (existing) {
    await prisma.bookmark.delete({ where });
  } else {
    await prisma.bookmark.create({ data: { userId, itemId, itemType } });
  }

  revalidatePath(
    itemType === "QUESTION" ? `/questions/${slug}` : `/challenges/${slug}`
  );
  return { bookmarked: !existing };
}
