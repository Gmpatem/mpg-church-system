"use server";

import { createClient } from "@/lib/supabase/server";

type ServerSupabaseClient = Awaited<ReturnType<typeof createClient>>;

export type CreateHouseholdRecordInput = {
  churchId: string;
  actorUserId: string;
  householdName: string;
  city?: string | null;
  country?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  notes?: string | null;
  headMemberId?: string | null;
};

export type CreateHouseholdRecordResult =
  | { ok: true; householdId: string }
  | { ok: false; error: string };

export async function createHouseholdRecord(
  supabase: ServerSupabaseClient,
  input: CreateHouseholdRecordInput
): Promise<CreateHouseholdRecordResult> {
  try {
    const householdName = input.householdName.trim();
    if (!householdName) {
      return { ok: false, error: "Household name is required." };
    }

    const insertPayload = {
      church_id: input.churchId,
      household_name: householdName,
      city: input.city || null,
      country: input.country || null,
      phone: input.phone || null,
      email: input.email || null,
      address: input.address || null,
      notes: input.notes || null,
      created_by_user_id: input.actorUserId,
      head_of_household_id: input.headMemberId || null,
    };

    const { data, error } = await supabase
      .from("households")
      .insert(insertPayload)
      .select("id")
      .single();

    if (error) {
      return { ok: false, error: error.message };
    }

    if (!data?.id) {
      return { ok: false, error: "Household creation returned no ID." };
    }

    return { ok: true, householdId: data.id };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to create household.",
    };
  }
}
