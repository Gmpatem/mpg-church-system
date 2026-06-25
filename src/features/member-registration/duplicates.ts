"use server";

import { createClient } from "@/lib/supabase/server";
import { requireChurchRole } from "@/features/access/queries";
import { CHURCH_MANAGEMENT_ROLE_CODES } from "@/lib/domain/church-access";
import type { RegistrationDuplicateState } from "./types";

type ServerSupabaseClient = Awaited<ReturnType<typeof createClient>>;

function normalizeEmail(email: string | null): string | null {
  if (!email) return null;
  const cleaned = email.toLowerCase().trim();
  return cleaned || null;
}

function normalizePhone(phone: string | null): string | null {
  if (!phone) return null;
  const cleaned = phone.replace(/\D/g, "");
  return cleaned || null;
}

export async function findDuplicateCandidates(
  supabase: ServerSupabaseClient,
  churchId: string,
  registration: {
    first_name: string;
    last_name: string;
    email: string | null;
    phone: string | null;
    date_of_birth: string | null;
    suggested_household_name: string | null;
    suggested_household_phone: string | null;
    suggested_household_email: string | null;
    suggested_household_head_name: string | null;
  }
): Promise<RegistrationDuplicateState> {
  const memberCandidates: RegistrationDuplicateState["memberCandidates"] = [];
  const normalizedEmail = normalizeEmail(registration.email);
  const normalizedPhone = normalizePhone(registration.phone);

  const orConditions: string[] = [];
  if (normalizedEmail) orConditions.push(`email.ilike.${normalizedEmail}`);
  if (normalizedPhone) orConditions.push(`phone.ilike.%${normalizedPhone}%`);
  if (registration.date_of_birth) {
    orConditions.push(
      `and(first_name.ilike.${registration.first_name},last_name.ilike.${registration.last_name},date_of_birth.eq.${registration.date_of_birth})`
    );
  }

  if (orConditions.length === 0) {
    return { memberCandidates, householdCandidates: [] };
  }

  const { data: members, error: memberError } = await supabase
    .from("members")
    .select("id, first_name, last_name, email, phone, date_of_birth")
    .eq("church_id", churchId)
    .or(orConditions.join(","));

  if (memberError) {
    throw new Error(memberError.message);
  }

  for (const member of members ?? []) {
    const reasons: string[] = [];
    if (normalizedEmail && normalizeEmail(member.email) === normalizedEmail) {
      reasons.push("matching email");
    }
    if (normalizedPhone && normalizePhone(member.phone) === normalizedPhone) {
      reasons.push("matching phone");
    }
    if (
      registration.first_name.toLowerCase() === member.first_name.toLowerCase() &&
      registration.last_name.toLowerCase() === member.last_name.toLowerCase() &&
      registration.date_of_birth &&
      member.date_of_birth === registration.date_of_birth
    ) {
      reasons.push("matching name and date of birth");
    }

    if (reasons.length > 0) {
      memberCandidates.push({
        memberId: member.id,
        firstName: member.first_name,
        lastName: member.last_name,
        email: member.email,
        phone: member.phone,
        reason: reasons.join(", "),
      });
    }
  }

  const householdCandidates = await findHouseholdCandidates(supabase, churchId, registration);

  return { memberCandidates, householdCandidates };
}

async function findHouseholdCandidates(
  supabase: ServerSupabaseClient,
  churchId: string,
  registration: {
    suggested_household_name: string | null;
    suggested_household_phone: string | null;
    suggested_household_email: string | null;
    suggested_household_head_name: string | null;
  }
): Promise<RegistrationDuplicateState["householdCandidates"]> {
  const householdName = registration.suggested_household_name;
  const householdPhone = normalizePhone(registration.suggested_household_phone);
  const householdEmail = normalizeEmail(registration.suggested_household_email);
  const headName = registration.suggested_household_head_name;

  if (!householdName && !householdPhone && !householdEmail && !headName) {
    return [];
  }

  const conditions: string[] = [];
  if (householdName) conditions.push(`household_name.ilike.%${householdName}%`);
  if (householdPhone) conditions.push(`phone.ilike.%${householdPhone}%`);
  if (householdEmail) conditions.push(`email.ilike.${householdEmail}`);

  if (conditions.length === 0) {
    return [];
  }

  const { data: households, error: householdError } = await supabase
    .from("households")
    .select("id, household_name, phone, email")
    .eq("church_id", churchId)
    .or(conditions.join(","));

  if (householdError) {
    throw new Error(householdError.message);
  }

  const result: RegistrationDuplicateState["householdCandidates"] = [];

  for (const household of households ?? []) {
    const reasons: string[] = [];
    if (
      householdName &&
      household.household_name?.toLowerCase().includes(householdName.toLowerCase())
    ) {
      reasons.push("matching household name");
    }
    if (householdPhone && normalizePhone(household.phone) === householdPhone) {
      reasons.push("matching phone");
    }
    if (householdEmail && normalizeEmail(household.email) === householdEmail) {
      reasons.push("matching email");
    }
    if (reasons.length > 0) {
      result.push({
        householdId: household.id,
        householdName: household.household_name,
        phone: household.phone,
        email: household.email,
        reason: reasons.join(", "),
      });
    }
  }

  return result;
}

export async function getRegistrationDuplicateCandidates(
  churchSlug: string,
  registrationId: string
): Promise<RegistrationDuplicateState> {
  const ctx = await requireChurchRole(churchSlug, CHURCH_MANAGEMENT_ROLE_CODES);
  const supabase = await createClient();

  const { data: registration, error: regError } = await supabase
    .from("church_member_registrations")
    .select(
      "first_name, last_name, email, phone, date_of_birth, suggested_household_name, suggested_household_phone, suggested_household_email, suggested_household_head_name"
    )
    .eq("id", registrationId)
    .eq("church_id", ctx.churchId)
    .maybeSingle();

  if (regError) {
    throw new Error(regError.message);
  }

  if (!registration) {
    return { memberCandidates: [], householdCandidates: [] };
  }

  return findDuplicateCandidates(supabase, ctx.churchId, registration);
}
