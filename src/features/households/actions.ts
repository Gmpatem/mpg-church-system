"use server";

import { revalidatePath } from "next/cache";
import { requireChurchRole } from "@/features/access/queries";
import { createClient } from "@/lib/supabase/server";
import type { ActionState } from "@/features/access/types";
import { CHURCH_MANAGEMENT_ROLE_CODES } from "@/lib/domain/church-access";
import { getString } from "@/lib/domain/validation";

type CreateHouseholdActionState =
  | { ok: true; message?: string; householdId?: string; error?: undefined }
  | { ok: false; error: string; message?: undefined; householdId?: undefined };

async function ensureHouseholdBelongsToChurch(supabase: any, churchId: string, householdId: string) {
  const { data, error } = await supabase
    .from("households")
    .select("id")
    .eq("church_id", churchId)
    .eq("id", householdId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return !!data;
}

async function ensureMemberBelongsToChurch(supabase: any, churchId: string, memberId: string) {
  const { data, error } = await supabase
    .from("members")
    .select("id")
    .eq("church_id", churchId)
    .eq("id", memberId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return !!data;
}

export async function createHouseholdAction(formData: FormData): Promise<void> {
  const result = await createHouseholdActionImpl(null, formData);
  if (!result.ok) {
    throw new Error(result.error ?? "Failed to create household.");
  }
}

export async function createHouseholdWorkspaceAction(
  formData: FormData
): Promise<CreateHouseholdActionState> {
  return createHouseholdActionImpl(null, formData);
}

async function createHouseholdActionImpl(
  _prevState: ActionState | null,
  formData: FormData
): Promise<CreateHouseholdActionState> {
  const churchSlug = getString(formData, "churchSlug");
  const ctx = await requireChurchRole(churchSlug, CHURCH_MANAGEMENT_ROLE_CODES);

  const householdName = getString(formData, "household_name");
  const city = getString(formData, "city");
  const country = getString(formData, "country");
  const phone = getString(formData, "phone");
  const email = getString(formData, "email");
  const address = getString(formData, "address");
  const notes = getString(formData, "notes");

  if (!householdName) {
    return { ok: false, error: "Household name is required." };
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("households")
    .insert({
      church_id: ctx.churchId,
      household_name: householdName,
      city: city || null,
      country: country || null,
      phone: phone || null,
      email: email || null,
      address: address || null,
      notes: notes || null,
      created_by_user_id: ctx.userId,
    })
    .select("id")
    .single();

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath(`/c/${churchSlug}/households`);
  revalidatePath(`/c/${churchSlug}/dashboard`);

  return {
    ok: true,
    message: "Household created successfully.",
    householdId: data?.id,
  };
}

export async function updateHouseholdAction(formData: FormData): Promise<void> {
  const result = await updateHouseholdActionImpl(null, formData);
  if (!result.ok) {
    throw new Error(result.error ?? "Failed to update household.");
  }
}

async function updateHouseholdActionImpl(
  _prevState: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  const churchSlug = getString(formData, "churchSlug");
  const householdId = getString(formData, "householdId");
  const ctx = await requireChurchRole(churchSlug, CHURCH_MANAGEMENT_ROLE_CODES);

  if (!householdId) {
    return { ok: false, error: "Household ID is required." };
  }

  const householdName = getString(formData, "household_name");
  const city = getString(formData, "city");
  const country = getString(formData, "country");
  const phone = getString(formData, "phone");
  const email = getString(formData, "email");
  const address = getString(formData, "address");
  const notes = getString(formData, "notes");

  if (!householdName) {
    return { ok: false, error: "Household name is required." };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("households")
    .update({
      household_name: householdName,
      city: city || null,
      country: country || null,
      phone: phone || null,
      email: email || null,
      address: address || null,
      notes: notes || null,
      updated_at: new Date().toISOString(),
    })
    .eq("church_id", ctx.churchId)
    .eq("id", householdId);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath(`/c/${churchSlug}/households`);
  revalidatePath(`/c/${churchSlug}/households/${householdId}`);
  revalidatePath(`/c/${churchSlug}/dashboard`);

  return { ok: true, message: "Household updated successfully." };
}

export async function assignMemberToHouseholdAction(formData: FormData): Promise<void> {
  const result = await assignMemberToHouseholdActionImpl(null, formData);
  if (!result.ok) {
    throw new Error(result.error ?? "Failed to assign member to household.");
  }
}

async function assignMemberToHouseholdActionImpl(
  _prevState: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  const churchSlug = getString(formData, "churchSlug");
  const householdId = getString(formData, "householdId");
  const memberId = getString(formData, "memberId");
  const householdRole = getString(formData, "householdRole") || null;

  const ctx = await requireChurchRole(churchSlug, CHURCH_MANAGEMENT_ROLE_CODES);
  const supabase = await createClient();

  if (!householdId || !memberId) {
    return { ok: false, error: "Household and member are required." };
  }

  const validHousehold = await ensureHouseholdBelongsToChurch(supabase, ctx.churchId, householdId);
  if (!validHousehold) {
    return { ok: false, error: "Household does not belong to this church." };
  }

  const validMember = await ensureMemberBelongsToChurch(supabase, ctx.churchId, memberId);
  if (!validMember) {
    return { ok: false, error: "Member does not belong to this church." };
  }

  const { error } = await supabase
    .from("members")
    .update({
      household_id: householdId,
      household_role: householdRole,
      updated_at: new Date().toISOString(),
    })
    .eq("church_id", ctx.churchId)
    .eq("id", memberId);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath(`/c/${churchSlug}/households`);
  revalidatePath(`/c/${churchSlug}/households/${householdId}`);
  revalidatePath(`/c/${churchSlug}/members`);
  revalidatePath(`/c/${churchSlug}/dashboard`);

  return { ok: true, message: "Member assigned to household." };
}

export async function setHouseholdHeadAction(formData: FormData): Promise<void> {
  const result = await setHouseholdHeadActionImpl(null, formData);
  if (!result.ok) {
    throw new Error(result.error ?? "Failed to update head of household.");
  }
}

async function setHouseholdHeadActionImpl(
  _prevState: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  const churchSlug = getString(formData, "churchSlug");
  const householdId = getString(formData, "householdId");
  const memberId = getString(formData, "memberId");

  const ctx = await requireChurchRole(churchSlug, CHURCH_MANAGEMENT_ROLE_CODES);
  const supabase = await createClient();

  if (!householdId || !memberId) {
    return { ok: false, error: "Household and member are required." };
  }

  const validHousehold = await ensureHouseholdBelongsToChurch(supabase, ctx.churchId, householdId);
  if (!validHousehold) {
    return { ok: false, error: "Household does not belong to this church." };
  }

  const { data: member, error: memberError } = await supabase
    .from("members")
    .select("id, household_id")
    .eq("church_id", ctx.churchId)
    .eq("id", memberId)
    .maybeSingle();

  if (memberError) {
    return { ok: false, error: memberError.message };
  }

  if (!member) {
    return { ok: false, error: "Member not found." };
  }

  if (member.household_id !== householdId) {
    return { ok: false, error: "Member must belong to the household before becoming head." };
  }

  const { error: householdError } = await supabase
    .from("households")
    .update({
      head_of_household_id: memberId,
      updated_at: new Date().toISOString(),
    })
    .eq("church_id", ctx.churchId)
    .eq("id", householdId);

  if (householdError) {
    return { ok: false, error: householdError.message };
  }

  const { error: memberUpdateError } = await supabase
    .from("members")
    .update({
      household_role: "head",
      updated_at: new Date().toISOString(),
    })
    .eq("church_id", ctx.churchId)
    .eq("id", memberId);

  if (memberUpdateError) {
    return { ok: false, error: memberUpdateError.message };
  }

  revalidatePath(`/c/${churchSlug}/households`);
  revalidatePath(`/c/${churchSlug}/households/${householdId}`);
  revalidatePath(`/c/${churchSlug}/members`);
  revalidatePath(`/c/${churchSlug}/dashboard`);

  return { ok: true, message: "Head of household updated." };
}

