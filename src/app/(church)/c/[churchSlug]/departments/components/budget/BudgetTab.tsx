"use client";

import { ArrowDownCircle, ArrowUpCircle, FileText, WalletCards } from "lucide-react";
import {
  ChurchContentGrid,
  ChurchMainPanel,
  ChurchRightRail,
} from "@/components/church-workspace";
import { Button } from "@/components/ui/button";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils/cn";
import type { DepartmentFinanceWorkspaceData } from "@/features/department-finance/types";
import type {
  BudgetState,
  DepartmentDialog,
  DepartmentWorkspaceBundle,
} from "../types";
import {
  EmptyState,
  NativeSelect,
  QuietBadge,
  RegistryPagination,
  RowActions,
  SearchField,
  StatusPill,
  formatCurrency,
  formatDate,
  formatDateTime,
  formatNumber,
  includesNeedle,
  normalizeStatusLabel,
  pageSize,
  paginate,
} from "../shared";

type FinanceRequest = DepartmentFinanceWorkspaceData["requests"][number];
type FinanceTransaction = DepartmentFinanceWorkspaceData["transactions"][number];

type BudgetEntry =
  | {
      id: string;
      kind: "fund_request";
      title: string;
      amount: number;
      date: string | null;
      status: string;
      request: FinanceRequest;
      transaction: null;
    }
  | {
      id: string;
      kind: "inflow" | "outflow";
      title: string;
      amount: number;
      date: string | null;
      status: string;
      request: null;
      transaction: FinanceTransaction;
    };

export function buildBudgetEntries(budget: DepartmentFinanceWorkspaceData): BudgetEntry[] {
  return [
    ...budget.requests.map((request) => ({
      id: `request-${request.id}`,
      kind: "fund_request" as const,
      title: request.title,
      amount: request.amount,
      date: request.outflow_date || request.requested_date || request.created_at,
      status: request.status,
      request,
      transaction: null,
    })),
    ...budget.transactions.map((transaction) => ({
      id: transaction.id,
      kind: transaction.kind,
      title: normalizeStatusLabel(transaction.category),
      amount: transaction.amount,
      date: transaction.date,
      status: transaction.kind,
      request: null,
      transaction,
    })),
  ].sort((a, b) => {
    const aTime = a.date ? new Date(a.date).getTime() : 0;
    const bTime = b.date ? new Date(b.date).getTime() : 0;
    return bTime - aTime;
  });
}

function filterEntries(rows: BudgetEntry[], state: BudgetState) {
  return rows.filter((entry) => {
    if (state.kind && entry.kind !== state.kind) return false;
    if (state.status && (entry.kind !== "fund_request" || entry.status !== state.status)) return false;

    return includesNeedle(
      [
        entry.title,
        entry.status,
        entry.kind,
        entry.request?.purpose,
        entry.request?.payee,
        entry.request?.requested_by_label,
        entry.transaction?.referenceNumber,
        entry.transaction?.note,
        entry.transaction?.memberName,
        entry.transaction?.payee,
      ],
      state.search
    );
  });
}

function BudgetIcon({ kind }: { kind: BudgetEntry["kind"] }) {
  const Icon =
    kind === "inflow" ? ArrowUpCircle : kind === "outflow" ? ArrowDownCircle : FileText;

  return (
    <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
      <Icon className="size-4" aria-hidden="true" />
    </span>
  );
}

function SummaryCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <section className="rounded-xl border border-border bg-background p-5 shadow-sm">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold leading-none text-foreground">{value}</p>
      <p className="mt-2 text-xs text-muted-foreground">{hint}</p>
    </section>
  );
}

