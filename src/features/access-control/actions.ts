"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireChurchWorkspaceAccess } from "@/features/access/queries";
import type { SimpleActionResult } from "@/features/member-invite/types";
import { createApprovalRequest, decideApprovalRequest } from "@/features/approvals/actions";
import { getApprovalRequestByEntity } from "@/features/approvals/queries";
import { canCurrentUserManageAccessControl } from "@/features/access-control/queries";

function normalizeRequestedRoleCode(input: string | null | undefined) {
  const code = input?.trim().toLowerCase();
  return code && code.length > 0 ? code : null;
}

async function canManageAccessControl(churchSlug: string) {
  return canCurrentUserManageAccessControl(churchSlug);
}

type AccessControlAuditAction =
  | "role_assigned"
  | "role_removed"
  | "permission_granted"
  | "permission_revoked";

async function ensureTargetChurchUser(
  churchId: string,
  userId: string
): Promise<{ id: string; status: string }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("church_users")
    .select("id, status")
    .eq("church_id", churchId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error("Selected user is not linked to this church.");
  }

  return data;
}

async function writeAccessControlAuditLog(input: {
  churchId: string;
  targetUserId: string;
  actorUserId: string;
  actionType: AccessControlAuditAction;
  roleId?: string | null;
  permissionId?: string | null;
  payload?: Record<string, unknown>;
}) {
  const supabase = await createClient();

  const { error } = await supabase.from("access_control_audit_logs").insert({
    church_id: input.churchId,
    target_user_id: input.targetUserId,
    actor_user_id: input.actorUserId,
    action_type: input.actionType,
    role_id: input.roleId ?? null,
    permission_id: input.permissionId ?? null,
    payload: input.payload ?? {},
  });

  if (error) {
    throw new Error(error.message);
  }
}

function revalidateAccessControlSurfaces(churchSlug: string) {
  revalidatePath(`/c/${churchSlug}/access-control`);
  revalidatePath(`/c/${churchSlug}/members`);
  revalidatePath(`/c/${churchSlug}/office`);
}

export async function assignChurchUserRoleAction(
  churchSlug: string,
  targetUserId: string,
  roleId: string
): Promise<SimpleActionResult> {
  try {
    const canManage = await canManageAccessControl(churchSlug);
    if (!canManage) {
      return {
        ok: false,
        error: "You do not have permission to assign roles.",
      };
    }

    if (!targetUserId?.trim() || !roleId?.trim()) {
      return {
        ok: false,
        error: "Target user and role are required.",
      };
    }

    const ctx = await requireChurchWorkspaceAccess(churchSlug);
    const supabase = await createClient();
    await ensureTargetChurchUser(ctx.churchId, targetUserId);

    const { data: roleDef, error: roleError } = await supabase
      .from("role_definitions")
      .select("id, code, name")
      .eq("id", roleId)
      .maybeSingle();

    if (roleError) {
      return { ok: false, error: roleError.message };
    }

    if (!roleDef) {
      return { ok: false, error: "Selected role definition was not found." };
    }

    const { data: existingRole, error: existingRoleError } = await supabase
      .from("church_role_assignments")
      .select("id, is_active")
      .eq("church_id", ctx.churchId)
      .eq("user_id", targetUserId)
      .eq("role_id", roleDef.id)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingRoleError) {
      return { ok: false, error: existingRoleError.message };
    }

    const nowIso = new Date().toISOString();
    if (existingRole?.is_active) {
      return { ok: true, message: `${roleDef.name} is already active for this user.` };
    }

    if (existingRole) {
      const { error: reactivateError } = await supabase
        .from("church_role_assignments")
        .update({
          is_active: true,
          end_date: null,
          assigned_by_user_id: ctx.profile.id,
          updated_at: nowIso,
        })
        .eq("id", existingRole.id);

      if (reactivateError) {
        return { ok: false, error: reactivateError.message };
      }
    } else {
      const { error: insertError } = await supabase
        .from("church_role_assignments")
        .insert({
          church_id: ctx.churchId,
          user_id: targetUserId,
          role_id: roleDef.id,
          is_active: true,
          assigned_by_user_id: ctx.profile.id,
        });

      if (insertError) {
        return { ok: false, error: insertError.message };
      }
    }

    await writeAccessControlAuditLog({
      churchId: ctx.churchId,
      targetUserId,
      actorUserId: ctx.profile.id,
      actionType: "role_assigned",
      roleId: roleDef.id,
      payload: {
        roleCode: roleDef.code,
        roleName: roleDef.name,
        source: "access_control_permissions_tab",
      },
    });

    revalidateAccessControlSurfaces(churchSlug);

    return {
      ok: true,
      message: `${roleDef.name} assigned successfully.`,
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to assign role.",
    };
  }
}

