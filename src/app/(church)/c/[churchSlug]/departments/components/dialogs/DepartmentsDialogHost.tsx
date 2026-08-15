"use client";

import { useActionState, useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
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
  createDepartmentAction,
  updateDepartmentAction,
} from "@/features/departments/actions";
import {
  createDepartmentActionPlanItemAction,
  updateDepartmentActionPlanItemAction,
} from "@/features/departments/action-plan-actions";
import { createDepartmentEventDraftFormAction } from "@/features/department-events/actions";
import { createDepartmentFundRequestAction } from "@/features/department-finance/actions";
import type {
  DepartmentDialog,
  ActionPlanItemViewModel,
  DepartmentViewModel,
  DepartmentWorkspaceBundle,
  DepartmentsWorkspaceData,
} from "../types";
import { ManageDepartmentDialog } from "../manage/ManageDepartmentDialog";

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

function ActionPlanFormDialog({
  churchSlug,
  bundle,
  item,
  onSuccess,
}: {
  churchSlug: string;
  bundle: DepartmentWorkspaceBundle;
  item?: ActionPlanItemViewModel | null;
  onSuccess: () => void;
}) {
  const isEdit = Boolean(item);
  const { state, formAction, pending } = useServerForm({
    action: isEdit
      ? updateDepartmentActionPlanItemAction
      : createDepartmentActionPlanItemAction,
    onSuccess,
  });
  const activePeople = bundle.people.filter((person) => person.isActive);

  return (
    <form action={formAction} className="grid gap-4">
      <input type="hidden" name="churchSlug" value={churchSlug} />
      <input type="hidden" name="departmentId" value={bundle.department.id} />
      {item ? <input type="hidden" name="itemId" value={item.id} /> : null}

      <Field label="Title">
        <Input name="title" defaultValue={item?.title ?? ""} required maxLength={180} className="rounded-lg" />
      </Field>

      <Field label="Description">
        <Textarea name="description" defaultValue={item?.description ?? ""} maxLength={2000} className="min-h-24 rounded-lg" />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Ministry area">
          <Input name="area" defaultValue={item?.area ?? ""} maxLength={120} className="rounded-lg" />
        </Field>
        <Field label="Responsible person">
          <select
            name="assignedToMemberId"
            defaultValue={item?.assignedToMemberId ?? ""}
            required
            className="h-10 rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none transition focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="">Select a department member</option>
            {activePeople.map((person) => (
              <option key={person.id} value={person.id}>{person.name}</option>
            ))}
          </select>
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Due date">
          <Input name="dueDate" type="date" defaultValue={item?.dueDate?.slice(0, 10) ?? ""} className="rounded-lg" />
        </Field>
        <Field label="Priority">
          <select
            name="priority"
            defaultValue={item?.priority ?? "normal"}
            className="h-10 rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none transition focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="low">Low</option>
            <option value="normal">Normal</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </Field>
        <Field label="Status">
          <select
            name="status"
            defaultValue={item?.status ?? "pending"}
            className="h-10 rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none transition focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="pending">Planned</option>
            <option value="accepted">Accepted</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Progress percentage">
          <Input name="progress" type="number" min="0" max="100" step="1" defaultValue={item?.progress ?? 0} className="rounded-lg" />
        </Field>
        <Field label="Related event">
          <select
            name="relatedEventId"
            defaultValue={item?.relatedEventId ?? ""}
            className="h-10 rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none transition focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="">No related event</option>
            {bundle.eventOptions.map((event) => (
              <option key={event.id} value={event.id}>{event.title}</option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Notes">
        <Textarea name="notes" defaultValue={item?.notes ?? ""} maxLength={2000} className="min-h-20 rounded-lg" />
      </Field>

      {activePeople.length === 0 ? (
        <p className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
          Add an active department member before creating an action-plan item.
        </p>
      ) : null}
      <FormMessage state={state} />

      <DialogFooter className="gap-2 sm:gap-2 sm:space-x-0">
        <Button type="submit" disabled={pending || activePeople.length === 0} className="rounded-lg">
          {pending ? "Saving..." : isEdit ? "Save Action Item" : "Create Action Item"}
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

export function DepartmentsDialogHost({
  churchSlug,
  data,
  bundle,
  activeDialog,
  onDialogChange,
  onDepartmentSelect,
}: {
  churchSlug: string;
  data: DepartmentsWorkspaceData;
  bundle: DepartmentWorkspaceBundle | null;
  activeDialog: DepartmentDialog;
  onDialogChange: (dialog: DepartmentDialog) => void;
  onDepartmentSelect: (departmentId: string) => void;
}) {
  const router = useRouter();
  const actionPlanItem =
    activeDialog?.type === "edit-action-item"
      ? bundle?.actionPlan.items.find((item) => item.id === activeDialog.itemId) ?? null
      : null;

  function handleSuccess() {
    onDialogChange(null);
    router.refresh();
  }

  if (activeDialog?.type === "manage-department") {
    return (
      <ManageDepartmentDialog
        churchSlug={churchSlug}
        data={data}
        bundle={bundle}
        dialog={activeDialog}
        onDialogChange={onDialogChange}
        onDepartmentSelect={onDepartmentSelect}
        onMutationSuccess={() => router.refresh()}
      />
    );
  }

  const open = Boolean(activeDialog);
  const title =
    activeDialog?.type === "create-department"
      ? "Add Department"
      : activeDialog?.type === "create-action-item"
              ? "New Action Item"
              : activeDialog?.type === "edit-action-item"
                ? "Edit Action Item"
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

        {(activeDialog?.type === "create-action-item" || activeDialog?.type === "edit-action-item") && bundle ? (
          <ActionPlanFormDialog
            churchSlug={churchSlug}
            bundle={bundle}
            item={activeDialog.type === "edit-action-item" ? actionPlanItem : null}
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
