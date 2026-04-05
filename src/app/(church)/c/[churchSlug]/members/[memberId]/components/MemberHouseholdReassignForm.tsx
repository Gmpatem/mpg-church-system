"use client";

import { useActionState } from "react";
import { reassignMemberHouseholdAction } from "@/features/members/actions";

interface Household {
  id: string;
  household_name: string;
}

interface MemberHouseholdReassignFormProps {
  churchSlug: string;
  memberId: string;
  currentHouseholdId?: string | null;
  households: Household[];
}

export function MemberHouseholdReassignForm({
  churchSlug,
  memberId,
  currentHouseholdId,
  households,
}: MemberHouseholdReassignFormProps) {
  const [state, formAction, isPending] = useActionState(reassignMemberHouseholdAction, null);

  return (
    <form action={formAction} className="space-y-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <input type="hidden" name="churchSlug" value={churchSlug} />
      <input type="hidden" name="memberId" value={memberId} />

      <div>
        <h3 className="text-lg font-semibold text-gray-900">Household Link</h3>
        <p className="mt-1 text-sm text-gray-600">
          Reassign this member to a household or remove the household link.
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
        <label htmlFor="householdId" className="block text-sm font-medium text-gray-700 mb-1">Household</label>
        <select
          id="householdId"
          name="householdId"
          defaultValue={currentHouseholdId ?? ""}
          className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">No household</option>
          {households.map((household) => (
            <option key={household.id} value={household.id}>
              {household.household_name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {isPending ? "Saving..." : "Update Household"}
        </button>
      </div>
    </form>
  );
}