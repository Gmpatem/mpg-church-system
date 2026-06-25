"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Archive,
  BarChart3,
  Bell,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  Download,
  Eye,
  FileBadge,
  FileClock,
  FileText,
  Filter,
  Folder,
  Landmark,
  LayoutList,
  Mail,
  Megaphone,
  MoreVertical,
  Plus,
  Printer,
  Search,
  ShieldCheck,
  Upload,
  UserCog,
  UserPlus,
  Users,
  UsersRound,
} from "lucide-react";
import {
  ChurchBadge,
  ChurchButton,
  ChurchContentGrid,
  ChurchMainPanel,
  ChurchRightRail,
} from "@/components/church-workspace";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils/cn";

type OfficeQueueItem = {
  id: string;
  type: "access_request" | "leadership_request" | "announcement_review" | "event_approval" | "today_event";
  title: string;
  description: string;
  href: string;
  createdAt?: string | null;
  startsAt?: string | null;
  status?: string | null;
};

type OfficeCalendarItem = {
  id: string;
  title: string;
  event_type: string;
  start_datetime: string | null;
  status: string | null;
  workflow_state: string | null;
};

type OfficeWorkspaceData = {
  church: { id: string; slug: string; name: string };
  roles: string[];
  stats: {
    totalMembers: number;
    activeDepartments: number;
    pendingAccessRequests: number;
    pendingLeadershipRequests: number;
    announcementsNeedingPublish: number;
    departmentEventsAwaitingApproval: number;
    upcomingEvents: number;
    todaysEvents: number;
  };
  upcomingEvents: Array<{ id: string; title: string; start_datetime: string; status: string }>;
  secretaryCalendar?: {
    pendingSubmissions: OfficeCalendarItem[];
    sharedCalendar: OfficeCalendarItem[];
  };
  queue: OfficeQueueItem[];
};

type OfficeWorkspaceKey = "records" | "documentation" | "operations" | "governance" | "reporting";
type OfficeViewKey =
  | "members"
  | "households"
  | "departments"
  | "membership-actions"
  | "profile-completion"
  | "onboarding"
  | "library"
  | "minutes"
  | "letters"
  | "correspondence"
  | "templates"
  | "archive"
  | "assignments"
  | "events"
  | "calendar"
  | "announcements"
  | "agenda"
  | "access"
  | "leadership"
  | "approvals"
  | "audit"
  | "quick-reports"
  | "saved-reports"
  | "exports"
  | "scheduled-reports"
  | "snapshots"
  | "office-activity";

type RegistryRow = {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  reference: string;
  relatedTo: string;
  status: string;
  updated: string;
  href?: string;
  icon: LucideIcon;
  tone?: "success" | "warning" | "danger" | "quiet";
};

const primaryWorkspaces: Array<{
  key: OfficeWorkspaceKey;
  label: string;
  description: string;
  icon: LucideIcon;
}> = [
  { key: "records", label: "Records", description: "Members, Households, Departments", icon: Users },
  { key: "documentation", label: "Documentation", description: "Library, Minutes, Letters, Templates", icon: FileText },
  { key: "operations", label: "Operations", description: "Assignments, Events, Announcements", icon: CalendarDays },
  { key: "governance", label: "Governance", description: "Access, Leadership, Approvals", icon: ShieldCheck },
  { key: "reporting", label: "Reporting", description: "Reports, Office Activity", icon: BarChart3 },
];

const secondaryViews: Record<OfficeWorkspaceKey, Array<{ key: OfficeViewKey; label: string }>> = {
  records: [
    { key: "members", label: "Members" },
    { key: "households", label: "Households" },
    { key: "departments", label: "Departments" },
    { key: "membership-actions", label: "Membership Actions" },
    { key: "profile-completion", label: "Profile Completion" },
    { key: "onboarding", label: "Onboarding" },
  ],
  documentation: [
    { key: "library", label: "Document Library" },
    { key: "minutes", label: "Meeting Minutes" },
    { key: "letters", label: "Letters & Certificates" },
    { key: "correspondence", label: "Correspondence" },
    { key: "templates", label: "Templates" },
    { key: "archive", label: "Archive" },
  ],
  operations: [
    { key: "assignments", label: "Assignments" },
    { key: "events", label: "Events" },
    { key: "calendar", label: "Calendar" },
    { key: "announcements", label: "Announcements" },
    { key: "agenda", label: "Agenda" },
  ],
  governance: [
    { key: "access", label: "Access Requests" },
    { key: "leadership", label: "Leadership" },
    { key: "approvals", label: "Approvals" },
    { key: "audit", label: "Audit" },
  ],
  reporting: [
    { key: "quick-reports", label: "Quick Reports" },
    { key: "saved-reports", label: "Saved Reports" },
    { key: "exports", label: "Exports" },
    { key: "scheduled-reports", label: "Scheduled Reports" },
    { key: "snapshots", label: "Snapshots" },
    { key: "office-activity", label: "Office Activity" },
  ],
};

const documentationCategories = [
  { label: "All Documents", count: 0, icon: FileText },
  { label: "Recent", count: 0, icon: FileClock },
  { label: "Meeting Minutes", count: 0, icon: ClipboardCheck },
  { label: "Letters & Certificates", count: 0, icon: FileBadge },
  { label: "Correspondence", count: 0, icon: Mail },
  { label: "Templates", count: 0, icon: Folder },
  { label: "Archive", count: 0, icon: Archive },
];

