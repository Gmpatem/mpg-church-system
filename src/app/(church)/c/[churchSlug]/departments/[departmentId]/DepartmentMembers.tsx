"use client";

import { useActionState, useMemo, useState } from "react";
import type { ActionState, DepartmentAssignmentRecord } from "@/features/departments/types";
import { removeAssignmentAction, updateAssignmentAction } from "@/features/departments/actions";

const initialRemoveState: ActionState = { ok: false };
const initialUpdateState: ActionState = { ok: false };

interface DepartmentMembersProps {
  churchSlug: string;
  assignments: DepartmentAssignmentRecord[];
}

function getDisplayName(item: DepartmentAssignmentRecord) {
  return (
    item.member?.display_name ||
    [item.member?.first_name, item.member?.last_name].filter(Boolean).join(" ") ||
    item.member?.member_code ||
    item.member_id
  );
}

function formatDate(value?: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function AssignmentEditRow({
  churchSlug,
  item,
  onCancel,
}: {
  churchSlug: string;
  item: DepartmentAssignmentRecord;
  onCancel: () => void;
}) {
  const [state, formAction, pending] = useActionState(updateAssignmentAction, initialUpdateState);

  return (
    <form action={formAction} className="space-y-4 rounded-lg border border-blue-200 bg-blue-50 p-4">
      <input type="hidden" name="churchSlug" value={churchSlug} />
      <input type="hidden" name="assignmentId" value={item.id} />
      <input type="hidden" name="member_id" value={item.member_id} />
      <input type="hidden" name="department_id" value={item.department_id ?? ""} />

      <p className="text-sm font-semibold text-slate-900">{getDisplayName(item)}</p>

      <div className="grid gap-3 md:grid-cols-3">
        <div>
          <label htmlFor={`role-${item.id}`} className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">
            Role Title
          </label>
          <input
            id={`role-${item.id}`}
            name="role_title"
            defaultValue={item.role_title ?? ""}
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor={`start-${item.id}`} className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">
            Start Date
          </label>
          <input
            id={`start-${item.id}`}
            name="start_date"
            type="date"
            defaultValue={item.start_date ?? ""}
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-end">
          <label className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2">
            <input type="checkbox" name="is_active" value="true" defaultChecked={item.is_active} />
            <span className="text-sm text-slate-700">Active assignment</span>
          </label>
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

      <div className="flex flex-wrap justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-60"
        >
          {pending ? "Saving..." : "Save Assignment"}
        </button>
      </div>
    </form>
  );
}

export function DepartmentMembers({ churchSlug, assignments }: DepartmentMembersProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [removeState, removeAction, removePending] = useActionState(removeAssignmentAction, initialRemoveState);

  const rows = useMemo(() => assignments, [assignments]);

  if (rows.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 bg-white px-6 py-10 text-sm text-slate-600">
        No records found for this tab.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {removeState?.error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {removeState.error}
        </div>
      ) : null}

      {removeState?.ok && removeState?.message ? (
        <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
          {removeState.message}
        </div>
      ) : null}

      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Member</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Member Code</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Role</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Start Date</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Contact</th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {rows.map((item) => (
              <tr key={item.id}>
                <td className="px-4 py-3.5">
                  <p className="text-sm font-semibold text-slate-900">{getDisplayName(item)}</p>
                </td>
                <td className="px-4 py-3.5 text-sm text-slate-600">{item.member?.member_code ?? "-"}</td>
                <td className="px-4 py-3.5 text-sm text-slate-700">{item.role_title ?? "No role title"}</td>
                <td className="px-4 py-3.5">
                  <span
                    className={
                      item.is_active
                        ? "rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800"
                        : "rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700"
                    }
                  >
                    {item.is_active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-4 py-3.5 text-sm text-slate-600">{formatDate(item.start_date)}</td>
                <td className="px-4 py-3.5 text-sm text-slate-600">{item.member?.email || item.member?.phone || "-"}</td>
                <td className="px-4 py-3.5">
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingId(editingId === item.id ? null : item.id)}
                      className="rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                    >
                      {editingId === item.id ? "Close" : "Edit"}
                    </button>
                    {item.is_active ? (
                      <form action={removeAction}>
                        <input type="hidden" name="churchSlug" value={churchSlug} />
                        <input type="hidden" name="assignmentId" value={item.id} />
                        <button
                          type="submit"
                          disabled={removePending}
                          className="rounded-md border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-100 disabled:opacity-60"
                        >
                          Remove
                        </button>
                      </form>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editingId ? (
        <AssignmentEditRow
          churchSlug={churchSlug}
          item={rows.find((item) => item.id === editingId)!}
          onCancel={() => setEditingId(null)}
        />
      ) : null}
    </div>
  );
}
