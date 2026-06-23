"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  ArrowDownLeft,
  ArrowRightLeft,
  ArrowUpRight,
  CalendarClock,
  Landmark,
  Plus,
  WalletCards,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { TreasuryDialog } from "../types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TreasuryAmount,
  TreasuryEmptyState,
  TreasuryFilterSelect,
  TreasuryPagination,
  TreasuryPanel,
  TreasurySearchField,
  TreasurySummaryStrip,
  TreasuryToolbar,
} from "../shared";
import { formatDate, formatTreasuryAmount } from "../utils";

export function TreasuryTransfersTab({
  data,
  onOpenDialog,
}: {
  data: any;
  onOpenDialog: (dialog: TreasuryDialog) => void;
}) {
  const history = data.transfers?.history ?? [];
  const funds = data.workspace?.funds ?? [];
  const [search, setSearch] = useState("");
  const [fundId, setFundId] = useState("");
  const [selectedId, setSelectedId] = useState(history[0]?.id ?? "");

  const filteredHistory = useMemo(() => {
    const q = search.trim().toLowerCase();
    return history.filter((row: any) => {
      if (fundId && row.source_fund_id !== fundId && row.destination_fund_id !== fundId) return false;
      if (!q) return true;
      return [
        row.source_fund_name,
        row.destination_fund_name,
        row.reason,
        row.reference_number,
        row.recorded_by_label,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [fundId, history, search]);

  const selected = filteredHistory.find((row: any) => row.id === selectedId) ?? filteredHistory[0] ?? null;
  const totalTransferred = history.reduce((sum: number, row: any) => sum + Number(row.amount || 0), 0);
  const fundBalanceTotal = funds.reduce((sum: number, fund: any) => sum + Number(fund.balance || 0), 0);
  const transferFunds = funds.filter((fund: any) => Number(fund.transfers_in || 0) > 0 || Number(fund.transfers_out || 0) > 0);
  const largestTransfer = history.reduce((max: number, row: any) => Math.max(max, Number(row.amount || 0)), 0);

  return (
    <div className="min-w-0 space-y-4">
      <TreasurySummaryStrip
        items={[
          { label: "Transfers", value: history.length, hint: "Internal fund movements", icon: <ArrowRightLeft className="size-6" />, tone: "green" },
          { label: "Total Moved", value: formatTreasuryAmount(totalTransferred), hint: "Across transfer history", icon: <WalletCards className="size-6" />, tone: "blue" },
          { label: "Funds Touched", value: transferFunds.length, hint: "With transfer activity", icon: <Landmark className="size-6" />, tone: "purple" },
          { label: "Largest Transfer", value: formatTreasuryAmount(largestTransfer), hint: "Highest single movement", icon: <CalendarClock className="size-6" />, tone: "neutral" },
        ]}
      />

      {data.transfers?.migrationRequired ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Fund transfers are not enabled yet. Apply the treasury fund transfers migration and refresh.
        </div>
      ) : null}

      <TreasuryToolbar>
        <TreasurySearchField value={search} onChange={setSearch} placeholder="Search transfers..." />
        <TreasuryFilterSelect
          label="Fund"
          value={fundId}
          onValueChange={setFundId}
          options={funds.map((fund: any) => ({ value: fund.fund_id, label: fund.fund_name }))}
        />
        <Button
          type="button"
          onClick={() => onOpenDialog({ type: "transfer" })}
          className="ml-auto h-10 gap-2 rounded-lg"
          disabled={!data.transfers?.canManage || data.transfers?.migrationRequired}
        >
          <Plus className="size-4" aria-hidden="true" />
          Transfer Funds
        </Button>
      </TreasuryToolbar>

      <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[minmax(0,1fr)_360px]">
        <TreasuryPanel title="Transfer Ledger" contentClassName="p-0">
          {filteredHistory.length === 0 ? (
            <div className="p-5">
              <TreasuryEmptyState title="No transfers match the current filters." message="Use Transfer Funds to move money internally between active funds." />
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead className="h-11">Date</TableHead>
                    <TableHead className="h-11">From Fund</TableHead>
                    <TableHead className="h-11">To Fund</TableHead>
                    <TableHead className="h-11">Reason</TableHead>
                    <TableHead className="h-11">Reference</TableHead>
                    <TableHead className="h-11 text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredHistory.map((row: any) => {
                    const isSelected = selected?.id === row.id;
                    return (
                      <TableRow
                        key={row.id}
                        data-state={isSelected ? "selected" : undefined}
                        className="cursor-pointer"
                        tabIndex={0}
                        onClick={() => setSelectedId(row.id)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") setSelectedId(row.id);
                        }}
                      >
                        <TableCell className="py-3 text-xs text-muted-foreground">{formatDate(row.transfer_date)}</TableCell>
                        <TableCell className="py-3">
                          <div className="flex items-center gap-2">
                            <span className="rounded-full bg-red-50 p-1.5 text-red-600">
                              <ArrowUpRight className="size-4" aria-hidden="true" />
                            </span>
                            <span className="text-sm font-medium text-foreground">{row.source_fund_name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-3">
                          <div className="flex items-center gap-2">
                            <span className="rounded-full bg-emerald-50 p-1.5 text-primary">
                              <ArrowDownLeft className="size-4" aria-hidden="true" />
                            </span>
                            <span className="text-sm font-medium text-foreground">{row.destination_fund_name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-[260px] truncate py-3 text-sm text-foreground">{row.reason}</TableCell>
                        <TableCell className="py-3 text-xs text-muted-foreground">{row.reference_number || "-"}</TableCell>
                        <TableCell className="py-3 text-right"><TreasuryAmount value={row.amount} /></TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              <TreasuryPagination label={`Showing 1-${filteredHistory.length} of ${filteredHistory.length} transfers`} />
            </>
          )}
        </TreasuryPanel>

        <TreasuryPanel title="Transfer Details" contentClassName="p-5">
          {!selected ? (
            <TreasuryEmptyState title="Select a transfer" message="Choose a transfer to inspect source, destination, reference, and recorder." />
          ) : (
            <div className="space-y-5">
              <div>
                <p className="text-sm text-muted-foreground">Internal Transfer</p>
                <p className="mt-1 text-3xl font-semibold tabular-nums text-foreground">{formatTreasuryAmount(selected.amount)}</p>
              </div>
              <div className="rounded-xl border border-border">
                <TransferStep label="From" value={selected.source_fund_name} icon={<ArrowUpRight className="size-4" aria-hidden="true" />} tone="red" />
                <TransferStep label="To" value={selected.destination_fund_name} icon={<ArrowDownLeft className="size-4" aria-hidden="true" />} tone="green" />
              </div>
              <dl className="space-y-2 text-sm">
                <Info label="Transfer Date" value={formatDate(selected.transfer_date)} />
                <Info label="Reason" value={selected.reason || "-"} />
                <Info label="Reference" value={selected.reference_number || "-"} />
                <Info label="Recorded By" value={selected.recorded_by_label || "-"} />
              </dl>
              <div className="rounded-xl border border-border bg-muted/30 p-4">
                <p className="text-xs font-medium uppercase text-muted-foreground">Current Fund Balance Total</p>
                <p className="mt-1 text-xl font-semibold tabular-nums text-foreground">{formatTreasuryAmount(fundBalanceTotal)}</p>
              </div>
            </div>
          )}
        </TreasuryPanel>
      </div>
    </div>
  );
}

function TransferStep({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: string;
  icon: ReactNode;
  tone: "green" | "red";
}) {
  return (
    <div className="flex items-center gap-3 border-b border-border p-3 last:border-b-0">
      <span className={tone === "green" ? "rounded-full bg-emerald-50 p-2 text-primary" : "rounded-full bg-red-50 p-2 text-red-600"}>
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="truncate text-sm font-semibold text-foreground">{value}</p>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="min-w-0 text-right font-medium text-foreground">{value}</dd>
    </div>
  );
}
