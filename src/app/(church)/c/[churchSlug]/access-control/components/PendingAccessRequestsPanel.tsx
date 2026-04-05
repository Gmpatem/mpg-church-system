"use client";

import { useMemo, useState, useTransition } from "react";
import {
  approveChurchAccessRequestAction,
  rejectChurchAccessRequestAction,
} from "@/features/access-control/actions";
import type { AccessControlPendingAccessData } from "@/features/access-control/types";

type PendingAccessRequestsPanelProps = {
  churchSlug: string;
  data: AccessControlPendingAccessData;
};

function formatDate(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString();
}

function statusClass(status: string) {
  if (status === "approved") {
    return "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";
  }
  if (status === "rejected") {
    return "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300";
  }
  if (status === "cancelled") {
    return "border-zinc-500/30 bg-zinc-500/10 text-zinc-700 dark:text-zinc-300";
  }
  return "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300";
}

export function PendingAccessRequestsPanel({
  churchSlug,
  data,
}: PendingAccessRequestsPanelProps) {
  const [isPending, startTransition] = useTransition();
  const [noteMap, setNoteMap] = useState<Record<string, string>>({});

  const requests = useMemo(() => data.requests, [data.requests]);

  function setNote(id: string, value: string) {
    setNoteMap((prev) => ({
      ...prev,
      [id]: value,
    }));
  }

  function handleApprove(requestId: string) {
    startTransition(async () => {
      const result = await approveChurchAccessRequestAction(
        churchSlug,
        requestId,
        noteMap[requestId]
      );

      if (!result.ok) {
        window.alert(result.error);
      }
    });
  }

  function handleReject(requestId: string) {
    startTransition(async () => {
      const result = await rejectChurchAccessRequestAction(
        churchSlug,
        requestId,
        noteMap[requestId]
      );

      if (!result.ok) {
        window.alert(result.error);
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <SummaryCard label="Total" value={data.summary.total} />
        <SummaryCard label="Pending" value={data.summary.pending} />
        <SummaryCard label="Approved" value={data.summary.approved} />
        <SummaryCard label="Rejected" value={data.summary.rejected} />
        <SummaryCard label="Cancelled" value={data.summary.cancelled} />
      </div>

      {requests.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-6 text-sm text-muted-foreground">
          No church-wide access requests yet.
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <div key={request.id} className="rounded-2xl border p-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-foreground">
                      {request.memberName ?? request.requesterProfileName ?? request.memberEmail ?? "Unnamed request"}
                    </p>
                    <span
                      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${statusClass(request.status)}`}
                    >
                      {request.status}
                    </span>
                  </div>

                  <div className="grid gap-1 text-sm text-muted-foreground sm:grid-cols-2">
                    <p>
                      Requested role: <span className="font-medium text-foreground">{request.requestedRoleName}</span>
                    </p>
                    <p>
                      Role code: <span className="font-medium text-foreground">{request.requestedRoleCode ?? "—"}</span>
                    </p>
                    <p>
                      Member email: <span className="font-medium text-foreground">{request.memberEmail ?? "—"}</span>
                    </p>
                    <p>
                      Member code: <span className="font-medium text-foreground">{request.memberCode ?? "—"}</span>
                    </p>
                    <p>
                      Requested at: <span className="font-medium text-foreground">{formatDate(request.requestedAt)}</span>
                    </p>
                    <p>
                      Reviewed at: <span className="font-medium text-foreground">{formatDate(request.reviewedAt)}</span>
                    </p>
                  </div>

                  <div className="rounded-xl bg-muted/40 p-3 text-xs text-muted-foreground">
                    Source: <span className="font-medium text-foreground">{request.source}</span>
                    {request.approvalStage ? (
                      <>
                        {" "}• Approval stage:{" "}
                        <span className="font-medium text-foreground">{request.approvalStage}</span>
                      </>
                    ) : null}
                    {request.approvalStatus ? (
                      <>
                        {" "}• Approval status:{" "}
                        <span className="font-medium text-foreground">{request.approvalStatus}</span>
                      </>
                    ) : null}
                    {request.reviewerNote ? (
                      <>
                        {" "}• Reviewer note:{" "}
                        <span className="font-medium text-foreground">{request.reviewerNote}</span>
                      </>
                    ) : null}
                  </div>
                </div>

                <div className="w-full max-w-md space-y-3">
                  <textarea
                    value={noteMap[request.id] ?? ""}
                    onChange={(e) => setNote(request.id, e.target.value)}
                    placeholder="Optional reviewer note"
                    className="min-h-[96px] w-full rounded-xl border bg-background px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-ring"
                  />

                  {request.status === "pending" ? (
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => handleApprove(request.id)}
                        className="inline-flex h-10 items-center justify-center rounded-xl bg-foreground px-4 text-sm font-medium text-background transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => handleReject(request.id)}
                        className="inline-flex h-10 items-center justify-center rounded-xl border border-rose-500/30 px-4 text-sm font-medium text-rose-700 transition hover:bg-rose-500/10 disabled:cursor-not-allowed disabled:opacity-60 dark:text-rose-300"
                      >
                        Reject
                      </button>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed p-3 text-sm text-muted-foreground">
                      This request has already been reviewed.
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SummaryCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </div>
  );
}
