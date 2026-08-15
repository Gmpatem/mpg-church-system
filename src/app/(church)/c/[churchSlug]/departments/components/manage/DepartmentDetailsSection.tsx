"use client";

import { useEffect } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { updateDepartmentAction } from "@/features/departments/actions";
import type { DepartmentViewModel } from "../types";
import {
  Field,
  FormMessage,
  ManagePanel,
  manageControlClass,
  useManageMutation,
} from "./ManageDepartmentPrimitives";

export function DepartmentDetailsSection({
  churchSlug,
  department,
  canManage,
  onDirtyChange,
  onMutationSuccess,
  onPendingChange,
}: {
  churchSlug: string;
  department: DepartmentViewModel;
  canManage: boolean;
  onDirtyChange: (dirty: boolean) => void;
  onMutationSuccess: () => void;
  onPendingChange: (pending: boolean) => void;
}) {
  const { state, formAction, pending } = useManageMutation({
    action: updateDepartmentAction,
    onSuccess: () => {
      onDirtyChange(false);
      onMutationSuccess();
    },
  });

  useEffect(() => onPendingChange(pending), [onPendingChange, pending]);

  return (
    <form
      id="department-details-form"
      action={formAction}
      className="grid gap-4"
      onInput={() => onDirtyChange(true)}
      onChange={() => onDirtyChange(true)}
    >
      <input type="hidden" name="churchSlug" value={churchSlug} />
      <input type="hidden" name="departmentId" value={department.id} />

      <ManagePanel
        title="Department identity"
        description="Keep the public name, short code, and ministry description accurate for this church."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Department name" htmlFor="manage-department-name" className="sm:col-span-2">
            <Input
              id="manage-department-name"
              name="department_name"
              defaultValue={department.name}
              required
              maxLength={120}
              disabled={!canManage}
              className={manageControlClass}
            />
          </Field>
          <Field label="Code" htmlFor="manage-department-code" hint="Optional short identifier used in registers and filters.">
            <Input
              id="manage-department-code"
              name="code"
              defaultValue={department.code ?? ""}
              maxLength={50}
              disabled={!canManage}
              className={manageControlClass}
            />
          </Field>
          <div className="flex items-end pb-2">
            <label className="inline-flex items-center gap-3 text-sm font-medium text-foreground">
              <Checkbox name="is_active" defaultChecked={department.isActive} disabled={!canManage} />
              Active department
            </label>
          </div>
          <Field label="Description" htmlFor="manage-department-description" className="sm:col-span-2">
            <Textarea
              id="manage-department-description"
              name="description"
              defaultValue={department.description ?? ""}
              maxLength={500}
              disabled={!canManage}
              className="min-h-32 rounded-xl border-primary/10 bg-background focus-visible:ring-primary/30"
            />
          </Field>
        </div>
      </ManagePanel>

      {!canManage ? (
        <p className="rounded-xl border border-border bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
          Your department access allows member operations, but only a church administrator or clerk can change department details.
        </p>
      ) : null}
      <FormMessage state={state} />
    </form>
  );
}