export async function revokeChurchUserRoleAction(
  churchSlug: string,
  targetUserId: string,
  roleAssignmentId: string
): Promise<SimpleActionResult> {
  try {
    const canManage = await canManageAccessControl(churchSlug);
    if (!canManage) {
      return {
        ok: false,
        error: "You do not have permission to revoke roles.",
      };
    }

    if (!targetUserId?.trim() || !roleAssignmentId?.trim()) {
      return {
        ok: false,
        error: "Target user and role assignment are required.",
      };
    }

    const ctx = await requireChurchWorkspaceAccess(churchSlug);
    const supabase = await createClient();
    await ensureTargetChurchUser(ctx.churchId, targetUserId);

    const { data: assignment, error: assignmentError } = await supabase
      .from("church_role_assignments")
      .select("id, role_id, is_active, role_definitions(code, name)")
      .eq("id", roleAssignmentId)
      .eq("church_id", ctx.churchId)
      .eq("user_id", targetUserId)
      .maybeSingle();

    if (assignmentError) {
      return { ok: false, error: assignmentError.message };
    }

    if (!assignment) {
      return { ok: false, error: "Role assignment not found for the selected user." };
    }

    if (!assignment.is_active) {
      return { ok: true, message: "Role assignment is already inactive." };
    }

    const { error: revokeError } = await supabase
      .from("church_role_assignments")
      .update({
        is_active: false,
        end_date: new Date().toISOString().slice(0, 10),
        updated_at: new Date().toISOString(),
      })
      .eq("id", assignment.id);

    if (revokeError) {
      return { ok: false, error: revokeError.message };
    }

    const role = Array.isArray(assignment.role_definitions)
      ? assignment.role_definitions[0]
      : assignment.role_definitions;

    await writeAccessControlAuditLog({
      churchId: ctx.churchId,
      targetUserId,
      actorUserId: ctx.profile.id,
      actionType: "role_removed",
      roleId: assignment.role_id,
      payload: {
        roleCode: role?.code ?? null,
        roleName: role?.name ?? null,
        source: "access_control_permissions_tab",
      },
    });

    revalidateAccessControlSurfaces(churchSlug);

    return {
      ok: true,
      message: role?.name ? `${role.name} removed successfully.` : "Role removed successfully.",
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to revoke role.",
    };
  }
}

export async function setChurchUserPermissionAction(
  churchSlug: string,
  targetUserId: string,
  permissionId: string,
  isActive: boolean
): Promise<SimpleActionResult> {
  try {
    const canManage = await canManageAccessControl(churchSlug);
    if (!canManage) {
      return {
        ok: false,
        error: "You do not have permission to update permissions.",
      };
    }

    if (!targetUserId?.trim() || !permissionId?.trim()) {
      return {
        ok: false,
        error: "Target user and permission are required.",
      };
    }

    const ctx = await requireChurchWorkspaceAccess(churchSlug);
    const supabase = await createClient();
    await ensureTargetChurchUser(ctx.churchId, targetUserId);

    const { data: permissionDef, error: permissionError } = await supabase
      .from("permission_definitions")
      .select("id, code, name")
      .eq("id", permissionId)
      .maybeSingle();

    if (permissionError) {
      return { ok: false, error: permissionError.message };
    }

    if (!permissionDef) {
      return { ok: false, error: "Permission definition was not found." };
    }

    const { data: existingAssignment, error: existingError } = await supabase
      .from("church_permission_assignments")
      .select("id, is_active")
      .eq("church_id", ctx.churchId)
      .eq("user_id", targetUserId)
      .eq("permission_id", permissionDef.id)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingError) {
      return { ok: false, error: existingError.message };
    }

    const nowIso = new Date().toISOString();

    if (isActive) {
      if (existingAssignment?.is_active) {
        return { ok: true, message: `${permissionDef.name} is already granted.` };
      }

      if (existingAssignment) {
        const { error: reactivateError } = await supabase
          .from("church_permission_assignments")
          .update({
            is_active: true,
            granted_by_user_id: ctx.profile.id,
            updated_at: nowIso,
          })
          .eq("id", existingAssignment.id);

        if (reactivateError) {
          return { ok: false, error: reactivateError.message };
        }
      } else {
        const { error: insertError } = await supabase
          .from("church_permission_assignments")
          .insert({
            church_id: ctx.churchId,
            user_id: targetUserId,
            permission_id: permissionDef.id,
            is_active: true,
            granted_by_user_id: ctx.profile.id,
          });

        if (insertError) {
          return { ok: false, error: insertError.message };
        }
      }

      await writeAccessControlAuditLog({
        churchId: ctx.churchId,
        targetUserId,
        actorUserId: ctx.profile.id,
        actionType: "permission_granted",
        permissionId: permissionDef.id,
        payload: {
          permissionCode: permissionDef.code,
          permissionName: permissionDef.name,
          source: "access_control_permissions_tab",
        },
      });
    } else {
      if (!existingAssignment || !existingAssignment.is_active) {
        return { ok: true, message: `${permissionDef.name} is already inactive.` };
      }

      const { error: deactivateError } = await supabase
        .from("church_permission_assignments")
        .update({
          is_active: false,
          updated_at: nowIso,
        })
        .eq("id", existingAssignment.id);

      if (deactivateError) {
        return { ok: false, error: deactivateError.message };
      }

      await writeAccessControlAuditLog({
        churchId: ctx.churchId,
        targetUserId,
        actorUserId: ctx.profile.id,
        actionType: "permission_revoked",
        permissionId: permissionDef.id,
        payload: {
          permissionCode: permissionDef.code,
          permissionName: permissionDef.name,
          source: "access_control_permissions_tab",
        },
      });
    }

    revalidateAccessControlSurfaces(churchSlug);

    return {
      ok: true,
      message: isActive
        ? `${permissionDef.name} granted successfully.`
        : `${permissionDef.name} revoked successfully.`,
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to update permission assignment.",
    };
  }
}

