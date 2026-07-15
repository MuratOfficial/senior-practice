import { Badge } from "@/components/ui/badge";

export function ComingSoon({
  title,
  description,
  phase,
}: {
  title: string;
  description: string;
  phase: string;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        <Badge variant="secondary">{phase}</Badge>
      </div>
      <p className="max-w-prose text-muted-foreground">{description}</p>
    </div>
  );
}
