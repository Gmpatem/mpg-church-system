"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import type { ChurchCalendarEvent, CalendarDepartmentOption } from "@/features/calendar/types";

function badgeClasses(status: string) {
  switch (status) {
    case "scheduled":
      return "bg-blue-50 text-blue-700";
    case "completed":
      return "bg-green-50 text-green-700";
    case "cancelled":
      return "bg-red-50 text-red-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
}

export default function ChurchCalendarClient({
  churchSlug,
  timezone,
  events,
  departments,
}: {
  churchSlug: string;
  timezone: string;
  events: ChurchCalendarEvent[];
  departments: CalendarDepartmentOption[];
}) {
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>("");

  const filteredEvents = useMemo(() => {
    const visible = selectedDepartmentId
      ? events.filter((event) => event.departmentId === selectedDepartmentId)
      : events;

    const colorMap = new Map(departments.map((d) => [d.id, d.color]));

    return visible.map((event) => ({
      id: event.id,
      title: event.title,
      start: event.start,
      end: event.end,
      allDay: event.allDay,
      backgroundColor: event.departmentId ? colorMap.get(event.departmentId) ?? "#2563eb" : "#334155",
      borderColor: event.departmentId ? colorMap.get(event.departmentId) ?? "#2563eb" : "#334155",
      extendedProps: {
        status: event.status,
        eventType: event.eventType,
        location: event.location,
        departmentName: event.departmentName,
        description: event.description,
      },
    }));
  }, [events, departments, selectedDepartmentId]);

  const upcomingEvents = useMemo(() => {
    return events
      .filter((event) => !selectedDepartmentId || event.departmentId === selectedDepartmentId)
      .slice(0, 8);
  }, [events, selectedDepartmentId]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Church Calendar</h2>
          <p className="mt-1 text-sm text-gray-600">
            Unified calendar for church-wide and department activities.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-sm text-gray-600">Department</label>
          <select
            value={selectedDepartmentId}
            onChange={(e) => setSelectedDepartmentId(e.target.value)}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All departments</option>
            {departments.map((department) => (
              <option key={department.id} value={department.id}>
                {department.department_name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-4">
        <div className="xl:col-span-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            timeZone={timezone}
            height="auto"
            headerToolbar={{
              left: "prev,next today",
              center: "title",
              right: "dayGridMonth,timeGridWeek",
            }}
            events={filteredEvents}
            eventTimeFormat={{
              hour: "numeric",
              minute: "2-digit",
              meridiem: "short",
            }}
            eventClick={(info) => {
              info.jsEvent.preventDefault();
            }}
          />
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900">Departments</h3>
            <div className="mt-4 space-y-3">
              {departments.map((department) => (
                <div key={department.id} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: department.color }}
                    />
                    <span className="text-sm text-gray-700">{department.department_name}</span>
                  </div>
                </div>
              ))}
              {departments.length === 0 ? (
                <p className="text-sm text-gray-500">No departments found.</p>
              ) : null}
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900">Upcoming Events</h3>
            <div className="mt-4 space-y-4">
              {upcomingEvents.map((event) => (
                <div key={event.id} className="rounded-lg border border-gray-200 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-gray-900">{event.title}</p>
                    <span className={"rounded-full px-2 py-0.5 text-[11px] font-medium " + badgeClasses(event.status)}>
                      {event.status}
                    </span>
                  </div>

                  <p className="mt-1 text-xs text-gray-500">
                    {event.departmentName ?? "General church"} • {event.eventType}
                  </p>

                  <p className="mt-2 text-sm text-gray-700">
                    {event.start}
                  </p>

                  {event.location ? (
                    <p className="mt-1 text-xs text-gray-500">{event.location}</p>
                  ) : null}

                  {event.departmentId ? (
                    <div className="mt-3">
                      <Link
                        href={`/c/${churchSlug}/departments/${event.departmentId}`}
                        className="text-xs font-medium text-blue-600 hover:text-blue-800"
                      >
                        View Department
                      </Link>
                    </div>
                  ) : null}
                </div>
              ))}

              {upcomingEvents.length === 0 ? (
                <p className="text-sm text-gray-500">No upcoming events yet.</p>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
