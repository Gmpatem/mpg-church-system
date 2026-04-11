import Link from "next/link";
import { Breadcrumb } from "@/components/navigation/Breadcrumb";
import {
  WorkspaceControlRail,
  WorkspaceHero,
  WorkspaceSectionCard,
  WorkspaceStatCard,
} from "@/components/workspace";
import { DepartmentForm } from "@/app/(church)/c/[churchSlug]/departments/new/DepartmentForm";
import { DepartmentMembers } from "./DepartmentMembers";
import { AssignMemberToDepartment } from "./AssignMemberToDepartment";
import {
  getDepartmentById,
  getDepartmentMembers,
  getDepartmentOptions,
} from "@/features/departments/queries";
import { updateDepartmentAction } from "@/features/departments/actions";
import { getPublishedEvents } from "@/features/calendar/queries";
import { requireChurchAccess } from "@/features/access/queries";
import { CalendarView } from "@/components/shared/CalendarView";

interface DepartmentDetailPageProps {
  params: Promise<{ churchSlug: string; departmentId: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

const TABS = ["overview", "members", "leadership", "events", "assignments"] as const;
type DepartmentDetailTab = (typeof TABS)[number];

function pickSingle(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value ?? "";
}

function isDepartmentDetailTab(value: string): value is DepartmentDetailTab {
  return (TABS as readonly string[]).includes(value);
}

function roleLooksLikeLeadership(roleTitle?: string | null) {
  if (!roleTitle) return false;
  const value = roleTitle.toLowerCase();
  return [
    "leader",
    "head",
    "director",
    "coordinator",
    "pastor",
    "elder",
    "captain",
    "chair",
    "manager",
    "supervisor",
  ].some((keyword) => value.includes(keyword));
}

export default async function DepartmentDetailPage({ params, searchParams }: DepartmentDetailPageProps) {
  const { churchSlug, departmentId } = await params;
  const query = (await searchParams) ?? {};
  const q = pickSingle(query.q);
  const status = pickSingle(query.status);
  const rawTab = pickSingle(query.tab);
  const tab: DepartmentDetailTab = isDepartmentDetailTab(rawTab) ? rawTab : "overview";

  const ctx = await requireChurchAccess(churchSlug);

  const [department, assignments, options, deptEvents] = await Promise.all([
    getDepartmentById(churchSlug, departmentId),
    getDepartmentMembers(churchSlug, departmentId, { q, status }),
    getDepartmentOptions(churchSlug),
    getPublishedEvents(ctx.churchId, departmentId),
  ]);

  if (!department) {
    return (
      <div className="rounded-xl border border-dashed border-red-300 bg-red-50 px-6 py-10 text-sm text-red-700">
        Department not found.
      </div>
    );
  }

  const activeAssignments = assignments.filter((item) => item.is_active);
  const leadershipAssignments = assignments.filter((item) => roleLooksLikeLeadership(item.role_title));

  const statusFilter = status === "active" || status === "inactive" ? status : "";
  const tabs: Array<{ key: DepartmentDetailTab; label: string }> = [
    { key: "overview", label: "Overview" },
    { key: "members", label: "Members" },
    { key: "leadership", label: "Leadership" },
    { key: "events", label: "Events" },
    { key: "assignments", label: "Assignments" },
  ];

  function buildTabHref(nextTab: DepartmentDetailTab) {
    const params = new URLSearchParams();
    params.set("tab", nextTab);
    if (q) params.set("q", q);
    if (statusFilter) params.set("status", statusFilter);
    return `/c/${churchSlug}/departments/${departmentId}?${params.toString()}`;
  }

  const resetFilterHref = `/c/${churchSlug}/departments/${departmentId}?tab=${tab}`;

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: "Departments", href: `/c/${churchSlug}/departments` },
          { label: department.department_name },
        ]}
      />
      <WorkspaceHero
        size="compact"
        eyebrow="Department Workspace"
        title={department.department_name}
        description="Operational department workspace for members, leadership, events, and assignments."
        badges={[
          department.is_active ? "Active" : "Inactive",
          `${activeAssignments.length} active assignments`,
          `${deptEvents.length} events`,
        ]}
        actions={[
          { label: "Department Events", href: `/c/${churchSlug}/departments/${departmentId}/events`, variant: "secondary" },
          { label: "Announcements", href: `/c/${churchSlug}/departments/${departmentId}/announcements`, variant: "outline" },
          { label: "Back to Departments", href: `/c/${churchSlug}/departments`, variant: "outline" },
        ]}
      />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <WorkspaceStatCard
          label="Status"
          value={department.is_active ? "Active" : "Inactive"}
        />
        <WorkspaceStatCard
          label="Code"
          value={department.code ?? "-"}
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

      <div className="rounded-lg border border-slate-200 bg-white p-2">
        <div className="flex flex-wrap gap-1.5">
          {tabs.map((item) => (
            <Link
              key={item.key}
              href={buildTabHref(item.key)}
              className={
                item.key === tab
                  ? "inline-flex items-center rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white"
                  : "inline-flex items-center rounded-md px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
              }
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>

      {tab === "overview" ? (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
          <WorkspaceSectionCard
            title="Department Profile"
            description="Edit department settings and operational metadata."
          >
            <DepartmentForm
              churchSlug={churchSlug}
              action={updateDepartmentAction}
              initialValues={department}
              submitLabel="Save Department"
              pendingLabel="Saving..."
              showHeader={false}
              cancelHref={buildTabHref("overview")}
            />
          </WorkspaceSectionCard>

          <WorkspaceSectionCard
            title="Operational Summary"
            description="Quick ministry health and staffing overview."
          >
            <div className="space-y-3 text-sm text-slate-700">
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
                Leadership assignments:{" "}
                <span className="font-semibold text-slate-900">{leadershipAssignments.length}</span>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
                Inactive assignments:{" "}
                <span className="font-semibold text-slate-900">{assignments.length - activeAssignments.length}</span>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
                Upcoming/approved events:{" "}
                <span className="font-semibold text-slate-900">{deptEvents.length}</span>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
                Department code: <span className="font-semibold text-slate-900">{department.code || "-"}</span>
              </div>
            </div>
          </WorkspaceSectionCard>
        </div>
      ) : null}

      {(tab === "members" || tab === "leadership" || tab === "assignments") ? (
        <WorkspaceControlRail
          title="Filters"
          description="Narrow assignment records by status or search text."
        >
          <form
            method="get"
            action={`/c/${churchSlug}/departments/${departmentId}`}
            className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_220px_auto]"
          >
            <input type="hidden" name="tab" value={tab} />
            <div>
              <label htmlFor="q" className="mb-1 block text-sm font-medium text-slate-700">
                Search
              </label>
              <input
                id="q"
                name="q"
                defaultValue={q}
                placeholder="Member name, member code, email, role"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="status" className="mb-1 block text-sm font-medium text-slate-700">
                Assignment Status
              </label>
              <select
                id="status"
                name="status"
                defaultValue={statusFilter}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Any</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div className="flex items-end gap-2">
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-md bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
              >
                Apply
              </button>
              <Link
                href={resetFilterHref}
                className="inline-flex items-center justify-center rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Reset
              </Link>
            </div>
          </form>
        </WorkspaceControlRail>
      ) : null}

      {tab === "members" ? (
        <WorkspaceSectionCard
          title="Department Members"
          description="Registry of all member assignments in this department."
        >
          <DepartmentMembers churchSlug={churchSlug} assignments={assignments} />
        </WorkspaceSectionCard>
      ) : null}

      {tab === "leadership" ? (
        <WorkspaceSectionCard
          title="Leadership"
          description="Leadership-focused subset derived from current role titles."
        >
          <DepartmentMembers churchSlug={churchSlug} assignments={leadershipAssignments} />
        </WorkspaceSectionCard>
      ) : null}

      {tab === "events" ? (
        <div className="space-y-5">
          <WorkspaceSectionCard
            title="Department Events"
            description="Upcoming approved events for this department."
          >
            <CalendarView
              events={deptEvents.map((e) => ({
                id: e.id,
                title: e.title,
                start: e.start,
                end: e.end,
                event_type: e.event_type,
                location: e.location,
                is_all_day: e.is_all_day,
              }))}
              showViewToggle={true}
              emptyMessage="No upcoming events for this department."
            />
          </WorkspaceSectionCard>
          <WorkspaceSectionCard
            title="Event & Announcement Workflows"
            description="Open dedicated department routes for full event and announcement operations."
          >
            <div className="flex flex-wrap gap-2">
              <Link
                href={`/c/${churchSlug}/departments/${departmentId}/events`}
                className="inline-flex items-center rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Open Department Events Route
              </Link>
              <Link
                href={`/c/${churchSlug}/departments/${departmentId}/announcements`}
                className="inline-flex items-center rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Open Department Announcements Route
              </Link>
            </div>
          </WorkspaceSectionCard>
        </div>
      ) : null}

      {tab === "assignments" ? (
        <div className="space-y-5">
          <WorkspaceSectionCard
            title="Add Assignment"
            description="Assign members to this department and set role/start metadata."
          >
            <AssignMemberToDepartment
              churchSlug={churchSlug}
              departmentId={departmentId}
              members={options.members}
              departments={options.departments}
              existingActiveMemberIds={activeAssignments.map((item) => item.member_id)}
            />
          </WorkspaceSectionCard>
          <WorkspaceSectionCard
            title="Assignment Queue"
            description="Review and update assignment records from a table-first workflow."
          >
            <DepartmentMembers churchSlug={churchSlug} assignments={assignments} />
          </WorkspaceSectionCard>
        </div>
      ) : null}
    </div>
  );
}

