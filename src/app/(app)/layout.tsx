import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AppHeader } from "@/components/app-header";
import { AppSidebar } from "@/components/app-sidebar";
import { UserMenu } from "@/components/user-menu";

export default async function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await auth();
  if (!session?.user) redirect("/signin");

  return (
    <div className="flex min-h-svh flex-col">
      <AppHeader userSlot={<UserMenu user={session.user} />} />
      <div className="flex flex-1">
        <aside className="hidden w-56 shrink-0 border-r md:block">
          <div className="sticky top-14">
            <AppSidebar />
          </div>
        </aside>
        <main className="flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
