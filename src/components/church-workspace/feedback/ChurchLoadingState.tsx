import { Loader2 } from "lucide-react";

export function ChurchLoadingState() {
  return (
    <div className="church-workspace flex min-h-[320px] items-center justify-center bg-[hsl(var(--church-bg))] text-muted-foreground">
      <div className="flex items-center gap-3 rounded-xl border border-border bg-background px-4 py-3 text-sm shadow-sm">
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        <span>Loading workspace</span>
      </div>
    </div>
  );
}
