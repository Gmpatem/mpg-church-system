"use server";

import { createClient } from "@/lib/supabase/server";
import { publicRegistrationSchema } from "./schemas";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  normalizeLoginEmail,
  verifyRegistrationAuthUser,
  type AccountSetupStatus,
} from "./account-linking";
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

    const accountSetupRequested = parsed.accountSetupRequested === true;
    const verifiedAccount = accountSetupRequested
      ? await verifyRegistrationAuthUser({
          authUserId: parsed.authUserId ?? "",
          loginEmail: normalizeLoginEmail(parsed.loginEmail ?? parsed.email ?? ""),
        })
      : null;

    if (verifiedAccount && !verifiedAccount.ok) {
      return { ok: false, error: verifiedAccount.error };
    }

    let admin: AdminClient | null = null;
    if (accountSetupRequested) {
      try {
        admin = createAdminClient();
      } catch {
        return { ok: false, error: "Portal account details could not be verified." };
      }
    }

    const churchId = admin ? await resolveChurchId(admin, parsed.churchSlug) : null;

    if (accountSetupRequested && (!verifiedAccount || !verifiedAccount.ok || !admin || !churchId)) {
      return { ok: false, error: "Portal account details could not be verified." };
    }

    if (accountSetupRequested && verifiedAccount?.ok && admin && churchId) {
      const existing = await findExistingAccountRegistration(admin, {
        churchId,
        authUserId: verifiedAccount.authUserId,
        loginEmail: verifiedAccount.loginEmail,
      });

      if (existing.error) {
        return { ok: false, error: existing.error };
      }

      if (existing.registration) {
        return {
          ok: true,
          registrationId: existing.registration.id,
          accountSetupRequested: true,
          accountSetupStatus: existing.registration.account_setup_status,
          loginEmail: existing.registration.login_email,
        };
      }
    }

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

      if (accountSetupRequested && verifiedAccount?.ok && admin && churchId) {
        const linkStatus = await linkVerifiedAccountToRegistration(admin, {
          registrationId: result.registration_id,
          churchId,
          authUserId: verifiedAccount.authUserId,
          loginEmail: verifiedAccount.loginEmail,
          accountSetupStatus: verifiedAccount.pendingStatus,
        });

        if (!linkStatus.ok) {
          return { ok: false, error: linkStatus.error };
        }

        return {
          ok: true,
          registrationId: result.registration_id,
          accountSetupRequested: true,
          accountSetupStatus: verifiedAccount.pendingStatus,
          loginEmail: verifiedAccount.loginEmail,
        };
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

type AdminClient = ReturnType<typeof createAdminClient>;

async function resolveChurchId(admin: AdminClient, churchSlug: string) {
  const { data, error } = await admin
    .from("churches")
    .select("id")
    .eq("slug", churchSlug)
    .eq("is_active", true)
    .maybeSingle();

  if (error || !data?.id) {
    return null;
  }

  return data.id as string;
}

async function findExistingAccountRegistration(
  admin: AdminClient,
  params: { churchId: string; authUserId: string; loginEmail: string }
): Promise<{
  registration?: {
    id: string;
    church_id: string;
    login_email: string | null;
    account_setup_status: AccountSetupStatus;
  } | null;
  error?: string;
}> {
  const { data: authRegistration, error: authError } = await admin
    .from("church_member_registrations")
    .select("id, church_id, login_email, account_setup_status")
    .eq("auth_user_id", params.authUserId)
    .maybeSingle();

  if (authError) {
    return { error: "Portal account linkage could not be checked." };
  }

  if (authRegistration) {
    if (authRegistration.church_id !== params.churchId) {
      return { error: "This portal account is already linked to another registration." };
    }

    return {
      registration: {
        id: authRegistration.id,
        church_id: authRegistration.church_id,
        login_email: authRegistration.login_email,
        account_setup_status: authRegistration.account_setup_status as AccountSetupStatus,
      },
    };
  }

  const { data: emailRegistration, error: emailError } = await admin
    .from("church_member_registrations")
    .select("id, church_id, login_email, account_setup_status")
    .eq("church_id", params.churchId)
    .eq("login_email", params.loginEmail)
    .in("account_setup_status", [
      "pending_email_confirmation",
      "pending_approval",
      "active",
    ])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (emailError) {
    return { error: "Portal account linkage could not be checked." };
  }

  return {
    registration: emailRegistration
      ? {
          id: emailRegistration.id,
          church_id: emailRegistration.church_id,
          login_email: emailRegistration.login_email,
          account_setup_status: emailRegistration.account_setup_status as AccountSetupStatus,
        }
      : null,
  };
}

async function linkVerifiedAccountToRegistration(
  admin: AdminClient,
  params: {
    registrationId: string;
    churchId: string;
    authUserId: string;
    loginEmail: string;
    accountSetupStatus: AccountSetupStatus;
  }
) {
  const { error } = await admin
    .from("church_member_registrations")
    .update({
      auth_user_id: params.authUserId,
      login_email: params.loginEmail,
      account_setup_requested: true,
      account_setup_status: params.accountSetupStatus,
      account_setup_verified_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", params.registrationId)
    .eq("church_id", params.churchId);

  if (error) {
    return {
      ok: false as const,
      error:
        "Registration was submitted, but the portal account could not be linked. Please contact the church office.",
    };
  }

  return { ok: true as const };
}
