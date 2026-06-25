"use server";

import { revalidatePath } from "next/cache";
import { requireChurchRole } from "@/features/access/queries";
import { createClient } from "@/lib/supabase/server";
import type { ActionState } from "@/features/access/types";
import { CHURCH_MANAGEMENT_ROLE_CODES } from "@/lib/domain/church-access";
import { getString } from "@/lib/domain/validation";
import { createHouseholdRecord } from "./services/create-household-record";
import { linkMemberToHousehold } from "./services/link-member-household";
import { setHouseholdHead } from "./services/set-household-head";

type CreateHouseholdActionState =
  | { ok: true; message?: string; householdId?: string; error?: undefined }
  | { ok: false; error: string; message?: undefined; householdId?: undefined };

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

  const result = await createHouseholdRecord(supabase, {
    churchId: ctx.churchId,
    actorUserId: ctx.userId,
    householdName,
    city,
    country,
    phone,
    email,
    address,
    notes,
  });

  if (!result.ok) {
    return { ok: false, error: result.error };
  }

  revalidatePath(`/c/${churchSlug}/households`);
  revalidatePath(`/c/${churchSlug}/dashboard`);

  return {
    ok: true,
    message: "Household created successfully.",
    householdId: result.householdId,
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

  const result = await linkMemberToHousehold(supabase, {
    churchId: ctx.churchId,
    householdId,
    memberId,
    householdRole,
  });

  if (!result.ok) {
    return { ok: false, error: result.error };
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

  const result = await setHouseholdHead(supabase, {
    churchId: ctx.churchId,
    householdId,
    memberId,
  });

  if (!result.ok) {
    return { ok: false, error: result.error };
  }

  revalidatePath(`/c/${churchSlug}/households`);
  revalidatePath(`/c/${churchSlug}/households/${householdId}`);
  revalidatePath(`/c/${churchSlug}/members`);
  revalidatePath(`/c/${churchSlug}/dashboard`);

  return { ok: true, message: "Head of household updated." };
}

