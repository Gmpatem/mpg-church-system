"use client";

import { CheckCircle2, Loader2 } from "lucide-react";
import { useFormStatus } from "react-dom";
import { cn } from "@/lib/utils/cn";
import { Button, type ButtonProps } from "@/components/ui/button";

interface ChurchLoadingButtonProps extends ButtonProps {
  pending?: boolean;
  state?: "idle" | "pending" | "success";
  loadingLabel?: string;
  successLabel?: string;
}

export function ChurchLoadingButton({
  pending,
  state = "idle",
  loadingLabel = "Saving",
  successLabel = "Saved",
  disabled,
  children,
  className,
  ...props
}: ChurchLoadingButtonProps) {
  const formStatus = useFormStatus();
  const isPending = pending ?? (formStatus.pending || state === "pending");
  const isSuccess = !isPending && state === "success";

  return (
    <Button
      className={cn("relative", className)}
      disabled={disabled || isPending}
      aria-busy={isPending ? "true" : undefined}
      {...props}
    >
      <span className="inline-grid min-w-0 items-center justify-items-center">
        <span
          className={cn(
            "col-start-1 row-start-1 inline-flex min-w-0 items-center gap-2 transition-opacity",
            isPending || isSuccess ? "opacity-0" : "opacity-100"
          )}
        >
          {children}
        </span>
        <span
          className={cn(
            "col-start-1 row-start-1 inline-flex min-w-0 items-center gap-2 transition-opacity",
            isPending ? "opacity-100" : "opacity-0"
          )}
          aria-hidden={!isPending}
        >
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          <span>{loadingLabel}</span>
        </span>
        <span
          className={cn(
            "col-start-1 row-start-1 inline-flex min-w-0 items-center gap-2 transition-opacity",
            isSuccess ? "opacity-100" : "opacity-0"
          )}
          aria-hidden={!isSuccess}
        >
          <CheckCircle2 className="size-4" aria-hidden="true" />
          <span>{successLabel}</span>
        </span>
      </span>
    </Button>
  );
}
