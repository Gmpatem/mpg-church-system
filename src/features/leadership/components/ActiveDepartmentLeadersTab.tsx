import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ChurchEmptyState, ChurchStatusPill } from "@/components/church-workspace";
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
      <ChurchEmptyState
        title="No active department leaders"
        message="Approved department leadership assignments will appear here."
      />
    );
  }

  return (
    <div className="min-w-0 overflow-hidden rounded-lg border border-border">
      <Table className="min-w-[920px]">
        <TableHeader>
          <TableRow>
            <TableHead>Leader</TableHead>
            <TableHead>Department</TableHead>
            <TableHead>Leadership Role</TableHead>
            <TableHead>Dates</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Notes</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.leaders.map((leader) => (
            <TableRow key={leader.id}>
              <TableCell>
                <div className="min-w-0">
                  <p className="truncate font-medium text-foreground">
                    {leader.memberName ?? leader.memberEmail ?? "Unnamed leader"}
                  </p>
                  <p className="mt-1 truncate text-xs text-muted-foreground">
                    {leader.memberCode ?? leader.memberEmail ?? "No member code"}
                  </p>
                </div>
              </TableCell>
              <TableCell className="font-medium text-foreground">{leader.departmentName}</TableCell>
              <TableCell>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm text-foreground">{leader.leadershipRoleName}</span>
                  {leader.leadershipRoleCode ? (
                    <Badge variant="secondary">{leader.leadershipRoleCode}</Badge>
                  ) : null}
                </div>
              </TableCell>
              <TableCell className="text-muted-foreground">
                <div className="flex flex-col gap-1 text-sm">
                  <span>Start {formatDate(leader.startDate)}</span>
                  <span>End {formatDate(leader.endDate)}</span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-col items-start gap-2">
                  <ChurchStatusPill status={leader.isActive ? "active" : "inactive"} label={leader.isActive ? "Active" : "Inactive"} />
                  {leader.isPrimary ? <Badge variant="outline">Primary</Badge> : <Badge variant="secondary">Leader</Badge>}
                </div>
              </TableCell>
              <TableCell className="max-w-[280px] text-muted-foreground">
                <p className="truncate text-sm">{leader.notes ?? "—"}</p>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
