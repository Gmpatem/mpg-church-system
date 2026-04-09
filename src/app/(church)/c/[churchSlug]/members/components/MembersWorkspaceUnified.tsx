"use client";

import { useMemo, useState } from "react";
import { createMemberInviteAction } from "@/features/member-invite/actions";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { CopyableLink } from "@/components/ui/CopyableLink";
import { InlineAlert } from "@/components/ui/InlineAlert";
import { ButtonSpinner } from "@/components/ui/ButtonSpinner";
import { WorkspaceControlRail,
  WorkspaceEmptyState,
  WorkspaceHero,
  WorkspaceSectionCard,
  WorkspaceStatCard,
  WorkspaceTabs,
  type WorkspaceTabItem,
} from "@/components/workspace";

type MembersTab = "directory" | "households" | "health";

interface MembersWorkspaceUnifiedProps {
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
      departmentId?: string;
      departmentAssignmentStatus?: string;
    };
    stats: {
      totalMembers: number;
      activeMembers: number;
      inactiveMembers: number;
      visitorMembers: number;
      transferredMembers: number;
      householdsCount: number;
      assignedMembersCount: number;
      unassignedMembersCount: number;
    };
    members: Array<{
      id: string;
      first_name: string;
      last_name: string;
      display_name?: string | null;
      member_code?: string | null;
      membership_status: string;
      phone?: string | null;
      email?: string | null;
      household_id?: string | null;
      household_name?: string | null;
      active_departments?: string[];
      inactive_departments?: string[];
      created_at?: string | null;
    }>;
    departments: Array<{
      id: string;
      name: string;
      code?: string | null;
    }>;
    households: Array<{
      id: string;
      household_name: string;
      member_count: number;
    }>;
    recentMembers: Array<{
      id: string;
      display_name: string;
      membership_status: string;
      created_at?: string | null;
    }>;
  };
}

const MEMBER_TABS: WorkspaceTabItem[] = [
  { key: "directory", label: "Directory" },
  { key: "households", label: "Households" },
  { key: "health", label: "Profile Completeness", shortLabel: "Completeness" },
];

function getMemberLabel(member: MembersWorkspaceUnifiedProps["data"]["members"][number]) {
  return (
    member.display_name ||
    [member.first_name, member.last_name].filter(Boolean).join(" ") ||
    member.member_code ||
    "Member"
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

function MemberInviteButton({
  churchSlug,
  member,
}: {
  churchSlug: string;
  member: MembersWorkspaceUnifiedProps["data"]["members"][number];
}) {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleGenerateInvite() {
    setStatus("loading");
    setErrorMsg(null);
    try {
      const result = await createMemberInviteAction(churchSlug, member.id);
      if (result.ok) {
        const fullUrl = window.location.origin + result.path;
        setInviteUrl(fullUrl);
        setStatus("success");
      } else {
        setErrorMsg(result.error);
        setStatus("error");
      }
    } catch {
      setErrorMsg("Could not generate invite link.");
      setStatus("error");
    }
  }

  if (status === "success" && inviteUrl) {
    return (
      <div className="space-y-2">
        <CopyableLink url={inviteUrl} showWhatsApp={true} />
        <button
          type="button"
          onClick={() => { setStatus("idle"); setInviteUrl(null); }}
          className="text-xs text-slate-500 underline hover:text-slate-700"
        >
          Generate new link
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleGenerateInvite}
        disabled={status === "loading"}
        className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
      >
        {status === "loading" ? (
          <span className="inline-flex items-center gap-2">
            <ButtonSpinner />
            Generating...
          </span>
        ) : "Invite to Portal"}
      </button>
      {status === "error" && errorMsg && (
        <InlineAlert variant="error" message={errorMsg} />
      )}
    </div>
  );
}
function DepartmentPills({
  items,
  tone,
}: {
  items: string[];
  tone: "active" | "inactive";
}) {
  if (!items.length) return <span className="text-xs text-slate-400">No assignments</span>;

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <span
          key={`${tone}-${item}`}
          className={
            tone === "active"
              ? "rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-800"
              : "rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700"
          }
        >
          {item}
        </span>
      ))}
    </div>
  );
}

