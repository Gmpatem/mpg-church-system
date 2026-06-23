import { requireChurchAccess } from "@/features/access/queries";
import { createClient } from "@/lib/supabase/server";
import { SmallGroupsWorkspace } from "./components/SmallGroupsWorkspace";
import {
  buildSmallGroupsWorkspaceData,
  type SmallGroupsMemberSource,
} from "./components/adapters";
import { smallGroupsTabKeys, type SmallGroupsTabKey } from "./components/types";

interface SmallGroupsPageProps {
  params: Promise<{ churchSlug: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

function pickSingle(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value ?? "";
}

function parseInitialTab(value: string): SmallGroupsTabKey {
  return smallGroupsTabKeys.includes(value as SmallGroupsTabKey)
    ? (value as SmallGroupsTabKey)
    : "overview";
}

export default async function SmallGroupsPage({ params, searchParams }: SmallGroupsPageProps) {
  const { churchSlug } = await params;
  const filters = (await searchParams) ?? {};
  const initialTab = parseInitialTab(pickSingle(filters.tab));
  const ctx = await requireChurchAccess(churchSlug);
  const supabase = await createClient();

  const { data: members, error } = await supabase
    .from("members")
    .select(
      "id, first_name, last_name, display_name, member_code, email, phone, membership_status, address, date_of_birth"
    )
    .eq("church_id", ctx.churchId)
    .order("last_name", { ascending: true })
    .order("first_name", { ascending: true });

  if (error) throw new Error(error.message);

  const data = buildSmallGroupsWorkspaceData({
    churchId: ctx.churchId,
    churchSlug,
    members: (members ?? []) as SmallGroupsMemberSource[],
  });

  return (
    <div className="min-w-0">
      <SmallGroupsWorkspace churchSlug={churchSlug} data={data} initialTab={initialTab} />
    </div>
  );
}
