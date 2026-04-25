"use client";

import { useActionState } from "react";
import { useEffect, useMemo, useState } from "react";
import { MobileBottomSheet } from "@/components/mobile/MobileBottomSheet";
import { ButtonSpinner } from "@/components/ui/ButtonSpinner";
import {
  WorkspaceEmptyState,
  WorkspaceSectionCard,
} from "@/components/workspace";
import { createTreasuryFundTransferAction } from "@/features/treasury/actions";
import { formatAmount, getTodayLocalDate } from "@/lib/utils/format";

type FundOption = {
  id: string;
  code: string;
  name: string;
  fund_type: string;
  department_id?: string | null;
};

type TransferHistoryRow = {
  id: string;
  transfer_date: string;
  amount: number;
  reason: string;
  reference_number: string | null;
  source_fund_id: string;
  source_fund_name: string;
  destination_fund_id: string;
  destination_fund_name: string;
  recorded_by_user_id: string;
  recorded_by_label: string;
};

type FundBalanceRow = {
  fund_id: string;
  fund_code: string;
  fund_name: string;
  fund_type: string;
  inflows: number;
  outflows: number;
  transfers_in: number;
  transfers_out: number;
  balance: number;
};

interface TreasuryTransfersTabProps {
  churchSlug: string;
  funds: FundOption[];
  history: TransferHistoryRow[];
  fundBalances: FundBalanceRow[];
  canManage: boolean;
  migrationRequired: boolean;
}

interface TransferFormProps {
  churchSlug: string;
  funds: FundOption[];
  sourceFundId: string;
  destinationFundId: string;
  amount: string;
  transferDate: string;
  reason: string;
  referenceNumber: string;
  note: string;
  canSubmit: boolean;
  isPending: boolean;
  formAction: (payload: FormData) => void;
  setSourceFundId: (value: string) => void;
  setDestinationFundId: (value: string) => void;
  setAmount: (value: string) => void;
  setTransferDate: (value: string) => void;
  setReason: (value: string) => void;
  setReferenceNumber: (value: string) => void;
  setNote: (value: string) => void;
  className?: string;
  idPrefix: string;
}

