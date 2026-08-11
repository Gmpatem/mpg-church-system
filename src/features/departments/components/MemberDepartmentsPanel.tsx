"use client";

import { useActionState, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ButtonSpinner } from "@/components/ui/ButtonSpinner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ChurchEmptyState,
  ChurchStatusPill,
  ChurchWorkspacePanel,
} from "@/components/church-workspace";
import { assignMemberToDepartmentAction, removeAssignmentAction } from "../actions";
import type { ActionState, DepartmentAssignmentRecord } from "../types";

const initialAssignState: ActionState = { ok: false };
const initialRemoveState: ActionState = { ok: false };

interface MemberDepartmentsPanelProps {
  churchSlug: string;
  memberId: string;
  memberLabel: string;
  assignments: DepartmentAssignmentRecord[];
  departments: Array<{ id: string; name: string; code: string | null; is_active: boolean }>;
}

export function MemberDepartmentsPanel({
  churchSlug,
  memberId,
  memberLabel,
  assignments,
  departments,
}: MemberDepartmentsPanelProps) {
  const [assignState, assignAction, assignPending] = useActionState(assignMemberToDepartmentAction, initialAssignState);
  const [removeState, removeAction, removePending] = useActionState(removeAssignmentAction, initialRemoveState);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState("");
  const activeDepartments = departments.filter((department) => department.is_active);

  return (
    <ChurchWorkspacePanel
      title="Member Departments"
      description={`Manage department assignments for ${memberLabel}.`}
      contentClassName="p-4 sm:p-5"
    >
      <div className="flex flex-col gap-5">
        <form
          action={assignAction}
          className="grid min-w-0 gap-4 rounded-lg border border-border bg-muted/30 p-4 lg:grid-cols-[minmax(180px,1fr)_minmax(180px,1fr)_180px_auto]"
        >
          <input type="hidden" name="churchSlug" value={churchSlug} />
          <input type="hidden" name="member_id" value={memberId} />
          <input type="hidden" name="is_active" value="true" />
          <input type="hidden" name="department_id" value={selectedDepartmentId} />

          <div className="min-w-0">
            <Label htmlFor="department_id" className="mb-1.5 block text-xs font-medium text-muted-foreground">
              Department
            </Label>
            <Select value={selectedDepartmentId} onValueChange={setSelectedDepartmentId}>
              <SelectTrigger id="department_id" className="h-10 rounded-lg bg-background">
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {activeDepartments.map((department) => (
                    <SelectItem key={department.id} value={department.id}>
                      {department.name}
                      {department.code ? ` (${department.code})` : ""}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div className="min-w-0">
            <Label htmlFor="role_title" className="mb-1.5 block text-xs font-medium text-muted-foreground">
              Role Title
            </Label>
            <Input
              id="role_title"
              name="role_title"
              placeholder="Leader, Assistant, Member"
              className="h-10 rounded-lg bg-background"
            />
          </div>

          <div className="min-w-0">
            <Label htmlFor="start_date" className="mb-1.5 block text-xs font-medium text-muted-foreground">
              Start Date
            </Label>
            <Input
              id="start_date"
              name="start_date"
              type="date"
              className="h-10 rounded-lg bg-background"
            />
          </div>

          <div className="flex items-end">
            <Button
              type="submit"
              disabled={assignPending || !selectedDepartmentId}
              className="h-10 w-full rounded-lg px-4 lg:w-auto"
            >
              {assignPending ? (
                <span className="inline-flex items-center gap-2">
                  <ButtonSpinner />
                  Assigning
                </span>
              ) : (
                "Assign Department"
              )}
            </Button>
          </div>
        </form>

        <ActionNotice state={assignState} />
        <ActionNotice state={removeState} />

        {assignments.length === 0 ? (
          <ChurchEmptyState
            title="No department assignments"
            message="This member has no department assignments yet."
          />
        ) : (
          <div className="min-w-0 overflow-hidden rounded-lg border border-border">
            <Table className="min-w-[760px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Department</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignments.map((assignment) => (
                  <TableRow key={assignment.id}>
                    <TableCell className="font-medium text-foreground">
                      {assignment.department_name ?? "Unknown Department"}
                    </TableCell>
                    <TableCell>
                      {assignment.role_title ? (
                        <Badge variant="secondary">{assignment.role_title}</Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {assignment.start_date ?? "—"}
                    </TableCell>
                    <TableCell>
                      <ChurchStatusPill
                        status={assignment.is_active ? "active" : "inactive"}
                        label={assignment.is_active ? "Active" : "Inactive"}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      {assignment.is_active ? (
                        <form action={removeAction} className="inline-flex">
                          <input type="hidden" name="churchSlug" value={churchSlug} />
                          <input type="hidden" name="assignmentId" value={assignment.id} />
                          <Button
                            type="submit"
                            variant="ghost"
                            size="sm"
                            disabled={removePending}
                            className="text-destructive hover:text-destructive"
                          >
                            Remove
                          </Button>
                        </form>
                      ) : (
                        <span className="text-sm text-muted-foreground">Archived</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </ChurchWorkspacePanel>
  );
}

function ActionNotice({ state }: { state: ActionState | null }) {
  if (!state?.error && !(state?.ok && state?.message)) return null;

  return (
    <div
      className={
        state.error
          ? "rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          : "rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700"
      }
    >
      {state.error ?? state.message}
    </div>
  );
}
