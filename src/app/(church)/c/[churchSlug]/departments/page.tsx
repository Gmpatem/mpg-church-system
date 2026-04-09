import { getDepartmentsWorkspaceData } from "@/features/departments/queries";
import { DepartmentsWorkspaceUnified } from "./components/DepartmentsWorkspaceUnified";
import { WorkspaceHero } from "@/components/workspace";

interface DepartmentsPageProps {
  params: Promise<{ churchSlug: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

function pickSingle(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value ?? "";
}

export default async function DepartmentsPage({
  params,
  searchParams,
}: DepartmentsPageProps) {
  const { churchSlug } = await params;
  const filters = (await searchParams) ?? {};

  const data = await getDepartmentsWorkspaceData(churchSlug, {
    q: pickSingle(filters.q),
    status: pickSingle(filters.status),
  });

  return (
    <div className="space-y-6">
      <WorkspaceHero
        title="Departments"
        description="Manage ministry departments and member assignments."
      />
      <DepartmentsWorkspaceUnified churchSlug={churchSlug} data={data} />
    </div>
  );
}