export async function approveChurchAccessRequestAction(
  churchSlug: string,
  requestId: string,
  reviewerNote?: string
): Promise<SimpleActionResult> {
  try {
    const canManage = await canManageAccessControl(churchSlug);

    if (!canManage) {
      return {
        ok: false,
        error: "You do not have permission to approve access requests.",
      };
    }

    const ctx = await requireChurchWorkspaceAccess(churchSlug);
    const supabase = await createClient();

    const { data: requestRow, error: requestError } = await supabase
      .from("church_access_requests")
      .select(`
        id,
        church_id,
        member_id,
        user_id,
        requested_role_id,
        requested_role_code,
        requested_role_name,
        status
      `)
      .eq("id", requestId)
      .eq("church_id", ctx.churchId)
      .single();

    if (requestError) {
      return { ok: false, error: requestError.message };
    }

    if (!requestRow) {
      return { ok: false, error: "Access request not found." };
    }

    if (requestRow.status !== "pending") {
      return { ok: false, error: "Only pending requests can be approved." };
    }

    if (!requestRow.user_id) {
      return { ok: false, error: "This request is not linked to a user yet." };
    }

    let roleId = requestRow.requested_role_id as string | null;
    const requestedRoleCode = normalizeRequestedRoleCode(requestRow.requested_role_code);

    if (!roleId && requestedRoleCode) {
      const { data: roleDef, error: roleLookupError } = await supabase
        .from("role_definitions")
        .select("id")
        .eq("code", requestedRoleCode)
        .maybeSingle();

      if (roleLookupError) {
        return { ok: false, error: roleLookupError.message };
      }

      roleId = roleDef?.id ?? null;
    }

    if (!roleId) {
      return {
        ok: false,
        error: "Could not resolve a valid role definition for this request.",
      };
    }

    const { data: existingRole, error: existingRoleError } = await supabase
      .from("church_role_assignments")
      .select("id, is_active")
      .eq("church_id", ctx.churchId)
      .eq("user_id", requestRow.user_id)
      .eq("role_id", roleId)
      .maybeSingle();

    if (existingRoleError) {
      return { ok: false, error: existingRoleError.message };
    }

    if (existingRole) {
      const { error: reactivateError } = await supabase
        .from("church_role_assignments")
        .update({
          is_active: true,
          end_date: null,
          updated_at: new Date().toISOString(),
          notes: requestRow.requested_role_name,
        })
        .eq("id", existingRole.id);

      if (reactivateError) {
        return { ok: false, error: reactivateError.message };
      }
    } else {
      const { error: insertRoleError } = await supabase
        .from("church_role_assignments")
        .insert({
          church_id: ctx.churchId,
          user_id: requestRow.user_id,
          role_id: roleId,
          is_active: true,
          assigned_by_user_id: ctx.profile.id,
          notes: requestRow.requested_role_name,
        });

      if (insertRoleError) {
        return { ok: false, error: insertRoleError.message };
      }
    }

    const existingApproval = await getApprovalRequestByEntity(
      churchSlug,
      "church_access_request",
      requestId
    );

    if (!existingApproval || ["rejected", "changes_requested", "cancelled"].includes(existingApproval.status)) {
      await createApprovalRequest({
        churchSlug,
        moduleKey: "access",
        entityType: "church_access_request",
        entityId: requestId,
        requestType: "role_access_request",
        payload: {
          requestedRoleId: requestRow.requested_role_id,
          requestedRoleCode: requestRow.requested_role_code,
          requestedRoleName: requestRow.requested_role_name,
          memberId: requestRow.member_id,
          userId: requestRow.user_id,
        },
        priority: "normal",
      });
    }

    const { error: updateRequestError } = await supabase
      .from("church_access_requests")
      .update({
        status: "approved",
        reviewed_at: new Date().toISOString(),
        reviewed_by_user_id: ctx.profile.id,
        reviewer_note: reviewerNote?.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", requestId)
      .eq("church_id", ctx.churchId);

    if (updateRequestError) {
      return { ok: false, error: updateRequestError.message };
    }

    const approval = await getApprovalRequestByEntity(
      churchSlug,
      "church_access_request",
      requestId
    );

    if (approval && approval.status === "pending") {
      await decideApprovalRequest({
        churchSlug,
        approvalRequestId: approval.id,
        decision: "approved",
        note: reviewerNote?.trim() || `Access request approved for ${requestRow.requested_role_name}.`,
      });
    }

    revalidateAccessControlSurfaces(churchSlug);

    return {
      ok: true,
      message: "Access request approved.",
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to approve access request.",
    };
  }
}

export async function rejectChurchAccessRequestAction(
  churchSlug: string,
  requestId: string,
  reviewerNote?: string
): Promise<SimpleActionResult> {
  try {
    const canManage = await canManageAccessControl(churchSlug);

    if (!canManage) {
      return {
        ok: false,
        error: "You do not have permission to reject access requests.",
      };
    }

    const ctx = await requireChurchWorkspaceAccess(churchSlug);
    const supabase = await createClient();

    const { data: requestRow, error: requestError } = await supabase
      .from("church_access_requests")
      .select(`
        id,
        requested_role_id,
        requested_role_code,
        requested_role_name,
        member_id,
        user_id,
        status
      `)
      .eq("id", requestId)
      .eq("church_id", ctx.churchId)
      .single();

    if (requestError) {
      return { ok: false, error: requestError.message };
    }

    if (!requestRow) {
      return { ok: false, error: "Access request not found." };
    }

    if (requestRow.status !== "pending") {
      return { ok: false, error: "Only pending requests can be rejected." };
    }

    const existingApproval = await getApprovalRequestByEntity(
      churchSlug,
      "church_access_request",
      requestId
    );

    if (!existingApproval || ["rejected", "changes_requested", "cancelled"].includes(existingApproval.status)) {
      await createApprovalRequest({
        churchSlug,
        moduleKey: "access",
        entityType: "church_access_request",
        entityId: requestId,
        requestType: "role_access_request",
        payload: {
          requestedRoleId: requestRow.requested_role_id,
          requestedRoleCode: requestRow.requested_role_code,
          requestedRoleName: requestRow.requested_role_name,
          memberId: requestRow.member_id,
          userId: requestRow.user_id,
        },
        priority: "normal",
      });
    }

    const { error: updateRequestError } = await supabase
      .from("church_access_requests")
      .update({
        status: "rejected",
        reviewed_at: new Date().toISOString(),
        reviewed_by_user_id: ctx.profile.id,
        reviewer_note: reviewerNote?.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", requestId)
      .eq("church_id", ctx.churchId);

    if (updateRequestError) {
      return { ok: false, error: updateRequestError.message };
    }

    const approval = await getApprovalRequestByEntity(
      churchSlug,
      "church_access_request",
      requestId
    );

    if (approval && approval.status === "pending") {
      await decideApprovalRequest({
        churchSlug,
        approvalRequestId: approval.id,
        decision: "rejected",
        note: reviewerNote?.trim() || "Access request rejected.",
      });
    }

    revalidateAccessControlSurfaces(churchSlug);

    return {
      ok: true,
      message: "Access request rejected.",
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to reject access request.",
    };
  }
}
