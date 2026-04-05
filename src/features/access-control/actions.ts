"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireChurchAccess } from "@/features/access/queries";
import { canCurrentUserManageMemberInvites } from "@/features/member-invite/queries";
import type { SimpleActionResult } from "@/features/member-invite/types";
import { createApprovalRequest, decideApprovalRequest } from "@/features/approvals/actions";
import { getApprovalRequestByEntity } from "@/features/approvals/queries";

function normalizeRequestedRoleCode(input: string | null | undefined) {
  const code = input?.trim().toLowerCase();
  return code && code.length > 0 ? code : null;
}

async function canManageAccessControl(churchSlug: string) {
  return canCurrentUserManageMemberInvites(churchSlug);
}

function revalidateAccessControlSurfaces(churchSlug: string) {
  revalidatePath(`/c/${churchSlug}/access-control`);
  revalidatePath(`/c/${churchSlug}/members`);
  revalidatePath(`/c/${churchSlug}/office`);
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

    const ctx = await requireChurchAccess(churchSlug);
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

    const ctx = await requireChurchAccess(churchSlug);
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
