"use client";

import type { ReactNode } from "react";
import {
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Search,
} from "lucide-react";
import { ChurchAvatar, ChurchBadge } from "@/components/church-workspace";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils/cn";

export const pageSize = 8;

export function initialsFromName(name?: string | null) {
  return (
    name
      ?.split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0))
      .join("")
      .toUpperCase() || "DP"
  );
}

export function formatDate(value?: string | null, options?: Intl.DateTimeFormatOptions) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleDateString(
    "en-US",
    options ?? {
      month: "short",
      day: "numeric",
      year: "numeric",
    }
  );
}

export function formatDateTime(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatCurrency(value: number | null | undefined) {
  const amount = Number(value ?? 0);
  return `${amount.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })} XAF`;
}

export function formatNumber(value: number | null | undefined) {
  return Number(value ?? 0).toLocaleString("en-US");
}

export function normalizeStatusLabel(value?: string | null) {
  if (!value) return "Unknown";
  return value.replace(/_/g, " ").replace(/-/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function StatusPill({
  status,
  label,
  className,
}: {
  status?: string | null;
  label?: string;
  className?: string;
}) {
  const normalized = (status ?? "unknown").toLowerCase();
  const tone =
    normalized === "active" ||
    normalized === "approved" ||
    normalized === "published" ||
    normalized === "processed" ||
    normalized === "completed"
      ? "border-primary/20 bg-primary/10 text-primary"
      : normalized === "pending" ||
          normalized === "pending_approval" ||
          normalized === "draft" ||
          normalized === "in-progress"
        ? "border-amber-200 bg-amber-50 text-amber-800"
        : normalized === "rejected" ||
            normalized === "cancelled" ||
            normalized === "overdue"
          ? "border-destructive/20 bg-destructive/10 text-destructive"
          : "border-border bg-muted text-muted-foreground";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
        tone,
        className
      )}
    >
      <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
      {label ?? normalizeStatusLabel(normalized)}
    </span>
  );
}

export function QuietBadge({ children }: { children: ReactNode }) {
  return (
    <ChurchBadge className="border-border bg-muted text-muted-foreground hover:bg-muted">
      {children}
    </ChurchBadge>
  );
}

export function SearchField({
  id,
  value,
  onChange,
  placeholder,
  className,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  className?: string;
}) {
  return (
    <div className={cn("relative min-w-0", className)}>
      <label htmlFor={id} className="sr-only">
        {placeholder}
      </label>
      <Search
        className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden="true"
      />
      <Input
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-10 rounded-lg pl-9"
      />
    </div>
  );
}

export function NativeSelect({
  label,
  value,
  onChange,
  options,
  allLabel,
  className,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  allLabel: string;
  className?: string;
}) {
  return (
    <label className={cn("min-w-0", className)}>
      <span className="sr-only">{label}</span>
      <select
        aria-label={label}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none transition focus-visible:ring-2 focus-visible:ring-ring"
      >
        <option value="">{allLabel}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function DepartmentAvatarBadge({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-semibold text-primary ring-1 ring-primary/15",
        className
      )}
    >
      {initialsFromName(name)}
    </span>
  );
}

export function PersonIdentity({
  name,
  email,
  subtitle,
}: {
  name: string;
  email?: string | null;
  subtitle?: string | null;
}) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <ChurchAvatar name={name} email={email ?? undefined} className="size-9" />
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-foreground">{name}</p>
        <p className="truncate text-xs text-muted-foreground">{subtitle || email || "No contact"}</p>
      </div>
    </div>
  );
}

export function RowActions({
  label,
  children,
}: {
  label: string;
  children?: ReactNode;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="ghost" size="icon" className="size-8 rounded-md" aria-label={label}>
          <MoreVertical aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52 rounded-lg">
        {children ?? <DropdownMenuItem disabled>No actions available</DropdownMenuItem>}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function EmptyState({
  title,
  message,
  action,
}: {
  title: string;
  message: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex min-h-[260px] flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/40 px-6 py-10 text-center">
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">{message}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function RegistryPagination({
  label,
  page,
  pageCount,
  onPageChange,
}: {
  label: string;
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
}) {
  const safePageCount = Math.max(1, pageCount);

  return (
    <div className="flex min-h-[68px] flex-col gap-3 border-t border-border px-5 py-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
      <p>{label}</p>
      <nav className="flex items-center gap-2" aria-label="Registry pagination">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-9 rounded-lg"
          disabled={page <= 1}
          aria-label="Previous page"
          onClick={() => onPageChange(Math.max(1, page - 1))}
        >
          <ChevronLeft aria-hidden="true" />
        </Button>
        <Button type="button" size="icon" className="size-9 rounded-lg" aria-current="page" aria-label={`Page ${page}`}>
          {page}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-9 rounded-lg"
          disabled={page >= safePageCount}
          aria-label="Next page"
          onClick={() => onPageChange(Math.min(safePageCount, page + 1))}
        >
          <ChevronRight aria-hidden="true" />
        </Button>
      </nav>
    </div>
  );
}

export function paginate<T>(rows: T[], page: number, size = pageSize) {
  const safePage = Math.max(1, page);
  const start = (safePage - 1) * size;
  return rows.slice(start, start + size);
}

export function includesNeedle(values: Array<string | number | null | undefined>, needle: string) {
  const normalized = needle.trim().toLowerCase();
  if (!normalized) return true;

  return values
    .filter((value) => value !== null && value !== undefined)
    .some((value) => String(value).toLowerCase().includes(normalized));
}
