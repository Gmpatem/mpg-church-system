"use client";

import { useActionState, useState } from "react";
import type { ActionState, DepartmentAssignmentRecord } from "../types";
import { removeAssignmentAction, updateAssignmentAction } from "../actions";

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
    <form action={formAction} className="grid gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4">
      <input type="hidden" name="churchSlug" value={churchSlug} />
      <input type="hidden" name="assignmentId" value={item.id} />
      <input type="hidden" name="member_id" value={item.member_id} />
      <input type="hidden" name="department_id" value={item.department_id ?? ""} />

      <div className="text-sm font-medium text-gray-900">{getDisplayName(item)}</div>

      <div className="grid gap-3 md:grid-cols-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Role Title</label>
          <input
            name="role_title"
            defaultValue={item.role_title ?? ""}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Start Date</label>
          <input
            name="start_date"
            type="date"
            defaultValue={item.start_date ?? ""}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-end">
          <label className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2">
            <input
              type="checkbox"
              name="is_active"
              value="true"
              defaultChecked={item.is_active}
            />
            <span className="text-sm text-gray-700">Active assignment</span>
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

      <div className="flex flex-wrap justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
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

  if (assignments.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 bg-white px-6 py-10 text-sm text-gray-600">
        No members assigned to this department yet.
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

      <div className="space-y-3">
        {assignments.map((item) =>
          editingId === item.id ? (
            <AssignmentEditRow
              key={item.id}
              churchSlug={churchSlug}
              item={item}
              onCancel={() => setEditingId(null)}
            />
          ) : (
            <div key={item.id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="space-y-2">
                  <div className="font-medium text-gray-900">{getDisplayName(item)}</div>
                  <div className="text-sm text-gray-600">
                    Member Code: {item.member?.member_code ?? "No member code"}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {item.role_title ? (
                      <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-700">
                        {item.role_title}
                      </span>
                    ) : (
                      <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-600">
                        No role title
                      </span>
                    )}

                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        item.is_active ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-700"
                      }`}
                    >
                      {item.is_active ? "Active" : "Inactive"}
                    </span>

                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-700">
                      Start: {item.start_date ?? "—"}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => setEditingId(item.id)}
                    className="text-sm font-medium text-blue-600 hover:underline"
                  >
                    Edit
                  </button>

                  {item.is_active ? (
                    <form action={removeAction}>
                      <input type="hidden" name="churchSlug" value={churchSlug} />
                      <input type="hidden" name="assignmentId" value={item.id} />
                      <button
                        type="submit"
                        disabled={removePending}
                        className="text-sm font-medium text-red-600 hover:underline disabled:opacity-60"
                      >
                        Remove
                      </button>
                    </form>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setEditingId(item.id)}
                      className="text-sm font-medium text-amber-700 hover:underline"
                    >
                      Reactivate / Edit
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}
