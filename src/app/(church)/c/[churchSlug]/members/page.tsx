import { getMembersWorkspaceData } from "@/features/members/queries";
import { MembersWorkspaceUnified } from "./components/MembersWorkspaceUnified";
import { WorkspaceHero } from "@/components/workspace";
import { en } from "@/features/i18n/en";
import { fr } from "@/features/i18n/fr";
import { cookies } from "next/headers";

interface MembersPageProps {
  params: Promise<{ churchSlug: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

function pickSingle(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value ?? "";
}

async function getTranslations() {
  const cookieStore = await cookies();
  const lang = cookieStore.get("preferred_language")?.value;
  return lang === "fr" ? fr : en;
}

export default async function MembersPage({ params, searchParams }: MembersPageProps) {
  const { churchSlug } = await params;
  const filters = (await searchParams) ?? {};
  const t = await getTranslations();

  const data = await getMembersWorkspaceData(churchSlug, {
    q: pickSingle(filters.q),
    status: pickSingle(filters.status),
    departmentId: pickSingle(filters.departmentId),
    departmentAssignmentStatus: pickSingle(filters.departmentAssignmentStatus),
  });

  return (
    <div className="space-y-6">
      <WorkspaceHero
        title={t.pages.members.title}
        description={t.pages.members.description}
      />
      <MembersWorkspaceUnified churchSlug={churchSlug} data={data} />
    </div>
  );
}
