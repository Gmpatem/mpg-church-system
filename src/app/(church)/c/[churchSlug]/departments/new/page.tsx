import Link from "next/link";
import { createDepartmentAction } from "@/features/departments/actions";
import { DepartmentForm } from "@/features/departments/components/DepartmentForm";

interface NewDepartmentPageProps {
  params: Promise<{ churchSlug: string }>;
}

export default async function NewDepartmentPage({ params }: NewDepartmentPageProps) {
  const { churchSlug } = await params;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Create Department</h2>
          <p className="mt-1 text-sm text-slate-600">
            Add a new operational department for this church.
          </p>
        </div>

        <Link
          href={`/c/${churchSlug}/departments`}
          className="inline-flex items-center rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          Back to Departments
        </Link>
      </div>

      <DepartmentForm churchSlug={churchSlug} action={createDepartmentAction} submitLabel="Create Department" />
    </div>
  );
}
