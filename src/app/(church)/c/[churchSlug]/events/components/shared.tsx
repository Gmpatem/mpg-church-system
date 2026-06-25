"use client";

import { CalendarDays, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";
import {
  formatEventDateRange,
  getEventStatusLabel,
  getEventStatusTone,
  getEventTypeLabel,
  getEventWorkflowLabel,
  getEventWorkflowTone,
  getStatusDotClass,
} from "@/features/events/presentation";
import type {
  EventDepartmentSummary,
  EventOperationalStatus,
  EventWorkflowState,
  EventsLocale,
} from "@/features/events/types";

export function EventStatusBadge({
  status,
  locale = "en",
}: {
  status: EventOperationalStatus | string;
  locale?: EventsLocale;
}) {
  return (
    <Badge variant="outline" className={cn("gap-1.5 rounded-full border px-2.5 py-1", getEventStatusTone(status))}>
      <span className={cn("size-1.5 rounded-full", getStatusDotClass(status))} aria-hidden="true" />
      {getEventStatusLabel(status, locale)}
    </Badge>
  );
}

export function EventWorkflowBadge({
  workflowState,
  locale = "en",
}: {
  workflowState: EventWorkflowState | string;
  locale?: EventsLocale;
}) {
  return (
    <Badge variant="outline" className={cn("rounded-full border px-2.5 py-1", getEventWorkflowTone(workflowState))}>
      {getEventWorkflowLabel(workflowState, locale)}
    </Badge>
  );
}

export function EventDepartmentBadges({
  departments,
  limit = 3,
}: {
  departments: EventDepartmentSummary[];
  limit?: number;
}) {
  if (departments.length === 0) {
    return <span className="text-sm text-muted-foreground">General church</span>;
  }

  const visible = departments.slice(0, limit);
  const overflow = departments.length - visible.length;

  return (
    <div className="flex min-w-0 flex-wrap gap-1.5">
      {visible.map((department) => (
        <Badge
          key={department.id}
          variant="secondary"
          className={cn(
            "max-w-[12rem] rounded-full px-2 py-0.5 font-normal",
            !department.isActive && "opacity-70"
          )}
        >
          <span className="truncate">
            {department.name}
            {department.isPrimary ? " (primary)" : ""}
          </span>
        </Badge>
      ))}
      {overflow > 0 ? (
        <Badge variant="outline" className="rounded-full px-2 py-0.5 font-normal">
          +{overflow}
        </Badge>
      ) : null}
    </div>
  );
}

export function EventDateLine({
  start,
  end,
  isAllDay,
  timezone,
  locale,
}: {
  start: string;
  end: string;
  isAllDay?: boolean;
  timezone?: string;
  locale?: EventsLocale;
}) {
  return (
    <span className="inline-flex min-w-0 items-center gap-2 text-sm text-muted-foreground">
      <CalendarDays className="size-4 shrink-0" aria-hidden="true" />
      <span className="truncate">
        {formatEventDateRange(start, end, { allDay: isAllDay, timezone, locale })}
      </span>
    </span>
  );
}

export function EventLocationLine({ location }: { location?: string | null }) {
  if (!location) return null;

  return (
    <span className="inline-flex min-w-0 items-center gap-2 text-sm text-muted-foreground">
      <MapPin className="size-4 shrink-0" aria-hidden="true" />
      <span className="truncate">{location}</span>
    </span>
  );
}

export function EventTypeLabel({
  eventType,
  locale = "en",
}: {
  eventType: string;
  locale?: EventsLocale;
}) {
  return <span>{getEventTypeLabel(eventType, locale)}</span>;
}

export function EmptyWorkspacePanel({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-dashed border-border bg-muted/30 px-6 py-8 text-center">
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{description}</p>
      {children ? <div className="mt-4 flex justify-center">{children}</div> : null}
    </div>
  );
}
