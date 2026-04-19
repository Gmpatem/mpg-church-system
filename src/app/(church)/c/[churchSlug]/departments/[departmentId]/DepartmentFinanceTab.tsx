import Link from "next/link";
import {
  WorkspaceEmptyState,
  WorkspaceSectionCard,
  WorkspaceStatCard,
} from "@/components/workspace";
import { reviewDepartmentFundRequestSubmitAction } from "@/features/department-finance/actions";
import { DepartmentFundRequestForm } from "@/features/department-finance/components/DepartmentFundRequestForm";
import type { DepartmentFinanceWorkspaceData } from "@/features/department-finance/types";
import { getLabel, inflowTypeLabels, outflowTypeLabels } from "@/lib/display-maps";

interface DepartmentFinanceTabProps {
  churchSlug: string;
  departmentId: string;
  data: DepartmentFinanceWorkspaceData;
  focusRequestId?: string | null;
}

function formatAmount(value: number) {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function requestStatusClass(status: string) {
  if (status === "pending") return "border-amber-200 bg-amber-50 text-amber-800";
  if (status === "approved") return "border-blue-200 bg-blue-50 text-blue-800";
  if (status === "processed") return "border-emerald-200 bg-emerald-50 text-emerald-800";
  if (status === "rejected") return "border-rose-200 bg-rose-50 text-rose-800";
  return "border-slate-200 bg-slate-50 text-slate-700";
}

function normalizeCategory(kind: "inflow" | "outflow", value: string) {
  if (kind === "inflow") return getLabel(inflowTypeLabels, value);
  return getLabel(outflowTypeLabels, value);
}

export function DepartmentFinanceTab({
  churchSlug,
  departmentId,
  data,
  focusRequestId = null,
}: DepartmentFinanceTabProps) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <WorkspaceStatCard label="Total Income" value={formatAmount(data.totals.totalIncome)} hint="Department-linked inflows" />
        <WorkspaceStatCard label="Total Expenses" value={formatAmount(data.totals.totalExpenses)} hint="Department-linked outflows" />
        <WorkspaceStatCard
          label="Balance"
          value={formatAmount(data.totals.balance)}
          valueClassName={data.totals.balance >= 0 ? "text-emerald-600" : "text-rose-600"}
          hint="Income minus expenses"
        />
        <WorkspaceStatCard label="Pending Requests" value={data.requestSummary.pending} hint="Awaiting treasury review" />
        <WorkspaceStatCard label="Processed Requests" value={data.requestSummary.processed} hint="Converted to outflows" />
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
                          {request.status}
                        </span>
                      </div>

                      <p className="text-sm text-slate-700">{request.purpose}</p>

                      <div className="grid gap-2 text-xs text-slate-600 sm:grid-cols-2">
                        <p><span className="font-medium text-slate-800">Amount:</span> {formatAmount(request.amount)}</p>
                        <p><span className="font-medium text-slate-800">Category:</span> {getLabel(outflowTypeLabels, request.outflow_type)}</p>
                        <p><span className="font-medium text-slate-800">Requested by:</span> {request.requested_by_label}</p>
                        <p><span className="font-medium text-slate-800">Requested date:</span> {request.requested_date}</p>
                        <p><span className="font-medium text-slate-800">Preferred fund:</span> {request.preferred_fund_label || "No preference"}</p>
                        <p><span className="font-medium text-slate-800">Payee:</span> {request.payee || "Not provided"}</p>
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
                            <button
                              type="submit"
                              name="decision"
                              value="approved"
                              className="inline-flex items-center rounded-md border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100"
                            >
                              Approve
                            </button>
                            <button
                              type="submit"
                              name="decision"
                              value="rejected"
                              className="inline-flex items-center rounded-md border border-rose-300 bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-100"
                            >
                              Reject
                            </button>
                          </div>
                        </form>
                      ) : null}

                      {canProcess ? (
                        <Link
                          href={`/c/${churchSlug}/treasury/out/new?requestId=${request.id}`}
                          className="inline-flex w-full items-center justify-center rounded-md bg-slate-950 px-3 py-2 text-xs font-medium text-white hover:bg-slate-800"
                        >
                          Process In Treasury Outflow
                        </Link>
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
