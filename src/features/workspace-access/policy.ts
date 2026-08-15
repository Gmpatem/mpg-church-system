import {
  workspaceCapabilities,
  type WorkspaceCapability,
} from "./types";

const PERSONAL_CAPABILITIES: WorkspaceCapability[] = [
  "personal.view_duties",
  "personal.confirm_duty",
  "personal.request_replacement",
  "personal.view_tasks",
];

const DEPARTMENT_WORKER_CAPABILITIES: WorkspaceCapability[] = [
  ...PERSONAL_CAPABILITIES,
  "department.view",
  "department.view_schedule",
  "department.update_own_duty",
];

const DEPARTMENT_POSITION_CAPABILITIES: Record<string, readonly WorkspaceCapability[]> = {
  department_worker: DEPARTMENT_WORKER_CAPABILITIES,
  worker: DEPARTMENT_WORKER_CAPABILITIES,
  deacon: DEPARTMENT_WORKER_CAPABILITIES,
  teacher: DEPARTMENT_WORKER_CAPABILITIES,
  coordinator: [
    ...DEPARTMENT_WORKER_CAPABILITIES,
    "department.manage_duties",
    "department.manage_tasks",
    "department.manage_activities",
    "department.submit_reports",
  ],
  secretary: [
    ...DEPARTMENT_WORKER_CAPABILITIES,
    "department.manage_duties",
    "department.manage_tasks",
    "department.manage_activities",
    "department.manage_announcements",
    "department.submit_reports",
    "department.manage_documents",
  ],
  assistant_leader: [
    ...DEPARTMENT_WORKER_CAPABILITIES,
    "department.manage_duties",
    "department.manage_tasks",
    "department.manage_activities",
    "department.submit_reports",
  ],
  assistant_head: [
    ...DEPARTMENT_WORKER_CAPABILITIES,
    "department.manage_duties",
    "department.manage_tasks",
    "department.manage_activities",
    "department.submit_reports",
  ],
  department_leader: [
    ...DEPARTMENT_WORKER_CAPABILITIES,
    "department.manage_duties",
    "department.manage_tasks",
    "department.manage_people",
    "department.manage_activities",
    "department.manage_announcements",
    "department.submit_reports",
    "department.submit_fund_requests",
    "department.view_budget",
    "department.manage_documents",
  ],
  department_head: [
    ...DEPARTMENT_WORKER_CAPABILITIES,
    "department.manage_duties",
    "department.manage_tasks",
    "department.manage_people",
    "department.manage_activities",
    "department.manage_announcements",
    "department.submit_reports",
    "department.submit_fund_requests",
    "department.view_budget",
    "department.manage_documents",
  ],
  treasurer: [
    ...DEPARTMENT_WORKER_CAPABILITIES,
    "department.view_budget",
    "department.submit_fund_requests",
    "department.submit_reports",
  ],
  department_treasurer: [
    ...DEPARTMENT_WORKER_CAPABILITIES,
    "department.view_budget",
    "department.submit_fund_requests",
    "department.submit_reports",
  ],
};

const DEPARTMENT_ADMIN_CAPABILITIES = workspaceCapabilities.filter((capability) =>
  capability.startsWith("department.") || capability.startsWith("personal.")
);

const CHURCH_ROLE_DEPARTMENT_CAPABILITIES: Record<string, readonly WorkspaceCapability[]> = {
  church_admin: DEPARTMENT_ADMIN_CAPABILITIES,
  pastor: DEPARTMENT_ADMIN_CAPABILITIES,
  clerk: DEPARTMENT_ADMIN_CAPABILITIES,
  church_secretary: DEPARTMENT_ADMIN_CAPABILITIES,
  elder: [
    ...DEPARTMENT_WORKER_CAPABILITIES,
    "department.manage_duties",
    "department.manage_tasks",
    "department.manage_activities",
    "department.manage_announcements",
    "department.submit_reports",
  ],
  treasurer: [...DEPARTMENT_WORKER_CAPABILITIES, "department.view_budget"],
};

const CHURCH_ROLE_CAPABILITIES: Record<string, readonly WorkspaceCapability[]> = {
  treasurer: ["church.treasury.view", "church.treasury.manage"],
  church_treasurer: ["church.treasury.view", "church.treasury.manage"],
  finance_manager: ["church.treasury.view", "church.treasury.manage"],
  clerk: ["church.office.view", "church.office.manage_members", "church.office.view_reports"],
  church_secretary: ["church.office.view", "church.office.manage_members", "church.office.view_reports"],
  church_admin: [
    "church.treasury.view",
    "church.treasury.manage",
    "church.office.view",
    "church.office.manage_members",
    "church.office.view_reports",
    "church.administration.open",
  ],
};

const POSITION_NAMES: Record<string, string> = {
  department_worker: "Department Worker",
  worker: "Department Worker",
  deacon: "Deacon",
  teacher: "Teacher",
  coordinator: "Coordinator",
  secretary: "Secretary",
  assistant_leader: "Assistant Leader",
  assistant_head: "Assistant Head",
  department_leader: "Department Head",
  department_head: "Department Head",
  treasurer: "Department Treasurer",
  department_treasurer: "Department Treasurer",
};

export function normalizePositionCode(value: string | null | undefined) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export function uniqueCapabilities(values: readonly WorkspaceCapability[]) {
  return [...new Set(values)];
}

export function getPersonalCapabilities() {
  return [...PERSONAL_CAPABILITIES];
}

export function getDepartmentPositionCapabilities(positionCode: string | null) {
  const code = normalizePositionCode(positionCode) || "department_worker";
  return uniqueCapabilities(
    DEPARTMENT_POSITION_CAPABILITIES[code] ?? DEPARTMENT_WORKER_CAPABILITIES
  );
}

export function getDepartmentCapabilitiesForChurchRoles(roleCodes: readonly string[]) {
  return uniqueCapabilities(
    roleCodes.flatMap((roleCode) =>
      CHURCH_ROLE_DEPARTMENT_CAPABILITIES[normalizePositionCode(roleCode)] ?? []
    )
  );
}

export function getChurchCapabilities(roleCodes: readonly string[], isPlatformAdmin = false) {
  if (isPlatformAdmin) {
    return workspaceCapabilities.filter((capability) => capability.startsWith("church."));
  }
  return uniqueCapabilities(
    roleCodes.flatMap((roleCode) => CHURCH_ROLE_CAPABILITIES[normalizePositionCode(roleCode)] ?? [])
  );
}

export function getDepartmentPositionName(positionCode: string | null, fallback?: string | null) {
  const code = normalizePositionCode(positionCode) || "department_worker";
  return POSITION_NAMES[code] ?? fallback?.trim() ?? "Department Worker";
}

export function isWorkspaceCapability(value: string): value is WorkspaceCapability {
  return (workspaceCapabilities as readonly string[]).includes(value);
}

export const departmentGrantableCapabilities = workspaceCapabilities.filter(
  (capability) => capability.startsWith("department.")
);
