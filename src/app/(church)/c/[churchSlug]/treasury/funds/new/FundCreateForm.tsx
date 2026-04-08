"use client";

import { useActionState } from "react";
import { createTreasuryFundAction } from "@/features/treasury/actions";

interface FundCreateFormProps {
  churchSlug: string;
}

export function FundCreateForm({ churchSlug }: FundCreateFormProps) {
  const [state, formAction, isPending] = useActionState(createTreasuryFundAction, null);

  return (
    <form action={formAction} className="space-y-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <input type="hidden" name="churchSlug" value={churchSlug} />

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
          <label htmlFor="code" className="block text-sm font-medium text-slate-700 mb-1">Code</label>
          <input id="code" name="code" required placeholder="e.g. building_support" className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        <div>
          <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1">Name</label>
          <input id="name" name="name" required placeholder="e.g. Building Support" className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        <div>
          <label htmlFor="fundType" className="block text-sm font-medium text-slate-700 mb-1">Fund Type</label>
          <select id="fundType" name="fundType" required className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Select fund type</option>
            <option value="tithe">Tithe</option>
            <option value="offering">Offering</option>
            <option value="donation">Donation</option>
            <option value="project">Project</option>
            <option value="department">Department</option>
            <option value="mission">Mission</option>
            <option value="welfare">Welfare</option>
            <option value="general">General</option>
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-1">Description</label>
        <textarea id="description" name="description" rows={4} className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" />
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
        >
          {isPending ? "Creating..." : "Create Fund"}
        </button>
      </div>
    </form>
  );
}
