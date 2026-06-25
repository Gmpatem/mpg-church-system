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
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-background p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
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
                  ? "shrink-0 rounded-lg border border-primary/20 bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary"
                  : "shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
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
            className="w-[130px] rounded-lg border border-input bg-background px-2.5 py-1.5 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
          />
          <span className="text-sm text-muted-foreground">to</span>
          <input
            id="dateTo"
            name="dateTo"
            type="date"
            defaultValue={dateTo ?? ""}
            className="w-[130px] rounded-lg border border-input bg-background px-2.5 py-1.5 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
          />
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
          >
            Apply
          </button>

          <Link
            href={`/c/${churchSlug}/reports?tab=${activeTab}`}
            className="inline-flex items-center justify-center rounded-lg border border-border bg-background px-3 py-1.5 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            Reset
          </Link>
        </div>
      </form>
    </div>
  );
}
