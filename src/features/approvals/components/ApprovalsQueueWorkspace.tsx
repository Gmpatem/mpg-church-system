"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  WorkspaceControlRail,
  WorkspaceEmptyState,
  WorkspaceHero,
  WorkspaceSectionCard,
  WorkspaceStatCard,
} from "@/components/workspace";
import {
  getApprovalReviewLabel,
  getApprovalStageLabel,
  getApprovalStatusLabel,
} from "@/features/approvals/presentation";

interface ApprovalsQueueWorkspaceProps {
  churchSlug: string;
  data: {
    church: {
      id: string;
      slug: string;
      name: string;
    };
    items: Array<{
      id: string;
      moduleKey: string;
      moduleLabel: string;
      entityType: string;
      entityId: string;
      requestType: string;
      displayTitle: string;
      currentStage: string;
      status: string;
      priority: string;
      currentAssigneeRoleCode: string | null;
      payload: Record<string, unknown>;
      submittedAt: string;
      decidedAt: string | null;
      decidedByUserId: string | null;
      decisionNote: string | null;
      submittedByUserId: string | null;
      submittedByName: string | null;
      href: string;
    }>;
    summary: Record<string, number>;
    filters: {
      module: string;
      status: string;
      stage: string;
    };
  };
}

function formatDate(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString();
}

function formatRequestType(value: string) {
  return value.replaceAll("_", " ");
}

