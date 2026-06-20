"use client";

import type { KeyboardEvent, ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BarChart3,
  ChevronDown,
  Edit3,
  House,
  Mail,
  MoreHorizontal,
  Plus,
  Search,
  SlidersHorizontal,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { createMemberInviteAction } from "@/features/member-invite/actions";
import { CopyableLink } from "@/components/ui/CopyableLink";
import { InlineAlert } from "@/components/ui/InlineAlert";
import { ButtonSpinner } from "@/components/ui/ButtonSpinner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useI18n } from "@/features/i18n";
import { getLabel, memberStatusLabels } from "@/lib/display-maps";
import { cn } from "@/lib/utils/cn";
import { WorkspaceEmptyState } from "@/components/workspace";
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

type Member = MembersWorkspaceUnifiedProps["data"]["members"][number];
type Department = MembersWorkspaceUnifiedProps["data"]["departments"][number];
type Stats = MembersWorkspaceUnifiedProps["data"]["stats"];
type Filters = MembersWorkspaceUnifiedProps["data"]["filters"];

function getMemberLabel(member: Member) {
  return (
    member.display_name ||
    [member.first_name, member.last_name].filter(Boolean).join(" ") ||
    member.member_code ||
    "Member"
  );
}

function formatDate(value?: string | null, locale = "en-US") {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleDateString(locale, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatMemberSince(value?: string | null) {
  if (!value) return "-";

  const start = new Date(value).getTime();
  if (Number.isNaN(start)) return "-";

  const diffMs = Date.now() - start;
  if (diffMs < 0) return "-";

  const days = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
  if (days < 31) return `${Math.max(1, days)} ${days === 1 ? "day" : "days"}`;

  const months = Math.floor(days / 30);
  if (months < 12) return `${months} ${months === 1 ? "month" : "months"}`;

  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  if (remainingMonths === 0) return `${years} ${years === 1 ? "year" : "years"}`;
  return `${years}y ${remainingMonths}m`;
}

function getMembersSelectedStorageKey(churchSlug: string) {
  return `workspace-members-selected:${churchSlug}`;
}

function hasActiveFilters(filters: Filters) {
  return Boolean(
    filters.q ||
      filters.status ||
      filters.departmentId ||
      filters.departmentAssignmentStatus
  );
}

function getInitials(member: Member) {
  const label = getMemberLabel(member);
  const words = label.split(/\s+/).filter(Boolean);
  const initials = words
    .slice(0, 2)
    .map((word) => word.charAt(0))
    .join("")
    .toUpperCase();

  return initials || "M";
}

function numberFormat(value: number) {
  return value.toLocaleString("en-US");
}

function getStatusClasses(status: string | null | undefined) {
  switch (status) {
    case "active":
      return {
        dot: "bg-emerald-500",
        text: "text-emerald-700",
        avatar: "bg-emerald-50 text-emerald-700 ring-emerald-100",
      };
    case "inactive":
      return {
        dot: "bg-orange-500",
        text: "text-orange-700",
        avatar: "bg-orange-50 text-orange-700 ring-orange-100",
      };
    case "visitor":
      return {
        dot: "bg-blue-500",
        text: "text-blue-700",
        avatar: "bg-blue-50 text-blue-700 ring-blue-100",
      };
    case "transferred":
      return {
        dot: "bg-violet-500",
        text: "text-violet-700",
        avatar: "bg-violet-50 text-violet-700 ring-violet-100",
      };
    default:
      return {
        dot: "bg-slate-400",
        text: "text-slate-600",
        avatar: "bg-slate-100 text-slate-600 ring-slate-200",
      };
  }
}

function MemberStatusIndicator({
  status,
  className,
}: {
  status: string | null | undefined;
  className?: string;
}) {
  const classes = getStatusClasses(status);
  const label = getLabel(memberStatusLabels, status);

  return (
    <span className={cn("inline-flex items-center gap-2 text-sm", classes.text, className)}>
      <span className={cn("h-2 w-2 rounded-full", classes.dot)} aria-hidden="true" />
      <span className="whitespace-nowrap text-slate-700">{label}</span>
    </span>
  );
}

function MemberAvatar({ member, size = "sm" }: { member: Member; size?: "sm" | "lg" }) {
  const classes = getStatusClasses(member.membership_status);

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-semibold ring-1",
        classes.avatar,
        size === "lg" ? "h-14 w-14 text-lg" : "h-9 w-9 text-xs"
      )}
      aria-hidden="true"
    >
      {getInitials(member)}
    </span>
  );
}

