"use server";

import { createClient } from "@/lib/supabase/server";
import { publicRegistrationSchema } from "./schemas";
import type { PublicRegistrationResult } from "./types";

function toPublicRegistrationError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error ?? "");

  if (
    message.includes("invalid input syntax for type date") ||
    message.includes("date/time field value out of range") ||
    message.includes("must be a valid calendar date") ||
    message.includes("must use YYYY-MM-DD format")
  ) {
    return "Please check the date fields and enter valid dates.";
  }

  if (
    message.includes("violates check constraint") ||
    message.includes("invalid input syntax for type uuid")
  ) {
    return "Please check the form and try again.";
  }

  return message || "Submission failed.";
}

export async function submitPublicRegistrationAction(
  _prevState: PublicRegistrationResult | null,
  formData: FormData
): Promise<PublicRegistrationResult> {
  try {
    const raw = Object.fromEntries(formData.entries());

    // Reconstruct array fields from FormData
    const departmentInterestIds: string[] = [];
    const householdMembersMap: Record<number, Record<string, string>> = {};

    for (const [key, value] of formData.entries()) {
      if (key.startsWith("departmentInterestIds[")) {
        departmentInterestIds.push(String(value));
      } else if (key.startsWith("householdMembers[")) {
        const match = key.match(/^householdMembers\[(\d+)\]\.(\w+)$/);
        if (match) {
          const index = parseInt(match[1], 10);
          const field = match[2];
          householdMembersMap[index] = householdMembersMap[index] || {};
          householdMembersMap[index][field] = String(value);
        }
      }
    }

    const householdMembers = Object.values(householdMembersMap);

    const parsed = publicRegistrationSchema.parse({
      ...raw,
      isBaptized: raw.isBaptized === "true",
      wantsMembership: raw.wantsMembership === "true",
      privacyConsent: raw.privacyConsent === "true",
      departmentInterestIds,
      householdMembers: householdMembers.filter(Boolean),
    });

    const payload = {
      firstName: parsed.firstName,
      lastName: parsed.lastName,
      displayName: parsed.displayName,
      email: parsed.email,
      phone: parsed.phone,
      dateOfBirth: parsed.dateOfBirth,
      gender: parsed.gender,
      maritalStatus: parsed.maritalStatus,
      profession: parsed.profession,
      address: parsed.address,
      city: parsed.city,
      country: parsed.country,
      preferredContactMethod: parsed.preferredContactMethod,
      emergencyContactName: parsed.emergencyContactName,
      emergencyContactPhone: parsed.emergencyContactPhone,
      howHeardAboutChurch: parsed.howHeardAboutChurch,
      christianStatus: parsed.christianStatus,
      isBaptized: parsed.isBaptized,
      baptismDate: parsed.baptismDate,
      previousChurch: parsed.previousChurch,
      wantsMembership: parsed.wantsMembership,
      requestedMembershipType: parsed.requestedMembershipType,
      transferInDate: parsed.transferInDate,
      householdAction: parsed.householdAction,
      suggestedHouseholdName: parsed.suggestedHouseholdName,
      suggestedHouseholdHeadName: parsed.suggestedHouseholdHeadName,
      suggestedHouseholdHeadPhone: parsed.suggestedHouseholdHeadPhone,
      suggestedHouseholdRole: parsed.suggestedHouseholdRole,
      suggestedHouseholdAddress: parsed.suggestedHouseholdAddress,
      suggestedHouseholdCity: parsed.suggestedHouseholdCity,
      suggestedHouseholdCountry: parsed.suggestedHouseholdCountry,
      suggestedHouseholdPhone: parsed.suggestedHouseholdPhone,
      suggestedHouseholdEmail: parsed.suggestedHouseholdEmail,
      householdNotes: parsed.householdNotes,
      departmentInterestIds: parsed.departmentInterestIds,
      notes: parsed.notes,
      privacyConsent: parsed.privacyConsent,
      householdMembers: parsed.householdMembers.map(m => ({
        firstName: m.firstName,
        lastName: m.lastName,
        relationship: m.relationship,
        dateOfBirth: m.dateOfBirth,
        gender: m.gender,
        email: m.email,
        phone: m.phone,
        membershipStatusSuggestion: m.membershipStatusSuggestion,
      })),
    };

    const supabase = await createClient();
    const { data, error } = await supabase.rpc("submit_member_registration", {
      p_church_slug: parsed.churchSlug,
      p_key: parsed.key,
      p_payload: payload,
    });

    if (error) {
      return { ok: false, error: toPublicRegistrationError(error) };
    }

    if (data && typeof data === "object" && "ok" in data) {
      const result = data as { ok: boolean; error?: string; registration_id?: string };
      if (!result.ok) {
        return { ok: false, error: toPublicRegistrationError(result.error) };
      }
      if (!result.registration_id) {
        return { ok: false, error: "Submission did not return a registration ID." };
      }
      return { ok: true, registrationId: result.registration_id };
    }

    return { ok: false, error: "Unexpected response from registration service." };
  } catch (error) {
    if (error && typeof error === "object" && "errors" in error) {
      const zodError = error as { errors?: { message: string }[] };
      return { ok: false, error: zodError.errors?.[0]?.message || "Validation failed." };
    }
    return {
      ok: false,
      error: toPublicRegistrationError(error) || "Failed to submit registration.",
    };
  }
}
