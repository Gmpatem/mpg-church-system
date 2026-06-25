"use client";

import type { KeyboardEvent, ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  BarChart3,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Edit3,
  House,
  Mail,
  MoreHorizontal,
  Plus,
  Search,
  Share2,
  SlidersHorizontal,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { createMemberInviteAction } from "@/features/member-invite/actions";
import { toast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useI18n } from "@/features/i18n";
import { getLabel, memberStatusLabels } from "@/lib/display-maps";
import { cn } from "@/lib/utils/cn";
import { WorkspaceEmptyState } from "@/components/workspace";
import {
  ChurchContentGrid,
  ChurchMainPanel,
  ChurchRightRail,
} from "@/components/church-workspace/patterns/ChurchPanels";
import { MobileBottomSheet } from "@/components/mobile/MobileBottomSheet";
import { MobileCompactStatsStrip } from "@/components/mobile/MobileCompactStatsStrip";
import { MobilePageHeader } from "@/components/mobile/MobilePageHeader";
import { AddMemberWizard } from "./AddMemberWizard";
import { RegistrationShareDialog } from "./onboarding/RegistrationShareDialog";

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
    householdOptions?: Array<{
      id: string;
      household_name: string;
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
    <Avatar
      className={cn(
        "shrink-0 border border-border ring-1",
        size === "lg" ? "size-14" : "size-9"
      )}
    >
      <AvatarFallback
        className={cn(
          "font-semibold",
          classes.avatar,
          size === "lg" ? "text-lg" : "text-xs"
        )}
      >
        {getInitials(member)}
      </AvatarFallback>
    </Avatar>
  );
}

