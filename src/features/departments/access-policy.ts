export type DepartmentCapability =
  | "view"
  | "manage_action_plan"
  | "manage_activities"
  | "manage_announcements"
  | "manage_members"
  | "submit_fund_request"
  | "view_budget"
  | "manage_documents";

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

export function hasDepartmentCapability(params: {
  capability: DepartmentCapability;
  roles: readonly string[];
  isPlatformAdmin: boolean;
  isDepartmentLeader: boolean;
}) {
  const { capability, roles, isPlatformAdmin, isDepartmentLeader } = params;
  if (isPlatformAdmin) return true;
  if (roles.some((role) => CHURCH_ROLE_CAPABILITIES[capability].includes(role))) return true;
  return isDepartmentLeader && LEADER_CAPABILITIES.has(capability);
}
