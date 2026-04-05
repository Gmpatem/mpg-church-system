import { WorkspaceControlRail } from "@/components/workspace";

export function ReportsFilterRail({
  churchSlug,
  activeTab,
  dateFrom,
  dateTo,
}: {
  churchSlug: string;
  activeTab: "overview" | "treasury" | "members" | "events" | "unified";
  dateFrom?: string;
  dateTo?: string;
}) {
  return (
    <WorkspaceControlRail
      title="Reporting Window"
      description="Choose a date range and keep it active while switching between report tabs."
    >
      <form
        method="get"
        action={`/c/${churchSlug}/reports`}
        className="grid gap-4 xl:grid-cols-[180px_180px_auto]"
      >
        <input type="hidden" name="tab" value={activeTab} />

        <div>
          <label htmlFor="dateFrom" className="mb-1 block text-sm font-medium text-slate-700">
            From
          </label>
          <input
            id="dateFrom"
            name="dateFrom"
            type="date"
            defaultValue={dateFrom ?? ""}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          />
        </div>

        <div>
          <label htmlFor="dateTo" className="mb-1 block text-sm font-medium text-slate-700">
            To
          </label>
          <input
            id="dateTo"
            name="dateTo"
            type="date"
            defaultValue={dateTo ?? ""}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          />
        </div>

        <div className="flex items-end gap-3">
          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-xl bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            Apply
          </button>

          <a
            href={`/c/${churchSlug}/reports?tab=${activeTab}`}
            className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Reset
          </a>
        </div>
      </form>
    </WorkspaceControlRail>
  );
}