function ScreenReaderLabel({ children }: { children: ReactNode }) {
  return <span className="sr-only">{children}</span>;
}

function MemberInviteButton({
  churchSlug,
  member,
  className,
  buttonClassName,
}: {
  churchSlug: string;
  member: Member;
  className?: string;
  buttonClassName?: string;
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
      <div className={cn("space-y-2", className)}>
        <CopyableLink url={inviteUrl} showWhatsApp={true} />
        <button
          type="button"
          onClick={() => {
            setStatus("idle");
            setInviteUrl(null);
          }}
          className="text-xs font-medium text-slate-500 underline-offset-4 hover:text-slate-800 hover:underline"
        >
          {t.pages.membersWorkspace.directory.invite.newLink}
        </button>
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      <button
        type="button"
        onClick={handleGenerateInvite}
        disabled={status === "loading"}
        className={cn(
          "inline-flex h-10 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:opacity-50",
          buttonClassName
        )}
      >
        <Mail className="h-4 w-4" aria-hidden="true" />
        {status === "loading" ? (
          <span className="inline-flex items-center gap-2">
            <ButtonSpinner />
            {t.pages.membersWorkspace.directory.invite.generating}
          </span>
        ) : (
          t.pages.membersWorkspace.directory.invite.button
        )}
      </button>
      {status === "error" && errorMsg ? (
        <InlineAlert variant="error" message={errorMsg} className="rounded-lg px-3 py-2 text-xs" />
      ) : null}
    </div>
  );
}

