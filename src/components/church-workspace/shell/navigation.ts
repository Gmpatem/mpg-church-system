import {
  BarChart3,
  Bell,
  Building2,
  CalendarDays,
  ClipboardCheck,
  Home,
  LayoutDashboard,
  Settings,
  Shield,
  Users,
  Wallet,
  BriefcaseBusiness,
  Megaphone,
  UserCog,
  UsersRound,
} from "lucide-react";
import { OFFICE_ALLOWED_ROLES } from "@/lib/constants/access";
import type { ChurchNavigationGroup } from "../types";

export function buildChurchNavigationGroups({
  churchSlug,
  roleLabel,
  showAccessControl,
  pendingApprovalCount,
  t,
}: {
  churchSlug: string;
  roleLabel?: string;
  showAccessControl: boolean;
  pendingApprovalCount: number;
  t: any;
}): ChurchNavigationGroup[] {
  const base = `/c/${churchSlug}`;
  const canOpenOffice = roleLabel ? OFFICE_ALLOWED_ROLES.has(roleLabel) : false;

  const groups: ChurchNavigationGroup[] = [
    {
      key: "dashboard",
      label: t.navigation.overview || "Overview",
      items: [
        {
          key: "dashboard",
          label: t.navigation.dashboard,
          href: base,
          icon: LayoutDashboard,
          exact: true,
        },
      ],
    },
    {
      key: "people",
      label: "People",
      items: [
        { key: "members", label: t.navigation.members, href: `${base}/members`, icon: Users },
        { key: "households", label: t.navigation.households, href: `${base}/households`, icon: Home },
      ],
    },
    {
      key: "ministries",
      label: "Ministries",
      items: [
        { key: "departments", label: t.navigation.departments, href: `${base}/departments`, icon: Building2 },
        { key: "leadership", label: t.navigation.leadership || "Leadership", href: `${base}/leadership`, icon: UserCog },
        { key: "small-groups", label: "Small Groups", href: `${base}/small-groups`, icon: UsersRound },
        { key: "events", label: t.navigation.events, href: `${base}/events`, icon: CalendarDays },
        { key: "calendar", label: t.navigation.calendar, href: `${base}/calendar`, icon: CalendarDays },
      ],
    },
    {
      key: "treasury",
      label: t.navigation.treasury,
      items: [
        { key: "treasury", label: t.navigation.treasury, href: `${base}/treasury`, icon: Wallet },
      ],
    },
    {
      key: "operations",
      label: "Operations",
      items: [
        {
          key: "office",
          label: t.navigation.office || "Church Office",
          href: `${base}/office`,
          icon: BriefcaseBusiness,
          hidden: !canOpenOffice,
        },
        {
          key: "announcements",
          label: t.navigation.announcements || "Announcements",
          href: `${base}/announcements`,
          icon: Megaphone,
        },
        {
          key: "approvals",
          label: t.navigation.approvals || "Approvals",
          href: `${base}/approvals`,
          icon: ClipboardCheck,
          badge: pendingApprovalCount,
          hidden: !showAccessControl,
        },
        { key: "reports", label: t.navigation.reports, href: `${base}/reports`, icon: BarChart3 },
      ],
    },
    {
      key: "administration",
      label: "Administration",
      items: [
        {
          key: "access-control",
          label: t.navigation.accessControl || "Invites & Access",
          href: `${base}/access-control`,
          icon: Shield,
          hidden: !showAccessControl,
        },
        { key: "settings", label: t.navigation.settings, href: `${base}/settings`, icon: Settings },
      ],
    },
  ];

  return groups.map((group) => ({
    ...group,
    items: group.items.filter((item) => !item.hidden),
  })).filter((group) => group.items.length > 0);
}

export function getChurchSectionLabel(pathname: string, churchSlug: string, t: any) {
  const base = `/c/${churchSlug}`;

  if (pathname === base || pathname === `${base}/dashboard`) return t.navigation.dashboard;
  if (pathname.startsWith(`${base}/members`)) return t.navigation.members;
  if (pathname.startsWith(`${base}/households`)) return t.navigation.households;
  if (pathname.startsWith(`${base}/departments`)) return t.navigation.departments;
  if (pathname.startsWith(`${base}/leadership`)) return t.navigation.leadership || "Leadership";
  if (pathname.startsWith(`${base}/small-groups`)) return "Small Groups";
  if (pathname.startsWith(`${base}/treasury`)) return t.navigation.treasury;
  if (pathname.startsWith(`${base}/events`)) return t.navigation.events;
  if (pathname.startsWith(`${base}/calendar`)) return t.navigation.calendar;
  if (pathname.startsWith(`${base}/announcements`)) return t.navigation.announcements || "Announcements";
  if (pathname.startsWith(`${base}/reports`)) return t.navigation.reports;
  if (pathname.startsWith(`${base}/settings`)) return t.navigation.settings;
  if (pathname.startsWith(`${base}/office`)) return t.navigation.office || "Church Office";
  if (pathname.startsWith(`${base}/approvals`)) return t.navigation.approvals || "Approvals";
  if (pathname.startsWith(`${base}/access-control`)) return t.navigation.accessControl || "Invites & Access";

  return t.navigation.workspace || "Church Workspace";
}

export const notificationIcon = Bell;
