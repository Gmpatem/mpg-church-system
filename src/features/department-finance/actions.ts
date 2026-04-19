"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireChurchAccess, requireChurchRole } from "@/features/access/queries";
import type { ActionState } from "@/features/access/types";
import type { DepartmentFundRequestRecord, DepartmentFundRequestStatus } from "@/features/department-finance/types";
import {
  canSubmitDepartmentFundRequests,
  formatCurrencyLabel,
  getDepartmentLeaderProfileIds,
  getDepartmentMemberProfileIds,
  getTreasuryManagerUserIds,
  insertChurchNotifications,
  isDepartmentLeaderForUser,
} from "@/features/department-finance/helpers";

const ALLOWED_OUTFLOW_TYPES = [
  "project",
  "evangelism",
  "mission_remittance",
  "department_expense",
  "operations",
  "welfare",
  "equipment",
  "other",
] as const;
const TREASURY_REVIEWER_ROLE_CODES = ["church_admin", "pastor", "treasurer"] as const;

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function getNumber(formData: FormData, key: string) {
  const raw = getString(formData, key);
  const num = Number(raw);
  return Number.isFinite(num) ? num : NaN;
}

function revalidateDepartmentFinancePaths(churchSlug: string, departmentId: string) {
  revalidatePath(`/c/${churchSlug}/departments/${departmentId}`);
  revalidatePath(`/c/${churchSlug}/departments/${departmentId}/events`);
  revalidatePath(`/c/${churchSlug}/departments/${departmentId}/announcements`);
  revalidatePath(`/c/${churchSlug}/treasury`);
  revalidatePath(`/c/${churchSlug}/treasury/out`);
  revalidatePath(`/c/${churchSlug}/dashboard`);
  revalidatePath(`/my/${churchSlug}`);
}

