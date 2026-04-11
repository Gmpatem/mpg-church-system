import { getReportsTabData } from "@/features/reports/queries";
import { MembersAnalyticsTabClient } from "./MembersAnalyticsTabClient";

export async function MembersTab({
  churchSlug,
  dateFrom,
  dateTo,
}: {
  churchSlug: string;
  dateFrom?: string;
  dateTo?: string;
}) {
  const data = await getReportsTabData(churchSlug, "members", { dateFrom, dateTo });
  return <MembersAnalyticsTabClient members={data.members} />;
}
