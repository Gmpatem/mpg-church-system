"use client";

import Link from "next/link";
import { ArrowRight, CalendarDays, CheckCircle2, ClipboardCheck, Layers3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import type { EventsWorkspaceData } from "@/features/events/types";
import { getEventTypeLabel } from "@/features/events/presentation";
import {
  EmptyWorkspacePanel,
  EventDateLine,
  EventDepartmentBadges,
  EventStatusBadge,
  EventWorkflowBadge,
} from "./shared";

export function EventsOverviewTab({
  churchSlug,
  data,
  onOpenEvents,
  onOpenCalendar,
}: {
  churchSlug: string;
  data: EventsWorkspaceData;
  onOpenEvents: () => void;
  onOpenCalendar: () => void;
}) {
  const statusTotal = Math.max(data.summary.totalEvents, 1);

  return (
    <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="min-w-0 rounded-lg border border-border bg-background p-4 shadow-sm">
        <div className="flex min-w-0 flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-foreground">Operations Snapshot</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Current event volume, workflow attention, and ministry coverage.
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <Button type="button" variant="outline" className="h-9 gap-2" onClick={onOpenEvents}>
              <Layers3 className="size-4" aria-hidden="true" />
              Registry
            </Button>
            <Button type="button" variant="outline" className="h-9 gap-2" onClick={onOpenCalendar}>
              <CalendarDays className="size-4" aria-hidden="true" />
              Calendar
            </Button>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-4">
          <MetricTile label="Total events" value={data.summary.totalEvents} />
          <MetricTile label="Upcoming" value={data.summary.upcomingCount} />
          <MetricTile label="Awaiting approval" value={data.summary.pendingApprovalCount} />
          <MetricTile label="Department linked" value={data.summary.departmentLinkedCount} />
        </div>

        <Separator className="my-5" />

        <div className="grid gap-5 lg:grid-cols-2">
          <Breakdown title="Status" rows={data.overview.statusBreakdown} total={statusTotal} />
          <Breakdown title="Workflow" rows={data.overview.workflowBreakdown} total={statusTotal} />
        </div>
      </div>

      <aside className="min-w-0 rounded-lg border border-border bg-background p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <ClipboardCheck className="size-4 text-primary" aria-hidden="true" />
          <h2 className="text-sm font-semibold text-foreground">Needs Attention</h2>
        </div>
        <div className="mt-4 flex flex-col gap-3">
          {data.overview.needsAttention.length > 0 ? (
            data.overview.needsAttention.slice(0, 5).map((event) => (
              <Link
                key={event.id}
                href={`/c/${churchSlug}/events?tab=events&eventId=${event.id}`}
                className="rounded-lg border border-border p-3 transition hover:bg-accent"
              >
                <div className="flex min-w-0 items-start justify-between gap-2">
                  <span className="min-w-0 truncate text-sm font-medium text-foreground">{event.title}</span>
                  <EventWorkflowBadge workflowState={event.workflowState} locale={data.locale} />
                </div>
                <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">
                  {event.approvalNote || getEventTypeLabel(event.eventType, data.locale)}
                </p>
              </Link>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No event workflow items need attention.</p>
          )}
        </div>
      </aside>

      <div className="min-w-0 rounded-lg border border-border bg-background p-4 shadow-sm xl:col-span-2">
        <div className="flex min-w-0 flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Upcoming Events</h2>
            <p className="mt-1 text-sm text-muted-foreground">The next scheduled church activities.</p>
          </div>
          <Button type="button" variant="ghost" className="h-9 gap-2 self-start md:self-auto" onClick={onOpenCalendar}>
            Open calendar
            <ArrowRight className="size-4" aria-hidden="true" />
          </Button>
        </div>

        <div className="mt-4 grid min-w-0 gap-3 lg:grid-cols-2">
          {data.overview.upcoming.length > 0 ? (
            data.overview.upcoming.map((event) => (
              <Link
                key={event.id}
                href={`/c/${churchSlug}/events?tab=events&eventId=${event.id}`}
                className="min-w-0 rounded-lg border border-border p-4 transition hover:bg-accent"
              >
                <div className="flex min-w-0 items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-semibold text-foreground">{event.title}</h3>
                    <p className="mt-1 text-xs text-muted-foreground">{getEventTypeLabel(event.eventType, data.locale)}</p>
                  </div>
                  <EventStatusBadge status={event.status} locale={data.locale} />
                </div>
                <div className="mt-3 flex flex-col gap-2">
                  <EventDateLine
                    start={event.startDateTime}
                    end={event.endDateTime}
                    isAllDay={event.isAllDay}
                    timezone={data.church.timezone}
                    locale={data.locale}
                  />
                  <EventDepartmentBadges departments={event.departments} />
                </div>
              </Link>
            ))
          ) : (
            <div className="lg:col-span-2">
              <EmptyWorkspacePanel
                title="No upcoming events"
                description="Create a scheduled event to populate the upcoming calendar view."
              />
            </div>
          )}
        </div>
      </div>

      <div className="grid min-w-0 gap-4 xl:col-span-2 lg:grid-cols-2">
        <section className="min-w-0 rounded-lg border border-border bg-background p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-foreground">Department Participation</h2>
          <div className="mt-4 flex flex-col gap-3">
            {data.overview.departmentParticipation.length > 0 ? (
              data.overview.departmentParticipation.map((department) => (
                <div key={department.departmentId} className="flex items-center justify-between gap-3">
                  <span className="min-w-0 truncate text-sm text-foreground">{department.departmentName}</span>
                  <span className="shrink-0 text-sm font-medium text-muted-foreground">{department.eventCount}</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No departments are linked to events yet.</p>
            )}
          </div>
        </section>

        <section className="min-w-0 rounded-lg border border-border bg-background p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-foreground">Recently Updated</h2>
          <div className="mt-4 flex flex-col gap-3">
            {data.overview.recentlyUpdated.length > 0 ? (
              data.overview.recentlyUpdated.slice(0, 6).map((event) => (
                <Link
                  key={event.id}
                  href={`/c/${churchSlug}/events?tab=events&eventId=${event.id}`}
                  className="flex min-w-0 items-center justify-between gap-3 rounded-md px-2 py-1.5 transition hover:bg-accent"
                >
                  <span className="min-w-0 truncate text-sm text-foreground">{event.title}</span>
                  <CheckCircle2 className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                </Link>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No updated events yet.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function MetricTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border bg-muted/30 p-3">
      <p className="text-xs font-medium uppercase text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-foreground">{value}</p>
    </div>
  );
}

function Breakdown({
  title,
  rows,
  total,
}: {
  title: string;
  rows: Array<{ label: string; count: number }>;
  total: number;
}) {
  return (
    <section className="min-w-0">
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <div className="mt-3 flex flex-col gap-3">
        {rows.map((row) => (
          <div key={row.label}>
            <div className="mb-1 flex items-center justify-between gap-3 text-sm">
              <span className="text-muted-foreground">{row.label}</span>
              <span className="font-medium text-foreground">{row.count}</span>
            </div>
            <Progress value={(row.count / total) * 100} className="h-2" />
          </div>
        ))}
      </div>
    </section>
  );
}
