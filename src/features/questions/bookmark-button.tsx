"use client";

import { useOptimistic, useState, useTransition } from "react";
import { Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toggleBookmark } from "./actions";

export function BookmarkButton({
  slug,
  itemType,
  initialBookmarked,
}: {
  slug: string;
  itemType: "QUESTION" | "CHALLENGE";
  initialBookmarked: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [bookmarked, setOptimistic] = useOptimistic(initialBookmarked);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        variant="outline"
        size="sm"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            setError(null);
            setOptimistic(!bookmarked);
            const result = await toggleBookmark({ slug, itemType });
            if ("error" in result) setError(result.error);
          })
        }
      >
        <Bookmark
          className={cn("size-4", bookmarked && "fill-current text-primary")}
        />
        {bookmarked ? "В закладках" : "В закладки"}
      </Button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
