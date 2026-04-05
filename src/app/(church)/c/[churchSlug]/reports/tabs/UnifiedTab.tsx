import { getReportsTabData } from "@/features/reports/queries";
import { UnifiedTabClient } from "./UnifiedTabClient";

export async function UnifiedTab({
  churchSlug,
  dateFrom,
  dateTo,
}: {
  churchSlug: string;
  dateFrom?: string;
  dateTo?: string;
}) {
  const data = await getReportsTabData(churchSlug, "unified", { dateFrom, dateTo });
  return <UnifiedTabClient unified={data.unified} />;
}
