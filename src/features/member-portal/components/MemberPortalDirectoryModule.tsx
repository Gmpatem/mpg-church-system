import {
  WorkspaceEmptyState,
  WorkspaceSectionCard,
  WorkspaceStatCard,
} from "@/components/workspace";
import type { MemberPortalDepartmentsData } from "@/features/member-portal/types";
import { MemberPortalChipRow } from "./MemberPortalChipRow";
import { MemberPortalModuleHero } from "./MemberPortalModuleHero";
import { formatDate } from "./memberPortalUiUtils";

type MemberPortalDirectoryModuleProps = {
  data: MemberPortalDepartmentsData;
};

function statusBadge(active: boolean) {
  return active
    ? "rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700"
    : "rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600";
}

export function MemberPortalDirectoryModule({
  data,
}: MemberPortalDirectoryModuleProps) {
  return (
    <div className="space-y-4 sm:space-y-6">
      <MemberPortalModuleHero
        eyebrow="Member Directory"
        title="Find Your Church Teams"
        description="View your church roles, departments, and service assignments in one place."
        badges={[
          `${data.activeRoleCount} active roles`,
          `${data.activeDepartmentCount} active departments`,
        ]}
      />

      <div className="rounded-2xl border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
        Directory visibility follows church privacy rules.
      </div>

      <MemberPortalChipRow
        chips={[
          { label: "All Assignments", active: true },
          { label: "Roles" },
          { label: "Departments" },
          { label: "Active" },
          { label: "Inactive" },
        ]}
      />

      <div className="mobile-stagger grid grid-cols-2 gap-3 md:grid-cols-4">
        <WorkspaceStatCard
          label="Active Roles"
          value={String(data.activeRoleCount)}
          hint="Current church roles"
          valueClassName="text-xl md:text-2xl"
        />
        <WorkspaceStatCard
          label="Past Roles"
          value={String(data.inactiveRoleCount)}
          hint="Ended role records"
          valueClassName="text-xl md:text-2xl"
        />
        <WorkspaceStatCard
          label="Active Teams"
          value={String(data.activeDepartmentCount)}
          hint="Current assignments"
          valueClassName="text-xl md:text-2xl"
        />
        <WorkspaceStatCard
          label="Past Teams"
          value={String(data.inactiveDepartmentCount)}
          hint="Inactive assignments"
          valueClassName="text-xl md:text-2xl"
        />
      </div>

      <WorkspaceSectionCard
        title="Church Roles"
        description="Formal roles assigned to your member account."
        contentClassName="space-y-3"
      >
        {data.roles.length > 0 ? (
          data.roles.map((role) => (
            <div key={role.id} className="mobile-touch-feedback rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-slate-900">{role.roleName}</p>
                  <p className="text-sm text-slate-500">
                    Code: {role.roleCode || "Not set"}
                  </p>
                </div>
                <span className={statusBadge(role.isActive)}>
                  {role.isActive ? "Active" : "Inactive"}
                </span>
              </div>
              <div className="mt-3 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
                <p>Start: {formatDate(role.startDate)}</p>
                <p>End: {formatDate(role.endDate)}</p>
              </div>
              {role.roleDescription?.trim() ? (
                <p className="mt-2 text-sm text-slate-600">{role.roleDescription}</p>
              ) : null}
              {role.notes?.trim() ? (
                <p className="mt-2 text-sm text-slate-500">{role.notes}</p>
              ) : null}
            </div>
          ))
        ) : (
          <WorkspaceEmptyState
            title="No role assignments"
            message="You do not have any role assignments linked yet."
            className="min-h-[160px]"
          />
        )}
      </WorkspaceSectionCard>

      <WorkspaceSectionCard
        title="Departments"
        description="Your active and past department assignments."
        contentClassName="space-y-3"
      >
        {data.departments.length > 0 ? (
          data.departments.map((department) => (
            <div
              key={department.id}
              className="mobile-touch-feedback rounded-2xl border border-slate-200 bg-white p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-slate-900">{department.departmentName}</p>
                  <p className="text-sm text-slate-500">
                    Code: {department.departmentCode ?? "Not set"}
                  </p>
                </div>
                <span className={statusBadge(department.isActive)}>
                  {department.isActive ? "Active" : "Inactive"}
                </span>
              </div>
              <div className="mt-3 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
                <p>Role: {department.roleTitle?.trim() ? department.roleTitle : "Not set"}</p>
                <p>Start: {formatDate(department.startDate)}</p>
              </div>
            </div>
          ))
        ) : (
          <WorkspaceEmptyState
            title="No department assignments"
            message="You do not have any department assignments linked yet."
            className="min-h-[160px]"
          />
        )}
      </WorkspaceSectionCard>

    </div>
  );
}
