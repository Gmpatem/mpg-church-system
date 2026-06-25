"use server";

import { createClient } from "@/lib/supabase/server";

type ServerSupabaseClient = Awaited<ReturnType<typeof createClient>>;

export type LinkMemberToHouseholdInput = {
  churchId: string;
  householdId: string;
  memberId: string;
  householdRole?: string | null;
};

export type LinkMemberToHouseholdResult =
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

async function ensureMemberBelongsToChurch(
  supabase: ServerSupabaseClient,
  churchId: string,
  memberId: string
) {
  const { data, error } = await supabase
    .from("members")
    .select("id")
    .eq("church_id", churchId)
    .eq("id", memberId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return !!data;
}

export async function linkMemberToHousehold(
  supabase: ServerSupabaseClient,
  input: LinkMemberToHouseholdInput
): Promise<LinkMemberToHouseholdResult> {
  try {
    const validHousehold = await ensureHouseholdBelongsToChurch(supabase, input.churchId, input.householdId);
    if (!validHousehold) {
      return { ok: false, error: "Household does not belong to this church." };
    }

    const validMember = await ensureMemberBelongsToChurch(supabase, input.churchId, input.memberId);
    if (!validMember) {
      return { ok: false, error: "Member does not belong to this church." };
    }

    const { error } = await supabase
      .from("members")
      .update({
        household_id: input.householdId,
        household_role: input.householdRole || null,
        updated_at: new Date().toISOString(),
      })
      .eq("church_id", input.churchId)
      .eq("id", input.memberId);

    if (error) {
      return { ok: false, error: error.message };
    }

    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to assign member to household.",
    };
  }
}
