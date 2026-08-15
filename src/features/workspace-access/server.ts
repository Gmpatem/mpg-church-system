import "server-only";

import { cache } from "react";
import { requireChurchAccess } from "@/features/access/queries";
import { createClient } from "@/lib/supabase/server";
import {
  getChurchCapabilities,
  getDepartmentCapabilitiesForChurchRoles,
  getDepartmentPositionCapabilities,
  getDepartmentPositionName,
  getPersonalCapabilities,
  isWorkspaceCapability,
  normalizePositionCode,
  uniqueCapabilities,
} from "./policy";
import type {
  ChurchWorkspaceAccess,
  DepartmentWorkspaceAccess,
  WorkspaceAccess,
  WorkspaceAccessCatalog,
  WorkspaceCapability,
  WorkspaceScopeType,
} from "./types";

type LeadershipRow = {
  department_id: string;
  leadership_role_code: string | null;
  leadership_role_name: string;
  is_primary: boolean;
  start_date: string | null;
  end_date: string | null;
};

type MembershipRow = {
  department_id: string | null;
  department_name: string;
  role_title: string | null;
  start_date: string | null;
};

type PermissionRow = {
  department_id?: string | null;
  permission_definitions:
    | { code: string }
    | Array<{ code: string }>
    | null;
};

type AuthorizationState = {
  ctx: Awaited<ReturnType<typeof requireChurchAccess>>;
  supabase: Awaited<ReturnType<typeof createClient>>;
  memberId: string | null;
  churchRoleCodes: string[];
  memberships: MembershipRow[];
  leadership: LeadershipRow[];
  permissions: PermissionRow[];
};

const POSITION_PRIORITY: Record<string, number> = {
  department_leader: 100,
  department_head: 100,
  assistant_leader: 80,
  assistant_head: 80,
  secretary: 70,
  treasurer: 60,
  department_treasurer: 60,
  coordinator: 50,
};

function joined<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function isDateActive(startDate: string | null, endDate: string | null) {
  const current = today();
  return (!startDate || startDate <= current) && (!endDate || endDate >= current);
}

function pickPosition(rows: LeadershipRow[]) {
  return [...rows].sort((left, right) => {
    if (left.is_primary !== right.is_primary) return left.is_primary ? -1 : 1;
    const leftRank = POSITION_PRIORITY[normalizePositionCode(left.leadership_role_code)] ?? 0;
    const rightRank = POSITION_PRIORITY[normalizePositionCode(right.leadership_role_code)] ?? 0;
    return rightRank - leftRank;
  })[0] ?? null;
}

function permissionCode(row: PermissionRow) {
  return joined(row.permission_definitions)?.code ?? null;
}

async function readDirectPermissions(
  supabase: Awaited<ReturnType<typeof createClient>>,
  churchId: string,
  userId: string
): Promise<PermissionRow[]> {
  const scopedResult = await (supabase as any)
    .from("church_permission_assignments")
    .select("department_id, permission_definitions(code)")
    .eq("church_id", churchId)
    .eq("user_id", userId)
    .eq("is_active", true);

  if (!scopedResult.error) return scopedResult.data ?? [];
  if (scopedResult.error.code !== "42703" && !String(scopedResult.error.message).includes("department_id")) {
    throw new Error(scopedResult.error.message);
  }

  const legacyResult = await (supabase as any)
    .from("church_permission_assignments")
    .select("permission_definitions(code)")
    .eq("church_id", churchId)
    .eq("user_id", userId)
    .eq("is_active", true);
  if (legacyResult.error) throw new Error(legacyResult.error.message);
  return (legacyResult.data ?? []).map((row: PermissionRow) => ({ ...row, department_id: null }));
}

