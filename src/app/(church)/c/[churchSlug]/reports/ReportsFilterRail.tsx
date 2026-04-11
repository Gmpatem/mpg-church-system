import Link from "next/link";

type TabKey = "overview" | "finance" | "members" | "events";

const TABS: Array<{ key: TabKey; label: string }> = [
  { key: "overview", label: "Overview" },
  { key: "finance", label: "Finance" },
  { key: "members", label: "Members" },
  { key: "events", label: "Events" },
];

function buildTabHref({
  churchSlug,
  tab,
  dateFrom,
  dateTo,
}: {
  churchSlug: string;
  tab: TabKey;
  dateFrom?: string;
  dateTo?: string;
}) {
  const params = new URLSearchParams();
  params.set("tab", tab);
  if (dateFrom) params.set("dateFrom", dateFrom);
  if (dateTo) params.set("dateTo", dateTo);
  return `/c/${churchSlug}/reports?${params.toString()}`;
}

export function ReportsFilterRail({
  churchSlug,
  activeTab,
  dateFrom,
  dateTo,
}: {
  churchSlug: string;
  activeTab: TabKey;
  dateFrom?: string;
  dateTo?: string;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-3 sm:flex-row sm:items-center sm:justify-between">
      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1 sm:pb-0">
        {TABS.map((tab) => {
          const isActive = tab.key === activeTab;
          return (
            <Link
              key={tab.key}
              href={buildTabHref({ churchSlug, tab: tab.key, dateFrom, dateTo })}
              className={
                isActive
                  ? "shrink-0 rounded-lg bg-slate-950 px-3 py-1.5 text-sm font-medium text-white"
                  : "shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
              }
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      {/* Date Filters */}
      <form
        method="get"
        action={`/c/${churchSlug}/reports`}
        className="flex flex-wrap items-center gap-2"
      >
        <input type="hidden" name="tab" value={activeTab} />

        <div className="flex items-center gap-2">
          <input
            id="dateFrom"
            name="dateFrom"
            type="date"
            defaultValue={dateFrom ?? ""}
            className="w-[130px] rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          />
          <span className="text-sm text-slate-400">→</span>
          <input
            id="dateTo"
            name="dateTo"
            type="date"
            defaultValue={dateTo ?? ""}
            className="w-[130px] rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          />
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-lg bg-slate-950 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            Apply
          </button>

          <a
            href={`/c/${churchSlug}/reports?tab=${activeTab}`}
            className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Reset
          </a>
        </div>
      </form>
    </div>
  );
}
