import { getDepartmentsWorkspaceData } from "@/features/departments/queries";
import { DepartmentsWorkspaceUnified } from "./components/DepartmentsWorkspaceUnified";
import { WorkspaceHero } from "@/components/workspace";
import { en } from "@/features/i18n/en";
import { fr } from "@/features/i18n/fr";
import { cookies } from "next/headers";

interface DepartmentsPageProps {
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

export default async function DepartmentsPage({
  params,
  searchParams,
}: DepartmentsPageProps) {
  const { churchSlug } = await params;
  const filters = (await searchParams) ?? {};
  const t = await getTranslations();

  const data = await getDepartmentsWorkspaceData(churchSlug, {
    q: pickSingle(filters.q),
    status: pickSingle(filters.status),
  });

  return (
    <div className="space-y-6">
      <WorkspaceHero
        title={t.pages.departments.title}
        description={t.pages.departments.description}
      />
      <DepartmentsWorkspaceUnified churchSlug={churchSlug} data={data} />
    </div>
  );
}