function getPriorityLabel(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function badgeClass(status: string) {
  if (status === "approved") return "border-emerald-200 bg-emerald-50 text-emerald-800";
  if (status === "rejected") return "border-rose-200 bg-rose-50 text-rose-800";
  if (status === "changes_requested") return "border-amber-200 bg-amber-50 text-amber-800";
  if (status === "cancelled") return "border-zinc-200 bg-zinc-100 text-zinc-800";
  return "border-blue-200 bg-blue-50 text-blue-800";
}

function buildFilterHref(
  churchSlug: string,
  filters: { module: string; status: string; stage: string },
  patch: Partial<{ module: string; status: string; stage: string }>
) {
  const next = {
    module: patch.module ?? filters.module ?? "",
    status: patch.status ?? filters.status ?? "",
    stage: patch.stage ?? filters.stage ?? "",
  };

  const params = new URLSearchParams();
  if (next.module) params.set("module", next.module);
  if (next.status) params.set("status", next.status);
  if (next.stage) params.set("stage", next.stage);

  const query = params.toString();
  return query ? `/c/${churchSlug}/approvals?${query}` : `/c/${churchSlug}/approvals`;
}

function filterChipClass(active: boolean) {
  return active
    ? "rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700"
    : "rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50";
}

export function ApprovalsQueueWorkspace({ churchSlug, data }: ApprovalsQueueWorkspaceProps) {
  const [selectedId, setSelectedId] = useState(data.items[0]?.id ?? "");
  const selectedItem = useMemo(
    () => data.items.find((item) => item.id === selectedId) ?? null,
    [data.items, selectedId]
  );

  useEffect(() => {
    if (data.items.length === 0) {
      setSelectedId("");
      return;
    }
    if (!data.items.some((item) => item.id === selectedId)) {
      setSelectedId(data.items[0].id);
    }
  }, [data.items, selectedId]);

  const allActive = !data.filters.module && !data.filters.status && !data.filters.stage;
  const pendingActive = data.filters.status === "pending";
  const eventsActive = data.filters.module === "events";
  const announcementsActive = data.filters.module === "announcements";
  const accessActive = data.filters.module === "access";
  const leadershipActive = data.filters.module === "leadership";

  return (
    <div className="space-y-6">
      <WorkspaceHero
        size="compact"
        eyebrow="Approvals Inbox"
        title="Unified Governance Queue"
        description="Review pending and completed approvals across events, announcements, access, and leadership."
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <WorkspaceStatCard label="Total" value={data.summary.total ?? 0} />
        <WorkspaceStatCard label="Pending" value={data.summary.pending ?? 0} />
        <WorkspaceStatCard label="Approved" value={data.summary.approved ?? 0} />
        <WorkspaceStatCard label="Rejected" value={data.summary.rejected ?? 0} />
        <WorkspaceStatCard label="Changes Requested" value={data.summary.changes_requested ?? 0} />
        <WorkspaceStatCard label="Cancelled" value={data.summary.cancelled ?? 0} />
      </div>

      <WorkspaceControlRail
        title="Queue Filters"
        description="Narrow approvals by status and module while keeping triage context."
      >
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          <Link
            href={buildFilterHref(churchSlug, data.filters, { module: "", status: "", stage: "" })}
            className={filterChipClass(allActive)}
          >
            All
          </Link>
          <Link
            href={buildFilterHref(churchSlug, data.filters, { status: "pending" })}
            className={filterChipClass(pendingActive)}
          >
            Pending
          </Link>
          <Link
            href={buildFilterHref(churchSlug, data.filters, { module: "events" })}
            className={filterChipClass(eventsActive)}
          >
            Events
          </Link>
          <Link
            href={buildFilterHref(churchSlug, data.filters, { module: "announcements" })}
            className={filterChipClass(announcementsActive)}
          >
            Announcements
          </Link>
          <Link
            href={buildFilterHref(churchSlug, data.filters, { module: "access" })}
            className={filterChipClass(accessActive)}
          >
            Access
          </Link>
          <Link
            href={buildFilterHref(churchSlug, data.filters, { module: "leadership" })}
            className={filterChipClass(leadershipActive)}
          >
            Leadership
          </Link>
        </div>
      </WorkspaceControlRail>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.9fr)_minmax(360px,1fr)]">
        <WorkspaceSectionCard
          title="Approvals Queue"
          description="Scan, select, and open approval sources from one table-first work surface."
          contentClassName="p-0"
        >
          {data.items.length === 0 ? (
            <div className="p-5">
              <WorkspaceEmptyState
                title="No approvals found"
                message="No approval requests matched the current filter."
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Request</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Module</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Stage</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Priority</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Submitted</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {data.items.map((item) => (
                    <tr key={item.id} className={item.id === selectedId ? "bg-slate-50" : ""}>
                      <td className="px-4 py-3.5">
                        <button type="button" onClick={() => setSelectedId(item.id)} className="text-left">
                          <p className="text-sm font-medium text-slate-900">{item.displayTitle}</p>
                          <p className="mt-1 text-xs text-slate-500">{formatRequestType(item.requestType)}</p>
                        </button>
                      </td>
                      <td className="px-4 py-3.5 text-sm text-slate-700">{item.moduleLabel}</td>
                      <td className="px-4 py-3.5 text-sm text-slate-700">{getApprovalStageLabel(item.currentStage)}</td>
                      <td className="px-4 py-3.5">
                        <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${badgeClass(item.status)}`}>
                          {getApprovalStatusLabel(item.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-sm text-slate-700">{getPriorityLabel(item.priority)}</td>
                      <td className="px-4 py-3.5 text-right text-sm text-slate-700">{formatDate(item.submittedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </WorkspaceSectionCard>

        <WorkspaceSectionCard
          title="Decision Panel"
          description="Review selected request details before opening the source workflow."
        >
          {!selectedItem ? (
            <WorkspaceEmptyState
              title="No request selected"
              message="Choose a request from the queue table to inspect details."
            />
          ) : (
            <div className="space-y-4">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-slate-500">{selectedItem.moduleLabel}</p>
                <p className="mt-2 text-sm font-semibold text-slate-900">{selectedItem.displayTitle}</p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${badgeClass(selectedItem.status)}`}>
                    {getApprovalStatusLabel(selectedItem.status)}
                  </span>
                  <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700">
                    {getApprovalStageLabel(selectedItem.currentStage)}
                  </span>
                </div>
              </div>

              <div className="space-y-2 text-sm text-slate-700">
                <p>Request type: <span className="font-medium text-slate-900">{formatRequestType(selectedItem.requestType)}</span></p>
                <p>Priority: <span className="font-medium text-slate-900">{getPriorityLabel(selectedItem.priority)}</span></p>
                <p>Assignee role: <span className="font-medium text-slate-900">{selectedItem.currentAssigneeRoleCode ?? "—"}</span></p>
                <p>Submitted by: <span className="font-medium text-slate-900">{selectedItem.submittedByName ?? "—"}</span></p>
                <p>Submitted at: <span className="font-medium text-slate-900">{formatDate(selectedItem.submittedAt)}</span></p>
                <p>Decided at: <span className="font-medium text-slate-900">{formatDate(selectedItem.decidedAt)}</span></p>
              </div>

              {selectedItem.decisionNote ? (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                  Decision note: <span className="font-medium text-slate-900">{selectedItem.decisionNote}</span>
                </div>
              ) : null}

              <div className="flex flex-wrap gap-2">
                <Link href={selectedItem.href} className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800">
                  {getApprovalReviewLabel(selectedItem.moduleKey)}
                </Link>
                <Link href={selectedItem.href} className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                  Open Source
                </Link>
                <Link href={`/c/${churchSlug}/office`} className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                  Office
                </Link>
              </div>
            </div>
          )}
        </WorkspaceSectionCard>
      </div>
    </div>
  );
}

