import { redirect } from "next/navigation";
import {
  canCurrentUserViewAccessControl,
  getAccessControlOverview,
  getAccessControlTabData,
} from "@/features/access-control/queries";
import { AccessControlWorkspace } from "./components/AccessControlWorkspace";
import type { AccessControlTabData, AccessControlTabKey } from "@/features/access-control/types";
import { WorkspaceRouteStateBridge } from "@/components/workspace/WorkspaceRouteStateBridge";

type PageProps = {
  params: Promise<{
    churchSlug: string;
  }>;
  searchParams?: Promise<{
    tab?: string;
  }>;
};

function normalizeTab(value: string | undefined): AccessControlTabKey {
  if (!value) return "overview";
  if (value === "invites") return "invites";
  if (value === "pending_access" || value === "requests") return "pending_access";
  if (
    value === "overview" ||
    value === "permissions" ||
    value === "roles" ||
    value === "page_access" ||
    value === "activity_log"
  ) {
    return "overview";
  }
  return "overview";
}

export default async function AccessControlPage(props: PageProps) {
  const params = await props.params;
  const searchParams = (await props.searchParams) ?? {};
  const activeTab = normalizeTab(searchParams.tab);
  const canView = await canCurrentUserViewAccessControl(params.churchSlug);

  if (!canView) {
    redirect(`/c/${params.churchSlug}/dashboard`);
  }

  const overview = await getAccessControlOverview(params.churchSlug);
  const tabData: AccessControlTabData =
    activeTab === "overview"
      ? { tab: "overview", data: overview }
      : await getAccessControlTabData(params.churchSlug, activeTab);

  return (
    <div className="space-y-6">
      <WorkspaceRouteStateBridge
        churchSlug={params.churchSlug}
        moduleKey="access-control"
        restoreQueryState={true}
        persistQueryKeys={["tab"]}
        prefetchHrefs={[
          `/c/${params.churchSlug}/approvals`,
          `/c/${params.churchSlug}/office`,
          `/c/${params.churchSlug}/reports`,
        ]}
      />
      <AccessControlWorkspace
        overview={overview}
        activeTab={activeTab}
        tabData={tabData}
      />
    </div>
  );
}
