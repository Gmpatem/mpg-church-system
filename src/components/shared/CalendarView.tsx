"use client";

import { useEffect, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { getLabel, eventTypeLabels } from "@/lib/display-maps";

export interface CalendarViewEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  event_type: string;
  location?: string | null;
  is_all_day: boolean;
}

interface CalendarViewProps {
  events: CalendarViewEvent[];
  showViewToggle?: boolean;
  emptyMessage?: string;
}

function formatListDate(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatListTime(iso: string, isAllDay: boolean) {
  if (isAllDay) return "All day";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

function groupEventsByDate(events: CalendarViewEvent[]) {
  const groups: Record<string, CalendarViewEvent[]> = {};
  for (const event of events) {
    const dateKey = event.start.split("T")[0] ?? event.start.slice(0, 10);
    if (!groups[dateKey]) groups[dateKey] = [];
    groups[dateKey].push(event);
  }
  return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
}

function ListView({ events, emptyMessage }: { events: CalendarViewEvent[]; emptyMessage: string }) {
  const grouped = groupEventsByDate(events);

  if (grouped.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-slate-500">{emptyMessage}</p>
    );
  }

  return (
    <div className="space-y-6">
      {grouped.map(([dateKey, dateEvents]) => (
        <div key={dateKey}>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            {formatListDate(dateKey)}
          </p>
          <div className="space-y-2">
            {dateEvents.map((event) => (
              <div
                key={event.id}
                className="rounded-xl border border-slate-200 bg-white px-4 py-3 space-y-1"
              >
                <p className="text-sm font-semibold text-slate-900">{event.title}</p>
                <p className="text-xs text-slate-500">
                  {formatListTime(event.start, event.is_all_day)}
                  {" · "}
                  {event.location?.trim() ? event.location : "No location"}
                  {" · "}
                  {getLabel(eventTypeLabels, event.event_type)}
                </p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function CalendarView({
  events,
  showViewToggle = true,
  emptyMessage = "No events scheduled.",
}: CalendarViewProps) {
  const [view, setView] = useState<"calendar" | "list">("calendar");

  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setView("list");
    }
  }, []);

  const fcEvents = events.map((event) => ({
    id: event.id,
    title: event.title,
    start: event.start,
    end: event.end,
    allDay: event.is_all_day,
  }));

  return (
    <div>
      {showViewToggle && (
        <div className="mb-4 flex gap-2">
          <button
            type="button"
            onClick={() => setView("calendar")}
            className={
              view === "calendar"
                ? "rounded-xl bg-slate-950 px-3 py-1.5 text-xs font-medium text-white"
                : "rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
            }
          >
            Calendar
          </button>
          <button
            type="button"
            onClick={() => setView("list")}
            className={
              view === "list"
                ? "rounded-xl bg-slate-950 px-3 py-1.5 text-xs font-medium text-white"
                : "rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
            }
          >
            List
          </button>
        </div>
      )}

      {view === "list" ? (
        <ListView events={events} emptyMessage={emptyMessage} />
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white p-2">
          {events.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-500">{emptyMessage}</p>
          ) : (
            <FullCalendar
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              height="auto"
              headerToolbar={{
                left: "prev,next today",
                center: "title",
                right: "dayGridMonth,timeGridWeek",
              }}
              events={fcEvents}
              eventTimeFormat={{
                hour: "numeric",
                minute: "2-digit",
                meridiem: "short",
              }}
              eventClick={(info) => {
                info.jsEvent.preventDefault();
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}
