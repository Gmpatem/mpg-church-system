"use client";

import { useEffect, useMemo, useState } from "react";
import { useActionState } from "react";
import { ChevronDown } from "lucide-react";
import { ButtonSpinner } from "@/components/ui/ButtonSpinner";
import { createTreasuryInflowAction } from "@/features/treasury/actions";
import { useI18n } from "@/features/i18n";
import { TreasuryMemberPicker } from "@/app/(church)/c/[churchSlug]/treasury/components/TreasuryMemberPicker";
import { TreasuryDepartmentPicker } from "@/app/(church)/c/[churchSlug]/treasury/components/TreasuryDepartmentPicker";
import { getTodayLocalDate } from "@/lib/utils/format";

type SourceMode = "member" | "department" | "anonymous" | "visitor";

interface ContributionEntryFormProps {
  churchSlug: string;
  options: {
    funds: Array<{ id: string; name: string; code: string; fund_type: string; department_id?: string | null }>;
    members: Array<{ id: string; display_name?: string | null; first_name: string; last_name: string; member_code?: string | null }>;
    departments: Array<{ id: string; department_name: string }>;
  };
  defaults?: {
    inflowType?: string;
    fundCode?: string;
  };
  modeLabel?: string;
  alreadyTithedIds?: string[];
  onCreateFundRequest?: () => void;
}

function getLockedLabel(inflowType: string | undefined, t: { pages: { treasury: { forms: { types: Record<string, string> } } } }) {
  if (inflowType === "tithe") return t.pages.treasury.forms.types.tithe;
  if (inflowType === "offering") return t.pages.treasury.forms.types.offering;
  if (inflowType === "donation") return t.pages.treasury.forms.types.donation;
  if (inflowType === "special_contribution") return t.pages.treasury.forms.types.specialContribution;
  return inflowType ?? "";
}

function getSourceModeLabel(sourceMode: SourceMode, t: any) {
  if (sourceMode === "member") return t.pages.treasury.forms.sourceModes.member;
  if (sourceMode === "department") return t.pages.treasury.forms.sourceModes.department;
  if (sourceMode === "anonymous") return t.pages.treasury.forms.sourceModes.anonymous;
  return t.pages.treasury.forms.sourceModes.visitor;
}

const inflowFundCompatibility: Record<string, string[]> = {
  tithe: ["tithe"],
  offering: ["offering", "general", "mission"],
  donation: ["donation", "offering", "general", "mission", "welfare", "project"],
  special_contribution: ["project", "donation", "department", "mission", "welfare", "general", "offering"],
};

function getSupportedFundTypesForInflow(inflowType: string) {
  return inflowFundCompatibility[inflowType] ?? ["general", "offering", "donation", "mission", "project", "department", "welfare"];
}

