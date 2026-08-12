import {
  Baby,
  BookOpen,
  CalendarCheck,
  ClipboardCheck,
  DoorOpen,
  FileText,
  HeartHandshake,
  MonitorPlay,
  Music,
  ShieldCheck,
  Users,
  Video,
  WalletCards,
} from "lucide-react";

export type DepartmentWorkspaceTemplateKey =
  | "deacons"
  | "children"
  | "media"
  | "sabbath_school"
  | "generic";

export type DepartmentWorkspaceTemplate = {
  key: DepartmentWorkspaceTemplateKey;
  title: string;
  subtitle: string;
  greeting: string;
  description: string;
  tabs: Array<"overview" | "duties" | "tasks" | "reports">;
  stats: Array<{
    key: "members" | "upcomingDuties" | "openTasks" | "reportsDue";
    label: string;
    icon: typeof Users;
  }>;
  dutySectionTitle: string;
  quickActions: Array<{
    target: "duties" | "tasks" | "reports";
    label: string;
    icon: typeof CalendarCheck;
    managerOnly?: boolean;
  }>;
  dutyIcon: typeof ClipboardCheck;
  privacyNote?: string;
};

export const DEPARTMENT_WORKSPACE_TEMPLATES: Record<
  DepartmentWorkspaceTemplateKey,
  DepartmentWorkspaceTemplate
