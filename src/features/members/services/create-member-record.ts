"use server";

import { createClient } from "@/lib/supabase/server";
import { parseCreateMemberInput } from "../validators";

type ServerSupabaseClient = Awaited<ReturnType<typeof createClient>>;

export type CreateMemberRecordInput = {
  churchId: string;
  churchSlug: string;
  actorUserId: string;
  firstName: string;
  lastName: string;
  displayName?: string | null;
  email?: string | null;
  phone?: string | null;
  gender?: string | null;
  membershipStatus?: string;
  membershipType?: string | null;
  memberCode?: string | null;
  householdId?: string | null;
  householdRole?: string | null;
  dateJoined?: string | null;
  dateOfBirth?: string | null;
  baptismDate?: string | null;
  transferInDate?: string | null;
  transferOutDate?: string | null;
  previousChurch?: string | null;
  city?: string | null;
  country?: string | null;
  address?: string | null;
  profession?: string | null;
  maritalStatus?: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  notes?: string | null;
  departmentId?: string | null;
};

export type CreateMemberRecordResult =
  | { ok: true; memberId: string; departmentId?: string | null }
  | { ok: false; error: string };

function buildMemberCode(churchSlug: string) {
  const prefix = churchSlug.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 6) || "CHURCH";
  const suffix = Date.now().toString().slice(-6);
  return prefix + "-" + suffix;
}

async function ensureUniqueMemberCode(
  supabase: ServerSupabaseClient,
  memberCode: string,
  excludeMemberId?: string
) {
  let query = supabase.from("members").select("id").eq("member_code", memberCode).limit(1);

  if (excludeMemberId) {
    query = query.neq("id", excludeMemberId);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return !(data && data.length > 0);
}

async function ensureHouseholdBelongsToChurch(
  supabase: ServerSupabaseClient,
  churchId: string,
  householdId: string | null
) {
  if (!householdId) return true;

  const { data, error } = await supabase
    .from("households")
    .select("id")
    .eq("church_id", churchId)
    .eq("id", householdId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return !!data;
}

async function ensureDepartmentBelongsToChurch(
  supabase: ServerSupabaseClient,
  churchId: string,
  departmentId: string | null
) {
  if (!departmentId) return null;

  const { data, error } = await supabase
    .from("church_departments")
    .select("id, department_name")
    .eq("church_id", churchId)
    .eq("id", departmentId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ?? null;
}

export async function createMemberRecord(
  supabase: ServerSupabaseClient,
  input: CreateMemberRecordInput
): Promise<CreateMemberRecordResult> {
  try {
    const parsed = parseCreateMemberInput({
      churchId: input.churchId,
      firstName: input.firstName,
      lastName: input.lastName,
      displayName: input.displayName,
      email: input.email,
      phone: input.phone,
      gender: input.gender,
      membershipStatus: input.membershipStatus || "active",
      membershipType: input.membershipType,
      memberCode: input.memberCode,
      householdId: input.householdId,
      householdRole: input.householdRole,
      dateJoined: input.dateJoined,
      dateOfBirth: input.dateOfBirth,
      baptismDate: input.baptismDate,
      transferInDate: input.transferInDate,
      transferOutDate: input.transferOutDate,
      previousChurch: input.previousChurch,
      city: input.city,
      country: input.country,
      address: input.address,
      profession: input.profession,
      maritalStatus: input.maritalStatus,
      emergencyContactName: input.emergencyContactName,
      emergencyContactPhone: input.emergencyContactPhone,
      notes: input.notes,
      departmentId: input.departmentId,
    });

    const memberCode = parsed.memberCode || buildMemberCode(input.churchSlug);

    const unique = await ensureUniqueMemberCode(supabase, memberCode);
    if (!unique) {
      return { ok: false, error: "Member code is already in use." };
    }

    const validHousehold = await ensureHouseholdBelongsToChurch(
      supabase,
      input.churchId,
      parsed.householdId ?? null
    );
    if (!validHousehold) {
      return { ok: false, error: "Selected household does not belong to this church." };
    }

    const selectedDepartment = await ensureDepartmentBelongsToChurch(
      supabase,
      input.churchId,
      parsed.departmentId ?? null
    );
    if (parsed.departmentId && !selectedDepartment) {
      return { ok: false, error: "Selected department does not belong to this church." };
    }

    const displayName =
      parsed.displayName || [parsed.firstName, parsed.lastName].filter(Boolean).join(" ");

    const { data: createdMember, error } = await supabase
      .from("members")
      .insert({
        church_id: input.churchId,
        first_name: parsed.firstName,
        last_name: parsed.lastName,
        display_name: displayName,
        email: parsed.email,
        phone: parsed.phone,
        gender: parsed.gender,
        membership_status: parsed.membershipStatus,
        membership_type: parsed.membershipType,
        member_code: memberCode,
        household_id: parsed.householdId,
        household_role: parsed.householdRole,
        date_joined: parsed.dateJoined,
        date_of_birth: parsed.dateOfBirth,
        baptism_date: parsed.baptismDate,
        transfer_in_date: parsed.transferInDate,
        transfer_out_date: parsed.transferOutDate,
        previous_church: parsed.previousChurch,
        city: parsed.city,
        country: parsed.country,
        address: parsed.address,
        profession: parsed.profession,
        marital_status: parsed.maritalStatus,
        emergency_contact_name: parsed.emergencyContactName,
        emergency_contact_phone: parsed.emergencyContactPhone,
        notes: parsed.notes,
        created_by_user_id: input.actorUserId,
      })
      .select("id")
      .single();

    if (error) {
      return { ok: false, error: error.message };
    }

    if (
      createdMember?.id &&
      selectedDepartment &&
      selectedDepartment.id &&
      selectedDepartment.department_name
    ) {
      const { error: deptError } = await supabase.from("member_departments").insert({
        member_id: createdMember.id,
        church_id: input.churchId,
        department_id: selectedDepartment.id,
        department_name: selectedDepartment.department_name,
        joined_date: parsed.dateJoined,
        is_active: true,
      });

      if (deptError) {
        return { ok: false, error: deptError.message };
      }

      return { ok: true, memberId: createdMember.id, departmentId: selectedDepartment.id };
    }

    return { ok: true, memberId: createdMember.id };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to create member.",
    };
  }
}
