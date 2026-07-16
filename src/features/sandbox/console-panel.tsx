"use client";

import { cn } from "@/lib/utils";
import type { ConsoleLine } from "./use-sandbox";

const LEVEL_CLASS: Record<ConsoleLine["level"], string> = {
  log: "text-foreground",
  info: "text-foreground",
  warn: "text-amber-500",
  error: "text-destructive",
};

export function ConsolePanel({
  lines,
  status,
}: {
  lines: ConsoleLine[];
  status: string | null;
}) {
  if (lines.length === 0 && !status) return null;

  return (
    <div className="max-h-48 overflow-y-auto rounded-lg border bg-muted/30 p-3 font-mono text-xs">
      {status && <p className="text-muted-foreground">{status}</p>}
      {lines.map((line, i) => (
        <p key={i} className={cn("whitespace-pre-wrap", LEVEL_CLASS[line.level])}>
          {line.text}
        </p>
      ))}
    </div>
  );
}
