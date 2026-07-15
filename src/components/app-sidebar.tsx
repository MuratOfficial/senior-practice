"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { navItems } from "@/config/nav";

export function AppSidebar({
  onNavigate,
  reviewDueCount = 0,
}: {
  onNavigate?: () => void;
  /** Сколько вопросов ждут повторения — бейдж у пункта «Повторение» */
  reviewDueCount?: number;
}) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1 p-2">
      {navItems.map((item) => {
        const active =
          pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
            )}
          >
            <item.icon className="size-4 shrink-0" />
            {item.title}
            {item.href === "/review" && reviewDueCount > 0 && (
              <span className="ml-auto rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground">
                {reviewDueCount}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
