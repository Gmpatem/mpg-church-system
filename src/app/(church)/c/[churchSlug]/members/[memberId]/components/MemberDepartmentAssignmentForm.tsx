"use client";

import { useActionState } from "react";
import { assignMemberDepartmentAction } from "@/features/members/actions";

interface Department {
  id: string;
  department_name: string;
  description?: string | null;
}

interface MemberDepartmentAssignmentFormProps {
  churchSlug: string;
  memberId: string;
  departments: Department[];
}

export function MemberDepartmentAssignmentForm({
  churchSlug,
  memberId,
  departments,
}: MemberDepartmentAssignmentFormProps) {
  const [state, formAction, isPending] = useActionState(assignMemberDepartmentAction, null);

  return (
    <form action={formAction} className="space-y-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <input type="hidden" name="churchSlug" value={churchSlug} />
      <input type="hidden" name="memberId" value={memberId} />

      <div>
        <h3 className="text-lg font-semibold text-gray-900">Assign Department</h3>
        <p className="mt-1 text-sm text-gray-600">
          Link this member to a ministry or department.
        </p>
      </div>

      {state && !state.ok ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      ) : null}

      {state && state.ok ? (
        <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {state.message}
        </div>
      ) : null}

      <div>
        <label htmlFor="departmentId" className="block text-sm font-medium text-gray-700 mb-1">Department</label>
        <select
          id="departmentId"
          name="departmentId"
          required
          className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select a department</option>
          {departments.map((dept) => (
            <option key={dept.id} value={dept.id}>
              {dept.department_name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="roleInDepartment" className="block text-sm font-medium text-gray-700 mb-1">Role in Department</label>
        <input
          id="roleInDepartment"
          name="roleInDepartment"
          placeholder="e.g. Secretary, Coordinator, Member"
          className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label htmlFor="joinedDate" className="block text-sm font-medium text-gray-700 mb-1">Joined Date</label>
        <input
          id="joinedDate"
          name="joinedDate"
          type="date"
          className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {isPending ? "Assigning..." : "Assign Department"}
        </button>
      </div>
    </form>
  );
}