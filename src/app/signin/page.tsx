import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth, hasDevLogin, oauthProviderIds, signIn } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

export const metadata: Metadata = { title: "Вход" };

export default async function SignInPage() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  return (
    <main className="flex min-h-svh items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Вход в Senior Practice</CardTitle>
          <CardDescription>
            Прогресс, повторения и история решений привязаны к аккаунту.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {oauthProviderIds.map((provider) => (
            <form
              key={provider.id}
              action={async () => {
                "use server";
                await signIn(provider.id, { redirectTo: "/dashboard" });
              }}
            >
              <Button type="submit" className="w-full" variant="outline">
                Войти через {provider.name}
              </Button>
            </form>
          ))}

          {oauthProviderIds.length === 0 && !hasDevLogin && (
            <p className="text-sm text-muted-foreground">
              OAuth-провайдеры не настроены. Заполните AUTH_GITHUB_* или
              AUTH_GOOGLE_* в <code>.env</code> (см. <code>.env.example</code>).
            </p>
          )}

          {hasDevLogin && (
            <>
              {oauthProviderIds.length > 0 && <Separator />}
              <form
                className="space-y-3"
                action={async (formData: FormData) => {
                  "use server";
                  await signIn("dev-login", {
                    name: String(formData.get("name") ?? ""),
                    email: String(formData.get("email") ?? ""),
                    redirectTo: "/dashboard",
                  });
                }}
              >
                <p className="text-xs text-muted-foreground">
                  Dev-вход (только локально, без OAuth):
                </p>
                <Input name="name" placeholder="Имя" defaultValue="Dev User" />
                <Input
                  name="email"
                  type="email"
                  placeholder="Email"
                  defaultValue="dev@localhost.dev"
                />
                <Button type="submit" className="w-full">
                  Войти как dev-пользователь
                </Button>
              </form>
            </>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
