"use client";

import { useActionState, useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  assignMemberToDepartmentAction,
  createDepartmentAction,
  removeAssignmentAction,
  updateAssignmentAction,
  updateDepartmentAction,
} from "@/features/departments/actions";
import { createDepartmentEventDraftFormAction } from "@/features/department-events/actions";
import { createDepartmentFundRequestAction } from "@/features/department-finance/actions";
import type {
  DepartmentDialog,
  DepartmentViewModel,
  DepartmentWorkspaceBundle,
  DepartmentsWorkspaceData,
  PersonViewModel,
} from "../types";

type ActionState = {
  ok: boolean;
  message?: string;
  error?: string;
};

type ServerAction = (
  prevState: any,
  formData: FormData
) => Promise<ActionState>;

const blankState: ActionState | null = null;

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="grid gap-1.5 text-sm">
      <span className="font-medium text-foreground">{label}</span>
      {children}
    </label>
  );
}

function FormMessage({ state }: { state: ActionState | null }) {
  if (!state?.error && !state?.message) return null;

  return (
    <p
      className={
        state.ok
          ? "rounded-lg border border-primary/20 bg-primary/10 px-3 py-2 text-sm text-primary"
          : "rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive"
      }
    >
      {state.error || state.message}
    </p>
  );
}

function useServerForm({
  action,
  onSuccess,
}: {
  action: ServerAction;
  onSuccess: () => void;
}) {
  const [state, formAction, pending] = useActionState(action, blankState);

  useEffect(() => {
    if (!state?.ok) return;
    onSuccess();
  }, [onSuccess, state?.ok]);

  return { state, formAction, pending };
}

function DepartmentFormDialog({
  churchSlug,
  department,
  onSuccess,
}: {
  churchSlug: string;
  department?: DepartmentViewModel | null;
  onSuccess: () => void;
}) {
  const isEdit = Boolean(department);
  const { state, formAction, pending } = useServerForm({
    action: isEdit ? updateDepartmentAction : createDepartmentAction,
    onSuccess,
  });

  return (
    <form action={formAction} className="grid gap-4">
      <input type="hidden" name="churchSlug" value={churchSlug} />
      {department ? <input type="hidden" name="departmentId" value={department.id} /> : null}

      <Field label="Department name">
        <Input
          name="department_name"
          defaultValue={department?.name ?? ""}
          required
          maxLength={120}
          className="rounded-lg"
        />
      </Field>

      <Field label="Code">
        <Input
          name="code"
          defaultValue={department?.code ?? ""}
          maxLength={50}
          className="rounded-lg"
        />
      </Field>

      <Field label="Description">
        <Textarea
          name="description"
          defaultValue={department?.description ?? ""}
          maxLength={500}
          className="min-h-24 rounded-lg"
        />
      </Field>

      <label className="inline-flex items-center gap-2 text-sm text-foreground">
        <input
          type="checkbox"
          name="is_active"
          defaultChecked={department?.isActive ?? true}
          className="size-4 rounded border-border"
        />
        Active department
      </label>

      <FormMessage state={state} />

      <DialogFooter className="gap-2 sm:gap-2 sm:space-x-0">
        <Button type="submit" disabled={pending} className="rounded-lg">
          {pending ? "Saving..." : isEdit ? "Save Department" : "Create Department"}
        </Button>
      </DialogFooter>
    </form>
  );
}

function AssignmentFormDialog({
  churchSlug,
  data,
  departmentId,
  assignment,
  onSuccess,
}: {
  churchSlug: string;
  data: DepartmentsWorkspaceData;
  departmentId: string;
  assignment?: PersonViewModel | null;
  onSuccess: () => void;
}) {
  const isEdit = Boolean(assignment);
  const { state, formAction, pending } = useServerForm({
    action: isEdit ? updateAssignmentAction : assignMemberToDepartmentAction,
    onSuccess,
  });
  const availableMembers = isEdit
    ? data.options.members
    : data.options.members.filter((member) => member.id !== assignment?.id);

  return (
    <form action={formAction} className="grid gap-4">
      <input type="hidden" name="churchSlug" value={churchSlug} />
      <input type="hidden" name="department_id" value={assignment?.departmentId ?? departmentId} />
      {assignment ? <input type="hidden" name="assignmentId" value={assignment.assignmentId} /> : null}

      <Field label="Member">
        <select
          name="member_id"
          defaultValue={assignment?.id ?? ""}
          required
          disabled={isEdit}
          className="h-10 rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none transition focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
        >
          <option value="">Select a member</option>
          {availableMembers.map((member) => (
            <option key={member.id} value={member.id}>
              {member.label}
              {member.member_code ? ` (${member.member_code})` : ""}
            </option>
          ))}
        </select>
      </Field>
      {isEdit && assignment ? <input type="hidden" name="member_id" value={assignment.id} /> : null}

      <Field label="Role title">
        <Input
          name="role_title"
          defaultValue={assignment?.roleTitle ?? ""}
          maxLength={120}
          className="rounded-lg"
        />
      </Field>

      <Field label="Start date">
        <Input
          name="start_date"
          type="date"
          defaultValue={assignment?.startDate?.slice(0, 10) ?? ""}
          className="rounded-lg"
        />
      </Field>

      <label className="inline-flex items-center gap-2 text-sm text-foreground">
        <input
          type="checkbox"
          name="is_active"
          defaultChecked={assignment?.isActive ?? true}
          className="size-4 rounded border-border"
        />
        Active assignment
      </label>

      <FormMessage state={state} />

      <DialogFooter className="gap-2 sm:gap-2 sm:space-x-0">
        <Button type="submit" disabled={pending} className="rounded-lg">
          {pending ? "Saving..." : isEdit ? "Save Assignment" : "Add Person"}
        </Button>
      </DialogFooter>
    </form>
  );
}

