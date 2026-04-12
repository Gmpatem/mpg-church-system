import { redirect } from "next/navigation";
import {
  canCurrentUserViewAccessControl,
  getAccessControlPermissionsData,
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
  if (!value) return "permissions";
  if (value === "invites") return "invites";
  if (value === "pending_access" || value === "requests") return "pending_access";
  if (
    value === "overview" ||
    value === "permissions" ||
    value === "roles" ||
    value === "page_access" ||
    value === "activity_log"
  ) {
    return "permissions";
  }
  return "permissions";
}

export default async function AccessControlPage(props: PageProps) {
  const params = await props.params;
  const searchParams = (await props.searchParams) ?? {};
  const activeTab = normalizeTab(searchParams.tab);
  const canView = await canCurrentUserViewAccessControl(params.churchSlug);

  if (!canView) {
    redirect(`/c/${params.churchSlug}/dashboard`);
  }

  const permissionsData = await getAccessControlPermissionsData(params.churchSlug);
  const tabData: AccessControlTabData =
    activeTab === "permissions"
      ? { tab: "permissions", data: permissionsData }
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
        permissionsData={permissionsData}
        activeTab={activeTab}
        tabData={tabData}
      />
    </div>
  );
}
