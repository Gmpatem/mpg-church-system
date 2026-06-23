"use client";

import type { ReactNode } from "react";
import { ChevronLeft, ChevronRight, MoreVertical, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils/cn";
import { formatSignedAmount, formatTreasuryAmount } from "./utils";

export function TreasurySummaryStrip({
  items,
}: {
  items: Array<{
    label: string;
    value: ReactNode;
    hint?: ReactNode;
    icon?: ReactNode;
    tone?: "green" | "amber" | "red" | "blue" | "purple" | "neutral";
  }>;
}) {
  return (
    <section className="rounded-xl border border-border bg-background px-5 py-4 shadow-sm">
      <div className="flex min-w-0 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {items.map((item, index) => (
          <div key={item.label} className="flex min-w-[220px] flex-1 shrink-0 items-stretch">
            {index > 0 ? <Separator orientation="vertical" className="mx-5 h-auto self-stretch" /> : null}
            <div className="flex min-w-0 items-center gap-4">
              {item.icon ? (
                <div className={cn(
                  "flex size-14 shrink-0 items-center justify-center rounded-full",
                  item.tone === "amber" && "bg-amber-50 text-amber-700",
                  item.tone === "red" && "bg-red-50 text-red-700",
                  item.tone === "blue" && "bg-blue-50 text-blue-700",
                  item.tone === "purple" && "bg-violet-50 text-violet-700",
                  item.tone === "neutral" && "bg-muted text-muted-foreground",
                  (!item.tone || item.tone === "green") && "bg-emerald-50 text-primary"
                )}>
                  {item.icon}
                </div>
              ) : null}
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-muted-foreground">{item.label}</p>
                <p className="mt-1 truncate text-2xl font-semibold leading-none tabular-nums text-foreground">
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

export function TreasuryToolbar({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("flex min-w-0 flex-wrap items-center gap-2 rounded-xl border border-border bg-background p-3 shadow-sm", className)}>
      {children}
    </div>
  );
}

export function TreasurySearchField({
  value,
  onChange,
  placeholder,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  className?: string;
}) {
  return (
    <div className={cn("relative min-w-[220px] flex-1", className)}>
      <label className="sr-only">{placeholder}</label>
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-10 rounded-lg bg-background pl-9"
      />
    </div>
  );
}

export function TreasuryFilterSelect({
  label,
  value,
  onValueChange,
  options,
  className,
}: {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  className?: string;
}) {
  return (
    <Select value={value || "__all"} onValueChange={(next) => onValueChange(next === "__all" ? "" : next)}>
      <SelectTrigger aria-label={label} className={cn("h-10 w-[150px] rounded-lg bg-background", className)}>
        <SelectValue placeholder={label} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="__all">{label}</SelectItem>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function TreasuryStatusBadge({ status }: { status?: string | null }) {
  const normalized = String(status || "unknown").toLowerCase();
  const tone =
    ["active", "approved", "processed", "completed", "success", "remitted"].includes(normalized)
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : ["pending", "warning", "open", "allocated"].includes(normalized)
        ? "border-amber-200 bg-amber-50 text-amber-700"
        : ["rejected", "critical", "failed", "void", "cancelled"].includes(normalized)
          ? "border-red-200 bg-red-50 text-red-700"
          : ["notice", "info"].includes(normalized)
            ? "border-blue-200 bg-blue-50 text-blue-700"
            : "border-border bg-muted text-muted-foreground";

  return (
    <Badge variant="outline" className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", tone)}>
      <span className="mr-1.5 size-1.5 rounded-full bg-current" aria-hidden="true" />
      {normalized.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase())}
    </Badge>
  );
}

export function TreasuryAmount({
  value,
  direction,
}: {
  value: number | string | null | undefined;
  direction?: "inflow" | "outflow" | "neutral" | "signed";
}) {
  const amount = Number(value || 0);
  const text = direction === "signed" ? formatSignedAmount(amount) : formatTreasuryAmount(amount);

  return (
    <span
      className={cn(
        "tabular-nums",
        direction === "inflow" && "font-semibold text-primary",
        direction === "outflow" && "font-semibold text-red-600",
        direction === "signed" && amount > 0 && "font-semibold text-primary",
        direction === "signed" && amount < 0 && "font-semibold text-red-600",
        (!direction || direction === "neutral" || amount === 0) && "font-semibold text-foreground"
      )}
    >
      {text}
    </span>
  );
}

export function TreasuryPanel({
  title,
  action,
  children,
  className,
  contentClassName,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}) {
  return (
    <section className={cn("min-w-0 rounded-xl border border-border bg-background shadow-sm", className)}>
      <div className="flex min-h-14 items-center justify-between gap-3 border-b border-border px-5 py-3">
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        {action}
      </div>
      <div className={cn("min-w-0 overflow-x-auto", contentClassName)}>{children}</div>
    </section>
  );
}

export function TreasuryEmptyState({
  title,
  message,
  action,
}: {
  title: string;
  message: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex min-h-[220px] flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/40 px-6 py-10 text-center">
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">{message}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function TreasuryPagination({ label }: { label: string }) {
  return (
    <div className="flex min-h-[64px] items-center justify-between border-t border-border px-5 py-3 text-sm text-muted-foreground">
      <p>{label}</p>
      <nav className="flex items-center gap-2" aria-label="Treasury pagination">
        <Button type="button" variant="outline" size="icon" className="size-9 rounded-lg" disabled aria-label="Previous page">
          <ChevronLeft className="size-4" aria-hidden="true" />
        </Button>
        <Button type="button" size="icon" className="size-9 rounded-lg" aria-current="page" aria-label="Page 1">
          1
        </Button>
        <Button type="button" variant="outline" size="icon" className="size-9 rounded-lg" disabled aria-label="Next page">
          <ChevronRight className="size-4" aria-hidden="true" />
        </Button>
      </nav>
    </div>
  );
}

export function TreasuryRowActions({ children, label }: { children?: ReactNode; label: string }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="ghost" size="icon" className="size-8 rounded-lg" aria-label={label}>
          <MoreVertical className="size-4" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52 rounded-lg">
        {children ?? <DropdownMenuItem disabled>No actions available</DropdownMenuItem>}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
};
