"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  WorkspaceControlRail,
  WorkspaceEmptyState,
  WorkspaceHero,
  WorkspaceSectionCard,
  WorkspaceStatCard,
} from "@/components/workspace";
import { getLabel } from "@/lib/display-maps";

type OfficeQueueItem = {
  id: string;
  type: "access_request" | "leadership_request" | "announcement_review" | "event_approval" | "today_event";
  title: string;
  description: string;
  href: string;
  createdAt?: string | null;
  startsAt?: string | null;
  status?: string | null;
};

type OfficeCalendarItem = {
  id: string;
  title: string;
  event_type: string;
  start_datetime: string | null;
  status: string | null;
  workflow_state: string | null;
};

type OfficeWorkspaceData = {
  church: {
    id: string;
    slug: string;
    name: string;
  };
  roles: string[];
  stats: {
    totalMembers: number;
    activeDepartments: number;
    pendingAccessRequests: number;
    pendingLeadershipRequests: number;
    announcementsNeedingPublish: number;
    departmentEventsAwaitingApproval: number;
    upcomingEvents: number;
    todaysEvents: number;
  };
  upcomingEvents: Array<{
    id: string;
    title: string;
    start_datetime: string;
    status: string;
  }>;
  secretaryCalendar?: {
    pendingSubmissions: OfficeCalendarItem[];
    sharedCalendar: OfficeCalendarItem[];
  };
  queue: OfficeQueueItem[];
};

interface OfficeQueueWorkspaceProps {
  churchSlug: string;
  data: OfficeWorkspaceData;
}

type QueueFilter = "all" | OfficeQueueItem["type"];

const QUEUE_FILTERS: QueueFilter[] = [
  "all",
  "access_request",
  "leadership_request",
  "announcement_review",
  "event_approval",
  "today_event",
];

const queueTypeLabels: Record<OfficeQueueItem["type"], string> = {
  access_request: "Access",
  leadership_request: "Leadership",
  announcement_review: "Announcements",
  event_approval: "Event Approval",
  today_event: "Today",
};

const queueStatusLabels: Record<string, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  published: "Published",
  scheduled: "Scheduled",
  draft: "Draft",
  cancelled: "Cancelled",
  changes_requested: "Changes Requested",
  office_review: "Office Review",
  leadership_review: "Leadership Review",
};

