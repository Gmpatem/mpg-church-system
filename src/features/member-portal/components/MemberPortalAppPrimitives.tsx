import Link from "next/link";
import type { ComponentType, ReactNode } from "react";
import { Bell, ChevronRight, Church } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";

type IconComponent = ComponentType<{ className?: string }>;

export function getInitials(value: string) {
  const parts = value.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "M";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

export function getFirstName(value: string) {
  return value.trim().split(/\s+/).filter(Boolean)[0] ?? "Member";
}

function parseDate(value: string | null | undefined) {
  if (!value) return null;
  const normalized = /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00` : value;
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDateParts(value: string | null | undefined) {
  const date = parseDate(value) ?? new Date();

  return {
    month: date.toLocaleDateString(undefined, { month: "short" }).toUpperCase(),
    day: date.toLocaleDateString(undefined, { day: "2-digit" }),
    weekday: date.toLocaleDateString(undefined, { weekday: "short" }).toUpperCase(),
  };
}

export function formatCompactDate(value: string | null | undefined) {
  const date = parseDate(value);
  if (!date) return "Today";

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export function formatReadableDate(value: string | null | undefined) {
  const date = parseDate(value);
  if (!date) return "Not scheduled";

  return date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function formatClockTime(value: string | null | undefined) {
  if (!value) return "Time TBA";

  if (/^\d{2}:\d{2}/.test(value)) {
    const [hours = "0", minutes = "00"] = value.split(":");
    const date = new Date();
    date.setHours(Number(hours), Number(minutes), 0, 0);
    return date.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    });
  }

  const date = parseDate(value);
  if (!date) return value;

  return date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function MemberPortalChurchMark({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex size-12 shrink-0 items-center justify-center rounded-full bg-emerald-950 text-amber-300 shadow-sm",
        className
      )}
    >
      <Church className="size-6" />
    </div>
  );
}

export function MemberPortalNotificationBell({ light = false }: { light?: boolean }) {
  return (
    <button
      type="button"
      className={cn(
        "mobile-touch-feedback relative flex size-10 shrink-0 items-center justify-center rounded-full",
        light ? "text-white hover:bg-white/10" : "bg-white text-emerald-950 shadow-sm hover:bg-amber-50"
      )}
      aria-label="Notifications"
    >
      <Bell className="size-5" />
      <span className="absolute right-2 top-2 size-2.5 rounded-full bg-red-500 ring-2 ring-white" />
    </button>
  );
}

export function MemberPortalAvatar({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  return (
    <Avatar className={cn("size-14 border-4 border-white bg-emerald-100 shadow-sm", className)}>
      <AvatarFallback className="bg-emerald-100 text-base font-semibold text-emerald-950">
        {getInitials(name)}
      </AvatarFallback>
    </Avatar>
  );
}

export function MemberPortalCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mobile-fade-up rounded-[22px] border border-amber-100 bg-white p-4 shadow-sm shadow-amber-950/5",
        className
      )}
    >
      {children}
    </div>
  );
}

export function MemberPortalSectionHeader({
  title,
  href,
  actionLabel = "View all",
}: {
  title: string;
  href?: string;
  actionLabel?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h2 className="text-base font-semibold text-slate-950">{title}</h2>
      {href ? (
        <Link href={href} className="text-xs font-medium text-emerald-900">
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}

export function MemberPortalDateBlock({
  value,
  className,
}: {
  value: string | null | undefined;
  className?: string;
}) {
  const parts = formatDateParts(value);

  return (
    <div
      className={cn(
        "flex w-16 shrink-0 flex-col items-center justify-center border-r border-amber-100 py-2 text-center",
        className
      )}
    >
      <span className="text-xs font-medium text-red-700">{parts.month}</span>
      <span className="text-3xl font-semibold leading-none text-slate-950">{parts.day}</span>
      <span className="mt-1 text-xs font-medium text-slate-700">{parts.weekday}</span>
    </div>
  );
}

export function MemberPortalSegmentedControl({
  items,
  className,
}: {
  items: Array<{ label: string; active?: boolean }>;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex gap-1 overflow-x-auto rounded-2xl bg-white/90 p-1 shadow-sm shadow-amber-950/5",
        className
      )}
    >
      {items.map((item) => (
        <span
          key={item.label}
          className={cn(
            "mobile-touch-feedback inline-flex min-h-9 shrink-0 items-center justify-center whitespace-nowrap rounded-xl px-4 text-xs font-medium",
            item.active
              ? "bg-emerald-950 text-white shadow-sm"
              : "text-slate-600 hover:bg-amber-50 hover:text-emerald-950"
          )}
        >
          {item.label}
        </span>
      ))}
    </div>
  );
}

export function MemberPortalStatusPill({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "success" | "warning" | "gold" | "neutral";
}) {
  return (
    <Badge
      variant="secondary"
      className={cn(
        "border-transparent px-2.5 py-1 text-xs font-medium shadow-none",
        tone === "success" && "bg-emerald-50 text-emerald-900",
        tone === "warning" && "bg-orange-50 text-orange-800",
        tone === "gold" && "bg-amber-50 text-amber-800",
        tone === "neutral" && "bg-slate-100 text-slate-700"
      )}
    >
      {children}
    </Badge>
  );
}

export function MemberPortalIconBubble({
  icon: Icon,
  className,
}: {
  icon: IconComponent;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex size-14 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-950",
        className
      )}
    >
      <Icon className="size-6" />
    </div>
  );
}

export function MemberPortalListRow({
  icon: Icon,
  label,
  detail,
  href,
}: {
  icon: IconComponent;
  label: string;
  detail?: string;
  href?: string;
}) {
  const content = (
    <>
      <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-950">
        <Icon className="size-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-slate-950">{label}</p>
        {detail ? <p className="truncate text-xs text-slate-500">{detail}</p> : null}
      </div>
      <ChevronRight className="size-4 shrink-0 text-emerald-950" />
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="mobile-touch-feedback flex min-h-[52px] items-center gap-3 px-3 py-2.5"
      >
        {content}
      </Link>
    );
  }

  return <div className="flex min-h-[52px] items-center gap-3 px-3 py-2.5">{content}</div>;
}

