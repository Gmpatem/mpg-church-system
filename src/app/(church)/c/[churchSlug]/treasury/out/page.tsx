import Link from "next/link";
import { getTreasuryOutflows, getTreasuryFormOptions } from "@/features/treasury/queries";
import { WorkspaceEmptyState, WorkspaceHero } from "@/components/workspace";
import { getLabel, outflowTypeLabels } from "@/lib/display-maps";

interface TreasuryOutflowsPageProps {
  params: Promise<{ churchSlug: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

function pickSingle(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value ?? "";
}

const formatAmount = (v: number) =>
  v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default async function TreasuryOutflowsPage({ params, searchParams }: TreasuryOutflowsPageProps) {
  const { churchSlug } = await params;
  const filters = (await searchParams) ?? {};
  const options = await getTreasuryFormOptions(churchSlug);
  const outflows = await getTreasuryOutflows(churchSlug, filters);

  const q = pickSingle(filters.q);
  const outflowType = pickSingle(filters.outflowType);
  const fundId = pickSingle(filters.fundId);
  const departmentId = pickSingle(filters.departmentId);
  const dateFrom = pickSingle(filters.dateFrom);
  const dateTo = pickSingle(filters.dateTo);

  return (
    <div className="space-y-6">
      <WorkspaceHero
        title="Money Out"
        description="Expenses, remittances, and outflow records."
      />

      <div className="flex flex-wrap gap-3">
        <Link
          href={`/c/${churchSlug}/treasury/approvals`}
          className="rounded-xl border border-blue-300 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-900 hover:bg-blue-100"
        >
          Treasury Approvals
        </Link>
        <Link
          href={`/c/${churchSlug}/treasury/audit`}
          className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-900 hover:bg-amber-100"
        >
          Audit Trail
        </Link>
        <Link
          href={`/c/${churchSlug}/treasury`}
          className="inline-flex items-center rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          Back to Treasury
        </Link>
        <Link
          href={`/c/${churchSlug}/treasury/out/new`}
          className="inline-flex items-center rounded-xl bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
        >
          Record Money Out
        </Link>
      </div>

      <form method="get" className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 xl:grid-cols-6">
          <div className="xl:col-span-2">
            <label htmlFor="q" className="block text-sm font-medium text-slate-700 mb-1">Search</label>
            <input
              id="q"
              name="q"
              defaultValue={q}
              placeholder="Purpose, payee, project, reference"
              className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="outflowType" className="block text-sm font-medium text-slate-700 mb-1">Type</label>
            <select id="outflowType" name="outflowType" defaultValue={outflowType} className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">All</option>
              <option value="project">Project</option>
              <option value="evangelism">Evangelism</option>
              <option value="mission_remittance">Mission / District Remittance</option>
              <option value="department_expense">Department Expense</option>
              <option value="operations">Operations</option>
              <option value="welfare">Welfare</option>
              <option value="equipment">Equipment</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label htmlFor="fundId" className="block text-sm font-medium text-slate-700 mb-1">Fund</label>
            <select id="fundId" name="fundId" defaultValue={fundId} className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">All</option>
              {options.funds.map((fund) => (
                <option key={fund.id} value={fund.id}>{fund.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="departmentId" className="block text-sm font-medium text-slate-700 mb-1">Department</label>
            <select id="departmentId" name="departmentId" defaultValue={departmentId} className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">All</option>
              {options.departments.map((dept) => (
                <option key={dept.id} value={dept.id}>{dept.department_name}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="dateFrom" className="block text-sm font-medium text-slate-700 mb-1">From</label>
            <input id="dateFrom" name="dateFrom" type="date" defaultValue={dateFrom} className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div>
            <label htmlFor="dateTo" className="block text-sm font-medium text-slate-700 mb-1">To</label>
            <input id="dateTo" name="dateTo" type="date" defaultValue={dateTo} className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <button type="submit" className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">
            Apply Filters
          </button>
          <Link href={`/c/${churchSlug}/treasury/out`} className="inline-flex items-center rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
            Reset
          </Link>
        </div>
      </form>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        {outflows.length === 0 ? (
          <div className="px-6 py-10">
            <WorkspaceEmptyState
              title="No records found"
              message="Try adjusting your filters or add a new record."
              actionLabel="Record Money Out"
              actionHref={`/c/${churchSlug}/treasury/out/new`}
            />
          </div>
        ) : (
          <>
            <div className="space-y-3 p-3 md:hidden">
              {outflows.map((item: any) => (
                <div key={item.id} className="rounded-xl border border-slate-200 bg-white p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{getLabel(outflowTypeLabels, item.outflow_type)}</p>
                      <p className="mt-1 text-xs text-slate-500">{item.outflow_date}</p>
                    </div>
                    <span className="text-sm font-semibold text-slate-900">{formatAmount(Number(item.amount))}</span>
                  </div>
                  <p className="mt-2 text-xs text-slate-600">{item.payee ?? "No payee"} • {item.reference_number ?? "No reference"}</p>
                  <p className="mt-1 line-clamp-2 text-xs text-slate-500">{item.purpose ?? "No purpose"}</p>
                  <div className="mt-3 flex items-center gap-3 text-xs font-medium">
                    <Link href={`/c/${churchSlug}/treasury/out/${item.id}/edit`} className="text-slate-700 hover:underline">
                      Edit
                    </Link>
                    <Link
                      href={`/c/${churchSlug}/treasury/audit?entityId=${item.id}`}
                      className="text-amber-700 hover:underline"
                    >
                      View Audit
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            <div className="hidden overflow-x-auto md:block">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Payee</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Purpose</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Reference</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {outflows.map((item: any) => (
                    <tr key={item.id}>
                      <td className="px-6 py-4 text-sm text-slate-600">{item.outflow_date}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{getLabel(outflowTypeLabels, item.outflow_type)}</td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-900">{formatAmount(Number(item.amount))}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{item.payee ?? "—"}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{item.purpose}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{item.reference_number ?? "—"}</td>
                      <td className="px-6 py-4 text-sm flex gap-3">
                        <Link href={`/c/${churchSlug}/treasury/out/${item.id}/edit`} className="text-slate-700 hover:underline">
                          Edit
                        </Link>
                        <Link
                          href={`/c/${churchSlug}/treasury/audit?entityId=${item.id}`}
                          className="text-amber-700 hover:underline"
                        >
                          View Audit
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
