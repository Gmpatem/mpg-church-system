"use client";

import { useMemo, useState } from "react";
import {
  WorkspaceControlRail,
  WorkspaceEmptyState,
  WorkspaceHero,
  WorkspaceSectionCard,
  WorkspaceStatCard,
  WorkspaceTabs,
  type WorkspaceTabItem,
} from "@/components/workspace";

type DepartmentsTab = "departments" | "assignments" | "health";

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

const DEPARTMENT_TABS: WorkspaceTabItem[] = [
  { key: "departments", label: "Departments" },
  { key: "assignments", label: "Assignments" },
  { key: "health", label: "Department Health", shortLabel: "Health" },
];

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
}: {
  churchSlug: string;
  rows: DepartmentsWorkspaceUnifiedProps["data"]["departments"];
}) {
  return (
    <WorkspaceSectionCard
      title="Department Registry"
      description="Ministry and operational departments with staffing and activity visibility."
    >
      {rows.length === 0 ? (
        <WorkspaceEmptyState
          title="No departments found"
          message="There are no departments matching the current filters. Create one to activate this workspace."
          actionLabel="New Department"
          actionHref={`/c/${churchSlug}/departments/new`}
        />
      ) : (
        <div className="mobile-stagger space-y-3">
          {rows.map((department) => (
            <div
              key={department.id}
              className="mobile-touch-feedback rounded-xl border border-slate-200 px-4 py-4"
            >
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-slate-950">
                      {department.department_name}
                    </p>
                    <DepartmentStatusBadge active={department.is_active} />
                  </div>

                  <p className="mt-1 text-sm text-slate-600">
                    {department.code || "No code"}
                    {department.description ? ` • ${department.description}` : ""}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-800">
                      {department.member_count} total members
                    </span>
                    <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800">
                      {department.active_member_count} active assignments
                    </span>
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700">
                      {department.inactive_member_count} inactive assignments
                    </span>
                    <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800">
                      {department.event_count} linked events
                    </span>
                  </div>
                </div>

                <div className="flex shrink-0 flex-wrap gap-2">
                  <a
                    href={`/c/${churchSlug}/departments/${department.id}`}
                    className="mobile-touch-feedback rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    View
                  </a>
                  <a
                    href={`/c/${churchSlug}/departments/${department.id}/edit`}
                    className="mobile-touch-feedback rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    Edit
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </WorkspaceSectionCard>
  );
}

function AssignmentsPanel({
  rows,
}: {
  rows: DepartmentsWorkspaceUnifiedProps["data"]["assignments"];
}) {
  return (
    <WorkspaceSectionCard
      title="Department Assignments"
      description="Current member-to-department assignment view across the church workspace."
    >
      {rows.length === 0 ? (
        <WorkspaceEmptyState
          title="No assignments yet"
          message="Assignments will appear here after members are linked to departments."
          className="min-h-[220px]"
        />
      ) : (
        <div className="mobile-stagger space-y-3">
          {rows.map((assignment, index) => (
            <div
              key={`${assignment.member_id}-${assignment.department_name}-${index}`}
              className="flex flex-col gap-3 rounded-xl border border-slate-200 px-4 py-3 xl:flex-row xl:items-center xl:justify-between"
            >
              <div>
                <p className="text-sm font-semibold text-slate-950">
                  {assignment.member_name}
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  {assignment.department_name}
                  {assignment.role_title ? ` • ${assignment.role_title}` : ""}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Start date: {formatDate(assignment.start_date)}
                </p>
              </div>

              <DepartmentStatusBadge active={assignment.is_active} />
            </div>
          ))}
        </div>
      )}
    </WorkspaceSectionCard>
  );
}

function HealthPanel({
  stats,
  departments,
}: {
  stats: DepartmentsWorkspaceUnifiedProps["data"]["stats"];
  departments: DepartmentsWorkspaceUnifiedProps["data"]["departments"];
}) {
  const quietDepartments = departments.filter((department) => department.event_count === 0);
  const unstaffedDepartments = departments.filter((department) => department.member_count === 0);

  return (
    <div className="grid gap-6 2xl:grid-cols-2">
      <WorkspaceSectionCard
        title="Department Health"
        description="High-level ministry and staffing health signals across departments."
      >
        <div className="space-y-3">
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-sm font-semibold text-slate-900">Active departments</p>
            <p className="mt-1 text-sm text-slate-600">
              {stats.activeDepartments} of {stats.totalDepartments} departments are currently active.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-sm font-semibold text-slate-900">Departments without assignments</p>
            <p className="mt-1 text-sm text-slate-600">
              {stats.unassignedDepartments} departments currently have no member assignments.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-sm font-semibold text-slate-900">Event-linked departments</p>
            <p className="mt-1 text-sm text-slate-600">
              {stats.eventLinkedDepartments} departments are already connected to recorded church events.
            </p>
          </div>
        </div>
      </WorkspaceSectionCard>

      <WorkspaceSectionCard
        title="Operational Watchlist"
        description="Quick watch areas for staffing and ministry activity."
      >
        <div className="mobile-stagger space-y-4">
          <div>
            <p className="mb-2 text-sm font-semibold text-slate-900">
              Unstaffed departments
            </p>
            {unstaffedDepartments.length === 0 ? (
              <p className="text-sm text-slate-500">All visible departments have at least one assigned member.</p>
            ) : (
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
            )}
          </div>

          <div>
            <p className="mb-2 text-sm font-semibold text-slate-900">
              Quiet departments
            </p>
            {quietDepartments.length === 0 ? (
              <p className="text-sm text-slate-500">All visible departments have at least one linked event.</p>
            ) : (
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
            )}
          </div>
        </div>
      </WorkspaceSectionCard>
    </div>
  );
}

export function DepartmentsWorkspaceUnified({
  churchSlug,
  data,
}: DepartmentsWorkspaceUnifiedProps) {
  const [activeTab, setActiveTab] = useState<DepartmentsTab>("departments");

  const activeFilterLabel = useMemo(() => {
    if (data.filters.q || data.filters.status) return "Filtered view active";
    return "Live workspace";
  }, [data.filters]);

  return (
    <div className="space-y-5 md:space-y-6">
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
      />

      <div className="mobile-stagger grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-6">
        <WorkspaceStatCard label="Departments" value={data.stats.totalDepartments} hint="Visible department records" />
        <WorkspaceStatCard label="Active" value={data.stats.activeDepartments} hint="Active ministries or units" />
        <WorkspaceStatCard label="Inactive" value={data.stats.inactiveDepartments} hint="Inactive department records" />
        <WorkspaceStatCard label="Assigned Members" value={data.stats.assignedMembers} hint="Current assignment footprint" />
        <WorkspaceStatCard label="Unassigned Depts" value={data.stats.unassignedDepartments} hint="No member assignments yet" />
        <WorkspaceStatCard label="Event Linked" value={data.stats.eventLinkedDepartments} hint="Connected to church events" />
      </div>

      <WorkspaceControlRail
        title="Department Filters"
        description="Search and narrow the departments workspace without leaving the page."
      >
        <form
          method="get"
          action={`/c/${churchSlug}/departments`}
          className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_220px_auto]"
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

          <div className="flex items-end gap-3">
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-xl bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              Apply
            </button>

            <a
              href={`/c/${churchSlug}/departments`}
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Reset
            </a>
          </div>
        </form>
      </WorkspaceControlRail>

      <WorkspaceTabs
        items={DEPARTMENT_TABS}
        activeKey={activeTab}
        onChange={(key) => setActiveTab(key as DepartmentsTab)}
      />

      {activeTab === "departments" ? (
        <DepartmentsRegistry churchSlug={churchSlug} rows={data.departments} />
      ) : null}

      {activeTab === "assignments" ? (
        <AssignmentsPanel rows={data.assignments} />
      ) : null}

      {activeTab === "health" ? (
        <HealthPanel stats={data.stats} departments={data.departments} />
      ) : null}
    </div>
  );
}
