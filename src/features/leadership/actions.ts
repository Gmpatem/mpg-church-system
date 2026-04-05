"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireChurchAccess } from "@/features/access/queries";
import { canCurrentUserManageMemberInvites } from "@/features/member-invite/queries";
import type { SimpleActionResult } from "@/features/member-invite/types";
import { createApprovalRequest, decideApprovalRequest } from "@/features/approvals/actions";
import { getApprovalRequestByEntity } from "@/features/approvals/queries";

function revalidateLeadershipSurfaces(churchSlug: string) {
  revalidatePath(`/c/${churchSlug}/leadership`);
  revalidatePath(`/c/${churchSlug}/members`);
  revalidatePath(`/c/${churchSlug}/departments`);
  revalidatePath(`/my/${churchSlug}`);
  revalidatePath(`/c/${churchSlug}/office`);
}

export async function approveDepartmentLeadershipRequestAction(
  churchSlug: string,
  requestId: string,
  reviewerNote?: string
): Promise<SimpleActionResult> {
  try {
    const canManage = await canCurrentUserManageMemberInvites(churchSlug);

    if (!canManage) {
      return {
        ok: false,
        error: "You do not have permission to approve leadership requests.",
      };
    }

    const ctx = await requireChurchAccess(churchSlug);
    const supabase = await createClient();

    const { data: requestRow, error: requestError } = await supabase
      .from("department_leadership_requests")
      .select(`
        id,
        church_id,
        member_id,
        department_id,
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
      return { ok: false, error: "Leadership request not found." };
    }

    if (requestRow.status !== "pending") {
      return { ok: false, error: "Only pending requests can be approved." };
    }

    const { data: existingAssignment, error: existingError } = await supabase
      .from("department_leadership_assignments")
      .select("id, is_active")
      .eq("church_id", ctx.churchId)
      .eq("department_id", requestRow.department_id)
      .eq("member_id", requestRow.member_id)
      .eq("leadership_role_name", requestRow.requested_role_name)
      .maybeSingle();

    if (existingError) {
      return { ok: false, error: existingError.message };
    }

    if (existingAssignment) {
      const { error: reactivateError } = await supabase
        .from("department_leadership_assignments")
        .update({
          leadership_role_code: requestRow.requested_role_code,
          leadership_role_name: requestRow.requested_role_name,
          is_active: true,
          end_date: null,
          notes: reviewerNote?.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingAssignment.id);

      if (reactivateError) {
        return { ok: false, error: reactivateError.message };
      }
    } else {
      const { error: insertError } = await supabase
        .from("department_leadership_assignments")
        .insert({
          church_id: ctx.churchId,
          department_id: requestRow.department_id,
          member_id: requestRow.member_id,
          leadership_role_code: requestRow.requested_role_code,
          leadership_role_name: requestRow.requested_role_name,
          is_primary: false,
          start_date: new Date().toISOString().slice(0, 10),
          is_active: true,
          assigned_by_user_id: ctx.profile.id,
          notes: reviewerNote?.trim() || null,
        });

      if (insertError) {
        return { ok: false, error: insertError.message };
      }
    }

    const existingApproval = await getApprovalRequestByEntity(
      churchSlug,
      "department_leadership_request",
      requestId
    );

    if (!existingApproval || ["rejected", "changes_requested", "cancelled"].includes(existingApproval.status)) {
      await createApprovalRequest({
        churchSlug,
        moduleKey: "leadership",
        entityType: "department_leadership_request",
        entityId: requestId,
        requestType: "department_leadership_request",
        payload: {
          memberId: requestRow.member_id,
          departmentId: requestRow.department_id,
          requestedRoleCode: requestRow.requested_role_code,
          requestedRoleName: requestRow.requested_role_name,
        },
        priority: "normal",
      });
    }

    const { error: updateRequestError } = await supabase
      .from("department_leadership_requests")
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
      "department_leadership_request",
      requestId
    );

    if (approval && approval.status === "pending") {
      await decideApprovalRequest({
        churchSlug,
        approvalRequestId: approval.id,
        decision: "approved",
        note: reviewerNote?.trim() || `Leadership request approved for ${requestRow.requested_role_name}.`,
      });
    }

    revalidateLeadershipSurfaces(churchSlug);

    return {
      ok: true,
      message: "Leadership request approved.",
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to approve leadership request.",
    };
  }
}

export async function rejectDepartmentLeadershipRequestAction(
  churchSlug: string,
  requestId: string,
  reviewerNote?: string
): Promise<SimpleActionResult> {
  try {
    const canManage = await canCurrentUserManageMemberInvites(churchSlug);

    if (!canManage) {
      return {
        ok: false,
        error: "You do not have permission to reject leadership requests.",
      };
    }

    const ctx = await requireChurchAccess(churchSlug);
    const supabase = await createClient();

    const { data: requestRow, error: requestError } = await supabase
      .from("department_leadership_requests")
      .select(`
        id,
        church_id,
        member_id,
        department_id,
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
      return { ok: false, error: "Leadership request not found." };
    }

    if (requestRow.status !== "pending") {
      return { ok: false, error: "Only pending requests can be rejected." };
    }

    const existingApproval = await getApprovalRequestByEntity(
      churchSlug,
      "department_leadership_request",
      requestId
    );

    if (!existingApproval || ["rejected", "changes_requested", "cancelled"].includes(existingApproval.status)) {
      await createApprovalRequest({
        churchSlug,
        moduleKey: "leadership",
        entityType: "department_leadership_request",
        entityId: requestId,
        requestType: "department_leadership_request",
        payload: {
          memberId: requestRow.member_id,
          departmentId: requestRow.department_id,
          requestedRoleCode: requestRow.requested_role_code,
          requestedRoleName: requestRow.requested_role_name,
        },
        priority: "normal",
      });
    }

    const { error: updateRequestError } = await supabase
      .from("department_leadership_requests")
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
      "department_leadership_request",
      requestId
    );

    if (approval && approval.status === "pending") {
      await decideApprovalRequest({
        churchSlug,
        approvalRequestId: approval.id,
        decision: "rejected",
        note: reviewerNote?.trim() || "Leadership request rejected.",
      });
    }

    revalidateLeadershipSurfaces(churchSlug);

    return {
      ok: true,
      message: "Leadership request rejected.",
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to reject leadership request.",
    };
  }
}
