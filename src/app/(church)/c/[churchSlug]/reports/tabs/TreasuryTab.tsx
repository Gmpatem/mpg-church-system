import { getReportsTabData } from "@/features/reports/queries";
import { TreasuryTabClient } from "./TreasuryTabClient";

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
  return <TreasuryTabClient treasury={data.treasury} />;
}
