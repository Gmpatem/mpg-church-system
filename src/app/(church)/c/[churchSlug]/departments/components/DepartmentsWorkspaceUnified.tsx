"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  WorkspaceControlRail,
  WorkspaceEmptyState,
  WorkspaceHero,
  WorkspaceSectionCard,
  WorkspaceStatCard,
} from "@/components/workspace";
import { MobileBottomSheet } from "@/components/mobile/MobileBottomSheet";
import { MobileCompactStatsStrip } from "@/components/mobile/MobileCompactStatsStrip";
import { MobilePageHeader } from "@/components/mobile/MobilePageHeader";
import { DepartmentForm } from "@/features/departments/components/DepartmentForm";
import { createDepartmentAction } from "@/features/departments/actions";

interface DepartmentsWorkspaceUnifiedProps {
  churchSlug: string;
  data: {
    church: {
      id: string;
      slug: string;
      name: string;
    };
    filters: {
      q?: string;
      status?: string;
    };
    stats: {
      totalDepartments: number;
      activeDepartments: number;
      inactiveDepartments: number;
      assignedMembers: number;
      unassignedDepartments: number;
      eventLinkedDepartments: number;
    };
    departments: Array<{
      id: string;
      department_name: string;
      code?: string | null;
      description?: string | null;
      is_active: boolean;
      member_count: number;
      active_member_count: number;
      inactive_member_count: number;
      event_count: number;
    }>;
    assignments: Array<{
      member_id: string;
      member_name: string;
      department_name: string;
      role_title?: string | null;
      is_active: boolean;
      start_date?: string | null;
    }>;
  };
}

function DepartmentStatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={
        active
          ? "rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800"
          : "rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700"
      }
    >
      {active ? "active" : "inactive"}
    </span>
  );
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function DepartmentsRegistry({
  churchSlug,
  rows,
  selectedDepartmentId,
  onSelectDepartment,
}: {
  churchSlug: string;
  rows: DepartmentsWorkspaceUnifiedProps["data"]["departments"];
  selectedDepartmentId: string | null;
  onSelectDepartment: (departmentId: string) => void;
}) {
  return (
    <WorkspaceSectionCard
      title="Department Registry"
      description="Ministry and operational departments with staffing and activity visibility."
      contentClassName="p-0"
    >
      {rows.length === 0 ? (
        <div className="p-5">
          <WorkspaceEmptyState
            title="No departments found"
            message="There are no departments matching the current filters. Create one to activate this workspace."
            actionLabel="New Department"
            actionHref={`/c/${churchSlug}/departments/new`}
          />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 p-3 md:hidden">
            {rows.map((department) => {
              const isSelected = department.id === selectedDepartmentId;
              return (
                <div
                  key={department.id}
                  className={
                    isSelected
                      ? "rounded-2xl border border-blue-200 bg-blue-50/60 p-3"
                      : "rounded-2xl border border-slate-200 bg-white p-3"
                  }
                >
                  <Link
                      href={`/c/${churchSlug}/departments/${department.id}/operations`}
                      className="mobile-touch-feedback inline-flex min-h-[44px] items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-2 text-xs font-medium text-emerald-800 transition hover:bg-emerald-100"
                    >
                      Operations
                    </Link>
                    <button type="button" onClick={() => onSelectDepartment(department.id)}
                    className="w-full text-left"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-semibold text-slate-900">{department.department_name}</p>
                      <DepartmentStatusBadge active={department.is_active} />
                    </div>
                    <p className="mt-1 text-xs text-slate-500">{department.code || "No code"}</p>
                    <p className="mt-2 text-xs text-slate-600">
                      Members: {department.member_count} • Events: {department.event_count}
                    </p>
                  </button>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <Link
                      href={`/c/${churchSlug}/departments/${department.id}`}
                      className="mobile-touch-feedback inline-flex min-h-[44px] items-center justify-center rounded-lg border border-slate-200 bg-white px-2 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                    >
                      View
                    </Link>
                    <button
                      type="button"
                      onClick={() => onSelectDepartment(department.id)}
                      className="mobile-touch-feedback inline-flex min-h-[44px] items-center justify-center rounded-lg border border-blue-200 bg-blue-50 px-2 py-2 text-xs font-medium text-blue-700 transition hover:bg-blue-100"
                    >
                      Details
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="hidden overflow-x-auto md:block">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Department</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Members</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Assignments</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Events</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {rows.map((department) => {
                  const isSelected = department.id === selectedDepartmentId;

                  return (
                    <tr key={department.id} className={isSelected ? "bg-blue-50/50" : undefined}>
                      <td className="px-4 py-3.5">
                        <Link
                      href={`/c/${churchSlug}/departments/${department.id}/operations`}
                      className="mobile-touch-feedback inline-flex min-h-[44px] items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-2 text-xs font-medium text-emerald-800 transition hover:bg-emerald-100"
                    >
                      Operations
                    </Link>
                    <button type="button" onClick={() => onSelectDepartment(department.id)}
                          className="text-left"
                        >
                          <p className="text-sm font-semibold text-slate-900">{department.department_name}</p>
                          <p className="mt-0.5 text-xs text-slate-500">{department.code || "No code"}</p>
                        </button>
                      </td>
                      <td className="px-4 py-3.5">
                        <DepartmentStatusBadge active={department.is_active} />
                      </td>
                      <td className="px-4 py-3.5 text-sm text-slate-600">{department.member_count}</td>
                      <td className="px-4 py-3.5 text-sm text-slate-600">
                        <span className="font-medium text-slate-800">{department.active_member_count}</span> active
                        {department.inactive_member_count > 0 ? ` / ${department.inactive_member_count} inactive` : ""}
                      </td>
                      <td className="px-4 py-3.5 text-sm text-slate-600">{department.event_count}</td>
                      <td className="px-4 py-3.5">
                        <div className="flex justify-end gap-2">
                          <a
                            href={`/c/${churchSlug}/departments/${department.id}`}
                            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                          >
                            View
                          </a>
                          <a
                            href={`/c/${churchSlug}/departments/${department.id}?tab=overview`}
                            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                          >
                            Edit
                          </a>
                          <button
                            type="button"
                            onClick={() => onSelectDepartment(department.id)}
                            className="rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-xs font-medium text-blue-700 transition hover:bg-blue-100"
                          >
                      Details
                    </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </WorkspaceSectionCard>
  );
}

function DepartmentSidebar({
  selectedDepartment,
  assignments,
  stats,
  departments,
}: {
  selectedDepartment: DepartmentsWorkspaceUnifiedProps["data"]["departments"][number] | null;
  assignments: DepartmentsWorkspaceUnifiedProps["data"]["assignments"];
  stats: DepartmentsWorkspaceUnifiedProps["data"]["stats"];
  departments: DepartmentsWorkspaceUnifiedProps["data"]["departments"];
}) {
  const selectedAssignments = selectedDepartment
    ? assignments.filter((assignment) => assignment.department_name === selectedDepartment.department_name).slice(0, 6)
    : [];
  const quietDepartments = departments.filter((department) => department.event_count === 0).slice(0, 6);
  const unstaffedDepartments = departments.filter((department) => department.member_count === 0).slice(0, 6);

  return (
    <aside className="space-y-5">
      <WorkspaceSectionCard
        title="Department Detail"
        description="Selected department profile and assignment context."
      >
        {selectedDepartment ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <p className="text-base font-semibold text-slate-900">{selectedDepartment.department_name}</p>
              <DepartmentStatusBadge active={selectedDepartment.is_active} />
            </div>
            <p className="text-sm text-slate-600">{selectedDepartment.description || "No description provided."}</p>

            <dl className="space-y-2 text-sm text-slate-700">
              <div className="flex items-center justify-between">
                <dt className="text-slate-500">Code</dt>
                <dd className="font-medium text-slate-800">{selectedDepartment.code || "-"}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-slate-500">Members</dt>
                <dd className="font-medium text-slate-800">{selectedDepartment.member_count}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-slate-500">Active assignments</dt>
                <dd className="font-medium text-slate-800">{selectedDepartment.active_member_count}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-slate-500">Linked events</dt>
                <dd className="font-medium text-slate-800">{selectedDepartment.event_count}</dd>
              </div>
            </dl>

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Recent assignments</p>
              {selectedAssignments.length > 0 ? (
                <div className="space-y-2">
                  {selectedAssignments.map((assignment, index) => (
                    <div
                      key={`${assignment.member_id}-${assignment.department_name}-${index}`}
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    >
                      <p className="font-medium text-slate-800">{assignment.member_name}</p>
                      <p className="text-xs text-slate-500">
                        {assignment.role_title || "Role not set"} • {formatDate(assignment.start_date)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500">No assignments currently linked to this department.</p>
              )}
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-500">Select a department from the table to view details.</p>
        )}
      </WorkspaceSectionCard>

      <WorkspaceSectionCard
        title="Department Snapshot"
        description="Quick oversight for staffing and activity."
      >
        <div className="space-y-3">
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700">
            Active departments: <span className="font-semibold text-slate-900">{stats.activeDepartments}</span> / {stats.totalDepartments}
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700">
            Unassigned departments: <span className="font-semibold text-slate-900">{stats.unassignedDepartments}</span>
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Unstaffed</p>
            {unstaffedDepartments.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {unstaffedDepartments.map((department) => (
                  <span
                    key={`unstaffed-${department.id}`}
                    className="rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-800"
                  >
                    {department.department_name}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">All visible departments have assignments.</p>
            )}
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Quiet departments</p>
            {quietDepartments.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {quietDepartments.map((department) => (
                  <span
                    key={`quiet-${department.id}`}
                    className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800"
                  >
                    {department.department_name}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">All departments have linked events.</p>
            )}
          </div>
        </div>
      </WorkspaceSectionCard>
    </aside>
  );
}

export function DepartmentsWorkspaceUnified({
  churchSlug,
  data,
}: DepartmentsWorkspaceUnifiedProps) {
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string | null>(
    data.departments[0]?.id ?? null
  );
  const [createSheetOpen, setCreateSheetOpen] = useState(false);
  const [detailSheetOpen, setDetailSheetOpen] = useState(false);

  const selectedDepartment = useMemo(
    () => data.departments.find((department) => department.id === selectedDepartmentId) ?? data.departments[0] ?? null,
    [data.departments, selectedDepartmentId]
  );

  const activeFilterLabel = useMemo(() => {
    if (data.filters.q || data.filters.status) return "Filtered view active";
    return "Live workspace";
  }, [data.filters]);

  function handleSelectDepartment(departmentId: string) {
    setSelectedDepartmentId(departmentId);

    if (typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches) {
      setDetailSheetOpen(true);
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3 md:hidden">
        <MobilePageHeader
          title="Departments"
          subtitle={`Active: ${data.stats.activeDepartments} • Total: ${data.stats.totalDepartments}`}
          actionLabel="Add Department"
          onActionClick={() => setCreateSheetOpen(true)}
        />

        <form method="get" action={`/c/${churchSlug}/departments`} className="flex items-center gap-2">
          <input
            name="q"
            defaultValue={data.filters.q ?? ""}
            placeholder="Search departments"
            className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          />
          <button
            type="submit"
            className="mobile-touch-feedback inline-flex min-h-[44px] shrink-0 items-center justify-center rounded-xl bg-slate-950 px-3 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            Search
          </button>
        </form>

        <MobileCompactStatsStrip
          items={[
            { label: "Departments", value: data.stats.totalDepartments },
            { label: "Active", value: data.stats.activeDepartments, tone: "success" },
            { label: "Members", value: data.stats.assignedMembers },
            { label: "Unassigned", value: data.stats.unassignedDepartments, tone: "attention" },
          ]}
        />
      </div>

      <WorkspaceHero
        size="compact"
        eyebrow="Departments Workspace"
        title="Church Departments Workspace"
        description="Manage ministry departments, review assignments, and monitor department health from one unified workspace."
        badges={[
          activeFilterLabel,
          `${data.stats.totalDepartments} departments`,
          `${data.stats.assignedMembers} assigned members`,
        ]}
        actions={[
          { label: "New Department", href: `/c/${churchSlug}/departments/new`, variant: "primary" },
          { label: "Members", href: `/c/${churchSlug}/members`, variant: "secondary" },
          { label: "Reports", href: `/c/${churchSlug}/reports`, variant: "outline" },
        ]}
        className="hidden md:block"
      />

      <div className="hidden md:grid grid-cols-4 gap-3 xl:grid-cols-6">
        <WorkspaceStatCard label="Departments" value={data.stats.totalDepartments} hint="Visible department records" />
        <WorkspaceStatCard label="Active" value={data.stats.activeDepartments} hint="Active ministries or units" />
        <WorkspaceStatCard label="Inactive" value={data.stats.inactiveDepartments} hint="Inactive department records" />
        <WorkspaceStatCard label="Assigned Members" value={data.stats.assignedMembers} hint="Current assignment footprint" />
        <WorkspaceStatCard label="Unassigned Depts" value={data.stats.unassignedDepartments} hint="No member assignments yet" />
        <WorkspaceStatCard label="Event Linked" value={data.stats.eventLinkedDepartments} hint="Connected to church events" />
      </div>

      <WorkspaceControlRail className="md:hidden" title="Filters">
        <form method="get" action={`/c/${churchSlug}/departments`} className="grid grid-cols-2 gap-2">
          <select
            name="status"
            defaultValue={data.filters.status ?? ""}
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          >
            <option value="">All</option>
            <option value="active">Active only</option>
            <option value="inactive">Inactive only</option>
          </select>

          <button
            type="submit"
            className="mobile-touch-feedback inline-flex min-h-[44px] items-center justify-center rounded-xl bg-slate-950 px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            Apply
          </button>
        </form>
      </WorkspaceControlRail>

      <WorkspaceControlRail
        title="Department Filters"
        description="Search and narrow the departments workspace without leaving the page."
        className="hidden md:block"
      >
        <form
          method="get"
          action={`/c/${churchSlug}/departments`}
          className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_220px_auto]"
        >
          <div>
            <label htmlFor="q" className="mb-1 block text-sm font-medium text-slate-700">
              Search
            </label>
            <input
              id="q"
              name="q"
              defaultValue={data.filters.q ?? ""}
              placeholder="Search by department name, code, or description"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            />
          </div>

          <div>
            <label htmlFor="status" className="mb-1 block text-sm font-medium text-slate-700">
              Status
            </label>
            <select
              id="status"
              name="status"
              defaultValue={data.filters.status ?? ""}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            >
              <option value="">All</option>
              <option value="active">Active only</option>
              <option value="inactive">Inactive only</option>
            </select>
          </div>

          <div className="flex items-end gap-2">
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-lg bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              Apply
            </button>

            <a
              href={`/c/${churchSlug}/departments`}
              className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Reset
            </a>
          </div>
        </form>
      </WorkspaceControlRail>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.7fr)_380px]">
        <DepartmentsRegistry
          churchSlug={churchSlug}
          rows={data.departments}
          selectedDepartmentId={selectedDepartment?.id ?? null}
          onSelectDepartment={handleSelectDepartment}
        />
        <div className="hidden md:block">
          <DepartmentSidebar
            selectedDepartment={selectedDepartment}
            assignments={data.assignments}
            stats={data.stats}
            departments={data.departments}
          />
        </div>
      </div>

      <MobileBottomSheet
        open={createSheetOpen}
        onOpenChange={setCreateSheetOpen}
        title="Add Department"
      >
        <DepartmentForm
          churchSlug={churchSlug}
          action={createDepartmentAction}
          submitLabel="Add Department"
          onSuccess={() => setCreateSheetOpen(false)}
        />
      </MobileBottomSheet>

      <MobileBottomSheet
        open={detailSheetOpen}
        onOpenChange={setDetailSheetOpen}
        title="Department Details"
      >
        <DepartmentSidebar
          selectedDepartment={selectedDepartment}
          assignments={data.assignments}
          stats={data.stats}
          departments={data.departments}
        />
      </MobileBottomSheet>
    </div>
  );
}
