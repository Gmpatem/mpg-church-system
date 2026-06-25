"use client";

import Link from "next/link";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import timeGridPlugin from "@fullcalendar/timegrid";
import { ArrowLeft, ArrowRight, CalendarDays, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { getCalendarViewLabel, getEventTypeLabel } from "@/features/events/presentation";
import type { EventCalendarItem, EventsCalendarView, EventsWorkspaceData } from "@/features/events/types";
import {
  EmptyWorkspacePanel,
  EventDateLine,
  EventDepartmentBadges,
  EventStatusBadge,
  EventWorkflowBadge,
} from "./shared";

const fullCalendarViewByKey: Record<Exclude<EventsCalendarView, "list">, string> = {
  month: "dayGridMonth",
  week: "timeGridWeek",
  day: "timeGridDay",
};

export function EventsCalendarTab({
  churchSlug,
  data,
}: {
  churchSlug: string;
  data: EventsWorkspaceData;
}) {
  const view = data.filters.calendarView;
  const visibleEvents = data.calendar.items;

  return (
    <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
      <section className="min-w-0 rounded-lg border border-border bg-background p-4 shadow-sm">
        <div className="flex min-w-0 flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-foreground">Calendar</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {visibleEvents.length} events in the selected {getCalendarViewLabel(view, data.locale).toLowerCase()} range.
            </p>
          </div>
          <div className="flex min-w-0 flex-wrap gap-2">
            <Button asChild variant="outline" size="sm" className="gap-2">
              <Link href={buildCalendarHref(churchSlug, data, shiftCalendarDate(data.filters.calendarDate, view, -1))}>
                <ArrowLeft className="size-4" aria-hidden="true" />
                Previous
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="gap-2">
              <Link href={buildCalendarHref(churchSlug, data, new Date().toISOString().slice(0, 10))}>
                Today
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="gap-2">
              <Link href={buildCalendarHref(churchSlug, data, shiftCalendarDate(data.filters.calendarDate, view, 1))}>
                Next
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </div>

        <div className="mt-4 flex min-w-0 flex-wrap gap-2">
          {(["month", "week", "day", "list"] as EventsCalendarView[]).map((calendarView) => (
            <Button
              key={calendarView}
              asChild
              variant={calendarView === view ? "default" : "outline"}
              size="sm"
              className="h-9"
            >
              <Link href={buildCalendarHref(churchSlug, data, data.filters.calendarDate, calendarView)}>
                {calendarView === "list" ? <List className="mr-2 size-4" aria-hidden="true" /> : null}
                {getCalendarViewLabel(calendarView, data.locale)}
              </Link>
            </Button>
          ))}
        </div>

        <Separator className="my-4" />

        {view === "list" ? (
          <CalendarList churchSlug={churchSlug} data={data} events={visibleEvents} />
        ) : (
          <div className="events-calendar min-w-0 overflow-hidden rounded-lg border border-border p-3">
            <FullCalendar
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView={fullCalendarViewByKey[view]}
              initialDate={data.filters.calendarDate}
              timeZone={data.church.timezone}
              height="auto"
              headerToolbar={false}
              events={visibleEvents.map((event) => ({
                id: event.id,
                title: event.title,
                start: event.startDateTime,
                end: event.endDateTime,
                allDay: event.isAllDay,
                backgroundColor: "hsl(var(--primary))",
                borderColor: "hsl(var(--primary))",
                extendedProps: {
                  status: event.status,
                  workflowState: event.workflowState,
                },
              }))}
              eventClick={(info) => {
                info.jsEvent.preventDefault();
                window.location.href = `/c/${churchSlug}/events?tab=events&eventId=${info.event.id}`;
              }}
              eventTimeFormat={{
                hour: "numeric",
                minute: "2-digit",
                meridiem: "short",
              }}
            />
          </div>
        )}
      </section>

      <aside className="min-w-0 rounded-lg border border-border bg-background p-4 shadow-sm xl:sticky xl:top-4 xl:self-start">
        <div className="flex items-center gap-2">
          <CalendarDays className="size-4 text-primary" aria-hidden="true" />
          <h2 className="text-sm font-semibold text-foreground">Range Events</h2>
        </div>
        <div className="mt-4">
          <CalendarList churchSlug={churchSlug} data={data} events={visibleEvents.slice(0, 10)} compact />
        </div>
      </aside>
    </div>
  );
}

function CalendarList({
  churchSlug,
  data,
  events,
  compact = false,
}: {
  churchSlug: string;
  data: EventsWorkspaceData;
  events: EventCalendarItem[];
  compact?: boolean;
}) {
  if (events.length === 0) {
    return (
      <EmptyWorkspacePanel
        title="No events in this range"
        description="Adjust the calendar date, view, or filters to find scheduled events."
      />
    );
  }

  return (
    <div className="flex min-w-0 flex-col gap-3">
      {events.map((event) => (
        <Link
          key={event.id}
          href={`/c/${churchSlug}/events?tab=events&eventId=${event.id}`}
          className="min-w-0 rounded-lg border border-border p-3 transition hover:bg-accent"
        >
          <div className="flex min-w-0 items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="truncate text-sm font-semibold text-foreground">{event.title}</h3>
              <p className="mt-1 text-xs text-muted-foreground">{getEventTypeLabel(event.eventType, data.locale)}</p>
            </div>
            {!compact ? <EventStatusBadge status={event.status} locale={data.locale} /> : null}
          </div>
          <div className="mt-3 flex flex-col gap-2">
            <EventDateLine
              start={event.startDateTime}
              end={event.endDateTime}
              isAllDay={event.isAllDay}
              timezone={data.church.timezone}
              locale={data.locale}
            />
            {!compact ? <EventDepartmentBadges departments={event.departments} /> : null}
            {!compact ? <EventWorkflowBadge workflowState={event.workflowState} locale={data.locale} /> : null}
          </div>
        </Link>
      ))}
    </div>
  );
}

function shiftCalendarDate(dateKey: string, view: EventsCalendarView, step: number) {
  const base = new Date(`${dateKey}T00:00:00.000Z`);
  const date = Number.isNaN(base.getTime()) ? new Date() : base;

  if (view === "week") {
    date.setUTCDate(date.getUTCDate() + step * 7);
  } else if (view === "day") {
    date.setUTCDate(date.getUTCDate() + step);
  } else {
    date.setUTCMonth(date.getUTCMonth() + step);
  }

  return date.toISOString().slice(0, 10);
}

function buildCalendarHref(
  churchSlug: string,
  data: EventsWorkspaceData,
  dateKey: string,
  view: EventsCalendarView = data.filters.calendarView
) {
  const params = new URLSearchParams();
  params.set("tab", "calendar");
  params.set("calendarView", view);
  params.set("calendarDate", dateKey);
  if (data.filters.q) params.set("q", data.filters.q);
  if (data.filters.status !== "all") params.set("status", data.filters.status);
  if (data.filters.workflow !== "all") params.set("workflow", data.filters.workflow);
  if (data.filters.eventType) params.set("eventType", data.filters.eventType);
  if (data.filters.departmentId) params.set("departmentId", data.filters.departmentId);
  return `/c/${churchSlug}/events?${params.toString()}`;
}
