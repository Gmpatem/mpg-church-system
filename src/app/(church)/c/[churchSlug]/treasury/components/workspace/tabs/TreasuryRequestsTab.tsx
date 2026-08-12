"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  ClipboardCheck,
  Eye,
  FileClock,
  Hourglass,
  ReceiptText,
  Send,
  WalletCards,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  processDepartmentFundRequestIntoOutflowSubmitAction,
  reviewDepartmentFundRequestSubmitAction,
} from "@/features/department-finance/actions";
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
  TreasuryRowActions,
  TreasurySearchField,
  TreasuryStatusBadge,
  TreasurySummaryStrip,
  TreasuryToolbar,
} from "../shared";
import { formatDate, formatDateTime, formatTreasuryAmount, humanize } from "../utils";

type RequestView = "pending" | "approved" | "awaiting_processing" | "processed" | "rejected" | "all";

const requestViews: Array<{ key: RequestView; label: string }> = [
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "awaiting_processing", label: "Awaiting Processing" },
  { key: "processed", label: "Processed" },
  { key: "rejected", label: "Rejected" },
  { key: "all", label: "All" },
];

const EMPTY_DEPARTMENTS: any[] = [];
const EMPTY_FUNDS: any[] = [];
const EMPTY_REQUESTS: any[] = [];
const EMPTY_SUMMARY = {};

function getRequestedAt(row: any) {
  return row.requested_date || row.outflow_date_effective || row.created_at || row.updated_at || null;
}

function isAwaitingProcessing(row: any) {
  return row.status === "approved" && !row.processed_outflow_id;
}

function matchesView(row: any, view: RequestView) {
  if (view === "all") return true;
  if (view === "awaiting_processing") return isAwaitingProcessing(row);
  return row.status === view;
}

