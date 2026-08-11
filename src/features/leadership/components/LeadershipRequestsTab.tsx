"use client";

import { useMemo, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { ButtonSpinner } from "@/components/ui/ButtonSpinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { ChurchEmptyState, ChurchStatusPill } from "@/components/church-workspace";
import {
  approveDepartmentLeadershipRequestAction,
  rejectDepartmentLeadershipRequestAction,
} from "../actions";
import type { LeadershipRequestsData } from "../types";
import { getLabel, approvalStageLabels } from "@/lib/display-maps";
import { StatusBadge } from "@/components/ui/StatusBadge";

const requestSourceLabels: Record<string, string> = {
  invite_onboarding: "From Invite",
  manual_request: "Manual Request",
  admin_created: "Admin Created",
  profile_completion: "Profile Completion",
};

function formatDate(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString();
}

function SummaryItem({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="min-w-[120px] rounded-lg border border-border bg-muted/30 px-3 py-2">
      <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-lg font-semibold tabular-nums text-foreground">{value}</p>
    </div>
  );
}

type Notice = { ok: true; message: string } | { ok: false; error: string } | null;

export function LeadershipRequestsTab({
  churchSlug,
  data,
}: {
  churchSlug: string;
  data: LeadershipRequestsData;
}) {
  const [isPending, startTransition] = useTransition();
  const [noteMap, setNoteMap] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState<Notice>(null);

  const requests = useMemo(() => data.requests, [data.requests]);

  function setNote(id: string, value: string) {
    setNoteMap((prev) => ({
      ...prev,
      [id]: value,
    }));
  }

  function handleApprove(requestId: string) {
    setNotice(null);
    startTransition(async () => {
      const result = await approveDepartmentLeadershipRequestAction(
        churchSlug,
        requestId,
        noteMap[requestId]
      );

      setNotice(result.ok ? { ok: true, message: result.message ?? "Leadership request approved." } : { ok: false, error: result.error });
    });
  }

  function handleReject(requestId: string) {
    setNotice(null);
    startTransition(async () => {
      const result = await rejectDepartmentLeadershipRequestAction(
        churchSlug,
        requestId,
        noteMap[requestId]
      );

      setNotice(result.ok ? { ok: true, message: result.message ?? "Leadership request rejected." } : { ok: false, error: result.error });
    });
  }

  return (
    <div className="flex min-w-0 flex-col gap-5">
      <div className="flex min-w-0 gap-3 overflow-x-auto pb-1">
        <SummaryItem label="Total" value={data.summary.total} />
        <SummaryItem label="Pending" value={data.summary.pending} />
        <SummaryItem label="Approved" value={data.summary.approved} />
        <SummaryItem label="Rejected" value={data.summary.rejected} />
        <SummaryItem label="Cancelled" value={data.summary.cancelled} />
      </div>

      <ActionNotice notice={notice} />

      {requests.length === 0 ? (
        <ChurchEmptyState
          title="No leadership requests"
          message="Department leadership requests will appear here when members submit or administrators create them."
        />
      ) : (
        <div className="min-w-0 overflow-hidden rounded-lg border border-border">
          <Table className="min-w-[1120px]">
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Requested</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[320px]">Review</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
          {requests.map((request) => (
            <TableRow key={request.id}>
              <TableCell>
                <div className="min-w-0">
                  <p className="truncate font-medium text-foreground">
                    {request.memberName ?? request.memberEmail ?? "Unnamed request"}
                  </p>
                  <p className="mt-1 truncate text-xs text-muted-foreground">
                    {request.memberCode ?? request.memberEmail ?? "No member code"}
                  </p>
                </div>
              </TableCell>
              <TableCell className="font-medium text-foreground">{request.departmentName}</TableCell>
              <TableCell>
                <div className="min-w-0">
                  <p className="truncate text-sm text-foreground">{request.requestedRoleName}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{request.requestedRoleCode ?? "No role code"}</p>
                </div>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {getLabel(requestSourceLabels, request.source)}
              </TableCell>
              <TableCell className="text-muted-foreground">{formatDate(request.requestedAt)}</TableCell>
              <TableCell>
                <div className="flex flex-col items-start gap-2">
                  <StatusBadge status={request.status} context="approval" />
                  {request.approvalStage ? (
                    <ChurchStatusPill
                      status={request.approvalStage}
                      label={getLabel(approvalStageLabels, request.approvalStage)}
                    />
                  ) : null}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex min-w-0 flex-col gap-3">
                  <Textarea
                    value={noteMap[request.id] ?? ""}
                    onChange={(e) => setNote(request.id, e.target.value)}
                    placeholder={request.reviewerNote ?? "Optional reviewer note"}
                    className="min-h-20 resize-none rounded-lg"
                    disabled={request.status !== "pending"}
                  />
                  {request.status === "pending" ? (
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        size="sm"
                        disabled={isPending}
                        onClick={() => handleApprove(request.id)}
                        className="rounded-lg"
                      >
                        {isPending ? <ButtonSpinner /> : "Approve"}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        disabled={isPending}
                        onClick={() => handleReject(request.id)}
                        className="rounded-lg"
                      >
                        Reject
                      </Button>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Reviewed {formatDate(request.reviewedAt)}
                    </p>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

function ActionNotice({ notice }: { notice: Notice }) {
  if (!notice) return null;

  return (
    <div
      className={
        notice.ok
          ? "rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700"
          : "rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
      }
    >
      {notice.ok ? notice.message : notice.error}
    </div>
  );
}
