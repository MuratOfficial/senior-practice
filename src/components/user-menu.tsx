import { LogOut } from "lucide-react";
import { signOut } from "@/lib/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

export function UserMenu({
  user,
}: {
  user: { name?: string | null; email?: string | null; image?: string | null };
}) {
  const initials =
    user.name
      ?.split(" ")
      .map((part) => part[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?";

  return (
    <div className="flex items-center gap-2">
      <Avatar className="size-8">
        {user.image && <AvatarImage src={user.image} alt={user.name ?? ""} />}
        <AvatarFallback className="text-xs">{initials}</AvatarFallback>
      </Avatar>
      <span className="hidden text-sm text-muted-foreground sm:inline">
        {user.name ?? user.email}
      </span>
      <form
        action={async () => {
          "use server";
          await signOut({ redirectTo: "/" });
        }}
      >
        <Button type="submit" variant="ghost" size="icon" aria-label="Выйти">
          <LogOut className="size-4" />
        </Button>
      </form>
    </div>
  );
}
