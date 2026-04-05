import type { InviteDepartmentOption, InviteRoleOption } from "./types";

export const SAFE_ONBOARDING_ROLE_CODES = [
  "pastor",
  "church_admin",
  "tech_team",
  "clerk",
  "church_secretary",
] as const;

export const SAFE_ONBOARDING_ROLE_FALLBACKS: InviteRoleOption[] = [
  { id: null, code: "regular_member", name: "Regular Member" },
  { id: null, code: "pastor", name: "Pastor" },
  { id: null, code: "elder", name: "Elder" },
  { id: null, code: "clerk", name: "Clerk" },
  { id: null, code: "church_secretary", name: "Church Secretary" },
  { id: null, code: "treasurer", name: "Treasurer" },
  { id: null, code: "church_admin", name: "Church Admin" },
  { id: null, code: "tech_team", name: "Tech Team" },
  { id: null, code: "other", name: "Other" },
];

export function normalizeRoleOptions(roleOptions: InviteRoleOption[]) {
  const byCode = new Map<string, InviteRoleOption>();

  for (const role of [...SAFE_ONBOARDING_ROLE_FALLBACKS, ...roleOptions]) {
    if (!byCode.has(role.code)) {
      byCode.set(role.code, role);
    }
  }

  if (!byCode.has("regular_member")) {
    byCode.set("regular_member", { id: null, code: "regular_member", name: "Regular Member" });
  }

  if (!byCode.has("other")) {
    byCode.set("other", { id: null, code: "other", name: "Other" });
  }

  return Array.from(byCode.values());
}

export function sanitizeRequestedRoleName(
  selectedRoleCode: string,
  selectedRoleName: string | null | undefined,
  otherRoleName: string | null | undefined
) {
  const code = selectedRoleCode.trim().toLowerCase();

  if (!code || code === "regular_member") return null;

  if (code === "other") {
    const other = (otherRoleName ?? "").trim();
    return other || null;
  }

  const fallback = (selectedRoleName ?? "").trim();
  return fallback || code.replace(/_/g, " ");
}

export function buildDepartmentLeadershipSelections(
  departments: InviteDepartmentOption[],
  formData: FormData
) {
  const selectedIds = formData
    .getAll("departmentIds")
    .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
    .map((value) => value.trim());

  const selectedSet = new Set(selectedIds);
  const knownDepartmentIds = new Set(departments.map((d) => d.id));

  const validDepartmentIds = selectedIds.filter((id) => knownDepartmentIds.has(id));

  return validDepartmentIds.map((departmentId) => {
    const isLeader =
      formData.get(`departmentLeader:${departmentId}`) === "on";
    const titleRaw = formData.get(`departmentLeaderTitle:${departmentId}`);
    const title =
      typeof titleRaw === "string" ? titleRaw.trim() : "";

    return {
      departmentId,
      selected: selectedSet.has(departmentId),
      isLeader,
      title,
    };
  });
}
