"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { getLabel, eventStatusLabels, workflowStateLabels } from "@/lib/display-maps";
import { useEventDepartments } from "@/features/events/hooks";
import {
  WorkspaceControlRail,
  WorkspaceEmptyState,
  WorkspaceHero,
  WorkspaceSectionCard,
  WorkspaceStatCard,
  WorkspaceTabs,
  type WorkspaceTabItem,
} from "@/components/workspace";
import { EventForm } from "@/features/events/components/EventForm";
import { createEventAction, updateEventAction } from "@/features/events/actions";

const eventTypeLabels: Record<string, string> = {
  worship_service: "Worship Service",
  prayer_meeting: "Prayer Meeting",
  board_meeting: "Board Meeting",
  department_meeting: "Department Meeting",
  youth_meeting: "Youth Meeting",
  evangelism: "Evangelism",
  youth_program: "Youth Program",
  sabbath_school: "Sabbath School",
  community_outreach: "Community Outreach",
  special_program: "Special Program",
  outreach: "Outreach",
  seminar: "Seminar",
  social: "Social Event",
  fundraiser: "Fundraiser",
  other: "Other",
};

type EventsMainTab =
  | "all_events"
  | "create_event"
  | "detail"
  | "edit"
  | "calendar_notes";

interface EventsWorkspaceUnifiedProps {
  churchSlug: string;
  data: {
    church: {
      id: string;
      name: string;
      slug: string;
    };
    filters: {
      q?: string;
      status?: string;
      dateFrom?: string;
      dateTo?: string;
      eventId?: string;
      tab?: string;
    };
    activeTab: EventsMainTab;
    selectedEvent: {
      id: string;
      title: string;
      description?: string | null;
      event_type: string;
      department_id?: string | null;
      location?: string | null;
      start_datetime: string;
      end_datetime: string;
      is_all_day?: boolean;
      status: string;
      workflow_state?: string | null;
      approval_note?: string | null;
      department_name?: string | null;
    } | null;
    stats: {
      totalEvents: number;
      scheduledCount: number;
      completedCount: number;
      cancelledCount: number;
      departmentLinkedCount: number;
      upcomingCount: number;
    };
    events: Array<{
      id: string;
      title: string;
      description?: string | null;
      event_type: string;
      department_id?: string | null;
      location?: string | null;
      start_datetime: string;
      end_datetime: string;
      is_all_day?: boolean;
      status: string;
      workflow_state?: string | null;
      approval_note?: string | null;
      department_name?: string | null;
    }>;
    formOptions: {
      departments: Array<{ id: string; department_name: string; code?: string | null; is_active?: boolean }>;
    };
  };
}

