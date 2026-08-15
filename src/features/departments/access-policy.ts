import type { WorkspaceCapability } from "@/features/workspace-access/types";

export type DepartmentCapability =
  | "view"
  | "manage_action_plan"
  | "manage_activities"
  | "manage_announcements"
  | "manage_members"
  | "submit_fund_request"
  | "view_budget"
  | "manage_documents";

export const departmentCapabilityMap: Record<DepartmentCapability, WorkspaceCapability> = {
  view: "department.view",
  manage_action_plan: "department.manage_tasks",
  manage_activities: "department.manage_activities",
  manage_announcements: "department.manage_announcements",
  manage_members: "department.manage_people",
  submit_fund_request: "department.submit_fund_requests",
  view_budget: "department.view_budget",
  manage_documents: "department.manage_documents",
};

const CHURCH_ROLE_CAPABILITIES: Record<DepartmentCapability, readonly string[]> = {
  view: ["church_admin", "pastor", "elder", "clerk", "church_secretary", "treasurer"],
  manage_action_plan: ["church_admin", "pastor", "clerk", "church_secretary"],
  manage_activities: ["church_admin", "pastor", "elder", "clerk", "church_secretary"],
  manage_announcements: ["church_admin", "pastor", "elder", "clerk", "church_secretary"],
  manage_members: ["church_admin", "clerk"],
  submit_fund_request: ["church_admin", "pastor"],
  view_budget: ["church_admin", "pastor", "treasurer"],
  manage_documents: ["church_admin", "clerk"],
};

const LEADER_CAPABILITIES = new Set<DepartmentCapability>([
  "view",
  "manage_action_plan",
  "manage_activities",
  "manage_announcements",
  "manage_members",
  "submit_fund_request",
  "view_budget",
  "manage_documents",
]);

type DepartmentCapabilityCheck = {
  capability: DepartmentCapability;
  roles: readonly string[];
  isPlatformAdmin: boolean;
  isDepartmentLeader: boolean;
};

export function hasDepartmentCapability(
  capabilities: readonly WorkspaceCapability[],
  capability: DepartmentCapability
): boolean;
export function hasDepartmentCapability(params: DepartmentCapabilityCheck): boolean;
export function hasDepartmentCapability(
  capabilitiesOrParams: readonly WorkspaceCapability[] | DepartmentCapabilityCheck,
  capability?: DepartmentCapability
): boolean {
  if (!("capability" in capabilitiesOrParams)) {
    return capability ? capabilitiesOrParams.includes(departmentCapabilityMap[capability]) : false;
  }
  const {
    capability: requestedCapability,
    roles,
    isPlatformAdmin,
    isDepartmentLeader,
  } = capabilitiesOrParams;

  if (isPlatformAdmin) return true;
  if (roles.some((role) => CHURCH_ROLE_CAPABILITIES[requestedCapability].includes(role))) {
    return true;
  }
  return isDepartmentLeader && LEADER_CAPABILITIES.has(requestedCapability);
}
