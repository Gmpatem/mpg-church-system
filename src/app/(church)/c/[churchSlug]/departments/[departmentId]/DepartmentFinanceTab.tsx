"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import type { ComponentPropsWithoutRef, MouseEvent } from "react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import {
  WorkspaceEmptyState,
  WorkspaceSectionCard,
} from "@/components/workspace";
import {
  processDepartmentFundRequestIntoOutflowSubmitAction,
  reviewDepartmentFundRequestSubmitAction,
} from "@/features/department-finance/actions";
import { DepartmentFundRequestForm } from "@/features/department-finance/components/DepartmentFundRequestForm";
import type { DepartmentFinanceWorkspaceData } from "@/features/department-finance/types";
import { getLabel, inflowTypeLabels, outflowTypeLabels } from "@/lib/display-maps";
import { formatAmount } from "@/lib/utils/format";

interface DepartmentFinanceTabProps {
  churchSlug: string;
  departmentId: string;
  data: DepartmentFinanceWorkspaceData;
  focusRequestId?: string | null;
  eventOptions?: Array<{
    id: string;
    title: string;
    start: string;
  }>;
}

function requestStatusClass(status: string) {
  if (status === "pending") return "border-amber-200 bg-amber-50 text-amber-800";
  if (status === "approved") return "border-blue-200 bg-blue-50 text-blue-800";
  if (status === "processed") return "border-emerald-200 bg-emerald-50 text-emerald-800";
  if (status === "rejected") return "border-rose-200 bg-rose-50 text-rose-800";
  return "border-slate-200 bg-slate-50 text-slate-700";
}

const STATUS_LABELS = {
  pending: "Pending Review",
  approved: "Approved",
  processed: "Processed",
  rejected: "Rejected",
};

function normalizeCategory(kind: "inflow" | "outflow", value: string) {
  if (kind === "inflow") return getLabel(inflowTypeLabels, value);
  return getLabel(outflowTypeLabels, value);
}

interface ConfirmSubmitButtonProps extends Omit<ComponentPropsWithoutRef<"button">, "type" | "onClick"> {
  confirmTitle: string;
  confirmVariant?: "default" | "danger";
}

function ConfirmSubmitButton({
  confirmTitle,
  confirmVariant = "default",
  ...buttonProps
}: ConfirmSubmitButtonProps) {
  const [open, setOpen] = useState(false);
  const submitButtonRef = useRef<HTMLButtonElement>(null);

  function handleClick(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    setOpen(true);
  }

  function handleConfirm() {
    setOpen(false);
    const submitButton = submitButtonRef.current;
    if (!submitButton?.form) return;
    submitButton.form.requestSubmit(submitButton);
  }

  return (
    <>
      <button
        {...buttonProps}
        ref={submitButtonRef}
        type="submit"
        onClick={handleClick}
      />
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={confirmTitle}
        onConfirm={handleConfirm}
        variant={confirmVariant}
      />
    </>
  );
}

