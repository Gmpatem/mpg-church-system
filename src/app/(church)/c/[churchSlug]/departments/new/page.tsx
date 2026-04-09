import { createDepartmentAction } from "@/features/departments/actions";
import { DepartmentForm } from "@/features/departments/components/DepartmentForm";
import { WorkspaceHero } from "@/components/workspace";

interface NewDepartmentPageProps {
  params: Promise<{ churchSlug: string }>;
}

export default async function NewDepartmentPage({ params }: NewDepartmentPageProps) {
  const { churchSlug } = await params;

  return (
    <div className="space-y-6">
      <WorkspaceHero
        title="Create Department"
        description="Add a new ministry or organizational department."
      />

      <DepartmentForm churchSlug={churchSlug} action={createDepartmentAction} submitLabel="Create Department" />
    </div>
  );
}
