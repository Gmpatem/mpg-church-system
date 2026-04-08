import Link from "next/link";
import { Breadcrumb } from "@/components/navigation/Breadcrumb";
import { WorkspaceStatCard } from "@/components/workspace";
import { DepartmentForm } from "@/features/departments/components/DepartmentForm";
import { DepartmentMembers } from "@/features/departments/components/DepartmentMembers";
import { AssignMemberToDepartment } from "@/features/departments/components/AssignMemberToDepartment";
import {
  getDepartmentById,
  getDepartmentMembers,
  getDepartmentOptions,
} from "@/features/departments/queries";
import { updateDepartmentAction } from "@/features/departments/actions";

interface DepartmentDetailPageProps {
  params: Promise<{ churchSlug: string; departmentId: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export default async function DepartmentDetailPage({ params, searchParams }: DepartmentDetailPageProps) {
  const { churchSlug, departmentId } = await params;
  const filters = (await searchParams) ?? {};

  const [department, assignments, options] = await Promise.all([
    getDepartmentById(churchSlug, departmentId),
    getDepartmentMembers(churchSlug, departmentId, filters),
    getDepartmentOptions(churchSlug),
  ]);

  if (!department) {
    return (
      <div className="rounded-xl border border-dashed border-red-300 bg-red-50 px-6 py-10 text-sm text-red-700">
        Department not found.
      </div>
    );
  }

  const activeAssignments = assignments.filter((item) => item.is_active);

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: "Departments", href: `/c/${churchSlug}/departments` },
          { label: department.department_name },
        ]}
      />
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">{department.department_name}</h2>
          <p className="mt-1 text-sm text-slate-600">
            Department detail, membership, role assignments, events, and announcements.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/c/${churchSlug}/departments/${departmentId}/events`}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Events
          </Link>

          <Link
            href={`/c/${churchSlug}/departments/${departmentId}/announcements`}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Announcements
          </Link>

          <Link
            href={`/c/${churchSlug}/departments`}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Back to Departments
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <WorkspaceStatCard
          label="Status"
          value={department.is_active ? "Active" : "Inactive"}
        />
        <WorkspaceStatCard
          label="Code"
          value={department.code ?? "—"}
        />
        <WorkspaceStatCard
          label="Active Members"
          value={activeAssignments.length}
        />
        <WorkspaceStatCard
          label="Total Assignments"
          value={assignments.length}
        />
      </div>

      <DepartmentForm
        churchSlug={churchSlug}
        action={updateDepartmentAction}
        initialValues={department}
        submitLabel="Update Department"
      />

      <AssignMemberToDepartment
        churchSlug={churchSlug}
        members={options.members}
        departments={options.departments}
      />

      <DepartmentMembers
        churchSlug={churchSlug}
        assignments={assignments}
      />
    </div>
  );
}