const getAuthorizationState = cache(async (churchSlug: string): Promise<AuthorizationState> => {
  const ctx = await requireChurchAccess(churchSlug);
  const supabase = await createClient();
  const currentDate = today();

  const [memberResult, roleResult, permissionResult] = await Promise.all([
    supabase
      .from("members")
      .select("id")
      .eq("church_id", ctx.churchId)
      .eq("profile_id", ctx.userId)
      .maybeSingle(),
    supabase
      .from("church_role_assignments")
      .select("start_date, end_date, role_definitions(code)")
      .eq("church_id", ctx.churchId)
      .eq("user_id", ctx.userId)
      .eq("is_active", true)
      .or(`start_date.is.null,start_date.lte.${currentDate}`)
      .or(`end_date.is.null,end_date.gte.${currentDate}`),
    readDirectPermissions(supabase, ctx.churchId, ctx.userId),
  ]);

  if (memberResult.error) throw new Error(memberResult.error.message);
  if (roleResult.error) throw new Error(roleResult.error.message);

  const memberId = memberResult.data?.id ?? null;
  const churchRoleCodes = ((roleResult.data ?? []) as any[])
    .map((row) => joined<{ code: string }>(row.role_definitions)?.code)
    .filter((code): code is string => Boolean(code));

  let memberships: MembershipRow[] = [];
  let leadership: LeadershipRow[] = [];
  if (memberId) {
    const [membershipResult, leadershipResult] = await Promise.all([
      supabase
        .from("member_departments")
        .select("department_id, department_name, role_title, start_date")
        .eq("church_id", ctx.churchId)
        .eq("member_id", memberId)
        .eq("is_active", true),
      supabase
        .from("department_leadership_assignments")
        .select("department_id, leadership_role_code, leadership_role_name, is_primary, start_date, end_date")
        .eq("church_id", ctx.churchId)
        .eq("member_id", memberId)
        .eq("is_active", true)
        .or(`start_date.is.null,start_date.lte.${currentDate}`)
        .or(`end_date.is.null,end_date.gte.${currentDate}`),
    ]);
    if (membershipResult.error) throw new Error(membershipResult.error.message);
    if (leadershipResult.error) throw new Error(leadershipResult.error.message);
    memberships = (membershipResult.data ?? []) as MembershipRow[];
    leadership = ((leadershipResult.data ?? []) as LeadershipRow[]).filter((row) =>
      isDateActive(row.start_date, row.end_date)
    );
  }

  return {
    ctx,
    supabase,
    memberId,
    churchRoleCodes,
    memberships,
    leadership,
    permissions: permissionResult,
  };
});

function directCapabilities(state: AuthorizationState, departmentId: string | null) {
  return state.permissions
    .filter((row) => (row.department_id ?? null) === departmentId)
    .map(permissionCode)
    .filter((code): code is WorkspaceCapability => Boolean(code && isWorkspaceCapability(code)));
}

function buildDepartmentAccess(params: {
  state: AuthorizationState;
  departmentId: string;
  departmentName: string;
  membership: MembershipRow | null;
  leadershipRows: LeadershipRow[];
}): DepartmentWorkspaceAccess {
  const { state, departmentId, departmentName, membership, leadershipRows } = params;
  const position = pickPosition(leadershipRows);
  const positionCode = position?.leadership_role_code ?? (membership ? "department_worker" : null);
  const positionCapabilities = positionCode ? getDepartmentPositionCapabilities(positionCode) : [];
  const churchRoleCapabilities = getDepartmentCapabilitiesForChurchRoles(state.churchRoleCodes);
  const roleCapabilities = state.ctx.isPlatformAdmin
    ? getDepartmentCapabilitiesForChurchRoles(["church_admin"])
    : churchRoleCapabilities;
  const direct = directCapabilities(state, departmentId).filter((capability) =>
    capability.startsWith("department.")
  );
  const capabilities = uniqueCapabilities([
    ...getPersonalCapabilities(),
    ...positionCapabilities,
    ...roleCapabilities,
    ...direct,
  ]);
  const capabilitySources: DepartmentWorkspaceAccess["capabilitySources"] = {};
  for (const capability of positionCapabilities) capabilitySources[capability] = "position";
  for (const capability of roleCapabilities) capabilitySources[capability] = "church_role";
  for (const capability of direct) capabilitySources[capability] = "direct";

  return {
    churchId: state.ctx.churchId,
    userId: state.ctx.userId,
    memberId: state.memberId,
    scopeType: "department",
    scopeId: departmentId,
    positionCode,
    capabilities,
    departmentName,
    positionName: state.ctx.isPlatformAdmin
      ? "Platform Administrator"
      : roleCapabilities.length > 0 && !position
        ? "Church Administrator"
        : getDepartmentPositionName(positionCode, position?.leadership_role_name ?? membership?.role_title),
    startDate: position?.start_date ?? membership?.start_date ?? null,
    endDate: position?.end_date ?? null,
    capabilitySources,
  };
}