function ActivityFormDialog({
  churchSlug,
  departmentId,
  onSuccess,
}: {
  churchSlug: string;
  departmentId: string;
  onSuccess: () => void;
}) {
  const { state, formAction, pending } = useServerForm({
    action: createDepartmentEventDraftFormAction,
    onSuccess,
  });

  return (
    <form action={formAction} className="grid gap-4">
      <input type="hidden" name="churchSlug" value={churchSlug} />
      <input type="hidden" name="departmentId" value={departmentId} />

      <Field label="Title">
        <Input name="title" required maxLength={180} className="rounded-lg" />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Type">
          <select
            name="eventType"
            defaultValue="department_activity"
            className="h-10 rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none transition focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="department_activity">Department activity</option>
            <option value="meeting">Meeting</option>
            <option value="training">Training</option>
            <option value="outreach">Outreach</option>
            <option value="worship">Worship</option>
          </select>
        </Field>

        <Field label="Location">
          <Input name="location" maxLength={180} className="rounded-lg" />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Starts">
          <Input name="startDateTime" type="datetime-local" required className="rounded-lg" />
        </Field>
        <Field label="Ends">
          <Input name="endDateTime" type="datetime-local" required className="rounded-lg" />
        </Field>
      </div>

      <Field label="Description">
        <Textarea name="description" className="min-h-24 rounded-lg" />
      </Field>

      <label className="inline-flex items-center gap-2 text-sm text-foreground">
        <input type="checkbox" name="isAllDay" className="size-4 rounded border-border" />
        All-day activity
      </label>

      <FormMessage state={state} />

      <DialogFooter className="gap-2 sm:gap-2 sm:space-x-0">
        <Button type="submit" disabled={pending} className="rounded-lg">
          {pending ? "Creating..." : "Create Activity Draft"}
        </Button>
      </DialogFooter>
    </form>
  );
}

