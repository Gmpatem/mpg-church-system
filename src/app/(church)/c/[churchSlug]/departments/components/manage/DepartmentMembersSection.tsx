"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Archive, Pencil, Users } from "lucide-react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  assignMembersToDepartmentAction,
  removeAssignmentAction,
  updateAssignmentAction,
} from "@/features/departments/actions";
import { cn } from "@/lib/utils/cn";
import type {
  DepartmentWorkspaceBundle,
  DepartmentsWorkspaceData,
  PersonViewModel,
} from "../types";
import {
  Field,
  FormMessage,
  ManagePanel,
  MultiMemberPicker,
  SearchInput,
  manageControlClass,
  useManageMutation,
} from "./ManageDepartmentPrimitives";

function displayDate(value: string | null) {
  if (!value) return "Not set";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function MemberEditForm({
  churchSlug,
  person,
  onDirtyChange,
  onMutationSuccess,
  onCancel,
}: {
  churchSlug: string;
  person: PersonViewModel;
  onDirtyChange: (dirty: boolean) => void;
  onMutationSuccess: () => void;
  onCancel: () => void;
}) {
  const { state, formAction, pending } = useManageMutation({
    action: updateAssignmentAction,
    onSuccess: () => {
      onDirtyChange(false);
      onMutationSuccess();
    },
  });

  return (
    <ManagePanel
      title={`Edit ${person.name}`}
      description="Update this member's department role, start date, or active assignment status."
    >
      <form
        action={formAction}
        className="grid gap-4"
        onInput={() => onDirtyChange(true)}
        onChange={() => onDirtyChange(true)}
      >
        <input type="hidden" name="churchSlug" value={churchSlug} />
        <input type="hidden" name="assignmentId" value={person.assignmentId} />
        <input type="hidden" name="department_id" value={person.departmentId} />
        <input type="hidden" name="member_id" value={person.id} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Role title" htmlFor={`member-role-${person.assignmentId}`}>
            <Input
              id={`member-role-${person.assignmentId}`}
              name="role_title"
              defaultValue={person.roleTitle ?? ""}
              maxLength={120}
              className={manageControlClass}
            />
          </Field>
          <Field label="Start date" htmlFor={`member-start-${person.assignmentId}`}>
            <Input
              id={`member-start-${person.assignmentId}`}
              name="start_date"
              type="date"
              defaultValue={person.startDate?.slice(0, 10) ?? ""}
              className={manageControlClass}
            />
          </Field>
        </div>
        <label className="inline-flex items-center gap-3 text-sm font-medium text-foreground">
          <Checkbox name="is_active" defaultChecked={person.isActive} />
          Active assignment
        </label>
        <FormMessage state={state} />
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={onCancel} className="rounded-xl">
            Cancel
          </Button>
          <Button type="submit" disabled={pending} className="rounded-xl">
            {pending ? "Saving..." : "Save assignment"}
          </Button>
        </div>
      </form>
    </ManagePanel>
  );
}

function ArchiveMemberDialog({
  churchSlug,
  person,
  isLeader,
  open,
  onOpenChange,
  onMutationSuccess,
}: {
  churchSlug: string;
  person: PersonViewModel | null;
  isLeader: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMutationSuccess: () => void;
}) {
  const { state, formAction, pending } = useManageMutation({
    action: removeAssignmentAction,
    onSuccess: () => {
      onOpenChange(false);
      onMutationSuccess();
    },
  });

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Archive department membership?</AlertDialogTitle>
          <AlertDialogDescription>
            {isLeader
              ? `${person?.name ?? "This member"} still has active department leadership. Remove that leadership assignment first.`
              : `This keeps ${person?.name ?? "the member"}'s history but removes them from the active department roster.`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <form action={formAction} className="grid gap-4">
          <input type="hidden" name="churchSlug" value={churchSlug} />
          <input type="hidden" name="assignmentId" value={person?.assignmentId ?? ""} />
          <input type="hidden" name="departmentId" value={person?.departmentId ?? ""} />
          <FormMessage state={state} />
          <AlertDialogFooter>
            <AlertDialogCancel type="button" disabled={pending}>Cancel</AlertDialogCancel>
            <Button type="submit" variant="destructive" disabled={pending || !person || isLeader}>
              {pending ? "Archiving..." : "Archive membership"}
            </Button>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function DepartmentMembersSection({
  churchSlug,
  data,
  bundle,
  initialAssignmentId,
  canManage,
  onDirtyChange,
  onMutationSuccess,
  onPendingChange,
}: {
  churchSlug: string;
  data: DepartmentsWorkspaceData;
  bundle: DepartmentWorkspaceBundle;
  initialAssignmentId?: string;
  canManage: boolean;
  onDirtyChange: (dirty: boolean) => void;
  onMutationSuccess: () => void;
  onPendingChange: (pending: boolean) => void;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [memberIds, setMemberIds] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [editingAssignmentId, setEditingAssignmentId] = useState<string | null>(
    initialAssignmentId ?? null
  );
  const [archivePerson, setArchivePerson] = useState<PersonViewModel | null>(null);
  const { state, formAction, pending } = useManageMutation({
    action: assignMembersToDepartmentAction,
    onSuccess: () => {
      formRef.current?.reset();
      setMemberIds([]);
      onDirtyChange(false);
      onMutationSuccess();
    },
  });

  useEffect(() => onPendingChange(pending), [onPendingChange, pending]);

  const activeMemberIds = useMemo(
    () => new Set(bundle.people.filter((person) => person.isActive).map((person) => person.id)),
    [bundle.people]
  );
  const availableMembers = data.options.members.filter((member) => !activeMemberIds.has(member.id));
  const filteredPeople = bundle.people.filter((person) =>
    [person.name, person.memberCode, person.email, person.phone, person.roleTitle]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(search.trim().toLowerCase()))
  );
  const editingPerson = bundle.people.find((person) => person.assignmentId === editingAssignmentId) ?? null;
  const activeLeaderMemberIds = new Set(bundle.leadershipAssignments.map((assignment) => assignment.memberId));

  return (
    <div className="grid gap-4">
      <ManagePanel
        title="Add department members"
        description="Choose one or more active church records. Duplicate active assignments are blocked before the batch is changed."
      >
        <form
          ref={formRef}
          id="department-member-form"
          action={formAction}
          className="grid gap-4"
          onInput={() => onDirtyChange(true)}
          onChange={() => onDirtyChange(true)}
        >
          <input type="hidden" name="churchSlug" value={churchSlug} />
          <input type="hidden" name="department_id" value={bundle.department.id} />
          <input type="hidden" name="is_active" value="true" />
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Church members" hint={`${availableMembers.length} ${availableMembers.length === 1 ? "person is" : "people are"} available to add.`}>
              <MultiMemberPicker
                members={availableMembers}
                values={memberIds}
                onChange={(values) => {
                  setMemberIds(values);
                  onDirtyChange(true);
                }}
                disabled={!canManage}
              />
            </Field>
            <Field label="Role title" htmlFor="new-department-member-role">
              <Input
                id="new-department-member-role"
                name="role_title"
                maxLength={120}
                disabled={!canManage}
                placeholder="e.g. Choir member"
                className={manageControlClass}
              />
            </Field>
            <Field label="Start date" htmlFor="new-department-member-start">
              <Input
                id="new-department-member-start"
                name="start_date"
                type="date"
                defaultValue={new Date().toISOString().slice(0, 10)}
                disabled={!canManage}
                className={manageControlClass}
              />
            </Field>
          </div>
          <FormMessage state={state} />
        </form>
      </ManagePanel>

      <ManagePanel
        title="Current members"
        description={`${bundle.department.activeMemberCount} active of ${bundle.people.length} total department assignments.`}
        action={
          <div className="w-full sm:w-72">
            <SearchInput
              id="manage-department-members-search"
              value={search}
              onChange={setSearch}
              placeholder="Search department members..."
            />
          </div>
        }
      >
        {filteredPeople.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-muted/40 px-5 py-10 text-center">
            <Users className="mx-auto size-8 text-muted-foreground" aria-hidden="true" />
            <p className="mt-3 text-sm font-medium text-foreground">No matching department members</p>
            <p className="mt-1 text-sm text-muted-foreground">Try a different search or add a member above.</p>
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <Table className="min-w-[760px]">
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead>Member</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Start date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPeople.map((person) => (
                    <TableRow key={person.assignmentId}>
                      <TableCell>
                        <p className="font-medium text-foreground">{person.name}</p>
                        <p className="text-xs text-muted-foreground">{person.email || person.memberCode || "No contact"}</p>
                      </TableCell>
                      <TableCell>{person.roleTitle || "Member"}</TableCell>
                      <TableCell className="text-muted-foreground">{displayDate(person.startDate)}</TableCell>
                      <TableCell>
                        <Badge variant={person.isActive ? "default" : "secondary"}>{person.isActive ? "Active" : "Archived"}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            aria-label={`Edit ${person.name}'s assignment`}
                            disabled={!canManage}
                            onClick={() => setEditingAssignmentId(person.assignmentId)}
                          >
                            <Pencil className="size-4" aria-hidden="true" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            aria-label={`Archive ${person.name}'s department membership`}
                            disabled={!canManage || !person.isActive}
                            onClick={() => setArchivePerson(person)}
                          >
                            <Archive className="size-4" aria-hidden="true" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="grid gap-3 md:hidden">
              {filteredPeople.map((person) => (
                <article key={person.assignmentId} className="rounded-xl border border-border bg-background p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-foreground">{person.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{person.email || person.memberCode || "No contact"}</p>
                    </div>
                    <Badge variant={person.isActive ? "default" : "secondary"}>{person.isActive ? "Active" : "Archived"}</Badge>
                  </div>
                  <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
                    <div><dt className="text-xs text-muted-foreground">Role</dt><dd>{person.roleTitle || "Member"}</dd></div>
                    <div><dt className="text-xs text-muted-foreground">Started</dt><dd>{displayDate(person.startDate)}</dd></div>
                  </dl>
                  <div className="mt-4 flex gap-2">
                    <Button type="button" variant="outline" size="sm" disabled={!canManage} onClick={() => setEditingAssignmentId(person.assignmentId)} className="flex-1 gap-2 rounded-lg">
                      <Pencil className="size-4" aria-hidden="true" /> Edit
                    </Button>
                    <Button type="button" variant="outline" size="sm" disabled={!canManage || !person.isActive} onClick={() => setArchivePerson(person)} className="flex-1 gap-2 rounded-lg text-destructive hover:text-destructive">
                      <Archive className="size-4" aria-hidden="true" /> Archive
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </ManagePanel>

      {editingPerson ? (
        <MemberEditForm
          key={editingPerson.assignmentId}
          churchSlug={churchSlug}
          person={editingPerson}
          onDirtyChange={onDirtyChange}
          onMutationSuccess={onMutationSuccess}
          onCancel={() => setEditingAssignmentId(null)}
        />
      ) : null}

      <ArchiveMemberDialog
        churchSlug={churchSlug}
        person={archivePerson}
        isLeader={Boolean(archivePerson && activeLeaderMemberIds.has(archivePerson.id))}
        open={Boolean(archivePerson)}
        onOpenChange={(open) => {
          if (!open) setArchivePerson(null);
        }}
        onMutationSuccess={onMutationSuccess}
      />

      {!canManage ? (
        <p className={cn("rounded-xl border border-border bg-muted/50 px-4 py-3 text-sm text-muted-foreground")}>
          You can view the roster, but your current role cannot change member assignments.
        </p>
      ) : null}
    </div>
  );
}
