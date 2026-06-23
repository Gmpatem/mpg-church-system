"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { ArrowRightLeft } from "lucide-react";
import { ContributionEntryForm } from "@/app/(church)/c/[churchSlug]/treasury/components/ContributionEntryForm";
import { FinancialRecordEntryForm } from "@/app/(church)/c/[churchSlug]/treasury/components/FinancialRecordEntryForm";
import { FundCreateForm } from "@/app/(church)/c/[churchSlug]/treasury/funds/new/FundCreateForm";
import { ButtonSpinner } from "@/components/ui/ButtonSpinner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { createTreasuryFundTransferAction, runTreasuryRemittanceNowAction } from "@/features/treasury/actions";
import { getTodayLocalDate } from "@/lib/utils/format";
import type { TreasuryDialog } from "./types";
import { formatTreasuryAmount } from "./utils";

function TreasuryTransferForm({
  churchSlug,
  funds,
  onSuccess,
}: {
  churchSlug: string;
  funds: any[];
  onSuccess: () => void;
}) {
  const [state, action, isPending] = useActionState(createTreasuryFundTransferAction, null);
  const [sourceFundId, setSourceFundId] = useState("");
  const [destinationFundId, setDestinationFundId] = useState("");
  const [amount, setAmount] = useState("");
  const [transferDate, setTransferDate] = useState(getTodayLocalDate());
  const [reason, setReason] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [note, setNote] = useState("");

  const destinationFunds = useMemo(
    () => funds.filter((fund) => fund.id !== sourceFundId),
    [funds, sourceFundId]
  );

  useEffect(() => {
    if (!funds.length) {
      setSourceFundId("");
      setDestinationFundId("");
      return;
    }
    const source = sourceFundId || funds[0]?.id || "";
    if (!sourceFundId) setSourceFundId(source);
    const nextDestination = funds.find((fund) => fund.id !== source)?.id ?? "";
    if (!destinationFundId || destinationFundId === source) setDestinationFundId(nextDestination);
  }, [destinationFundId, funds, sourceFundId]);

  useEffect(() => {
    if (!state?.ok) return;
    setAmount("");
    setReason("");
    setReferenceNumber("");
    setNote("");
    onSuccess();
  }, [onSuccess, state]);

  const canSubmit =
    !isPending &&
    Boolean(sourceFundId) &&
    Boolean(destinationFundId) &&
    sourceFundId !== destinationFundId &&
    Number(amount) > 0 &&
    Boolean(transferDate) &&
    Boolean(reason.trim());

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="churchSlug" value={churchSlug} />
      {state && !state.ok ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</div>
      ) : null}
      {state && state.ok ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{state.message}</div>
      ) : null}

      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <label htmlFor="transfer-source" className="mb-1 block text-sm font-medium text-foreground">From Fund</label>
          <select id="transfer-source" name="sourceFundId" value={sourceFundId} onChange={(event) => setSourceFundId(event.target.value)} className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm">
            {funds.map((fund) => (
              <option key={fund.id} value={fund.id}>{fund.name || fund.fund_name}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="transfer-destination" className="mb-1 block text-sm font-medium text-foreground">To Fund</label>
          <select id="transfer-destination" name="destinationFundId" value={destinationFundId} onChange={(event) => setDestinationFundId(event.target.value)} className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm">
            {destinationFunds.map((fund) => (
              <option key={fund.id} value={fund.id}>{fund.name || fund.fund_name}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="transfer-amount" className="mb-1 block text-sm font-medium text-foreground">Amount</label>
          <input id="transfer-amount" name="amount" type="number" min="0.01" step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm font-semibold" required />
        </div>
        <div>
          <label htmlFor="transfer-date" className="mb-1 block text-sm font-medium text-foreground">Date</label>
          <input id="transfer-date" name="transferDate" type="date" value={transferDate} onChange={(event) => setTransferDate(event.target.value)} className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm" required />
        </div>
        <div>
          <label htmlFor="transfer-reference" className="mb-1 block text-sm font-medium text-foreground">Reference</label>
          <input id="transfer-reference" name="referenceNumber" value={referenceNumber} onChange={(event) => setReferenceNumber(event.target.value)} placeholder="Leave blank to auto-generate" className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm" />
        </div>
        <div>
          <label htmlFor="transfer-reason" className="mb-1 block text-sm font-medium text-foreground">Reason</label>
          <input id="transfer-reason" name="reason" value={reason} onChange={(event) => setReason(event.target.value)} className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm" required />
        </div>
      </div>
      <div>
        <label htmlFor="transfer-note" className="mb-1 block text-sm font-medium text-foreground">Note</label>
        <textarea id="transfer-note" name="note" rows={3} value={note} onChange={(event) => setNote(event.target.value)} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
      </div>
      <Button type="submit" disabled={!canSubmit} className="h-10 gap-2 rounded-lg">
        {isPending ? <ButtonSpinner className="size-4" /> : <ArrowRightLeft className="size-4" aria-hidden="true" />}
        Move Money
      </Button>
    </form>
  );
}

function RunRemittanceForm({
  churchSlug,
  pendingAmount,
  onSuccess,
}: {
  churchSlug: string;
  pendingAmount: number;
  onSuccess: () => void;
}) {
  const [state, action, isPending] = useActionState(runTreasuryRemittanceNowAction, null);

  useEffect(() => {
    if (state?.ok) onSuccess();
  }, [onSuccess, state]);

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="churchSlug" value={churchSlug} />
      <input type="hidden" name="manualOverride" value="true" />
      {state && !state.ok ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</div>
      ) : null}
      <div className="rounded-xl border border-border bg-muted/40 p-4">
        <p className="text-sm text-muted-foreground">Pending amount</p>
        <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">{formatTreasuryAmount(pendingAmount)}</p>
      </div>
      <p className="text-sm text-muted-foreground">
        This uses the existing Treasury remittance action and creates records according to the configured remittance mode.
      </p>
      <Button type="submit" disabled={isPending || pendingAmount <= 0} className="h-10 rounded-lg">
        {isPending ? "Running..." : "Run Remittance"}
      </Button>
    </form>
  );
}

export function TreasuryDialogsHost({
  churchSlug,
  dialog,
  onDialogChange,
  data,
  alreadyTithedIds,
}: {
  churchSlug: string;
  dialog: TreasuryDialog;
  onDialogChange: (dialog: TreasuryDialog) => void;
  data: any;
  alreadyTithedIds: string[];
}) {
  const open = dialog !== null;
  const close = () => onDialogChange(null);
  const title =
    dialog?.type === "money-in"
      ? "Record Money In"
      : dialog?.type === "money-out"
        ? "Record Money Out"
        : dialog?.type === "create-fund"
          ? "Create Fund"
          : dialog?.type === "transfer"
            ? "Transfer Funds"
            : "Run Remittance";
  const description =
    dialog?.type === "money-in"
      ? "Capture tithe, offering, donation, or other incoming funds."
      : dialog?.type === "money-out"
        ? "Capture church spending, project expenses, and disbursements."
        : dialog?.type === "create-fund"
          ? "Create a Treasury fund using the existing secure fund action."
          : dialog?.type === "transfer"
            ? "Move money between active funds without counting it as income or expense."
            : "Run the configured mission remittance flow.";

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) close(); }}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto rounded-xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {dialog?.type === "money-in" ? (
          <ContributionEntryForm
            churchSlug={churchSlug}
            options={data.formOptions}
            modeLabel="Record Money In"
            alreadyTithedIds={alreadyTithedIds}
            onSuccess={close}
            onCreateFundRequest={() => onDialogChange({ type: "create-fund" })}
          />
        ) : null}
        {dialog?.type === "money-out" ? (
          <FinancialRecordEntryForm
            churchSlug={churchSlug}
            options={data.formOptions}
            modeLabel="Record Money Out"
            financeSettings={data.financeSettings}
            onSuccess={close}
            onCreateFundRequest={() => onDialogChange({ type: "create-fund" })}
          />
        ) : null}
        {dialog?.type === "create-fund" ? <FundCreateForm churchSlug={churchSlug} embedded /> : null}
        {dialog?.type === "transfer" ? (
          <TreasuryTransferForm
            churchSlug={churchSlug}
            funds={data.formOptions.funds}
            onSuccess={close}
          />
        ) : null}
        {dialog?.type === "run-remittance" ? (
          <RunRemittanceForm
            churchSlug={churchSlug}
            pendingAmount={data.remittance.pendingAmount}
            onSuccess={close}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

