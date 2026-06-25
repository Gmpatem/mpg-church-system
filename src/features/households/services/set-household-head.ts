"use server";

import { createClient } from "@/lib/supabase/server";

type ServerSupabaseClient = Awaited<ReturnType<typeof createClient>>;

export type SetHouseholdHeadInput = {
  churchId: string;
  householdId: string;
  memberId: string;
};

export type SetHouseholdHeadResult =
  | { ok: true }
  | { ok: false; error: string };

async function ensureHouseholdBelongsToChurch(
  supabase: ServerSupabaseClient,
  churchId: string,
  householdId: string
) {
  const { data, error } = await supabase
    .from("households")
    .select("id")
    .eq("church_id", churchId)
    .eq("id", householdId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return !!data;
}

export async function setHouseholdHead(
  supabase: ServerSupabaseClient,
  input: SetHouseholdHeadInput
): Promise<SetHouseholdHeadResult> {
  try {
    const validHousehold = await ensureHouseholdBelongsToChurch(supabase, input.churchId, input.householdId);
    if (!validHousehold) {
      return { ok: false, error: "Household does not belong to this church." };
    }

    const { data: member, error: memberError } = await supabase
      .from("members")
      .select("id, household_id")
      .eq("church_id", input.churchId)
      .eq("id", input.memberId)
      .maybeSingle();

    if (memberError) {
      return { ok: false, error: memberError.message };
    }

    if (!member) {
      return { ok: false, error: "Member not found." };
    }

    if (member.household_id !== input.householdId) {
      return { ok: false, error: "Member must belong to the household before becoming head." };
    }

    const { error: householdError } = await supabase
      .from("households")
      .update({
        head_of_household_id: input.memberId,
        updated_at: new Date().toISOString(),
      })
      .eq("church_id", input.churchId)
      .eq("id", input.householdId);

    if (householdError) {
      return { ok: false, error: householdError.message };
    }

    const { error: memberUpdateError } = await supabase
      .from("members")
      .update({
        household_role: "head",
        updated_at: new Date().toISOString(),
      })
      .eq("church_id", input.churchId)
      .eq("id", input.memberId);

    if (memberUpdateError) {
      return { ok: false, error: memberUpdateError.message };
    }

    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to update head of household.",
    };
  }
}
