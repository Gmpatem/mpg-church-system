"use client";

import { useActionState, useMemo } from "react";
import { assignMemberToDepartmentAction } from "@/features/departments/actions";
import type { ActionState } from "@/features/departments/types";

const initialState: ActionState = { ok: false };

interface AssignMemberToDepartmentProps {
  churchSlug: string;
  departmentId?: string;
  members: Array<{ id: string; label: string; member_code: string | null; membership_status: string | null }>;
  departments: Array<{ id: string; name: string; code: string | null; is_active: boolean }>;
  existingActiveMemberIds?: string[];
}

export function AssignMemberToDepartment({
  churchSlug,
  departmentId,
  members,
  departments,
  existingActiveMemberIds = [],
}: AssignMemberToDepartmentProps) {
  const [state, formAction, pending] = useActionState(assignMemberToDepartmentAction, initialState);

  const availableMembers = useMemo(() => {
    if (!departmentId) return members;
    const blocked = new Set(existingActiveMemberIds);
    return members.filter((member) => !blocked.has(member.id));
  }, [departmentId, members, existingActiveMemberIds]);

  return (
    <form action={formAction} className="space-y-4 rounded-lg border border-slate-200 bg-white p-4">
      <input type="hidden" name="churchSlug" value={churchSlug} />

      <div className="grid gap-3 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1fr)_190px_auto]">
        <div>
          <label htmlFor="member_id" className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">
            Member
          </label>
          <select
            id="member_id"
            name="member_id"
            required
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">
              {departmentId
                ? availableMembers.length > 0
                  ? "Select member"
                  : "All active members already assigned"
                : "Select member"}
            </option>
            {availableMembers.map((member) => (
              <option key={member.id} value={member.id}>
                {member.label}
                {member.member_code ? ` (${member.member_code})` : ""}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="department_id" className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">
            Department
          </label>
          <select
            id="department_id"
            name="department_id"
            required
            defaultValue={departmentId ?? ""}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select department</option>
            {departments
              .filter((item) => item.is_active || item.id === departmentId)
              .map((department) => (
                <option key={department.id} value={department.id}>
                  {department.name}
                  {department.code ? ` (${department.code})` : ""}
                </option>
              ))}
          </select>
        </div>

        <div>
          <label htmlFor="role_title" className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">
            Role
          </label>
          <input
            id="role_title"
            name="role_title"
            placeholder="Leader, Assistant, Member"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="start_date" className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">
            Start Date
          </label>
          <input
            id="start_date"
            name="start_date"
            type="date"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-end gap-2">
          <label className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-3 py-2">
            <input type="checkbox" name="is_active" value="true" defaultChecked />
            <span className="text-sm text-slate-700">Active</span>
          </label>
          <button
            type="submit"
            disabled={pending || (!!departmentId && availableMembers.length === 0)}
            className="rounded-md bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-60"
          >
            {pending ? "Assigning..." : "Add Assignment"}
          </button>
        </div>
      </div>

      {!!departmentId && availableMembers.length === 0 ? (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Every active member option is already assigned to this department.
        </div>
      ) : null}

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
    </form>
  );
}
