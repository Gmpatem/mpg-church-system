"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowDown, ArrowUp, Eye, Pencil, Plus, ReceiptText, Scale, SearchCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { TreasuryDialog } from "../types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TreasuryAmount, TreasuryEmptyState, TreasuryFilterSelect, TreasuryPagination, TreasuryPanel, TreasuryRowActions, TreasurySearchField, TreasuryStatusBadge, TreasurySummaryStrip, TreasuryToolbar } from "../shared";
import { formatDate, formatDateTime, formatTreasuryAmount, humanize } from "../utils";

export function TreasuryTransactionsTab({
  data,
  rows,
  periodMetrics,
  onOpenDialog,
}: {
  data: any;
  rows: any[];
  periodMetrics: any;
  onOpenDialog: (dialog: TreasuryDialog) => void;
}) {
  const [search, setSearch] = useState("");
  const [direction, setDirection] = useState("");
  const [fundId, setFundId] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [selectedId, setSelectedId] = useState(rows[0]?.id ?? "");

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((row) => {
      if (direction && row.direction !== direction) return false;
      if (fundId && row.fund_id !== fundId) return false;
      if (departmentId && row.department_id !== departmentId) return false;
      if (!q) return true;
      return [
        row.source_label,
        row.fund_name,
        row.department_name,
        row.reference_number,
        row.note,
        row.transaction_type,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [departmentId, direction, fundId, rows, search]);

  const selected = filteredRows.find((row) => row.id === selectedId) ?? filteredRows[0] ?? null;
  const funds = data.workspace?.funds ?? [];
  const departments = data.formOptions?.departments ?? [];

  return (
    <div className="min-w-0 space-y-4">
      <TreasurySummaryStrip
        items={[
          { label: "Money In", value: formatTreasuryAmount(periodMetrics.moneyIn), hint: `${periodMetrics.inflows} entries`, icon: <ArrowDown className="size-6" />, tone: "green" },
          { label: "Money Out", value: formatTreasuryAmount(periodMetrics.moneyOut), hint: `${periodMetrics.outflows} expenses`, icon: <ArrowUp className="size-6" />, tone: "red" },
          { label: "Net Movement", value: formatTreasuryAmount(periodMetrics.net), hint: "Income minus expenses", icon: <Scale className="size-6" />, tone: periodMetrics.net >= 0 ? "green" : "red" },
          { label: "Transactions", value: periodMetrics.transactions, hint: "Total recorded", icon: <ReceiptText className="size-6" />, tone: "blue" },
        ]}
      />

      <TreasuryToolbar>
        <TreasurySearchField value={search} onChange={setSearch} placeholder="Search transactions..." />
        <TreasuryFilterSelect label="Direction" value={direction} onValueChange={setDirection} options={[{ value: "inflow", label: "Money In" }, { value: "outflow", label: "Money Out" }]} />
        <TreasuryFilterSelect label="Fund" value={fundId} onValueChange={setFundId} options={funds.map((fund: any) => ({ value: fund.fund_id, label: fund.fund_name }))} />
        <TreasuryFilterSelect label="Department" value={departmentId} onValueChange={setDepartmentId} options={departments.map((department: any) => ({ value: department.id, label: department.department_name }))} />
        <Button type="button" onClick={() => onOpenDialog({ type: "money-in" })} className="ml-auto h-10 gap-2 rounded-lg">
          <Plus className="size-4" aria-hidden="true" />
          Record Transaction
        </Button>
      </TreasuryToolbar>

      <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[minmax(0,1fr)_360px]">
        <TreasuryPanel title="Transaction Ledger" contentClassName="p-0">
          {filteredRows.length === 0 ? (
            <div className="p-5">
              <TreasuryEmptyState title="No transactions match the current filters." message="Adjust the search or filters to review Treasury activity." />
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead className="h-11">Date</TableHead>
                    <TableHead className="h-11">Transaction</TableHead>
                    <TableHead className="h-11">Source / Payee</TableHead>
                    <TableHead className="h-11">Fund</TableHead>
                    <TableHead className="h-11">Reference</TableHead>
                    <TableHead className="h-11 text-right">Amount</TableHead>
                    <TableHead className="h-11 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRows.map((row) => {
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
                        <TableCell className="py-3 text-xs text-muted-foreground">{formatDate(row.date)}</TableCell>
                        <TableCell className="py-3">
                          <div className="flex items-center gap-2">
                            <span className={row.direction === "inflow" ? "rounded-full bg-emerald-50 p-1.5 text-primary" : "rounded-full bg-red-50 p-1.5 text-red-600"}>
                              {row.direction === "inflow" ? <ArrowDown className="size-4" /> : <ArrowUp className="size-4" />}
                            </span>
                            <div>
                              <p className="text-sm font-semibold text-foreground">{humanize(row.transaction_type)}</p>
                              <p className="text-xs text-muted-foreground">{row.direction === "inflow" ? "Income" : "Expense"}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-3 text-sm text-foreground">{row.source_label}</TableCell>
                        <TableCell className="py-3">
                          <p className="text-sm font-medium text-foreground">{row.fund_name}</p>
                          <p className="text-xs text-muted-foreground">{row.department_name || row.fund_code || "-"}</p>
                        </TableCell>
                        <TableCell className="py-3 text-xs text-muted-foreground">{row.reference_number || "-"}</TableCell>
                        <TableCell className="py-3 text-right"><TreasuryAmount value={row.amount} direction={row.direction} /></TableCell>
                        <TableCell className="py-3 text-right" onClick={(event) => event.stopPropagation()}>
                          <TreasuryRowActions label={`Actions for ${row.source_label}`}>
                            <DropdownLink href={row.href} icon={<Eye className="size-4" />}>Open record</DropdownLink>
                            <DropdownLink href={row.href} icon={<Pencil className="size-4" />}>Edit transaction</DropdownLink>
                          </TreasuryRowActions>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              <TreasuryPagination label={`Showing 1-${filteredRows.length} of ${filteredRows.length} transactions`} />
            </>
          )}
        </TreasuryPanel>

        <TreasuryPanel title="Transaction Details" contentClassName="p-5">
          {!selected ? (
            <TreasuryEmptyState title="Select a transaction" message="Choose a ledger row to inspect source, fund, reference, and audit links." />
          ) : (
            <div className="space-y-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm text-muted-foreground">{selected.direction === "inflow" ? "Money In" : "Money Out"}</p>
                  <h3 className="mt-1 truncate text-lg font-semibold text-foreground">{selected.source_label}</h3>
                </div>
                <TreasuryStatusBadge status={selected.direction === "inflow" ? "Income" : "Expense"} />
              </div>
              <p className="text-3xl font-semibold tabular-nums text-primary"><TreasuryAmount value={selected.amount} direction={selected.direction} /></p>
              <dl className="space-y-2 text-sm">
                <Info label="Type" value={humanize(selected.transaction_type)} />
                <Info label="Date" value={formatDateTime(selected.date)} />
                <Info label="Fund" value={selected.fund_name} />
                <Info label="Department" value={selected.department_name || "-"} />
                <Info label="Reference" value={selected.reference_number || "-"} />
                <Info label="Recorded By" value={selected.recorded_by_label || "-"} />
                <Info label="Notes" value={selected.note || "-"} />
              </dl>
              <Button asChild variant="outline" className="h-10 w-full rounded-lg">
                <Link href={selected.href}>
                  <SearchCheck className="mr-2 size-4" aria-hidden="true" />
                  Open Treasury Record
                </Link>
              </Button>
            </div>
          )}
        </TreasuryPanel>
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

function DropdownLink({ href, children, icon }: { href: string; children: ReactNode; icon?: ReactNode }) {
  return (
    <Link href={href} className="flex h-9 items-center gap-2 rounded-sm px-2 text-sm hover:bg-accent">
      {icon}
      {children}
    </Link>
  );
}
