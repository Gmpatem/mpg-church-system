"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireChurchRole } from "@/features/access/queries";
import type { ActionState } from "@/features/access/types";

/**
 * Helper to revalidate treasury-related caches for a church.
 * Uses path-based invalidation for comprehensive cache clearing.
 * Note: Tag-based invalidation can be added when upgrading to Next.js 15+ with full unstable_cache support.
 */
function revalidateTreasuryData(churchSlug: string) {
  // Path-based revalidation (existing behavior)
  revalidatePath(`/c/${churchSlug}/treasury`);
  revalidatePath(`/c/${churchSlug}/treasury/in`);
  revalidatePath(`/c/${churchSlug}/treasury/out`);
  revalidatePath(`/c/${churchSlug}/reports`);
}

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function getNumber(formData: FormData, key: string) {
  const raw = getString(formData, key);
  const num = Number(raw);
  return Number.isFinite(num) ? num : NaN;
}

function buildTreasuryReference(prefix: string, txDate: string) {
  const safeDate = (txDate || new Date().toISOString().slice(0, 10)).replace(/-/g, "");
  const suffix = Date.now().toString().slice(-6);
  return `${prefix}-${safeDate}-${suffix}`;
}

async function ensureFundBelongsToChurch(supabase: any, churchId: string, fundId: string | null) {
  if (!fundId) return true;

  const { data, error } = await supabase
    .from("treasury_funds")
    .select("id")
    .eq("church_id", churchId)
    .eq("id", fundId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return !!data;
}

async function getFundMeta(supabase: any, churchId: string, fundId: string | null) {
  if (!fundId) return null;

  const { data, error } = await supabase
    .from("treasury_funds")
    .select("id, code, fund_type")
    .eq("church_id", churchId)
    .eq("id", fundId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ?? null;
}

async function ensureMemberBelongsToChurch(supabase: any, churchId: string, memberId: string | null) {
  if (!memberId) return true;

  const { data, error } = await supabase
    .from("members")
    .select("id")
    .eq("church_id", churchId)
    .eq("id", memberId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return !!data;
}

async function ensureDepartmentBelongsToChurch(supabase: any, churchId: string, departmentId: string | null) {
  if (!departmentId) return true;

  const { data, error } = await supabase
    .from("church_departments")
    .select("id")
    .eq("church_id", churchId)
    .eq("id", departmentId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return !!data;
}

export async function createTreasuryInflowAction(
  _prevState: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  const churchSlug = getString(formData, "churchSlug");
  const ctx = await requireChurchRole(churchSlug, ["church_admin", "treasurer", "pastor"]);
  const supabase = await createClient();

  const inflowType = getString(formData, "inflowType");
  const fundId = getString(formData, "fundId");
  const memberId = getString(formData, "memberId") || null;
  const amount = getNumber(formData, "amount");
  const inflowDate = getString(formData, "inflowDate");
  const isAnonymous = getString(formData, "isAnonymous") === "true";
  const note = getString(formData, "note") || null;
  const referenceNumberInput = getString(formData, "referenceNumber");

  if (!inflowType || !fundId || !inflowDate || !Number.isFinite(amount) || amount <= 0) {
    return { ok: false, error: "Please complete all required money-in fields." };
  }

  try {
    const validFund = await ensureFundBelongsToChurch(supabase, ctx.churchId, fundId);
    if (!validFund) return { ok: false, error: "Selected fund does not belong to this church." };

    const fund = await getFundMeta(supabase, ctx.churchId, fundId);
    if (!fund) return { ok: false, error: "Selected fund does not belong to this church." };

    if (!isAnonymous && !memberId) {
      return { ok: false, error: "Named inflows must be linked to a member." };
    }

    if (isAnonymous && memberId) {
      return { ok: false, error: "Anonymous inflows cannot have a linked member." };
    }

    const effectiveMemberId = isAnonymous ? null : memberId;
    const validMember = await ensureMemberBelongsToChurch(supabase, ctx.churchId, effectiveMemberId);
    if (!validMember) return { ok: false, error: "Selected member does not belong to this church." };

    if (inflowType === "tithe" && fund.fund_type !== "tithe") {
      return { ok: false, error: "Tithe must be recorded into a tithe fund." };
    }

    if (inflowType === "offering" && fund.fund_type === "tithe") {
      return { ok: false, error: "Offering cannot be recorded into a tithe fund." };
    }

    if (inflowType === "donation" && fund.fund_type === "tithe") {
      return { ok: false, error: "Donation cannot be recorded into a tithe fund." };
    }

    const referenceNumber = referenceNumberInput || buildTreasuryReference("TIN", inflowDate);

    const { error } = await supabase.from("treasury_inflows").insert({
      church_id: ctx.churchId,
      member_id: effectiveMemberId,
      fund_id: fundId,
      inflow_type: inflowType,
      amount,
      inflow_date: inflowDate,
      is_anonymous: isAnonymous,
      note,
      reference_number: referenceNumber,
      recorded_by_user_id: ctx.userId,
    });

    if (error) {
      return { ok: false, error: error.message };
    }

    revalidateTreasuryData(churchSlug);
    return { ok: true, message: "Money-in entry recorded successfully." };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to record money-in entry.",
    };
  }
}

export async function createTreasuryOutflowAction(
  _prevState: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  const churchSlug = getString(formData, "churchSlug");
  const ctx = await requireChurchRole(churchSlug, ["church_admin", "treasurer", "pastor"]);
  const supabase = await createClient();

  const outflowType = getString(formData, "outflowType");
  const fundId = getString(formData, "fundId") || null;
  const departmentId = getString(formData, "departmentId") || null;
  const amount = getNumber(formData, "amount");
  const outflowDate = getString(formData, "outflowDate");
  const payee = getString(formData, "payee") || null;
  const purpose = getString(formData, "purpose");
  const projectName = getString(formData, "projectName") || null;
  const referenceNumberInput = getString(formData, "referenceNumber");
  const note = getString(formData, "note") || null;

  if (!outflowType || !outflowDate || !purpose || !Number.isFinite(amount) || amount <= 0) {
    return { ok: false, error: "Please complete all required money-out fields." };
  }

  try {
    if (!fundId) {
      return { ok: false, error: "Money-out entries must have a fund source." };
    }

    const validFund = await ensureFundBelongsToChurch(supabase, ctx.churchId, fundId);
    if (!validFund) return { ok: false, error: "Selected fund does not belong to this church." };

    const fund = await getFundMeta(supabase, ctx.churchId, fundId);
    if (!fund) return { ok: false, error: "Selected fund does not belong to this church." };

    const validDepartment = await ensureDepartmentBelongsToChurch(supabase, ctx.churchId, departmentId);
    if (!validDepartment) return { ok: false, error: "Selected department does not belong to this church." };

    if (fund.fund_type === "tithe" && outflowType !== "mission_remittance") {
      return { ok: false, error: "Tithe fund can only be used for mission remittance." };
    }

    const referenceNumber = referenceNumberInput || buildTreasuryReference("TOUT", outflowDate);

    const { error } = await supabase.from("treasury_outflows").insert({
      church_id: ctx.churchId,
      fund_id: fundId,
      department_id: departmentId,
      outflow_type: outflowType,
      amount,
      outflow_date: outflowDate,
      payee,
      purpose,
      project_name: projectName,
      reference_number: referenceNumber,
      note,
      recorded_by_user_id: ctx.userId,
    });

    if (error) {
      return { ok: false, error: error.message };
    }

    revalidateTreasuryData(churchSlug);
    return { ok: true, message: "Money-out entry recorded successfully." };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to record money-out entry.",
    };
  }
}

export async function updateTreasuryInflowAction(
  _prevState: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  const churchSlug = getString(formData, "churchSlug");
  const entryId = getString(formData, "entryId");
  const ctx = await requireChurchRole(churchSlug, ["church_admin", "treasurer", "pastor"]);
  const supabase = await createClient();

  const inflowType = getString(formData, "inflowType");
  const fundId = getString(formData, "fundId");
  const memberId = getString(formData, "memberId") || null;
  const amount = getNumber(formData, "amount");
  const inflowDate = getString(formData, "inflowDate");
  const isAnonymous = getString(formData, "isAnonymous") === "true";
  const note = getString(formData, "note") || null;
  const referenceNumberInput = getString(formData, "referenceNumber");
  const correctionNote = getString(formData, "correctionNote");

  if (!entryId || !inflowType || !fundId || !inflowDate || !Number.isFinite(amount) || amount <= 0) {
    return { ok: false, error: "Please complete all required fields." };
  }

  if (!correctionNote) {
    return { ok: false, error: "Correction note is required when editing a treasury entry." };
  }

  try {
    const validFund = await ensureFundBelongsToChurch(supabase, ctx.churchId, fundId);
    if (!validFund) return { ok: false, error: "Selected fund does not belong to this church." };

    const fund = await getFundMeta(supabase, ctx.churchId, fundId);
    if (!fund) return { ok: false, error: "Selected fund does not belong to this church." };

    if (!isAnonymous && !memberId) {
      return { ok: false, error: "Named inflows must be linked to a member." };
    }

    if (isAnonymous && memberId) {
      return { ok: false, error: "Anonymous inflows cannot have a linked member." };
    }

    const effectiveMemberId = isAnonymous ? null : memberId;
    const validMember = await ensureMemberBelongsToChurch(supabase, ctx.churchId, effectiveMemberId);
    if (!validMember) return { ok: false, error: "Selected member does not belong to this church." };

    if (inflowType === "tithe" && fund.fund_type !== "tithe") {
      return { ok: false, error: "Tithe must be recorded into a tithe fund." };
    }

    if (inflowType === "offering" && fund.fund_type === "tithe") {
      return { ok: false, error: "Offering cannot be recorded into a tithe fund." };
    }

    if (inflowType === "donation" && fund.fund_type === "tithe") {
      return { ok: false, error: "Donation cannot be recorded into a tithe fund." };
    }

    const referenceNumber = referenceNumberInput || buildTreasuryReference("TIN", inflowDate);
    const fullNote = [note, `Correction: ${correctionNote}`].filter(Boolean).join("\n\n");

    const { error } = await supabase
      .from("treasury_inflows")
      .update({
        inflow_type: inflowType,
        fund_id: fundId,
        member_id: effectiveMemberId,
        amount,
        inflow_date: inflowDate,
        is_anonymous: isAnonymous,
        note: fullNote,
        reference_number: referenceNumber,
        updated_at: new Date().toISOString(),
      })
      .eq("church_id", ctx.churchId)
      .eq("id", entryId);

    if (error) {
      return { ok: false, error: error.message };
    }

    revalidateTreasuryData(churchSlug);
    revalidatePath(`/c/${churchSlug}/treasury/in/${entryId}/edit`);

    return { ok: true, message: "Money-in entry updated successfully." };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to update money-in entry.",
    };
  }
}

export async function updateTreasuryOutflowAction(
  _prevState: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  const churchSlug = getString(formData, "churchSlug");
  const entryId = getString(formData, "entryId");
  const ctx = await requireChurchRole(churchSlug, ["church_admin", "treasurer", "pastor"]);
  const supabase = await createClient();

  const outflowType = getString(formData, "outflowType");
  const fundId = getString(formData, "fundId") || null;
  const departmentId = getString(formData, "departmentId") || null;
  const amount = getNumber(formData, "amount");
  const outflowDate = getString(formData, "outflowDate");
  const payee = getString(formData, "payee") || null;
  const purpose = getString(formData, "purpose");
  const projectName = getString(formData, "projectName") || null;
  const referenceNumberInput = getString(formData, "referenceNumber");
  const note = getString(formData, "note") || null;
  const correctionNote = getString(formData, "correctionNote");

  if (!entryId || !outflowType || !outflowDate || !purpose || !Number.isFinite(amount) || amount <= 0) {
    return { ok: false, error: "Please complete all required fields." };
  }

  if (!correctionNote) {
    return { ok: false, error: "Correction note is required when editing a treasury entry." };
  }

  try {
    if (!fundId) {
      return { ok: false, error: "Money-out entries must have a fund source." };
    }

    const validFund = await ensureFundBelongsToChurch(supabase, ctx.churchId, fundId);
    if (!validFund) return { ok: false, error: "Selected fund does not belong to this church." };

    const fund = await getFundMeta(supabase, ctx.churchId, fundId);
    if (!fund) return { ok: false, error: "Selected fund does not belong to this church." };

    const validDepartment = await ensureDepartmentBelongsToChurch(supabase, ctx.churchId, departmentId);
    if (!validDepartment) return { ok: false, error: "Selected department does not belong to this church." };

    if (fund.fund_type === "tithe" && outflowType !== "mission_remittance") {
      return { ok: false, error: "Tithe fund can only be used for mission remittance." };
    }

    const referenceNumber = referenceNumberInput || buildTreasuryReference("TOUT", outflowDate);
    const fullNote = [note, `Correction: ${correctionNote}`].filter(Boolean).join("\n\n");

    const { error } = await supabase
      .from("treasury_outflows")
      .update({
        outflow_type: outflowType,
        fund_id: fundId,
        department_id: departmentId,
        amount,
        outflow_date: outflowDate,
        payee,
        purpose,
        project_name: projectName,
        reference_number: referenceNumber,
        note: fullNote,
        updated_at: new Date().toISOString(),
      })
      .eq("church_id", ctx.churchId)
      .eq("id", entryId);

    if (error) {
      return { ok: false, error: error.message };
    }

    revalidateTreasuryData(churchSlug);
    revalidatePath(`/c/${churchSlug}/treasury/out/${entryId}/edit`);

    return { ok: true, message: "Money-out entry updated successfully." };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to update money-out entry.",
    };
  }
}