export function TreasuryRequestsTab({
  churchSlug,
  data,
  initialSearch,
  initialStatus,
}: {
  churchSlug: string;
  data: any;
  initialSearch?: string;
  initialStatus?: string;
}) {
  const requests = data.workspace?.requests?.rows ?? EMPTY_REQUESTS;
  const summary = data.workspace?.requests?.summary ?? EMPTY_SUMMARY;
  const initialView =
    initialStatus === "pending" ||
    initialStatus === "approved" ||
    initialStatus === "processed" ||
    initialStatus === "rejected"
      ? initialStatus
      : "pending";
  const [view, setView] = useState<RequestView>(initialView);
  const [search, setSearch] = useState(initialSearch ?? "");
  const [departmentId, setDepartmentId] = useState("");
  const [status, setStatus] = useState(
    initialStatus && !["pending", "approved", "processed", "rejected"].includes(initialStatus)
      ? initialStatus
      : ""
  );
  const [fundId, setFundId] = useState("");
  const [selectedId, setSelectedId] = useState(requests[0]?.id ?? "");

  const departments = data.formOptions?.departments ?? EMPTY_DEPARTMENTS;
  const funds = data.workspace?.funds ?? EMPTY_FUNDS;

  const filteredRequests = useMemo(() => {
    const q = search.trim().toLowerCase();
    return requests.filter((row: any) => {
      if (!matchesView(row, view)) return false;
      if (departmentId && row.department_id !== departmentId) return false;
      if (status && row.status !== status) return false;
      if (fundId && row.fund_id !== fundId && row.preferred_fund_id !== fundId) return false;
      if (!q) return true;
      return [
        row.title,
        row.purpose,
        row.department_name,
        row.requested_by_label,
        row.fund_label,
        row.reference_number,
        row.payee,
        row.project_name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [departmentId, fundId, requests, search, status, view]);

  const selected = filteredRequests.find((row: any) => row.id === selectedId) ?? filteredRequests[0] ?? null;
  const requestStats = useMemo(() => {
    const viewCounts: Record<RequestView, number> = {
      pending: 0,
      approved: 0,
      awaiting_processing: 0,
      processed: 0,
      rejected: 0,
      all: requests.length,
    };
    let totalRequested = 0;

    for (const row of requests) {
      totalRequested += Number(row.amount || 0);
      if (row.status in viewCounts) {
        viewCounts[row.status as RequestView] += 1;
      }
      if (isAwaitingProcessing(row)) {
        viewCounts.awaiting_processing += 1;
      }
    }

    return {
      totalRequested,
      awaitingProcessingCount: viewCounts.awaiting_processing,
      viewCounts,
    };
  }, [requests]);
  const departmentOptions = useMemo(
    () => departments.map((department: any) => ({ value: department.id, label: department.department_name })),
    [departments]
  );
  const fundOptions = useMemo(
    () => funds.map((fund: any) => ({ value: fund.fund_id, label: fund.fund_name })),
    [funds]
  );

  return (
    <div className="min-w-0 space-y-4">
      <TreasurySummaryStrip
        items={[
          { label: "Pending Review", value: summary.pending ?? 0, hint: "Needs Treasury decision", icon: <FileClock className="size-6" />, tone: "amber" },
          { label: "Approved", value: summary.approved ?? 0, hint: "Approved requests", icon: <CheckCircle2 className="size-6" />, tone: "green" },
          { label: "Awaiting Processing", value: requestStats.awaitingProcessingCount, hint: "Approved, not yet paid", icon: <Hourglass className="size-6" />, tone: "blue" },
          { label: "Total Requested", value: formatTreasuryAmount(requestStats.totalRequested), hint: "Across all requests", icon: <WalletCards className="size-6" />, tone: "purple" },
        ]}
      />

      <div className="rounded-xl border border-border bg-background shadow-sm">
        <div className="flex min-w-0 overflow-x-auto border-b border-border [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {requestViews.map((item) => {
            const count =
              item.key === "all"
                ? requests.length
                : item.key === "awaiting_processing"
                  ? requestStats.awaitingProcessingCount
                  : requestStats.viewCounts[item.key];
            const active = view === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setView(item.key)}
                className={`flex h-12 shrink-0 items-center gap-2 border-b-2 px-5 text-sm font-medium transition ${
                  active
                    ? "border-primary bg-emerald-50/60 text-primary"
                    : "border-transparent text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                }`}
              >
                {item.label}
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">{count}</span>
              </button>
            );
          })}
        </div>

        <TreasuryToolbar className="rounded-none border-0 border-b shadow-none">
          <TreasurySearchField value={search} onChange={setSearch} placeholder="Search fund requests..." />
          <TreasuryFilterSelect
            label="Department"
            value={departmentId}
            onValueChange={setDepartmentId}
            options={departmentOptions}
          />
          <TreasuryFilterSelect
            label="Status"
            value={status}
            onValueChange={setStatus}
            options={[
              { value: "pending", label: "Pending" },
              { value: "approved", label: "Approved" },
              { value: "processed", label: "Processed" },
              { value: "rejected", label: "Rejected" },
              { value: "cancelled", label: "Cancelled" },
            ]}
          />
          <TreasuryFilterSelect
            label="Requested Fund"
            value={fundId}
            onValueChange={setFundId}
            options={fundOptions}
            className="w-[180px]"
          />
        </TreasuryToolbar>

        <div className="grid min-w-0 gap-0 lg:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[minmax(0,1fr)_380px]">
          <div className="min-w-0 border-r border-border">
            <TreasuryPanel title="Request Queue" className="rounded-none border-0 shadow-none" contentClassName="p-0">
              {filteredRequests.length === 0 ? (
                <div className="p-5">
                  <TreasuryEmptyState title="No requests match the current filters." message="Adjust filters or return to All to review every department finance request." />
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/40">
                        <TableHead className="h-11">Request</TableHead>
                        <TableHead className="h-11">Department</TableHead>
                        <TableHead className="h-11">Requested By</TableHead>
                        <TableHead className="h-11 text-right">Amount</TableHead>
                        <TableHead className="h-11">Fund</TableHead>
                        <TableHead className="h-11">Requested Date</TableHead>
                        <TableHead className="h-11">Status</TableHead>
                        <TableHead className="h-11 text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRequests.map((row: any) => {
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
                            <TableCell className="py-3">
                              <p className="max-w-[260px] truncate text-sm font-semibold text-foreground">{row.title}</p>
                              <p className="max-w-[260px] truncate text-xs text-muted-foreground">{row.purpose}</p>
                            </TableCell>
                            <TableCell className="py-3 text-sm text-foreground">{row.department_name}</TableCell>
                            <TableCell className="py-3 text-sm text-foreground">{row.requested_by_label}</TableCell>
                            <TableCell className="py-3 text-right"><TreasuryAmount value={row.amount} /></TableCell>
                            <TableCell className="py-3">
                              <p className="text-sm font-medium text-foreground">{row.fund_label}</p>
                              <p className="text-xs text-muted-foreground">{row.fund_code || "-"}</p>
                            </TableCell>
                            <TableCell className="py-3 text-xs text-muted-foreground">{formatDate(getRequestedAt(row))}</TableCell>
                            <TableCell className="py-3"><TreasuryStatusBadge status={isAwaitingProcessing(row) ? "Awaiting Processing" : row.status} /></TableCell>
                            <TableCell className="py-3 text-right" onClick={(event) => event.stopPropagation()}>
                              <TreasuryRowActions label={`Actions for ${row.title}`}>
                                <Link href={`/c/${churchSlug}/departments/${row.department_id}?tab=finance&requestId=${row.id}`} className="flex h-9 items-center gap-2 rounded-sm px-2 text-sm hover:bg-accent">
                                  <Eye className="size-4" aria-hidden="true" />
                                  Open department
                                </Link>
                                {row.outflow_href ? (
                                  <Link href={row.outflow_href} className="flex h-9 items-center gap-2 rounded-sm px-2 text-sm hover:bg-accent">
                                    <ReceiptText className="size-4" aria-hidden="true" />
                                    Open outflow
                                  </Link>
                                ) : (
                                  <Link href={`/c/${churchSlug}/treasury/out/new?requestId=${row.id}`} className="flex h-9 items-center gap-2 rounded-sm px-2 text-sm hover:bg-accent">
                                    <ReceiptText className="size-4" aria-hidden="true" />
                                    Prefill expense
                                  </Link>
                                )}
                              </TreasuryRowActions>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                  <TreasuryPagination label={`Showing 1-${filteredRequests.length} of ${filteredRequests.length} requests`} />
                </>
              )}
            </TreasuryPanel>
          </div>

          <TreasuryPanel title="Request Details" className="rounded-none border-0 shadow-none" contentClassName="p-5">
            {!selected ? (
              <TreasuryEmptyState title="Select a request" message="Choose a request to review details, decision history, and available actions." />
            ) : (
              <div className="space-y-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap gap-2">
                      <TreasuryStatusBadge status="Fund Request" />
                      <TreasuryStatusBadge status={isAwaitingProcessing(selected) ? "Awaiting Processing" : selected.status} />
                    </div>
                    <h3 className="mt-3 text-lg font-semibold text-foreground">{selected.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{selected.department_name}</p>
                  </div>
                  <TreasuryAmount value={selected.amount} />
                </div>

                <div className="rounded-xl border border-border bg-muted/30 p-4">
                  <p className="text-xs font-medium uppercase text-muted-foreground">Purpose</p>
                  <p className="mt-2 text-sm leading-6 text-foreground">{selected.purpose || "-"}</p>
                </div>

                <dl className="grid gap-2 text-sm sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                  <Info label="Expense Category" value={humanize(selected.outflow_type)} />
                  <Info label="Requested Fund" value={selected.fund_label || "-"} />
                  <Info label="Requested Date" value={formatDate(getRequestedAt(selected))} />
                  <Info label="Requested By" value={selected.requested_by_label || "-"} />
                  <Info label="Payee" value={selected.payee || "-"} />
                  <Info label="Project Name" value={selected.project_name || "-"} />
                  <Info label="Reference Number" value={selected.reference_number || "-"} />
                  <Info label="Reviewed By" value={selected.reviewed_by_label || "-"} />
                  <Info label="Reviewed At" value={formatDateTime(selected.treasury_reviewed_at)} />
                  <Info label="Processed By" value={selected.processed_by_label || "-"} />
                </dl>

                <div className="rounded-xl border border-border bg-background p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <ClipboardCheck className="size-4 text-primary" aria-hidden="true" />
                    Decision History
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {selected.treasury_decision_note || "No Treasury decision note has been recorded."}
                  </p>
                </div>

                <div className="grid gap-2 sm:grid-cols-2">
                  {selected.status === "pending" || selected.status === "approved" ? (
                    <>
                      <form action={reviewDepartmentFundRequestSubmitAction}>
                        <input type="hidden" name="churchSlug" value={churchSlug} />
                        <input type="hidden" name="requestId" value={selected.id} />
                        <input type="hidden" name="decision" value="approved" />
                        <Button type="submit" className="h-10 w-full gap-2 rounded-lg">
                          <CheckCircle2 className="size-4" aria-hidden="true" />
                          Approve
                        </Button>
                      </form>
                      <form action={reviewDepartmentFundRequestSubmitAction}>
                        <input type="hidden" name="churchSlug" value={churchSlug} />
                        <input type="hidden" name="requestId" value={selected.id} />
                        <input type="hidden" name="decision" value="rejected" />
                        <Button type="submit" variant="outline" className="h-10 w-full gap-2 rounded-lg border-red-200 text-red-700 hover:bg-red-50">
                          <XCircle className="size-4" aria-hidden="true" />
                          Reject
                        </Button>
                      </form>
                    </>
                  ) : null}
                  {selected.status === "pending" || selected.status === "approved" ? (
                    <form action={processDepartmentFundRequestIntoOutflowSubmitAction} className="sm:col-span-2">
                      <input type="hidden" name="churchSlug" value={churchSlug} />
                      <input type="hidden" name="requestId" value={selected.id} />
                      <Button type="submit" variant="outline" className="h-10 w-full gap-2 rounded-lg">
                        <Send className="size-4" aria-hidden="true" />
                        Process Into Money Out
                      </Button>
                    </form>
                  ) : null}
                  <Button asChild variant="outline" className="h-10 rounded-lg sm:col-span-2">
                    <Link href={`/c/${churchSlug}/treasury/out/new?requestId=${selected.id}`}>
                      <ReceiptText className="mr-2 size-4" aria-hidden="true" />
                      Open Prefilled Expense
                    </Link>
                  </Button>
                </div>
              </div>
            )}
          </TreasuryPanel>
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-lg border border-border bg-background px-3 py-2">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="min-w-0 text-right font-medium text-foreground">{value}</dd>
    </div>
  );
}
