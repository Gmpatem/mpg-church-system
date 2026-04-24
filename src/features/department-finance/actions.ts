"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireChurchAccess, requireChurchRole } from "@/features/access/queries";
import type { ActionState } from "@/features/access/types";
import type { DepartmentFundRequestRecord, DepartmentFundRequestStatus } from "@/features/department-finance/types";
import { createTreasuryOutflowAction } from "@/features/treasury/actions";
import {
  formatCurrencyLabel,
  getDepartmentLeaderProfileIds,
  getDepartmentMemberProfileIds,
  getTreasuryManagerUserIds,
  insertChurchNotifications,
  isDepartmentLeaderForUser,
} from "@/features/department-finance/helpers";
import { getNumber, getString } from "@/lib/domain/validation";
import {
  isMissingColumnError,
  isMissingRelationError,
  normalizeSupabaseErrorMessage,
} from "@/lib/supabase/errors";

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

function revalidateDepartmentFinancePaths(churchSlug: string, departmentId: string) {
  revalidatePath(`/c/${churchSlug}/departments/${departmentId}`);
  revalidatePath(`/c/${churchSlug}/departments/${departmentId}/events`);
  revalidatePath(`/c/${churchSlug}/departments/${departmentId}/announcements`);
  revalidatePath(`/c/${churchSlug}/treasury`);
  revalidatePath(`/c/${churchSlug}/treasury/out`);
  revalidatePath(`/c/${churchSlug}/treasury/approvals`);
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

async function ensureFundBelongsToDepartment(
  supabase: any,
  churchId: string,
  departmentId: string,
  fundId: string | null
) {
  if (!fundId) return false;

  const withDepartment = await supabase
    .from("treasury_funds")
    .select("id, department_id")
    .eq("church_id", churchId)
    .eq("id", fundId)
    .maybeSingle();

  if (!withDepartment.error) {
    const row = withDepartment.data as { id: string; department_id?: string | null } | null;
    if (!row) return false;
    if (row.department_id === undefined) return true;
    return row.department_id === departmentId;
  }

  if (!isMissingColumnError(withDepartment.error, "department_id")) {
    throw new Error(withDepartment.error.message);
  }

  const legacy = await ensureFundBelongsToChurch(supabase, churchId, fundId);
  return legacy;
}

async function ensureEventBelongsToDepartment(
  supabase: any,
  churchId: string,
  departmentId: string,
  eventId: string | null
) {
  if (!eventId) return true;
  const { data, error } = await supabase
    .from("church_events")
    .select("id")
    .eq("church_id", churchId)
    .eq("id", eventId)
    .eq("department_id", departmentId)
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

  if (error) {
    if (isMissingRelationError(error, "department_fund_requests")) {
      throw new Error(
        "Department finance requests table is missing. Apply department finance migrations before reviewing requests."
      );
    }
    throw new Error(
      normalizeSupabaseErrorMessage(
        error,
        "Failed to load department fund request."
      )
    );
  }
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
    const fundId = getString(formData, "fundId") || null;
    const amount = getNumber(formData, "amount");
    const outflowType = getString(formData, "outflowType");
    const outflowDate = getString(formData, "outflowDate");
    const preferredFundId = getString(formData, "preferredFundId") || null;
    const referenceNumber = getString(formData, "referenceNumber") || null;
    const eventId = getString(formData, "eventId") || null;
    const payee = getString(formData, "payee") || null;
    const projectName = getString(formData, "projectName") || null;
    const note = getString(formData, "note") || null;

    if (!churchSlug || !departmentId) {
      return { ok: false, error: "Church and department are required." };
    }
    if (!title || !purpose || !fundId || !outflowDate || !Number.isFinite(amount) || amount <= 0) {
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

    if (!canSubmitAsLeader) {
      return {
        ok: false,
        error: "Only active department leaders can submit department finance requests.",
      };
    }

    const validFund = await ensureFundBelongsToChurch(supabase, ctx.churchId, fundId);
    if (!validFund) {
      return { ok: false, error: "Selected fund does not belong to this church." };
    }
    const validDepartmentFund = await ensureFundBelongsToDepartment(
      supabase,
      ctx.churchId,
      departmentId,
      fundId
    );
    if (!validDepartmentFund) {
      return { ok: false, error: "Selected fund must be the department's mapped fund." };
    }
    const validPreferredFund = await ensureFundBelongsToChurch(supabase, ctx.churchId, preferredFundId);
    if (!validPreferredFund) {
      return { ok: false, error: "Selected preferred fund does not belong to this church." };
    }
    const validEvent = await ensureEventBelongsToDepartment(
      supabase,
      ctx.churchId,
      departmentId,
      eventId
    );
    if (!validEvent) {
      return { ok: false, error: "Selected event does not belong to this department." };
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
        fund_id: fundId,
        outflow_date: outflowDate,
        reference_number: referenceNumber,
        event_id: eventId,
        preferred_fund_id: preferredFundId ?? fundId,
        payee,
        project_name: projectName,
        note,
        requested_date: outflowDate,
        status: "pending",
      })
      .select("id")
      .single();

    if (insertError) {
      if (
        isMissingRelationError(insertError, "department_fund_requests") ||
        isMissingColumnError(insertError, "fund_id") ||
        isMissingColumnError(insertError, "outflow_date")
      ) {
        return {
          ok: false,
          error:
            "Department finance request schema is not fully migrated yet. Apply the latest department finance migrations and retry.",
        };
      }
      return {
        ok: false,
        error: normalizeSupabaseErrorMessage(
          insertError,
          "Failed to create department fund request."
        ),
      };
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
      if (isMissingRelationError(updateError, "department_fund_requests")) {
        return {
          ok: false,
          error:
            "Department finance requests are not enabled yet. Apply department finance migrations and retry.",
        };
      }
      return {
        ok: false,
        error: normalizeSupabaseErrorMessage(
          updateError,
          "Failed to update department fund request."
        ),
      };
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

export async function processDepartmentFundRequestIntoOutflowAction(
  _prevState: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  try {
    const churchSlug = getString(formData, "churchSlug");
    const requestId = getString(formData, "requestId");
    if (!churchSlug || !requestId) {
      return { ok: false, error: "Church and request are required." };
    }

    const ctx = await requireChurchRole(churchSlug, ["church_admin", "pastor", "treasurer"]);
    const supabase = await createClient();

    const request = await getRequestById(supabase, ctx.churchId, requestId);
    if (!request) return { ok: false, error: "Department fund request not found." };
    if (!["pending", "approved"].includes(request.status)) {
      return { ok: false, error: "Only pending or approved requests can be processed." };
    }

    const mappedFundId = request.fund_id ?? request.preferred_fund_id ?? "";
    const mappedOutflowDate = request.outflow_date || request.requested_date;
    if (!mappedFundId) {
      return {
        ok: false,
        error:
          "Request is missing a fund mapping. Update the request with a department fund before processing.",
      };
    }
    if (!mappedOutflowDate) {
      return {
        ok: false,
        error:
          "Request is missing an outflow date mapping. Update the request before processing.",
      };
    }

    const outflowForm = new FormData();
    outflowForm.set("churchSlug", churchSlug);
    outflowForm.set("departmentFundRequestId", request.id);
    outflowForm.set("outflowType", request.outflow_type);
    outflowForm.set("fundId", mappedFundId);
    outflowForm.set("departmentId", request.department_id);
    outflowForm.set("amount", String(request.amount));
    outflowForm.set("outflowDate", mappedOutflowDate);
    outflowForm.set("payee", request.payee ?? "");
    outflowForm.set("purpose", request.purpose);
    outflowForm.set("projectName", request.project_name ?? "");
    outflowForm.set("referenceNumber", request.reference_number ?? "");
    outflowForm.set("note", request.note ?? "");
    outflowForm.set("paymentMethod", "other");

    return await createTreasuryOutflowAction(null, outflowForm);
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to process department request into treasury outflow.",
    };
  }
}

export async function processDepartmentFundRequestIntoOutflowSubmitAction(formData: FormData) {
  await processDepartmentFundRequestIntoOutflowAction(null, formData);
}