export const resolveWorkspaceAccessCatalog = cache(
  async (churchSlug: string): Promise<WorkspaceAccessCatalog> => {
    const state = await getAuthorizationState(churchSlug);
    const departmentIds = [
      ...new Set(
        [...state.memberships.map((row) => row.department_id), ...state.leadership.map((row) => row.department_id)]
          .filter((id): id is string => Boolean(id))
      ),
    ];
    let departmentRows: Array<{ id: string; department_name: string }> = [];
    if (departmentIds.length > 0) {
      const result = await state.supabase
        .from("church_departments")
        .select("id, department_name")
        .eq("church_id", state.ctx.churchId)
        .eq("is_active", true)
        .in("id", departmentIds);
      if (result.error) throw new Error(result.error.message);
      departmentRows = result.data ?? [];
    }

    const departments = departmentRows.map((department) =>
      buildDepartmentAccess({
        state,
        departmentId: department.id,
        departmentName: department.department_name,
        membership:
          state.memberships.find((row) => row.department_id === department.id) ?? null,
        leadershipRows: state.leadership.filter((row) => row.department_id === department.id),
      })
    );

    const churchCapabilities = uniqueCapabilities([
      ...getChurchCapabilities(state.churchRoleCodes, state.ctx.isPlatformAdmin),
      ...directCapabilities(state, null).filter((capability) => capability.startsWith("church.")),
    ]);
    const churchWorkspaces: ChurchWorkspaceAccess[] = [];
    if (churchCapabilities.includes("church.treasury.view")) {
      churchWorkspaces.push({
        churchId: state.ctx.churchId,
        userId: state.ctx.userId,
        memberId: state.memberId,
        scopeType: "church",
        scopeId: state.ctx.churchId,
        positionCode: state.churchRoleCodes.includes("treasurer") ? "treasurer" : "church_admin",
        capabilities: churchCapabilities,
        workspaceKind: "treasury",
        positionName: state.churchRoleCodes.includes("treasurer") ? "Church Treasurer" : "Church Administrator",
      });
    }
    if (churchCapabilities.includes("church.office.view")) {
      churchWorkspaces.push({
        churchId: state.ctx.churchId,
        userId: state.ctx.userId,
        memberId: state.memberId,
        scopeType: "church",
        scopeId: state.ctx.churchId,
        positionCode: state.churchRoleCodes.includes("clerk") ? "clerk" : "church_secretary",
        capabilities: churchCapabilities,
        workspaceKind: "office",
        positionName: state.churchRoleCodes.includes("clerk") ? "Church Clerk" : "Church Secretary",
      });
    }
    if (churchCapabilities.includes("church.administration.open")) {
      churchWorkspaces.push({
        churchId: state.ctx.churchId,
        userId: state.ctx.userId,
        memberId: state.memberId,
        scopeType: "church",
        scopeId: state.ctx.churchId,
        positionCode: "church_admin",
        capabilities: churchCapabilities,
        workspaceKind: "administration",
        positionName: "Church Administrator",
      });
    }

    return {
      church: { id: state.ctx.churchId, slug: state.ctx.churchSlug, name: state.ctx.churchName },
      personal: {
        churchId: state.ctx.churchId,
        userId: state.ctx.userId,
        memberId: state.memberId,
        scopeType: "personal",
        scopeId: state.memberId,
        positionCode: "member",
        capabilities: getPersonalCapabilities(),
      },
      departments,
      churchWorkspaces,
    };
  }
);

export async function resolveWorkspaceAccess(
  churchSlug: string,
  scopeType: WorkspaceScopeType,
  scopeId: string | null
): Promise<WorkspaceAccess> {
  const state = await getAuthorizationState(churchSlug);
  if (scopeType === "personal") {
    return {
      churchId: state.ctx.churchId,
      userId: state.ctx.userId,
      memberId: state.memberId,
      scopeType,
      scopeId: state.memberId,
      positionCode: "member",
      capabilities: getPersonalCapabilities(),
    };
  }

  if (scopeType === "church") {
    const capabilities = uniqueCapabilities([
      ...getChurchCapabilities(state.churchRoleCodes, state.ctx.isPlatformAdmin),
      ...directCapabilities(state, null).filter((capability) => capability.startsWith("church.")),
    ]);
    return {
      churchId: state.ctx.churchId,
      userId: state.ctx.userId,
      memberId: state.memberId,
      scopeType,
      scopeId: state.ctx.churchId,
      positionCode: state.churchRoleCodes[0] ?? null,
      capabilities,
    };
  }

  if (!scopeId) throw new WorkspaceAccessDeniedError("Department scope is required.");
  const departmentResult = await state.supabase
    .from("church_departments")
    .select("id, department_name")
    .eq("church_id", state.ctx.churchId)
    .eq("id", scopeId)
    .eq("is_active", true)
    .maybeSingle();
  if (departmentResult.error) throw new Error(departmentResult.error.message);
  if (!departmentResult.data) throw new WorkspaceAccessDeniedError("Department not found in this church.");

  return buildDepartmentAccess({
    state,
    departmentId: scopeId,
    departmentName: departmentResult.data.department_name,
    membership: state.memberships.find((row) => row.department_id === scopeId) ?? null,
    leadershipRows: state.leadership.filter((row) => row.department_id === scopeId),
  });
}

export class WorkspaceAccessDeniedError extends Error {
  readonly status = 403;

  constructor(message = "You do not have permission to perform this work.") {
    super(message);
    this.name = "WorkspaceAccessDeniedError";
  }
}

export async function requireWorkspaceCapability(
  churchSlug: string,
  scopeType: WorkspaceScopeType,
  scopeId: string | null,
  capability: WorkspaceCapability
) {
  const access = await resolveWorkspaceAccess(churchSlug, scopeType, scopeId);
  if (!access.capabilities.includes(capability)) throw new WorkspaceAccessDeniedError();
  if (scopeType !== "personal" && !scopeId) throw new WorkspaceAccessDeniedError("Scope is required.");
  return access;
}