function formatDateTime(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getQueueTime(item: OfficeQueueItem) {
  return item.startsAt ?? item.createdAt ?? null;
}

function queueActionLabel(type: OfficeQueueItem["type"]) {
  if (type === "access_request") return "Review Access";
  if (type === "leadership_request") return "Review Leadership";
  if (type === "announcement_review") return "Review Announcement";
  if (type === "event_approval") return "Review Event";
  return "Open Calendar";
}

function isQueueFilter(value: string): value is QueueFilter {
  return QUEUE_FILTERS.includes(value as QueueFilter);
}

function getOfficeQueueStateStorageKey(churchSlug: string) {
  return `workspace-office-queue:${churchSlug}`;
}

export function OfficeQueueWorkspace({ churchSlug, data }: OfficeQueueWorkspaceProps) {
  const router = useRouter();
  const roles = data.roles ?? [];
  const isSecretary = roles.includes("church_secretary");

  const [queueFilter, setQueueFilter] = useState<QueueFilter>("all");
  const [selectedQueueId, setSelectedQueueId] = useState<string>(data.queue[0]?.id ?? "");

  useEffect(() => {
    router.prefetch(`/c/${churchSlug}/approvals`);
    router.prefetch(`/c/${churchSlug}/reports`);
    router.prefetch(`/c/${churchSlug}/access-control`);
  }, [churchSlug, router]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(getOfficeQueueStateStorageKey(churchSlug));
      if (!raw) return;

      const parsed = JSON.parse(raw) as { queueFilter?: string; selectedQueueId?: string };

      if (parsed.queueFilter && isQueueFilter(parsed.queueFilter)) {
        setQueueFilter(parsed.queueFilter);
      }

      if (typeof parsed.selectedQueueId === "string") {
        setSelectedQueueId(parsed.selectedQueueId);
      }
    } catch {
      // ignore local storage read errors
    }
  }, [churchSlug]);

  const queueCounts = useMemo(() => {
    const counts: Record<string, number> = { all: data.queue.length };
    for (const item of data.queue) {
      counts[item.type] = (counts[item.type] ?? 0) + 1;
    }
    return counts;
  }, [data.queue]);

  const filteredQueue = useMemo(() => {
    if (queueFilter === "all") return data.queue;
    return data.queue.filter((item) => item.type === queueFilter);
  }, [data.queue, queueFilter]);

  useEffect(() => {
    if (filteredQueue.length === 0) {
      setSelectedQueueId("");
      return;
    }

    const stillVisible = filteredQueue.some((item) => item.id === selectedQueueId);
    if (!stillVisible) {
      setSelectedQueueId(filteredQueue[0].id);
    }
  }, [filteredQueue, selectedQueueId]);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        getOfficeQueueStateStorageKey(churchSlug),
        JSON.stringify({
          queueFilter,
          selectedQueueId,
        })
      );
    } catch {
      // ignore local storage write errors
    }
  }, [churchSlug, queueFilter, selectedQueueId]);

  const selectedQueueItem = filteredQueue.find((item) => item.id === selectedQueueId) ?? null;

  return (
    <div className="space-y-6">
      <WorkspaceHero
        size="compact"
        eyebrow="Office Workspace"
        title="Church Office Queue"
        description={`Central review desk for approvals, access, leadership, and event coordination in ${data.church.name}.`}
        badges={[
          `${data.queue.length} active queue items`,
          `${data.stats.todaysEvents} events today`,
        ]}
        actions={[
          { label: "Approvals", href: `/c/${churchSlug}/approvals`, variant: "primary" },
          { label: "Access Control", href: `/c/${churchSlug}/access-control`, variant: "secondary" },
          { label: "Events", href: `/c/${churchSlug}/events`, variant: "outline" },
        ]}
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <WorkspaceStatCard label="Queue Items" value={data.queue.length} hint="Active office queue" />
        <WorkspaceStatCard label="Pending Access" value={data.stats.pendingAccessRequests} hint="Needs review" />
        <WorkspaceStatCard label="Leadership" value={data.stats.pendingLeadershipRequests} hint="Needs review" />
        <WorkspaceStatCard label="Event Approvals" value={data.stats.departmentEventsAwaitingApproval} hint="Workflow queue" />
        <WorkspaceStatCard label="Announcements" value={data.stats.announcementsNeedingPublish} hint="Awaiting publish" />
        <WorkspaceStatCard label="Today" value={data.stats.todaysEvents} hint="Calendar load" />
      </div>

      <WorkspaceControlRail
        title="Queue Controls"
        description="Filter active queue lanes and open the related operational module."
      >
        <div className="space-y-3">
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
            {QUEUE_FILTERS.map((item) => {
              const isActive = queueFilter === item;
              const label = item === "all" ? "All" : queueTypeLabels[item];
              const count = queueCounts[item] ?? 0;

              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => setQueueFilter(item)}
                  className={
                    isActive
                      ? "rounded-full bg-slate-950 px-4 py-2 text-sm font-medium text-white"
                      : "rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200"
                  }
                >
                  {label} ({count})
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap gap-2">
            <Link href={`/c/${churchSlug}/members`} className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50">Members</Link>
            <Link href={`/c/${churchSlug}/households`} className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50">Households</Link>
            <Link href={`/c/${churchSlug}/departments`} className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50">Departments</Link>
            <Link href={`/c/${churchSlug}/reports`} className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50">Reports</Link>
            {isSecretary ? (
              <>
                <Link href={`/c/${churchSlug}/announcements`} className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50">Announcements</Link>
                <Link href={`/c/${churchSlug}/calendar`} className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50">Calendar</Link>
              </>
            ) : null}
          </div>
        </div>
      </WorkspaceControlRail>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.8fr)_minmax(360px,1fr)]">
        <WorkspaceSectionCard
          title="Live Office Queue"
          description="Primary triage surface for cross-module requests and office actions."
          contentClassName="p-0"
        >
          {filteredQueue.length === 0 ? (
            <div className="p-5">
              <WorkspaceEmptyState
                title="No queue items in this lane"
                message="Try another queue filter or check back after new requests are submitted."
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Item</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Time</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {filteredQueue.map((item) => {
                    const isSelected = item.id === selectedQueueId;
                    const statusLabel = item.status ? getLabel(queueStatusLabels, item.status) : "—";
                    return (
                      <tr
                        key={item.id}
                        className={isSelected ? "bg-slate-50" : ""}
                      >
                        <td className="px-4 py-3.5 text-sm text-slate-700">{queueTypeLabels[item.type]}</td>
                        <td className="px-4 py-3.5">
                          <button
                            type="button"
                            onClick={() => setSelectedQueueId(item.id)}
                            className="text-left"
                          >
                            <p className="text-sm font-medium text-slate-900">{item.title}</p>
                            <p className="mt-1 text-xs text-slate-500">{item.description}</p>
                          </button>
                        </td>
                        <td className="px-4 py-3.5 text-sm text-slate-700">{statusLabel}</td>
                        <td className="px-4 py-3.5 text-sm text-slate-700">{formatDateTime(getQueueTime(item))}</td>
                        <td className="px-4 py-3.5 text-right">
                          <Link href={item.href} className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50">
                            Open
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </WorkspaceSectionCard>

        <WorkspaceSectionCard
          title="Queue Detail"
          description="Review selected queue item details and jump directly to action."
        >
          {!selectedQueueItem ? (
            <WorkspaceEmptyState title="No item selected" message="Pick an item from the queue table to inspect details." />
          ) : (
            <div className="space-y-4">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-slate-500">{queueTypeLabels[selectedQueueItem.type]}</p>
                <p className="mt-2 text-sm font-semibold text-slate-900">{selectedQueueItem.title}</p>
                <p className="mt-2 text-sm text-slate-600">{selectedQueueItem.description}</p>
              </div>

              <div className="space-y-2 text-sm text-slate-700">
                <p>
                  Status:{" "}
                  <span className="font-medium text-slate-900">
                    {selectedQueueItem.status ? getLabel(queueStatusLabels, selectedQueueItem.status) : "—"}
                  </span>
                </p>
                <p>
                  Time:{" "}
                  <span className="font-medium text-slate-900">{formatDateTime(getQueueTime(selectedQueueItem))}</span>
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Link href={selectedQueueItem.href} className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800">
                  {queueActionLabel(selectedQueueItem.type)}
                </Link>
                <Link href={selectedQueueItem.href} className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                  Open Source
                </Link>
              </div>
            </div>
          )}
        </WorkspaceSectionCard>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <WorkspaceSectionCard
          title="Upcoming Office Queue"
          description="Scheduled events ahead that may require office coordination."
          contentClassName="p-0"
        >
          {data.upcomingEvents.length === 0 ? (
            <div className="p-5 text-sm text-slate-500">No upcoming scheduled events found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Event</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Start</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {data.upcomingEvents.map((event) => (
                    <tr key={event.id}>
                      <td className="px-4 py-3.5">
                        <Link href={`/c/${churchSlug}/events?eventId=${event.id}&tab=detail`} className="text-sm font-medium text-slate-900 hover:underline">
                          {event.title}
                        </Link>
                      </td>
                      <td className="px-4 py-3.5 text-sm text-slate-700">{formatDateTime(event.start_datetime)}</td>
                      <td className="px-4 py-3.5 text-right text-sm text-slate-700">{getLabel(queueStatusLabels, event.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </WorkspaceSectionCard>

        {isSecretary ? (
          <WorkspaceSectionCard
            title="Secretary Calendar Snapshot"
            description="Pending submissions and shared calendar visibility for secretary workflow."
            contentClassName="p-0"
          >
            <div className="divide-y divide-slate-200">
              <div className="p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Pending Submissions</p>
                {(data.secretaryCalendar?.pendingSubmissions?.length ?? 0) === 0 ? (
                  <p className="mt-2 text-sm text-slate-500">No pending event submissions.</p>
                ) : (
                  <div className="mt-2 space-y-2">
                    {data.secretaryCalendar?.pendingSubmissions.slice(0, 5).map((event) => (
                      <div key={event.id} className="rounded-lg border border-slate-200 px-3 py-2">
                        <p className="text-sm font-medium text-slate-900">{event.title}</p>
                        <p className="mt-1 text-xs text-slate-600">{formatDateTime(event.start_datetime)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Shared Calendar</p>
                {(data.secretaryCalendar?.sharedCalendar?.length ?? 0) === 0 ? (
                  <p className="mt-2 text-sm text-slate-500">No shared calendar activities found yet.</p>
                ) : (
                  <div className="mt-2 space-y-2">
                    {data.secretaryCalendar?.sharedCalendar.slice(0, 5).map((event) => (
                      <div key={event.id} className="rounded-lg border border-slate-200 px-3 py-2">
                        <p className="text-sm font-medium text-slate-900">{event.title}</p>
                        <p className="mt-1 text-xs text-slate-600">{formatDateTime(event.start_datetime)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </WorkspaceSectionCard>
        ) : (
          <WorkspaceSectionCard
            title="Workflow Coverage"
            description="Primary operational lanes accessible from the office workspace."
          >
            <div className="grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
              <Link href={`/c/${churchSlug}/approvals`} className="rounded-lg border border-slate-200 px-3 py-2 hover:bg-slate-50">Approvals Queue</Link>
              <Link href={`/c/${churchSlug}/access-control`} className="rounded-lg border border-slate-200 px-3 py-2 hover:bg-slate-50">Access Control</Link>
              <Link href={`/c/${churchSlug}/leadership`} className="rounded-lg border border-slate-200 px-3 py-2 hover:bg-slate-50">Leadership Requests</Link>
              <Link href={`/c/${churchSlug}/events`} className="rounded-lg border border-slate-200 px-3 py-2 hover:bg-slate-50">Events Workflow</Link>
            </div>
          </WorkspaceSectionCard>
        )}
      </div>
    </div>
  );
}
