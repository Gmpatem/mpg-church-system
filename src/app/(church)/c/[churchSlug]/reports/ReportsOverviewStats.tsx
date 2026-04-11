import { getReportsOverviewStrip } from "@/features/reports/queries";
import { WorkspaceStatCard } from "@/components/workspace";

interface ReportsOverviewStatsProps {
  churchSlug: string;
  activeTab: "overview" | "finance" | "members" | "events";
  dateFrom?: string;
  dateTo?: string;
}

export async function ReportsOverviewStats({
  churchSlug,
  activeTab,
  dateFrom,
  dateTo,
}: ReportsOverviewStatsProps) {
  const data = await getReportsOverviewStrip(churchSlug, { dateFrom, dateTo });
  const stats =
    activeTab === "finance"
      ? data.treasury.stats
      : activeTab === "members"
        ? data.members.stats
        : activeTab === "events"
          ? data.events.stats
          : data.overview.stats;

  if (stats.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {stats.map((stat) => (
        <WorkspaceStatCard
          key={stat.label}
          label={stat.label}
          value={stat.value}
          hint={stat.hint}
          valueClassName="text-xl sm:text-2xl"
        />
      ))}
    </div>
  );
}
