"use client";

import Link from "next/link";
import { useActionState } from "react";
import { createDepartmentAction } from "@/features/departments/actions";

interface DepartmentFormProps {
  churchSlug: string;
}

export function DepartmentForm({ churchSlug }: DepartmentFormProps) {
  const [state, formAction, isPending] = useActionState(createDepartmentAction, null);

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Add Department</h2>
          <p className="text-sm text-slate-600">Create a ministry or organizational department.</p>
        </div>

        <Link
          href={`/c/${churchSlug}/departments`}
          className="inline-flex items-center rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          Back to Departments
        </Link>
      </div>

      <form action={formAction} className="space-y-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <input type="hidden" name="churchSlug" value={churchSlug} />

        {state && !state.ok ? (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {state.error}
          </div>
        ) : null}

        {state && state.ok ? (
          <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {state.message ?? "Department created successfully."}
          </div>
        ) : null}

        <div>
          <label htmlFor="department_name" className="block text-sm font-medium text-slate-700 mb-1">
            Department Name
          </label>
          <input
            id="department_name"
            name="department_name"
            type="text"
            required
            className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-1">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            rows={4}
            className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center justify-end gap-3">
          <Link
            href={`/c/${churchSlug}/departments`}
            className="inline-flex items-center rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={isPending}
            className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {isPending ? "Creating..." : "Create Department"}
          </button>
        </div>
      </form>
    </div>
  );
}
