"use client";

import { useActionState } from "react";
import { ButtonSpinner } from "@/components/ui/ButtonSpinner";
import { createTreasuryOutflowAction } from "@/features/treasury/actions";
import { useI18n } from "@/features/i18n";

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

function getLockedLabel(outflowType: string | undefined, t: { pages: { treasury: { forms: { types: Record<string, string> } } } }) {
  if (outflowType === "project") return t.pages.treasury.forms.types.project;
  if (outflowType === "evangelism") return t.pages.treasury.forms.types.evangelism;
  if (outflowType === "mission_remittance") return t.pages.treasury.forms.types.missionRemittance;
  if (outflowType === "department_expense") return t.pages.treasury.forms.types.departmentExpense;
  if (outflowType === "operations") return t.pages.treasury.forms.types.operations;
  if (outflowType === "welfare") return t.pages.treasury.forms.types.welfare;
  if (outflowType === "equipment") return t.pages.treasury.forms.types.equipment;
  if (outflowType === "other") return t.pages.treasury.forms.types.other;
  return outflowType ?? "";
}

export function MoneyOutForm({ churchSlug, options, defaults, modeLabel }: MoneyOutFormProps) {
  const { t } = useI18n();
  const [state, formAction, isPending] = useActionState(createTreasuryOutflowAction, null);
  const isFixedType = Boolean(defaults?.outflowType);
  const today = getTodayLocalDate();

  const visibleFunds = options.funds.filter((fund) => {
    if (defaults?.outflowType === "mission_remittance") return true;
    return fund.fund_type !== "tithe";
  });

  return (
    <form action={formAction} className="space-y-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <input type="hidden" name="churchSlug" value={churchSlug} />
      {isFixedType ? <input type="hidden" name="outflowType" value={defaults?.outflowType ?? ""} /> : null}

      <div>
        <h3 className="text-lg font-semibold text-slate-900">{modeLabel ?? t.pages.treasury.forms.recordMoneyOut}</h3>
        <p className="mt-1 text-sm text-slate-600">
          {t.pages.treasury.forms.descriptions.moneyOut}
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
            <label htmlFor="outflowType" className="block text-sm font-medium text-slate-700 mb-1">{t.pages.treasury.workspace.tabs.recordExpenses}</label>
            <select id="outflowType" name="outflowType" defaultValue={defaults?.outflowType ?? ""} required className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">{t.pages.treasury.forms.selectType}</option>
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
        ) : (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t.pages.treasury.workspace.tabs.recordExpenses}</label>
            <div className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
              {getLockedLabel(defaults?.outflowType, t)}
            </div>
          </div>
        )}

        <div>
          <label htmlFor="fundId" className="block text-sm font-medium text-slate-700 mb-1">
            {t.pages.treasury.forms.fundSource}
          </label>
          <select
            id="fundId"
            name="fundId"
            required
            className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">{t.pages.treasury.forms.selectFund}</option>
            {visibleFunds.map((fund) => (
              <option key={fund.id} value={fund.id}>
                {fund.name}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-slate-500">
            {t.pages.treasury.forms.titheReserved}
          </p>
        </div>

        <div>
          <label htmlFor="departmentId" className="block text-sm font-medium text-slate-700 mb-1">{t.pages.treasury.forms.department}</label>
          <select id="departmentId" name="departmentId" className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">{t.pages.treasury.forms.notSpecified}</option>
            {options.departments.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.department_name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-slate-700 mb-1">{t.pages.treasury.forms.amount}</label>
          <input id="amount" name="amount" type="number" step="0.01" min="0.01" required inputMode="decimal" className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        <div>
          <label htmlFor="outflowDate" className="block text-sm font-medium text-slate-700 mb-1">{t.pages.treasury.forms.date}</label>
          <input id="outflowDate" name="outflowDate" type="date" defaultValue={today} required className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        <div>
          <label htmlFor="payee" className="block text-sm font-medium text-slate-700 mb-1">{t.pages.treasury.forms.payee}</label>
          <input id="payee" name="payee" className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        <div className="md:col-span-2">
          <label htmlFor="purpose" className="block text-sm font-medium text-slate-700 mb-1">{t.pages.treasury.forms.purpose}</label>
          <input id="purpose" name="purpose" required className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        <div>
          <label htmlFor="projectName" className="block text-sm font-medium text-slate-700 mb-1">{t.pages.treasury.forms.projectName}</label>
          <input id="projectName" name="projectName" className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        <div>
          <label htmlFor="referenceNumber" className="block text-sm font-medium text-slate-700 mb-1">
            {t.pages.treasury.forms.reference}
          </label>
          <input
            id="referenceNumber"
            name="referenceNumber"
            placeholder={t.pages.treasury.forms.placeholder.reference}
            className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div>
        <label htmlFor="note" className="block text-sm font-medium text-slate-700 mb-1">{t.pages.treasury.forms.note}</label>
        <textarea id="note" name="note" rows={4} className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" />
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center justify-center rounded-xl bg-slate-950 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
        >
          {isPending ? (
            <span className="inline-flex items-center gap-2">
              <ButtonSpinner />
              {t.pages.treasury.forms.saving}
            </span>
          ) : t.pages.treasury.forms.recordMoneyOut}
        </button>
      </div>
    </form>
  );
}