async function ensureDepartmentBelongsToChurch(
  supabase: any,
  churchId: string,
  departmentId: string
) {
  const { data, error } = await supabase
    .from("church_departments")
    .select("id, department_name")
    .eq("church_id", churchId)
    .eq("id", departmentId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data as { id: string; department_name: string } | null;
}

async function ensureFundBelongsToChurch(
  supabase: any,
  churchId: string,
  fundId: string | null
) {
  if (!fundId) return true;
  const { data, error } = await supabase
    .from("treasury_funds")
    .select("id")
    .eq("church_id", churchId)
    .eq("id", fundId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return Boolean(data);
}

async function getRequestById(
  supabase: any,
  churchId: string,
  requestId: string
) {
  const { data, error } = await supabase
    .from("department_fund_requests")
    .select("*")
    .eq("church_id", churchId)
    .eq("id", requestId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return (data as DepartmentFundRequestRecord | null) ?? null;
}

async function notifyTreasuryRequestSubmitted(params: {
  supabase: any;
  churchId: string;
  churchSlug: string;
  departmentId: string;
  requestId: string;
  title: string;
  amount: number;
}) {
  const { supabase, churchId, churchSlug, departmentId, requestId, title, amount } = params;
  const treasuryManagers = await getTreasuryManagerUserIds(supabase, churchId);
  if (treasuryManagers.length === 0) return;

  await insertChurchNotifications(
    supabase,
    treasuryManagers.map((userId) => ({
      church_id: churchId,
      target_user_id: userId,
      event_type: "approval",
      entity_type: "department_fund_request",
      entity_id: requestId,
      title: "Department fund request submitted",
      message: `${title} (${formatCurrencyLabel(amount)}) requires treasury review.`,
      href: `/c/${churchSlug}/departments/${departmentId}?tab=finance&requestId=${requestId}`,
      is_read: false,
    }))
  );
}

async function notifyRequestDecision(params: {
  supabase: any;
  churchId: string;
  churchSlug: string;
  request: DepartmentFundRequestRecord;
  decision: "approved" | "rejected";
}) {
  const { supabase, churchId, churchSlug, request, decision } = params;

  const [departmentMemberProfileIds, departmentLeaderProfileIds] = await Promise.all([
    getDepartmentMemberProfileIds(supabase, churchId, request.department_id),
    getDepartmentLeaderProfileIds(supabase, churchId, request.department_id),
  ]);

  const recipientIds = Array.from(
    new Set([
      request.requested_by_user_id,
      ...departmentMemberProfileIds,
      ...departmentLeaderProfileIds,
    ].filter(Boolean))
  );

  if (recipientIds.length === 0) return;

  const message =
    decision === "approved"
      ? `${request.title} was approved by treasury.`
      : `${request.title} was rejected by treasury.`;

  await insertChurchNotifications(
    supabase,
    recipientIds.map((targetUserId) => ({
      church_id: churchId,
      target_user_id: targetUserId,
      event_type: "approval",
      entity_type: "department_fund_request",
      entity_id: request.id,
      title: "Department finance request update",
      message,
      href: `/c/${churchSlug}/departments/${request.department_id}?tab=finance&requestId=${request.id}`,
      is_read: false,
    }))
  );
}

export async function createDepartmentFundRequestAction(
  _prevState: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  try {
    const churchSlug = getString(formData, "churchSlug");
    const departmentId = getString(formData, "departmentId");
    const title = getString(formData, "title");
    const purpose = getString(formData, "purpose");
    const amount = getNumber(formData, "amount");
    const outflowType = getString(formData, "outflowType");
    const preferredFundId = getString(formData, "preferredFundId") || null;
    const payee = getString(formData, "payee") || null;
    const projectName = getString(formData, "projectName") || null;
    const note = getString(formData, "note") || null;
    const requestedDate = getString(formData, "requestedDate");

    if (!churchSlug || !departmentId) {
      return { ok: false, error: "Church and department are required." };
    }
    if (!title || !purpose || !requestedDate || !Number.isFinite(amount) || amount <= 0) {
      return { ok: false, error: "Please complete all required fields for this request." };
    }
    if (!(ALLOWED_OUTFLOW_TYPES as readonly string[]).includes(outflowType)) {
      return { ok: false, error: "Invalid outflow category for department request." };
    }

    const ctx = await requireChurchAccess(churchSlug);
    const supabase = await createClient();

    const department = await ensureDepartmentBelongsToChurch(supabase, ctx.churchId, departmentId);
    if (!department) {
      return { ok: false, error: "Selected department does not belong to this church." };
    }

    const canSubmitAsLeader = await isDepartmentLeaderForUser({
      supabase,
      churchId: ctx.churchId,
      userId: ctx.userId,
      departmentId,
    });

    if (
      !canSubmitAsLeader &&
      !canSubmitDepartmentFundRequests(ctx.roles, ctx.isPlatformAdmin)
    ) {
      return {
        ok: false,
        error:
          "Only active department leaders can submit department finance requests.",
      };
    }

    const validFund = await ensureFundBelongsToChurch(supabase, ctx.churchId, preferredFundId);
    if (!validFund) {
      return { ok: false, error: "Selected preferred fund does not belong to this church." };
    }

    const { data: inserted, error: insertError } = await supabase
      .from("department_fund_requests")
      .insert({
        church_id: ctx.churchId,
        department_id: departmentId,
        requested_by_user_id: ctx.userId,
        title,
        purpose,
        amount,
        outflow_type: outflowType,
        preferred_fund_id: preferredFundId,
        payee,
        project_name: projectName,
        note,
        requested_date: requestedDate,
        status: "pending",
      })
      .select("id")
      .single();

    if (insertError) {
      return { ok: false, error: insertError.message };
    }

    await notifyTreasuryRequestSubmitted({
      supabase,
      churchId: ctx.churchId,
      churchSlug,
      departmentId,
      requestId: inserted.id,
      title,
      amount,
    });

    revalidateDepartmentFinancePaths(churchSlug, departmentId);
    return { ok: true, message: "Department fund request submitted for treasury review." };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to create department fund request.",
    };
  }
}

export async function reviewDepartmentFundRequestAction(
  _prevState: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  try {
    const churchSlug = getString(formData, "churchSlug");
    const requestId = getString(formData, "requestId");
    const decision = getString(formData, "decision");
    const decisionNote = getString(formData, "decisionNote") || null;

    if (!churchSlug || !requestId) {
      return { ok: false, error: "Church and request are required." };
    }
    if (!["approved", "rejected"].includes(decision)) {
      return { ok: false, error: "Unsupported review decision." };
    }

    const ctx = await requireChurchRole(churchSlug, ["church_admin", "pastor", "treasurer"]);
    const hasTreasuryReviewerRole = ctx.roles.some((role) =>
      (TREASURY_REVIEWER_ROLE_CODES as readonly string[]).includes(role)
    );
    if (!hasTreasuryReviewerRole) {
      return {
        ok: false,
        error: "Only church treasury managers can review department fund requests.",
      };
    }
    const supabase = await createClient();

    const request = await getRequestById(supabase, ctx.churchId, requestId);
    if (!request) {
      return { ok: false, error: "Department fund request not found." };
    }

    const allowedCurrentStatuses: DepartmentFundRequestStatus[] = ["pending", "approved"];
    if (!allowedCurrentStatuses.includes(request.status)) {
      return {
        ok: false,
        error: "Only pending or approved requests can be updated.",
      };
    }

    const nextStatus = decision as "approved" | "rejected";
    const nowIso = new Date().toISOString();

    const { error: updateError } = await supabase
      .from("department_fund_requests")
      .update({
        status: nextStatus,
        treasury_decision_note: decisionNote,
        treasury_reviewed_by_user_id: ctx.userId,
        treasury_reviewed_at: nowIso,
        updated_at: nowIso,
      })
      .eq("church_id", ctx.churchId)
      .eq("id", requestId);

    if (updateError) {
      return { ok: false, error: updateError.message };
    }

    await notifyRequestDecision({
      supabase,
      churchId: ctx.churchId,
      churchSlug,
      request: {
        ...request,
        status: nextStatus,
        treasury_decision_note: decisionNote,
        treasury_reviewed_by_user_id: ctx.userId,
        treasury_reviewed_at: nowIso,
      },
      decision: nextStatus,
    });

    revalidateDepartmentFinancePaths(churchSlug, request.department_id);
    return {
      ok: true,
      message:
        nextStatus === "approved"
          ? "Department fund request approved."
          : "Department fund request rejected.",
    };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to review department fund request.",
    };
  }
}

export async function reviewDepartmentFundRequestSubmitAction(formData: FormData) {
  await reviewDepartmentFundRequestAction(null, formData);
}