function FundRequestFormDialog({
  churchSlug,
  bundle,
  onSuccess,
}: {
  churchSlug: string;
  bundle: DepartmentWorkspaceBundle;
  onSuccess: () => void;
}) {
  const { state, formAction, pending } = useServerForm({
    action: createDepartmentFundRequestAction,
    onSuccess,
  });
  const funds = bundle.budget?.financeOptions.funds ?? [];

  return (
    <form action={formAction} className="grid gap-4">
      <input type="hidden" name="churchSlug" value={churchSlug} />
      <input type="hidden" name="departmentId" value={bundle.department.id} />

      <Field label="Request title">
        <Input name="title" required maxLength={180} className="rounded-lg" />
      </Field>

      <Field label="Purpose">
        <Textarea name="purpose" required className="min-h-24 rounded-lg" />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Amount">
          <Input name="amount" type="number" min="0" step="0.01" required className="rounded-lg" />
        </Field>
        <Field label="Outflow date">
          <Input name="outflowDate" type="date" required className="rounded-lg" />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Department fund">
          <select
            name="fundId"
            required
            className="h-10 rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none transition focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="">Select a fund</option>
            {funds.map((fund) => (
              <option key={fund.id} value={fund.id}>
                {fund.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Category">
          <select
            name="outflowType"
            defaultValue="department_expense"
            className="h-10 rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none transition focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="department_expense">Department expense</option>
            <option value="project">Project</option>
            <option value="evangelism">Evangelism</option>
            <option value="mission_remittance">Mission remittance</option>
            <option value="operations">Operations</option>
            <option value="welfare">Welfare</option>
            <option value="equipment">Equipment</option>
            <option value="other">Other</option>
          </select>
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Related event">
          <select
            name="eventId"
            className="h-10 rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none transition focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="">No related event</option>
            {bundle.eventOptions.map((event) => (
              <option key={event.id} value={event.id}>
                {event.title}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Payee">
          <Input name="payee" maxLength={180} className="rounded-lg" />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Reference">
          <Input name="referenceNumber" maxLength={120} className="rounded-lg" />
        </Field>
        <Field label="Project name">
          <Input name="projectName" maxLength={180} className="rounded-lg" />
        </Field>
      </div>

      <input type="hidden" name="preferredFundId" value="" />

      <Field label="Note">
        <Textarea name="note" className="min-h-20 rounded-lg" />
      </Field>

      <FormMessage state={state} />

      <DialogFooter className="gap-2 sm:gap-2 sm:space-x-0">
        <Button type="submit" disabled={pending || funds.length === 0} className="rounded-lg">
          {pending ? "Submitting..." : "Submit Request"}
        </Button>
      </DialogFooter>
    </form>
  );
}

function RemoveAssignmentDialog({
  churchSlug,
  assignment,
  open,
  onOpenChange,
  onSuccess,
}: {
  churchSlug: string;
  assignment: PersonViewModel | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const { state, formAction, pending } = useServerForm({
    action: removeAssignmentAction,
    onSuccess,
  });

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remove Assignment</AlertDialogTitle>
          <AlertDialogDescription>
            This archives the department assignment for {assignment?.name ?? "this person"}.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <form action={formAction} className="grid gap-4">
          <input type="hidden" name="churchSlug" value={churchSlug} />
          <input type="hidden" name="assignmentId" value={assignment?.assignmentId ?? ""} />
          <FormMessage state={state} />
          <AlertDialogFooter>
            <AlertDialogCancel type="button" disabled={pending}>
              Cancel
            </AlertDialogCancel>
            <Button type="submit" variant="destructive" disabled={pending || !assignment}>
              {pending ? "Removing..." : "Remove Assignment"}
            </Button>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function DepartmentsDialogHost({
  churchSlug,
  data,
  bundle,
  activeDialog,
  onDialogChange,
}: {
  churchSlug: string;
  data: DepartmentsWorkspaceData;
  bundle: DepartmentWorkspaceBundle | null;
  activeDialog: DepartmentDialog;
  onDialogChange: (dialog: DepartmentDialog) => void;
}) {
  const router = useRouter();
  const department =
    activeDialog && "departmentId" in activeDialog
      ? data.departments.find((item) => item.id === activeDialog.departmentId) ?? null
      : null;
  const assignment =
    activeDialog?.type === "edit-member-assignment" || activeDialog?.type === "remove-member"
      ? bundle?.people.find((person) => person.assignmentId === activeDialog.assignmentId) ?? null
      : null;

  function handleSuccess() {
    onDialogChange(null);
    router.refresh();
  }

  if (activeDialog?.type === "remove-member") {
    return (
      <RemoveAssignmentDialog
        churchSlug={churchSlug}
        assignment={assignment}
        open={true}
        onOpenChange={(open) => {
          if (!open) onDialogChange(null);
        }}
        onSuccess={handleSuccess}
      />
    );
  }

  const open = Boolean(activeDialog);
  const title =
    activeDialog?.type === "create-department"
      ? "Add Department"
      : activeDialog?.type === "edit-department"
        ? "Edit Department"
        : activeDialog?.type === "add-member"
          ? "Add Person"
          : activeDialog?.type === "edit-member-assignment"
            ? "Edit Assignment"
            : activeDialog?.type === "create-activity"
              ? "Add Activity"
              : activeDialog?.type === "request-funds"
                ? "Request Funds"
                : "Departments";
  const description =
    activeDialog?.type === "request-funds"
      ? "Submit a department finance request for treasury review."
      : "Complete the required fields and save the department workspace record.";

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onDialogChange(null);
      }}
    >
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto rounded-xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {activeDialog?.type === "create-department" ? (
          <DepartmentFormDialog churchSlug={churchSlug} onSuccess={handleSuccess} />
        ) : null}

        {activeDialog?.type === "edit-department" ? (
          <DepartmentFormDialog
            churchSlug={churchSlug}
            department={department}
            onSuccess={handleSuccess}
          />
        ) : null}

        {activeDialog?.type === "add-member" ? (
          <AssignmentFormDialog
            churchSlug={churchSlug}
            data={data}
            departmentId={activeDialog.departmentId}
            onSuccess={handleSuccess}
          />
        ) : null}

        {activeDialog?.type === "edit-member-assignment" ? (
          <AssignmentFormDialog
            churchSlug={churchSlug}
            data={data}
            departmentId={assignment?.departmentId ?? bundle?.department.id ?? ""}
            assignment={assignment}
            onSuccess={handleSuccess}
          />
        ) : null}

        {activeDialog?.type === "create-activity" ? (
          <ActivityFormDialog
            churchSlug={churchSlug}
            departmentId={activeDialog.departmentId}
            onSuccess={handleSuccess}
          />
        ) : null}

        {activeDialog?.type === "request-funds" && bundle ? (
          <FundRequestFormDialog
            churchSlug={churchSlug}
            bundle={bundle}
            onSuccess={handleSuccess}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
