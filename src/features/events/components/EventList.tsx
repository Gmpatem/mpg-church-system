"use client";

import Link from "next/link";
import type { EventListItem } from "../types";

interface EventListProps {
  churchSlug: string;
  events: EventListItem[];
  selectedEventId?: string | null;
}

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  const yyyy = date.getUTCFullYear();
  const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(date.getUTCDate()).padStart(2, "0");
  const hh = String(date.getUTCHours()).padStart(2, "0");
  const mi = String(date.getUTCMinutes()).padStart(2, "0");

  return `${yyyy}-${mm}-${dd} ${hh}:${mi} UTC`;
}

export function EventList({ churchSlug, events, selectedEventId }: EventListProps) {
  if (events.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 bg-white px-6 py-10 text-sm text-gray-600">
        No events found for the current filters.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Event</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Type</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Departments</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Time</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Status</th>
            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {events.map((event) => {
            const isSelected = event.id === selectedEventId;

            return (
              <tr key={event.id} className={isSelected ? "bg-blue-50" : ""}>
                <td className="px-4 py-3 align-top">
                  <div className="font-medium text-gray-900">{event.title}</div>
                  {event.location ? <div className="mt-1 text-sm text-gray-600">{event.location}</div> : null}
                </td>
                <td className="px-4 py-3 align-top text-sm text-gray-600">{event.event_type.replaceAll("_", " ")}</td>
                <td className="px-4 py-3 align-top text-sm text-gray-600">
                  {event.departments && event.departments.length > 0
                    ? event.departments.map((d) => d.name).join(", ")
                    : "—"}
                </td>
                <td className="px-4 py-3 align-top text-sm text-gray-600">
                  <div>{formatDateTime(event.start_datetime)}</div>
                  <div className="mt-1 text-xs text-gray-500">to {formatDateTime(event.end_datetime)}</div>
                </td>
                <td className="px-4 py-3 align-top">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                      event.status === "scheduled"
                        ? "bg-blue-100 text-blue-700"
                        : event.status === "completed"
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {event.status}
                  </span>
                </td>
                <td className="px-4 py-3 align-top text-right">
                  <Link
                    href={`/c/${churchSlug}/events?eventId=${event.id}&tab=detail`}
                    className="text-sm font-medium text-blue-600 hover:underline"
                  >
                    {isSelected ? "Selected" : "Open"}
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

