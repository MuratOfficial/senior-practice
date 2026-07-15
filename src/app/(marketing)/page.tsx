import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";
import { navItems } from "@/config/nav";

export default function LandingPage() {
  return (
    <div className="flex min-h-svh flex-col">
      <header className="flex h-14 items-center justify-between px-4 md:px-8">
        <span className="font-semibold tracking-tight">
          Senior<span className="text-primary">Practice</span>
        </span>
        <ThemeToggle />
      </header>

      <main className="flex flex-1 flex-col items-center justify-center gap-12 px-4 py-16">
        <div className="max-w-2xl text-center">
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
            Подготовка к интервью{" "}
            <span className="text-primary">Senior Software Engineer</span>
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Теория, задачи с автопроверкой, spaced repetition и mock-интервью.
            JavaScript/TypeScript, Python, React, Node.js — фронтенд и бэкенд.
          </p>
          <Button
            size="lg"
            className="mt-8"
            nativeButton={false}
            render={<Link href="/dashboard" />}
          >
            Начать подготовку
            <ArrowRight className="size-4" />
          </Button>
        </div>

        <div className="grid w-full max-w-4xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {navItems
            .filter((item) => item.href !== "/dashboard")
            .map((item) => (
              <Card key={item.href}>
                <CardHeader>
                  <item.icon className="size-5 text-primary" />
                  <CardTitle className="text-base">{item.title}</CardTitle>
                  <CardDescription>{item.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
        </div>
      </main>
    </div>
  );
}
