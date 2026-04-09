import {
  getAccessControlOverview,
  getAccessControlTabData,
} from "@/features/access-control/queries";
import { AccessControlWorkspace } from "./components/AccessControlWorkspace";
import type { AccessControlTabKey } from "@/features/access-control/types";
import { WorkspaceHero } from "@/components/workspace";

type PageProps = {
  params: Promise<{
    churchSlug: string;
  }>;
  searchParams?: Promise<{
    tab?: string;
  }>;
};

const VALID_TABS: AccessControlTabKey[] = [
  "overview",
  "roles",
  "page_access",
  "invites",
  "pending_access",
  "activity_log",
];

function normalizeTab(value: string | undefined): AccessControlTabKey {
  if (!value) return "overview";
  return VALID_TABS.includes(value as AccessControlTabKey)
    ? (value as AccessControlTabKey)
    : "overview";
}

export default async function AccessControlPage(props: PageProps) {
  const params = await props.params;
  const searchParams = (await props.searchParams) ?? {};
  const activeTab = normalizeTab(searchParams.tab);

  const [overview, tabData] = await Promise.all([
    getAccessControlOverview(params.churchSlug),
    getAccessControlTabData(params.churchSlug, activeTab),
  ]);

  return (
    <div className="space-y-6">
      <WorkspaceHero
        title="Invites & Access"
        description="Manage member portal invites and review pending access requests."
      />
      <AccessControlWorkspace
        overview={overview}
        activeTab={activeTab}
        tabData={tabData}
      />
    </div>
  );
}
