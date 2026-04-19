"use client";

import { useActionState } from "react";
import { createDepartmentFundRequestAction } from "@/features/department-finance/actions";
import { ButtonSpinner } from "@/components/ui/ButtonSpinner";

interface DepartmentFundRequestFormProps {
  churchSlug: string;
  departmentId: string;
  funds: Array<{ id: string; name: string; code: string; fund_type: string }>;
}

function getTodayDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function DepartmentFundRequestForm({
  churchSlug,
  departmentId,
  funds,
}: DepartmentFundRequestFormProps) {
  const [state, formAction, isPending] = useActionState(createDepartmentFundRequestAction, null);

  return (
    <form action={formAction} className="space-y-4 rounded-xl border border-slate-200 bg-white p-4">
      <input type="hidden" name="churchSlug" value={churchSlug} />
      <input type="hidden" name="departmentId" value={departmentId} />

      {state && !state.ok ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </div>
      ) : null}

      {state && state.ok ? (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {state.message}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="md:col-span-2">
          <label htmlFor="title" className="mb-1 block text-sm font-medium text-slate-700">
            Request Title
          </label>
          <input
            id="title"
            name="title"
            required
            className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g. Youth outreach transport support"
          />
        </div>

        <div className="md:col-span-2">
          <label htmlFor="purpose" className="mb-1 block text-sm font-medium text-slate-700">
            Purpose
          </label>
          <input
            id="purpose"
            name="purpose"
            required
            className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Describe what this spending covers"
          />
        </div>

        <div>
          <label htmlFor="amount" className="mb-1 block text-sm font-medium text-slate-700">
            Amount
          </label>
          <input
            id="amount"
            name="amount"
            type="number"
            min="0.01"
            step="0.01"
            required
            inputMode="decimal"
            className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="requestedDate" className="mb-1 block text-sm font-medium text-slate-700">
            Requested Date
          </label>
          <input
            id="requestedDate"
            name="requestedDate"
            type="date"
            required
            defaultValue={getTodayDate()}
            className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="outflowType" className="mb-1 block text-sm font-medium text-slate-700">
            Outflow Category
          </label>
          <select
            id="outflowType"
            name="outflowType"
            defaultValue="department_expense"
            className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="department_expense">Department Expense</option>
            <option value="project">Project</option>
            <option value="evangelism">Evangelism</option>
            <option value="mission_remittance">Mission Remittance</option>
            <option value="operations">Operations</option>
            <option value="welfare">Welfare</option>
            <option value="equipment">Equipment</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div>
          <label htmlFor="preferredFundId" className="mb-1 block text-sm font-medium text-slate-700">
            Preferred Fund (optional)
          </label>
          <select
            id="preferredFundId"
            name="preferredFundId"
            defaultValue=""
            className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">No preference</option>
            {funds.map((fund) => (
              <option key={fund.id} value={fund.id}>
                {fund.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="payee" className="mb-1 block text-sm font-medium text-slate-700">
            Payee (optional)
          </label>
          <input
            id="payee"
            name="payee"
            className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Person or vendor"
          />
        </div>

        <div>
          <label htmlFor="projectName" className="mb-1 block text-sm font-medium text-slate-700">
            Related Event/Project (optional)
          </label>
          <input
            id="projectName"
            name="projectName"
            className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Event or project reference"
          />
        </div>

        <div className="md:col-span-2">
          <label htmlFor="note" className="mb-1 block text-sm font-medium text-slate-700">
            Note (optional)
          </label>
          <textarea
            id="note"
            name="note"
            rows={3}
            className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Any supporting details for treasury review"
          />
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center justify-center rounded-md bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-50"
        >
          {isPending ? (
            <span className="inline-flex items-center gap-2">
              <ButtonSpinner />
              Submitting...
            </span>
          ) : (
            "Submit Request"
          )}
        </button>
      </div>
    </form>
  );
}