export function DepartmentFinanceTab({
  churchSlug,
  departmentId,
  data,
  focusRequestId = null,
  eventOptions = [],
}: DepartmentFinanceTabProps) {
  return (
    <div className="space-y-5">
      {/* Compact finance summary strip */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-slate-500">Balance</span>
          <span className={`font-semibold ${data.totals.balance >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
            {formatAmount(data.totals.balance)}
          </span>
        </div>
        <div className="hidden h-4 w-px bg-slate-200 sm:block" />
        <div className="flex items-center gap-2">
          <span className="text-slate-500">Income</span>
          <span className="font-semibold text-slate-900">{formatAmount(data.totals.totalIncome)}</span>
        </div>
        <div className="hidden h-4 w-px bg-slate-200 sm:block" />
        <div className="flex items-center gap-2">
          <span className="text-slate-500">Expenses</span>
          <span className="font-semibold text-slate-900">{formatAmount(data.totals.totalExpenses)}</span>
        </div>
        <div className="hidden h-4 w-px bg-slate-200 sm:block" />
        <div className="flex items-center gap-2">
          <span className="text-slate-500">Pending</span>
          <span className="font-semibold text-slate-900">{data.requestSummary.pending}</span>
        </div>
        <div className="hidden h-4 w-px bg-slate-200 sm:block" />
        <div className="flex items-center gap-2">
          <span className="text-slate-500">Processed</span>
          <span className="font-semibold text-slate-900">{data.requestSummary.processed}</span>
        </div>
      </div>

      {/* Action placeholders */}
      <div className="flex flex-wrap gap-2">
        <Link
          href={`/c/${churchSlug}/treasury/in/new?departmentId=${departmentId}`}
          className="inline-flex items-center rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          Record Contribution
        </Link>
        <Link
          href={`/c/${churchSlug}/treasury`}
          className="inline-flex items-center rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          View Ledger
        </Link>
      </div>

      {data.permissions.canSubmitRequests ? (
        <WorkspaceSectionCard
          title="Request Funds"
          description="Submit a treasury fund request from this department using outflow-compatible fields."
        >
          <DepartmentFundRequestForm
            churchSlug={churchSlug}
            departmentId={departmentId}
            funds={data.financeOptions.funds}
            events={eventOptions}
          />
        </WorkspaceSectionCard>
      ) : (
        <WorkspaceSectionCard
          title="Request Funds"
          description="Only active department leaders can submit department finance requests."
        >
          <p className="text-sm text-slate-600">
            You can still review department finance history and request outcomes in this tab.
          </p>
        </WorkspaceSectionCard>
      )}

      <WorkspaceSectionCard
        title="Recent Transactions"
        description="Real inflow and outflow activity for this department from treasury records."
        contentClassName="p-0"
      >
        {data.transactions.length === 0 ? (
          <div className="p-5">
            <WorkspaceEmptyState
              title="No finance transactions yet"
              message="Department-linked inflows and outflows will appear here automatically."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Category</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Reference</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Context</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {data.transactions.map((row) => (
                  <tr key={row.id}>
                    <td className="px-4 py-3.5">
                      <span
                        className={
                          row.kind === "inflow"
                            ? "rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800"
                            : "rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-800"
                        }
                      >
                        {row.kind === "inflow" ? "Income" : "Expense"}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-sm text-slate-700">
                      {normalizeCategory(row.kind, row.category)}
                    </td>
                    <td className="px-4 py-3.5 text-sm text-slate-600">{row.date || "-"}</td>
                    <td className="px-4 py-3.5 text-sm text-slate-600">{row.referenceNumber || "-"}</td>
                    <td className="px-4 py-3.5 text-sm text-slate-600">
                      {row.memberName || row.payee || row.note || "-"}
                    </td>
                    <td className="px-4 py-3.5 text-right text-sm font-semibold text-slate-900">
                      {formatAmount(row.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </WorkspaceSectionCard>

      <WorkspaceSectionCard
        title="Finance Requests"
        description="Pending, approved, rejected, and processed treasury requests for this department."
        contentClassName="p-0"
      >
        {data.requests.length === 0 ? (
          <div className="p-5">
            <WorkspaceEmptyState
              title="No department requests yet"
              message="Submitted requests will appear here with treasury decisions and processing links."
            />
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {data.requests.map((request) => {
              const highlighted = focusRequestId && request.id === focusRequestId;
              const canReview =
                data.permissions.canReviewRequests &&
                (request.status === "pending" || request.status === "approved");
              const canProcess =
                data.permissions.canProcessRequests &&
                (request.status === "approved" || request.status === "pending");

              return (
                <div
                  key={request.id}
                  className={`p-4 ${highlighted ? "bg-blue-50/60" : "bg-white"}`}
                >
                  <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-slate-900">{request.title}</p>
                        <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${requestStatusClass(request.status)}`}>
                          {STATUS_LABELS[request.status as keyof typeof STATUS_LABELS] || request.status}
                        </span>
                      </div>

                      <p className="text-sm text-slate-700">{request.purpose}</p>

                      <div className="grid gap-2 text-xs text-slate-600 sm:grid-cols-2">
                        <p><span className="font-medium text-slate-800">Amount:</span> {formatAmount(request.amount)}</p>
                        <p><span className="font-medium text-slate-800">Category:</span> {getLabel(outflowTypeLabels, request.outflow_type)}</p>
                        <p><span className="font-medium text-slate-800">Requested by:</span> {request.requested_by_label}</p>
                        <p><span className="font-medium text-slate-800">Outflow date:</span> {request.outflow_date || request.requested_date}</p>
                        <p><span className="font-medium text-slate-800">Fund:</span> {request.preferred_fund_label || "Not selected"}</p>
                        <p><span className="font-medium text-slate-800">Payee:</span> {request.payee || "Not provided"}</p>
                        <p><span className="font-medium text-slate-800">Reference:</span> {request.reference_number || "Not provided"}</p>
                      </div>

                      {request.note ? (
                        <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
                          {request.note}
                        </div>
                      ) : null}

                      {request.treasury_decision_note ? (
                        <div className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-800">
                          <span className="font-medium">Treasury note:</span> {request.treasury_decision_note}
                        </div>
                      ) : null}
                    </div>

                    <div className="w-full max-w-sm space-y-2">
                      {canReview ? (
                        <form action={reviewDepartmentFundRequestSubmitAction} className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
                          <input type="hidden" name="churchSlug" value={churchSlug} />
                          <input type="hidden" name="requestId" value={request.id} />
                          <textarea
                            name="decisionNote"
                            rows={2}
                            placeholder="Optional treasury decision note"
                            className="w-full rounded-md border border-slate-300 px-2.5 py-2 text-xs outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <div className="flex flex-wrap gap-2">
                            <ConfirmSubmitButton
                              name="decision"
                              value="approved"
                              confirmTitle="Approve this fund request? The department will be notified."
                              className="inline-flex items-center rounded-md border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100"
                            >
                              Approve
                            </ConfirmSubmitButton>
                            <ConfirmSubmitButton
                              name="decision"
                              value="rejected"
                              confirmTitle="Reject this request? This cannot be undone. The department will need to resubmit."
                              confirmVariant="danger"
                              className="inline-flex items-center rounded-md border border-rose-300 bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-100"
                            >
                              Reject
                            </ConfirmSubmitButton>
                          </div>
                        </form>
                      ) : null}

                      {canProcess ? (
                        <div className="space-y-2">
                          <form action={processDepartmentFundRequestIntoOutflowSubmitAction}>
                            <input type="hidden" name="churchSlug" value={churchSlug} />
                            <input type="hidden" name="requestId" value={request.id} />
                            <ConfirmSubmitButton
                              confirmTitle="This will create a treasury expense record. Continue?"
                              className="inline-flex w-full items-center justify-center rounded-md bg-slate-950 px-3 py-2 text-xs font-medium text-white hover:bg-slate-800"
                            >
                              Record as Expense
                            </ConfirmSubmitButton>
                          </form>
                          <Link
                            href={`/c/${churchSlug}/treasury/out/new?requestId=${request.id}`}
                            className="inline-flex w-full items-center justify-center rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                          >
                            Review & Record Expense
                          </Link>
                        </div>
                      ) : null}

                      {request.status === "processed" && request.processed_outflow_id ? (
                        <Link
                          href={`/c/${churchSlug}/treasury/out/${request.processed_outflow_id}/edit`}
                          className="inline-flex w-full items-center justify-center rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                        >
                          View Processed Outflow
                        </Link>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </WorkspaceSectionCard>
    </div>
  );
}
