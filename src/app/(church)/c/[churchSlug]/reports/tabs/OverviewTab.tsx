import { getReportsTabData } from "@/features/reports/queries";
import { OverviewTabClient } from "./OverviewTabClient";

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
  return <OverviewTabClient overview={data.overview} />;
}
