import { getReportsTabData } from "@/features/reports/queries";
import { MembersTabClient } from "./MembersTabClient";

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
  return <MembersTabClient members={data.members} />;
}
