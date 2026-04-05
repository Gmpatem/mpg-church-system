import PlatformDashboardClient from "@/features/platform/components/PlatformDashboardClient";
import { getPlatformDashboardMetrics } from "@/features/platform/queries";

export default async function PlatformPage() {
  const metrics = await getPlatformDashboardMetrics();

  return (
    <PlatformDashboardClient
      totals={metrics.totals}
      churches={metrics.churches}
      monthlyChurchCreation={metrics.monthlyChurchCreation}
      activeInactiveBreakdown={metrics.activeInactiveBreakdown}
      languageDistribution={metrics.languageDistribution}
    />
  );
}
