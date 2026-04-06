import "server-only";

import { createClient } from "@/lib/supabase/server";
import { requireChurchAccess } from "@/features/access/queries";

export async function getChurchHouseholds(churchSlug: string) {
  const ctx = await requireChurchAccess(churchSlug);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("households")
    .select(`
      id,
      church_id,
      household_name,
      address,
      city,
      country,
      phone,
      email,
      notes,
      head_of_household_id,
      created_at
    `)
    .eq("church_id", ctx.churchId)
    .order("household_name", { ascending: true });

  if (error) throw new Error(error.message);

  const households = data ?? [];

  const headIds = households
    .map((household) => household.head_of_household_id)
    .filter(Boolean);

  let headMap = new Map<string, string>();
  if (headIds.length > 0) {
    const { data: heads, error: headsError } = await supabase
      .from("members")
      .select("id, first_name, last_name, display_name")
      .in("id", headIds);

    if (headsError) throw new Error(headsError.message);

    headMap = new Map(
      (heads ?? []).map((member) => [
        member.id,
        member.display_name || [member.first_name, member.last_name].filter(Boolean).join(" "),
      ])
    );
  }

  // Optimized member counting: fetch only household_id for members in our households
  // This reduces data transfer from O(all members) to O(households with members)
  const householdIds = households.map((h) => h.id);
  let countMap = new Map<string, number>();

  if (householdIds.length > 0) {
    const { data: memberCounts, error: countError } = await supabase
      .from("members")
      .select("household_id")
      .eq("church_id", ctx.churchId)
      .in("household_id", householdIds);

    if (countError) throw new Error(countError.message);

    for (const row of memberCounts ?? []) {
      const hid = row.household_id as string | null;
      if (!hid) continue;
      countMap.set(hid, (countMap.get(hid) ?? 0) + 1);
    }
  }

  return households.map((household) => ({
    ...household,
    head_of_household_name: household.head_of_household_id
      ? headMap.get(household.head_of_household_id) ?? null
      : null,
    member_count: countMap.get(household.id) ?? 0,
  }));
}

export async function getChurchHouseholdById(churchSlug: string, householdId: string) {
  const ctx = await requireChurchAccess(churchSlug);
  const supabase = await createClient();

  const { data: household, error: householdError } = await supabase
    .from("households")
    .select(`
      id,
      church_id,
      household_name,
      address,
      city,
      country,
      phone,
      email,
      notes,
      head_of_household_id,
      created_at
    `)
    .eq("church_id", ctx.churchId)
    .eq("id", householdId)
    .maybeSingle();

  if (householdError) throw new Error(householdError.message);
  if (!household) return null;

  const { data: members, error: membersError } = await supabase
    .from("members")
    .select(`
      id,
      first_name,
      last_name,
      display_name,
      phone,
      email,
      membership_status,
      household_role
    `)
    .eq("church_id", ctx.churchId)
    .eq("household_id", householdId)
    .order("last_name", { ascending: true })
    .order("first_name", { ascending: true });

  if (membersError) throw new Error(membersError.message);

  let headName: string | null = null;
  if (household.head_of_household_id) {
    const head = (members ?? []).find((member) => member.id === household.head_of_household_id);
    headName = head
      ? head.display_name || [head.first_name, head.last_name].filter(Boolean).join(" ")
      : null;
  }

  return {
    household: {
      ...household,
      head_of_household_name: headName,
      member_count: (members ?? []).length,
    },
    members: members ?? [],
  };
}

export async function getChurchMembersForHouseholdAssignment(churchSlug: string) {
  const ctx = await requireChurchAccess(churchSlug);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("members")
    .select("id, first_name, last_name, display_name, household_id, household_role, membership_status")
    .eq("church_id", ctx.churchId)
    .order("last_name", { ascending: true })
    .order("first_name", { ascending: true });

  if (error) throw new Error(error.message);

  return data ?? [];
}
