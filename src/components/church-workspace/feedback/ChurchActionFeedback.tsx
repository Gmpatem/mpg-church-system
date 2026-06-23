"use client";

import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Info,
  Loader2,
  WifiOff,
  X,
} from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import { ChurchButton, ChurchIconButton } from "../primitives/ChurchButton";
import type { ChurchFeedbackVariant } from "../types";

interface ChurchActionFeedbackProps {
  variant?: ChurchFeedbackVariant;
  title: ReactNode;
  description?: ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  onDismiss?: () => void;
  busy?: boolean;
  className?: string;
  children?: ReactNode;
}

const variantStyles: Record<
  ChurchFeedbackVariant,
  { container: string; icon: string; iconNode: ReactNode; role: "status" | "alert" }
> = {
  success: {
    container: "border-primary/25 bg-primary/5 text-foreground",
    icon: "text-primary",
    iconNode: <CheckCircle2 className="size-4" aria-hidden="true" />,
    role: "status",
  },
  error: {
    container: "border-destructive/30 bg-destructive/5 text-foreground",
    icon: "text-destructive",
    iconNode: <AlertCircle className="size-4" aria-hidden="true" />,
    role: "alert",
  },
  warning: {
    container: "border-border bg-accent/55 text-foreground",
    icon: "text-foreground",
    iconNode: <AlertTriangle className="size-4" aria-hidden="true" />,
    role: "alert",
  },
  info: {
    container: "border-border bg-muted/60 text-foreground",
    icon: "text-muted-foreground",
    iconNode: <Info className="size-4" aria-hidden="true" />,
    role: "status",
  },
  offline: {
    container: "border-border bg-muted/60 text-foreground",
    icon: "text-muted-foreground",
    iconNode: <WifiOff className="size-4" aria-hidden="true" />,
    role: "status",
  },
  progress: {
    container: "border-primary/20 bg-primary/5 text-foreground",
    icon: "text-primary",
    iconNode: <Loader2 className="size-4 animate-spin" aria-hidden="true" />,
    role: "status",
  },
};

export function ChurchActionFeedback({
  variant = "info",
  title,
  description,
  actionLabel,
  onAction,
  onDismiss,
  busy = false,
  className,
  children,
}: ChurchActionFeedbackProps) {
  const styles = variantStyles[variant];

  return (
    <section
      role={styles.role}
      aria-live={styles.role === "alert" ? "assertive" : "polite"}
      aria-busy={busy || variant === "progress" ? "true" : undefined}
      className={cn(
        "flex min-w-0 items-start gap-3 rounded-lg border px-4 py-3 text-sm shadow-sm",
        styles.container,
        className
      )}
    >
      <span className={cn("mt-0.5 shrink-0", styles.icon)}>
        {styles.iconNode}
      </span>
      <div className="min-w-0 flex-1">
        <div className="font-medium leading-5">{title}</div>
        {description ? (
          <div className="mt-1 leading-5 text-muted-foreground">
            {description}
          </div>
        ) : null}
        {children ? <div className="mt-3">{children}</div> : null}
      </div>
      {actionLabel && onAction ? (
        <ChurchButton
          type="button"
          size="sm"
          variant={variant === "error" ? "destructive" : "outline"}
          className="shrink-0"
          onClick={onAction}
        >
          {actionLabel}
        </ChurchButton>
      ) : null}
      {onDismiss ? (
        <ChurchIconButton
          type="button"
          size="icon"
          variant="ghost"
          aria-label="Dismiss message"
          className="size-8 shrink-0"
          onClick={onDismiss}
        >
          <X className="size-4" aria-hidden="true" />
        </ChurchIconButton>
      ) : null}
    </section>
  );
}
