import Link from "next/link";
import { redirect } from "next/navigation";
import { WorkspaceHero } from "@/components/workspace";
import { getLabel, outflowTypeLabels } from "@/lib/display-maps";
import { getTreasuryDepartmentFundRequestsWorkspaceData } from "@/features/department-finance/queries";
import {
  processDepartmentFundRequestIntoOutflowSubmitAction,
  reviewDepartmentFundRequestSubmitAction,
} from "@/features/department-finance/actions";

interface TreasuryApprovalsPageProps {
  params: Promise<{ churchSlug: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

function pickSingle(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value ?? "";
}

function appendSearchParam(
  params: URLSearchParams,
  key: string,
  value: string | string[] | undefined
) {
  if (Array.isArray(value)) {
    for (const item of value) {
      if (item) params.append(key, item);
    }
    return;
  }
  if (value) params.set(key, value);
}

function statusClass(status: string) {
  if (status === "pending") return "border-amber-200 bg-amber-50 text-amber-800";
  if (status === "approved") return "border-blue-200 bg-blue-50 text-blue-800";
  if (status === "processed") return "border-emerald-200 bg-emerald-50 text-emerald-800";
  if (status === "rejected") return "border-rose-200 bg-rose-50 text-rose-800";
  return "border-slate-200 bg-slate-50 text-slate-700";
}

export default async function TreasuryApprovalsPage({
  params,
  searchParams,
}: TreasuryApprovalsPageProps) {
  const { churchSlug } = await params;
  const filters = (await searchParams) ?? {};
  const next = new URLSearchParams();
  next.set("tab", "requests");
  for (const [key, value] of Object.entries(filters)) {
    if (key === "tab") continue;
    appendSearchParam(next, key, value);
  }
  redirect(`/c/${churchSlug}/treasury?${next.toString()}`);

  const status = pickSingle(filters.status);
  const q = pickSingle(filters.q);

  const data = await getTreasuryDepartmentFundRequestsWorkspaceData(churchSlug, {
    status,
    q,
  });

  return (
    <div className="space-y-6">
      <WorkspaceHero
        title="Treasury Approvals"
        description="Review, approve, reject, and process department fund requests."
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <div className="rounded-xl border border-slate-200 bg-white p-3">
          <p className="text-xs uppercase tracking-wide text-slate-500">Pending</p>
          <p className="mt-1 text-lg font-semibold text-slate-900">{data.summary.pending}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-3">
          <p className="text-xs uppercase tracking-wide text-slate-500">Approved</p>
          <p className="mt-1 text-lg font-semibold text-slate-900">{data.summary.approved}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-3">
          <p className="text-xs uppercase tracking-wide text-slate-500">Rejected</p>
          <p className="mt-1 text-lg font-semibold text-slate-900">{data.summary.rejected}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-3">
          <p className="text-xs uppercase tracking-wide text-slate-500">Processed</p>
          <p className="mt-1 text-lg font-semibold text-slate-900">{data.summary.processed}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-3">
          <p className="text-xs uppercase tracking-wide text-slate-500">Cancelled</p>
          <p className="mt-1 text-lg font-semibold text-slate-900">{data.summary.cancelled}</p>
        </div>
      </div>

      <form method="get" className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="md:col-span-2">
            <label htmlFor="q" className="mb-1 block text-sm font-medium text-slate-700">
              Search
            </label>
            <input
              id="q"
              name="q"
              defaultValue={q}
              placeholder="Title, purpose, payee, reference"
              className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label htmlFor="status" className="mb-1 block text-sm font-medium text-slate-700">
              Status
            </label>
            <select
              id="status"
              name="status"
              defaultValue={status}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="processed">Processed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="submit"
            className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            Apply Filters
          </button>
          <Link
            href={`/c/${churchSlug}/treasury/approvals`}
            className="inline-flex items-center rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Reset
          </Link>
          <Link
            href={`/c/${churchSlug}/treasury`}
            className="inline-flex items-center rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Back to Treasury
          </Link>
        </div>
      </form>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        {data.rows.length === 0 ? (
          <div className="px-6 py-10 text-sm text-slate-600">
            No department fund requests matched your filters.
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {data.rows.map((row) => {
              const canReview = row.status === "pending" || row.status === "approved";
              const canProcess = row.status === "pending" || row.status === "approved";

              return (
                <div key={row.id} className="p-4">
                  <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-slate-900">{row.title}</p>
                        <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${statusClass(row.status)}`}>
                          {row.status}
                        </span>
                      </div>
                      <p className="text-sm text-slate-700">{row.purpose}</p>
                      <div className="grid gap-2 text-xs text-slate-600 sm:grid-cols-2 lg:grid-cols-3">
                        <p><span className="font-medium text-slate-800">Department:</span> {row.department_name}</p>
                        <p><span className="font-medium text-slate-800">Amount:</span> {Number(row.amount).toFixed(2)}</p>
                        <p><span className="font-medium text-slate-800">Category:</span> {getLabel(outflowTypeLabels, row.outflow_type)}</p>
                        <p><span className="font-medium text-slate-800">Fund:</span> {row.fund_label}</p>
                        <p><span className="font-medium text-slate-800">Requester:</span> {row.requested_by_label}</p>
                        <p><span className="font-medium text-slate-800">Date:</span> {row.outflow_date_effective}</p>
                      </div>
                    </div>

                    <div className="w-full max-w-sm space-y-2">
                      {canReview ? (
                        <div className="grid grid-cols-2 gap-2">
                          <form action={reviewDepartmentFundRequestSubmitAction}>
                            <input type="hidden" name="churchSlug" value={churchSlug} />
                            <input type="hidden" name="requestId" value={row.id} />
                            <input type="hidden" name="decision" value="approved" />
                            <button
                              type="submit"
                              className="inline-flex w-full items-center justify-center rounded-md border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700 hover:bg-emerald-100"
                            >
                              Approve
                            </button>
                          </form>
                          <form action={reviewDepartmentFundRequestSubmitAction}>
                            <input type="hidden" name="churchSlug" value={churchSlug} />
                            <input type="hidden" name="requestId" value={row.id} />
                            <input type="hidden" name="decision" value="rejected" />
                            <button
                              type="submit"
                              className="inline-flex w-full items-center justify-center rounded-md border border-rose-300 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700 hover:bg-rose-100"
                            >
                              Reject
                            </button>
                          </form>
                        </div>
                      ) : null}

                      {canProcess ? (
                        <form action={processDepartmentFundRequestIntoOutflowSubmitAction}>
                          <input type="hidden" name="churchSlug" value={churchSlug} />
                          <input type="hidden" name="requestId" value={row.id} />
                          <button
                            type="submit"
                            className="inline-flex w-full items-center justify-center rounded-md bg-slate-950 px-3 py-2 text-xs font-medium text-white hover:bg-slate-800"
                          >
                            Process (Auto-map)
                          </button>
                        </form>
                      ) : null}

                      <Link
                        href={`/c/${churchSlug}/treasury/out/new?requestId=${row.id}`}
                        className="inline-flex w-full items-center justify-center rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                      >
                        Open Prefilled Expense
                      </Link>

                      <Link
                        href={`/c/${churchSlug}/departments/${row.department_id}?tab=finance&requestId=${row.id}`}
                        className="inline-flex w-full items-center justify-center rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                      >
                        Open Department Detail
                      </Link>

                      {row.status === "processed" && row.processed_outflow_id ? (
                        <Link
                          href={`/c/${churchSlug}/treasury/out/${row.processed_outflow_id}/edit`}
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
      </div>
    </div>
  );
}
