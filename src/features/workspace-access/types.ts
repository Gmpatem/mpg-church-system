export type WorkspaceScopeType = "personal" | "department" | "church";

export const workspaceCapabilities = [
  "personal.view_duties",
  "personal.confirm_duty",
  "personal.request_replacement",
  "personal.view_tasks",
  "department.view",
  "department.view_schedule",
  "department.update_own_duty",
  "department.manage_duties",
  "department.manage_tasks",
  "department.manage_people",
  "department.manage_activities",
  "department.manage_announcements",
  "department.submit_reports",
  "department.submit_fund_requests",
  "department.view_budget",
  "department.manage_documents",
  "church.treasury.view",
  "church.treasury.manage",
  "church.office.view",
  "church.office.manage_members",
  "church.office.view_reports",
  "church.administration.open",
] as const;

export type WorkspaceCapability = (typeof workspaceCapabilities)[number];

export type WorkspaceAccess = {
  churchId: string;
  userId: string;
  memberId: string | null;
  scopeType: WorkspaceScopeType;
  scopeId: string | null;
  positionCode: string | null;
  capabilities: WorkspaceCapability[];
};

export type DepartmentWorkspaceAccess = WorkspaceAccess & {
  scopeType: "department";
  scopeId: string;
  departmentName: string;
  positionName: string;
  startDate: string | null;
  endDate: string | null;
  capabilitySources: Partial<Record<WorkspaceCapability, "position" | "direct" | "church_role">>;
};

export type ChurchWorkspaceAccess = WorkspaceAccess & {
  scopeType: "church";
  workspaceKind: "treasury" | "office" | "administration";
  positionName: string;
};

export type WorkspaceAccessCatalog = {
  church: {
    id: string;
    slug: string;
    name: string | null;
  };
  personal: WorkspaceAccess;
  departments: DepartmentWorkspaceAccess[];
  churchWorkspaces: ChurchWorkspaceAccess[];
};
