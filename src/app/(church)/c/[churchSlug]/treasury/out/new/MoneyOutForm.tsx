"use client";

import { useActionState } from "react";
import { createTreasuryOutflowAction } from "@/features/treasury/actions";

interface MoneyOutFormProps {
  churchSlug: string;
  options: {
    funds: Array<{ id: string; name: string; code: string; fund_type: string }>;
    departments: Array<{ id: string; department_name: string }>;
  };
  defaults?: {
    outflowType?: string;
  };
  modeLabel?: string;
}

function getTodayLocalDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function MoneyOutForm({ churchSlug, options, defaults, modeLabel }: MoneyOutFormProps) {
  const [state, formAction, isPending] = useActionState(createTreasuryOutflowAction, null);
  const isFixedType = Boolean(defaults?.outflowType);
  const today = getTodayLocalDate();

  const visibleFunds = options.funds.filter((fund) => {
    if (defaults?.outflowType === "mission_remittance") return true;
    return fund.fund_type !== "tithe";
  });

  return (
    <form action={formAction} className="space-y-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <input type="hidden" name="churchSlug" value={churchSlug} />
      {isFixedType ? <input type="hidden" name="outflowType" value={defaults?.outflowType ?? ""} /> : null}

      <div>
        <h3 className="text-lg font-semibold text-gray-900">{modeLabel ?? "Record Money Out"}</h3>
        <p className="mt-1 text-sm text-gray-600">
          Enter disbursements, project spending, remittances, and other outgoing funds.
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
        {!isFixedType ? (
          <div>
            <label htmlFor="outflowType" className="block text-sm font-medium text-gray-700 mb-1">Outflow Type</label>
            <select id="outflowType" name="outflowType" defaultValue={defaults?.outflowType ?? ""} required className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Select type</option>
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
        ) : (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Outflow Type</label>
            <div className="w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
              {defaults?.outflowType === "project"
                ? "Project"
                : defaults?.outflowType === "evangelism"
                ? "Evangelism"
                : defaults?.outflowType === "mission_remittance"
                ? "Mission / District Remittance"
                : defaults?.outflowType === "department_expense"
                ? "Department Expense"
                : defaults?.outflowType === "operations"
                ? "Operations"
                : defaults?.outflowType === "welfare"
                ? "Welfare"
                : defaults?.outflowType === "equipment"
                ? "Equipment"
                : defaults?.outflowType === "other"
                ? "Other"
                : defaults?.outflowType}
            </div>
          </div>
        )}

        <div>
          <label htmlFor="fundId" className="block text-sm font-medium text-gray-700 mb-1">
            Fund Source
          </label>
          <select
            id="fundId"
            name="fundId"
            required
            className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select fund</option>
            {visibleFunds.map((fund) => (
              <option key={fund.id} value={fund.id}>
                {fund.name}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-gray-500">
            Tithe fund is reserved for mission remittance only.
          </p>
        </div>

        <div>
          <label htmlFor="departmentId" className="block text-sm font-medium text-gray-700 mb-1">Department</label>
          <select id="departmentId" name="departmentId" className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Not specified</option>
            {options.departments.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.department_name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
          <input id="amount" name="amount" type="number" step="0.01" min="0.01" required className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        <div>
          <label htmlFor="outflowDate" className="block text-sm font-medium text-gray-700 mb-1">Date</label>
          <input id="outflowDate" name="outflowDate" type="date" defaultValue={today} required className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        <div>
          <label htmlFor="payee" className="block text-sm font-medium text-gray-700 mb-1">Payee / Recipient</label>
          <input id="payee" name="payee" className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        <div className="md:col-span-2">
          <label htmlFor="purpose" className="block text-sm font-medium text-gray-700 mb-1">Purpose</label>
          <input id="purpose" name="purpose" required className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        <div>
          <label htmlFor="projectName" className="block text-sm font-medium text-gray-700 mb-1">Project Name</label>
          <input id="projectName" name="projectName" className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" />
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
        </div>
      </div>

      <div>
        <label htmlFor="note" className="block text-sm font-medium text-gray-700 mb-1">Note</label>
        <textarea id="note" name="note" rows={4} className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" />
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {isPending ? "Saving..." : "Record Money Out"}
        </button>
      </div>
    </form>
  );
}