const statusTone = {
  success: "border-primary/20 bg-primary/10 text-primary",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  danger: "border-destructive/20 bg-destructive/10 text-destructive",
  quiet: "border-border bg-muted text-muted-foreground",
};

const queueTypeLabels: Record<OfficeQueueItem["type"], string> = {
  access_request: "Access Request",
  leadership_request: "Leadership",
  announcement_review: "Announcement",
  event_approval: "Event Approval",
  today_event: "Today",
};

function formatNumber(value: number) {
  return value.toLocaleString("en-US");
}

function formatDateTime(value?: string | null) {
  if (!value) return "Not scheduled";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function normalizeStatusLabel(value?: string | null) {
  if (!value) return "Unspecified";
  return value.replace(/[_-]/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function normalizeWorkspace(value: string | null): OfficeWorkspaceKey {
  return primaryWorkspaces.some((workspace) => workspace.key === value) ? (value as OfficeWorkspaceKey) : "records";
}

function normalizeView(workspace: OfficeWorkspaceKey, value: string | null): OfficeViewKey {
  const views = secondaryViews[workspace];
  return views.some((view) => view.key === value) ? (value as OfficeViewKey) : views[0].key;
}

function rowTone(status?: string | null): RegistryRow["tone"] {
  const normalized = (status ?? "").toLowerCase();
  if (["active", "approved", "published", "ready", "scheduled", "clear"].some((term) => normalized.includes(term))) return "success";
  if (["pending", "draft", "review"].some((term) => normalized.includes(term))) return "warning";
  if (["blocked", "unavailable", "rejected"].some((term) => normalized.includes(term))) return "danger";
  return "quiet";
}

function queueTime(item: OfficeQueueItem) {
  return item.startsAt ?? item.createdAt ?? null;
}

function filterRows(rows: RegistryRow[], search: string, status: string) {
  const needle = search.trim().toLowerCase();
  return rows.filter((row) => {
    const haystack = [row.title, row.subtitle, row.category, row.reference, row.relatedTo, row.status].join(" ").toLowerCase();
    const matchesSearch = !needle || haystack.includes(needle);
    const matchesStatus = !status || row.status.toLowerCase().includes(status);
    return matchesSearch && matchesStatus;
  });
}

function buildRecordsRows(data: OfficeWorkspaceData, churchSlug: string, view: OfficeViewKey): RegistryRow[] {
  const pendingMembership = data.stats.pendingAccessRequests + data.stats.pendingLeadershipRequests;
  const rows: RegistryRow[] = [
    {
      id: "records-members",
      title: "Member Registry",
      subtitle: `${formatNumber(data.stats.totalMembers)} member records available in the source module`,
      category: "Members",
      reference: "MEM-REG",
      relatedTo: "Membership records",
      status: "Active",
      updated: "Source module",
      href: `/c/${churchSlug}/members`,
      icon: Users,
      tone: "success",
    },
    {
      id: "records-households",
      title: "Household Desk",
      subtitle: "Family units and household relationships remain managed by the Household module",
      category: "Households",
      reference: "HHD-DESK",
      relatedTo: "Family records",
      status: "Open Module",
      updated: "Source module",
      href: `/c/${churchSlug}/households`,
      icon: UsersRound,
      tone: "quiet",
    },
    {
      id: "records-departments",
      title: "Department Records",
      subtitle: `${formatNumber(data.stats.activeDepartments)} active departments linked to the church structure`,
      category: "Departments",
      reference: "DPT-REG",
      relatedTo: "Ministry structure",
      status: "Active",
      updated: "Source module",
      href: `/c/${churchSlug}/departments`,
      icon: Landmark,
      tone: "success",
    },
    {
      id: "records-membership-actions",
      title: "Membership Actions",
      subtitle: `${formatNumber(pendingMembership)} access or leadership requests need office review`,
      category: "Membership Actions",
      reference: "ACT-QUEUE",
      relatedTo: "Access and leadership",
      status: pendingMembership > 0 ? "Pending Review" : "Clear",
      updated: "Live queue",
      href: `/c/${churchSlug}/access-control`,
      icon: UserPlus,
      tone: pendingMembership > 0 ? "warning" : "success",
    },
    {
      id: "records-profile-completion",
      title: "Profile Completion",
      subtitle: "Profile quality work opens the member workspace until Office-specific rules are configured",
      category: "Profile Completion",
      reference: "PROFILE",
      relatedTo: "Member records",
      status: "Open Module",
      updated: "Source module",
      href: `/c/${churchSlug}/members`,
      icon: CheckCircle2,
      tone: "quiet",
    },
    {
      id: "records-onboarding",
      title: "Onboarding",
      subtitle: "Invite and access onboarding remain connected to the verified access workflow",
      category: "Onboarding",
      reference: "ONBOARD",
      relatedTo: "Invites & Access",
      status: data.stats.pendingAccessRequests > 0 ? "Pending Review" : "Clear",
      updated: "Live queue",
      href: `/c/${churchSlug}/access-control`,
      icon: UserCog,
      tone: data.stats.pendingAccessRequests > 0 ? "warning" : "success",
    },
  ];

  const categoryByView: Partial<Record<OfficeViewKey, string>> = {
    members: "Members",
    households: "Households",
    departments: "Departments",
    "membership-actions": "Membership Actions",
    "profile-completion": "Profile Completion",
    onboarding: "Onboarding",
  };
  return rows.filter((row) => row.category === (categoryByView[view] ?? row.category));
}

function buildOperationsRows(data: OfficeWorkspaceData, churchSlug: string, view: OfficeViewKey): RegistryRow[] {
  const queueRows: RegistryRow[] = data.queue.map((item) => ({
    id: item.id,
    title: item.title,
    subtitle: item.description,
    category: queueTypeLabels[item.type],
    reference: item.type.replace(/_/g, "-").toUpperCase(),
    relatedTo: item.type === "today_event" ? "Calendar" : "Office queue",
    status: normalizeStatusLabel(item.status),
    updated: formatDateTime(queueTime(item)),
    href: item.href,
    icon: item.type === "announcement_review" ? Megaphone : item.type === "access_request" ? ShieldCheck : CalendarDays,
    tone: rowTone(item.status ?? "Pending Review"),
  }));

  const eventRows: RegistryRow[] = data.upcomingEvents.map((event) => ({
    id: `event-${event.id}`,
    title: event.title,
    subtitle: "Scheduled event from the church event system",
    category: "Events",
    reference: "EVENT",
    relatedTo: "Church calendar",
    status: normalizeStatusLabel(event.status),
    updated: formatDateTime(event.start_datetime),
    href: `/c/${churchSlug}/events?eventId=${event.id}&tab=detail`,
    icon: CalendarDays,
    tone: rowTone(event.status),
  }));

  const pendingCalendarRows: RegistryRow[] = (data.secretaryCalendar?.pendingSubmissions ?? []).map((event) => ({
    id: `calendar-${event.id}`,
    title: event.title,
    subtitle: `${normalizeStatusLabel(event.event_type)} submission awaiting review`,
    category: "Calendar",
    reference: "CAL-PENDING",
    relatedTo: "Events",
    status: normalizeStatusLabel(event.workflow_state ?? event.status),
    updated: formatDateTime(event.start_datetime),
    href: `/c/${churchSlug}/events?eventId=${event.id}&tab=detail`,
    icon: CalendarDays,
    tone: "warning",
  }));

  if (view === "assignments") return queueRows.filter((row) => row.category !== "Today");
  if (view === "events") return [...eventRows, ...queueRows.filter((row) => row.category === "Event Approval")];
  if (view === "calendar") return [...pendingCalendarRows, ...eventRows];
  if (view === "announcements") return queueRows.filter((row) => row.category === "Announcement");
  if (view === "agenda") return [...queueRows.filter((row) => row.category === "Today"), ...eventRows];
  return [...queueRows, ...eventRows];
}

function buildGovernanceRows(data: OfficeWorkspaceData, churchSlug: string, view: OfficeViewKey): RegistryRow[] {
  const fallbackRows: RegistryRow[] = [
    {
      id: "governance-access",
      title: "Access Request Desk",
      subtitle: `${formatNumber(data.stats.pendingAccessRequests)} pending requests in the source workflow`,
      category: "Access Requests",
      reference: "ACCESS",
      relatedTo: "Invites & Access",
      status: data.stats.pendingAccessRequests > 0 ? "Pending Review" : "Clear",
      updated: "Live count",
      href: `/c/${churchSlug}/access-control`,
      icon: ShieldCheck,
      tone: data.stats.pendingAccessRequests > 0 ? "warning" : "success",
    },
    {
      id: "governance-leadership",
      title: "Leadership Request Desk",
      subtitle: `${formatNumber(data.stats.pendingLeadershipRequests)} pending requests in the leadership workflow`,
      category: "Leadership",
      reference: "LEAD",
      relatedTo: "Departments",
      status: data.stats.pendingLeadershipRequests > 0 ? "Pending Review" : "Clear",
      updated: "Live count",
      href: `/c/${churchSlug}/leadership?tab=requests`,
      icon: UserCog,
      tone: data.stats.pendingLeadershipRequests > 0 ? "warning" : "success",
    },
    {
      id: "governance-approvals",
      title: "Approval Queue",
      subtitle: `${formatNumber(data.stats.departmentEventsAwaitingApproval + data.stats.announcementsNeedingPublish)} event and announcement items need attention`,
      category: "Approvals",
      reference: "APPROVALS",
      relatedTo: "Events and announcements",
      status: data.stats.departmentEventsAwaitingApproval + data.stats.announcementsNeedingPublish > 0 ? "Pending Review" : "Clear",
      updated: "Live count",
      href: `/c/${churchSlug}/approvals`,
      icon: ClipboardCheck,
      tone: data.stats.departmentEventsAwaitingApproval + data.stats.announcementsNeedingPublish > 0 ? "warning" : "success",
    },
    {
      id: "governance-audit",
      title: "Audit Review",
      subtitle: "Audit trails remain available from the source modules that own each decision",
      category: "Audit",
      reference: "AUDIT",
      relatedTo: "Source modules",
      status: "Source Owned",
      updated: "Open module",
      href: `/c/${churchSlug}/reports`,
      icon: FileText,
      tone: "quiet",
    },
  ];

  if (view === "access") return fallbackRows.filter((row) => row.category === "Access Requests");
  if (view === "leadership") return fallbackRows.filter((row) => row.category === "Leadership");
  if (view === "approvals") return fallbackRows.filter((row) => row.category === "Approvals");
  if (view === "audit") return fallbackRows.filter((row) => row.category === "Audit");
  return fallbackRows;
}

function buildReportingRows(data: OfficeWorkspaceData, churchSlug: string, view: OfficeViewKey): RegistryRow[] {
  const rows: RegistryRow[] = [
    {
      id: "reports-quick",
      title: "Quick Reports",
      subtitle: "Open cross-module reports for members, departments, events, and governance activity",
      category: "Quick Reports",
      reference: "REPORTS",
      relatedTo: "Reports module",
      status: "Ready",
      updated: "Open module",
      href: `/c/${churchSlug}/reports`,
      icon: BarChart3,
      tone: "success",
    },
    {
      id: "reports-saved",
      title: "Saved Reports",
      subtitle: "Saved presets are managed by the reporting workspace",
      category: "Saved Reports",
      reference: "PRESETS",
      relatedTo: "Reports module",
      status: "Open Module",
      updated: "Source module",
      href: `/c/${churchSlug}/reports`,
      icon: FileText,
      tone: "quiet",
    },
    {
      id: "reports-exports",
      title: "Exports",
      subtitle: "Run exports only from the verified reporting workflow",
      category: "Exports",
      reference: "EXPORTS",
      relatedTo: "Reports module",
      status: "Open Module",
      updated: "Source module",
      href: `/c/${churchSlug}/reports`,
      icon: Download,
      tone: "quiet",
    },
    {
      id: "reports-scheduled",
      title: "Scheduled Reports",
      subtitle: "Scheduled delivery opens from the reports source when configured there",
      category: "Scheduled Reports",
      reference: "SCHEDULED",
      relatedTo: "Reports module",
      status: "Source Owned",
      updated: "Open module",
      href: `/c/${churchSlug}/reports`,
      icon: CalendarDays,
      tone: "quiet",
    },
    {
      id: "reports-snapshots",
      title: "Snapshots",
      subtitle: `${formatNumber(data.stats.totalMembers)} members, ${formatNumber(data.stats.activeDepartments)} departments, ${formatNumber(data.stats.upcomingEvents)} upcoming events`,
      category: "Snapshots",
      reference: "SNAPSHOT",
      relatedTo: "Office summary",
      status: "Live Summary",
      updated: "Now",
      href: `/c/${churchSlug}/reports`,
      icon: BarChart3,
      tone: "success",
    },
    {
      id: "reports-office-activity",
      title: "Office Activity",
      subtitle: `${formatNumber(data.queue.length)} active office signals are visible for your role`,
      category: "Office Activity",
      reference: "ACTIVITY",
      relatedTo: "Office queue",
      status: data.queue.length > 0 ? "Active" : "Quiet",
      updated: "Live queue",
      href: `/c/${churchSlug}/office?workspace=operations&view=assignments`,
      icon: Bell,
      tone: data.queue.length > 0 ? "warning" : "success",
    },
  ];

  const categoryByView: Partial<Record<OfficeViewKey, string>> = {
    "quick-reports": "Quick Reports",
    "saved-reports": "Saved Reports",
    exports: "Exports",
    "scheduled-reports": "Scheduled Reports",
    snapshots: "Snapshots",
    "office-activity": "Office Activity",
  };
  return rows.filter((row) => row.category === (categoryByView[view] ?? row.category));
}

function SummaryMetric({
  icon: Icon,
  label,
  value,
  hint,
  urgent,
}: {
  icon: LucideIcon;
  label: string;
  value: number;
  hint: string;
  urgent?: boolean;
}) {
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-xl border border-border bg-background px-4 py-3 shadow-sm">
      <span className={cn("inline-flex size-10 shrink-0 items-center justify-center rounded-full", urgent ? "bg-amber-50 text-amber-700" : "bg-primary/10 text-primary")}>
        <Icon className="size-4" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="truncate text-xs font-medium text-muted-foreground">{label}</p>
        <div className="mt-1 flex items-baseline gap-2">
          <p className="text-2xl font-semibold tracking-tight text-foreground">{formatNumber(value)}</p>
          <p className="truncate text-xs text-muted-foreground">{hint}</p>
        </div>
      </div>
    </div>
  );
}

function OfficeTabs({
  activeWorkspace,
  onChange,
}: {
  activeWorkspace: OfficeWorkspaceKey;
  onChange: (workspace: OfficeWorkspaceKey) => void;
}) {
  return (
    <div className="rounded-xl border border-border bg-background shadow-sm">
      <div role="tablist" aria-label="Church Office primary workspaces" className="grid min-w-0 md:grid-cols-2 xl:grid-cols-5">
        {primaryWorkspaces.map((workspace) => {
          const Icon = workspace.icon;
          const active = workspace.key === activeWorkspace;

          return (
            <button
              key={workspace.key}
              id={`office-tab-${workspace.key}`}
              type="button"
              role="tab"
              aria-selected={active}
              aria-controls={`office-panel-${workspace.key}`}
              onClick={() => onChange(workspace.key)}
              className={cn(
                "relative flex min-w-0 items-center gap-3 border-b border-border px-4 py-4 text-left transition hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring xl:border-b-0 xl:border-r last:xl:border-r-0",
                active && "bg-primary/5"
              )}
            >
              <span className={cn("inline-flex size-10 shrink-0 items-center justify-center rounded-lg border", active ? "border-primary/20 bg-primary/10 text-primary" : "border-border bg-muted/30 text-muted-foreground")}>
                <Icon className="size-5" aria-hidden="true" />
              </span>
              <span className="min-w-0">
                <span className={cn("block truncate text-sm font-semibold", active ? "text-primary" : "text-foreground")}>{workspace.label}</span>
                <span className="mt-1 block truncate text-xs text-muted-foreground">{workspace.description}</span>
              </span>
              {active ? <span className="absolute inset-x-4 bottom-0 h-0.5 rounded-full bg-primary" aria-hidden="true" /> : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function OfficeSecondaryTabs({
  activeWorkspace,
  activeView,
  onChange,
}: {
  activeWorkspace: OfficeWorkspaceKey;
  activeView: OfficeViewKey;
  onChange: (view: OfficeViewKey) => void;
}) {
  return (
    <div className="rounded-xl border border-border bg-background shadow-sm">
      <div role="tablist" aria-label="Church Office secondary views" className="flex min-w-0 overflow-x-auto px-3">
        {secondaryViews[activeWorkspace].map((view) => {
          const active = view.key === activeView;
          return (
            <button
              key={view.key}
              id={`office-secondary-tab-${view.key}`}
              type="button"
              role="tab"
              aria-selected={active}
              aria-controls={`office-secondary-panel-${view.key}`}
              onClick={() => onChange(view.key)}
              className={cn(
                "relative h-12 shrink-0 px-4 text-sm font-medium text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring md:px-5",
                active && "text-primary"
              )}
            >
              {view.label}
              {active ? <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-primary" aria-hidden="true" /> : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SearchAndFilters({
  search,
  status,
  onSearchChange,
  onStatusChange,
}: {
  search: string;
  status: string;
  onSearchChange: (search: string) => void;
  onStatusChange: (status: string) => void;
}) {
  return (
    <div className="grid min-w-0 gap-2 border-b border-border p-4 md:grid-cols-[minmax(220px,1fr)_170px_auto]">
      <label className="relative min-w-0">
        <span className="sr-only">Search office workspace</span>
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={search} onChange={(event) => onSearchChange(event.target.value)} placeholder="Search workspace..." className="h-10 rounded-lg pl-9" />
      </label>
      <label className="min-w-0">
        <span className="sr-only">Status filter</span>
        <select
          value={status}
          onChange={(event) => onStatusChange(event.target.value)}
          aria-label="Status filter"
          className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none transition focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="pending">Pending</option>
          <option value="clear">Clear</option>
          <option value="open">Open Module</option>
        </select>
      </label>
      <Button type="button" variant="outline" className="h-10 gap-2 rounded-lg bg-background">
        <Filter className="size-4" aria-hidden="true" />
        Filters
      </Button>
    </div>
  );
}

function StatusPill({ row }: { row: RegistryRow }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium", statusTone[row.tone ?? "quiet"])}>
      <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
      {row.status}
    </span>
  );
}

function RegistryTable({
  rows,
  selectedId,
  onSelect,
}: {
  rows: RegistryRow[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  if (rows.length === 0) {
    return (
      <div className="p-5">
        <div className="flex min-h-[260px] flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/40 px-6 py-10 text-center">
          <h3 className="text-base font-semibold text-foreground">No records match this view</h3>
          <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
            Try a different tab or clear the current filters. Office only shows data backed by verified source modules.
          </p>
        </div>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow className="bg-muted/40 hover:bg-muted/40">
          <TableHead className="w-10 px-4"><span className="sr-only">Select</span></TableHead>
          <TableHead className="min-w-[270px]">Record</TableHead>
          <TableHead className="min-w-[150px]">Category</TableHead>
          <TableHead className="min-w-[150px]">Reference</TableHead>
          <TableHead className="min-w-[170px]">Related To</TableHead>
          <TableHead className="min-w-[140px]">Status</TableHead>
          <TableHead className="min-w-[150px]">Updated</TableHead>
          <TableHead className="w-24 text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => {
          const Icon = row.icon;
          const selected = row.id === selectedId;

          return (
            <TableRow key={row.id} data-state={selected ? "selected" : undefined}>
              <TableCell className="px-4 py-3">
                <Checkbox checked={selected} onCheckedChange={() => onSelect(row.id)} aria-label={`Select ${row.title}`} />
              </TableCell>
              <TableCell className="py-3">
                <button type="button" onClick={() => onSelect(row.id)} className="flex min-w-0 items-center gap-3 text-left">
                  <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/40 text-muted-foreground">
                    <Icon className="size-4" aria-hidden="true" />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-foreground">{row.title}</span>
                    <span className="mt-0.5 block truncate text-xs text-muted-foreground">{row.subtitle}</span>
                  </span>
                </button>
              </TableCell>
              <TableCell className="py-3 text-sm text-muted-foreground">{row.category}</TableCell>
              <TableCell className="py-3 text-sm text-muted-foreground">{row.reference}</TableCell>
              <TableCell className="py-3 text-sm text-muted-foreground">{row.relatedTo}</TableCell>
              <TableCell className="py-3"><StatusPill row={row} /></TableCell>
              <TableCell className="py-3 text-sm text-muted-foreground">{row.updated}</TableCell>
              <TableCell className="py-3 text-right">
                <div className="flex justify-end gap-1">
                  {row.href ? (
                    <Button type="button" variant="outline" size="icon" className="size-8 rounded-lg bg-background" asChild>
                      <Link href={row.href} aria-label={`Open ${row.title}`}>
                        <Eye className="size-4" aria-hidden="true" />
                      </Link>
                    </Button>
                  ) : null}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button type="button" variant="ghost" size="icon" className="size-8 rounded-lg" aria-label={`More actions for ${row.title}`}>
                        <MoreVertical className="size-4" aria-hidden="true" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-52 rounded-lg">
                      {row.href ? (
                        <DropdownMenuItem asChild className="h-10 gap-2">
                          <Link href={row.href}>
                            <Eye className="size-4" aria-hidden="true" />
                            Open source module
                          </Link>
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem disabled>No actions available</DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

function DocumentationPanel({
  search,
  status,
  onSearchChange,
  onStatusChange,
}: {
  search: string;
  status: string;
  onSearchChange: (search: string) => void;
  onStatusChange: (status: string) => void;
}) {
  return (
    <ChurchContentGrid className="gap-4 lg:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[minmax(0,1fr)_340px]">
      <ChurchMainPanel className="min-w-0 overflow-hidden">
        <div className="border-b border-border px-5 py-4">
          <h2 className="text-base font-semibold text-foreground">Document Library</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Filing categories are ready; secure document storage has not been configured in this workspace yet.
          </p>
        </div>
        <div className="grid min-w-0 lg:grid-cols-[240px_minmax(0,1fr)]">
          <aside className="border-b border-border bg-muted/20 p-4 lg:border-b-0 lg:border-r">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Categories</p>
              <Button type="button" variant="outline" size="icon" className="size-8 rounded-lg bg-background" disabled>
                <Plus className="size-4" aria-hidden="true" />
                <span className="sr-only">Add category</span>
              </Button>
            </div>
            <div className="grid gap-1">
              {documentationCategories.map((category, index) => {
                const Icon = category.icon;
                return (
                  <button
                    key={category.label}
                    type="button"
                    className={cn(
                      "flex items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition",
                      index === 0 ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-background"
                    )}
                  >
                    <span className="inline-flex min-w-0 items-center gap-2">
                      <Icon className="size-4 shrink-0" aria-hidden="true" />
                      <span className="truncate">{category.label}</span>
                    </span>
                    <span className="text-xs tabular-nums">{category.count}</span>
                  </button>
                );
              })}
            </div>
          </aside>

          <div className="min-w-0">
            <SearchAndFilters search={search} status={status} onSearchChange={onSearchChange} onStatusChange={onStatusChange} />
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableHead className="w-10 px-4"><span className="sr-only">Select</span></TableHead>
                    <TableHead className="min-w-[260px]">Document</TableHead>
                    <TableHead className="min-w-[150px]">Category</TableHead>
                    <TableHead className="min-w-[150px]">Reference</TableHead>
                    <TableHead className="min-w-[140px]">Status</TableHead>
                    <TableHead className="min-w-[130px]">Version</TableHead>
                    <TableHead className="min-w-[150px]">Updated</TableHead>
                    <TableHead className="w-24 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
              </Table>
            </div>
            <div className="p-5">
              <div className="flex min-h-[260px] flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/40 px-6 py-10 text-center">
                <FileText className="size-9 text-muted-foreground" aria-hidden="true" />
                <h3 className="mt-4 text-base font-semibold text-foreground">Document storage unavailable</h3>
                <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                  No Office documents are shown until private storage, metadata, and signed access are configured.
                </p>
                <Button type="button" variant="outline" className="mt-5 gap-2 rounded-lg bg-background" disabled>
                  <Upload className="size-4" aria-hidden="true" />
                  Upload Document
                </Button>
              </div>
            </div>
          </div>
        </div>
      </ChurchMainPanel>

      <ChurchRightRail className="self-start overflow-hidden">
        <div className="border-b border-border px-5 py-4">
          <h2 className="text-base font-semibold text-foreground">Document Details</h2>
          <p className="mt-1 text-sm text-muted-foreground">No document selected.</p>
        </div>
        <div className="grid gap-4 p-5">
          <div className="rounded-xl border border-border bg-muted/30 p-4 text-center">
            <span className="mx-auto inline-flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <FileText className="size-5" aria-hidden="true" />
            </span>
            <p className="mt-3 text-sm font-semibold text-foreground">Private documents not configured</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              Preview, download, print, versions, and archive actions stay disabled until secure storage is available.
            </p>
          </div>
          <div className="grid gap-2">
            <Button type="button" variant="outline" className="justify-start gap-2 rounded-lg bg-background" disabled>
              <Eye className="size-4" aria-hidden="true" />
              Preview Document
            </Button>
            <div className="grid grid-cols-2 gap-2">
              <Button type="button" variant="outline" className="gap-2 rounded-lg bg-background" disabled>
                <Download className="size-4" aria-hidden="true" />
                Download
              </Button>
              <Button type="button" variant="outline" className="gap-2 rounded-lg bg-background" disabled>
                <Printer className="size-4" aria-hidden="true" />
                Print
              </Button>
            </div>
          </div>
          <Separator />
          {[
            ["Configured files", "0"],
            ["Pending review", "0"],
            ["Archived files", "0"],
            ["Signed URLs", "Unavailable"],
          ].map(([label, value]) => (
            <div key={label} className="flex items-center justify-between gap-3 text-sm">
              <span className="text-muted-foreground">{label}</span>
              <span className="font-medium text-foreground">{value}</span>
            </div>
          ))}
        </div>
      </ChurchRightRail>
    </ChurchContentGrid>
  );
}

function DetailRail({
  selectedRow,
  activeWorkspace,
  activeView,
  data,
}: {
  selectedRow: RegistryRow | null;
  activeWorkspace: OfficeWorkspaceKey;
  activeView: OfficeViewKey;
  data: OfficeWorkspaceData;
}) {
  const workspace = primaryWorkspaces.find((item) => item.key === activeWorkspace)!;
  const Icon = selectedRow?.icon ?? workspace.icon;

  return (
    <ChurchRightRail className="self-start overflow-hidden">
      <div className="border-b border-border px-5 py-4">
        <h2 className="text-base font-semibold text-foreground">{selectedRow ? "Selected Record" : "Workspace Details"}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{secondaryViews[activeWorkspace].find((view) => view.key === activeView)?.label}</p>
      </div>
      <div className="grid gap-5 p-5">
        <div className="rounded-xl border border-border bg-muted/30 p-4">
          <div className="flex min-w-0 items-start gap-3">
            <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Icon className="size-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">{selectedRow?.title ?? workspace.label}</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">{selectedRow?.subtitle ?? workspace.description}</p>
              {selectedRow ? <div className="mt-3"><StatusPill row={selectedRow} /></div> : null}
            </div>
          </div>
        </div>

        {[
          ["Reference", selectedRow?.reference ?? "OFFICE"],
          ["Category", selectedRow?.category ?? workspace.label],
          ["Related To", selectedRow?.relatedTo ?? data.church.name],
          ["Updated", selectedRow?.updated ?? "Live summary"],
        ].map(([label, value]) => (
          <div key={label} className="flex items-center justify-between gap-3 text-sm">
            <span className="text-muted-foreground">{label}</span>
            <span className="max-w-[11rem] truncate text-right font-medium text-foreground">{value}</span>
          </div>
        ))}

        <Separator />

        <div>
          <p className="text-sm font-semibold text-foreground">Quick Actions</p>
          <div className="mt-3 grid gap-2">
            {selectedRow?.href ? (
              <Button type="button" className="justify-start gap-2 rounded-lg" asChild>
                <Link href={selectedRow.href}>
                  <Eye className="size-4" aria-hidden="true" />
                  Open Source Module
                </Link>
              </Button>
            ) : (
              <Button type="button" className="justify-start gap-2 rounded-lg" disabled>
                <Eye className="size-4" aria-hidden="true" />
                Open Source Module
              </Button>
            )}
            <Button type="button" variant="outline" className="justify-start gap-2 rounded-lg bg-background" asChild>
              <Link href={`/c/${data.church.slug}/reports`}>
                <BarChart3 className="size-4" aria-hidden="true" />
                Open Reports
              </Link>
            </Button>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-muted/30 p-4">
          <p className="text-sm font-semibold text-foreground">Office Inbox</p>
          <div className="mt-3 grid gap-2">
            {data.queue.length === 0 ? (
              <p className="text-sm text-muted-foreground">No visible office signals for your role.</p>
            ) : (
              data.queue.slice(0, 3).map((item) => (
                <Link key={item.id} href={item.href} className="block rounded-lg border border-border bg-background px-3 py-2 text-sm transition hover:bg-muted/40">
                  <span className="block truncate font-medium text-foreground">{item.title}</span>
                  <span className="mt-1 block truncate text-xs text-muted-foreground">
                    {queueTypeLabels[item.type]} - {formatDateTime(queueTime(item))}
                  </span>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </ChurchRightRail>
  );
}

export function OfficeConsoleWorkspace({ churchSlug, data }: { churchSlug: string; data: OfficeWorkspaceData }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const initialWorkspace = normalizeWorkspace(searchParams.get("workspace"));
  const initialView = normalizeView(initialWorkspace, searchParams.get("view"));
  const [activeWorkspace, setActiveWorkspaceState] = useState<OfficeWorkspaceKey>(initialWorkspace);
  const [activeView, setActiveViewState] = useState<OfficeViewKey>(initialView);
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    const nextWorkspace = normalizeWorkspace(searchParams.get("workspace"));
    const nextView = normalizeView(nextWorkspace, searchParams.get("view"));
    setActiveWorkspaceState(nextWorkspace);
    setActiveViewState(nextView);
    setSelectedRowId(null);
  }, [searchParams]);

  function replaceOfficeQuery(workspace: OfficeWorkspaceKey, view: OfficeViewKey) {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    params.set("workspace", workspace);
    params.set("view", view);
    for (const key of ["dialog", "sheet", "memberId", "householdId", "departmentId", "documentId", "eventId", "approvalId"]) {
      params.delete(key);
    }
    const query = params.toString();
    window.history.replaceState(null, "", query ? `${pathname}?${query}` : pathname);
  }

  function setActiveWorkspace(workspace: OfficeWorkspaceKey) {
    const nextView = secondaryViews[workspace][0].key;
    setActiveWorkspaceState(workspace);
    setActiveViewState(nextView);
    setSelectedRowId(null);
    setSearch("");
    setStatus("");
    replaceOfficeQuery(workspace, nextView);
  }

  function setActiveView(view: OfficeViewKey) {
    setActiveViewState(view);
    setSelectedRowId(null);
    setSearch("");
    setStatus("");
    replaceOfficeQuery(activeWorkspace, view);
  }

  const registryRows = useMemo(() => {
    if (activeWorkspace === "records") return buildRecordsRows(data, churchSlug, activeView);
    if (activeWorkspace === "operations") return buildOperationsRows(data, churchSlug, activeView);
    if (activeWorkspace === "governance") return buildGovernanceRows(data, churchSlug, activeView);
    if (activeWorkspace === "reporting") return buildReportingRows(data, churchSlug, activeView);
    return [];
  }, [activeWorkspace, activeView, churchSlug, data]);

  const filteredRows = useMemo(() => filterRows(registryRows, search, status), [registryRows, search, status]);

  useEffect(() => {
    if (activeWorkspace === "documentation") return;
    if (filteredRows.length === 0) {
      setSelectedRowId(null);
      return;
    }
    if (!selectedRowId || !filteredRows.some((row) => row.id === selectedRowId)) {
      setSelectedRowId(filteredRows[0].id);
    }
  }, [activeWorkspace, filteredRows, selectedRowId]);

  const selectedRow = filteredRows.find((row) => row.id === selectedRowId) ?? null;
  const attentionCount =
    data.stats.pendingAccessRequests +
    data.stats.pendingLeadershipRequests +
    data.stats.announcementsNeedingPublish +
    data.stats.departmentEventsAwaitingApproval;

  return (
    <div className="min-w-0 space-y-4">
      <header className="flex min-w-0 flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">Church Office</h1>
            <ChurchBadge className="border-primary/20 bg-primary/10 text-primary hover:bg-primary/10">
              {data.roles.includes("church_secretary") ? "Secretary" : "Office"}
            </ChurchBadge>
          </div>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            Records, documents, operations, and governance for the church clerk and secretary.
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <label className="relative hidden min-w-0 md:block md:w-[320px] xl:w-[380px]">
            <span className="sr-only">Search Church Office</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search office workspace..." className="h-10 rounded-lg pl-9" />
          </label>
          <div className="inline-flex overflow-hidden rounded-lg shadow-sm">
            <Button type="button" className="h-10 gap-2 rounded-none rounded-l-lg px-4 font-semibold" asChild>
              <Link href={`/c/${churchSlug}/members`}>
                <Plus className="size-4" aria-hidden="true" />
                Quick Create
              </Link>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button type="button" className="h-10 rounded-none rounded-r-lg border-l border-primary-foreground/20 px-3" aria-label="Open Office quick create menu">
                  <ChevronDown className="size-4" aria-hidden="true" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 rounded-lg">
                <DropdownMenuItem asChild className="h-10 gap-2">
                  <Link href={`/c/${churchSlug}/members`}>
                    <UserPlus className="size-4" aria-hidden="true" />
                    Add member
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="h-10 gap-2">
                  <Link href={`/c/${churchSlug}/events`}>
                    <CalendarDays className="size-4" aria-hidden="true" />
                    Create event
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="h-10 gap-2">
                  <Link href={`/c/${churchSlug}/announcements`}>
                    <Megaphone className="size-4" aria-hidden="true" />
                    New announcement
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <section aria-label="Church Office summary" className="grid min-w-0 gap-3 md:grid-cols-2 xl:grid-cols-5">
        <SummaryMetric icon={Bell} label="Needs Attention" value={attentionCount} hint="open reviews" urgent={attentionCount > 0} />
        <SummaryMetric icon={FileText} label="Documents to File" value={0} hint="storage pending" />
        <SummaryMetric icon={Users} label="Member Records" value={data.stats.totalMembers} hint="members" />
        <SummaryMetric icon={CalendarDays} label="Today's Schedule" value={data.stats.todaysEvents} hint="events today" />
        <SummaryMetric icon={ClipboardCheck} label="Assignments Due" value={data.queue.length} hint="visible signals" urgent={data.queue.length > 0} />
      </section>

      <OfficeTabs activeWorkspace={activeWorkspace} onChange={setActiveWorkspace} />
      <OfficeSecondaryTabs activeWorkspace={activeWorkspace} activeView={activeView} onChange={setActiveView} />

      <section id={`office-panel-${activeWorkspace}`} role="tabpanel" aria-labelledby={`office-tab-${activeWorkspace}`} className="min-w-0">
        {activeWorkspace === "documentation" ? (
          <DocumentationPanel search={search} status={status} onSearchChange={setSearch} onStatusChange={setStatus} />
        ) : (
          <ChurchContentGrid className="gap-4 lg:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[minmax(0,1fr)_340px]">
            <ChurchMainPanel className="min-w-0 overflow-hidden">
              <div className="flex flex-col gap-3 border-b border-border px-5 py-4 md:flex-row md:items-center md:justify-between">
                <div className="min-w-0">
                  <h2 className="text-base font-semibold text-foreground">
                    {secondaryViews[activeWorkspace].find((view) => view.key === activeView)?.label}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Dense Office registry backed by verified source modules already connected to this workspace.
                  </p>
                </div>
                <ChurchButton type="button" variant="outline" className="shrink-0 gap-2 bg-background" asChild>
                  <Link href={activeWorkspace === "reporting" ? `/c/${churchSlug}/reports` : `/c/${churchSlug}/office?workspace=${activeWorkspace}&view=${activeView}`}>
                    <LayoutList className="size-4" aria-hidden="true" />
                    Continue Working
                  </Link>
                </ChurchButton>
              </div>
              <SearchAndFilters search={search} status={status} onSearchChange={setSearch} onStatusChange={setStatus} />
              <div className="min-w-0 overflow-x-auto">
                <RegistryTable rows={filteredRows} selectedId={selectedRowId} onSelect={setSelectedRowId} />
              </div>
              <div className="flex min-h-[60px] items-center justify-between gap-3 border-t border-border px-5 py-3 text-sm text-muted-foreground">
                <span>
                  Showing {filteredRows.length === 0 ? 0 : 1} to {filteredRows.length} of {filteredRows.length} records
                </span>
                <span className="rounded-lg border border-border bg-muted/30 px-2.5 py-1 text-xs">Source-owned workflow</span>
              </div>
            </ChurchMainPanel>

            <DetailRail selectedRow={selectedRow} activeWorkspace={activeWorkspace} activeView={activeView} data={data} />
          </ChurchContentGrid>
        )}
      </section>
    </div>
  );
}