export async function createTreasuryFundAction(
  _prevState: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  const churchSlug = getString(formData, "churchSlug");
  const ctx = await requireChurchRole(churchSlug, ["church_admin", "treasurer", "pastor"]);
  const supabase = await createClient();

  const code = getString(formData, "code").toLowerCase();
  const name = getString(formData, "name");
  const fundType = getString(formData, "fundType");
  const description = getString(formData, "description") || null;

  if (!code || !name || !fundType) {
    return { ok: false, error: "Code, name, and fund type are required." };
  }

  const { error } = await supabase.from("treasury_funds").insert({
    church_id: ctx.churchId,
    code,
    name,
    fund_type: fundType,
    description,
    is_active: true,
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidateTreasuryData(churchSlug);
  return { ok: true, message: "Treasury fund created successfully." };
}

export async function toggleTreasuryFundAction(
  _prevState: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  const churchSlug = getString(formData, "churchSlug");
  const fundId = getString(formData, "fundId");
  const nextState = getString(formData, "nextState") === "true";
  const ctx = await requireChurchRole(churchSlug, ["church_admin", "treasurer", "pastor"]);
  const supabase = await createClient();

  if (!fundId) {
    return { ok: false, error: "Fund ID is required." };
  }

  const protectedCodes = ["tithe", "local_budget"];
  const { data: fund, error: fundError } = await supabase
    .from("treasury_funds")
    .select("id, code")
    .eq("church_id", ctx.churchId)
    .eq("id", fundId)
    .maybeSingle();

  if (fundError) return { ok: false, error: fundError.message };
  if (!fund) return { ok: false, error: "Fund not found." };

  if (protectedCodes.includes(fund.code) && nextState === false) {
    return { ok: false, error: "Core funds like tithe, offering, and local_budget cannot be deactivated." };
  }

  const { error } = await supabase
    .from("treasury_funds")
    .update({
      is_active: nextState,
      updated_at: new Date().toISOString(),
    })
    .eq("church_id", ctx.churchId)
    .eq("id", fundId);

  if (error) return { ok: false, error: error.message };

  revalidateTreasuryData(churchSlug);
  return { ok: true, message: nextState ? "Fund activated." : "Fund deactivated." };
}
