import "server-only";

import { requireChurchAccess } from "@/features/access/queries";
import { resolveWorkspaceAccess } from "@/features/workspace-access/server";
import { createClient } from "@/lib/supabase/server";
import {
  hasDepartmentCapability,
  type DepartmentCapability,
} from "./access-policy";

export type { DepartmentCapability } from "./access-policy";

export class DepartmentAccessDeniedError extends Error {
  readonly status = 403;

  constructor(message = "You do not have access to this department workspace.") {
    super(message);
    this.name = "DepartmentAccessDeniedError";
  }
}

export async function getDepartmentAccess(
  churchSlug: string,
  departmentId: string
) {
  const ctx = await requireChurchAccess(churchSlug);
  const supabase = await createClient();

  const { data: department, error } = await supabase
    .from("church_departments")
    .select("id, church_id, department_name, code, is_active")
    .eq("church_id", ctx.churchId)
    .eq("id", departmentId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!department) {
    throw new DepartmentAccessDeniedError("Department not found in this church.");
  }

  const workspaceAccess = await resolveWorkspaceAccess(
    churchSlug,
    "department",
    departmentId
  );
  const isDepartmentLeader = Boolean(
    workspaceAccess.positionCode && workspaceAccess.positionCode !== "department_worker"
  );

  function can(capability: DepartmentCapability) {
    return hasDepartmentCapability(workspaceAccess.capabilities, capability);
  }

  return {
    ctx,
    supabase,
    department,
    workspaceAccess,
    isDepartmentLeader,
    isDepartmentScoped: isDepartmentLeader && !ctx.isPlatformAdmin && !ctx.hasOperationalAccess,
    can,
  };
}

export async function requireDepartmentAccess(
  churchSlug: string,
  departmentId: string,
  capability: DepartmentCapability
) {
  const access = await getDepartmentAccess(churchSlug, departmentId);
  if (!access.can(capability)) throw new DepartmentAccessDeniedError();
  return access;
}
