"use client";

import type { ReactNode } from "react";
import {
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils/cn";
import type { PersonSummary, SelectOption } from "./types";

export function formatDate(value?: string | null, options?: Intl.DateTimeFormatOptions) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleDateString("en-US", options ?? {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatTime(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatShortDate(value?: string | null) {
  if (!value) return "Not scheduled";
  return formatDate(value, { month: "short", day: "numeric", year: "numeric" });
}

export function formatWeekdayTime(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleDateString("en-US", {
    weekday: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function monthDayBlock(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return { month: "-", day: "-", line: "-" };
  }

  return {
    month: date.toLocaleDateString("en-US", { month: "short" }).toUpperCase(),
    day: date.toLocaleDateString("en-US", { day: "2-digit" }),
    line: date.toLocaleDateString("en-US", {
      weekday: "short",
      hour: "numeric",
      minute: "2-digit",
    }),
  };
}

export function numberFormat(value: number) {
  return value.toLocaleString("en-US");
}

export function GroupInitialsBadge({
  initials,
  tone = "green",
  className,
}: {
  initials: string;
  tone?: "green" | "blue" | "purple" | "orange" | "red" | "teal";
  className?: string;
}) {
  const classes = {
    green: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    blue: "bg-blue-50 text-blue-700 ring-blue-100",
    purple: "bg-violet-50 text-violet-700 ring-violet-100",
    orange: "bg-orange-50 text-orange-700 ring-orange-100",
    red: "bg-red-50 text-red-700 ring-red-100",
    teal: "bg-teal-50 text-teal-700 ring-teal-100",
  };

  return (
    <span
      className={cn(
        "inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-xs font-semibold ring-1",
        classes[tone],
        className
      )}
    >
      {initials}
    </span>
  );
}

export function PersonAvatar({
  person,
  className,
}: {
  person: PersonSummary | null;
  className?: string;
}) {
  return (
    <Avatar className={cn("size-8 border border-border", className)}>
      <AvatarFallback className="bg-muted text-[11px] font-semibold text-foreground">
        {person?.initials ?? "SG"}
      </AvatarFallback>
    </Avatar>
  );
}

export function AvatarStack({ people, count }: { people: PersonSummary[]; count: number }) {
  const visible = people.slice(0, 3);
  const overflow = Math.max(0, count - visible.length);

  return (
    <div className="flex min-w-0 items-center gap-2">
      <div className="flex shrink-0 -space-x-2">
        {visible.map((person) => (
          <PersonAvatar
            key={person.id}
            person={person}
            className="size-7 border-2 border-background"
          />
        ))}
        {overflow > 0 ? (
          <span className="inline-flex size-7 items-center justify-center rounded-full border-2 border-background bg-muted text-[10px] font-semibold text-muted-foreground">
            +{overflow}
          </span>
        ) : null}
      </div>
      <span className="truncate text-sm text-muted-foreground">{numberFormat(count)}</span>
    </div>
  );
}

export function StatusPill({
  status,
  label,
  className,
}: {
  status: string | null | undefined;
  label?: string;
  className?: string;
}) {
  const normalized = status ?? "unknown";
  const tone =
    normalized === "active" ||
    normalized === "completed" ||
    normalized === "upcoming" ||
    normalized === "contacted"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : normalized === "scheduled" || normalized === "planned"
        ? "border-blue-200 bg-blue-50 text-blue-700"
        : normalized === "in-progress" || normalized === "pending"
          ? "border-amber-200 bg-amber-50 text-amber-700"
          : normalized === "cancelled" || normalized === "inactive"
            ? "border-slate-200 bg-slate-100 text-slate-600"
            : "border-muted bg-muted text-muted-foreground";
  const display = label ?? normalized.replace(/-/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        tone,
        className
      )}
    >
      <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
      {display}
    </span>
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
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
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

export function FilterSelect({
  label,
  value,
  onValueChange,
  options,
  allLabel,
  className,
}: {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  options: SelectOption[];
  allLabel: string;
  className?: string;
}) {
  return (
    <Select
      value={value || "__all"}
      onValueChange={(nextValue) => onValueChange(nextValue === "__all" ? "" : nextValue)}
    >
      <SelectTrigger aria-label={label} className={cn("h-10 rounded-lg bg-background", className)}>
        <SelectValue placeholder={label} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="__all">{allLabel}</SelectItem>
        {options.map((item) => (
          <SelectItem key={item.value} value={item.value}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function FilterButton() {
  return (
    <Button type="button" variant="outline" className="h-10 gap-2 rounded-lg bg-background px-4">
      <SlidersHorizontal className="size-4" aria-hidden="true" />
      Filters
    </Button>
  );
}

export function ClearFiltersButton({ onClick, show }: { onClick: () => void; show: boolean }) {
  if (!show) return null;

  return (
    <Button type="button" variant="ghost" onClick={onClick} className="h-10 gap-2 rounded-lg px-3 text-primary">
      <X className="size-4" aria-hidden="true" />
      Clear
    </Button>
  );
}

export function RegistryPagination({
  label,
  page = 1,
}: {
  label: string;
  page?: number;
}) {
  return (
    <div className="flex min-h-[70px] flex-col gap-3 border-t border-border px-5 py-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
      <p>{label}</p>
      <nav className="flex items-center gap-2" aria-label="Registry pagination">
        <Button type="button" variant="outline" size="icon" className="size-9 rounded-lg" disabled aria-label="Previous page">
          <ChevronLeft className="size-4" aria-hidden="true" />
        </Button>
        <Button type="button" size="icon" className="size-9 rounded-lg" aria-current="page" aria-label={`Page ${page}`}>
          {page}
        </Button>
        <Button type="button" variant="outline" size="icon" className="size-9 rounded-lg" disabled aria-label="Next page">
          <ChevronRight className="size-4" aria-hidden="true" />
        </Button>
      </nav>
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
          <MoreVertical className="size-4" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52 rounded-lg">
        {children ?? <DropdownMenuItem disabled>No actions available</DropdownMenuItem>}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function SelectCheckbox({
  checked,
  label,
  onCheckedChange,
}: {
  checked: boolean;
  label: string;
  onCheckedChange: () => void;
}) {
  return (
    <Checkbox
      checked={checked}
      aria-label={label}
      onClick={(event) => event.stopPropagation()}
      onCheckedChange={onCheckedChange}
      className="data-[state=checked]:border-primary"
    />
  );
}

export function AttendanceMiniBars({
  values,
  percent,
}: {
  values: Array<"present" | "absent" | "unknown">;
  percent: number | null;
}) {
  const accessible = `${percent ?? 0}% attendance across the last four meetings`;

  return (
    <div className="flex items-center gap-2" aria-label={accessible}>
      <div className="flex items-end gap-1" aria-hidden="true">
        {values.map((value, index) => (
          <span
            key={`${value}-${index}`}
            className={cn(
              "block h-5 w-2 rounded-full",
              value === "present" ? "bg-primary" : "bg-muted"
            )}
          />
        ))}
      </div>
      <span className="text-xs text-muted-foreground">{percent === null ? "-" : `${percent}%`}</span>
    </div>
  );
}

export function InfoRow({
  icon,
  label,
  value,
  title,
}: {
  icon?: ReactNode;
  label: string;
  value: ReactNode;
  title?: string;
}) {
  return (
    <div className="grid grid-cols-[20px_minmax(94px,1fr)_minmax(0,1.25fr)] items-start gap-2 text-sm">
      <span className="mt-0.5 text-muted-foreground">{icon}</span>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="min-w-0 text-right font-medium text-foreground" title={title}>
        {value}
      </dd>
    </div>
  );
}

export function SummaryActionRow({
  icon,
  label,
  value,
  onClick,
}: {
  icon?: ReactNode;
  label: string;
  value: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-10 w-full items-center justify-between gap-3 rounded-lg border border-border bg-background px-3 py-2 text-left text-sm transition hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <span className="inline-flex min-w-0 items-center gap-2 font-medium text-foreground">
        <span className="text-muted-foreground">{icon}</span>
        <span className="truncate">{label}</span>
      </span>
      <span className="inline-flex shrink-0 items-center gap-2 text-muted-foreground">
        {value}
        <ChevronRight className="size-4" aria-hidden="true" />
      </span>
    </button>
  );
}

export function EmptyRegistryState({
  title,
  message,
  actionLabel,
  onAction,
}: {
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex min-h-[260px] flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/40 px-6 py-10 text-center">
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">{message}</p>
      {actionLabel && onAction ? (
        <Button type="button" onClick={onAction} className="mt-5 h-10 rounded-lg">
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}

export function TooltipText({ children, label }: { children: ReactNode; label: string }) {
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent className="max-w-xs text-xs">{label}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function MetricStrip({
  items,
}: {
  items: Array<{ label: string; value: ReactNode; icon?: ReactNode; muted?: boolean }>;
}) {
  return (
    <section className="rounded-2xl border border-border bg-background px-5 py-4 shadow-sm">
      <div className="flex min-w-0 items-stretch overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {items.map((item, index) => (
          <div key={item.label} className="flex min-w-[150px] shrink-0 items-stretch">
            {index > 0 ? <Separator orientation="vertical" className="h-auto self-stretch" /> : null}
            <div className="flex min-w-0 flex-1 flex-col justify-center px-5 first:pl-0">
              <p className="flex items-center gap-2 text-[11px] font-medium text-muted-foreground">
                {item.icon}
                <span>{item.label}</span>
              </p>
              <p className={cn("mt-2 text-2xl font-semibold leading-none tabular-nums text-foreground", item.muted && "text-muted-foreground/70")}>
                {item.value}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