function TransferForm({
  churchSlug,
  funds,
  sourceFundId,
  destinationFundId,
  amount,
  transferDate,
  reason,
  referenceNumber,
  note,
  canSubmit,
  isPending,
  formAction,
  setSourceFundId,
  setDestinationFundId,
  setAmount,
  setTransferDate,
  setReason,
  setReferenceNumber,
  setNote,
  className,
  idPrefix,
}: TransferFormProps) {
  const destinationFunds = useMemo(
    () => funds.filter((fund) => fund.id !== sourceFundId),
    [funds, sourceFundId]
  );

  return (
    <form
      action={formAction}
      className={className ?? "space-y-4 rounded-lg border border-slate-200 bg-white p-4"}
    >
      <input type="hidden" name="churchSlug" value={churchSlug} />

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div>
          <label
            htmlFor={`${idPrefix}-source-fund`}
            className="mb-1 block text-sm font-medium text-slate-700"
          >
            From Fund
          </label>
          <select
            id={`${idPrefix}-source-fund`}
            name="sourceFundId"
            required
            value={sourceFundId}
            onChange={(event) => setSourceFundId(event.target.value)}
            className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
          >
            {funds.length === 0 ? (
              <option value="">
                No funds found. Add a fund first in Treasury Settings.
              </option>
            ) : null}
            {funds.map((fund) => (
              <option key={fund.id} value={fund.id}>
                {fund.name}
                {fund.code ? ` (${fund.code})` : ""}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor={`${idPrefix}-destination-fund`}
            className="mb-1 block text-sm font-medium text-slate-700"
          >
            To Fund
          </label>
          <select
            id={`${idPrefix}-destination-fund`}
            name="destinationFundId"
            required
            value={destinationFundId}
            onChange={(event) => setDestinationFundId(event.target.value)}
            className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
          >
            {destinationFunds.length === 0 ? (
              <option value="">Select a different fund</option>
            ) : null}
            {destinationFunds.map((fund) => (
              <option key={fund.id} value={fund.id}>
                {fund.name}
                {fund.code ? ` (${fund.code})` : ""}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor={`${idPrefix}-amount`}
            className="mb-1 block text-sm font-medium text-slate-700"
          >
            Amount
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-slate-500">
              FCFA
            </span>
            <input
              id={`${idPrefix}-amount`}
              name="amount"
              type="number"
              min="0.01"
              step="0.01"
              inputMode="decimal"
              required
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              className="w-full rounded-xl border border-slate-300 pl-14 pr-3 py-2.5 text-base font-semibold outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor={`${idPrefix}-date`}
            className="mb-1 block text-sm font-medium text-slate-700"
          >
            Date
          </label>
          <input
            id={`${idPrefix}-date`}
            name="transferDate"
            type="date"
            required
            value={transferDate}
            onChange={(event) => setTransferDate(event.target.value)}
            className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div>
          <label
            htmlFor={`${idPrefix}-reason`}
            className="mb-1 block text-sm font-medium text-slate-700"
          >
            Reason
          </label>
          <input
            id={`${idPrefix}-reason`}
            name="reason"
            required
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Why is this transfer needed?"
          />
        </div>

        <div>
          <label
            htmlFor={`${idPrefix}-reference`}
            className="mb-1 block text-sm font-medium text-slate-700"
          >
            Reference (optional)
          </label>
          <input
            id={`${idPrefix}-reference`}
            name="referenceNumber"
            value={referenceNumber}
            onChange={(event) => setReferenceNumber(event.target.value)}
            className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Leave blank to auto-generate"
          />
        </div>
      </div>

      <div>
        <label
          htmlFor={`${idPrefix}-note`}
          className="mb-1 block text-sm font-medium text-slate-700"
        >
          Note (optional)
        </label>
        <textarea
          id={`${idPrefix}-note`}
          name="note"
          rows={3}
          value={note}
          onChange={(event) => setNote(event.target.value)}
          className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Additional context for this transfer"
        />
      </div>

      <button
        type="submit"
        disabled={!canSubmit}
        className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? (
          <>
            <ButtonSpinner className="mr-2 h-4 w-4" />
            Moving...
          </>
        ) : (
          "Move Money"
        )}
      </button>
    </form>
  );
}

export function TreasuryTransfersTab({
  churchSlug,
  funds,
  history,
  fundBalances,
  canManage,
  migrationRequired,
}: TreasuryTransfersTabProps) {
  const [state, formAction, isPending] = useActionState(
    createTreasuryFundTransferAction,
    null
  );
  const [sheetOpen, setSheetOpen] = useState(false);

  const [sourceFundId, setSourceFundId] = useState("");
  const [destinationFundId, setDestinationFundId] = useState("");
  const [amount, setAmount] = useState("");
  const [transferDate, setTransferDate] = useState(getTodayLocalDate());
  const [reason, setReason] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    if (funds.length === 0) {
      setSourceFundId("");
      setDestinationFundId("");
      return;
    }

    const source = sourceFundId || funds[0]?.id || "";
    if (!sourceFundId && source) {
      setSourceFundId(source);
    }

    const firstDestination = funds.find((fund) => fund.id !== source)?.id ?? "";
    if (!destinationFundId || destinationFundId === source) {
      setDestinationFundId(firstDestination);
    }
  }, [destinationFundId, funds, sourceFundId]);

  useEffect(() => {
    if (!state?.ok) return;
    setAmount("");
    setReason("");
    setReferenceNumber("");
    setNote("");
    setSheetOpen(false);
  }, [state]);

  const canSubmit =
    !isPending &&
    Boolean(sourceFundId) &&
    Boolean(destinationFundId) &&
    sourceFundId !== destinationFundId &&
    Number(amount) > 0 &&
    Boolean(transferDate) &&
    Boolean(reason.trim());

  return (
    <div className="space-y-5">
      <WorkspaceSectionCard
        title="Transfers"
        description="Move money from one fund to another without creating income or expense."
      >
        {!canManage ? (
          <WorkspaceEmptyState
            title="Transfer access required"
            message="Only church admins, treasurers, and pastors can move money between funds."
          />
        ) : (
          <div className="space-y-3">
            {state && !state.ok ? (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {state.error}
              </div>
            ) : null}
            {state && state.ok ? (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {state.message}
              </div>
            ) : null}

            {migrationRequired ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                Fund transfers are not enabled yet. Apply the treasury fund
                transfers migration and refresh.
              </div>
            ) : (
              <>
                <div className="md:hidden">
                  <button
                    type="button"
                    onClick={() => setSheetOpen(true)}
                    className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white"
                  >
                    Move Money
                  </button>
                </div>

                <div className="hidden md:block">
                  <TransferForm
                    churchSlug={churchSlug}
                    funds={funds}
                    sourceFundId={sourceFundId}
                    destinationFundId={destinationFundId}
                    amount={amount}
                    transferDate={transferDate}
                    reason={reason}
                    referenceNumber={referenceNumber}
                    note={note}
                    canSubmit={canSubmit}
                    isPending={isPending}
                    formAction={formAction}
                    setSourceFundId={setSourceFundId}
                    setDestinationFundId={setDestinationFundId}
                    setAmount={setAmount}
                    setTransferDate={setTransferDate}
                    setReason={setReason}
                    setReferenceNumber={setReferenceNumber}
                    setNote={setNote}
                    idPrefix="desktop-transfer"
                  />
                </div>

                <MobileBottomSheet
                  open={sheetOpen}
                  onOpenChange={setSheetOpen}
                  title="Move Money"
                >
                  <TransferForm
                    churchSlug={churchSlug}
                    funds={funds}
                    sourceFundId={sourceFundId}
                    destinationFundId={destinationFundId}
                    amount={amount}
                    transferDate={transferDate}
                    reason={reason}
                    referenceNumber={referenceNumber}
                    note={note}
                    canSubmit={canSubmit}
                    isPending={isPending}
                    formAction={formAction}
                    setSourceFundId={setSourceFundId}
                    setDestinationFundId={setDestinationFundId}
                    setAmount={setAmount}
                    setTransferDate={setTransferDate}
                    setReason={setReason}
                    setReferenceNumber={setReferenceNumber}
                    setNote={setNote}
                    idPrefix="mobile-transfer"
                  />
                </MobileBottomSheet>
              </>
            )}
          </div>
        )}
      </WorkspaceSectionCard>

      <WorkspaceSectionCard
        title="Fund Balances"
        description="Balances include inflows, outflows, transfers out, and transfers in."
        contentClassName="p-0"
      >
        {fundBalances.length === 0 ? (
          <div className="p-5">
            <WorkspaceEmptyState
              title="No funds found"
              message="Add a fund first in Treasury Settings."
            />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-3 p-3 md:hidden">
              {fundBalances.map((fund) => (
                <div
                  key={fund.fund_id}
                  className="rounded-2xl border border-slate-200 bg-white p-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {fund.fund_name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {fund.fund_code || "No code"}
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-slate-900">
                      {formatAmount(fund.balance)}
                    </p>
                  </div>
                  <p className="mt-2 text-xs text-slate-600">
                    In: {formatAmount(fund.inflows)} • Out:{" "}
                    {formatAmount(fund.outflows)}
                  </p>
                  <p className="mt-1 text-xs text-slate-600">
                    Transfers In: {formatAmount(fund.transfers_in)} • Transfers Out:{" "}
                    {formatAmount(fund.transfers_out)}
                  </p>
                </div>
              ))}
            </div>

            <div className="hidden overflow-x-auto md:block">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Fund
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Inflows
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Outflows
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Transfers Out
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Transfers In
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Balance
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {fundBalances.map((fund) => (
                    <tr key={fund.fund_id}>
                      <td className="px-4 py-3.5">
                        <p className="text-sm font-semibold text-slate-900">
                          {fund.fund_name}
                        </p>
                        <p className="text-xs text-slate-500">
                          {fund.fund_code || "No code"}
                        </p>
                      </td>
                      <td className="px-4 py-3.5 text-right text-sm text-slate-700">
                        {formatAmount(fund.inflows)}
                      </td>
                      <td className="px-4 py-3.5 text-right text-sm text-slate-700">
                        {formatAmount(fund.outflows)}
                      </td>
                      <td className="px-4 py-3.5 text-right text-sm text-slate-700">
                        {formatAmount(fund.transfers_out)}
                      </td>
                      <td className="px-4 py-3.5 text-right text-sm text-slate-700">
                        {formatAmount(fund.transfers_in)}
                      </td>
                      <td className="px-4 py-3.5 text-right text-sm font-semibold text-slate-900">
                        {formatAmount(fund.balance)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </WorkspaceSectionCard>

      <WorkspaceSectionCard
        title="Transfer History"
        description="Recent internal fund transfers."
        contentClassName="p-0"
      >
        {migrationRequired ? (
          <div className="p-5">
            <WorkspaceEmptyState
              title="Transfers unavailable"
              message="Apply the transfer migration to load transfer history."
            />
          </div>
        ) : history.length === 0 ? (
          <div className="p-5">
            <WorkspaceEmptyState
              title="No transfers yet"
              message="Use Move Money to record your first internal fund transfer."
            />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-3 p-3 md:hidden">
              {history.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-slate-200 bg-white p-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs text-slate-500">{item.transfer_date}</p>
                    <p className="text-sm font-semibold text-slate-900">
                      {formatAmount(item.amount)}
                    </p>
                  </div>
                  <p className="mt-2 text-sm font-medium text-slate-900">
                    {item.source_fund_name} → {item.destination_fund_name}
                  </p>
                  <p className="mt-1 text-xs text-slate-600">{item.reason}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Recorded by: {item.recorded_by_label}
                  </p>
                </div>
              ))}
            </div>

            <div className="hidden overflow-x-auto md:block">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      From → To
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Reason
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Recorded by
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {history.map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-3.5 text-sm text-slate-600">
                        {item.transfer_date}
                      </td>
                      <td className="px-4 py-3.5 text-sm font-medium text-slate-900">
                        {item.source_fund_name} → {item.destination_fund_name}
                      </td>
                      <td className="px-4 py-3.5 text-sm text-slate-600">
                        {item.reason}
                      </td>
                      <td className="px-4 py-3.5 text-sm text-slate-600">
                        {item.recorded_by_label}
                      </td>
                      <td className="px-4 py-3.5 text-right text-sm font-semibold text-slate-900">
                        {formatAmount(item.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </WorkspaceSectionCard>
    </div>
  );
}
