"use client";

import { useActionState } from "react";
import { updateMemberStatusAction } from "@/features/members/actions";

interface MemberStatusChangeFormProps {
  churchSlug: string;
  memberId: string;
  currentStatus: string;
}

export function MemberStatusChangeForm({
  churchSlug,
  memberId,
  currentStatus,
}: MemberStatusChangeFormProps) {
  const [state, formAction, isPending] = useActionState(updateMemberStatusAction, null);

  return (
    <form action={formAction} className="space-y-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <input type="hidden" name="churchSlug" value={churchSlug} />
      <input type="hidden" name="memberId" value={memberId} />

      <div>
        <h3 className="text-lg font-semibold text-gray-900">Change Status</h3>
        <p className="mt-1 text-sm text-gray-600">
          Current status: <span className="font-medium">{currentStatus}</span>
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
        <label htmlFor="newStatus" className="block text-sm font-medium text-gray-700 mb-1">New Status</label>
        <select
          id="newStatus"
          name="newStatus"
          defaultValue={currentStatus}
          className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="visitor">Visitor</option>
          <option value="transferred">Transferred</option>
        </select>
      </div>

      <div>
        <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
        <textarea
          id="reason"
          name="reason"
          rows={3}
          required
          className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {isPending ? "Saving..." : "Update Status"}
        </button>
      </div>
    </form>
  );
}