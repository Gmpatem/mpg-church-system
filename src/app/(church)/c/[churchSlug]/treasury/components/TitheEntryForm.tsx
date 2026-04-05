"use client";

import { useMemo } from "react";
import { useActionState } from "react";
import { createTreasuryInflowAction } from "@/features/treasury/actions";

interface TitheEntryFormProps {
  churchSlug: string;
  options: {
    funds: Array<{ id: string; name: string; code: string; fund_type: string }>;
    members: Array<{ id: string; display_name?: string | null; first_name: string; last_name: string; member_code?: string | null }>;
  };
}

function getTodayLocalDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function TitheEntryForm({ churchSlug, options }: TitheEntryFormProps) {
  const [state, formAction, isPending] = useActionState(createTreasuryInflowAction, null);

  const titheFundId = useMemo(() => {
    return options.funds.find((fund) => fund.code === "tithe")?.id ?? "";
  }, [options.funds]);

  const today = getTodayLocalDate();

  return (
    <form action={formAction} className="space-y-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <input type="hidden" name="churchSlug" value={churchSlug} />
      <input type="hidden" name="inflowType" value="tithe" />
      <input type="hidden" name="fundId" value={titheFundId} />

      <div>
        <h3 className="text-lg font-semibold text-gray-900">Tithe Entry</h3>
        <p className="mt-1 text-sm text-gray-600">
          Fast Sabbath tithe entry with auto-filled treasury classification.
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

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Entry Type</label>
          <div className="w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
            Tithe
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Fund</label>
          <div className="w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
            Tithe
          </div>
        </div>

        <div>
          <label htmlFor="memberId" className="block text-sm font-medium text-gray-700 mb-1">Member</label>
          <select id="memberId" name="memberId" className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Unlinked / not selected</option>
            {options.members.map((member) => (
              <option key={member.id} value={member.id}>
                {(member.display_name ?? `${member.first_name} ${member.last_name}`) + (member.member_code ? ` (${member.member_code})` : "")}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="isAnonymous" className="block text-sm font-medium text-gray-700 mb-1">Anonymous</label>
          <select id="isAnonymous" name="isAnonymous" defaultValue="false" className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500">
            <option value="false">No</option>
            <option value="true">Yes</option>
          </select>
        </div>

        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
          <input id="amount" name="amount" type="number" step="0.01" min="0.01" required className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        <div>
          <label htmlFor="inflowDate" className="block text-sm font-medium text-gray-700 mb-1">Date</label>
          <input id="inflowDate" name="inflowDate" type="date" defaultValue={today} required className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
      </div>

      <div>
        <label htmlFor="referenceNumber" className="block text-sm font-medium text-gray-700 mb-1">
          Reference
        </label>
        <input
          id="referenceNumber"
          name="referenceNumber"
          placeholder="Leave blank to auto-generate"
          className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
        />
        <p className="mt-1 text-xs text-gray-500">
          Mission and remittance allocations will be created automatically once finance rules are configured.
        </p>
      </div>

      <div>
        <label htmlFor="note" className="block text-sm font-medium text-gray-700 mb-1">Note</label>
        <textarea id="note" name="note" rows={4} className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" />
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isPending || !titheFundId}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {isPending ? "Saving..." : "Record Tithe"}
        </button>
      </div>

      {!titheFundId ? (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Tithe fund was not found. Please make sure a treasury fund with code <strong>tithe</strong> exists.
        </div>
      ) : null}
    </form>
  );
}