function BudgetInspector({
  selectedEntry,
}: {
  selectedEntry: BudgetEntry | null;
}) {
  return (
    <ChurchRightRail className="self-start">
      <div className="border-b border-border px-5 py-4">
        <h2 className="text-base font-semibold text-foreground">Budget Details</h2>
        <p className="mt-1 text-sm text-muted-foreground">Selected finance record.</p>
      </div>

      {selectedEntry ? (
        <div className="flex flex-col gap-5 p-5">
          <div className="flex min-w-0 items-start gap-3">
            <BudgetIcon kind={selectedEntry.kind} />
            <div className="min-w-0 flex-1">
              <h3 className="text-base font-semibold text-foreground">{selectedEntry.title}</h3>
              <div className="mt-2 flex flex-wrap gap-2">
                <StatusPill
                  status={selectedEntry.status}
                  label={normalizeStatusLabel(selectedEntry.status)}
                />
                <QuietBadge>{selectedEntry.kind.replace("_", " ")}</QuietBadge>
              </div>
            </div>
          </div>

          <dl className="grid gap-3 text-sm">
            {selectedEntry.request
              ? [
                  ["Amount", formatCurrency(selectedEntry.request.amount)],
                  ["Purpose", selectedEntry.request.purpose],
                  ["Requested by", selectedEntry.request.requested_by_label],
                  ["Fund", selectedEntry.request.preferred_fund_label || "-"],
                  ["Payee", selectedEntry.request.payee || "-"],
                  ["Outflow date", formatDate(selectedEntry.request.outflow_date || selectedEntry.request.requested_date)],
                  ["Treasury note", selectedEntry.request.treasury_decision_note || "-"],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="rounded-lg border border-border bg-muted/30 px-3 py-2.5"
                  >
                    <dt className="text-muted-foreground">{label}</dt>
                    <dd className="mt-1 font-semibold text-foreground">{value}</dd>
                  </div>
                ))
              : [
                  ["Amount", formatCurrency(selectedEntry.transaction?.amount)],
                  ["Date", formatDate(selectedEntry.transaction?.date)],
                  ["Category", normalizeStatusLabel(selectedEntry.transaction?.category)],
                  ["Reference", selectedEntry.transaction?.referenceNumber || "-"],
                  ["Context", selectedEntry.transaction?.memberName || selectedEntry.transaction?.payee || "-"],
                  ["Note", selectedEntry.transaction?.note || "-"],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="rounded-lg border border-border bg-muted/30 px-3 py-2.5"
                  >
                    <dt className="text-muted-foreground">{label}</dt>
                    <dd className="mt-1 font-semibold text-foreground">{value}</dd>
                  </div>
                ))}
          </dl>
        </div>
      ) : (
        <div className="p-5">
          <EmptyState
            title="No budget entry selected"
            message="Choose a transaction or fund request from the register."
          />
        </div>
      )}
    </ChurchRightRail>
  );
}

