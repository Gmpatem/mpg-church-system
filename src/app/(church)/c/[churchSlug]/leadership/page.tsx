import { LeadershipWorkspace } from "@/features/leadership/LeadershipWorkspace";
import { getLeadershipTabData, getLeadershipOverview } from "@/features/leadership/queries";
import type { LeadershipTabKey } from "@/features/leadership/types";

type PageProps = {
  params: Promise<{
    churchSlug: string;
  }>;
  searchParams?: Promise<{
    tab?: string;
  }>;
};

const VALID_TABS: LeadershipTabKey[] = [
  "overview",
  "requests",
  "active_leaders",
];

function normalizeTab(value: string | undefined): LeadershipTabKey {
  if (!value) return "overview";
  return VALID_TABS.includes(value as LeadershipTabKey)
    ? (value as LeadershipTabKey)
    : "overview";
}

export default async function LeadershipPage(props: PageProps) {
  const params = await props.params;
  const searchParams = (await props.searchParams) ?? {};
  const activeTab = normalizeTab(searchParams.tab);

  const [overview, tabData] = await Promise.all([
    getLeadershipOverview(params.churchSlug),
    getLeadershipTabData(params.churchSlug, activeTab),
  ]);

  return (
    <LeadershipWorkspace
      churchSlug={overview.churchSlug}
      churchName={overview.churchName}
      activeTab={activeTab}
      tabData={tabData}
    />
  );
}
