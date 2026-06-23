"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SmallGroupsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-w-0">
      <section className="rounded-2xl border border-border bg-background px-6 py-10 text-center shadow-sm">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <AlertTriangle className="size-5" aria-hidden="true" />
        </div>
        <h1 className="mt-4 text-lg font-semibold text-foreground">
          Small Groups could not be loaded.
        </h1>
        <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
          {error.message || "Try again or return to the workspace later."}
        </p>
        <Button type="button" onClick={reset} className="mt-6 h-10 gap-2 rounded-lg">
          <RotateCcw className="size-4" aria-hidden="true" />
          Try Again
        </Button>
      </section>
    </div>
  );
}
