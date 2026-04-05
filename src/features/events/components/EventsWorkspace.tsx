"use client";

import Link from "next/link";
import type { ChurchEventRecord, EventListItem } from "../types";
import { createEventAction, updateEventAction } from "../actions";
import { EventFilters } from "./EventFilters";
import { EventForm } from "./EventForm";
import { EventList } from "./EventList";
import { EventCalendar } from "./EventCalendar";
import { EventDetail } from "./EventDetail";

type WorkspaceTab = "all_events" | "calendar" | "form" | "detail";

interface EventsWorkspaceProps {
  churchSlug: string;
  events: EventListItem[];
  calendarItems: Array<{
    id: string;
    title: string;
    start_datetime: string;
    end_datetime: string;
    status: string;
    event_type: string;
    department_name: string | null;
  }>;
  selectedEvent: ChurchEventRecord | null;
  selectedEventId?: string | null;
  activeTab?: WorkspaceTab;
  filters: {
    q: string;
    status: string;
    eventType: string;
    departmentId: string;
    dateFrom: string;
    dateTo: string;
  };
  options: {
    departments: Array<{ id: string; name: string; code: string | null; is_active: boolean }>;
    eventTypes: string[];
    statuses: string[];
  };
}

function buildTabHref(
  churchSlug: string,
  tab: WorkspaceTab,
  selectedEventId: string | null | undefined,
  filters: Record<string, string>
) {
  const params = new URLSearchParams();
  params.set("tab", tab);
  if (selectedEventId) params.set("eventId", selectedEventId);

  Object.entries(filters).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });

  return `/c/${churchSlug}/events?${params.toString()}`;
}

export function EventsWorkspace({
  churchSlug,
  events,
  calendarItems,
  selectedEvent,
  selectedEventId,
  activeTab = "all_events",
  filters,
  options,
}: EventsWorkspaceProps) {
  const tabs: Array<{ id: WorkspaceTab; label: string }> = [
    { id: "all_events", label: "All Events" },
    { id: "calendar", label: "Calendar" },
    { id: "form", label: selectedEvent ? "Edit / Create Event" : "Create Event" },
    { id: "detail", label: "Event Detail" },
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <Link
                key={tab.id}
                href={buildTabHref(churchSlug, tab.id, selectedEvent?.id ?? selectedEventId, filters)}
                className={`rounded-md px-4 py-2 text-sm font-medium transition ${
                  active ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>
      </div>

      {selectedEvent ? (
        <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
          Selected event:
          <span className="ml-2 font-semibold">{selectedEvent.title}</span>
        </div>
      ) : (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          No event selected yet. Use All Events or Calendar to choose one, or create a new event.
        </div>
      )}

      <EventFilters
        churchSlug={churchSlug}
        departments={options.departments}
        eventTypes={options.eventTypes}
        filters={filters}
      />

      {activeTab === "all_events" ? (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Link
              href={buildTabHref(churchSlug, "form", null, filters)}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Create Event
            </Link>
          </div>

          <EventList
            churchSlug={churchSlug}
            events={events}
            selectedEventId={selectedEventId}
          />
        </div>
      ) : null}

      {activeTab === "calendar" ? (
        <EventCalendar
          churchSlug={churchSlug}
          items={calendarItems.map((item) => ({
            ...item,
            department_names: item.department_name ? [item.department_name] : [],
          }))}
        />
      ) : null}

      {activeTab === "form" ? (
        <EventForm
          churchSlug={churchSlug}
          action={selectedEvent ? updateEventAction : createEventAction}
          departments={options.departments}
          eventTypes={options.eventTypes}
          initialValues={selectedEvent}
          submitLabel={selectedEvent ? "Update Event" : "Create Event"}
        />
      ) : null}

      {activeTab === "detail" ? (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Link
              href={buildTabHref(churchSlug, "form", null, filters)}
              className="rounded-md border border-blue-300 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100"
            >
              Create Another Event
            </Link>
          </div>

          <EventDetail
            churchSlug={churchSlug}
            event={selectedEvent}
          />
        </div>
      ) : null}
    </div>
  );
}

