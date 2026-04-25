"use client";

import { useEffect, useMemo, useState } from "react";
import { useActionState } from "react";
import { ChevronDown } from "lucide-react";
import { ButtonSpinner } from "@/components/ui/ButtonSpinner";
import { createTreasuryOutflowAction } from "@/features/treasury/actions";
import { useI18n } from "@/features/i18n";
import { getTodayLocalDate } from "@/lib/utils/format";

interface FinancialRecordEntryFormProps {
  churchSlug: string;
  options: {
    funds: Array<{
      id: string;
      name: string;
      code: string;
      fund_type: string;
      department_id?: string | null;
    }>;
    departments: Array<{ id: string; department_name: string }>;
  };
  defaults?: {
    outflowType?: string;
    fundId?: string;
    departmentId?: string;
    amount?: string | number;
    outflowDate?: string;
    payee?: string;
    purpose?: string;
    projectName?: string;
    note?: string;
    referenceNumber?: string;
    departmentFundRequestId?: string;
  };
  modeLabel?: string;
  financeSettings?: {
    allow_tithe_outflow_only_for_remittance?: boolean;
  };
  onCreateFundRequest?: () => void;
  onSuccess?: () => void;
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

function getVisibleFunds(
  funds: Array<{
    id: string;
    name: string;
    code: string;
    fund_type: string;
    department_id?: string | null;
  }>,
  outflowType: string,
  allowTitheOutflowOnlyForRemittance: boolean,
  departmentId: string
) {
  const hasDepartmentMetadata = funds.some((fund) =>
    Object.prototype.hasOwnProperty.call(fund, "department_id")
  );

  return funds.map((fund) => {
    const disabledReasons: string[] = [];

    if (
      allowTitheOutflowOnlyForRemittance &&
      outflowType !== "mission_remittance" &&
      fund.fund_type === "tithe"
    ) {
      disabledReasons.push("Tithe fund can only be used for remittance.");
    }

    if (
      departmentId &&
      hasDepartmentMetadata &&
      fund.department_id !== departmentId
    ) {
      disabledReasons.push("Selected department requires a matching department fund.");
    }

    return {
      ...fund,
      disabled: disabledReasons.length > 0,
      disabledReason: disabledReasons.join(" "),
    };
  });
}


function getFundTypeLabel(fundType: string, t: any) {
  if (fundType === "tithe") return t.pages.treasury.forms.fundForm.types.tithe;
  if (fundType === "offering") return t.pages.treasury.forms.fundForm.types.offering;
  if (fundType === "donation") return t.pages.treasury.forms.fundForm.types.donation;
  if (fundType === "project") return t.pages.treasury.forms.fundForm.types.project;
  if (fundType === "department") return t.pages.treasury.forms.fundForm.types.department;
  if (fundType === "mission") return t.pages.treasury.forms.fundForm.types.mission;
  if (fundType === "welfare") return t.pages.treasury.forms.fundForm.types.welfare;
  if (fundType === "general") return t.pages.treasury.forms.fundForm.types.general;
  return fundType.replace(/_/g, " ");
}

export function FinancialRecordEntryForm({
  churchSlug,
  options,
  defaults,
  modeLabel,
  financeSettings,
  onCreateFundRequest,
  onSuccess,
}: FinancialRecordEntryFormProps) {
  const { t } = useI18n();
  const [state, formAction, isPending] = useActionState(createTreasuryOutflowAction, null);
  const [submitMode, setSubmitMode] = useState<"save" | "save_add_another">("save");
  const [outflowType, setOutflowType] = useState(defaults?.outflowType ?? "operations");
  const [fundId, setFundId] = useState(defaults?.fundId ?? "");
  const [departmentId, setDepartmentId] = useState(defaults?.departmentId ?? "");
  const [amount, setAmount] = useState(
    defaults?.amount !== undefined && defaults?.amount !== null ? String(defaults.amount) : ""
  );
  const [outflowDate, setOutflowDate] = useState(defaults?.outflowDate ?? getTodayLocalDate());
  const [payee, setPayee] = useState(defaults?.payee ?? "");
  const [purpose, setPurpose] = useState(defaults?.purpose ?? "");
  const [projectName, setProjectName] = useState(defaults?.projectName ?? "");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [referenceNumber, setReferenceNumber] = useState(defaults?.referenceNumber ?? "");
  const [note, setNote] = useState(defaults?.note ?? "");
  const [optionalFieldsOpen, setOptionalFieldsOpen] = useState(false);

  const isFixedType = Boolean(defaults?.outflowType);
  const activeOutflowType = isFixedType ? (defaults?.outflowType ?? outflowType) : outflowType;
  const allowTitheOutflowOnlyForRemittance = financeSettings?.allow_tithe_outflow_only_for_remittance ?? true;
  const visibleFunds = useMemo(
    () =>
      getVisibleFunds(
        options.funds,
        activeOutflowType,
        allowTitheOutflowOnlyForRemittance,
        departmentId
      ),
    [activeOutflowType, allowTitheOutflowOnlyForRemittance, departmentId, options.funds]
  );
  const enabledFunds = useMemo(
    () => visibleFunds.filter((fund) => !fund.disabled),
    [visibleFunds]
  );

  useEffect(() => {
    if (enabledFunds.length === 0) {
      setFundId("");
      return;
    }

    if (!enabledFunds.some((fund) => fund.id === fundId)) {
      setFundId(enabledFunds[0]?.id ?? "");
    }
  }, [enabledFunds, fundId]);

  useEffect(() => {
    if (!state?.ok || submitMode !== "save_add_another") return;

    setAmount("");
    setPayee(defaults?.payee ?? "");
    setPurpose(defaults?.purpose ?? "");
    setProjectName(defaults?.projectName ?? "");
    setReferenceNumber("");
    setNote(defaults?.note ?? "");
  }, [defaults?.note, defaults?.payee, defaults?.projectName, defaults?.purpose, state, submitMode]);

  useEffect(() => {
    if (!state?.ok || !onSuccess) return;
    onSuccess();
  }, [onSuccess, state]);

  const canSubmit =
    !isPending &&
    Boolean(activeOutflowType) &&
    Boolean(fundId) &&
    Boolean(outflowDate) &&
    Boolean(purpose.trim()) &&
    Number(amount) > 0;

  return (
    <form action={formAction} className="space-y-5 rounded-lg border border-slate-200 bg-white p-4 lg:p-5">
      <input type="hidden" name="churchSlug" value={churchSlug} />
      <input type="hidden" name="submitMode" value={submitMode} />
      <input type="hidden" name="outflowType" value={activeOutflowType} />
      <input type="hidden" name="departmentFundRequestId" value={defaults?.departmentFundRequestId ?? ""} />

      <div>
        <h3 className="text-base font-semibold text-slate-900">{modeLabel ?? t.pages.treasury.forms.recordExpenseDisbursement}</h3>
        <p className="mt-1 text-sm text-slate-600">{t.pages.treasury.forms.descriptions.moneyOut}</p>
      </div>

      {state && !state.ok ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{state.error}</div>
      ) : null}

      {state && state.ok ? (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{state.message}</div>
      ) : null}

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {!isFixedType ? (
          <div>
            <label htmlFor="outflowType" className="mb-1 block text-sm font-medium text-slate-700">{t.pages.treasury.workspace.tabs.recordExpenses}</label>
            <select
              id="outflowType"
              value={outflowType}
              onChange={(event) => setOutflowType(event.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
            >
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
            <label className="mb-1 block text-sm font-medium text-slate-700">{t.pages.treasury.workspace.tabs.recordExpenses}</label>
            <div className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
              {getLockedLabel(defaults?.outflowType, t)}
            </div>
          </div>
        )}

        <div>
          <label htmlFor="fundId" className="mb-1 block text-sm font-medium text-slate-700">{t.pages.treasury.forms.fundSource}</label>
          <select
            id="fundId"
            name="fundId"
            required
            value={fundId}
            onChange={(event) => setFundId(event.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
          >
            {visibleFunds.length === 0 ? (
              <option value="">No funds found. Add a fund first in Treasury Settings.</option>
            ) : null}
            {enabledFunds.length === 0 && visibleFunds.length > 0 ? (
              <option value="">No eligible funds for current selection.</option>
            ) : null}
            {visibleFunds.map((fund) => (
              <option key={fund.id} value={fund.id} disabled={fund.disabled}>
                {fund.name}
                {fund.code ? ` (${fund.code})` : ""}
                {` • ${getFundTypeLabel(fund.fund_type, t)}`}
                {fund.disabledReason ? ` — ${fund.disabledReason}` : ""}
              </option>
            ))}
          </select>
          {allowTitheOutflowOnlyForRemittance && activeOutflowType !== "mission_remittance" ? (
            <p className="mt-1 text-xs text-slate-500">{t.pages.treasury.forms.titheReserved}</p>
          ) : null}
        </div>

        <div>
          <label htmlFor="departmentId" className="mb-1 block text-sm font-medium text-slate-700">{t.pages.treasury.forms.department}</label>
          <select
            id="departmentId"
            name="departmentId"
            value={departmentId}
            onChange={(event) => setDepartmentId(event.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">{t.pages.treasury.forms.notSpecified}</option>
            {options.departments.map((department) => (
              <option key={department.id} value={department.id}>
                {department.department_name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="paymentMethod" className="mb-1 block text-sm font-medium text-slate-700">{t.pages.treasury.forms.paymentMethod}</label>
          <select
            id="paymentMethod"
            name="paymentMethod"
            value={paymentMethod}
            onChange={(event) => setPaymentMethod(event.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="cash">{t.pages.treasury.forms.paymentMethods.cash}</option>
            <option value="bank_transfer">{t.pages.treasury.forms.paymentMethods.bankTransfer}</option>
            <option value="mobile_money">{t.pages.treasury.forms.paymentMethods.mobileMoney}</option>
            <option value="check">{t.pages.treasury.forms.paymentMethods.check}</option>
            <option value="other">{t.pages.treasury.forms.paymentMethods.other}</option>
          </select>
        </div>

        <div>
          <label htmlFor="amount" className="mb-1 block text-sm font-medium text-slate-700">{t.pages.treasury.forms.amount}</label>
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-slate-500">
              FCFA
            </span>
            <input
              id="amount"
              name="amount"
              type="number"
              step="0.01"
              min="0.01"
              required
              inputMode="decimal"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              className="w-full rounded-md border border-slate-300 pl-14 pr-3 py-2.5 text-base font-semibold outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label htmlFor="outflowDate" className="mb-1 block text-sm font-medium text-slate-700">{t.pages.treasury.forms.date}</label>
          <input
            id="outflowDate"
            name="outflowDate"
            type="date"
            required
            value={outflowDate}
            onChange={(event) => setOutflowDate(event.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="payee" className="mb-1 block text-sm font-medium text-slate-700">{t.pages.treasury.forms.payee}</label>
          <input
            id="payee"
            name="payee"
            value={payee}
            onChange={(event) => setPayee(event.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="md:col-span-2">
          <label htmlFor="purpose" className="mb-1 block text-sm font-medium text-slate-700">{t.pages.treasury.forms.purpose}</label>
          <input
            id="purpose"
            name="purpose"
            required
            value={purpose}
            onChange={(event) => setPurpose(event.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="projectName" className="mb-1 block text-sm font-medium text-slate-700">{t.pages.treasury.forms.projectName}</label>
          <input
            id="projectName"
            name="projectName"
            value={projectName}
            onChange={(event) => setProjectName(event.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="space-y-3">
        <button
          type="button"
          onClick={() => setOptionalFieldsOpen((prev) => !prev)}
          aria-expanded={optionalFieldsOpen}
          className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-700"
        >
          <span>{t.pages.treasury.forms.optionalFields}</span>
          <ChevronDown
            className={`h-4 w-4 transition-transform ${optionalFieldsOpen ? "rotate-180" : ""}`}
          />
        </button>

        {optionalFieldsOpen ? (
          <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
            <div>
              <label htmlFor="referenceNumber" className="mb-1 block text-sm font-medium text-slate-700">{t.pages.treasury.forms.reference}</label>
              <input
                id="referenceNumber"
                name="referenceNumber"
                value={referenceNumber}
                onChange={(event) => setReferenceNumber(event.target.value)}
                placeholder={t.pages.treasury.forms.placeholder.reference}
                className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="note" className="mb-1 block text-sm font-medium text-slate-700">{t.pages.treasury.forms.note}</label>
              <textarea
                id="note"
                name="note"
                rows={3}
                value={note}
                onChange={(event) => setNote(event.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        ) : null}
      </div>

      {visibleFunds.length === 0 ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          <p>
            {departmentId
              ? "No active department fund is available for the selected department."
              : "No funds found. Add a fund first in Treasury Settings."}
          </p>
          <p className="mt-1 text-amber-800">{t.pages.treasury.forms.noFundAvailableHint}</p>
          {onCreateFundRequest ? (
            <button
              type="button"
              onClick={onCreateFundRequest}
              className="mt-2 inline-flex items-center rounded-md border border-amber-300 bg-white px-2.5 py-1 text-xs font-medium text-amber-900 hover:bg-amber-100"
            >
              {t.pages.treasury.forms.openFundSetup}
            </button>
          ) : null}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <button
          type="submit"
          disabled={!canSubmit}
          onClick={() => setSubmitMode("save")}
          className="inline-flex items-center justify-center rounded-md bg-slate-950 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending && submitMode === "save" ? (
            <span className="inline-flex items-center gap-2">
              <ButtonSpinner />
              {t.pages.treasury.forms.saving}
            </span>
          ) : (
            t.pages.treasury.forms.save
          )}
        </button>

        <button
          type="submit"
          disabled={!canSubmit}
          onClick={() => setSubmitMode("save_add_another")}
          className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending && submitMode === "save_add_another" ? (
            <span className="inline-flex items-center gap-2">
              <ButtonSpinner />
              {t.pages.treasury.forms.saving}
            </span>
          ) : (
            t.pages.treasury.forms.saveAndAddAnother
          )}
        </button>
      </div>
    </form>
  );
}
