import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AppHeader } from "@/components/app-header";
import { AppSidebar } from "@/components/app-sidebar";
import { UserMenu } from "@/components/user-menu";
import { countDueQuestions } from "@/features/review/queries";

export default async function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await auth();
  if (!session?.user) redirect("/signin");

  const reviewDueCount = session.user.id
    ? await countDueQuestions(session.user.id)
    : 0;

  return (
    <div className="flex min-h-svh flex-col">
      <AppHeader
        userSlot={<UserMenu user={session.user} />}
        reviewDueCount={reviewDueCount}
      />
      <div className="flex flex-1">
        <aside className="hidden w-56 shrink-0 border-r md:block">
          <div className="sticky top-14">
            <AppSidebar reviewDueCount={reviewDueCount} />
          </div>
        </aside>
        <main className="flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
