import Link from "next/link";
import { getTreasuryAuditLogs } from "@/features/treasury/queries";

interface TreasuryAuditPageProps {
  params: Promise<{ churchSlug: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

function pickSingle(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value ?? "";
}

function formatActor(actor: any, fallbackId?: string | null) {
  if (!actor) return fallbackId ?? "System";
  return actor.full_name || actor.email || fallbackId || "System";
}

function formatJson(value: any) {
  return JSON.stringify(value ?? {}, null, 2);
}

function getDeltaSummary(beforeSnapshot: any, afterSnapshot: any) {
  const before = beforeSnapshot ?? {};
  const after = afterSnapshot ?? {};
  const keys = Array.from(new Set([...Object.keys(before), ...Object.keys(after)]));

  return keys
    .filter((key) => JSON.stringify(before[key]) !== JSON.stringify(after[key]))
    .map((key) => ({
      key,
      before: before[key],
      after: after[key],
    }));
}

export default async function TreasuryAuditPage({
  params,
  searchParams,
}: TreasuryAuditPageProps) {
  const { churchSlug } = await params;
  const filters = (await searchParams) ?? {};
  const result = await getTreasuryAuditLogs(churchSlug, filters);

  const q = pickSingle(filters.q);
  const entityType = pickSingle(filters.entityType);
  const actionType = pickSingle(filters.actionType);
    const changedBy = pickSingle(filters.changedBy);
  const entityId = pickSingle(filters.entityId);
  const dateFrom = pickSingle(filters.dateFrom);
  const dateTo = pickSingle(filters.dateTo);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Treasury Audit Trail</h2>
          <p className="mt-1 text-sm text-gray-600">
                        Review who changed treasury records, when it happened, and what changed.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href={`/c/${churchSlug}/treasury`}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            Back to Treasury
          </Link>
          <Link
            href={`/c/${churchSlug}/treasury/in`}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            Money In
          </Link>
          <Link
            href={`/c/${churchSlug}/treasury/out`}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            Money Out
          </Link>
        </div>
      </div>

      <form method="get" className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 xl:grid-cols-6">
          <div className="xl:col-span-2">
            <label htmlFor="q" className="mb-1 block text-sm font-medium text-gray-700">
              Search
            </label>
            <input
              id="q"
              name="q"
              defaultValue={q}
              placeholder="Correction note, action, or entity"
              className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="entityType" className="mb-1 block text-sm font-medium text-gray-700">
              Entity
            </label>
            <select
              id="entityType"
              name="entityType"
              defaultValue={entityType}
              className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All</option>
              <option value="treasury_fund">Fund</option>
              <option value="treasury_inflow">Money In</option>
              <option value="treasury_outflow">Money Out</option>
            </select>
          </div>

          <div>
            <label htmlFor="actionType" className="mb-1 block text-sm font-medium text-gray-700">
              Action
            </label>
            <select
              id="actionType"
              name="actionType"
              defaultValue={actionType}
              className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All</option>
              <option value="create">Create</option>
              <option value="update">Update</option>
            </select>
          </div>

          <div>
            <label htmlFor="changedBy" className="mb-1 block text-sm font-medium text-gray-700">
              Actor
            </label>
            <select
              id="changedBy"
              name="changedBy"
              defaultValue={changedBy}
              className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All</option>
              {result.actorOptions.map((actor) => (
                <option key={actor.id} value={actor.id}>
                  {actor.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="dateFrom" className="mb-1 block text-sm font-medium text-gray-700">
              From
            </label>
            <input
              id="dateFrom"
              name="dateFrom"
              type="date"
              defaultValue={dateFrom}
              className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="dateTo" className="mb-1 block text-sm font-medium text-gray-700">
              To
            </label>
            <input
              id="dateTo"
              name="dateTo"
              type="date"
              defaultValue={dateTo}
              className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="submit"
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Apply Filters
          </button>
                    <Link
            href={entityId ? `/c/${churchSlug}/treasury/audit?entityId=${entityId}` : `/c/${churchSlug}/treasury/audit`}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            Reset
          </Link>
        </div>
      </form>

            {entityId ? (
        <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
          Showing audit history for a single treasury record.
          <span className="ml-2 font-mono text-xs">{entityId}</span>
        </div>
      ) : null}

      {result.rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white px-6 py-12 text-sm text-gray-600">
          No audit entries matched your filters.
        </div>
      ) : (
        <div className="space-y-4">
          {result.rows.map((row: any) => {
            const delta = getDeltaSummary(row.before_snapshot, row.after_snapshot);

            return (
              <div key={row.id} className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-slate-800 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-white">
                        {String(row.entity_type).replaceAll("_", " ")}
                      </span>
                      <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-blue-700">
                        {row.action_type}
                      </span>
                      {row.correction_note ? (
                        <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">
                          Correction note captured
                        </span>
                      ) : null}
                    </div>

                    <p className="text-xs text-gray-500">
                      {new Date(row.created_at).toLocaleString()}
                    </p>
                  </div>

                  <div className="mt-2 grid gap-2 text-sm text-gray-600 md:grid-cols-3">
                    <div>
                      <span className="font-medium text-gray-900">Actor:</span>{" "}
                      {formatActor(row.changed_by, row.changed_by_user_id)}
                    </div>
                    <div>
                      <span className="font-medium text-gray-900">Entity ID:</span>{" "}
                      <span className="font-mono text-xs">{row.entity_id}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-900">Fields changed:</span>{" "}
                      {delta.length}
                    </div>
                  </div>

                  {row.correction_note ? (
                    <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                      <span className="font-semibold">Correction note:</span> {row.correction_note}
                    </div>
                  ) : null}
                </div>

                <div className="px-4 py-4">
                  {delta.length === 0 ? (
                    <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-3 text-sm text-gray-600">
                      No field-level difference was detected in the snapshots.
                    </div>
                  ) : (
                    <div className="overflow-hidden rounded-lg border border-gray-200">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-white">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                              Field
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                              Before
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                              After
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                          {delta.map((item) => (
                            <tr key={item.key}>
                              <td className="px-4 py-3 align-top text-sm font-medium text-gray-900">
                                {item.key}
                              </td>
                              <td className="px-4 py-3 align-top text-sm text-gray-600">
                                <pre className="whitespace-pre-wrap break-words font-mono text-xs">
                                  {JSON.stringify(item.before, null, 2)}
                                </pre>
                              </td>
                              <td className="px-4 py-3 align-top text-sm text-gray-600">
                                <pre className="whitespace-pre-wrap break-words font-mono text-xs">
                                  {JSON.stringify(item.after, null, 2)}
                                </pre>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  <details className="mt-4 rounded-lg border border-gray-200 bg-gray-50">
                    <summary className="cursor-pointer list-none px-4 py-3 text-sm font-medium text-gray-800">
                      Raw snapshots
                    </summary>

                    <div className="grid gap-4 border-t border-gray-200 px-4 py-4 lg:grid-cols-2">
                      <div>
                        <h3 className="mb-2 text-sm font-semibold text-gray-900">Before snapshot</h3>
                        <pre className="max-h-96 overflow-auto rounded-md bg-slate-950 p-3 text-xs text-slate-100">
{formatJson(row.before_snapshot)}
                        </pre>
                      </div>

                      <div>
                        <h3 className="mb-2 text-sm font-semibold text-gray-900">After snapshot</h3>
                        <pre className="max-h-96 overflow-auto rounded-md bg-slate-950 p-3 text-xs text-slate-100">
{formatJson(row.after_snapshot)}
                        </pre>
                      </div>
                    </div>
                  </details>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

