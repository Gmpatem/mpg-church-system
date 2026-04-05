"use client";

import { useActionState } from "react";
import { processMemberTransferAction } from "@/features/members/actions";

interface MemberTransferFormProps {
  churchSlug: string;
  memberId: string;
  previousChurch?: string | null;
}

export function MemberTransferForm({
  churchSlug,
  memberId,
  previousChurch,
}: MemberTransferFormProps) {
  const [state, formAction, isPending] = useActionState(processMemberTransferAction, null);

  return (
    <form action={formAction} className="space-y-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <input type="hidden" name="churchSlug" value={churchSlug} />
      <input type="hidden" name="memberId" value={memberId} />

      <div>
        <h3 className="text-lg font-semibold text-gray-900">Transfer Workflow</h3>
        <p className="mt-1 text-sm text-gray-600">
          Process transfer in or transfer out safely with history preserved.
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
        <label htmlFor="transferType" className="block text-sm font-medium text-gray-700 mb-1">Transfer Type</label>
        <select
          id="transferType"
          name="transferType"
          defaultValue="in"
          className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="in">Transfer In</option>
          <option value="out">Transfer Out</option>
        </select>
      </div>

      <div>
        <label htmlFor="transferDate" className="block text-sm font-medium text-gray-700 mb-1">Transfer Date</label>
        <input
          id="transferDate"
          name="transferDate"
          type="date"
          required
          className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label htmlFor="previousChurch" className="block text-sm font-medium text-gray-700 mb-1">
          Previous / Related Church
        </label>
        <input
          id="previousChurch"
          name="previousChurch"
          defaultValue={previousChurch ?? ""}
          className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
        />
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
          {isPending ? "Processing..." : "Process Transfer"}
        </button>
      </div>
    </form>
  );
}