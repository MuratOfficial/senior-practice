"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Скрывает эталонный ответ, пока пользователь не попробует ответить сам.
 * children — уже отрендеренный на сервере markdown;
 * footer — показывается только после раскрытия (например, самооценка).
 */
export function AnswerReveal({
  children,
  footer,
}: {
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <div className="rounded-lg border border-dashed p-6 text-center">
        <p className="mb-3 text-sm text-muted-foreground">
          Сначала сформулируйте ответ самостоятельно — вслух или письменно, как
          на интервью.
        </p>
        <Button onClick={() => setOpen(true)}>
          <Eye className="size-4" />
          Показать ответ
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {children}
      {footer}
      <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
        <EyeOff className="size-4" />
        Скрыть ответ
      </Button>
    </div>
  );
}