> = {
  deacons: {
    key: "deacons",
    title: "Deacons Operations",
    subtitle: "Duties & Schedule",
    greeting: "Happy Sabbath, Leader",
    description: "Manage this week's service support, welcome, offering, and care duties.",
    tabs: ["overview", "duties", "tasks", "reports"],
    stats: [
      { key: "members", label: "Members", icon: Users },
      { key: "upcomingDuties", label: "Upcoming Duties", icon: ClipboardCheck },
      { key: "openTasks", label: "Open Tasks", icon: CalendarCheck },
      { key: "reportsDue", label: "Reports Due", icon: FileText },
    ],
    dutySectionTitle: "This Sabbath",
    quickActions: [
      { target: "duties", label: "Add Duty", icon: CalendarCheck, managerOnly: true },
      { target: "duties", label: "Assign Member", icon: Users, managerOnly: true },
      { target: "tasks", label: "Create Task", icon: ClipboardCheck, managerOnly: true },
      { target: "reports", label: "Submit Report", icon: FileText, managerOnly: true },
    ],
    dutyIcon: DoorOpen,
  },
  children: {
    key: "children",
    title: "Children's Operations",
    subtitle: "Classes, Safety & Care",
    greeting: "This Week",
    description: "Coordinate children, classes, parent notes, safe check-in, and follow-ups.",
    tabs: ["overview", "duties", "tasks", "reports"],
    stats: [
      { key: "members", label: "Children", icon: Baby },
      { key: "upcomingDuties", label: "Classes", icon: BookOpen },
      { key: "openTasks", label: "Open Tasks", icon: ShieldCheck },
      { key: "reportsDue", label: "Follow-ups", icon: HeartHandshake },
    ],
    dutySectionTitle: "Upcoming Classes",
    quickActions: [
      { target: "duties", label: "Add Class", icon: CalendarCheck, managerOnly: true },
      { target: "duties", label: "Assign Teacher", icon: Users, managerOnly: true },
      { target: "tasks", label: "Parent Note", icon: HeartHandshake, managerOnly: true },
      { target: "reports", label: "Safety Report", icon: ShieldCheck, managerOnly: true },
    ],
    dutyIcon: Baby,
    privacyNote: "Children's information is limited to authorized church workers and must be handled with care.",
  },
  media: {
    key: "media",
    title: "Media Operations",
    subtitle: "Run Sheet & Livestream",
    greeting: "Service Ready",
    description: "Coordinate media requests, livestream, equipment readiness, and service run sheets.",
    tabs: ["overview", "duties", "tasks", "reports"],
    stats: [
      { key: "members", label: "Team", icon: Users },
      { key: "upcomingDuties", label: "Service Slots", icon: MonitorPlay },
      { key: "openTasks", label: "Open Requests", icon: Video },
      { key: "reportsDue", label: "Reports", icon: FileText },
    ],
    dutySectionTitle: "Service Run Sheet",
    quickActions: [
      { target: "duties", label: "Add Slot", icon: CalendarCheck, managerOnly: true },
      { target: "tasks", label: "Media Request", icon: MonitorPlay, managerOnly: true },
      { target: "tasks", label: "Equipment Check", icon: Video, managerOnly: true },
      { target: "reports", label: "Submit Report", icon: FileText, managerOnly: true },
    ],
    dutyIcon: MonitorPlay,
  },
  sabbath_school: {
    key: "sabbath_school",
    title: "Sabbath School Operations",
    subtitle: "Classes & Study Groups",
    greeting: "This Sabbath",
    description: "Coordinate lesson classes, teachers, group care, and Sabbath School reports.",
    tabs: ["overview", "duties", "tasks", "reports"],
    stats: [
      { key: "members", label: "Members", icon: Users },
      { key: "upcomingDuties", label: "Classes", icon: BookOpen },
      { key: "openTasks", label: "Open Tasks", icon: ClipboardCheck },
      { key: "reportsDue", label: "Reports", icon: FileText },
    ],
    dutySectionTitle: "Upcoming Classes",
    quickActions: [
      { target: "duties", label: "Add Class", icon: CalendarCheck, managerOnly: true },
      { target: "duties", label: "Assign Teacher", icon: Users, managerOnly: true },
      { target: "tasks", label: "Create Follow-up", icon: HeartHandshake, managerOnly: true },
      { target: "reports", label: "Submit Report", icon: FileText, managerOnly: true },
    ],
    dutyIcon: BookOpen,
  },
  generic: {
    key: "generic",
    title: "Department Operations",
    subtitle: "Duties & Schedule",
    greeting: "Department Workspace",
    description: "Manage department duties, tasks, members, and reports.",
    tabs: ["overview", "duties", "tasks", "reports"],
    stats: [
      { key: "members", label: "Members", icon: Users },
      { key: "upcomingDuties", label: "Duties", icon: ClipboardCheck },
      { key: "openTasks", label: "Tasks", icon: CalendarCheck },
      { key: "reportsDue", label: "Reports", icon: FileText },
    ],
    dutySectionTitle: "Upcoming Duties",
    quickActions: [
      { target: "duties", label: "Add Duty", icon: CalendarCheck, managerOnly: true },
      { target: "tasks", label: "Create Task", icon: ClipboardCheck, managerOnly: true },
      { target: "reports", label: "Submit Report", icon: FileText, managerOnly: true },
    ],
    dutyIcon: WalletCards,
  },
};

export function resolveDepartmentWorkspaceTemplate(args: {
  name: string;
  code?: string | null;
}): DepartmentWorkspaceTemplate {
  const code = String(args.code ?? "").trim().toUpperCase();
  const name = args.name.toLowerCase();

  if (code === "DEACONS" || name.includes("deacon")) return DEPARTMENT_WORKSPACE_TEMPLATES.deacons;
  if (code === "CHILDREN" || name.includes("children") || name.includes("child")) return DEPARTMENT_WORKSPACE_TEMPLATES.children;
  if (code === "MEDIA" || name.includes("media") || name.includes("audio") || name.includes("livestream")) return DEPARTMENT_WORKSPACE_TEMPLATES.media;
  if (code === "SABBATH_SCHOOL" || name.includes("sabbath school")) return DEPARTMENT_WORKSPACE_TEMPLATES.sabbath_school;
  if (name.includes("choir")) {
    return {
      ...DEPARTMENT_WORKSPACE_TEMPLATES.generic,
      title: "Choir Operations",
      subtitle: "Rehearsals & Service Music",
      greeting: "Ready to Serve",
      description: "Coordinate rehearsals, song service duties, and choir follow-up.",
      dutyIcon: Music,
    };
  }

  return DEPARTMENT_WORKSPACE_TEMPLATES.generic;
}
