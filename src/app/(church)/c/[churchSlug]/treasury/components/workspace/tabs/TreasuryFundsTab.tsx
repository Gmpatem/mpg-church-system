"use client";

import { useActionState, useMemo, useState } from "react";
import { Eye, Landmark, Plus, ShieldCheck, TriangleAlert, WalletCards } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toggleTreasuryFundAction } from "@/features/treasury/actions";
import type { TreasuryDialog } from "../types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TreasuryAmount, TreasuryEmptyState, TreasuryFilterSelect, TreasuryPagination, TreasuryPanel, TreasuryRowActions, TreasurySearchField, TreasuryStatusBadge, TreasurySummaryStrip, TreasuryToolbar } from "../shared";
import { formatDateTime, formatTreasuryAmount, humanize } from "../utils";

const EMPTY_FUNDS: any[] = [];

export function TreasuryFundsTab({
  churchSlug,
  data,
  onOpenDialog,
  onOpenTransactions,
}: {
  churchSlug: string;
  data: any;
  onOpenDialog: (dialog: TreasuryDialog) => void;
  onOpenTransactions: () => void;
}) {
  const funds = data.workspace?.funds ?? EMPTY_FUNDS;
  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
  const [status, setStatus] = useState("");
  const [selectedId, setSelectedId] = useState(funds[0]?.fund_id ?? "");

  const fundStats = useMemo(() => {
    const fundTypes = new Set<string>();
    let activeCount = 0;
    let negativeBalanceCount = 0;
    let totalBalance = 0;

    for (const fund of funds) {
      const fundType = String(fund.fund_type || "");
      if (fundType) fundTypes.add(fundType);
      if (fund.is_active) activeCount += 1;
      const balance = Number(fund.balance || 0);
      totalBalance += balance;
      if (balance < 0) negativeBalanceCount += 1;
    }

    return {
      activeCount,
      inactiveCount: funds.length - activeCount,
      negativeBalanceCount,
      totalBalance,
      typeOptions: Array.from(fundTypes).map((value) => ({
        value,
        label: humanize(value),
      })),
    };
  }, [funds]);

  const filteredFunds = useMemo(() => {
    const q = search.trim().toLowerCase();
    return funds.filter((fund: any) => {
      if (type && fund.fund_type !== type) return false;
      if (status === "active" && !fund.is_active) return false;
      if (status === "inactive" && fund.is_active) return false;
      if (!q) return true;
      return [fund.fund_name, fund.fund_code, fund.description, fund.department_name, fund.fund_type]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [funds, search, status, type]);

  const selected = filteredFunds.find((fund: any) => fund.fund_id === selectedId) ?? filteredFunds[0] ?? null;

  return (
    <div className="min-w-0 space-y-4">
      <TreasurySummaryStrip
        items={[
          { label: "Total Funds", value: funds.length, hint: "All configured funds", icon: <Landmark className="size-6" />, tone: "green" },
          { label: "Active Funds", value: fundStats.activeCount, hint: `${fundStats.inactiveCount} inactive`, icon: <ShieldCheck className="size-6" />, tone: "green" },
          { label: "Combined Balance", value: formatTreasuryAmount(fundStats.totalBalance), hint: "Across all funds", icon: <WalletCards className="size-6" />, tone: fundStats.totalBalance >= 0 ? "green" : "red" },
          { label: "Funds Requiring Attention", value: fundStats.negativeBalanceCount, hint: "Negative balances", icon: <TriangleAlert className="size-6" />, tone: "amber" },
        ]}
      />

      <TreasuryToolbar>
        <TreasurySearchField value={search} onChange={setSearch} placeholder="Search funds..." />
        <TreasuryFilterSelect label="All Types" value={type} onValueChange={setType} options={fundStats.typeOptions} />
        <TreasuryFilterSelect label="All Statuses" value={status} onValueChange={setStatus} options={[{ value: "active", label: "Active" }, { value: "inactive", label: "Inactive" }]} />
        <Button type="button" onClick={() => onOpenDialog({ type: "create-fund" })} className="ml-auto h-10 gap-2 rounded-lg">
          <Plus className="size-4" aria-hidden="true" />
          Create Fund
        </Button>
      </TreasuryToolbar>

      <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[minmax(0,1fr)_360px]">
        <TreasuryPanel title="Fund Registry" contentClassName="p-0">
          {filteredFunds.length === 0 ? (
            <div className="p-5">
              <TreasuryEmptyState title="No Treasury funds have been configured." message="Create a fund to classify church income, expenses, and transfers." />
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead className="h-11">Fund</TableHead>
                    <TableHead className="h-11">Type</TableHead>
                    <TableHead className="h-11 text-right">Money In</TableHead>
                    <TableHead className="h-11 text-right">Money Out</TableHead>
                    <TableHead className="h-11 text-right">Transfers</TableHead>
                    <TableHead className="h-11 text-right">Available Balance</TableHead>
                    <TableHead className="h-11">Status</TableHead>
                    <TableHead className="h-11 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredFunds.map((fund: any) => {
                    const isSelected = selected?.fund_id === fund.fund_id;
                    return (
                      <TableRow key={fund.fund_id} data-state={isSelected ? "selected" : undefined} className="cursor-pointer" tabIndex={0} onClick={() => setSelectedId(fund.fund_id)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") setSelectedId(fund.fund_id); }}>
                        <TableCell className="py-3">
                          <p className="text-sm font-semibold text-foreground">{fund.fund_name}</p>
                          <p className="text-xs text-muted-foreground">{fund.fund_code || "-"}</p>
                        </TableCell>
                        <TableCell className="py-3">{humanize(fund.fund_type)}</TableCell>
                        <TableCell className="py-3 text-right"><TreasuryAmount value={fund.inflows} direction="inflow" /></TableCell>
                        <TableCell className="py-3 text-right"><TreasuryAmount value={fund.outflows} direction="outflow" /></TableCell>
                        <TableCell className="py-3 text-right text-sm">
                          <div className="tabular-nums text-primary">+{formatTreasuryAmount(fund.transfers_in)}</div>
                          <div className="tabular-nums text-red-600">-{formatTreasuryAmount(fund.transfers_out)}</div>
                        </TableCell>
                        <TableCell className="py-3 text-right"><TreasuryAmount value={fund.balance} direction={Number(fund.balance || 0) < 0 ? "outflow" : "inflow"} /></TableCell>
                        <TableCell className="py-3"><TreasuryStatusBadge status={fund.is_active ? "Active" : "Inactive"} /></TableCell>
                        <TableCell className="py-3 text-right" onClick={(event) => event.stopPropagation()}>
                          <TreasuryRowActions label={`Actions for ${fund.fund_name}`}>
                            <ToggleFundInlineAction churchSlug={churchSlug} fund={fund} />
                          </TreasuryRowActions>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              <TreasuryPagination label={`Showing 1-${filteredFunds.length} of ${filteredFunds.length} funds`} />
            </>
          )}
        </TreasuryPanel>

        <TreasuryPanel title="Fund Details" contentClassName="p-5">
          {!selected ? (
            <TreasuryEmptyState title="Select a fund" message="Choose a fund to inspect balances, activity, and status." />
          ) : (
            <div className="space-y-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">{selected.fund_name}</h3>
                  <p className="text-xs text-muted-foreground">{selected.fund_code || humanize(selected.fund_type)}</p>
                </div>
                <TreasuryStatusBadge status={selected.is_active ? "Active" : "Inactive"} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Available Balance</p>
                <p className="mt-1 text-3xl font-semibold tabular-nums text-primary"><TreasuryAmount value={selected.balance} direction={Number(selected.balance || 0) < 0 ? "outflow" : "inflow"} /></p>
              </div>
              <div className="grid grid-cols-2 rounded-xl border border-border">
                <Metric label="Money In" value={selected.inflows} />
                <Metric label="Money Out" value={selected.outflows} />
                <Metric label="Transfers In" value={selected.transfers_in} />
                <Metric label="Transfers Out" value={selected.transfers_out} />
              </div>
              <dl className="space-y-2 text-sm">
                <Info label="Fund Type" value={humanize(selected.fund_type)} />
                <Info label="Department" value={selected.department_name || "-"} />
                <Info label="Created" value={formatDateTime(selected.created_at)} />
                <Info label="Last Updated" value={formatDateTime(selected.updated_at)} />
                <Info label="Description" value={selected.description || "-"} />
              </dl>
              <Button type="button" variant="outline" className="h-10 w-full rounded-lg" onClick={onOpenTransactions}>
                <Eye className="mr-2 size-4" aria-hidden="true" />
                View Fund Transactions
              </Button>
            </div>
          )}
        </TreasuryPanel>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="border-b border-r border-border p-3 last:border-r-0">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-semibold tabular-nums text-foreground"><TreasuryAmount value={value} /></p>
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

function ToggleFundInlineAction({
  churchSlug,
  fund,
}: {
  churchSlug: string;
  fund: any;
}) {
  const [, action, isPending] = useActionState(toggleTreasuryFundAction, null);

  return (
    <form action={action} className="px-1 py-1">
      <input type="hidden" name="churchSlug" value={churchSlug} />
      <input type="hidden" name="fundId" value={fund.fund_id} />
      <input type="hidden" name="nextState" value={fund.is_active ? "false" : "true"} />
      <button
        type="submit"
        disabled={isPending}
        className="flex h-9 w-full items-center rounded-sm px-2 text-left text-sm hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Saving..." : fund.is_active ? "Deactivate Fund" : "Activate Fund"}
      </button>
    </form>
  );
}
