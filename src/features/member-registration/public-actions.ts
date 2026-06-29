"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { publicRegistrationSchema } from "./schemas";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  normalizeLoginEmail,
  normalizeLoginPhone,
  verifyRegistrationAuthUser,
  type AccountSetupStatus,
  type RegistrationLoginIdentity,
} from "./account-linking";
import type { PublicRegistrationInput } from "./schemas";
import type { PublicRegistrationResult } from "./types";

const publicRegistrationFieldLabels: Record<string, string> = {
  firstName: "First name",
  lastName: "Last name",
  email: "Email",
  phone: "Phone",
  requestedMembershipType: "Membership type",
  previousChurch: "Previous church",
  city: "City",
  country: "Country",
  address: "Address",
  profession: "Profession",
  emergencyContactName: "Emergency contact name",
  emergencyContactPhone: "Emergency contact phone",
  notes: "Notes",
  loginIdentifierType: "Login method",
  loginEmail: "Login email",
  loginPhone: "Login mobile number",
  recoveryEmail: "Recovery email",
  privacyConsent: "Privacy consent",
};

function formatPublicRegistrationIssues(issues: z.ZodIssue[]) {
  const details = issues
    .slice(0, 5)
    .map((issue) => {
      const key = String(issue.path.at(-1) ?? "");
      const label = publicRegistrationFieldLabels[key] ?? "Registration information";
      return `${label}: ${issue.message === "Invalid input" ? "Invalid value." : issue.message}`;
    })
    .join("; ");

  return details ? `Please check the form. ${details}` : "Please check the form and try again.";
}

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

    let admin: AdminClient | null = null;
    if (accountSetupRequested) {
      try {
        admin = createAdminClient();
      } catch {
        return { ok: false, error: "Portal account details could not be verified." };
      }
    }

    const loginIdentity = accountSetupRequested && admin
      ? await resolveRegistrationLoginIdentity(parsed, admin)
      : null;

    const verifiedAccount = accountSetupRequested && loginIdentity
      ? await verifyRegistrationAuthUser({
          authUserId: parsed.authUserId ?? "",
          identity: loginIdentity,
        })
      : null;

    if (accountSetupRequested && !loginIdentity) {
      return { ok: false, error: "Portal account details could not be verified." };
    }

    if (verifiedAccount && !verifiedAccount.ok) {
      return { ok: false, error: verifiedAccount.error };
    }

    const churchId = admin ? await resolveChurchId(admin, parsed.churchSlug) : null;

    if (accountSetupRequested && (!verifiedAccount || !verifiedAccount.ok || !admin || !churchId)) {
      return { ok: false, error: "Portal account details could not be verified." };
    }

    if (accountSetupRequested && verifiedAccount?.ok && admin && churchId) {
      const existing = await findExistingAccountRegistration(admin, {
        churchId,
        authUserId: verifiedAccount.authUserId,
        identity: loginIdentity!,
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
          loginIdentifierType: existing.registration.login_identifier_type,
          loginEmail: existing.registration.login_email,
          loginPhone: existing.registration.login_phone,
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
          identity: {
            type: verifiedAccount.loginIdentifierType,
            email: verifiedAccount.loginEmail ?? "",
            phone: verifiedAccount.loginPhone ?? "",
            recoveryEmail: verifiedAccount.recoveryEmail,
          } as RegistrationLoginIdentity,
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
          loginIdentifierType: verifiedAccount.loginIdentifierType,
          loginEmail: verifiedAccount.loginEmail,
          loginPhone: verifiedAccount.loginPhone,
        };
      }

      return { ok: true, registrationId: result.registration_id };
    }

    return { ok: false, error: "Unexpected response from registration service." };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { ok: false, error: formatPublicRegistrationIssues(error.issues) };
    }
    return {
      ok: false,
      error: toPublicRegistrationError(error) || "Failed to submit registration.",
    };
  }
}

type AdminClient = ReturnType<typeof createAdminClient>;

async function resolveRegistrationLoginIdentity(
  parsed: PublicRegistrationInput,
  admin: AdminClient
): Promise<RegistrationLoginIdentity | null> {
  const submittedIdentity = resolveSubmittedRegistrationLoginIdentity(parsed);

  if (submittedIdentity || !parsed.authUserId) {
    return submittedIdentity;
  }

  const { data, error } = await admin.auth.admin.getUserById(parsed.authUserId);

  if (error || !data.user) {
    return null;
  }

  const email = normalizeLoginEmail(data.user.email ?? "");
  if (email) {
    return { type: "email", email };
  }

  const phone = normalizeLoginPhone(data.user.phone ?? "");
  if (phone) {
    return {
      type: "phone",
      phone,
      recoveryEmail: parsed.recoveryEmail ?? null,
    };
  }

  return null;
}

