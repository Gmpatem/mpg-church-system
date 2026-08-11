import {
  ChurchEmptyState,
  ChurchStatusPill,
  ChurchWorkspacePanel,
} from "@/components/church-workspace";
import type { LeadershipOverviewData } from "../types";

export function LeadershipOverviewTab({
  data,
}: {
  data: LeadershipOverviewData;
}) {
  const hasLeadershipActivity =
    data.pendingRequestCount > 0 ||
    data.approvedLeaderCount > 0 ||
    data.departmentsWithLeadersCount > 0;

  return (
    <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
      <ChurchWorkspacePanel
        title="Leadership Health"
        description="Current request pressure and department leadership coverage."
        contentClassName="p-4 sm:p-5"
      >
        {hasLeadershipActivity ? (
          <div className="divide-y divide-border rounded-lg border border-border">
            <OverviewRow
              label="Request queue"
              value={`${data.pendingRequestCount} pending`}
              status={data.pendingRequestCount > 0 ? "pending" : "completed"}
              statusLabel={data.pendingRequestCount > 0 ? "Needs review" : "Clear"}
            />
            <OverviewRow
              label="Approved leadership"
              value={`${data.approvedLeaderCount} active`}
              status={data.approvedLeaderCount > 0 ? "active" : "inactive"}
              statusLabel={data.approvedLeaderCount > 0 ? "Active" : "Empty"}
            />
            <OverviewRow
              label="Department coverage"
              value={`${data.departmentsWithLeadersCount} covered`}
              status={data.departmentsWithLeadersCount > 0 ? "active" : "inactive"}
              statusLabel={data.departmentsWithLeadersCount > 0 ? "Covered" : "Uncovered"}
            />
          </div>
        ) : (
          <ChurchEmptyState
            title="No leadership activity"
            message="Leadership requests and approved department assignments will appear here as members are reviewed."
          />
        )}
      </ChurchWorkspacePanel>

      <ChurchWorkspacePanel
        title="Review Focus"
        description="Quick signals for church administrators."
        contentClassName="p-4 sm:p-5"
      >
        <div className="flex flex-col gap-3">
          <SignalItem
            label="Pending queue"
            value={data.pendingRequestCount === 0 ? "No waiting requests" : `${data.pendingRequestCount} waiting`}
          />
          <SignalItem
            label="Active roster"
            value={data.approvedLeaderCount === 0 ? "No active leaders yet" : `${data.approvedLeaderCount} active leaders`}
          />
          <SignalItem
            label="Coverage"
            value={data.departmentsWithLeadersCount === 0 ? "No departments covered" : `${data.departmentsWithLeadersCount} departments covered`}
          />
        </div>
      </ChurchWorkspacePanel>
    </div>
  );
}

function OverviewRow({
  label,
  value,
  status,
  statusLabel,
}: {
  label: string;
  value: string;
  status: string;
  statusLabel: string;
}) {
  return (
    <div className="grid gap-3 px-4 py-3 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center">
      <p className="min-w-0 text-sm font-medium text-foreground">{label}</p>
      <p className="text-sm text-muted-foreground">{value}</p>
      <ChurchStatusPill status={status} label={statusLabel} />
    </div>
  );
}

function SignalItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-muted/30 p-3">
      <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}

