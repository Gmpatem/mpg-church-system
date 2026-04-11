import { getReportsTabData } from "@/features/reports/queries";
import { FinanceAnalyticsTabClient } from "./FinanceAnalyticsTabClient";

export async function TreasuryTab({
  churchSlug,
  dateFrom,
  dateTo,
}: {
  churchSlug: string;
  dateFrom?: string;
  dateTo?: string;
}) {
  const data = await getReportsTabData(churchSlug, "treasury", { dateFrom, dateTo });
  return <FinanceAnalyticsTabClient treasury={data.treasury} />;
}
