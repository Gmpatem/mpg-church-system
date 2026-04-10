"use client";

import { useMemo, useState } from "react";
import { createMemberInviteAction } from "@/features/member-invite/actions";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { CopyableLink } from "@/components/ui/CopyableLink";
import { InlineAlert } from "@/components/ui/InlineAlert";
import { ButtonSpinner } from "@/components/ui/ButtonSpinner";
import { useI18n } from "@/features/i18n";
import {
  WorkspaceControlRail,
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
        className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
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

function MemberDirectory({
  churchSlug,
  rows,
}: {
  churchSlug: string;
  rows: MembersWorkspaceUnifiedProps["data"]["members"];
}) {
  const { t } = useI18n();
  
  return (
    <WorkspaceSectionCard
      title={t.pages.membersWorkspace.directory.title}
      description={t.pages.membersWorkspace.directory.description}
    >
      {rows.length === 0 ? (
        <WorkspaceEmptyState
          title={t.pages.membersWorkspace.directory.noMembers}
          message={t.pages.membersWorkspace.directory.noMembersDesc}
          actionLabel={t.pages.membersWorkspace.directory.newMember}
          actionHref={`/c/${churchSlug}/members/new`}
        />
      ) : (
        <div className="mobile-stagger space-y-3">
          {rows.map((member) => (
            <div
              key={member.id}
              className="mobile-touch-feedback rounded-xl border border-slate-200 px-4 py-4"
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
                    {member.member_code || t.pages.membersWorkspace.directory.noCode}
                    {member.household_name ? ` • ${member.household_name}` : ` • ${t.pages.membersWorkspace.directory.noHousehold}`}
                  </p>

                  <p className="mt-2 text-xs text-slate-500">
                    {member.email || member.phone || t.pages.membersWorkspace.directory.noContact} • {t.pages.membersWorkspace.directory.added} {formatDate(member.created_at)}
                  </p>

                  <div className="mt-3 space-y-2">
                    <div>
                      <p className="mb-1 text-[11px] uppercase tracking-[0.16em] text-slate-500">
                        {t.pages.membersWorkspace.directory.activeDepartments}
                      </p>
                      <DepartmentPills items={member.active_departments || []} tone="active" />
                    </div>

                    {!!member.inactive_departments?.length ? (
                      <div>
                        <p className="mb-1 text-[11px] uppercase tracking-[0.16em] text-slate-500">
                          {t.pages.membersWorkspace.directory.inactiveDepartments}
                        </p>
                        <DepartmentPills items={member.inactive_departments || []} tone="inactive" />
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="flex shrink-0 flex-wrap gap-2">
                  <a
                    href={`/c/${churchSlug}/members/${member.id}`}
                    className="mobile-touch-feedback rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    {t.pages.membersWorkspace.directory.viewMember}
                  </a>
                  <a
                    href={`/c/${churchSlug}/members/${member.id}/edit`}
                    className="mobile-touch-feedback rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    {t.pages.membersWorkspace.directory.edit}
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
  const { t } = useI18n();
  
  return (
    <div className="grid gap-6 2xl:grid-cols-2">
      <WorkspaceSectionCard
        title={t.pages.membersWorkspace.households.title}
        description={t.pages.membersWorkspace.households.description}
      >
        {households.length === 0 ? (
          <WorkspaceEmptyState
            title={t.pages.membersWorkspace.households.noHouseholds}
            message={t.pages.membersWorkspace.households.noHouseholdsDesc}
            actionLabel={t.pages.membersWorkspace.households.openHouseholds}
            actionHref={`/c/${churchSlug}/households`}
            className="min-h-[220px]"
          />
        ) : (
          <div className="mobile-stagger space-y-3">
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
                    {t.pages.membersWorkspace.households.linkedRecord}
                  </p>
                </div>

                <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700">
                  {t.pages.membersWorkspace.households.membersCount.replace("{{count}}", String(household.member_count))}
                </span>
              </div>
            ))}
          </div>
        )}
      </WorkspaceSectionCard>

      <WorkspaceSectionCard
        title={t.pages.membersWorkspace.households.recentTitle}
        description={t.pages.membersWorkspace.households.recentDesc}
      >
        {recentMembers.length === 0 ? (
          <WorkspaceEmptyState
            title={t.pages.membersWorkspace.households.noRecent}
            message={t.pages.membersWorkspace.households.noRecentDesc}
            className="min-h-[220px]"
          />
        ) : (
          <div className="mobile-stagger space-y-3">
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
                    {t.pages.membersWorkspace.directory.added} {formatDate(member.created_at)}
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
  const { t } = useI18n();
  
  const completionRatio =
    stats.totalMembers > 0
      ? Math.round((stats.assignedMembersCount / stats.totalMembers) * 100)
      : 0;

  return (
    <div className="grid gap-6 2xl:grid-cols-2">
      <WorkspaceSectionCard
        title={t.pages.membersWorkspace.health.directoryTitle}
        description={t.pages.membersWorkspace.health.directoryDesc}
      >
        <div className="space-y-3">
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-sm font-semibold text-slate-900">{t.pages.membersWorkspace.health.departmentCoverage}</p>
            <p className="mt-1 text-sm text-slate-600">
              {t.pages.membersWorkspace.health.departmentCoverageDesc
                .replace("{{assigned}}", String(stats.assignedMembersCount))
                .replace("{{total}}", String(stats.totalMembers))}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-sm font-semibold text-slate-900">{t.pages.membersWorkspace.health.unassigned}</p>
            <p className="mt-1 text-sm text-slate-600">
              {t.pages.membersWorkspace.health.unassignedDesc.replace("{{count}}", String(stats.unassignedMembersCount))}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-sm font-semibold text-slate-900">{t.pages.membersWorkspace.health.completion}</p>
            <p className="mt-1 text-sm text-slate-600">
              {t.pages.membersWorkspace.health.completionDesc.replace("{{ratio}}", String(completionRatio))}
            </p>
          </div>
        </div>
      </WorkspaceSectionCard>

      <WorkspaceSectionCard
        title={t.pages.membersWorkspace.health.mixTitle}
        description={t.pages.membersWorkspace.health.mixDesc}
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
            <p className="text-sm font-semibold text-emerald-900">{t.members.active}</p>
            <p className="mt-1 text-2xl font-bold text-emerald-950">{stats.activeMembers}</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-sm font-semibold text-slate-900">{t.members.inactive}</p>
            <p className="mt-1 text-2xl font-bold text-slate-950">{stats.inactiveMembers}</p>
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
            <p className="text-sm font-semibold text-amber-900">{t.members.visitor}</p>
            <p className="mt-1 text-2xl font-bold text-amber-950">{stats.visitorMembers}</p>
          </div>

          <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
            <p className="text-sm font-semibold text-blue-900">{t.members.transferred}</p>
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
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<MembersTab>("directory");

  const activeFilterLabel = useMemo(() => {
    if (data.filters.q || data.filters.status || data.filters.departmentId || data.filters.departmentAssignmentStatus) {
      return t.pages.membersWorkspace.badges.filtered;
    }
    return t.pages.membersWorkspace.badges.live;
  }, [data.filters, t]);

  const MEMBER_TABS: WorkspaceTabItem[] = [
    { key: "directory", label: t.pages.membersWorkspace.tabs.directory },
    { key: "households", label: t.pages.membersWorkspace.tabs.households },
    { key: "health", label: t.pages.membersWorkspace.tabs.health, shortLabel: t.pages.membersWorkspace.tabs.healthShort },
  ];

  return (
    <div className="space-y-5 md:space-y-6">
      <WorkspaceHero
        size="compact"
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
      />

      <div className="mobile-stagger grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-6">
        <WorkspaceStatCard label={t.pages.membersWorkspace.stats.totalMembers} value={data.stats.totalMembers} hint={t.pages.membersWorkspace.stats.totalMembersHint} />
        <WorkspaceStatCard label={t.pages.membersWorkspace.stats.active} value={data.stats.activeMembers} hint={t.pages.membersWorkspace.stats.activeHint} />
        <WorkspaceStatCard label={t.pages.membersWorkspace.stats.inactive} value={data.stats.inactiveMembers} hint={t.pages.membersWorkspace.stats.inactiveHint} />
        <WorkspaceStatCard label={t.pages.membersWorkspace.stats.visitors} value={data.stats.visitorMembers} hint={t.pages.membersWorkspace.stats.visitorsHint} />
        <WorkspaceStatCard label={t.pages.membersWorkspace.stats.households} value={data.stats.householdsCount} hint={t.pages.membersWorkspace.stats.householdsHint} />
        <WorkspaceStatCard label={t.pages.membersWorkspace.stats.unassigned} value={data.stats.unassignedMembersCount} hint={t.pages.membersWorkspace.stats.unassignedHint} />
      </div>

      <WorkspaceControlRail
        title={t.pages.membersWorkspace.filters.title}
        description={t.pages.membersWorkspace.filters.description}
      >
        <form
          method="get"
          action={`/c/${churchSlug}/members`}
          className="grid gap-4 2xl:grid-cols-[minmax(0,1.2fr)_190px_220px_220px_auto]"
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

          <div className="flex items-end gap-3">
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-xl bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              {t.pages.membersWorkspace.filters.apply}
            </button>

            <a
              href={`/c/${churchSlug}/members`}
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              {t.pages.membersWorkspace.filters.reset}
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
