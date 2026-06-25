import {
  BarChart3,
  Bell,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  ClipboardCheck,
  Home,
  LayoutDashboard,
  Megaphone,
  Settings,
  Shield,
  UserCheck,
  UserCog,
  Users,
  UsersRound,
  Wallet,
} from "lucide-react";
import { OFFICE_ALLOWED_ROLES } from "@/lib/constants/access";
import type {
  ChurchActiveNavigation,
  ChurchNavigationGroup,
  ChurchNavigationGroupKey,
  ChurchNavigationItem,
} from "../types";

type ChurchNavigationBuilderInput = {
  churchSlug: string;
  roleLabel?: string;
  showAccessControl: boolean;
  pendingApprovalCount: number;
  t: any;
};

function normalizePath(pathname: string) {
  const [path] = pathname.split(/[?#]/);
  if (!path || path === "/") return "/";
  return path.endsWith("/") ? path.slice(0, -1) : path;
}

function exactOrPrefix(pathname: string, href: string, exact?: boolean) {
  const path = normalizePath(pathname);
  const target = normalizePath(href);

  if (exact) return path === target || path === `${target}/dashboard`;
  return path === target || path.startsWith(`${target}/`);
}

function routeMatcher(base: string, segments: string[], options?: { exact?: boolean }) {
  const hrefs = segments.map((segment) => `${base}${segment ? `/${segment}` : ""}`);

  return (pathname: string) => hrefs.some((href) => exactOrPrefix(pathname, href, options?.exact));
}

export function getDashboardNavigationItem(churchSlug: string, t: any): ChurchNavigationItem {
  const base = `/c/${churchSlug}`;

  return {
    key: "dashboard",
    label: t.navigation.dashboard,
    href: base,
    icon: LayoutDashboard,
    exact: true,
    match: (pathname) => {
      const path = normalizePath(pathname);
      return path === base || path === `${base}/dashboard`;
    },
  };
}

export function buildChurchNavigationGroups({
  churchSlug,
  roleLabel,
  showAccessControl,
  pendingApprovalCount,
  t,
}: ChurchNavigationBuilderInput): ChurchNavigationGroup[] {
  const base = `/c/${churchSlug}`;
  const canOpenOffice = roleLabel ? OFFICE_ALLOWED_ROLES.has(roleLabel) : false;

  const groups: ChurchNavigationGroup[] = [
    {
      key: "people",
      label: t.navigation.people || "People",
      icon: Users,
      items: [
        {
          key: "members",
          label: t.navigation.members,
          href: `${base}/members`,
          icon: Users,
          match: routeMatcher(base, ["members"]),
        },
        {
          key: "households",
          label: t.navigation.households,
          href: `${base}/households`,
          icon: Home,
          match: routeMatcher(base, ["households"]),
        },
        {
          key: "attendance",
          label: t.navigation.attendance || "Attendance",
          href: `${base}/attendance`,
          icon: UserCheck,
          match: routeMatcher(base, ["attendance"]),
        },
      ],
    },
    {
      key: "ministries",
      label: t.navigation.ministries || "Ministries",
      icon: Building2,
      items: [
        {
          key: "departments",
          label: t.navigation.departments,
          href: `${base}/departments`,
          icon: Building2,
          match: routeMatcher(base, ["departments"]),
        },
        {
          key: "small-groups",
          label: t.navigation.smallGroups || "Small Groups",
          href: `${base}/small-groups`,
          icon: UsersRound,
          match: routeMatcher(base, ["small-groups"]),
        },
        {
          key: "leadership",
          label: t.navigation.leadership || "Leadership",
          href: `${base}/leadership`,
          icon: UserCog,
          match: routeMatcher(base, ["leadership"]),
        },
      ],
    },
    {
      key: "treasury",
      label: t.navigation.treasury,
      icon: Wallet,
      items: [
        {
          key: "treasury",
          label: t.navigation.treasury,
          href: `${base}/treasury`,
          icon: Wallet,
          match: routeMatcher(base, ["treasury"]),
        },
      ],
    },
    {
      key: "operations",
      label: t.navigation.operations || "Operations",
      icon: BriefcaseBusiness,
      items: [
        {
          key: "events",
          label: t.navigation.events,
          href: `${base}/events`,
          icon: CalendarDays,
          match: routeMatcher(base, ["events"]),
        },
        {
          key: "calendar",
          label: t.navigation.calendar || "Calendar",
          href: `${base}/calendar`,
          icon: CalendarDays,
          match: routeMatcher(base, ["calendar"]),
        },
        {
          key: "announcements",
          label: t.navigation.announcements || "Announcements",
          href: `${base}/announcements`,
          icon: Megaphone,
          match: routeMatcher(base, ["announcements"]),
        },
        {
          key: "office",
          label: t.navigation.office || "Church Office",
          href: `${base}/office`,
          icon: BriefcaseBusiness,
          allowedRoles: Array.from(OFFICE_ALLOWED_ROLES),
          hidden: !canOpenOffice,
          match: routeMatcher(base, ["office", "church-office"]),
        },
      ],
    },
    {
      key: "administration",
      label: t.navigation.administration || "Administration",
      icon: Shield,
      items: [
        {
          key: "access-control",
          label: t.navigation.accessControl || "Invites & Access",
          href: `${base}/access-control`,
          icon: Shield,
          permission: "access-control",
          hidden: !showAccessControl,
          match: routeMatcher(base, ["access-control"]),
        },
        {
          key: "approvals",
          label: t.navigation.approvals || "Approvals",
          href: `${base}/approvals`,
          icon: ClipboardCheck,
          badge: pendingApprovalCount,
          permission: "approvals",
          hidden: !showAccessControl,
          match: routeMatcher(base, ["approvals"]),
        },
        {
          key: "settings",
          label: t.navigation.settings,
          href: `${base}/settings`,
          icon: Settings,
          match: routeMatcher(base, ["settings"]),
        },
        {
          key: "reports",
          label: t.navigation.reports,
          href: `${base}/reports`,
          icon: BarChart3,
          match: routeMatcher(base, ["reports"]),
        },
      ],
    },
  ];

  return groups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => !item.hidden),
    }))
    .filter((group) => group.items.length > 0);
}

