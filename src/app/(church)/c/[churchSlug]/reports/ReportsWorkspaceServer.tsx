import { getReportsWorkspaceData } from "@/features/reports/queries";
import { ReportsWorkspace } from "@/features/reports/components/ReportsWorkspace";

export async function ReportsWorkspaceServer({
  churchSlug,
  dateFrom,
  dateTo,
}: {
  churchSlug: string;
  dateFrom?: string;
  dateTo?: string;
}) {
  const data = await getReportsWorkspaceData(churchSlug, { dateFrom, dateTo });
  return <ReportsWorkspace churchSlug={churchSlug} data={data} />;
}
