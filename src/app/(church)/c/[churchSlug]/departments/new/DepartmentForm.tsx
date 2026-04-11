"use client";

import Link from "next/link";
import { useActionState } from "react";
import { createDepartmentAction } from "@/features/departments/actions";
import { useI18n } from "@/features/i18n";
import type { ActionState, DepartmentRecord } from "@/features/departments/types";

interface DepartmentFormProps {
  churchSlug: string;
  action?: (prevState: ActionState | null, formData: FormData) => Promise<ActionState>;
  initialValues?: DepartmentRecord | null;
  submitLabel?: string;
  pendingLabel?: string;
  showHeader?: boolean;
  title?: string;
  description?: string;
  backHref?: string;
  cancelHref?: string;
}

export function DepartmentForm({
  churchSlug,
  action = createDepartmentAction,
  initialValues,
  submitLabel,
  pendingLabel,
  showHeader = true,
  title,
  description,
  backHref,
  cancelHref,
}: DepartmentFormProps) {
  const { t } = useI18n();
  const [state, formAction, isPending] = useActionState(action, null);

  const computedTitle = title ?? (initialValues ? "Department Settings" : t.pages.departmentForm.title);
  const computedDescription =
    description ??
    (initialValues
      ? "Update department profile information and operational status."
      : t.pages.departmentForm.description);
  const computedBackHref = backHref ?? `/c/${churchSlug}/departments`;
  const computedCancelHref = cancelHref ?? `/c/${churchSlug}/departments`;
  const computedSubmitLabel = submitLabel ?? (initialValues ? "Save Changes" : t.pages.departmentForm.create);
  const computedPendingLabel = pendingLabel ?? (initialValues ? "Saving..." : t.pages.departmentForm.creating);

  return (
    <div className="space-y-4">
      {showHeader ? (
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">{computedTitle}</h2>
            <p className="text-sm text-slate-600">{computedDescription}</p>
          </div>

          <Link
            href={computedBackHref}
            className="inline-flex items-center rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            {t.pages.departmentForm.backToDepartments}
          </Link>
        </div>
      ) : null}

      <form action={formAction} className="space-y-5 rounded-lg border border-slate-200 bg-white p-5">
        <input type="hidden" name="churchSlug" value={churchSlug} />
        {initialValues ? <input type="hidden" name="departmentId" value={initialValues.id} /> : null}

        {state && !state.ok ? (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {state.error}
          </div>
        ) : null}

        {state && state.ok ? (
          <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {state.message ?? (initialValues ? "Department updated successfully." : t.pages.departmentForm.success)}
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label htmlFor="department_name" className="mb-1 block text-sm font-medium text-slate-700">
              {t.pages.departmentForm.departmentName}
            </label>
            <input
              id="department_name"
              name="department_name"
              type="text"
              defaultValue={initialValues?.department_name ?? ""}
              required
              className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="code" className="mb-1 block text-sm font-medium text-slate-700">
              Code
            </label>
            <input
              id="code"
              name="code"
              defaultValue={initialValues?.code ?? ""}
              placeholder="e.g. men_ministry"
              className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-end">
            <label className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-3 py-2">
              <input
                type="checkbox"
                name="is_active"
                value="true"
                defaultChecked={initialValues ? initialValues.is_active : true}
              />
              <span className="text-sm text-slate-700">Active department</span>
            </label>
          </div>

          <div className="md:col-span-2">
            <label htmlFor="description" className="mb-1 block text-sm font-medium text-slate-700">
              {t.pages.departmentForm.departmentDescription}
            </label>
            <textarea
              id="description"
              name="description"
              rows={4}
              defaultValue={initialValues?.description ?? ""}
              className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          <Link
            href={computedCancelHref}
            className="inline-flex items-center rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            {t.pages.departmentForm.cancel}
          </Link>

          <button
            type="submit"
            disabled={isPending}
            className="rounded-md bg-slate-950 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {isPending ? computedPendingLabel : computedSubmitLabel}
          </button>
        </div>
      </form>
    </div>
  );
}