const EVENT_TABS: WorkspaceTabItem[] = [
  { key: "all_events", label: "All Events" },
  { key: "create_event", label: "Create Event" },
  { key: "detail", label: "Event Detail", shortLabel: "Detail" },
  { key: "edit", label: "Edit Event", shortLabel: "Edit" },
  { key: "calendar_notes", label: "Calendar Notes", shortLabel: "Notes" },
];

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function EventStatusBadge({ status }: { status: string }) {
  const statusClasses =
    status === "completed"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
      : status === "cancelled"
        ? "border-rose-200 bg-rose-50 text-rose-800"
        : "border-blue-200 bg-blue-50 text-blue-800";

  return (
    <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${statusClasses}`}>
      {getLabel(eventStatusLabels, status)}
    </span>
  );
}

function EventWorkflowBadge({ value }: { value?: string | null }) {
  if (!value) return null;

  return (
    <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700">
      {getLabel(workflowStateLabels, value)}
    </span>
  );
}

function EventsList({
  churchSlug,
  rows,
}: {
  churchSlug: string;
  rows: EventsWorkspaceUnifiedProps["data"]["events"];
}) {
  return (
    <WorkspaceSectionCard
      title="Event Registry"
      description="Current event records in the selected workspace filter window."
    >
      {rows.length === 0 ? (
        <WorkspaceEmptyState
          title="No events found"
          message="There are no events matching the current filters yet. Create one to activate the events workspace."
          actionLabel="Create Event"
          actionHref={`/c/${churchSlug}/events?tab=create_event`}
        />
      ) : (
        <div className="mobile-stagger space-y-3">
          {rows.map((event) => (
            <div
              key={event.id}
              className="mobile-touch-feedback rounded-xl border border-slate-200 px-4 py-4"
            >
              <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-slate-950">
                      {event.title}
                    </p>
                    <EventStatusBadge status={event.status} />
                    <EventWorkflowBadge value={event.workflow_state} />
                  </div>

                  <p className="mt-1 text-sm text-slate-600">
                    {getLabel(eventTypeLabels, event.event_type)}
                    {event.department_name ? ` • ${event.department_name}` : ""}
                    {event.location ? ` • ${event.location}` : ""}
                  </p>

                  <p className="mt-2 text-xs text-slate-500">
                    {formatDateTime(event.start_datetime)} to {formatDateTime(event.end_datetime)}
                  </p>

                  {event.description ? (
                    <p className="mt-3 text-sm leading-6 text-slate-600">
                      {event.description}
                    </p>
                  ) : null}
                </div>

                <div className="flex shrink-0 flex-wrap gap-2">
                  <Link
                    href={`/c/${churchSlug}/events?eventId=${event.id}&tab=detail`}
                    className="mobile-touch-feedback rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    View
                  </Link>
                  <Link
                    href={`/c/${churchSlug}/events?eventId=${event.id}&tab=edit`}
                    className="mobile-touch-feedback rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    Edit
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </WorkspaceSectionCard>
  );
}

function EventDetailPanel({
  churchSlug,
  event,
}: {
  churchSlug: string;
  event: NonNullable<EventsWorkspaceUnifiedProps["data"]["selectedEvent"]>;
}) {
  return (
    <WorkspaceSectionCard
      title="Event Detail"
      description="Review the selected event without leaving the workspace."
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-lg font-semibold text-slate-950">{event.title}</p>
          <EventStatusBadge status={event.status} />
          <EventWorkflowBadge value={event.workflow_state} />
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Event Type</p>
            <p className="mt-1 text-sm font-medium text-slate-900">{getLabel(eventTypeLabels, event.event_type)}</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Department</p>
            <p className="mt-1 text-sm font-medium text-slate-900">{event.department_name ?? "—"}</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Location</p>
            <p className="mt-1 text-sm font-medium text-slate-900">{event.location ?? "—"}</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">All Day</p>
            <p className="mt-1 text-sm font-medium text-slate-900">{event.is_all_day ? "Yes" : "No"}</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 md:col-span-2">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Schedule</p>
            <p className="mt-1 text-sm font-medium text-slate-900">
              {formatDateTime(event.start_datetime)} to {formatDateTime(event.end_datetime)}
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white px-4 py-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Description</p>
          <p className="mt-2 text-sm leading-6 text-slate-700">
            {event.description?.trim() ? event.description : "No description provided."}
          </p>
        </div>

        {event.approval_note ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-4">
            <p className="text-xs font-medium uppercase tracking-wide text-amber-700">Approval Note</p>
            <p className="mt-2 text-sm leading-6 text-amber-900">{event.approval_note}</p>
          </div>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <Link
            href={`/c/${churchSlug}/events?eventId=${event.id}&tab=edit`}
            className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            Edit Event
          </Link>
          <Link
            href={`/c/${churchSlug}/events`}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Back to List
          </Link>
          <Link
            href={`/c/${churchSlug}/events?tab=create_event`}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Create New
          </Link>
        </div>
      </div>
    </WorkspaceSectionCard>
  );
}

function CalendarNotesPanel({
  stats,
}: {
  stats: EventsWorkspaceUnifiedProps["data"]["stats"];
}) {
  return (
    <div className="grid gap-6 2xl:grid-cols-2">
      <WorkspaceSectionCard
        title="Calendar Operations Notes"
        description="A quick leadership view of how the events workspace is behaving."
      >
        <div className="mobile-stagger space-y-3">
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-sm font-semibold text-slate-900">Upcoming activity</p>
            <p className="mt-1 text-sm text-slate-600">
              {stats.upcomingCount} upcoming scheduled events are currently visible.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-sm font-semibold text-slate-900">Completion posture</p>
            <p className="mt-1 text-sm text-slate-600">
              {stats.completedCount} events are marked completed and {stats.cancelledCount} are marked cancelled.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-sm font-semibold text-slate-900">Department linkage</p>
            <p className="mt-1 text-sm text-slate-600">
              {stats.departmentLinkedCount} events currently have a department connection for reporting and ministry tracking.
            </p>
          </div>
        </div>
      </WorkspaceSectionCard>

      <WorkspaceSectionCard
        title="What this workspace should support next"
        description="This panel keeps the future event operations roadmap visible while the UI becomes unified."
      >
        <div className="mobile-stagger space-y-3 text-sm leading-6 text-slate-600">
          <p className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            Calendar visualization can be added later as a dedicated panel without leaving this workspace.
          </p>
          <p className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            Recurring templates should stay inside this same workspace instead of splitting into separate pages.
          </p>
          <p className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            Reporting hooks are already supported through the events module and unified reports workspace.
          </p>
        </div>
      </WorkspaceSectionCard>
    </div>
  );
}

export function EventsWorkspaceUnified({
  churchSlug,
  data,
}: EventsWorkspaceUnifiedProps) {
  const [activeTab, setActiveTab] = useState<EventsMainTab>(data.activeTab ?? "all_events");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function handleTabChange(nextTab: EventsMainTab) {
    setActiveTab(nextTab);

    const params = new URLSearchParams(searchParams?.toString() ?? "");

    if (nextTab === "all_events") {
      params.delete("tab");
      params.delete("eventId");
    } else {
      params.set("tab", nextTab);

      if (nextTab === "create_event" || nextTab === "calendar_notes") {
        params.delete("eventId");
      } else if (nextTab === "detail" || nextTab === "edit") {
        if (data.selectedEvent?.id) {
          params.set("eventId", data.selectedEvent.id);
        } else {
          params.delete("eventId");
        }
      }
    }

    const nextUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    router.push(nextUrl);
  }

  const needsDepartments = activeTab === "create_event" || activeTab === "edit";
  const deptLoader = useEventDepartments(churchSlug, needsDepartments);

  const mergedDepartments = useMemo(() => {
    return deptLoader.loaded
      ? deptLoader.departments
      : (data.formOptions.departments ?? []);
  }, [deptLoader.loaded, deptLoader.departments, data.formOptions.departments]);

  const filteredEventsSummary = useMemo(() => {
    if (data.filters.q || data.filters.status || data.filters.dateFrom || data.filters.dateTo) {
      return "Filtered view active";
    }
    return "Live workspace";
  }, [data.filters]);

  return (
    <div className="space-y-5 md:space-y-6">
      <WorkspaceHero
        size="compact"
        eyebrow="Events Workspace"
        title="Church Events Workspace"
        description="Plan, record, review, and manage church events in one unified operations workspace."
        badges={[
          filteredEventsSummary,
          `${data.stats.totalEvents} total events`,
          `${data.stats.upcomingCount} upcoming`,
        ]}
        actions={[
          { label: "Create Event", onClick: () => handleTabChange("create_event"), variant: "primary" },
          { label: "Reports", href: `/c/${churchSlug}/reports`, variant: "secondary" },
        ]}
      />

      <div className="mobile-stagger grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-6">
        <WorkspaceStatCard label="Total Events" value={data.stats.totalEvents} hint="Events in current view" />
        <WorkspaceStatCard label="Scheduled" value={data.stats.scheduledCount} hint="Still active on calendar" />
        <WorkspaceStatCard label="Completed" value={data.stats.completedCount} hint="Marked complete" />
        <WorkspaceStatCard label="Cancelled" value={data.stats.cancelledCount} hint="Marked cancelled" />
        <WorkspaceStatCard label="Upcoming" value={data.stats.upcomingCount} hint="Future scheduled items" />
        <WorkspaceStatCard label="Dept Linked" value={data.stats.departmentLinkedCount} hint="Connected to ministries" />
      </div>

      <WorkspaceControlRail
        title="Event Filters"
        description="Search and narrow the workspace without leaving the page."
      >
        <form
          method="get"
          action={`/c/${churchSlug}/events`}
          className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_180px_180px_180px_auto]"
        >
          <div>
            <label htmlFor="q" className="mb-1 block text-sm font-medium text-slate-700">
              Search
            </label>
            <input
              id="q"
              name="q"
              type="text"
              defaultValue={data.filters.q ?? ""}
              placeholder="Search by title, type, or location"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            />
          </div>

          <div>
            <label htmlFor="status" className="mb-1 block text-sm font-medium text-slate-700">
              Status
            </label>
            <select
              id="status"
              name="status"
              defaultValue={data.filters.status ?? ""}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            >
              <option value="">All</option>
              <option value="scheduled">Scheduled</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div>
            <label htmlFor="dateFrom" className="mb-1 block text-sm font-medium text-slate-700">
              From
            </label>
            <input
              id="dateFrom"
              name="dateFrom"
              type="date"
              defaultValue={data.filters.dateFrom ?? ""}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            />
          </div>

          <div>
            <label htmlFor="dateTo" className="mb-1 block text-sm font-medium text-slate-700">
              To
            </label>
            <input
              id="dateTo"
              name="dateTo"
              type="date"
              defaultValue={data.filters.dateTo ?? ""}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            />
          </div>

          <div className="flex items-end gap-3">
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-xl bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              Apply
            </button>

            <Link
              href={`/c/${churchSlug}/events`}
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Reset
            </Link>
          </div>
        </form>
      </WorkspaceControlRail>

      <WorkspaceTabs
        items={EVENT_TABS}
        activeKey={activeTab}
        onChange={(key) => handleTabChange(key as EventsMainTab)}
      />

      {activeTab === "all_events" ? (
        <EventsList churchSlug={churchSlug} rows={data.events} />
      ) : null}

      {activeTab === "create_event" ? (
        <WorkspaceSectionCard
          title="Create Event"
          description="Record a new church event without leaving the workspace."
        >
          {deptLoader.loading && !deptLoader.loaded ? (
            <div className="mb-4 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
              Loading department options...
            </div>
          ) : null}

          <EventForm
            churchSlug={churchSlug}
            action={createEventAction}
            departments={mergedDepartments.map((department) => ({
              id: department.id,
              name: department.department_name,
              code: department.code ?? null,
              is_active: department.is_active ?? true,
            }))}
            eventTypes={[
              "worship_service",
              "prayer_meeting",
              "board_meeting",
              "department_meeting",
              "evangelism",
              "youth_program",
              "sabbath_school",
              "community_outreach",
              "special_program",
              "other"
            ]}
            submitLabel="Create Event"
          />
        </WorkspaceSectionCard>
      ) : null}

      {activeTab === "detail" ? (
        data.selectedEvent ? (
          <EventDetailPanel churchSlug={churchSlug} event={data.selectedEvent} />
        ) : (
          <WorkspaceEmptyState
            title="No event selected"
            message="Choose an event from the list to open its detail view."
            actionLabel="Back to Events"
            actionHref={`/c/${churchSlug}/events`}
          />
        )
      ) : null}

      {activeTab === "edit" ? (
        data.selectedEvent ? (
          <WorkspaceSectionCard
            title="Edit Event"
            description="Update the selected event without leaving the workspace."
          >
            <EventForm
              churchSlug={churchSlug}
              action={updateEventAction}
              departments={mergedDepartments.map((department) => ({
                id: department.id,
                name: department.department_name,
                code: department.code ?? null,
                is_active: department.is_active ?? true,
              }))}
              eventTypes={[
                "worship_service",
                "prayer_meeting",
                "board_meeting",
                "department_meeting",
                "evangelism",
                "youth_program",
                "sabbath_school",
                "community_outreach",
                "special_program",
                "other"
              ]}
              initialValues={data.selectedEvent as any}
              submitLabel="Update Event"
            />
          </WorkspaceSectionCard>
        ) : (
          <WorkspaceEmptyState
            title="No event selected for editing"
            message="Choose an event from the list to open edit mode."
            actionLabel="Back to Events"
            actionHref={`/c/${churchSlug}/events`}
          />
        )
      ) : null}

      {activeTab === "calendar_notes" ? (
        <CalendarNotesPanel stats={data.stats} />
      ) : null}
    </div>
  );
}