function resolveSubmittedRegistrationLoginIdentity(
  parsed: PublicRegistrationInput
): RegistrationLoginIdentity | null {
  const identityType = parsed.loginIdentifierType ?? (parsed.loginPhone ? "phone" : "email");

  if (identityType === "phone") {
    const phone = normalizeLoginPhone(parsed.loginPhone ?? "");
    if (!phone) return null;

    return {
      type: "phone",
      phone,
      recoveryEmail: parsed.recoveryEmail ?? null,
    };
  }

  const email = normalizeLoginEmail(parsed.loginEmail ?? parsed.email ?? "");
  return email ? { type: "email", email } : null;
}

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
  params: { churchId: string; authUserId: string; identity: RegistrationLoginIdentity }
): Promise<{
  registration?: {
    id: string;
    church_id: string;
    login_identifier_type: string | null;
    login_email: string | null;
    login_phone: string | null;
    recovery_email: string | null;
    account_setup_status: AccountSetupStatus;
  } | null;
  error?: string;
}> {
  const { data: authRegistration, error: authError } = await admin
    .from("church_member_registrations")
    .select("id, church_id, login_identifier_type, login_email, login_phone, recovery_email, account_setup_status")
    .eq("auth_user_id", params.authUserId)
    .maybeSingle();

  if (authError) {
    if (isMissingPhoneIdentityColumnError(authError)) {
      return findExistingAccountRegistrationLegacy(admin, params);
    }

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
        login_identifier_type: authRegistration.login_identifier_type,
        login_email: authRegistration.login_email,
        login_phone: authRegistration.login_phone,
        recovery_email: authRegistration.recovery_email,
        account_setup_status: authRegistration.account_setup_status as AccountSetupStatus,
      },
    };
  }

  const query = admin
    .from("church_member_registrations")
    .select("id, church_id, login_identifier_type, login_email, login_phone, recovery_email, account_setup_status")
    .eq("church_id", params.churchId)
    .in("account_setup_status", [
      "pending_email_confirmation",
      "pending_phone_verification",
      "pending_approval",
      "active",
    ]);

  const identityQuery =
    params.identity.type === "phone"
      ? query.eq("login_phone", params.identity.phone)
      : query.eq("login_email", params.identity.email);

  const { data: identityRegistration, error: identityError } = await identityQuery
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (identityError) {
    if (isMissingPhoneIdentityColumnError(identityError)) {
      return findExistingAccountRegistrationLegacy(admin, params);
    }

    return { error: "Portal account linkage could not be checked." };
  }

  return {
    registration: identityRegistration
      ? {
          id: identityRegistration.id,
          church_id: identityRegistration.church_id,
          login_identifier_type: identityRegistration.login_identifier_type,
          login_email: identityRegistration.login_email,
          login_phone: identityRegistration.login_phone,
          recovery_email: identityRegistration.recovery_email,
          account_setup_status: identityRegistration.account_setup_status as AccountSetupStatus,
        }
      : null,
  };
}

async function findExistingAccountRegistrationLegacy(
  admin: AdminClient,
  params: { churchId: string; authUserId: string; identity: RegistrationLoginIdentity }
): ReturnType<typeof findExistingAccountRegistration> {
  if (params.identity.type !== "email") {
    return {
      error:
        "Mobile portal account setup requires the latest registration database migration. Please contact the church office.",
    };
  }

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
        login_identifier_type: "email",
        login_email: authRegistration.login_email,
        login_phone: null,
        recovery_email: null,
        account_setup_status: authRegistration.account_setup_status as AccountSetupStatus,
      },
    };
  }

  const { data: identityRegistration, error: identityError } = await admin
    .from("church_member_registrations")
    .select("id, church_id, login_email, account_setup_status")
    .eq("church_id", params.churchId)
    .eq("login_email", params.identity.email)
    .in("account_setup_status", [
      "pending_email_confirmation",
      "pending_approval",
      "active",
    ])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (identityError) {
    return { error: "Portal account linkage could not be checked." };
  }

  return {
    registration: identityRegistration
      ? {
          id: identityRegistration.id,
          church_id: identityRegistration.church_id,
          login_identifier_type: "email",
          login_email: identityRegistration.login_email,
          login_phone: null,
          recovery_email: null,
          account_setup_status: identityRegistration.account_setup_status as AccountSetupStatus,
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
    identity: RegistrationLoginIdentity;
    accountSetupStatus: AccountSetupStatus;
  }
) {
  const { error } = await admin
    .from("church_member_registrations")
    .update({
      auth_user_id: params.authUserId,
      login_identifier_type: params.identity.type,
      login_email: params.identity.type === "email" ? params.identity.email : null,
      login_phone: params.identity.type === "phone" ? params.identity.phone : null,
      recovery_email: params.identity.type === "phone" ? params.identity.recoveryEmail ?? null : null,
      account_setup_requested: true,
      account_setup_status: params.accountSetupStatus,
      account_setup_verified_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", params.registrationId)
    .eq("church_id", params.churchId);

  if (error) {
    if (isMissingPhoneIdentityColumnError(error) && params.identity.type === "email") {
      const { error: legacyError } = await admin
        .from("church_member_registrations")
        .update({
          auth_user_id: params.authUserId,
          login_email: params.identity.email,
          account_setup_requested: true,
          account_setup_status: params.accountSetupStatus,
          account_setup_verified_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", params.registrationId)
        .eq("church_id", params.churchId);

      if (!legacyError) {
        return { ok: true as const };
      }
    }

    return {
      ok: false as const,
      error:
        "Registration was submitted, but the portal account could not be linked. Please contact the church office.",
    };
  }

  return { ok: true as const };
}

function isMissingPhoneIdentityColumnError(error: unknown) {
  const candidate = error as { code?: string; message?: string } | null;
  const message = candidate?.message ?? "";

  return (
    candidate?.code === "42703" &&
    (
      message.includes("login_identifier_type") ||
      message.includes("login_phone") ||
      message.includes("recovery_email")
    )
  );
}
