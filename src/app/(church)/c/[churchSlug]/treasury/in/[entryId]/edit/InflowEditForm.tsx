"use client";

import { useActionState } from "react";
import { updateTreasuryInflowAction } from "@/features/treasury/actions";

interface InflowEditFormProps {
  churchSlug: string;
  entry: any;
  options: {
    funds: Array<{ id: string; code: string; name: string; fund_type: string }>;
    members: Array<{ id: string; display_name?: string | null; first_name: string; last_name: string; member_code?: string | null }>;
  };
}

export function InflowEditForm({ churchSlug, entry, options }: InflowEditFormProps) {
  const [state, formAction, isPending] = useActionState(updateTreasuryInflowAction, null);

  return (
    <form action={formAction} className="space-y-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <input type="hidden" name="churchSlug" value={churchSlug} />
      <input type="hidden" name="entryId" value={entry.id} />

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
          <label htmlFor="inflowType" className="block text-sm font-medium text-gray-700 mb-1">Entry Type</label>
          <select id="inflowType" name="inflowType" defaultValue={entry.inflow_type} required className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500">
            <option value="tithe">Tithe</option>
            <option value="offering">Offering</option>
            <option value="donation">Donation</option>
            <option value="special_contribution">Special Contribution</option>
          </select>
        </div>

        <div>
          <label htmlFor="fundId" className="block text-sm font-medium text-gray-700 mb-1">Fund</label>
          <select id="fundId" name="fundId" defaultValue={entry.fund_id ?? ""} required className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Select fund</option>
            {options.funds.map((fund) => (
              <option key={fund.id} value={fund.id}>{fund.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="memberId" className="block text-sm font-medium text-gray-700 mb-1">Member</label>
          <select id="memberId" name="memberId" defaultValue={entry.member_id ?? ""} className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500">
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
          <select id="isAnonymous" name="isAnonymous" defaultValue={entry.is_anonymous ? "true" : "false"} className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500">
            <option value="false">No</option>
            <option value="true">Yes</option>
          </select>
        </div>

        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
          <input id="amount" name="amount" type="number" step="0.01" min="0.01" defaultValue={entry.amount} required className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        <div>
          <label htmlFor="inflowDate" className="block text-sm font-medium text-gray-700 mb-1">Date</label>
          <input id="inflowDate" name="inflowDate" type="date" defaultValue={entry.inflow_date} required className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
      </div>

      <div>
        <label htmlFor="referenceNumber" className="block text-sm font-medium text-gray-700 mb-1">Reference</label>
        <input id="referenceNumber" name="referenceNumber" defaultValue={entry.reference_number ?? ""} className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" />
      </div>

      <div>
        <label htmlFor="note" className="block text-sm font-medium text-gray-700 mb-1">Note</label>
        <textarea id="note" name="note" rows={4} defaultValue={entry.note ?? ""} className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" />
      </div>

      <div>
        <label htmlFor="correctionNote" className="block text-sm font-medium text-gray-700 mb-1">Correction Note</label>
        <textarea id="correctionNote" name="correctionNote" rows={3} required placeholder="Explain why this treasury entry is being corrected." className="w-full rounded-md border border-amber-300 bg-amber-50 px-3 py-2 outline-none focus:ring-2 focus:ring-amber-500" />
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {isPending ? "Saving..." : "Save Correction"}
        </button>
      </div>
    </form>
  );
}