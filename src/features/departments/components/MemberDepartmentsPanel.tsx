"use client";

import { useActionState } from "react";
import { assignMemberToDepartmentAction, removeAssignmentAction } from "../actions";
import type { ActionState, DepartmentAssignmentRecord } from "../types";

const initialAssignState: ActionState = { ok: false };
const initialRemoveState: ActionState = { ok: false };

interface MemberDepartmentsPanelProps {
  churchSlug: string;
  memberId: string;
  memberLabel: string;
  assignments: DepartmentAssignmentRecord[];
  departments: Array<{ id: string; name: string; code: string | null; is_active: boolean }>;
}

export function MemberDepartmentsPanel({
  churchSlug,
  memberId,
  memberLabel,
  assignments,
  departments,
}: MemberDepartmentsPanelProps) {
  const [assignState, assignAction, assignPending] = useActionState(assignMemberToDepartmentAction, initialAssignState);
  const [removeState, removeAction, removePending] = useActionState(removeAssignmentAction, initialRemoveState);

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Member Departments</h3>
          <p className="mt-1 text-sm text-gray-600">
            Manage department assignments for {memberLabel}.
          </p>
        </div>

        <form action={assignAction} className="grid gap-4 md:grid-cols-4">
          <input type="hidden" name="churchSlug" value={churchSlug} />
          <input type="hidden" name="member_id" value={memberId} />
          <input type="hidden" name="is_active" value="true" />

          <div>
            <label htmlFor="department_id" className="mb-1 block text-sm font-medium text-gray-700">
              Department
            </label>
            <select
              id="department_id"
              name="department_id"
              required
              className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select department</option>
              {departments
                .filter((department) => department.is_active)
                .map((department) => (
                  <option key={department.id} value={department.id}>
                    {department.name}
                    {department.code ? ` (${department.code})` : ""}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label htmlFor="role_title" className="mb-1 block text-sm font-medium text-gray-700">
              Role Title
            </label>
            <input
              id="role_title"
              name="role_title"
              placeholder="Leader, Assistant, Member"
              className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="start_date" className="mb-1 block text-sm font-medium text-gray-700">
              Start Date
            </label>
            <input
              id="start_date"
              name="start_date"
              type="date"
              className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={assignPending}
              className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {assignPending ? "Assigning..." : "Assign Department"}
            </button>
          </div>
        </form>

        {assignState?.error ? (
          <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {assignState.error}
          </div>
        ) : null}

        {assignState?.ok && assignState?.message ? (
          <div className="mt-4 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
            {assignState.message}
          </div>
        ) : null}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-6 py-4">
          <h4 className="text-base font-semibold text-gray-900">Department Assignments</h4>
        </div>

        {removeState?.error ? (
          <div className="mx-6 mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {removeState.error}
          </div>
        ) : null}

        {removeState?.ok && removeState?.message ? (
          <div className="mx-6 mt-4 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
            {removeState.message}
          </div>
        ) : null}

        {assignments.length === 0 ? (
          <div className="px-6 py-10 text-sm text-gray-600">
            This member has no department assignments yet.
          </div>
        ) : (
          <div className="overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Department
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Start Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {assignments.map((assignment) => (
                  <tr key={assignment.id}>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {assignment.department_name ?? "Unknown Department"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {assignment.role_title ? (
                        <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-700">
                          {assignment.role_title}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {assignment.start_date ?? "—"}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          assignment.is_active ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-700"
                        }`}
                      >
                        {assignment.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {assignment.is_active ? (
                        <form action={removeAction} className="inline-block">
                          <input type="hidden" name="churchSlug" value={churchSlug} />
                          <input type="hidden" name="assignmentId" value={assignment.id} />
                          <button
                            type="submit"
                            disabled={removePending}
                            className="text-sm font-medium text-red-600 hover:underline disabled:opacity-60"
                          >
                            Remove
                          </button>
                        </form>
                      ) : (
                        <span className="text-sm text-gray-400">Archived</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
