import Link from "next/link";
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
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{department.department_name}</h2>
          <p className="mt-1 text-sm text-gray-600">
            Department detail, membership, role assignments, events, and announcements.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/c/${churchSlug}/departments/${departmentId}/events`}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            Events
          </Link>

          <Link
            href={`/c/${churchSlug}/departments/${departmentId}/announcements`}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            Announcements
          </Link>

          <Link
            href={`/c/${churchSlug}/departments`}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            Back to Departments
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="text-xs uppercase tracking-wide text-gray-500">Status</div>
          <div className="mt-2 text-lg font-semibold text-gray-900">
            {department.is_active ? "Active" : "Inactive"}
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="text-xs uppercase tracking-wide text-gray-500">Code</div>
          <div className="mt-2 text-lg font-semibold text-gray-900">{department.code ?? "—"}</div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="text-xs uppercase tracking-wide text-gray-500">Active Members</div>
          <div className="mt-2 text-lg font-semibold text-gray-900">{activeAssignments.length}</div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="text-xs uppercase tracking-wide text-gray-500">Total Assignments</div>
          <div className="mt-2 text-lg font-semibold text-gray-900">{assignments.length}</div>
        </div>
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


