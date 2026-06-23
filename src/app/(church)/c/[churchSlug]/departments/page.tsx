import { DepartmentsWorkspace } from "./components/DepartmentsWorkspace";
import { getDepartmentsUnifiedWorkspaceData } from "./components/adapters";
import { departmentTabKeys, type DepartmentTabKey } from "./components/types";

interface DepartmentsPageProps {
  params: Promise<{ churchSlug: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

function pickSingle(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value ?? "";
}

function parseInitialTab(value: string): DepartmentTabKey {
  return departmentTabKeys.includes(value as DepartmentTabKey)
    ? (value as DepartmentTabKey)
    : "overview";
}

export default async function DepartmentsPage({
  params,
  searchParams,
}: DepartmentsPageProps) {
  const { churchSlug } = await params;
  const filters = (await searchParams) ?? {};
  const initialTab = parseInitialTab(pickSingle(filters.tab));
  const selectedDepartmentId = pickSingle(filters.department) || pickSingle(filters.departmentId);

  const data = await getDepartmentsUnifiedWorkspaceData({
    churchSlug,
    departmentId: selectedDepartmentId || undefined,
  });

  return (
    <div className="min-w-0">
      <DepartmentsWorkspace
        churchSlug={churchSlug}
        data={data}
        initialTab={initialTab}
      />
    </div>
  );
}
