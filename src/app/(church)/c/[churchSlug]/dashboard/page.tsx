import { WorkspaceRouteStateBridge } from "@/components/workspace/WorkspaceRouteStateBridge";
import { DashboardWorkspace } from "@/features/dashboard/components/DashboardWorkspace";
import { getDashboardData } from "@/features/dashboard/queries";
import { en } from "@/features/i18n/en";
import { fr } from "@/features/i18n/fr";
import { cookies } from "next/headers";

interface DashboardPageProps {
  params: Promise<{ churchSlug: string }>;
}

async function getTranslations() {
  const cookieStore = await cookies();
  const lang = cookieStore.get("preferred_language")?.value;
  return {
    locale: lang === "fr" ? "fr" : "en",
    t: lang === "fr" ? fr : en,
  };
}

export default async function DashboardPage({ params }: DashboardPageProps) {
  const { churchSlug } = await params;
  const [{ locale, t }, data] = await Promise.all([
    getTranslations(),
    getDashboardData(churchSlug),
  ]);

  return (
    <>
      <WorkspaceRouteStateBridge
        churchSlug={churchSlug}
        moduleKey="dashboard"
        prefetchHrefs={[
          `/c/${churchSlug}/members`,
          `/c/${churchSlug}/treasury`,
          `/c/${churchSlug}/reports`,
          `/c/${churchSlug}/events`,
        ]}
      />
      <DashboardWorkspace data={data} labels={t.pages.dashboard.workspace} locale={locale} />
    </>
  );
}
