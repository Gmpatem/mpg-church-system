"use client";

import { useActionState } from "react";
import { deleteEventAction, updateEventStatusAction } from "../actions";
import type { ActionState, ChurchEventRecord } from "../types";

const initialState: ActionState = { ok: false };

interface EventDetailProps {
  churchSlug: string;
  event: ChurchEventRecord | null;
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

export function EventDetail({ churchSlug, event }: EventDetailProps) {
  const [deleteState, deleteAction, deletePending] = useActionState(deleteEventAction, initialState);
  const [statusState, statusAction, statusPending] = useActionState(updateEventStatusAction, initialState);

  if (!event) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 bg-white px-6 py-10 text-sm text-gray-600">
        Select an event from All Events or Calendar to view details.
      </div>
    );
  }

  return (
    <div className="space-y-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">{event.title}</h3>
          <div className="mt-2 flex flex-wrap gap-2">
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-700">
              {event.event_type.replaceAll("_", " ")}
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
            {event.departments?.map((department: any) => (
  <span
    key={department.id}
    className="rounded-full bg-purple-100 px-2.5 py-1 text-xs font-semibold text-purple-700"
  >
    {department.name}
  </span>
))}
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
          <div className="text-xs uppercase tracking-wide text-gray-500">Start</div>
          <div className="mt-2 text-sm font-medium text-gray-900">{formatDateTime(event.start_datetime)}</div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
          <div className="text-xs uppercase tracking-wide text-gray-500">End</div>
          <div className="mt-2 text-sm font-medium text-gray-900">{formatDateTime(event.end_datetime)}</div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
          <div className="text-xs uppercase tracking-wide text-gray-500">Location</div>
          <div className="mt-2 text-sm font-medium text-gray-900">{event.location ?? "—"}</div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
          <div className="text-xs uppercase tracking-wide text-gray-500">All Day</div>
          <div className="mt-2 text-sm font-medium text-gray-900">{event.is_all_day ? "Yes" : "No"}</div>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
        <div className="text-xs uppercase tracking-wide text-gray-500">Description</div>
        <div className="mt-2 whitespace-pre-wrap text-sm text-gray-800">{event.description ?? "No description."}</div>
      </div>

      {statusState?.error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {statusState.error}
        </div>
      ) : null}

      {statusState?.ok && statusState?.message ? (
        <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
          {statusState.message}
        </div>
      ) : null}

      {deleteState?.error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {deleteState.error}
        </div>
      ) : null}

      {deleteState?.ok && deleteState?.message ? (
        <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
          {deleteState.message}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <form action={statusAction}>
          <input type="hidden" name="churchSlug" value={churchSlug} />
          <input type="hidden" name="eventId" value={event.id} />
          <input type="hidden" name="status" value="scheduled" />
          <button
            type="submit"
            disabled={statusPending}
            className="rounded-md border border-blue-300 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100 disabled:opacity-60"
          >
            Mark Scheduled
          </button>
        </form>

        <form action={statusAction}>
          <input type="hidden" name="churchSlug" value={churchSlug} />
          <input type="hidden" name="eventId" value={event.id} />
          <input type="hidden" name="status" value="completed" />
          <button
            type="submit"
            disabled={statusPending}
            className="rounded-md border border-green-300 bg-green-50 px-4 py-2 text-sm font-medium text-green-700 hover:bg-green-100 disabled:opacity-60"
          >
            Mark Completed
          </button>
        </form>

        <form action={statusAction}>
          <input type="hidden" name="churchSlug" value={churchSlug} />
          <input type="hidden" name="eventId" value={event.id} />
          <input type="hidden" name="status" value="cancelled" />
          <button
            type="submit"
            disabled={statusPending}
            className="rounded-md border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-800 hover:bg-amber-100 disabled:opacity-60"
          >
            Cancel Event
          </button>
        </form>

        <form action={deleteAction}>
          <input type="hidden" name="churchSlug" value={churchSlug} />
          <input type="hidden" name="eventId" value={event.id} />
          <button
            type="submit"
            disabled={deletePending}
            className="rounded-md border border-red-300 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100 disabled:opacity-60"
          >
            Delete Event
          </button>
        </form>
      </div>
    </div>
  );
}


