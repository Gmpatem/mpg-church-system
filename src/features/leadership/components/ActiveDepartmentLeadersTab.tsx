import type { ActiveDepartmentLeadersData } from "../types";

function formatDate(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString();
}

export function ActiveDepartmentLeadersTab({
  data,
}: {
  data: ActiveDepartmentLeadersData;
}) {
  if (data.leaders.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed p-6 text-sm text-muted-foreground">
        No active department leaders yet.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {data.leaders.map((leader) => (
        <div key={leader.id} className="rounded-2xl border p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium text-foreground">
                  {leader.memberName ?? leader.memberEmail ?? "Unnamed leader"}
                </p>
                <span className="inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium">
                  {leader.isPrimary ? "Primary" : "Leader"}
                </span>
              </div>

              <div className="grid gap-1 text-sm text-muted-foreground sm:grid-cols-2">
                <p>
                  Department: <span className="font-medium text-foreground">{leader.departmentName}</span>
                </p>
                <p>
                  Leadership role: <span className="font-medium text-foreground">{leader.leadershipRoleName}</span>
                </p>
                <p>
                  Role code: <span className="font-medium text-foreground">{leader.leadershipRoleCode ?? "—"}</span>
                </p>
                <p>
                  Member code: <span className="font-medium text-foreground">{leader.memberCode ?? "—"}</span>
                </p>
                <p>
                  Start: <span className="font-medium text-foreground">{formatDate(leader.startDate)}</span>
                </p>
                <p>
                  End: <span className="font-medium text-foreground">{formatDate(leader.endDate)}</span>
                </p>
              </div>

              {leader.notes ? (
                <div className="rounded-xl bg-muted/40 p-3 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">Notes:</span> {leader.notes}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
