"use server";

import { z } from "zod";
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
  | {
      ok: false;
      error: string;
      code?: "VALIDATION_ERROR" | "CONVERSION_ERROR";
      fieldErrors?: Record<string, string[]>;
    };

const memberFieldLabels: Record<string, string> = {
  firstName: "First name",
  lastName: "Last name",
  displayName: "Display name",
  email: "Email",
  phone: "Phone",
  gender: "Gender",
  membershipStatus: "Membership status",
  membershipType: "Membership type",
  memberCode: "Member code",
  householdId: "Household",
  householdRole: "Household role",
  dateJoined: "Date joined",
  dateOfBirth: "Date of birth",
  baptismDate: "Baptism date",
  transferInDate: "Transfer-in date",
  transferOutDate: "Transfer-out date",
  previousChurch: "Previous church",
  city: "City",
  country: "Country",
  address: "Address",
  profession: "Profession",
  maritalStatus: "Marital status",
  emergencyContactName: "Emergency contact name",
  emergencyContactPhone: "Emergency contact phone",
  notes: "Notes",
  departmentId: "Department",
};

function optionalText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function requiredText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function optionalStatus(value: unknown) {
  const normalized = optionalText(value);
  return normalized || "active";
}

function validationMessageForIssue(issue: z.ZodIssue) {
  const key = String(issue.path.at(-1) ?? "");

  if (key === "email") {
    return "Enter a valid email address or leave it blank.";
  }

  if (key === "membershipType") {
    return "Select a supported membership type or leave it blank.";
  }

  if (issue.message === "Invalid input") {
    return "Invalid value.";
  }

  return issue.message;
}

function formatMemberValidationIssues(issues: z.ZodIssue[]) {
  const details = issues
    .slice(0, 5)
    .map((issue) => {
      const key = String(issue.path.at(-1) ?? "");
      const label = memberFieldLabels[key] ?? "Member information";
      return `${label}: ${validationMessageForIssue(issue)}`;
    })
    .join("; ");

  return details
    ? `Some registration fields could not be processed. ${details}`
    : "Some registration fields could not be processed. Review the applicant information and try again.";
}

function getFieldErrors(issues: z.ZodIssue[]) {
  return issues.reduce<Record<string, string[]>>((acc, issue) => {
    const key = String(issue.path.at(-1) ?? "_form");
    acc[key] = acc[key] ?? [];
    acc[key].push(validationMessageForIssue(issue));
    return acc;
  }, {});
}

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
    const normalizedMemberInput = {
      churchId: input.churchId,
      firstName: requiredText(input.firstName),
      lastName: requiredText(input.lastName),
      displayName: optionalText(input.displayName),
      email: optionalText(input.email),
      phone: optionalText(input.phone),
      gender: optionalText(input.gender),
      membershipStatus: optionalStatus(input.membershipStatus),
      membershipType: optionalText(input.membershipType),
      memberCode: optionalText(input.memberCode),
      householdId: optionalText(input.householdId),
      householdRole: optionalText(input.householdRole),
      dateJoined: input.dateJoined,
      dateOfBirth: input.dateOfBirth,
      baptismDate: input.baptismDate,
      transferInDate: input.transferInDate,
      transferOutDate: input.transferOutDate,
      previousChurch: optionalText(input.previousChurch),
      city: optionalText(input.city),
      country: optionalText(input.country),
      address: optionalText(input.address),
      profession: optionalText(input.profession),
      maritalStatus: optionalText(input.maritalStatus),
      emergencyContactName: optionalText(input.emergencyContactName),
      emergencyContactPhone: optionalText(input.emergencyContactPhone),
      notes: optionalText(input.notes),
      departmentId: optionalText(input.departmentId),
    };

    const parsed = parseCreateMemberInput(normalizedMemberInput);

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
    if (error instanceof z.ZodError) {
      return {
        ok: false,
        code: "VALIDATION_ERROR",
        error: formatMemberValidationIssues(error.issues),
        fieldErrors: getFieldErrors(error.issues),
      };
    }

    return {
      ok: false,
      code: "CONVERSION_ERROR",
      error: error instanceof Error ? error.message : "Failed to create member.",
    };
  }
}
