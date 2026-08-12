import {
  getMemberPortalFoundation,
  getMemberPortalTabData,
} from "@/features/member-portal/queries";
import { MemberPortalWorkspace } from "./components/MemberPortalWorkspace";
import { MemberPortalShell } from "./components/MemberPortalShell";
import { FirstLoginPasswordGate } from "@/features/member-portal/components/FirstLoginPasswordGate";
import type { MemberPortalTabKey } from "@/features/member-portal/types";

type PageProps = {
  params: Promise<{ churchSlug: string }>;
  searchParams?: Promise<{ tab?: string; welcome?: string }>;
};

const VALID_TABS: MemberPortalTabKey[] = [
  "overview",
  "ministries",
  "departments",
  "events",
  "giving",
  "profile",
];

const TAB_ALIASES: Record<string, MemberPortalTabKey> = {
  home: "overview",
  directory: "departments",
  calendar: "events",
  service: "ministries",
  ministries: "ministries",
  duties: "ministries",
};

function normalizeTab(value: string | undefined): MemberPortalTabKey {
  if (!value) return "overview";
  const alias = TAB_ALIASES[value.toLowerCase()];
  if (alias) return alias;
  return VALID_TABS.includes(value as MemberPortalTabKey)
    ? (value as MemberPortalTabKey)
    : "overview";
}

export default async function MemberPortalPage(props: PageProps) {
  const params = await props.params;
  const searchParams = (await props.searchParams) ?? {};
  const activeTab = normalizeTab(searchParams.tab);
  const showWelcome = searchParams.welcome === "1";

  const [foundation, tabData] = await Promise.all([
    getMemberPortalFoundation(params.churchSlug),
    getMemberPortalTabData(params.churchSlug, activeTab),
  ]);

  if ((foundation as any).requiresPasswordChange) {
    return <FirstLoginPasswordGate churchSlug={foundation.churchSlug} />;
  }

  return (
    <MemberPortalShell
      foundation={foundation}
      activeTab={activeTab}
      showWelcome={showWelcome}
    >
      <MemberPortalWorkspace
        foundation={foundation}
        activeTab={activeTab}
        tabData={tabData}
      />
    </MemberPortalShell>
  );
}