function getVisibleFunds(
  funds: Array<{ id: string; name: string; code: string; fund_type: string; department_id?: string | null }>,
  inflowType: string
) {
  const allowedTypes = new Set(getSupportedFundTypesForInflow(inflowType));

  if (inflowType === "tithe") {
    return funds.filter((fund) => allowedTypes.has(fund.fund_type) || fund.code.toLowerCase() === "tithe");
  }

  return funds.filter((fund) => allowedTypes.has(fund.fund_type));
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

export function ContributionEntryForm({
  churchSlug,
  options,
  defaults,
  modeLabel,
  alreadyTithedIds = [],
  onCreateFundRequest,
}: ContributionEntryFormProps) {
  const { t } = useI18n();
  const [state, formAction, isPending] = useActionState(createTreasuryInflowAction, null);
  const [submitMode, setSubmitMode] = useState<"save" | "save_add_another">("save");
  const [entryType, setEntryType] = useState<string>(defaults?.inflowType ?? "tithe");
  const [sourceMode, setSourceMode] = useState<SourceMode>("member");
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [selectedDepartmentId, setSelectedDepartmentId] = useState("");
  const [amount, setAmount] = useState("");
  const [inflowDate, setInflowDate] = useState(getTodayLocalDate());
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [fundId, setFundId] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [note, setNote] = useState("");
  const [optionalFieldsOpen, setOptionalFieldsOpen] = useState(false);

  const defaultFundId = useMemo(() => {
    if (!defaults?.fundCode) return "";
    return options.funds.find((fund) => fund.code === defaults.fundCode)?.id ?? "";
  }, [defaults?.fundCode, options.funds]);

  const isFixedType = Boolean(defaults?.inflowType);
  const isFixedFund = Boolean(defaultFundId) && Boolean(defaults?.fundCode);
  const tithedSet = useMemo(() => new Set(alreadyTithedIds), [alreadyTithedIds]);

  const visibleFunds = useMemo(() => {
    if (isFixedFund) {
      return options.funds.filter((fund) => fund.id === defaultFundId);
    }
    const baseFunds = getVisibleFunds(
      options.funds,
      isFixedType ? (defaults?.inflowType ?? entryType) : entryType
    );
    if (sourceMode !== "department") return baseFunds;
    if (!selectedDepartmentId) return [];

    const hasDepartmentMetadata = baseFunds.some((fund) =>
      Object.prototype.hasOwnProperty.call(fund, "department_id")
    );
    if (!hasDepartmentMetadata) return baseFunds;

    return baseFunds.filter((fund) => fund.department_id === selectedDepartmentId);
  }, [
    defaultFundId,
    defaults?.inflowType,
    entryType,
    isFixedFund,
    isFixedType,
    options.funds,
    selectedDepartmentId,
    sourceMode,
  ]);
  const compatibleFundTypes = useMemo(
    () => getSupportedFundTypesForInflow(isFixedType ? (defaults?.inflowType ?? entryType) : entryType),
    [defaults?.inflowType, entryType, isFixedType]
  );

  const availableMembers = useMemo(() => {
    const baseMembers = options.members ?? [];
    if ((isFixedType ? defaults?.inflowType : entryType) !== "tithe") {
      return baseMembers;
    }

    return baseMembers.filter((member) => !tithedSet.has(member.id));
  }, [defaults?.inflowType, entryType, isFixedType, options.members, tithedSet]);

  useEffect(() => {
    if (isFixedFund) {
      setFundId(defaultFundId);
      return;
    }

    if (visibleFunds.length === 0) {
      setFundId("");
      return;
    }

    if (!visibleFunds.some((fund) => fund.id === fundId)) {
      setFundId(visibleFunds[0]?.id ?? "");
    }
  }, [defaultFundId, fundId, isFixedFund, visibleFunds]);

  useEffect(() => {
    if (sourceMode !== "member" && selectedMemberId) {
      setSelectedMemberId("");
    }
    if (sourceMode !== "department" && selectedDepartmentId) {
      setSelectedDepartmentId("");
    }
  }, [selectedDepartmentId, selectedMemberId, sourceMode]);

  useEffect(() => {
    if ((isFixedType ? defaults?.inflowType : entryType) === "tithe" && selectedMemberId && tithedSet.has(selectedMemberId)) {
      setSelectedMemberId("");
    }
  }, [defaults?.inflowType, entryType, isFixedType, selectedMemberId, tithedSet]);

  useEffect(() => {
    if (!state?.ok || submitMode !== "save_add_another") return;

    setAmount("");
    setReferenceNumber("");
    setNote("");
    if (sourceMode === "member") {
      setSelectedMemberId("");
    }
    if (sourceMode === "department") {
      setSelectedDepartmentId("");
    }
  }, [selectedDepartmentId, sourceMode, state, submitMode]);

  const memberRequired = sourceMode === "member";
  const departmentRequired = sourceMode === "department";
  const currentEntryType = isFixedType ? (defaults?.inflowType ?? entryType) : entryType;
  const currentFundId = isFixedFund ? defaultFundId : fundId;
  const selectedFund = visibleFunds.find((fund) => fund.id === currentFundId);
  const isAutoSelectedSingleFund = visibleFunds.length === 1 && selectedFund?.id === visibleFunds[0]?.id;
  const canSubmit =
    !isPending &&
    Boolean(currentEntryType) &&
    Boolean(currentFundId) &&
    Boolean(inflowDate) &&
    Number(amount) > 0 &&
    (!memberRequired || Boolean(selectedMemberId)) &&
    (!departmentRequired || Boolean(selectedDepartmentId));

  return (
    <form action={formAction} className="space-y-5 rounded-lg border border-slate-200 bg-white p-4 lg:p-5">
      <input type="hidden" name="churchSlug" value={churchSlug} />
      <input type="hidden" name="submitMode" value={submitMode} />
      <input type="hidden" name="sourceType" value={sourceMode} />
      <input type="hidden" name="inflowType" value={currentEntryType} />
      <input type="hidden" name="fundId" value={currentFundId} />
      <input type="hidden" name="memberId" value={sourceMode === "member" ? selectedMemberId : ""} />
      <input type="hidden" name="departmentId" value={sourceMode === "department" ? selectedDepartmentId : ""} />
      <input type="hidden" name="isAnonymous" value={sourceMode === "member" || sourceMode === "department" ? "false" : "true"} />

      <div>
        <h3 className="text-base font-semibold text-slate-900">{modeLabel ?? t.pages.treasury.forms.recordContribution}</h3>
        <p className="mt-1 text-sm text-slate-600">{t.pages.treasury.forms.descriptions.moneyIn}</p>
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
            <label htmlFor="inflowType" className="mb-1 block text-sm font-medium text-slate-700">{t.pages.treasury.forms.entryType}</label>
            <select
              id="inflowType"
              value={entryType}
              onChange={(event) => setEntryType(event.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="tithe">{t.pages.treasury.forms.types.tithe}</option>
              <option value="offering">{t.pages.treasury.forms.types.offering}</option>
              <option value="donation">{t.pages.treasury.forms.types.donation}</option>
              <option value="special_contribution">{t.pages.treasury.forms.types.specialContribution}</option>
            </select>
          </div>
        ) : (
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">{t.pages.treasury.forms.entryType}</label>
            <div className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
              {getLockedLabel(defaults?.inflowType, t)}
            </div>
          </div>
        )}

        <div>
          <label htmlFor="sourceMode" className="mb-1 block text-sm font-medium text-slate-700">{t.pages.treasury.forms.sourceMode}</label>
          <select
            id="sourceMode"
            value={sourceMode}
            onChange={(event) => setSourceMode(event.target.value as SourceMode)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="member">{t.pages.treasury.forms.sourceModes.member}</option>
            <option value="department">{t.pages.treasury.forms.sourceModes.department}</option>
            <option value="anonymous">{t.pages.treasury.forms.sourceModes.anonymous}</option>
            <option value="visitor">{t.pages.treasury.forms.sourceModes.visitor}</option>
          </select>
        </div>

        {sourceMode === "member" ? (
          <TreasuryMemberPicker
            members={availableMembers}
            selectedMemberId={selectedMemberId}
            onSelect={setSelectedMemberId}
            label={t.pages.treasury.forms.member}
            placeholder={t.pages.treasury.forms.searchMemberPlaceholder}
            searchPlaceholder={t.pages.treasury.forms.searchMemberPlaceholder}
            emptyMessage={
              currentEntryType === "tithe" && options.members.length > 0
                ? t.pages.treasury.forms.allMembersAlreadyTithed
                : t.pages.treasury.forms.noMembersFound
            }
            clearLabel={t.pages.treasury.forms.unlinked}
            selectedLabel={t.pages.treasury.forms.selectedMember}
          />
        ) : sourceMode === "department" ? (
          <TreasuryDepartmentPicker
            departments={options.departments}
            selectedDepartmentId={selectedDepartmentId}
            onSelect={setSelectedDepartmentId}
            label="Department"
            placeholder="Search department"
            searchPlaceholder="Search department"
            emptyMessage="No departments found."
            clearLabel="Clear department"
            selectedLabel="Selected department"
          />
        ) : (
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">{t.pages.treasury.forms.member}</label>
            <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
              {getSourceModeLabel(sourceMode, t)}
            </div>
          </div>
        )}

        <div>
          <label htmlFor="fundIdVisible" className="mb-1 block text-sm font-medium text-slate-700">{t.pages.treasury.forms.fund}</label>
          <select
            id="fundIdVisible"
            value={currentFundId}
            onChange={(event) => setFundId(event.target.value)}
            disabled={isFixedFund || visibleFunds.length === 0}
            className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-slate-100"
          >
            {visibleFunds.length === 0 ? <option value="">{t.pages.treasury.forms.noFundAvailable}</option> : null}
            {visibleFunds.map((fund) => (
              <option key={fund.id} value={fund.id}>
                {fund.name}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-slate-500">
            {t.pages.treasury.forms.matchingFundTypes}:{" "}
            {compatibleFundTypes.map((fundType) => getFundTypeLabel(fundType, t)).join(", ")}
          </p>
          {isAutoSelectedSingleFund ? (
            <p className="mt-1 text-xs text-emerald-700">{t.pages.treasury.forms.autoSelected}</p>
          ) : null}
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
          <label htmlFor="inflowDate" className="mb-1 block text-sm font-medium text-slate-700">{t.pages.treasury.forms.date}</label>
          <input
            id="inflowDate"
            name="inflowDate"
            type="date"
            value={inflowDate}
            onChange={(event) => setInflowDate(event.target.value)}
            required
            className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {sourceMode === "member" && !selectedMemberId ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {t.pages.treasury.forms.memberRequired}
        </div>
      ) : null}

      {sourceMode === "department" && !selectedDepartmentId ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Please select a department for this department-linked contribution.
        </div>
      ) : null}

      {currentEntryType === "tithe" && availableMembers.length === 0 ? (
        <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-800">
          {t.pages.treasury.forms.allMembersAlreadyTithed}
        </div>
      ) : null}

      {visibleFunds.length === 0 ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          <p>
            {sourceMode === "department"
              ? "No active fund is linked to this department yet."
              : t.pages.treasury.forms.noFundAvailable}
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
