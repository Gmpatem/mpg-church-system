"use client";

import Link from "next/link";

interface EventCalendarProps {
  churchSlug: string;
  items: Array<{
    id: string;
    title: string;
    start_datetime: string;
    end_datetime: string;
    status: string;
    event_type: string;
    department_names: string[];
  }>;
}

function formatDateLabel(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  const yyyy = date.getUTCFullYear();
  const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(date.getUTCDate()).padStart(2, "0");

  return `${yyyy}-${mm}-${dd}`;
}

function formatTimeLabel(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  const hh = String(date.getUTCHours()).padStart(2, "0");
  const mi = String(date.getUTCMinutes()).padStart(2, "0");

  return `${hh}:${mi} UTC`;
}

export function EventCalendar({ churchSlug, items }: EventCalendarProps) {
  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 bg-white px-6 py-10 text-sm text-gray-600">
        No events available for the calendar view.
      </div>
    );
  }

  const grouped = items.reduce((acc: Record<string, typeof items>, item) => {
    const key = formatDateLabel(item.start_datetime);
    acc[key] = acc[key] ?? [];
    acc[key].push(item);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      {Object.entries(grouped).map(([dateLabel, events]) => (
        <div key={dateLabel} className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-800">
            {dateLabel}
          </div>

          <div className="divide-y divide-gray-200">
            {events.map((event) => (
              <Link
                key={event.id}
                href={`/c/${churchSlug}/events?eventId=${event.id}&tab=detail`}
                className="block px-4 py-4 hover:bg-gray-50"
              >
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="font-medium text-gray-900">{event.title}</div>
                    <div className="mt-1 text-sm text-gray-600">
                      {event.event_type.replaceAll("_", " ")}
                      {event.department_names.length > 0 ? ` • ${event.department_names.join(", ")}` : ""}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-700">
                      {formatTimeLabel(event.start_datetime)} to {formatTimeLabel(event.end_datetime)}
                    </span>
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
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
