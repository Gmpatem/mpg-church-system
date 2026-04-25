"use client";

import { useActionState, useEffect } from "react";
import type { ActionState, DepartmentRecord } from "../types";

interface DepartmentFormProps {
  churchSlug: string;
  action: (prevState: ActionState | null, formData: FormData) => Promise<ActionState>;
  initialValues?: DepartmentRecord | null;
  submitLabel?: string;
  onSuccess?: () => void;
}

const initialState: ActionState = { ok: false };

export function DepartmentForm({
  churchSlug,
  action,
  initialValues,
  submitLabel = "Save Department",
  onSuccess,
}: DepartmentFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);

  useEffect(() => {
    if (!state?.ok || !onSuccess) return;
    onSuccess();
  }, [onSuccess, state]);

  return (
    <form action={formAction} className="space-y-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <input type="hidden" name="churchSlug" value={churchSlug} />
      {initialValues ? <input type="hidden" name="departmentId" value={initialValues.id} /> : null}

      <div className="grid gap-6 md:grid-cols-2">
        <div className="md:col-span-2">
          <label htmlFor="department_name" className="mb-1 block text-sm font-medium text-gray-700">
            Department Name
          </label>
          <input
            id="department_name"
            name="department_name"
            defaultValue={initialValues?.department_name ?? ""}
            required
            className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="code" className="mb-1 block text-sm font-medium text-gray-700">
            Code
          </label>
          <input
            id="code"
            name="code"
            defaultValue={initialValues?.code ?? ""}
            placeholder="e.g. men_ministry"
            className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-end">
          <label className="inline-flex items-center gap-2 rounded-md border border-gray-300 px-3 py-2">
            <input
              type="checkbox"
              name="is_active"
              value="true"
              defaultChecked={initialValues ? initialValues.is_active : true}
            />
            <span className="text-sm text-gray-700">Active department</span>
          </label>
        </div>

        <div className="md:col-span-2">
          <label htmlFor="description" className="mb-1 block text-sm font-medium text-gray-700">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            rows={4}
            defaultValue={initialValues?.description ?? ""}
            className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {state?.error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </div>
      ) : null}

      {state?.ok && state?.message ? (
        <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
          {state.message}
        </div>
      ) : null}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {pending ? "Saving..." : submitLabel}
        </button>
      </div>
    </form>
  );
}
