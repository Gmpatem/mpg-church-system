"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Crown, Pencil, ShieldCheck, UserMinus } from "lucide-react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  assignDepartmentLeaderAction,
  removeDepartmentLeaderAction,
  updateDepartmentLeaderAction,
} from "@/features/departments/leadership-actions";
import { departmentLeadershipRoles } from "@/features/departments/leadership-roles";
import type {
  DepartmentWorkspaceBundle,
  DepartmentsWorkspaceData,
  LeadershipAssignmentViewModel,
} from "../types";
import {
  Field,
  FormMessage,
  ManagePanel,
  MemberPicker,
  SearchInput,
  manageControlClass,
  useManageMutation,
} from "./ManageDepartmentPrimitives";

function isEligibleMemberStatus(status: string | null) {
  const normalized = String(status ?? "").toLowerCase();
  return !["inactive", "archived", "deceased", "transferred"].includes(normalized);
}

function leaderDates(assignment: LeadershipAssignmentViewModel) {
  const start = assignment.startDate
    ? new Date(assignment.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : "Start not set";
  const end = assignment.endDate
    ? new Date(assignment.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : "Present";
  return `${start} — ${end}`;
}

function ReplacementConfirm({ currentPrimaryName }: { currentPrimaryName: string }) {
  return (
    <label className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">
      <Checkbox name="replace_primary" className="mt-0.5" />
      <span>
        Replace {currentPrimaryName} as primary leader. Their current primary assignment will be archived with today as the end date.
      </span>
    </label>
  );
}

function AddToDepartmentConfirm({ memberName }: { memberName: string }) {
  return (
    <label className="flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 p-3 text-sm text-foreground">
      <Checkbox name="confirm_add_to_department" className="mt-0.5" />
      <span>
        Add {memberName} to this department’s active member roster before assigning leadership.
      </span>
    </label>
  );
}

function LeadershipEditForm({
  churchSlug,
  bundle,
  assignment,
  onDirtyChange,
  onMutationSuccess,
  onCancel,
}: {
  churchSlug: string;
  bundle: DepartmentWorkspaceBundle;
  assignment: LeadershipAssignmentViewModel;
  onDirtyChange: (dirty: boolean) => void;
  onMutationSuccess: () => void;
  onCancel: () => void;
}) {
  const [roleCode, setRoleCode] = useState(assignment.roleCode ?? "department_leader");
  const [isPrimary, setIsPrimary] = useState(assignment.isPrimary);
  const { state, formAction, pending } = useManageMutation({
    action: updateDepartmentLeaderAction,
    onSuccess: () => {
      onDirtyChange(false);
      onMutationSuccess();
    },
  });
  const otherPrimary = bundle.leadershipAssignments.find(
    (item) => item.isPrimary && item.id !== assignment.id
  );

  return (
    <ManagePanel title={`Edit ${assignment.memberName ?? "leader"}`} description="Update the structured role, term dates, primary status, or administrative notes.">
      <form
        action={formAction}
        className="grid gap-4"
        onInput={() => onDirtyChange(true)}
        onChange={() => onDirtyChange(true)}
      >
        <input type="hidden" name="churchSlug" value={churchSlug} />
        <input type="hidden" name="department_id" value={bundle.department.id} />
        <input type="hidden" name="member_id" value={assignment.memberId} />
        <input type="hidden" name="leadershipAssignmentId" value={assignment.id} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Leadership role" htmlFor={`edit-leader-role-${assignment.id}`}>
            <select
              id={`edit-leader-role-${assignment.id}`}
              name="leadership_role_code"
              value={roleCode}
              onChange={(event) => {
                setRoleCode(event.target.value);
                if (event.target.value !== "department_leader") setIsPrimary(false);
              }}
              className={`w-full ${manageControlClass} px-3 text-sm text-foreground outline-none`}
            >
              {departmentLeadershipRoles.map((role) => <option key={role.code} value={role.code}>{role.name}</option>)}
            </select>
          </Field>
          <Field label="Start date" htmlFor={`edit-leader-start-${assignment.id}`}>
            <Input id={`edit-leader-start-${assignment.id}`} name="start_date" type="date" required defaultValue={assignment.startDate?.slice(0, 10) ?? ""} className={manageControlClass} />
          </Field>
          <Field label="End date" htmlFor={`edit-leader-end-${assignment.id}`} hint="Leave blank while the assignment is active.">
            <Input id={`edit-leader-end-${assignment.id}`} name="end_date" type="date" defaultValue={assignment.endDate?.slice(0, 10) ?? ""} className={manageControlClass} />
          </Field>
          <div className="flex items-end pb-2">
            <label className="inline-flex items-center gap-3 text-sm font-medium text-foreground">
              <Checkbox
                name="is_primary"
                checked={isPrimary}
                disabled={roleCode !== "department_leader"}
                onCheckedChange={(checked) => setIsPrimary(checked === true)}
              />
              Primary department leader
            </label>
          </div>
          <Field label="Notes" htmlFor={`edit-leader-notes-${assignment.id}`} className="sm:col-span-2">
            <Textarea id={`edit-leader-notes-${assignment.id}`} name="notes" defaultValue={assignment.notes ?? ""} maxLength={1000} className="min-h-24 rounded-xl border-primary/10 bg-background" />
          </Field>
        </div>
        {isPrimary && otherPrimary ? <ReplacementConfirm currentPrimaryName={otherPrimary.memberName ?? "the current leader"} /> : null}
        <FormMessage state={state} />
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={onCancel} className="rounded-xl">Cancel</Button>
          <Button type="submit" disabled={pending} className="rounded-xl">{pending ? "Saving..." : "Save leadership"}</Button>
        </div>
      </form>
    </ManagePanel>
  );
}

function RemoveLeaderDialog({
  churchSlug,
  departmentId,
  assignment,
  open,
  onOpenChange,
  onMutationSuccess,
}: {
  churchSlug: string;
  departmentId: string;
  assignment: LeadershipAssignmentViewModel | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMutationSuccess: () => void;
}) {
  const { state, formAction, pending } = useManageMutation({
    action: removeDepartmentLeaderAction,
    onSuccess: () => {
      onOpenChange(false);
      onMutationSuccess();
    },
  });
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Archive leadership assignment?</AlertDialogTitle>
          <AlertDialogDescription>
            This ends {assignment?.memberName ?? "this member"}’s {assignment?.roleName ?? "leadership"} assignment today. Their department membership remains active.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <form action={formAction} className="grid gap-4">
          <input type="hidden" name="churchSlug" value={churchSlug} />
          <input type="hidden" name="departmentId" value={departmentId} />
          <input type="hidden" name="leadershipAssignmentId" value={assignment?.id ?? ""} />
          <FormMessage state={state} />
          <AlertDialogFooter>
            <AlertDialogCancel type="button" disabled={pending}>Cancel</AlertDialogCancel>
            <Button type="submit" variant="destructive" disabled={pending || !assignment}>{pending ? "Archiving..." : "Archive leadership"}</Button>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function DepartmentLeadershipSection({
  churchSlug,
  data,
  bundle,
  initialLeadershipAssignmentId,
  canManage,
  onDirtyChange,
  onMutationSuccess,
  onPendingChange,
}: {
  churchSlug: string;
  data: DepartmentsWorkspaceData;
  bundle: DepartmentWorkspaceBundle;
  initialLeadershipAssignmentId?: string;
  canManage: boolean;
  onDirtyChange: (dirty: boolean) => void;
  onMutationSuccess: () => void;
  onPendingChange: (pending: boolean) => void;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [memberId, setMemberId] = useState("");
  const [roleCode, setRoleCode] = useState("department_leader");
  const [isPrimary, setIsPrimary] = useState(false);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(initialLeadershipAssignmentId ?? null);
  const [removeAssignment, setRemoveAssignment] = useState<LeadershipAssignmentViewModel | null>(null);
  const { state, formAction, pending } = useManageMutation({
    action: assignDepartmentLeaderAction,
    onSuccess: () => {
      formRef.current?.reset();
      setMemberId("");
      setRoleCode("department_leader");
      setIsPrimary(false);
      onDirtyChange(false);
      onMutationSuccess();
    },
  });
  useEffect(() => onPendingChange(pending), [onPendingChange, pending]);

  const eligibleMembers = data.options.members.filter((member) => isEligibleMemberStatus(member.membership_status));
  const activeDepartmentMemberIds = useMemo(
    () => new Set(bundle.people.filter((person) => person.isActive).map((person) => person.id)),
    [bundle.people]
  );
  const selectedMember = eligibleMembers.find((member) => member.id === memberId) ?? null;
  const needsMembershipConfirm = Boolean(memberId && !activeDepartmentMemberIds.has(memberId));
  const currentPrimary = bundle.leadershipAssignments.find((assignment) => assignment.isPrimary) ?? null;
  const filteredAssignments = bundle.leadershipAssignments.filter((assignment) =>
    [assignment.memberName, assignment.memberEmail, assignment.memberCode, assignment.roleName]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(search.trim().toLowerCase()))
  );
  const editingAssignment = bundle.leadershipAssignments.find((assignment) => assignment.id === editingId) ?? null;

  return (
    <div className="grid gap-4">
      <ManagePanel title="Assign department leadership" description="Leadership uses verified assignment records and never grants church-wide administrator access.">
        <form ref={formRef} id="department-leader-form" action={formAction} className="grid gap-4" onInput={() => onDirtyChange(true)} onChange={() => onDirtyChange(true)}>
          <input type="hidden" name="churchSlug" value={churchSlug} />
          <input type="hidden" name="department_id" value={bundle.department.id} />
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Church member" hint="Existing department members are preferred; adding a non-member requires confirmation.">
              <MemberPicker
                members={eligibleMembers}
                value={memberId}
                onChange={(value) => {
                  setMemberId(value);
                  onDirtyChange(true);
                }}
                disabled={!canManage}
              />
            </Field>
            <Field label="Leadership role" htmlFor="new-leader-role">
              <select
                id="new-leader-role"
                name="leadership_role_code"
                value={roleCode}
                disabled={!canManage}
                onChange={(event) => {
                  setRoleCode(event.target.value);
                  if (event.target.value !== "department_leader") setIsPrimary(false);
                }}
                className={`w-full ${manageControlClass} px-3 text-sm text-foreground outline-none disabled:opacity-60`}
              >
                {departmentLeadershipRoles.map((role) => <option key={role.code} value={role.code}>{role.name}</option>)}
              </select>
            </Field>
            <Field label="Start date" htmlFor="new-leader-start">
              <Input id="new-leader-start" name="start_date" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} disabled={!canManage} className={manageControlClass} />
            </Field>
            <Field label="End date" htmlFor="new-leader-end" hint="Leave blank while this assignment is active.">
              <Input id="new-leader-end" name="end_date" type="date" disabled={!canManage} className={manageControlClass} />
            </Field>
            <Field label="Administrative notes" htmlFor="new-leader-notes" className="md:col-span-2">
              <Textarea id="new-leader-notes" name="notes" maxLength={1000} disabled={!canManage} className="min-h-24 rounded-xl border-primary/10 bg-background" />
            </Field>
          </div>
          <label className="inline-flex items-center gap-3 text-sm font-medium text-foreground">
            <Checkbox name="is_primary" checked={isPrimary} disabled={!canManage || roleCode !== "department_leader"} onCheckedChange={(checked) => setIsPrimary(checked === true)} />
            Make this the primary department leader
          </label>
          {needsMembershipConfirm && selectedMember ? <AddToDepartmentConfirm memberName={selectedMember.label} /> : null}
          {isPrimary && currentPrimary ? <ReplacementConfirm currentPrimaryName={currentPrimary.memberName ?? "the current leader"} /> : null}
          <FormMessage state={state} />
        </form>
      </ManagePanel>

      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
          <div>
            <p className="text-sm font-semibold text-foreground">Department-scoped access only</p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Active department leaders can work inside this department’s modules according to policy. This does not make them a church administrator and does not grant access to other departments.
            </p>
          </div>
        </div>
      </div>

      <ManagePanel
        title="Current leadership"
        description={`${bundle.leadershipAssignments.length} active verified leadership assignment${bundle.leadershipAssignments.length === 1 ? "" : "s"}.`}
        action={<div className="w-full sm:w-72"><SearchInput id="manage-department-leaders-search" value={search} onChange={setSearch} placeholder="Search current leaders..." /></div>}
      >
        {filteredAssignments.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-muted/40 px-5 py-10 text-center">
            <Crown className="mx-auto size-8 text-muted-foreground" aria-hidden="true" />
            <p className="mt-3 text-sm font-medium text-foreground">No active leaders found</p>
            <p className="mt-1 text-sm text-muted-foreground">Assign a structured role using the form above.</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {filteredAssignments.map((assignment) => (
              <article key={assignment.id} className="rounded-xl border border-border bg-background p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-foreground">{assignment.memberName ?? "Church member"}</p>
                      {assignment.isPrimary ? <Badge className="gap-1"><Crown className="size-3" aria-hidden="true" /> Primary</Badge> : null}
                      <Badge variant="outline">{assignment.roleName}</Badge>
                    </div>
                    <p className="mt-1 truncate text-sm text-muted-foreground">{assignment.memberEmail || assignment.memberCode || "No contact details"}</p>
                    <p className="mt-2 text-xs text-muted-foreground">{leaderDates(assignment)}</p>
                    {assignment.notes ? <p className="mt-2 text-sm leading-6 text-muted-foreground">{assignment.notes}</p> : null}
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Button type="button" variant="outline" size="sm" disabled={!canManage} onClick={() => setEditingId(assignment.id)} className="gap-2 rounded-lg">
                      <Pencil className="size-4" aria-hidden="true" /> Edit
                    </Button>
                    <Button type="button" variant="outline" size="sm" disabled={!canManage} onClick={() => setRemoveAssignment(assignment)} className="gap-2 rounded-lg text-destructive hover:text-destructive">
                      <UserMinus className="size-4" aria-hidden="true" /> Remove
                    </Button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </ManagePanel>

      {editingAssignment ? (
        <LeadershipEditForm
          key={editingAssignment.id}
          churchSlug={churchSlug}
          bundle={bundle}
          assignment={editingAssignment}
          onDirtyChange={onDirtyChange}
          onMutationSuccess={onMutationSuccess}
          onCancel={() => setEditingId(null)}
        />
      ) : null}

      <RemoveLeaderDialog
        churchSlug={churchSlug}
        departmentId={bundle.department.id}
        assignment={removeAssignment}
        open={Boolean(removeAssignment)}
        onOpenChange={(open) => {
          if (!open) setRemoveAssignment(null);
        }}
        onMutationSuccess={onMutationSuccess}
      />

      {!canManage ? (
        <p className="rounded-xl border border-border bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
          Only a church administrator or clerk can create, edit, or archive department leadership assignments.
        </p>
      ) : null}
    </div>
  );
}