export function isChurchNavigationItemActive(pathname: string, item: ChurchNavigationItem) {
  return item.match ? item.match(pathname) : exactOrPrefix(pathname, item.href, item.exact);
}

export function getActiveChurchNavigation(
  pathname: string,
  groups: ChurchNavigationGroup[]
): ChurchActiveNavigation {
  let activeGroupKey: ChurchNavigationGroupKey | null = null;
  let activeItemKey: string | null = null;
  let bestHrefLength = -1;

  for (const group of groups) {
    for (const item of group.items) {
      if (!isChurchNavigationItemActive(pathname, item)) continue;

      const hrefLength = normalizePath(item.href).length;
      if (hrefLength > bestHrefLength) {
        activeGroupKey = group.key;
        activeItemKey = item.key;
        bestHrefLength = hrefLength;
      }
    }
  }

  return { activeGroupKey, activeItemKey };
}

export function getChurchSectionLabel(pathname: string, churchSlug: string, t: any) {
  const dashboard = getDashboardNavigationItem(churchSlug, t);
  if (isChurchNavigationItemActive(pathname, dashboard)) return dashboard.label;

  const groups = buildChurchNavigationGroups({
    churchSlug,
    roleLabel: "Platform Owner",
    showAccessControl: true,
    pendingApprovalCount: 0,
    t,
  });
  const active = getActiveChurchNavigation(pathname, groups);
  const activeItem = groups
    .flatMap((group) => group.items)
    .find((item) => item.key === active.activeItemKey);

  return activeItem?.label ?? t.navigation.workspace ?? "Church Workspace";
}

export const notificationIcon = Bell;
