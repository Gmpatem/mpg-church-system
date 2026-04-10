"use client";

import { useActionState } from "react";
import { updateTreasuryOutflowAction } from "@/features/treasury/actions";
import { useI18n } from "@/features/i18n";

interface OutflowEditFormProps {
  churchSlug: string;
  entry: any;
  options: {
    funds: Array<{ id: string; code: string; name: string; fund_type: string }>;
    departments: Array<{ id: string; department_name: string }>;
  };
}

export function OutflowEditForm({ churchSlug, entry, options }: OutflowEditFormProps) {
  const { t } = useI18n();
  const [state, formAction, isPending] = useActionState(updateTreasuryOutflowAction, null);

  return (
    <form action={formAction} className="space-y-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
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
          <label htmlFor="outflowType" className="block text-sm font-medium text-slate-700 mb-1">{t.pages.treasury.workspace.tabs.recordExpenses}</label>
          <select id="outflowType" name="outflowType" defaultValue={entry.outflow_type} required className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500">
            <option value="project">{t.pages.treasury.forms.types.project}</option>
            <option value="evangelism">{t.pages.treasury.forms.types.evangelism}</option>
            <option value="mission_remittance">{t.pages.treasury.forms.types.missionRemittance}</option>
            <option value="department_expense">{t.pages.treasury.forms.types.departmentExpense}</option>
            <option value="operations">{t.pages.treasury.forms.types.operations}</option>
            <option value="welfare">{t.pages.treasury.forms.types.welfare}</option>
            <option value="equipment">{t.pages.treasury.forms.types.equipment}</option>
            <option value="other">{t.pages.treasury.forms.types.other}</option>
          </select>
        </div>

        <div>
          <label htmlFor="fundId" className="block text-sm font-medium text-slate-700 mb-1">{t.pages.treasury.forms.fundSource}</label>
          <select id="fundId" name="fundId" defaultValue={entry.fund_id ?? ""} className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">{t.pages.treasury.forms.notSpecified}</option>
            {options.funds.map((fund) => (
              <option key={fund.id} value={fund.id}>{fund.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="departmentId" className="block text-sm font-medium text-slate-700 mb-1">{t.pages.treasury.forms.department}</label>
          <select id="departmentId" name="departmentId" defaultValue={entry.department_id ?? ""} className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">{t.pages.treasury.forms.notSpecified}</option>
            {options.departments.map((dept) => (
              <option key={dept.id} value={dept.id}>{dept.department_name}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-slate-700 mb-1">{t.pages.treasury.forms.amount}</label>
          <input id="amount" name="amount" type="number" step="0.01" min="0.01" defaultValue={entry.amount} required className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        <div>
          <label htmlFor="outflowDate" className="block text-sm font-medium text-slate-700 mb-1">{t.pages.treasury.forms.date}</label>
          <input id="outflowDate" name="outflowDate" type="date" defaultValue={entry.outflow_date} required className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        <div>
          <label htmlFor="payee" className="block text-sm font-medium text-slate-700 mb-1">{t.pages.treasury.forms.payee}</label>
          <input id="payee" name="payee" defaultValue={entry.payee ?? ""} className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        <div className="md:col-span-2">
          <label htmlFor="purpose" className="block text-sm font-medium text-slate-700 mb-1">{t.pages.treasury.forms.purpose}</label>
          <input id="purpose" name="purpose" defaultValue={entry.purpose ?? ""} required className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        <div>
          <label htmlFor="projectName" className="block text-sm font-medium text-slate-700 mb-1">{t.pages.treasury.forms.projectName}</label>
          <input id="projectName" name="projectName" defaultValue={entry.project_name ?? ""} className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        <div>
          <label htmlFor="referenceNumber" className="block text-sm font-medium text-slate-700 mb-1">{t.pages.treasury.forms.reference}</label>
          <input id="referenceNumber" name="referenceNumber" defaultValue={entry.reference_number ?? ""} className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
      </div>

      <div>
        <label htmlFor="note" className="block text-sm font-medium text-slate-700 mb-1">{t.pages.treasury.forms.note}</label>
        <textarea id="note" name="note" rows={4} defaultValue={entry.note ?? ""} className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" />
      </div>

      <div>
        <label htmlFor="correctionNote" className="block text-sm font-medium text-slate-700 mb-1">{t.pages.treasury.forms.edit.correctionNote}</label>
        <textarea id="correctionNote" name="correctionNote" rows={3} required placeholder={t.pages.treasury.forms.edit.correctionPlaceholder} className="w-full rounded-md border border-amber-300 bg-amber-50 px-3 py-2 outline-none focus:ring-2 focus:ring-amber-500" />
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
        >
          {isPending ? t.pages.treasury.forms.saving : t.pages.treasury.forms.edit.saveCorrection}
        </button>
      </div>
    </form>
  );
}
