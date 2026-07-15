"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";

export function AppHeader({
  userSlot,
  reviewDueCount = 0,
}: {
  userSlot?: React.ReactNode;
  reviewDueCount?: number;
}) {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-2 border-b bg-background/95 px-4 backdrop-blur">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger
          render={
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              aria-label="Меню"
            />
          }
        >
          <Menu className="size-5" />
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0 pt-10">
          <SheetTitle className="sr-only">Навигация</SheetTitle>
          <AppSidebar
            onNavigate={() => setOpen(false)}
            reviewDueCount={reviewDueCount}
          />
        </SheetContent>
      </Sheet>

      <Link href="/dashboard" className="font-semibold tracking-tight">
        Senior<span className="text-primary">Practice</span>
      </Link>

      <div className="ml-auto flex items-center gap-2">
        <ThemeToggle />
        {userSlot}
      </div>
    </header>
  );
}