function MembersInlineStats({ stats }: { stats: Stats }) {
  const items = [
    { label: "Total", value: stats.totalMembers },
    { label: "Active", value: stats.activeMembers, tone: "active" },
    { label: "Inactive", value: stats.inactiveMembers, tone: "inactive" },
    { label: "Visitors", value: stats.visitorMembers, tone: "visitor" },
    { label: "Transferred", value: stats.transferredMembers, tone: "transferred" },
    { label: "Households", value: stats.householdsCount },
    { label: "Assigned", value: stats.assignedMembersCount },
    { label: "Unassigned", value: stats.unassignedMembersCount },
  ];

  return (
    <div className="flex min-w-0 items-stretch overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {items.map((item, index) => {
        const toneClasses = getStatusClasses(item.tone);
        const isZero = item.value === 0;

        return (
          <div key={item.label} className="flex shrink-0 items-stretch">
            {index > 0 ? <div className="my-1 w-px shrink-0 bg-slate-200" aria-hidden="true" /> : null}
            <div className="min-w-[72px] shrink-0 px-3">
              <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
                {item.tone ? (
                  <span className={cn("h-1.5 w-1.5 rounded-full", toneClasses.dot)} aria-hidden="true" />
                ) : null}
                <span>{item.label}</span>
              </div>
              <div className={cn("mt-1 text-lg font-semibold leading-none tabular-nums text-slate-950", isZero && "text-slate-400")}>
                {numberFormat(item.value)}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function MembersWorkspaceHeader({
  churchSlug,
  stats,
}: {
  churchSlug: string;
  stats: Stats;
}) {
  const { t } = useI18n();

  return (
    <header className="hidden border-b border-slate-200 bg-white px-6 py-4 md:block">
      <div className="grid min-w-0 items-center gap-5 xl:grid-cols-[220px_minmax(0,1fr)_auto]">
        <div className="min-w-0">
          <h1 className="text-[28px] font-semibold leading-tight tracking-tight text-slate-950">Members</h1>
          <p className="mt-1 text-sm leading-5 text-slate-500">
            View, filter, and manage members, households, and assignments.
          </p>
        </div>

        <div className="min-w-0">
          <MembersInlineStats stats={stats} />
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <Link
            href={`/c/${churchSlug}/members/new`}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-indigo-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            {t.pages.membersWorkspace.actions.newMember}
          </Link>
          <Link
            href={`/c/${churchSlug}/households`}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
          >
            <Users className="h-4 w-4" aria-hidden="true" />
            {t.navigation.households}
          </Link>
          <Link
            href={`/c/${churchSlug}/reports`}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
          >
            <BarChart3 className="h-4 w-4" aria-hidden="true" />
            {t.pages.membersWorkspace.actions.reports}
          </Link>
        </div>
      </div>
    </header>
  );
}

function FilterSelect({
  id,
  name,
  label,
  defaultValue,
  className,
  children,
}: {
  id: string;
  name: string;
  label: string;
  defaultValue?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("min-w-[150px]", className)}>
      <label htmlFor={id} className="mb-1 block text-[11px] font-medium leading-none text-slate-500">
        {label}
      </label>
      <div className="relative">
        <select
          id={id}
          name={name}
          defaultValue={defaultValue ?? ""}
          className="h-10 w-full appearance-none rounded-md border border-slate-200 bg-white py-2 pl-3 pr-9 text-sm text-slate-700 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
        >
          {children}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
      </div>
    </div>
  );
}

function MembersToolbar({
  churchSlug,
  filters,
  departments,
  resultCount,
}: {
  churchSlug: string;
  filters: Filters;
  departments: Department[];
  resultCount: number;
}) {
  const { t } = useI18n();
  const activeFilters = hasActiveFilters(filters);

  return (
    <form
      method="get"
      action={`/c/${churchSlug}/members`}
      className="hidden min-w-0 flex-wrap items-end gap-3 border-b border-slate-200 bg-white px-6 py-4 md:flex"
    >
      <div className="relative min-w-[260px] flex-1">
          <label htmlFor="q" className="sr-only">
            {t.pages.membersWorkspace.filters.search}
          </label>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <input
            id="q"
            name="q"
            defaultValue={filters.q ?? ""}
            placeholder="Search name, code, phone, email..."
            className="h-10 w-full rounded-md border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
          />
      </div>

        <FilterSelect
          id="status"
          name="status"
          label={t.pages.membersWorkspace.filters.memberStatus}
          defaultValue={filters.status}
          className="w-[130px] min-w-[130px]"
        >
          <option value="">{t.pages.membersWorkspace.filters.statusOptions.all}</option>
          <option value="active">{t.pages.membersWorkspace.filters.statusOptions.active}</option>
          <option value="inactive">{t.pages.membersWorkspace.filters.statusOptions.inactive}</option>
          <option value="visitor">{t.pages.membersWorkspace.filters.statusOptions.visitor}</option>
          <option value="transferred">{t.pages.membersWorkspace.filters.statusOptions.transferred}</option>
        </FilterSelect>

        <FilterSelect
          id="departmentId"
          name="departmentId"
          label={t.pages.membersWorkspace.filters.department}
          defaultValue={filters.departmentId}
          className="w-[170px] min-w-[170px]"
        >
          <option value="">{t.pages.membersWorkspace.filters.allDepartments}</option>
          {departments.map((department) => (
            <option key={department.id} value={department.id}>
              {department.name}
              {department.code ? ` (${department.code})` : ""}
            </option>
          ))}
        </FilterSelect>

        <FilterSelect
          id="departmentAssignmentStatus"
          name="departmentAssignmentStatus"
          label={t.pages.membersWorkspace.filters.assignmentStatus}
          defaultValue={filters.departmentAssignmentStatus}
          className="w-[180px] min-w-[180px]"
        >
          <option value="">{t.pages.membersWorkspace.filters.assignmentOptions.any}</option>
          <option value="active">{t.pages.membersWorkspace.filters.assignmentOptions.active}</option>
          <option value="inactive">{t.pages.membersWorkspace.filters.assignmentOptions.inactive}</option>
        </FilterSelect>
        <button
          type="submit"
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
        >
          <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
          Filters
        </button>
      <p className="whitespace-nowrap pb-2 text-sm text-slate-500">
        {numberFormat(resultCount)} results
      </p>
        {activeFilters ? (
          <Link
            href={`/c/${churchSlug}/members`}
            className="inline-flex h-10 items-center justify-center rounded-md px-2 text-sm font-medium text-slate-500 transition hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
          >
            {t.pages.membersWorkspace.filters.reset}
          </Link>
        ) : null}
    </form>
  );
}

function MobileFiltersForm({
  churchSlug,
  filters,
  departments,
}: {
  churchSlug: string;
  filters: Filters;
  departments: Department[];
}) {
  const { t } = useI18n();

  return (
    <form method="get" action={`/c/${churchSlug}/members`} className="space-y-4">
      <div>
        <label htmlFor="mobile-status" className="mb-1.5 block text-sm font-medium text-slate-700">
          {t.pages.membersWorkspace.filters.memberStatus}
        </label>
        <select
          id="mobile-status"
          name="status"
          defaultValue={filters.status ?? ""}
          className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
        >
          <option value="">{t.pages.membersWorkspace.filters.statusOptions.all}</option>
          <option value="active">{t.pages.membersWorkspace.filters.statusOptions.active}</option>
          <option value="inactive">{t.pages.membersWorkspace.filters.statusOptions.inactive}</option>
          <option value="visitor">{t.pages.membersWorkspace.filters.statusOptions.visitor}</option>
          <option value="transferred">{t.pages.membersWorkspace.filters.statusOptions.transferred}</option>
        </select>
      </div>

      <div>
        <label htmlFor="mobile-departmentId" className="mb-1.5 block text-sm font-medium text-slate-700">
          {t.pages.membersWorkspace.filters.department}
        </label>
        <select
          id="mobile-departmentId"
          name="departmentId"
          defaultValue={filters.departmentId ?? ""}
          className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
        >
          <option value="">{t.pages.membersWorkspace.filters.allDepartments}</option>
          {departments.map((department) => (
            <option key={department.id} value={department.id}>
              {department.name}
              {department.code ? ` (${department.code})` : ""}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="mobile-departmentAssignmentStatus" className="mb-1.5 block text-sm font-medium text-slate-700">
          {t.pages.membersWorkspace.filters.assignmentStatus}
        </label>
        <select
          id="mobile-departmentAssignmentStatus"
          name="departmentAssignmentStatus"
          defaultValue={filters.departmentAssignmentStatus ?? ""}
          className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
        >
          <option value="">{t.pages.membersWorkspace.filters.assignmentOptions.any}</option>
          <option value="active">{t.pages.membersWorkspace.filters.assignmentOptions.active}</option>
          <option value="inactive">{t.pages.membersWorkspace.filters.assignmentOptions.inactive}</option>
        </select>
      </div>

      {filters.q ? <input type="hidden" name="q" value={filters.q} /> : null}

      <div className="flex items-center gap-2 pt-2">
        <button
          type="submit"
          className="mobile-touch-feedback inline-flex min-h-[44px] flex-1 items-center justify-center rounded-xl bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
        >
          {t.pages.membersWorkspace.filters.apply}
        </button>
        <Link
          href={`/c/${churchSlug}/members`}
          className="mobile-touch-feedback inline-flex min-h-[44px] items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          {t.pages.membersWorkspace.filters.reset}
        </Link>
      </div>
    </form>
  );
}

function MemberDepartmentSummary({ member }: { member: Member }) {
  const active = member.active_departments ?? [];
  const inactive = member.inactive_departments ?? [];
  const details = [
    active.length ? `Active: ${active.join(", ")}` : "No active assignments",
    inactive.length ? `Inactive: ${inactive.join(", ")}` : "No inactive assignments",
  ].join("\n");

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="inline-flex cursor-help flex-col text-sm leading-5" title={details}>
          <span>
            <span className="font-semibold text-slate-950">{active.length}</span>{" "}
            <span className="text-slate-600">active</span>
          </span>
          <span>
            <span className="font-semibold text-slate-500">{inactive.length}</span>{" "}
            <span className="text-slate-500">inactive</span>
          </span>
        </div>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs whitespace-pre-line text-xs">
        {details}
      </TooltipContent>
    </Tooltip>
  );
}

function MemberIdentityCell({ member }: { member: Member }) {
  const label = getMemberLabel(member);

  return (
    <div className="flex min-w-[210px] items-center gap-3">
      <MemberAvatar member={member} />
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-slate-950" title={label}>
          {label}
        </p>
        <p className="mt-0.5 truncate text-xs text-slate-500">
          {member.member_code || "No member code"}
        </p>
      </div>
    </div>
  );
}

function MemberRow({
  churchSlug,
  member,
  isSelected,
  onSelectMember,
}: {
  churchSlug: string;
  member: Member;
  isSelected: boolean;
  onSelectMember: (memberId: string) => void;
}) {
  const { t } = useI18n();
  const label = getMemberLabel(member);

  function handleKeyDown(event: KeyboardEvent<HTMLTableRowElement>) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onSelectMember(member.id);
    }
  }

  return (
    <tr
      tabIndex={0}
      aria-selected={isSelected}
      onClick={() => onSelectMember(member.id)}
      onKeyDown={handleKeyDown}
      className={cn(
        "group cursor-pointer border-b border-slate-100 bg-white outline-none transition hover:bg-slate-50 focus-visible:bg-indigo-50/70",
        isSelected && "bg-indigo-50/70 shadow-[inset_2px_0_0_#4f46e5]"
      )}
    >
      <td className="w-10 px-4 py-3">
        <input
          type="checkbox"
          checked={isSelected}
          readOnly
          aria-label={`Select ${label}`}
          className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
          onClick={(event) => {
            event.stopPropagation();
            onSelectMember(member.id);
          }}
        />
      </td>
      <td className="px-2 py-3">
        <MemberIdentityCell member={member} />
      </td>
      <td className="px-3 py-3">
        <MemberStatusIndicator status={member.membership_status} />
      </td>
      <td className="max-w-[170px] px-3 py-3 text-sm text-slate-700">
        <p className={cn("truncate", !member.household_name && "text-slate-400")} title={member.household_name ?? undefined}>
          {member.household_name || t.pages.membersWorkspace.directory.noHousehold}
        </p>
      </td>
      <td className="px-3 py-3">
        <MemberDepartmentSummary member={member} />
      </td>
      <td className="max-w-[220px] px-3 py-3 text-sm">
        <p className={cn("truncate text-slate-800", !member.phone && "text-slate-400")} title={member.phone ?? undefined}>
          {member.phone || "-"}
        </p>
        <p className={cn("mt-0.5 truncate text-xs text-slate-500", !member.email && "text-slate-400")} title={member.email ?? undefined}>
          {member.email || t.pages.membersWorkspace.directory.noContact}
        </p>
      </td>
      <td className="whitespace-nowrap px-3 py-3 text-sm text-slate-700">
        {formatDate(member.created_at)}
      </td>
      <td className="w-12 px-3 py-3 text-right">
        <div onClick={(event) => event.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                aria-label={`Open actions for ${label}`}
              >
                <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem asChild>
                <Link href={`/c/${churchSlug}/members/${member.id}`}>
                  <UserRound className="mr-2 h-4 w-4" aria-hidden="true" />
                  {t.pages.membersWorkspace.directory.viewMember}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/c/${churchSlug}/members/${member.id}/edit`}>
                  <Edit3 className="mr-2 h-4 w-4" aria-hidden="true" />
                  {t.pages.membersWorkspace.directory.edit}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={(event) => {
                  event.preventDefault();
                  onSelectMember(member.id);
                }}
              >
                <SlidersHorizontal className="mr-2 h-4 w-4" aria-hidden="true" />
                Details
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </td>
    </tr>
  );
}

function MobileMemberCard({
  churchSlug,
  member,
  isSelected,
  onSelectMember,
}: {
  churchSlug: string;
  member: Member;
  isSelected: boolean;
  onSelectMember: (memberId: string) => void;
}) {
  const { t } = useI18n();
  const activeCount = member.active_departments?.length ?? 0;
  const inactiveCount = member.inactive_departments?.length ?? 0;
  const label = getMemberLabel(member);

  return (
    <article
      className={cn(
        "rounded-xl border bg-white p-3 shadow-sm transition",
        isSelected ? "border-indigo-200 bg-indigo-50/60" : "border-slate-200"
      )}
    >
      <button type="button" onClick={() => onSelectMember(member.id)} className="w-full text-left">
        <div className="flex items-start gap-3">
          <MemberAvatar member={member} />
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <p className="line-clamp-2 text-sm font-semibold text-slate-950">{label}</p>
              <MemberStatusIndicator status={member.membership_status} className="text-xs" />
            </div>
            <p className="mt-0.5 truncate text-xs text-slate-500">
              {member.member_code || "No member code"}
            </p>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-600">
          <span className="truncate">{member.household_name || t.pages.membersWorkspace.directory.noHousehold}</span>
          <span className="truncate text-right">{activeCount} active / {inactiveCount} inactive</span>
          <span className="col-span-2 truncate text-slate-500">{member.phone || member.email || t.pages.membersWorkspace.directory.noContact}</span>
        </div>
      </button>
      <div className="mt-3 flex items-center gap-2">
        <Link
          href={`/c/${churchSlug}/members/${member.id}`}
          className="mobile-touch-feedback inline-flex min-h-[42px] flex-1 items-center justify-center rounded-lg border border-slate-200 bg-white px-2 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
        >
          {t.pages.membersWorkspace.directory.viewMember}
        </Link>
        <Link
          href={`/c/${churchSlug}/members/${member.id}/edit`}
          className="mobile-touch-feedback inline-flex min-h-[42px] flex-1 items-center justify-center rounded-lg border border-slate-200 bg-white px-2 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
        >
          {t.pages.membersWorkspace.directory.edit}
        </Link>
      </div>
    </article>
  );
}

function MembersRegistryTable({
  churchSlug,
  rows,
  selectedMemberId,
  onSelectMember,
  hasFilters,
}: {
  churchSlug: string;
  rows: Member[];
  selectedMemberId: string | null;
  onSelectMember: (memberId: string) => void;
  hasFilters: boolean;
}) {
  const { t } = useI18n();
  const start = rows.length > 0 ? 1 : 0;
  const end = rows.length;

  return (
    <section className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white">
      {rows.length === 0 ? (
        <div className="p-4">
          {hasFilters ? (
            <div className="flex min-h-[260px] flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center">
              <h2 className="text-base font-semibold text-slate-950">No members match these filters.</h2>
              <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                Try a broader search or reset the filters to return to the full member registry.
              </p>
              <Link
                href={`/c/${churchSlug}/members`}
                className="mt-5 inline-flex h-10 items-center justify-center rounded-md border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                {t.pages.membersWorkspace.filters.reset}
              </Link>
            </div>
          ) : (
            <WorkspaceEmptyState
              title={t.pages.membersWorkspace.directory.noMembers}
              message="Create your first member record to start building the church directory."
              actionLabel={t.pages.membersWorkspace.directory.newMember}
              actionHref={`/c/${churchSlug}/members/new`}
              className="min-h-[260px] rounded-lg"
            />
          )}
        </div>
      ) : (
        <>
          <div className="grid gap-3 p-3 md:hidden">
            {rows.map((member) => (
              <MobileMemberCard
                key={member.id}
                churchSlug={churchSlug}
                member={member}
                isSelected={member.id === selectedMemberId}
                onSelectMember={onSelectMember}
              />
            ))}
          </div>

          <TooltipProvider delayDuration={200}>
            <div className="hidden min-w-0 overflow-x-auto md:block">
              <table className="w-full min-w-[860px] border-separate border-spacing-0 text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold text-slate-500">
                    <th className="w-10 px-4 py-3">
                      <input
                        type="checkbox"
                        aria-label="Selected member"
                        checked={false}
                        readOnly
                        className="h-4 w-4 rounded border-slate-300 text-indigo-600"
                      />
                    </th>
                    <th className="px-2 py-3 font-semibold">Member</th>
                    <th className="px-3 py-3 font-semibold">Status</th>
                    <th className="px-3 py-3 font-semibold">Household</th>
                    <th className="px-3 py-3 font-semibold">Departments</th>
                    <th className="px-3 py-3 font-semibold">Contact</th>
                    <th className="px-3 py-3 font-semibold">Joined</th>
                    <th className="px-3 py-3 text-right font-semibold">
                      <ScreenReaderLabel>{t.common.actions}</ScreenReaderLabel>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((member) => (
                    <MemberRow
                      key={member.id}
                      churchSlug={churchSlug}
                      member={member}
                      isSelected={member.id === selectedMemberId}
                      onSelectMember={onSelectMember}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </TooltipProvider>

          <div className="flex flex-col gap-2 border-t border-slate-200 px-4 py-3 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
            <p>
              Showing {numberFormat(start)} to {numberFormat(end)} of {numberFormat(rows.length)} members
            </p>
            <p className="text-xs text-slate-400">
              Pagination is not enabled for this registry view.
            </p>
          </div>
        </>
      )}
    </section>
  );
}

function OverviewRow({
  label,
  value,
  title,
}: {
  label: string;
  value: ReactNode;
  title?: string;
}) {
  return (
    <div className="grid grid-cols-[100px_minmax(0,1fr)] gap-4 text-sm">
      <dt className="text-slate-500">{label}</dt>
      <dd className="max-w-[190px] text-right font-medium text-slate-900" title={title}>
        {value}
      </dd>
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
  if (!items.length) {
    return (
      <p className="text-sm text-slate-500">
        {tone === "active" ? "No active assignments" : "No inactive assignments"}
      </p>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <span
          key={`${tone}-${item}`}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
            tone === "active"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-slate-200 bg-slate-50 text-slate-700"
          )}
        >
          <span
            className={cn(
              "h-1.5 w-1.5 rounded-full",
              tone === "active" ? "bg-emerald-500" : "bg-slate-400"
            )}
            aria-hidden="true"
          />
          {item}
        </span>
      ))}
    </div>
  );
}

function MemberInspectorActions({
  churchSlug,
  member,
}: {
  churchSlug: string;
  member: Member;
}) {
  const { t } = useI18n();
  const label = getMemberLabel(member);

  return (
    <div className="mt-auto space-y-3 border-t border-slate-200 bg-white px-5 py-4">
      <div className="grid grid-cols-2 gap-3">
        <MemberInviteButton
          churchSlug={churchSlug}
          member={member}
          buttonClassName="h-11 w-full rounded-lg"
          className="min-w-0"
        />
        <Link
          href={`/c/${churchSlug}/members/${member.id}/edit`}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
        >
          <Edit3 className="h-4 w-4" aria-hidden="true" />
          {t.pages.membersWorkspace.directory.edit}
        </Link>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-md text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            More actions
            <ChevronDown className="h-4 w-4" aria-hidden="true" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="center" className="w-52">
          <DropdownMenuItem asChild>
            <Link href={`/c/${churchSlug}/members/${member.id}`}>
              <UserRound className="mr-2 h-4 w-4" aria-hidden="true" />
              View full profile
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href={`/c/${churchSlug}/households`}>
              <House className="mr-2 h-4 w-4" aria-hidden="true" />
              Open households
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem disabled>
            <span className="truncate text-xs text-slate-400">Selected: {label}</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function MemberInspector({
  churchSlug,
  selectedMember,
  onClearSelectedMember,
  variant = "card",
}: {
  churchSlug: string;
  selectedMember: Member | null;
  onClearSelectedMember?: () => void;
  variant?: "card" | "rail";
}) {
  const { t } = useI18n();
  const isRail = variant === "rail";

  return (
    <aside
      className={cn(
        "min-h-0 min-w-0 flex-col overflow-hidden bg-white",
        isRail
          ? "hidden border-l border-slate-200 lg:sticky lg:top-0 lg:flex lg:h-[calc(100vh-64px)]"
          : "flex min-h-[560px] rounded-lg border border-slate-200 shadow-sm xl:sticky xl:top-20 xl:h-[calc(100vh-7rem)]"
      )}
    >
      <div className="flex items-center justify-between px-6 py-5">
        <h2 className="text-sm font-semibold text-slate-950">Selected Member</h2>
        {onClearSelectedMember ? (
          <button
            type="button"
            onClick={onClearSelectedMember}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            aria-label="Close selected member inspector"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        ) : null}
      </div>

      {selectedMember ? (
        <>
          <div className="min-h-0 flex-1 overflow-y-auto">
            <div className="flex items-center gap-4 px-6 pb-5">
              <MemberAvatar member={selectedMember} size="lg" />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="truncate text-lg font-semibold text-slate-950">
                    {getMemberLabel(selectedMember)}
                  </h3>
                  <MemberStatusIndicator status={selectedMember.membership_status} className="text-xs" />
                </div>
                <p className="mt-1 text-sm text-slate-500">
                  {selectedMember.member_code || "No member code"}
                </p>
              </div>
            </div>

            <div className="border-t border-slate-200 px-6 py-5">
              <h4 className="text-sm font-semibold text-slate-950">Overview</h4>
              <dl className="mt-4 space-y-4">
                <OverviewRow
                  label={t.members.household}
                  value={
                    <span className={cn(!selectedMember.household_name && "text-slate-400")}>
                      {selectedMember.household_name || t.pages.membersWorkspace.directory.noHousehold}
                    </span>
                  }
                  title={selectedMember.household_name ?? undefined}
                />
                <OverviewRow
                  label={t.members.email}
                  value={
                    <span className={cn("block truncate", !selectedMember.email && "text-slate-400")}>
                      {selectedMember.email || "No email"}
                    </span>
                  }
                  title={selectedMember.email ?? undefined}
                />
                <OverviewRow
                  label={t.members.phone}
                  value={
                    <span className={cn(!selectedMember.phone && "text-slate-400")}>
                      {selectedMember.phone || "No phone"}
                    </span>
                  }
                  title={selectedMember.phone ?? undefined}
                />
                <OverviewRow
                  label="Joined Date"
                  value={formatDate(selectedMember.created_at)}
                />
                <OverviewRow
                  label="Member Since"
                  value={formatMemberSince(selectedMember.created_at)}
                />
                <OverviewRow
                  label={t.common.status}
                  value={getLabel(memberStatusLabels, selectedMember.membership_status)}
                />
              </dl>
            </div>

            <div className="border-t border-slate-200 px-6 py-5">
              <h4 className="text-sm font-semibold text-slate-950">Department Assignments</h4>
              <div className="mt-4 space-y-4">
                <div>
                  <p className="text-sm font-medium text-emerald-700">
                    Active Departments ({selectedMember.active_departments?.length ?? 0})
                  </p>
                  <div className="mt-2">
                    <DepartmentPills items={selectedMember.active_departments ?? []} tone="active" />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-700">
                    Inactive Departments ({selectedMember.inactive_departments?.length ?? 0})
                  </p>
                  <div className="mt-2">
                    <DepartmentPills items={selectedMember.inactive_departments ?? []} tone="inactive" />
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-200 px-6 py-5">
              <div className="flex items-center justify-between gap-3">
                <h4 className="text-sm font-semibold text-slate-950">{t.members.notes}</h4>
                <Link
                  href={`/c/${churchSlug}/members/${selectedMember.id}/edit`}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                  aria-label="Edit member notes"
                >
                  <Edit3 className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>
              <p className="mt-3 text-sm text-slate-500">
                No notes available
              </p>
            </div>
          </div>

          <MemberInspectorActions churchSlug={churchSlug} member={selectedMember} />
        </>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500">
            <UserRound className="h-5 w-5" aria-hidden="true" />
          </div>
          <h3 className="mt-4 text-sm font-semibold text-slate-950">Select a member to view their profile.</h3>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            The inspector will show household, contact, assignment, notes, and portal invite actions.
          </p>
        </div>
      )}
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
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

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
    if (!selectedMemberId) return;

    const exists = data.members.some((member) => member.id === selectedMemberId);
    if (!exists) {
      setSelectedMemberId(data.members[0]?.id ?? null);
    }
  }, [data.members, selectedMemberId]);

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

  const selectedMember = useMemo(() => {
    if (!selectedMemberId) return null;
    return data.members.find((member) => member.id === selectedMemberId) ?? data.members[0] ?? null;
  }, [data.members, selectedMemberId]);

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

    if (typeof window !== "undefined" && window.matchMedia("(max-width: 1023px)").matches) {
      setMemberDetailOpen(true);
    }
  }

  const activeFilters = hasActiveFilters(data.filters);

  return (
    <div className="-mx-3 -my-3 min-h-[calc(100vh-6rem)] min-w-0 overflow-hidden bg-white sm:-mx-4 md:-mx-6 md:-my-5 xl:-mx-8">
      <div className="space-y-3 px-3 py-3 md:hidden">
        <MobilePageHeader
          title="Members"
          subtitle={`Active: ${data.stats.activeMembers} / Inactive: ${data.stats.inactiveMembers}`}
          actionLabel="Add Member"
          onActionClick={() => setMemberFormOpen(true)}
        />

        <form method="get" action={`/c/${churchSlug}/members`} className="flex items-center gap-2">
          <div className="relative min-w-0 flex-1">
            <label htmlFor="mobile-q" className="sr-only">
              {t.pages.membersWorkspace.filters.search}
            </label>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
            <input
              id="mobile-q"
              name="q"
              defaultValue={data.filters.q ?? ""}
              placeholder="Search name, code, phone, email..."
              className="h-11 w-full rounded-xl border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
          </div>
          <button
            type="submit"
            className="mobile-touch-feedback inline-flex min-h-[44px] shrink-0 items-center justify-center rounded-xl bg-slate-950 px-3 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            {t.common.search}
          </button>
          <button
            type="button"
            onClick={() => setMobileFiltersOpen(true)}
            className="mobile-touch-feedback inline-flex min-h-[44px] shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            aria-label="Open member filters"
          >
            <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
          </button>
        </form>

        <MobileCompactStatsStrip
          items={[
            { label: "Total", value: data.stats.totalMembers },
            { label: "Active", value: data.stats.activeMembers, tone: "success" },
            { label: "Inactive", value: data.stats.inactiveMembers },
            { label: "Visitors", value: data.stats.visitorMembers },
            { label: "Transferred", value: data.stats.transferredMembers },
            { label: "Households", value: data.stats.householdsCount },
            { label: "Assigned", value: data.stats.assignedMembersCount },
            { label: "Unassigned", value: data.stats.unassignedMembersCount, tone: "attention" },
          ]}
        />
      </div>

      <MembersWorkspaceHeader churchSlug={churchSlug} stats={data.stats} />

      <MembersToolbar
        churchSlug={churchSlug}
        filters={data.filters}
        departments={data.departments}
        resultCount={data.members.length}
      />

      <div className="grid min-w-0 grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px]">
        <section className="min-w-0 px-5 py-5">
          <MembersRegistryTable
            churchSlug={churchSlug}
            rows={data.members}
            selectedMemberId={selectedMember?.id ?? null}
            onSelectMember={handleSelectMember}
            hasFilters={activeFilters}
          />
        </section>

        <MemberInspector
          churchSlug={churchSlug}
          selectedMember={selectedMember}
          onClearSelectedMember={() => setSelectedMemberId(null)}
          variant="rail"
        />
      </div>

      <MobileBottomSheet
        open={mobileFiltersOpen}
        onOpenChange={setMobileFiltersOpen}
        title="Member Filters"
      >
        <MobileFiltersForm
          churchSlug={churchSlug}
          filters={data.filters}
          departments={data.departments}
        />
      </MobileBottomSheet>

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
        className="md:block lg:hidden"
      >
        <MemberInspector
          churchSlug={churchSlug}
          selectedMember={selectedMember}
        />
      </MobileBottomSheet>
    </div>
  );
}
