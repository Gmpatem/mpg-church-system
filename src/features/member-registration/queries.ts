"use server";

import { createClient } from "@/lib/supabase/server";
import { requireChurchRole } from "@/features/access/queries";
import { CHURCH_MANAGEMENT_ROLE_CODES } from "@/lib/domain/church-access";
import type { ChurchMemberRegistration, ChurchMemberRegistrationHouseholdMember, RegistrationDuplicateState } from "./types";

export type OnboardingFilters = {
  onboardingStatus?: string;
  q?: string;
  page?: number;
  pageSize?: number;
};

export type OnboardingListResult = {
  registrations: (ChurchMemberRegistration & { family_count: number })[];
  total: number;
  page: number;
  pageSize: number;
};

export async function getOnboardingRegistrations(
  churchSlug: string,
  filters: OnboardingFilters = {}
): Promise<OnboardingListResult> {
  const ctx = await requireChurchRole(churchSlug, CHURCH_MANAGEMENT_ROLE_CODES);
  const supabase = await createClient();

  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(100, Math.max(10, filters.pageSize ?? 25));

  let query = supabase
    .from("church_member_registrations")
    .select(
      "*, church_member_registration_household_members(count)",
      { count: "exact" }
    )
    .eq("church_id", ctx.churchId)
    .order("submitted_at", { ascending: false });

  if (filters.onboardingStatus && filters.onboardingStatus !== "all") {
    query = query.eq("status", filters.onboardingStatus);
  }

  if (filters.q) {
    const term = `%${filters.q}%`;
    query = query.or(
      `first_name.ilike.${term},last_name.ilike.${term},email.ilike.${term},phone.ilike.${term}`
    );
  }

  const { data, error, count } = await query.range((page - 1) * pageSize, page * pageSize - 1);

  if (error) {
    throw new Error(error.message);
  }

  const registrations = (data ?? []).map((row) => ({
    ...row,
    family_count: (row as unknown as { count?: number })?.count ?? 0,
  }));

  return {
    registrations,
    total: count ?? 0,
    page,
    pageSize,
  };
}

export async function getRegistrationById(
  churchSlug: string,
  registrationId: string
): Promise<{ registration: ChurchMemberRegistration; family_members: ChurchMemberRegistrationHouseholdMember[] } | null> {
  const ctx = await requireChurchRole(churchSlug, CHURCH_MANAGEMENT_ROLE_CODES);
  const supabase = await createClient();

  const { data: registration, error: regError } = await supabase
    .from("church_member_registrations")
    .select("*")
    .eq("id", registrationId)
    .eq("church_id", ctx.churchId)
    .maybeSingle();

  if (regError) {
    throw new Error(regError.message);
  }

  if (!registration) {
    return null;
  }

  const { data: family_members, error: famError } = await supabase
    .from("church_member_registration_household_members")
    .select("*")
    .eq("registration_id", registrationId)
    .eq("church_id", ctx.churchId)
    .order("created_at", { ascending: true });

  if (famError) {
    throw new Error(famError.message);
  }

  return {
    registration,
    family_members: family_members ?? [],
  };
}

export async function getRegistrationSettings(churchSlug: string) {
  const ctx = await requireChurchRole(churchSlug, CHURCH_MANAGEMENT_ROLE_CODES);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("church_member_registration_settings")
    .select("*")
    .eq("church_id", ctx.churchId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function getRegistrationDuplicateCandidates(
  churchSlug: string,
  registrationId: string
): Promise<RegistrationDuplicateState> {
  const ctx = await requireChurchRole(churchSlug, CHURCH_MANAGEMENT_ROLE_CODES);
  const supabase = await createClient();

  const { data: registration, error: regError } = await supabase
    .from("church_member_registrations")
    .select("email, phone, first_name, last_name, date_of_birth, suggested_household_name, suggested_household_phone, suggested_household_email, suggested_household_head_name")
    .eq("id", registrationId)
    .eq("church_id", ctx.churchId)
    .maybeSingle();

  if (regError) {
    throw new Error(regError.message);
  }

  if (!registration) {
    return { memberCandidates: [], householdCandidates: [] };
  }

  const memberCandidates: RegistrationDuplicateState["memberCandidates"] = [];
  const normalizedEmail = registration.email ? registration.email.toLowerCase().trim() : null;
  const normalizedPhone = registration.phone
    ? registration.phone.replace(/\D/g, "")
    : null;

  const { data: members } = await supabase
    .from("members")
    .select("id, first_name, last_name, email, phone, date_of_birth")
    .eq("church_id", ctx.churchId)
    .or(
      [
        normalizedEmail ? `email.ilike.${normalizedEmail}` : null,
        normalizedPhone ? `phone.ilike.%${normalizedPhone}%` : null,
        registration.date_of_birth
          ? `and(first_name.ilike.${registration.first_name},last_name.ilike.${registration.last_name},date_of_birth.eq.${registration.date_of_birth})`
          : null,
      ]
        .filter(Boolean)
        .join(",")
    );

  for (const member of members ?? []) {
    const reasons: string[] = [];
    if (normalizedEmail && member.email && member.email.toLowerCase().trim() === normalizedEmail) {
      reasons.push("matching email");
    }
    if (normalizedPhone && member.phone && member.phone.replace(/\D/g, "") === normalizedPhone) {
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

  const householdCandidates: RegistrationDuplicateState["householdCandidates"] = [];
  const householdName = registration.suggested_household_name;
  const householdPhone = registration.suggested_household_phone
    ? registration.suggested_household_phone.replace(/\D/g, "")
    : null;
  const householdEmail = registration.suggested_household_email
    ? registration.suggested_household_email.toLowerCase().trim()
    : null;
  const headName = registration.suggested_household_head_name;

  if (householdName || householdPhone || householdEmail || headName) {
    let hhQuery = supabase.from("households").select("id, household_name, phone, email").eq("church_id", ctx.churchId);

    const conditions: string[] = [];
    if (householdName) conditions.push(`household_name.ilike.%${householdName}%`);
    if (householdPhone) conditions.push(`phone.ilike.%${householdPhone}%`);
    if (householdEmail) conditions.push(`email.ilike.${householdEmail}`);

    if (conditions.length > 0) {
      hhQuery = hhQuery.or(conditions.join(","));
      const { data: households } = await hhQuery;

      for (const household of households ?? []) {
        const reasons: string[] = [];
        if (householdName && household.household_name?.toLowerCase().includes(householdName.toLowerCase())) {
          reasons.push("matching household name");
        }
        if (householdPhone && household.phone?.replace(/\D/g, "") === householdPhone) {
          reasons.push("matching phone");
        }
        if (householdEmail && household.email?.toLowerCase().trim() === householdEmail) {
          reasons.push("matching email");
        }
        if (reasons.length > 0) {
          householdCandidates.push({
            householdId: household.id,
            householdName: household.household_name,
            phone: household.phone,
            email: household.email,
            reason: reasons.join(", "),
          });
        }
      }
    }
  }

  return { memberCandidates, householdCandidates };
}