function MemberDirectory({
  churchSlug,
  rows,
}: {
  churchSlug: string;
  rows: MembersWorkspaceUnifiedProps["data"]["members"];
}) {
  return (
    <WorkspaceSectionCard
      title="Member Directory"
      description="Operational member registry with assignment and household visibility."
    >
      {rows.length === 0 ? (
        <WorkspaceEmptyState
          title="No members found"
          message="No members match the current filters. Add a new member or reset the filters to widen the view."
          actionLabel="New Member"
          actionHref={`/c/${churchSlug}/members/new`}
        />
      ) : (
        <div className="space-y-3">
          {rows.map((member) => (
            <div
              key={member.id}
              className="rounded-xl border border-slate-200 px-4 py-4"
            >
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-slate-950">
                      {getMemberLabel(member)}
                    </p>
                    <StatusBadge status={member.membership_status} context="member" />
                  </div>

                  <p className="mt-1 text-sm text-slate-600">
                    {member.member_code || "No code"}
                    {member.household_name ? ` • ${member.household_name}` : " • No household"}
                  </p>

                  <p className="mt-2 text-xs text-slate-500">
                    {member.email || member.phone || "No contact info"} • Added {formatDate(member.created_at)}
                  </p>

                  <div className="mt-3 space-y-2">
                    <div>
                      <p className="mb-1 text-[11px] uppercase tracking-[0.16em] text-slate-500">
                        Active departments
                      </p>
                      <DepartmentPills items={member.active_departments || []} tone="active" />
                    </div>

                    {!!member.inactive_departments?.length ? (
                      <div>
                        <p className="mb-1 text-[11px] uppercase tracking-[0.16em] text-slate-500">
                          Inactive departments
                        </p>
                        <DepartmentPills items={member.inactive_departments || []} tone="inactive" />
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="flex shrink-0 flex-wrap gap-2">
                  <a
                    href={`/c/${churchSlug}/members/${member.id}`}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    View Member
                  </a>
                  <a
                    href={`/c/${churchSlug}/members/${member.id}/edit`}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    Edit
                  </a>
                  <MemberInviteButton
                    churchSlug={churchSlug}
                    member={member}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </WorkspaceSectionCard>
  );
}

function HouseholdsPanel({
  churchSlug,
  households,
  recentMembers,
}: {
  churchSlug: string;
  households: MembersWorkspaceUnifiedProps["data"]["households"];
  recentMembers: MembersWorkspaceUnifiedProps["data"]["recentMembers"];
}) {
  return (
    <div className="grid gap-6 2xl:grid-cols-2">
      <WorkspaceSectionCard
        title="Household Summary"
        description="Quick visibility into households connected to the members workspace."
      >
        {households.length === 0 ? (
          <WorkspaceEmptyState
            title="No households yet"
            message="Households will appear here after they are created and linked to members."
            actionLabel="Open Households"
            actionHref={`/c/${churchSlug}/households`}
            className="min-h-[220px]"
          />
        ) : (
          <div className="space-y-3">
            {households.map((household) => (
              <div
                key={household.id}
                className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-950">
                    {household.household_name}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Linked household record
                  </p>
                </div>

                <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700">
                  {household.member_count} members
                </span>
              </div>
            ))}
          </div>
        )}
      </WorkspaceSectionCard>

      <WorkspaceSectionCard
        title="Recent Member Records"
        description="Newest member records visible in the current church workspace."
      >
        {recentMembers.length === 0 ? (
          <WorkspaceEmptyState
            title="No recent additions yet"
            message="Recent member activity will appear here once new member records are created."
            className="min-h-[220px]"
          />
        ) : (
          <div className="space-y-3">
            {recentMembers.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-950">
                    {member.display_name}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Added {formatDate(member.created_at)}
                  </p>
                </div>

                <StatusBadge status={member.membership_status} context="member" />
              </div>
            ))}
          </div>
        )}
      </WorkspaceSectionCard>
    </div>
  );
}

function HealthPanel({
  stats,
}: {
  stats: MembersWorkspaceUnifiedProps["data"]["stats"];
}) {
  const completionRatio =
    stats.totalMembers > 0
      ? Math.round((stats.assignedMembersCount / stats.totalMembers) * 100)
      : 0;

  return (
    <div className="grid gap-6 2xl:grid-cols-2">
      <WorkspaceSectionCard
        title="Directory Health"
        description="How complete and assignment-ready the members directory is right now."
      >
        <div className="space-y-3">
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-sm font-semibold text-slate-900">Department coverage</p>
            <p className="mt-1 text-sm text-slate-600">
              {stats.assignedMembersCount} of {stats.totalMembers} members have at least one active department assignment.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-sm font-semibold text-slate-900">Unassigned members</p>
            <p className="mt-1 text-sm text-slate-600">
              {stats.unassignedMembersCount} members still need an active ministry or department connection.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-sm font-semibold text-slate-900">Assignment completion</p>
            <p className="mt-1 text-sm text-slate-600">
              Current active assignment coverage is {completionRatio}% of the member directory.
            </p>
          </div>
        </div>
      </WorkspaceSectionCard>

      <WorkspaceSectionCard
        title="Membership Mix"
        description="Quick reading of directory posture across member statuses."
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
            <p className="text-sm font-semibold text-emerald-900">Active</p>
            <p className="mt-1 text-2xl font-bold text-emerald-950">{stats.activeMembers}</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-sm font-semibold text-slate-900">Inactive</p>
            <p className="mt-1 text-2xl font-bold text-slate-950">{stats.inactiveMembers}</p>
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
            <p className="text-sm font-semibold text-amber-900">Visitors</p>
            <p className="mt-1 text-2xl font-bold text-amber-950">{stats.visitorMembers}</p>
          </div>

          <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
            <p className="text-sm font-semibold text-blue-900">Transferred</p>
            <p className="mt-1 text-2xl font-bold text-blue-950">{stats.transferredMembers}</p>
          </div>
        </div>
      </WorkspaceSectionCard>
    </div>
  );
}

export function MembersWorkspaceUnified({
  churchSlug,
  data,
}: MembersWorkspaceUnifiedProps) {
  const [activeTab, setActiveTab] = useState<MembersTab>("directory");

  const activeFilterLabel = useMemo(() => {
    if (data.filters.q || data.filters.status || data.filters.departmentId || data.filters.departmentAssignmentStatus) {
      return "Filtered view active";
    }
    return "Live workspace";
  }, [data.filters]);

  return (
    <div className="space-y-6">
      <WorkspaceHero
        eyebrow="Members Workspace"
        title="Church Members Workspace"
        description="View, filter, review, and manage the member directory, households, and assignment health from one unified workspace."
        badges={[
          activeFilterLabel,
          `${data.stats.totalMembers} members`,
          `${data.stats.householdsCount} households`,
        ]}
        actions={[
          { label: "New Member", href: `/c/${churchSlug}/members/new`, variant: "primary" },
          { label: "Open Households", href: `/c/${churchSlug}/households`, variant: "secondary" },
          { label: "Reports", href: `/c/${churchSlug}/reports`, variant: "outline" },
        ]}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <WorkspaceStatCard label="Total Members" value={data.stats.totalMembers} hint="Directory size" />
        <WorkspaceStatCard label="Active" value={data.stats.activeMembers} hint="Current active members" />
        <WorkspaceStatCard label="Inactive" value={data.stats.inactiveMembers} hint="Inactive records" />
        <WorkspaceStatCard label="Visitors" value={data.stats.visitorMembers} hint="Visitor records" />
        <WorkspaceStatCard label="Households" value={data.stats.householdsCount} hint="Linked household records" />
        <WorkspaceStatCard label="Unassigned" value={data.stats.unassignedMembersCount} hint="Need active department coverage" />
      </div>

      <WorkspaceControlRail
        title="Member Filters"
        description="Search the directory and narrow by status, department, or assignment posture without leaving the workspace."
      >
        <form
          method="get"
          action={`/c/${churchSlug}/members`}
          className="grid gap-4 2xl:grid-cols-[minmax(0,1.2fr)_190px_220px_220px_auto]"
        >
          <div>
            <label htmlFor="q" className="mb-1 block text-sm font-medium text-slate-700">
              Search
            </label>
            <input
              id="q"
              name="q"
              defaultValue={data.filters.q ?? ""}
              placeholder="Name, member code, phone, email"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            />
          </div>

          <div>
            <label htmlFor="status" className="mb-1 block text-sm font-medium text-slate-700">
              Member Status
            </label>
            <select
              id="status"
              name="status"
              defaultValue={data.filters.status ?? ""}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            >
              <option value="">All</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="visitor">Visitor</option>
              <option value="transferred">Transferred</option>
            </select>
          </div>

          <div>
            <label htmlFor="departmentId" className="mb-1 block text-sm font-medium text-slate-700">
              Department
            </label>
            <select
              id="departmentId"
              name="departmentId"
              defaultValue={data.filters.departmentId ?? ""}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            >
              <option value="">All departments</option>
              {data.departments.map((department) => (
                <option key={department.id} value={department.id}>
                  {department.name}{department.code ? ` (${department.code})` : ""}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="departmentAssignmentStatus" className="mb-1 block text-sm font-medium text-slate-700">
              Assignment Status
            </label>
            <select
              id="departmentAssignmentStatus"
              name="departmentAssignmentStatus"
              defaultValue={data.filters.departmentAssignmentStatus ?? ""}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            >
              <option value="">Any assignment</option>
              <option value="active">Active assignments only</option>
              <option value="inactive">Inactive assignments only</option>
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
              href={`/c/${churchSlug}/members`}
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Reset
            </a>
          </div>
        </form>
      </WorkspaceControlRail>

      <WorkspaceTabs
        items={MEMBER_TABS}
        activeKey={activeTab}
        onChange={(key) => setActiveTab(key as MembersTab)}
      />

      {activeTab === "directory" ? (
        <MemberDirectory churchSlug={churchSlug} rows={data.members} />
      ) : null}

      {activeTab === "households" ? (
        <HouseholdsPanel
          churchSlug={churchSlug}
          households={data.households}
          recentMembers={data.recentMembers}
        />
      ) : null}

      {activeTab === "health" ? (
        <HealthPanel stats={data.stats} />
      ) : null}
    </div>
  );
}



