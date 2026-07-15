"use client";

import { useOptimistic, useTransition } from "react";
import { Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toggleBookmark } from "./actions";

export function BookmarkButton({
  itemId,
  itemType,
  slug,
  initialBookmarked,
}: {
  itemId: string;
  itemType: "QUESTION" | "CHALLENGE";
  slug: string;
  initialBookmarked: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [bookmarked, setOptimistic] = useOptimistic(initialBookmarked);

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          setOptimistic(!bookmarked);
          await toggleBookmark({ itemId, itemType, slug });
        })
      }
    >
      <Bookmark
        className={cn("size-4", bookmarked && "fill-current text-primary")}
      />
      {bookmarked ? "В закладках" : "В закладки"}
    </Button>
  );
}
