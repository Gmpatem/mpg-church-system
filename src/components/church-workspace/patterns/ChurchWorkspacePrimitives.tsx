import Link from "next/link";
import type { ReactNode } from "react";
import { AlertTriangle, CircleDot, Info } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils/cn";

export type ChurchWorkspaceTabItem = {
  key: string;
  label: string;
  href: string;
  count?: number | string | null;
  unavailable?: boolean;
};

export function ChurchWorkspaceHeader({
  eyebrow,
  title,
  description,
  meta,
  actions,
  className,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  meta?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("flex min-w-0 flex-col gap-4 md:flex-row md:items-start md:justify-between", className)}>
      <div className="min-w-0">
        {eyebrow ? (
          <div className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-primary">
            {eyebrow}
          </div>
        ) : null}
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">{title}</h1>
        {description ? (
          <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">{description}</p>
        ) : null}
        {meta ? <div className="mt-3 flex flex-wrap items-center gap-2">{meta}</div> : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  );
}

export function ChurchWorkspaceTabBar({
  tabs,
  activeKey,
  ariaLabel,
}: {
  tabs: ChurchWorkspaceTabItem[];
  activeKey: string;
  ariaLabel: string;
}) {
  return (
    <nav className="rounded-xl border border-border bg-background shadow-sm" aria-label={ariaLabel}>
      <div role="tablist" className="flex min-w-0 overflow-x-auto px-3">
        {tabs.map((tab) => {
          const isActive = tab.key === activeKey;
          return (
            <Link
              key={tab.key}
              href={tab.href}
              role="tab"
              aria-selected={isActive}
              aria-disabled={tab.unavailable || undefined}
              className={cn(
                "relative inline-flex h-12 shrink-0 items-center gap-2 px-5 text-sm font-medium text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
                isActive && "text-primary",
                tab.unavailable && "pointer-events-none opacity-55"
              )}
            >
              <span>{tab.label}</span>
              {tab.count !== undefined && tab.count !== null ? (
                <span className="rounded-full border border-border bg-muted px-2 py-0.5 text-[11px] tabular-nums text-muted-foreground">
                  {tab.count}
                </span>
              ) : null}
              {isActive ? (
                <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-primary" aria-hidden="true" />
              ) : null}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function ChurchSummaryStrip({
  items,
}: {
  items: Array<{
    label: string;
    value: ReactNode;
    hint?: ReactNode;
    icon?: ReactNode;
    muted?: boolean;
  }>;
}) {
  return (
    <section className="rounded-xl border border-border bg-background px-5 py-4 shadow-sm">
      <div className="flex min-w-0 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {items.map((item, index) => (
          <div key={item.label} className="flex min-w-[180px] flex-1 shrink-0 items-stretch">
            {index > 0 ? <Separator orientation="vertical" className="mx-5 h-auto self-stretch" /> : null}
            <div className="flex min-w-0 items-center gap-3">
              {item.icon ? (
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  {item.icon}
                </div>
              ) : null}
              <div className="min-w-0">
                <p className="truncate text-xs font-medium text-muted-foreground">{item.label}</p>
                <p
                  className={cn(
                    "mt-1 truncate text-2xl font-semibold leading-none tabular-nums text-foreground",
                    item.muted && "text-muted-foreground"
                  )}
                >
                  {item.value}
                </p>
                {item.hint ? <p className="mt-2 truncate text-xs text-muted-foreground">{item.hint}</p> : null}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function ChurchWorkspacePanel({
  title,
  description,
  action,
  children,
  className,
  contentClassName,
}: {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}) {
  return (
    <section className={cn("min-w-0 rounded-xl border border-border bg-background shadow-sm", className)}>
      <div className="flex min-h-14 items-start justify-between gap-3 border-b border-border px-5 py-4">
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-foreground">{title}</h2>
          {description ? <p className="mt-1 text-sm leading-5 text-muted-foreground">{description}</p> : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      <div className={cn("min-w-0", contentClassName)}>{children}</div>
    </section>
  );
}

export function ChurchEmptyState({
  title,
  message,
  action,
}: {
  title: ReactNode;
  message: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex min-h-[220px] flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/40 px-6 py-10 text-center">
      <CircleDot className="size-9 text-primary/70" aria-hidden="true" />
      <h3 className="mt-4 text-base font-semibold text-foreground">{title}</h3>
      <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">{message}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function ChurchUnavailableState({
  title,
  message,
  tone = "info",
}: {
  title: ReactNode;
  message: ReactNode;
  tone?: "info" | "warning";
}) {
  const Icon = tone === "warning" ? AlertTriangle : Info;
  return (
    <div
      className={cn(
        "rounded-xl border px-4 py-3 text-sm",
        tone === "warning"
          ? "border-amber-200 bg-amber-50 text-amber-900"
          : "border-border bg-muted/40 text-muted-foreground"
      )}
    >
      <div className="flex gap-3">
        <Icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        <div className="min-w-0">
          <p className="font-medium text-foreground">{title}</p>
          <p className="mt-1 leading-6">{message}</p>
        </div>
      </div>
    </div>
  );
}

export function ChurchStatusPill({
  status,
  label,
}: {
  status?: string | null;
  label?: string;
}) {
  const normalized = String(status || "unknown").toLowerCase();
  const tone =
    ["active", "approved", "published", "claimed", "completed", "success"].includes(normalized)
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : ["pending", "draft", "pending_approval", "changes_requested"].includes(normalized)
        ? "border-amber-200 bg-amber-50 text-amber-700"
        : ["rejected", "failed", "expired"].includes(normalized)
          ? "border-red-200 bg-red-50 text-red-700"
          : ["archived", "cancelled", "revoked", "inactive"].includes(normalized)
            ? "border-border bg-muted text-muted-foreground"
            : "border-blue-200 bg-blue-50 text-blue-700";
  const display = label ?? normalized.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());

  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium", tone)}>
      <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
      {display}
    </span>
  );
}
