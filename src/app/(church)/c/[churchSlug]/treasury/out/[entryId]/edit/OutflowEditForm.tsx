"use client";

import { useActionState } from "react";
import { updateTreasuryOutflowAction } from "@/features/treasury/actions";

interface OutflowEditFormProps {
  churchSlug: string;
  entry: any;
  options: {
    funds: Array<{ id: string; code: string; name: string; fund_type: string }>;
    departments: Array<{ id: string; department_name: string }>;
  };
}

export function OutflowEditForm({ churchSlug, entry, options }: OutflowEditFormProps) {
  const [state, formAction, isPending] = useActionState(updateTreasuryOutflowAction, null);

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
          <label htmlFor="outflowType" className="block text-sm font-medium text-gray-700 mb-1">Outflow Type</label>
          <select id="outflowType" name="outflowType" defaultValue={entry.outflow_type} required className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500">
            <option value="project">Project</option>
            <option value="evangelism">Evangelism</option>
            <option value="mission_remittance">Mission / District Remittance</option>
            <option value="department_expense">Department Expense</option>
            <option value="operations">Operations</option>
            <option value="welfare">Welfare</option>
            <option value="equipment">Equipment</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div>
          <label htmlFor="fundId" className="block text-sm font-medium text-gray-700 mb-1">Fund Source</label>
          <select id="fundId" name="fundId" defaultValue={entry.fund_id ?? ""} className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Not specified</option>
            {options.funds.map((fund) => (
              <option key={fund.id} value={fund.id}>{fund.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="departmentId" className="block text-sm font-medium text-gray-700 mb-1">Department</label>
          <select id="departmentId" name="departmentId" defaultValue={entry.department_id ?? ""} className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Not specified</option>
            {options.departments.map((dept) => (
              <option key={dept.id} value={dept.id}>{dept.department_name}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
          <input id="amount" name="amount" type="number" step="0.01" min="0.01" defaultValue={entry.amount} required className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        <div>
          <label htmlFor="outflowDate" className="block text-sm font-medium text-gray-700 mb-1">Date</label>
          <input id="outflowDate" name="outflowDate" type="date" defaultValue={entry.outflow_date} required className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        <div>
          <label htmlFor="payee" className="block text-sm font-medium text-gray-700 mb-1">Payee / Recipient</label>
          <input id="payee" name="payee" defaultValue={entry.payee ?? ""} className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        <div className="md:col-span-2">
          <label htmlFor="purpose" className="block text-sm font-medium text-gray-700 mb-1">Purpose</label>
          <input id="purpose" name="purpose" defaultValue={entry.purpose ?? ""} required className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        <div>
          <label htmlFor="projectName" className="block text-sm font-medium text-gray-700 mb-1">Project Name</label>
          <input id="projectName" name="projectName" defaultValue={entry.project_name ?? ""} className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        <div>
          <label htmlFor="referenceNumber" className="block text-sm font-medium text-gray-700 mb-1">Reference</label>
          <input id="referenceNumber" name="referenceNumber" defaultValue={entry.reference_number ?? ""} className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
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