export function BudgetTab({
  bundle,
  state,
  selectedEntry,
  onStateChange,
  onSelectEntry,
  onDialogChange,
}: {
  bundle: DepartmentWorkspaceBundle | null;
  state: BudgetState;
  selectedEntry: BudgetEntry | null;
  onStateChange: (next: Partial<BudgetState>) => void;
  onSelectEntry: (entryId: string | null) => void;
  onDialogChange: (dialog: DepartmentDialog) => void;
}) {
  if (!bundle) {
    return (
      <EmptyState
        title="No department selected"
        message="Select a department from the overview registry to review its budget."
      />
    );
  }

  if (!bundle.budget) {
    return (
      <EmptyState
        title="Budget unavailable"
        message="Treasury-linked finance data is unavailable for this department."
      />
    );
  }

  const budget = bundle.budget;
  const entries = buildBudgetEntries(budget);
  const filteredRows = filterEntries(entries, state);
  const pageCount = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const rows = paginate(filteredRows, state.page);
  const statusOptions = Array.from(new Set(budget.requests.map((request) => request.status)))
    .sort()
    .map((status) => ({ value: status, label: normalizeStatusLabel(status) }));

  return (
    <div className="flex min-w-0 flex-col gap-5">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Balance"
          value={formatCurrency(budget.totals.balance)}
          hint="Income minus expenses"
        />
        <SummaryCard
          label="Income"
          value={formatCurrency(budget.totals.totalIncome)}
          hint={`${formatNumber(budget.transactions.filter((row) => row.kind === "inflow").length)} inflows`}
        />
        <SummaryCard
          label="Expenses"
          value={formatCurrency(budget.totals.totalExpenses)}
          hint={`${formatNumber(budget.transactions.filter((row) => row.kind === "outflow").length)} outflows`}
        />
        <SummaryCard
          label="Pending Requests"
          value={formatNumber(budget.requestSummary.pending)}
          hint={`${formatNumber(budget.requests.length)} total requests`}
        />
      </div>

      <ChurchContentGrid className="lg:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[minmax(0,1fr)_340px]">
        <ChurchMainPanel className="min-w-0">
          <div className="flex flex-col gap-3 border-b border-border px-5 py-4 2xl:flex-row 2xl:items-center 2xl:justify-between">
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-foreground">Budget Register</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Treasury transactions and fund requests for {bundle.department.name}.
              </p>
            </div>
            <div className="grid min-w-0 gap-2 sm:grid-cols-[minmax(220px,320px)_150px_170px]">
              <SearchField
                id="department-budget-search"
                value={state.search}
                onChange={(search) => onStateChange({ search })}
                placeholder="Search budget records..."
              />
              <NativeSelect
                label="Budget record type"
                value={state.kind}
                onChange={(kind) => onStateChange({ kind })}
                allLabel="All types"
                options={[
                  { value: "fund_request", label: "Fund Requests" },
                  { value: "inflow", label: "Inflows" },
                  { value: "outflow", label: "Outflows" },
                ]}
              />
              <NativeSelect
                label="Fund request status"
                value={state.status}
                onChange={(status) => onStateChange({ status })}
                allLabel="All request statuses"
                options={statusOptions}
              />
            </div>
          </div>

          {filteredRows.length === 0 ? (
            <div className="p-5">
              <EmptyState
                title="No budget records found"
                message="No treasury transactions or department fund requests match the current filters."
                action={
                  budget.permissions.canSubmitRequests ? (
                    <Button
                      type="button"
                      className="rounded-lg"
                      onClick={() => onDialogChange({ type: "request-funds", departmentId: bundle.department.id })}
                    >
                      <WalletCards data-icon="inline-start" aria-hidden="true" />
                      Request Funds
                    </Button>
                  ) : null
                }
              />
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table className="min-w-[920px]">
                  <TableHeader>
                    <TableRow className="bg-muted/40">
                      <TableHead>Record</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Context</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((entry) => {
                      const selected = selectedEntry?.id === entry.id;

                      return (
                        <TableRow
                          key={entry.id}
                          data-state={selected ? "selected" : undefined}
                          className={cn("cursor-pointer", selected && "bg-primary/5 hover:bg-primary/10")}
                          onClick={() => onSelectEntry(entry.id)}
                        >
                          <TableCell className="min-w-[280px] py-3">
                            <div className="flex min-w-0 items-center gap-3">
                              <BudgetIcon kind={entry.kind} />
                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-foreground">{entry.title}</p>
                                <p className="truncate text-xs text-muted-foreground">
                                  {entry.request?.purpose || entry.transaction?.note || entry.transaction?.referenceNumber || "No context"}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <QuietBadge>{entry.kind.replace("_", " ")}</QuietBadge>
                          </TableCell>
                          <TableCell>
                            <StatusPill status={entry.status} label={normalizeStatusLabel(entry.status)} />
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatDateTime(entry.date)}
                          </TableCell>
                          <TableCell className="max-w-[220px] text-sm text-muted-foreground">
                            <p className="truncate">
                              {entry.request?.requested_by_label ||
                                entry.transaction?.memberName ||
                                entry.transaction?.payee ||
                                "-"}
                            </p>
                          </TableCell>
                          <TableCell className="text-right text-sm font-semibold text-foreground">
                            {formatCurrency(entry.amount)}
                          </TableCell>
                          <TableCell className="text-right" onClick={(event) => event.stopPropagation()}>
                            <RowActions label={`Open actions for ${entry.title}`}>
                              <DropdownMenuItem onSelect={() => onSelectEntry(entry.id)}>
                                Inspect record
                              </DropdownMenuItem>
                            </RowActions>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              <RegistryPagination
                label={`Showing ${rows.length} of ${filteredRows.length} budget records`}
                page={state.page}
                pageCount={pageCount}
                onPageChange={(page) => onStateChange({ page })}
              />
            </>
          )}
        </ChurchMainPanel>

        <BudgetInspector selectedEntry={selectedEntry} />
      </ChurchContentGrid>
    </div>
  );
}

export type { BudgetEntry };
