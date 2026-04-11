"use client";

import { useEffect, useMemo, useState } from "react";
import { useActionState } from "react";
import { ButtonSpinner } from "@/components/ui/ButtonSpinner";
import { createTreasuryInflowAction } from "@/features/treasury/actions";
import { useI18n } from "@/features/i18n";
import { TreasuryMemberPicker } from "@/app/(church)/c/[churchSlug]/treasury/components/TreasuryMemberPicker";

type SourceMode = "member" | "anonymous" | "visitor";

interface ContributionEntryFormProps {
  churchSlug: string;
  options: {
    funds: Array<{ id: string; name: string; code: string; fund_type: string }>;
    members: Array<{ id: string; display_name?: string | null; first_name: string; last_name: string; member_code?: string | null }>;
  };
  defaults?: {
    inflowType?: string;
    fundCode?: string;
  };
  modeLabel?: string;
  alreadyTithedIds?: string[];
}

function getTodayLocalDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
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
  if (sourceMode === "anonymous") return t.pages.treasury.forms.sourceModes.anonymous;
  return t.pages.treasury.forms.sourceModes.visitor;
}

function getVisibleFunds(
  funds: Array<{ id: string; name: string; code: string; fund_type: string }>,
  inflowType: string
) {
  if (inflowType === "tithe") {
    return funds.filter((fund) => fund.fund_type === "tithe" || fund.code === "tithe");
  }

  return funds.filter((fund) => fund.fund_type !== "tithe");
}

export function ContributionEntryForm({
  churchSlug,
  options,
  defaults,
  modeLabel,
  alreadyTithedIds = [],
}: ContributionEntryFormProps) {
  const { t } = useI18n();
  const [state, formAction, isPending] = useActionState(createTreasuryInflowAction, null);
  const [submitMode, setSubmitMode] = useState<"save" | "save_add_another">("save");
  const [entryType, setEntryType] = useState<string>(defaults?.inflowType ?? "tithe");
  const [sourceMode, setSourceMode] = useState<SourceMode>("member");
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [amount, setAmount] = useState("");
  const [inflowDate, setInflowDate] = useState(getTodayLocalDate());
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [fundId, setFundId] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [note, setNote] = useState("");

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
    return getVisibleFunds(options.funds, isFixedType ? (defaults?.inflowType ?? entryType) : entryType);
  }, [defaultFundId, defaults?.inflowType, entryType, isFixedFund, isFixedType, options.funds]);

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
  }, [selectedMemberId, sourceMode]);

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
  }, [sourceMode, state, submitMode]);

  const memberRequired = sourceMode === "member";
  const currentEntryType = isFixedType ? (defaults?.inflowType ?? entryType) : entryType;
  const currentFundId = isFixedFund ? defaultFundId : fundId;
  const canSubmit =
    !isPending &&
    Boolean(currentEntryType) &&
    Boolean(currentFundId) &&
    Boolean(inflowDate) &&
    Number(amount) > 0 &&
    (!memberRequired || Boolean(selectedMemberId));

  return (
    <form action={formAction} className="space-y-5 rounded-lg border border-slate-200 bg-white p-4 lg:p-5">
      <input type="hidden" name="churchSlug" value={churchSlug} />
      <input type="hidden" name="submitMode" value={submitMode} />
      <input type="hidden" name="inflowType" value={currentEntryType} />
      <input type="hidden" name="fundId" value={currentFundId} />
      <input type="hidden" name="memberId" value={sourceMode === "member" ? selectedMemberId : ""} />
      <input type="hidden" name="isAnonymous" value={sourceMode === "member" ? "false" : "true"} />

      <div>
        <h3 className="text-base font-semibold text-slate-900">{modeLabel ?? t.pages.treasury.forms.recordContribution}</h3>
        <p className="mt-1 text-sm text-slate-600">{t.pages.treasury.forms.descriptions.moneyIn}</p>
      </div>

      {state && !state.ok ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{state.error}</div>
      ) : null}

      {state && state.ok ? (
        <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{state.message}</div>
      ) : null}

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {!isFixedType ? (
          <div>
            <label htmlFor="inflowType" className="mb-1 block text-sm font-medium text-slate-700">{t.pages.treasury.forms.entryType}</label>
            <select
              id="inflowType"
              value={entryType}
              onChange={(event) => setEntryType(event.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
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
            className="w-full rounded-md border border-slate-300 px-3 py-2.5 text-base font-semibold outline-none focus:ring-2 focus:ring-blue-500"
          />
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

      {currentEntryType === "tithe" && availableMembers.length === 0 ? (
        <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-800">
          {t.pages.treasury.forms.allMembersAlreadyTithed}
        </div>
      ) : null}

      <details className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
        <summary className="cursor-pointer text-sm font-medium text-slate-700">{t.pages.treasury.forms.optionalFields}</summary>
        <div className="mt-3 space-y-3">
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
      </details>

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
