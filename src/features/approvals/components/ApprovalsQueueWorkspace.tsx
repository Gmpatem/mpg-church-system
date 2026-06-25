"use client";

import Link from "next/link";
import { useActionState, useEffect, useMemo, useState } from "react";
import {
  WorkspaceControlRail,
  WorkspaceEmptyState,
  WorkspaceSectionCard,
} from "@/components/workspace";
import {
  ChurchContentGrid,
  ChurchSummaryStrip,
  ChurchWorkspaceHeader,
} from "@/components/church-workspace";
import {
  getApprovalReviewLabel,
  getApprovalStageLabel,
  getApprovalStatusLabel,
} from "@/features/approvals/presentation";
import { reviewApprovalRequestStateAction } from "@/features/approvals/actions";
import type { ActionState } from "@/features/access/types";

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
  return "border-primary/20 bg-primary/10 text-primary";
}

function isReviewableEntityType(entityType: string) {
  return (
    entityType === "church_event" ||
    entityType === "church_announcement" ||
    entityType === "department_announcement"
  );
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
    ? "rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary"
    : "rounded-full border border-border bg-background px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground";
}

export function ApprovalsQueueWorkspace({ churchSlug, data }: ApprovalsQueueWorkspaceProps) {
  const [selectedId, setSelectedId] = useState(data.items[0]?.id ?? "");
  const [reviewNote, setReviewNote] = useState("");
  const [reviewState, reviewFormAction, reviewPending] = useActionState<
    ActionState | null,
    FormData
  >(reviewApprovalRequestStateAction, null);
  const selectedItem = useMemo(
    () => data.items.find((item) => item.id === selectedId) ?? null,
    [data.items, selectedId]
  );
  const canReviewSelected =
    selectedItem?.status === "pending" &&
    isReviewableEntityType(selectedItem.entityType);

  useEffect(() => {
    if (data.items.length === 0) {
      setSelectedId("");
      return;
    }
    if (!data.items.some((item) => item.id === selectedId)) {
      setSelectedId(data.items[0].id);
    }
  }, [data.items, selectedId]);

  useEffect(() => {
    setReviewNote("");
  }, [selectedId]);

  const allActive = !data.filters.module && !data.filters.status && !data.filters.stage;
  const pendingActive = data.filters.status === "pending";
  const eventsActive = data.filters.module === "events";
  const announcementsActive = data.filters.module === "announcements";
  const accessActive = data.filters.module === "access";
  const leadershipActive = data.filters.module === "leadership";

  return (
    <div className="space-y-6">
      <ChurchWorkspaceHeader
        eyebrow="Approvals Inbox"
        title="Unified Governance Queue"
        description="Review pending and completed approvals across events, announcements, access, and leadership."
      />

      <ChurchSummaryStrip
        items={[
          { label: "Total", value: data.summary.total ?? 0 },
          { label: "Pending", value: data.summary.pending ?? 0 },
          { label: "Approved", value: data.summary.approved ?? 0 },
          { label: "Rejected", value: data.summary.rejected ?? 0 },
          { label: "Changes Requested", value: data.summary.changes_requested ?? 0 },
          { label: "Cancelled", value: data.summary.cancelled ?? 0, muted: true },
        ]}
      />

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

      <ChurchContentGrid>
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
                    <tr key={item.id} className={item.id === selectedId ? "bg-primary/5" : ""}>
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

              {canReviewSelected ? (
                <form
                  action={reviewFormAction}
                  className="space-y-3 rounded-xl border border-slate-200 bg-white p-3"
                >
                  <input type="hidden" name="churchSlug" value={churchSlug} />
                  <input type="hidden" name="approvalRequestId" value={selectedItem.id} />

                  <div>
                    <label
                      htmlFor={`approval-note-${selectedItem.id}`}
                      className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500"
                    >
                      Review Note
                    </label>
                    <textarea
                      id={`approval-note-${selectedItem.id}`}
                      name="note"
                      rows={3}
                      value={reviewNote}
                      onChange={(event) => setReviewNote(event.target.value)}
                      placeholder="Add context for this approval decision."
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
                    />
                  </div>

                  {reviewState?.ok && reviewState.message ? (
                    <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
                      {reviewState.message}
                    </div>
                  ) : null}

                  {reviewState?.ok === false ? (
                    <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800">
                      {reviewState.error}
                    </div>
                  ) : null}

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="submit"
                      name="decision"
                      value="approved"
                      disabled={reviewPending}
                      className="rounded-md border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-800 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Approve
                    </button>
                    <button
                      type="submit"
                      name="decision"
                      value="changes_requested"
                      disabled={reviewPending}
                      className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Request Changes
                    </button>
                    <button
                      type="submit"
                      name="decision"
                      value="rejected"
                      disabled={reviewPending}
                      className="rounded-md border border-rose-300 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-800 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Reject
                    </button>
                  </div>
                </form>
              ) : selectedItem.status === "pending" ? (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
                  This request should be reviewed from its source module for now.
                </div>
              ) : null}

              <div className="flex flex-wrap gap-2">
                <Link href={selectedItem.href} className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
                  {getApprovalReviewLabel(selectedItem.moduleKey)}
                </Link>
                <Link href={selectedItem.href} className="rounded-md border border-border bg-background px-3 py-2 text-sm font-medium text-foreground hover:bg-muted">
                  Open Source
                </Link>
                <Link href={`/c/${churchSlug}/office`} className="rounded-md border border-border bg-background px-3 py-2 text-sm font-medium text-foreground hover:bg-muted">
                  Office
                </Link>
              </div>
            </div>
          )}
        </WorkspaceSectionCard>
      </ChurchContentGrid>
    </div>
  );
}
