"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createMemberInviteAction } from "@/features/member-invite/actions";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { CopyableLink } from "@/components/ui/CopyableLink";
import { InlineAlert } from "@/components/ui/InlineAlert";
import { ButtonSpinner } from "@/components/ui/ButtonSpinner";
import { useI18n } from "@/features/i18n";
import { useRouter } from "next/navigation";
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
import { NewMemberForm } from "@/app/(church)/c/[churchSlug]/members/new/NewMemberForm";

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

function getMemberLabel(member: MembersWorkspaceUnifiedProps["data"]["members"][number]) {
  return (
    member.display_name ||
    [member.first_name, member.last_name].filter(Boolean).join(" ") ||
    member.member_code ||
    "Member"
  );
}

function formatDate(value?: string | null, locale = "en-US") {
  if (!value) return "—";
  return new Date(value).toLocaleDateString(locale, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getMembersSelectedStorageKey(churchSlug: string) {
  return `workspace-members-selected:${churchSlug}`;
}

function MemberInviteButton({
  churchSlug,
  member,
}: {
  churchSlug: string;
  member: MembersWorkspaceUnifiedProps["data"]["members"][number];
}) {
  const { t } = useI18n();
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
      setErrorMsg(t.pages.membersWorkspace.directory.invite.error);
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
          {t.pages.membersWorkspace.directory.invite.newLink}
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
        className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
      >
        {status === "loading" ? (
          <span className="inline-flex items-center gap-2">
            <ButtonSpinner />
            {t.pages.membersWorkspace.directory.invite.generating}
          </span>
        ) : t.pages.membersWorkspace.directory.invite.button}
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
  const { t } = useI18n();
  if (!items.length) return <span className="text-xs text-slate-400">{t.pages.membersWorkspace.directory.noAssignments}</span>;

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

function MembersRegistryTable({
  churchSlug,
  rows,
  selectedMemberId,
  onSelectMember,
}: {
  churchSlug: string;
  rows: MembersWorkspaceUnifiedProps["data"]["members"];
  selectedMemberId: string | null;
  onSelectMember: (memberId: string) => void;
}) {
  const { t } = useI18n();

  return (
    <WorkspaceSectionCard
      title={t.pages.membersWorkspace.directory.title}
      description={t.pages.membersWorkspace.directory.description}
      contentClassName="p-0"
    >
      {rows.length === 0 ? (
        <div className="p-5">
          <WorkspaceEmptyState
            title={t.pages.membersWorkspace.directory.noMembers}
            message={t.pages.membersWorkspace.directory.noMembersDesc}
            actionLabel={t.pages.membersWorkspace.directory.newMember}
            actionHref={`/c/${churchSlug}/members/new`}
          />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 p-3 md:hidden">
            {rows.map((member) => {
              const isSelected = member.id === selectedMemberId;
              const activeCount = member.active_departments?.length ?? 0;

              return (
                <div
                  key={member.id}
                  className={
                    isSelected
                      ? "rounded-2xl border border-blue-200 bg-blue-50/60 p-3"
                      : "rounded-2xl border border-slate-200 bg-white p-3"
                  }
                >
                  <button type="button" onClick={() => onSelectMember(member.id)} className="w-full text-left">
                    <div className="flex items-start justify-between gap-1.5">
                      <p className="line-clamp-2 text-sm font-semibold text-slate-900">{getMemberLabel(member)}</p>
                      <StatusBadge status={member.membership_status} context="member" />
                    </div>
                    <p className="mt-1 truncate text-xs text-slate-500">
                      {member.member_code || t.pages.membersWorkspace.directory.noCode}
                    </p>
                    <div className="mt-2 flex items-center justify-between gap-2 text-xs text-slate-600">
                      <span className="truncate">{activeCount} {t.navigation.departments}</span>
                      <span className="truncate">{member.phone || member.email || t.pages.membersWorkspace.directory.noContact}</span>
                    </div>
                  </button>
                  <div className="mt-3 flex items-center gap-2">
                    <Link
                      href={`/c/${churchSlug}/members/${member.id}`}
                      className="inline-flex min-h-[44px] flex-1 items-center justify-center rounded-lg border border-slate-200 bg-white px-2 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                    >
                      {t.pages.membersWorkspace.directory.viewMember}
                    </Link>
                    <Link
                      href={`/c/${churchSlug}/members/${member.id}/edit`}
                      className="inline-flex min-h-[44px] flex-1 items-center justify-center rounded-lg border border-slate-200 bg-white px-2 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                    >
                      {t.pages.membersWorkspace.directory.edit}
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="hidden overflow-x-auto md:block">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Member</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Household</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Departments</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Contact</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Added</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {rows.map((member) => {
                  const isSelected = member.id === selectedMemberId;
                  const activeCount = member.active_departments?.length ?? 0;
                  const inactiveCount = member.inactive_departments?.length ?? 0;

                  return (
                    <tr key={member.id} className={isSelected ? "bg-blue-50/50" : undefined}>
                      <td className="px-4 py-3.5">
                        <button
                          type="button"
                          onClick={() => onSelectMember(member.id)}
                          className="text-left"
                        >
                          <p className="text-sm font-semibold text-slate-900">{getMemberLabel(member)}</p>
                          <p className="mt-0.5 text-xs text-slate-500">{member.member_code || t.pages.membersWorkspace.directory.noCode}</p>
                        </button>
                      </td>
                      <td className="px-4 py-3.5">
                        <StatusBadge status={member.membership_status} context="member" />
                      </td>
                      <td className="px-4 py-3.5 text-sm text-slate-600">{member.household_name || t.pages.membersWorkspace.directory.noHousehold}</td>
                      <td className="px-4 py-3.5 text-sm text-slate-600">
                        <span className="font-medium text-slate-800">{activeCount}</span> active
                        {inactiveCount > 0 ? ` / ${inactiveCount} inactive` : ""}
                      </td>
                      <td className="px-4 py-3.5 text-sm text-slate-600">{member.email || member.phone || t.pages.membersWorkspace.directory.noContact}</td>
                      <td className="px-4 py-3.5 text-sm text-slate-600">{formatDate(member.created_at)}</td>
                      <td className="px-4 py-3.5">
                        <div className="flex justify-end gap-2">
                          <a
                            href={`/c/${churchSlug}/members/${member.id}`}
                            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                          >
                            {t.pages.membersWorkspace.directory.viewMember}
                          </a>
                          <a
                            href={`/c/${churchSlug}/members/${member.id}/edit`}
                            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                          >
                            {t.pages.membersWorkspace.directory.edit}
                          </a>
                          <button
                            type="button"
                            onClick={() => onSelectMember(member.id)}
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

function MemberWorkspaceSidebar({
  churchSlug,
  selectedMember,
  households,
  recentMembers,
  stats,
}: {
  churchSlug: string;
  selectedMember: MembersWorkspaceUnifiedProps["data"]["members"][number] | null;
  households: MembersWorkspaceUnifiedProps["data"]["households"];
  recentMembers: MembersWorkspaceUnifiedProps["data"]["recentMembers"];
  stats: MembersWorkspaceUnifiedProps["data"]["stats"];
}) {
  const { t } = useI18n();
  const assignmentCoverage =
    stats.totalMembers > 0 ? Math.round((stats.assignedMembersCount / stats.totalMembers) * 100) : 0;

  return (
    <aside className="space-y-5">
      <WorkspaceSectionCard
        title="Selected Member"
        description="Quick profile and assignment context for the highlighted record."
      >
        {selectedMember ? (
          <div className="space-y-4">
            <div>
              <div className="flex items-center gap-2">
                <p className="text-base font-semibold text-slate-900">{getMemberLabel(selectedMember)}</p>
                <StatusBadge status={selectedMember.membership_status} context="member" />
              </div>
              <p className="mt-1 text-sm text-slate-600">
                {selectedMember.member_code || t.pages.membersWorkspace.directory.noCode}
              </p>
            </div>

            <dl className="space-y-2 text-sm text-slate-600">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-slate-500">{t.members.household}</dt>
                <dd className="font-medium text-slate-800">{selectedMember.household_name || t.pages.membersWorkspace.directory.noHousehold}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-slate-500">{t.members.email}</dt>
                <dd className="max-w-[220px] truncate font-medium text-slate-800">{selectedMember.email || "-"}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-slate-500">{t.members.phone}</dt>
                <dd className="font-medium text-slate-800">{selectedMember.phone || "-"}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-slate-500">{t.pages.membersWorkspace.directory.added}</dt>
                <dd className="font-medium text-slate-800">{formatDate(selectedMember.created_at)}</dd>
              </div>
            </dl>

            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {t.pages.membersWorkspace.directory.activeDepartments}
              </p>
              <DepartmentPills items={selectedMember.active_departments || []} tone="active" />
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {t.pages.membersWorkspace.directory.inactiveDepartments}
              </p>
              <DepartmentPills items={selectedMember.inactive_departments || []} tone="inactive" />
            </div>

            <MemberInviteButton churchSlug={churchSlug} member={selectedMember} />
          </div>
        ) : (
          <p className="text-sm text-slate-500">Select a member from the table to view details.</p>
        )}
      </WorkspaceSectionCard>

      <WorkspaceSectionCard title="Directory Snapshot" description="Operational totals and household activity in the current view.">
        <div className="space-y-4">
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700">
            Assignment coverage: <span className="font-semibold text-slate-900">{assignmentCoverage}%</span>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700">
            Unassigned members: <span className="font-semibold text-slate-900">{stats.unassignedMembersCount}</span>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Top Households</p>
            <div className="mt-2 space-y-2">
              {households.length > 0 ? (
                households.slice(0, 4).map((household) => (
                  <div key={household.id} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm">
                    <span className="font-medium text-slate-800">{household.household_name}</span>
                    <span className="text-slate-500">{household.member_count}</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">No household records in this view.</p>
              )}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Recent Members</p>
            <div className="mt-2 space-y-2">
              {recentMembers.length > 0 ? (
                recentMembers.slice(0, 4).map((member) => (
                  <div key={member.id} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm">
                    <span className="font-medium text-slate-800">{member.display_name}</span>
                    <StatusBadge status={member.membership_status} context="member" />
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">No recent member records.</p>
              )}
            </div>
          </div>
        </div>
      </WorkspaceSectionCard>
    </aside>
  );
}

export function MembersWorkspaceUnified({
  churchSlug,
  data,
}: MembersWorkspaceUnifiedProps) {
  const { t } = useI18n();
  const router = useRouter();
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(data.members[0]?.id ?? null);
  const [memberFormOpen, setMemberFormOpen] = useState(false);
  const [memberDetailOpen, setMemberDetailOpen] = useState(false);

  useEffect(() => {
    router.prefetch(`/c/${churchSlug}/households`);
    router.prefetch(`/c/${churchSlug}/departments`);
    router.prefetch(`/c/${churchSlug}/reports`);
  }, [churchSlug, router]);

  useEffect(() => {
    try {
      const storedId = window.localStorage.getItem(getMembersSelectedStorageKey(churchSlug));
      if (!storedId) return;

      const exists = data.members.some((member) => member.id === storedId);
      if (exists) {
        setSelectedMemberId(storedId);
      }
    } catch {
      // ignore storage read errors
    }
  }, [churchSlug, data.members]);

  useEffect(() => {
    try {
      if (!selectedMemberId) {
        window.localStorage.removeItem(getMembersSelectedStorageKey(churchSlug));
        return;
      }

      window.localStorage.setItem(getMembersSelectedStorageKey(churchSlug), selectedMemberId);
    } catch {
      // ignore storage write errors
    }
  }, [churchSlug, selectedMemberId]);

  const selectedMember = useMemo(
    () => data.members.find((member) => member.id === selectedMemberId) ?? data.members[0] ?? null,
    [data.members, selectedMemberId]
  );

  const activeFilterLabel = useMemo(() => {
    if (data.filters.q || data.filters.status || data.filters.departmentId || data.filters.departmentAssignmentStatus) {
      return t.pages.membersWorkspace.badges.filtered;
    }
    return t.pages.membersWorkspace.badges.live;
  }, [data.filters, t]);

  const departmentOptionsForForm = useMemo(
    () =>
      data.departments.map((department) => ({
        id: department.id,
        department_name: department.name,
        description: null,
      })),
    [data.departments]
  );

  function handleSelectMember(memberId: string) {
    setSelectedMemberId(memberId);

    if (typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches) {
      setMemberDetailOpen(true);
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3 md:hidden">
        <MobilePageHeader
          title="Members"
          subtitle={`Active: ${data.stats.activeMembers} • Inactive: ${data.stats.inactiveMembers}`}
          actionLabel="Add Member"
          onActionClick={() => setMemberFormOpen(true)}
        />

        <form method="get" action={`/c/${churchSlug}/members`} className="flex items-center gap-2">
          <input
            name="q"
            defaultValue={data.filters.q ?? ""}
            placeholder={t.pages.membersWorkspace.filters.searchPlaceholder}
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
            { label: "Members", value: data.stats.totalMembers },
            { label: "Active", value: data.stats.activeMembers, tone: "success" },
            { label: "Inactive", value: data.stats.inactiveMembers },
            { label: "Unassigned", value: data.stats.unassignedMembersCount, tone: "attention" },
          ]}
        />
      </div>

      <WorkspaceHero
        size="compact"
        mobileLayout="slim"
        eyebrow={t.pages.membersWorkspace.eyebrow}
        title={t.pages.membersWorkspace.title}
        description={t.pages.membersWorkspace.description}
        badges={[
          activeFilterLabel,
          t.pages.membersWorkspace.badges.membersCount.replace("{{count}}", String(data.stats.totalMembers)),
          t.pages.membersWorkspace.badges.householdsCount.replace("{{count}}", String(data.stats.householdsCount)),
        ]}
        actions={[
          { label: t.pages.membersWorkspace.actions.newMember, href: `/c/${churchSlug}/members/new`, variant: "primary" },
          { label: t.pages.membersWorkspace.actions.openHouseholds, href: `/c/${churchSlug}/households`, variant: "secondary" },
          { label: t.pages.membersWorkspace.actions.reports, href: `/c/${churchSlug}/reports`, variant: "outline" },
        ]}
        className="hidden md:block"
      />

      <div className="hidden md:grid grid-cols-3 gap-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
        <WorkspaceStatCard label={t.pages.membersWorkspace.stats.totalMembers} value={data.stats.totalMembers} hint={t.pages.membersWorkspace.stats.totalMembersHint} />
        <WorkspaceStatCard label={t.pages.membersWorkspace.stats.active} value={data.stats.activeMembers} hint={t.pages.membersWorkspace.stats.activeHint} />
        <WorkspaceStatCard label={t.pages.membersWorkspace.stats.inactive} value={data.stats.inactiveMembers} hint={t.pages.membersWorkspace.stats.inactiveHint} />
        <WorkspaceStatCard label={t.pages.membersWorkspace.stats.visitors} value={data.stats.visitorMembers} hint={t.pages.membersWorkspace.stats.visitorsHint} />
        <WorkspaceStatCard label={t.pages.membersWorkspace.stats.households} value={data.stats.householdsCount} hint={t.pages.membersWorkspace.stats.householdsHint} />
        <WorkspaceStatCard label={t.pages.membersWorkspace.stats.unassigned} value={data.stats.unassignedMembersCount} hint={t.pages.membersWorkspace.stats.unassignedHint} />
      </div>

      <WorkspaceControlRail className="md:hidden" title="Filters">
        <form method="get" action={`/c/${churchSlug}/members`} className="grid grid-cols-2 gap-2">
          <select
            name="status"
            defaultValue={data.filters.status ?? ""}
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          >
            <option value="">{t.pages.membersWorkspace.filters.statusOptions.all}</option>
            <option value="active">{t.pages.membersWorkspace.filters.statusOptions.active}</option>
            <option value="inactive">{t.pages.membersWorkspace.filters.statusOptions.inactive}</option>
            <option value="visitor">{t.pages.membersWorkspace.filters.statusOptions.visitor}</option>
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
        title={t.pages.membersWorkspace.filters.title}
        description={t.pages.membersWorkspace.filters.description}
        className="hidden md:block"
      >
        <form
          method="get"
          action={`/c/${churchSlug}/members`}
          className="grid gap-3 xl:grid-cols-[minmax(0,1.2fr)_190px_220px_220px_auto]"
        >
          <div>
            <label htmlFor="q" className="mb-1 block text-sm font-medium text-slate-700">
              {t.pages.membersWorkspace.filters.search}
            </label>
            <input
              id="q"
              name="q"
              defaultValue={data.filters.q ?? ""}
              placeholder={t.pages.membersWorkspace.filters.searchPlaceholder}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            />
          </div>

          <div>
            <label htmlFor="status" className="mb-1 block text-sm font-medium text-slate-700">
              {t.pages.membersWorkspace.filters.memberStatus}
            </label>
            <select
              id="status"
              name="status"
              defaultValue={data.filters.status ?? ""}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            >
              <option value="">{t.pages.membersWorkspace.filters.statusOptions.all}</option>
              <option value="active">{t.pages.membersWorkspace.filters.statusOptions.active}</option>
              <option value="inactive">{t.pages.membersWorkspace.filters.statusOptions.inactive}</option>
              <option value="visitor">{t.pages.membersWorkspace.filters.statusOptions.visitor}</option>
              <option value="transferred">{t.pages.membersWorkspace.filters.statusOptions.transferred}</option>
            </select>
          </div>

          <div>
            <label htmlFor="departmentId" className="mb-1 block text-sm font-medium text-slate-700">
              {t.pages.membersWorkspace.filters.department}
            </label>
            <select
              id="departmentId"
              name="departmentId"
              defaultValue={data.filters.departmentId ?? ""}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            >
              <option value="">{t.pages.membersWorkspace.filters.allDepartments}</option>
              {data.departments.map((department) => (
                <option key={department.id} value={department.id}>
                  {department.name}{department.code ? ` (${department.code})` : ""}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="departmentAssignmentStatus" className="mb-1 block text-sm font-medium text-slate-700">
              {t.pages.membersWorkspace.filters.assignmentStatus}
            </label>
            <select
              id="departmentAssignmentStatus"
              name="departmentAssignmentStatus"
              defaultValue={data.filters.departmentAssignmentStatus ?? ""}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            >
              <option value="">{t.pages.membersWorkspace.filters.assignmentOptions.any}</option>
              <option value="active">{t.pages.membersWorkspace.filters.assignmentOptions.active}</option>
              <option value="inactive">{t.pages.membersWorkspace.filters.assignmentOptions.inactive}</option>
            </select>
          </div>

          <div className="flex items-end gap-2">
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-lg bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              {t.pages.membersWorkspace.filters.apply}
            </button>

            <a
              href={`/c/${churchSlug}/members`}
              className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              {t.pages.membersWorkspace.filters.reset}
            </a>
          </div>
        </form>
      </WorkspaceControlRail>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.7fr)_380px]">
        <MembersRegistryTable
          churchSlug={churchSlug}
          rows={data.members}
          selectedMemberId={selectedMember?.id ?? null}
          onSelectMember={handleSelectMember}
        />
        <div className="hidden md:block">
          <MemberWorkspaceSidebar
            churchSlug={churchSlug}
            selectedMember={selectedMember}
            households={data.households}
            recentMembers={data.recentMembers}
            stats={data.stats}
          />
        </div>
      </div>

      <MobileBottomSheet
        open={memberFormOpen}
        onOpenChange={setMemberFormOpen}
        title="Add Member"
      >
        <NewMemberForm
          churchSlug={churchSlug}
          departments={departmentOptionsForForm}
          households={data.households}
          embedded
          onCreated={() => setMemberFormOpen(false)}
        />
      </MobileBottomSheet>

      <MobileBottomSheet
        open={memberDetailOpen}
        onOpenChange={setMemberDetailOpen}
        title="Member Details"
      >
        <MemberWorkspaceSidebar
          churchSlug={churchSlug}
          selectedMember={selectedMember}
          households={data.households}
          recentMembers={data.recentMembers}
          stats={data.stats}
        />
      </MobileBottomSheet>
    </div>
  );
}
