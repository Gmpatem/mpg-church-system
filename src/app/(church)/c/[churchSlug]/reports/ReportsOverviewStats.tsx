import { getReportsTabData } from "@/features/reports/queries";
import { WorkspaceStatCard } from "@/components/workspace";

interface ReportsOverviewStatsProps {
  churchSlug: string;
  dateFrom?: string;
  dateTo?: string;
}

export async function ReportsOverviewStats({
  churchSlug,
  dateFrom,
  dateTo,
}: ReportsOverviewStatsProps) {
  const data = await getReportsTabData(churchSlug, "overview", { dateFrom, dateTo });

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {data.overview.stats.map((stat) => (
        <WorkspaceStatCard
          key={stat.label}
          label={stat.label}
          value={stat.value}
          hint={stat.hint}
        />
      ))}
    </div>
  );
}
