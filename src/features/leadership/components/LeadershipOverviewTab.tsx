import { WorkspaceSectionCard, WorkspaceStatCard } from "@/components/workspace";
import type { LeadershipOverviewData } from "../types";

export function LeadershipOverviewTab({
  data,
}: {
  data: LeadershipOverviewData;
}) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <WorkspaceStatCard
          label="Pending Requests"
          value={String(data.pendingRequestCount)}
          hint="Leadership requests waiting for review"
        />
        <WorkspaceStatCard
          label="Active Leaders"
          value={String(data.approvedLeaderCount)}
          hint="Approved department leadership assignments"
        />
        <WorkspaceStatCard
          label="Departments Covered"
          value={String(data.departmentsWithLeadersCount)}
          hint="Departments with at least one active leader"
        />
      </div>

      <WorkspaceSectionCard
        title="Leadership Module"
        description="This workspace manages department leadership requests and approved department leaders."
        contentClassName="space-y-3"
      >
        <div className="rounded-2xl border p-4 text-sm text-muted-foreground">
          Use the Requests tab to review leadership claims submitted during onboarding.
        </div>
        <div className="rounded-2xl border p-4 text-sm text-muted-foreground">
          Use the Active Leaders tab to see who is currently recognized as a department leader.
        </div>
      </WorkspaceSectionCard>
    </div>
  );
}


