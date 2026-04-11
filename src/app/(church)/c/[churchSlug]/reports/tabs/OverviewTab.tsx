import { getReportsTabData } from "@/features/reports/queries";
import { OverviewAnalyticsTabClient } from "./OverviewAnalyticsTabClient";

export async function OverviewTab({
  churchSlug,
  dateFrom,
  dateTo,
}: {
  churchSlug: string;
  dateFrom?: string;
  dateTo?: string;
}) {
  const data = await getReportsTabData(churchSlug, "overview", { dateFrom, dateTo });
  return <OverviewAnalyticsTabClient overview={data.overview} />;
}