function MembersInlineStats({ stats }: { stats: Stats }) {
  const items = [
    { label: "Total Members", value: stats.totalMembers, icon: Users },
    { label: "Active", value: stats.activeMembers, dot: "bg-emerald-500" },
    { label: "Visitors", value: stats.visitorMembers, dot: "bg-blue-500" },
    { label: "Inactive", value: stats.inactiveMembers, dot: "bg-orange-500" },
    { label: "Households", value: stats.householdsCount, icon: House },
  ];

  return (
    <div className="flex min-w-0 flex-1 items-stretch overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {items.map((item, index) => {
        const isZero = item.value === 0;
        const Icon = "icon" in item ? item.icon : undefined;

        return (
          <div key={item.label} className="flex min-w-[128px] shrink-0 items-stretch">
            {index > 0 ? <Separator orientation="vertical" className="h-auto self-stretch" /> : null}
            <div className="flex min-w-0 flex-1 flex-col justify-center px-5 first:pl-0">
              <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                {item.dot ? (
                  <span className={cn("size-1.5 rounded-full", item.dot)} aria-hidden="true" />
                ) : null}
                <span>{item.label}</span>
              </div>
              <div
                className={cn(
                  "mt-3 flex items-center gap-3 text-2xl font-semibold leading-none tabular-nums text-foreground",
                  isZero && "text-muted-foreground/70"
                )}
              >
                {numberFormat(item.value)}
                {Icon ? (
                  <Icon className="size-4 text-muted-foreground" aria-hidden="true" />
                ) : null}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function MembersViewTabs({ churchSlug, active }: { churchSlug: string; active: "registry" | "onboarding" }) {
  const tabs = [
    { href: `/c/${churchSlug}/members?view=registry`, label: "Registry", id: "registry" },
    { href: `/c/${churchSlug}/members?view=onboarding`, label: "Onboarding", id: "onboarding" },
  ];

  return (
    <div className="flex items-center gap-1 rounded-xl border border-border bg-background p-1 shadow-sm w-fit">
      {tabs.map(tab => (
        <Link
          key={tab.id}
          href={tab.href}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
            active === tab.id
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}

function MembersWorkspaceHeader({
  churchSlug,
  stats,
  onNewMember,
  onShare,
}: {
  churchSlug: string;
  stats: Stats;
  onNewMember: () => void;
  onShare: () => void;
}) {
  const { t } = useI18n();

  return (
    <header className="hidden rounded-2xl border border-border bg-background px-5 py-4 shadow-sm md:block">
      <div className="flex min-w-0 flex-col gap-4 xl:flex-row xl:items-center xl:justify-between xl:gap-6">
        <MembersInlineStats stats={stats} />

        <div className="flex shrink-0 flex-wrap items-center gap-3">
          <Button
            type="button"
            onClick={onShare}
            variant="outline"
            className="h-11 gap-2 rounded-lg bg-background px-5"
          >
            <Share2 className="size-4" aria-hidden="true" />
            Share registration
          </Button>
          <Button
            type="button"
            onClick={onNewMember}
            className="h-11 gap-2 rounded-lg px-5 font-semibold shadow-sm"
          >
            <Plus className="size-4" aria-hidden="true" />
            {t.pages.membersWorkspace.actions.newMember}
          </Button>
          <Button asChild variant="outline" className="h-11 gap-2 rounded-lg bg-background px-5">
            <Link href={`/c/${churchSlug}/households`}>
              <Users className="size-4" aria-hidden="true" />
              {t.navigation.households}
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-11 gap-2 rounded-lg bg-background px-5">
            <Link href={`/c/${churchSlug}/reports`}>
              <BarChart3 className="size-4" aria-hidden="true" />
              {t.pages.membersWorkspace.actions.reports}
            </Link>
          </Button>
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
  const [value, setValue] = useState(defaultValue ?? "");

  useEffect(() => {
    setValue(defaultValue ?? "");
  }, [defaultValue]);

  return (
    <div className={cn("min-w-[150px]", className)}>
      <Label htmlFor={id} className="mb-1.5 block text-[11px] font-medium text-muted-foreground">
        {label}
      </Label>
      <input type="hidden" name={name} value={value} />
      <Select
        value={value || "__all"}
        onValueChange={(nextValue) => setValue(nextValue === "__all" ? "" : nextValue)}
      >
        <SelectTrigger id={id} className="h-11 rounded-lg bg-background">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>{children}</SelectContent>
      </Select>
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
      className="min-w-0 rounded-2xl border border-border bg-background p-4 shadow-sm md:grid md:grid-cols-2 md:items-end md:gap-3 xl:grid-cols-[minmax(300px,1fr)_145px_185px_195px_auto_auto]"
    >
      <div className="relative min-w-0 md:col-span-2 xl:col-span-1">
          <label htmlFor="q" className="sr-only">
            {t.pages.membersWorkspace.filters.search}
          </label>
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            id="q"
            name="q"
            defaultValue={filters.q ?? ""}
            placeholder="Search name, code, phone, email..."
            className="h-11 rounded-lg pl-9"
          />
      </div>

        <FilterSelect
          id="status"
          name="status"
          label={t.pages.membersWorkspace.filters.memberStatus}
          defaultValue={filters.status}
          className="w-full min-w-0"
        >
          <SelectItem value="__all">{t.pages.membersWorkspace.filters.statusOptions.all}</SelectItem>
          <SelectItem value="active">{t.pages.membersWorkspace.filters.statusOptions.active}</SelectItem>
          <SelectItem value="inactive">{t.pages.membersWorkspace.filters.statusOptions.inactive}</SelectItem>
          <SelectItem value="visitor">{t.pages.membersWorkspace.filters.statusOptions.visitor}</SelectItem>
          <SelectItem value="transferred">{t.pages.membersWorkspace.filters.statusOptions.transferred}</SelectItem>
        </FilterSelect>

        <FilterSelect
          id="departmentId"
          name="departmentId"
          label={t.pages.membersWorkspace.filters.department}
          defaultValue={filters.departmentId}
          className="w-full min-w-0"
        >
          <SelectItem value="__all">{t.pages.membersWorkspace.filters.allDepartments}</SelectItem>
          {departments.map((department) => (
            <SelectItem key={department.id} value={department.id}>
              {department.name}
              {department.code ? ` (${department.code})` : ""}
            </SelectItem>
          ))}
        </FilterSelect>

        <FilterSelect
          id="departmentAssignmentStatus"
          name="departmentAssignmentStatus"
          label={t.pages.membersWorkspace.filters.assignmentStatus}
          defaultValue={filters.departmentAssignmentStatus}
          className="w-full min-w-0"
        >
          <SelectItem value="__all">{t.pages.membersWorkspace.filters.assignmentOptions.any}</SelectItem>
          <SelectItem value="active">{t.pages.membersWorkspace.filters.assignmentOptions.active}</SelectItem>
          <SelectItem value="inactive">{t.pages.membersWorkspace.filters.assignmentOptions.inactive}</SelectItem>
        </FilterSelect>
        <Button
          type="submit"
          variant="outline"
          className="h-11 gap-2 rounded-lg bg-background px-4"
        >
          <SlidersHorizontal className="size-4" aria-hidden="true" />
          Filters
        </Button>
      <div className="flex items-center gap-1 self-center whitespace-nowrap text-sm text-muted-foreground">
        <span>{numberFormat(resultCount)} results</span>
        {activeFilters ? (
          <Button asChild variant="link" className="h-auto px-1 py-0 text-xs">
            <Link href={`/c/${churchSlug}/members`}>{t.pages.membersWorkspace.filters.reset}</Link>
          </Button>
        ) : null}
      </div>
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
          className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-ring/20"
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
          className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-ring/20"
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
          className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-ring/20"
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
    <div className="flex min-w-0 items-center gap-3">
      <MemberAvatar member={member} />
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-foreground" title={label}>
          {label}
        </p>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">
          {member.member_code || "No member code"}
        </p>
      </div>
    </div>
  );
}

function MemberRow({
  member,
  isSelected,
  onSelectMember,
}: {
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
        "group h-[86px] cursor-pointer bg-background outline-none transition-colors hover:bg-muted/35 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
        isSelected && "bg-primary/[0.045] shadow-[inset_3px_0_0_hsl(var(--primary))] hover:bg-primary/[0.06]"
      )}
    >
      <td className="border-b border-border/70 px-4 py-3 pr-0 align-middle">
        <input
          type="checkbox"
          checked={isSelected}
          readOnly
          aria-label={`Select ${label}`}
          className="size-4 rounded border-border accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          onClick={(event) => {
            event.stopPropagation();
            onSelectMember(member.id);
          }}
        />
      </td>
      <td className="border-b border-border/70 px-3 py-3 align-middle">
        <MemberIdentityCell member={member} />
      </td>
      <td className="border-b border-border/70 px-3 py-3 align-middle">
        <MemberStatusIndicator status={member.membership_status} />
      </td>
      <td className="min-w-0 border-b border-border/70 px-3 py-3 align-middle text-sm text-foreground">
        <p className={cn("truncate", !member.household_name && "text-slate-400")} title={member.household_name ?? undefined}>
          {member.household_name || t.pages.membersWorkspace.directory.noHousehold}
        </p>
      </td>
      <td className="border-b border-border/70 px-3 py-3 align-middle">
        <MemberDepartmentSummary member={member} />
      </td>
      <td className="min-w-0 border-b border-border/70 px-3 py-3 align-middle text-sm">
        <p className={cn("truncate text-slate-800", !member.phone && "text-slate-400")} title={member.phone ?? undefined}>
          {member.phone || "-"}
        </p>
        <p className={cn("mt-0.5 truncate text-xs text-slate-500", !member.email && "text-slate-400")} title={member.email ?? undefined}>
          {member.email || t.pages.membersWorkspace.directory.noContact}
        </p>
      </td>
      <td className="whitespace-nowrap border-b border-border/70 px-3 py-3 align-middle text-sm text-foreground">
        {formatDate(member.created_at)}
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
        isSelected ? "border-primary/25 bg-primary/[0.05]" : "border-border"
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
    <ChurchMainPanel className="min-w-0 overflow-hidden rounded-2xl">
      {rows.length === 0 ? (
        <div className="p-4">
          {hasFilters ? (
            <div className="flex min-h-[260px] flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/40 px-6 py-10 text-center">
              <h2 className="text-base font-semibold text-foreground">No members match these filters.</h2>
              <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                Try a broader search or reset the filters to return to the full member registry.
              </p>
              <Button asChild variant="outline" className="mt-5">
                <Link href={`/c/${churchSlug}/members`}>{t.pages.membersWorkspace.filters.reset}</Link>
              </Button>
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
            <div className="hidden min-w-0 md:block">
              <table className="w-full table-fixed border-separate border-spacing-0 text-left text-sm">
                <colgroup>
                  <col style={{ width: "5%" }} />
                  <col style={{ width: "25%" }} />
                  <col style={{ width: "11%" }} />
                  <col style={{ width: "13%" }} />
                  <col style={{ width: "13%" }} />
                  <col style={{ width: "22%" }} />
                  <col style={{ width: "11%" }} />
                </colgroup>
                <thead>
                  <tr className="h-14 bg-muted/30 text-xs">
                    <th className="border-b border-border px-4 pr-0 text-left align-middle font-medium text-muted-foreground">
                      <input
                        type="checkbox"
                        aria-label="Selected member"
                        checked={false}
                        readOnly
                        className="size-4 rounded border-border accent-primary"
                      />
                    </th>
                    <th className="border-b border-border px-3 text-left align-middle font-medium text-muted-foreground">Member</th>
                    <th className="border-b border-border px-3 text-left align-middle font-medium text-muted-foreground">Status</th>
                    <th className="border-b border-border px-3 text-left align-middle font-medium text-muted-foreground">Household</th>
                    <th className="border-b border-border px-3 text-left align-middle font-medium text-muted-foreground">Departments</th>
                    <th className="border-b border-border px-3 text-left align-middle font-medium text-muted-foreground">Contact</th>
                    <th className="border-b border-border px-3 text-left align-middle font-medium text-muted-foreground">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((member) => (
                    <MemberRow
                      key={member.id}
                      member={member}
                      isSelected={member.id === selectedMemberId}
                      onSelectMember={onSelectMember}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </TooltipProvider>

          <div className="flex min-h-[80px] flex-col gap-3 border-t border-border px-5 py-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <p>
              Showing {numberFormat(start)} to {numberFormat(end)} of {numberFormat(rows.length)} members
            </p>
            <nav className="flex items-center gap-2" aria-label="Member registry pagination">
              <Button type="button" variant="outline" size="icon" className="size-9 rounded-lg" disabled aria-label="Previous page">
                <ChevronLeft className="size-4" aria-hidden="true" />
              </Button>
              <Button type="button" size="icon" className="size-9 rounded-lg" aria-current="page" aria-label="Page 1">
                1
              </Button>
              <Button type="button" variant="outline" size="icon" className="size-9 rounded-lg" disabled aria-label="Next page">
                <ChevronRight className="size-4" aria-hidden="true" />
              </Button>
            </nav>
          </div>
        </>
      )}
    </ChurchMainPanel>
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
    <div className="grid grid-cols-[88px_minmax(0,1fr)] gap-3 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="min-w-0 truncate text-right font-medium text-foreground" title={title}>
        {value}
      </dd>
    </div>
  );
}

function MemberInviteMenuItem({
  churchSlug,
  member,
}: {
  churchSlug: string;
  member: Member;
}) {
  const { t } = useI18n();
  const [status, setStatus] = useState<"idle" | "loading" | "success">("idle");

  async function handleGenerateInvite() {
    if (status === "loading") return;

    setStatus("loading");
    try {
      const result = await createMemberInviteAction(churchSlug, member.id);
      if (result.ok) {
        const fullUrl = window.location.origin + result.path;
        setStatus("success");
        toast({
          title: "Portal invite ready",
          description: fullUrl,
        });
      } else {
        setStatus("idle");
        toast({
          variant: "destructive",
          title: "Invite failed",
          description: result.error,
        });
      }
    } catch {
      setStatus("idle");
      toast({
        variant: "destructive",
        title: "Invite failed",
        description: t.pages.membersWorkspace.directory.invite.error,
      });
    }
  }

  return (
    <DropdownMenuItem
      onSelect={(event) => {
        event.preventDefault();
        void handleGenerateInvite();
      }}
      disabled={status === "loading"}
      className="h-10 gap-2"
    >
      <Mail className="size-4" aria-hidden="true" />
      {status === "loading"
        ? t.pages.membersWorkspace.directory.invite.generating
        : status === "success"
          ? "Invite ready"
          : "Invite to portal"}
    </DropdownMenuItem>
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
  const memberProfileHref = `/c/${churchSlug}/members/${member.id}`;
  const memberEditHref = `/c/${churchSlug}/members/${member.id}/edit`;

  return (
    <div className="space-y-2 px-4 pb-5 pt-4">
      <Button asChild className="h-11 w-full gap-2 rounded-lg px-3 font-semibold shadow-sm">
        <Link href={memberEditHref}>
          <Edit3 className="size-4" aria-hidden="true" />
          Edit member
        </Link>
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className="h-10 w-full justify-between rounded-lg bg-background px-3"
          >
            <span className="inline-flex items-center gap-2">
              <MoreHorizontal className="size-4" aria-hidden="true" />
              More actions
            </span>
            <ChevronDown className="size-4" aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" sideOffset={6} className="w-60 rounded-lg p-1">
          <DropdownMenuGroup>
            <MemberInviteMenuItem churchSlug={churchSlug} member={member} />
            <DropdownMenuItem asChild className="h-10 gap-2">
              <Link href={memberEditHref}>
                <Edit3 className="size-4" aria-hidden="true" />
                View or edit notes
              </Link>
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem asChild className="h-10 gap-2">
              <Link href={memberProfileHref}>
                <House className="size-4" aria-hidden="true" />
                Assign to household
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="h-10 gap-2">
              <Link href={memberProfileHref}>
                <Users className="size-4" aria-hidden="true" />
                Manage departments
              </Link>
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href={memberProfileHref}>
              <UserRound className="mr-2 size-4" aria-hidden="true" />
              {t.pages.membersWorkspace.directory.viewMember}
            </Link>
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
  const selectedStatusClasses = getStatusClasses(selectedMember?.membership_status);
  const selectedMemberDuration = selectedMember
    ? formatMemberSince(selectedMember.created_at)
    : "-";
  const selectedActiveDepartmentCount = selectedMember?.active_departments?.length ?? 0;
  const selectedInactiveDepartmentCount = selectedMember?.inactive_departments?.length ?? 0;

  return (
    <ChurchRightRail
      className={cn(
        "min-w-0 overflow-hidden rounded-2xl",
        isRail
          ? "hidden self-start xl:block"
          : "flex min-h-[560px] flex-col rounded-xl"
      )}
    >
      <div className="flex min-h-[58px] items-center justify-between px-5 py-4">
        <h2 className="text-sm font-semibold text-foreground">Selected Member</h2>
        {onClearSelectedMember ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onClearSelectedMember}
            className="size-8 rounded-md text-muted-foreground"
            aria-label="Close selected member inspector"
          >
            <X className="size-4" aria-hidden="true" />
          </Button>
        ) : null}
      </div>

      {selectedMember ? (
        <>
          <Separator />
          <div className="flex items-center gap-4 px-5 py-5">
            <MemberAvatar member={selectedMember} size="lg" />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="truncate text-lg font-semibold text-foreground">
                  {getMemberLabel(selectedMember)}
                </h3>
                <MemberStatusIndicator status={selectedMember.membership_status} className="text-xs" />
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {selectedMember.member_code || "No member code"}
              </p>
              <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                <CalendarDays className="size-4" aria-hidden="true" />
                {selectedMemberDuration === "-"
                  ? "Member timeline unavailable"
                  : `Member for ${selectedMemberDuration}`}
              </p>
            </div>
          </div>

          <Separator />
          <div className="px-5 py-5">
            <h4 className="text-sm font-semibold text-foreground">Overview</h4>
            <dl className="mt-4 space-y-4">
              <OverviewRow
                label={t.members.household}
                value={
                  <span className={cn(!selectedMember.household_name && "text-muted-foreground")}>
                    {selectedMember.household_name || t.pages.membersWorkspace.directory.noHousehold}
                  </span>
                }
                title={selectedMember.household_name ?? undefined}
              />
              <OverviewRow
                label={t.members.email}
                value={
                  <span className={cn("block truncate", !selectedMember.email && "text-muted-foreground")}>
                    {selectedMember.email || "No email"}
                  </span>
                }
                title={selectedMember.email ?? undefined}
              />
              <OverviewRow
                label={t.members.phone}
                value={
                  <span className={cn(!selectedMember.phone && "text-muted-foreground")}>
                    {selectedMember.phone || "No phone"}
                  </span>
                }
                title={selectedMember.phone ?? undefined}
              />
              <OverviewRow
                label="Joined"
                value={formatDate(selectedMember.created_at)}
              />
              <OverviewRow
                label={t.common.status}
                value={
                  <span className={selectedStatusClasses.text}>
                    {getLabel(memberStatusLabels, selectedMember.membership_status)}
                  </span>
                }
              />
            </dl>
          </div>

          <Separator />
          <Link
            href={`/c/${churchSlug}/members/${selectedMember.id}`}
            className="flex min-h-[58px] items-center justify-between gap-3 px-5 py-4 text-sm transition hover:bg-muted/35"
          >
            <span className="font-semibold text-foreground">Departments</span>
            <span className="inline-flex min-w-0 items-center gap-1 text-muted-foreground">
              <span className="truncate">
                {selectedActiveDepartmentCount} active / {selectedInactiveDepartmentCount} inactive
              </span>
              <ChevronRight className="size-4 shrink-0" aria-hidden="true" />
            </span>
          </Link>

          <Separator />
          <MemberInspectorActions churchSlug={churchSlug} member={selectedMember} />
        </>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <UserRound className="size-5" aria-hidden="true" />
          </div>
          <h3 className="mt-4 text-sm font-semibold text-foreground">Select a member to view their profile.</h3>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            The inspector will show household, contact, assignments, and portal actions.
          </p>
        </div>
      )}
    </ChurchRightRail>
  );
}

export function MembersWorkspaceUnified({
  churchSlug,
  data,
}: MembersWorkspaceUnifiedProps) {
  const { t } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(data.members[0]?.id ?? null);
  const [addMemberWizardOpen, setAddMemberWizardOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [pendingCreatedMemberId, setPendingCreatedMemberId] = useState<string | null>(null);
  const [memberDetailOpen, setMemberDetailOpen] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  useEffect(() => {
    router.prefetch(`/c/${churchSlug}/households`);
    router.prefetch(`/c/${churchSlug}/departments`);
    router.prefetch(`/c/${churchSlug}/reports`);
  }, [churchSlug, router]);

  useEffect(() => {
    if (searchParams.get("action") !== "new") return;

    setAddMemberWizardOpen(true);

    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.delete("action");
    const nextQuery = nextParams.toString();
    window.history.replaceState(null, "", nextQuery ? `${pathname}?${nextQuery}` : pathname);
  }, [pathname, searchParams]);

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
    if (exists) {
      if (pendingCreatedMemberId === selectedMemberId) {
        setPendingCreatedMemberId(null);
      }
      return;
    }

    if (pendingCreatedMemberId === selectedMemberId) {
      return;
    }

    if (!exists) {
      setSelectedMemberId(data.members[0]?.id ?? null);
    }
  }, [data.members, pendingCreatedMemberId, selectedMemberId]);

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
    return data.members.find((member) => member.id === selectedMemberId) ?? null;
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

    if (typeof window !== "undefined" && window.matchMedia("(max-width: 1279px)").matches) {
      setMemberDetailOpen(true);
    }
  }

  function handleMemberCreated(memberId: string) {
    setPendingCreatedMemberId(memberId);
    setSelectedMemberId(memberId);
    setAddMemberWizardOpen(false);
    router.refresh();
  }

  const activeFilters = hasActiveFilters(data.filters);

  return (
    <div className="min-w-0 space-y-4">
      <div className="hidden space-y-4 md:block">
        <MembersWorkspaceHeader
          churchSlug={churchSlug}
          stats={data.stats}
          onNewMember={() => setAddMemberWizardOpen(true)}
          onShare={() => setShareDialogOpen(true)}
        />

        <MembersViewTabs churchSlug={churchSlug} active="registry" />

        <MembersToolbar
          churchSlug={churchSlug}
          filters={data.filters}
          departments={data.departments}
          resultCount={data.members.length}
        />
      </div>

      <div className="!mt-0 space-y-3 md:hidden">
        <MobilePageHeader
          title="Members"
          subtitle={`Active: ${data.stats.activeMembers} / Inactive: ${data.stats.inactiveMembers}`}
          actionLabel="Add Member"
          onActionClick={() => setAddMemberWizardOpen(true)}
          className="[&_button]:bg-primary [&_button]:text-primary-foreground [&_button:hover]:bg-primary/90"
        />

        <form method="get" action={`/c/${churchSlug}/members`} className="flex items-center gap-2">
          <div className="relative min-w-0 flex-1">
            <label htmlFor="mobile-q" className="sr-only">
              {t.pages.membersWorkspace.filters.search}
            </label>
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input
              id="mobile-q"
              name="q"
              defaultValue={data.filters.q ?? ""}
              placeholder="Search name, code, phone, email..."
              className="h-11 rounded-xl pl-9"
            />
          </div>
          <Button type="submit" className="mobile-touch-feedback h-11 shrink-0 rounded-xl px-3">
            {t.common.search}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => setMobileFiltersOpen(true)}
            className="mobile-touch-feedback size-11 shrink-0 rounded-xl bg-background"
            aria-label="Open member filters"
          >
            <SlidersHorizontal className="size-4" aria-hidden="true" />
          </Button>
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

      <ChurchContentGrid className="items-start gap-3 xl:grid-cols-[minmax(0,1fr)_340px]">
        <section className="min-w-0">
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
      </ChurchContentGrid>

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

      <AddMemberWizard
        open={addMemberWizardOpen}
        onOpenChange={setAddMemberWizardOpen}
        churchId={data.church.id}
        churchSlug={churchSlug}
        departments={departmentOptionsForForm}
        households={data.householdOptions ?? data.households}
        onCreated={handleMemberCreated}
      />

      <MobileBottomSheet
        open={memberDetailOpen}
        onOpenChange={setMemberDetailOpen}
        title="Member Details"
        className="md:block xl:hidden"
      >
        <MemberInspector
          churchSlug={churchSlug}
          selectedMember={selectedMember}
        />
      </MobileBottomSheet>

      <RegistrationShareDialog
        open={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
        churchSlug={churchSlug}
      />
    </div>
  );
}
