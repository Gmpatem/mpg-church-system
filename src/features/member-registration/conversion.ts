"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireChurchRole } from "@/features/access/queries";
import { CHURCH_MANAGEMENT_ROLE_CODES } from "@/lib/domain/church-access";
import { createMemberRecord } from "@/features/members/services/create-member-record";
import { createHouseholdRecord } from "@/features/households/services/create-household-record";
import { linkMemberToHousehold } from "@/features/households/services/link-member-household";
import { setHouseholdHead } from "@/features/households/services/set-household-head";
import { registrationReviewDecisionSchema } from "./schemas";
import {
  normalizeLoginEmail,
  verifyRegistrationAuthUser,
  type AccountSetupStatus,
} from "./account-linking";
import { getString } from "@/lib/domain/validation";
import type { ChurchMemberRegistration, ConversionResult } from "./types";

type RegistrationAccountRow = ChurchMemberRegistration & {
  auth_user_id?: string | null;
  login_email?: string | null;
  account_setup_requested?: boolean | null;
  account_setup_status?: AccountSetupStatus | null;
};

const approvalFieldLabels: Record<string, string> = {
  registrationId: "Registration",
  churchSlug: "Church",
  memberResolution: "Member resolution",
  memberId: "Member",
  membershipStatus: "Membership status",
  householdResolution: "Household resolution",
  householdId: "Household",
  newHouseholdName: "New household name",
  householdRole: "Household role",
  setAsHead: "Set as household head",
  registrationHouseholdMemberId: "Family member",
  resolution: "Family resolution",
  approvedDepartmentIds: "Departments",
  reviewNote: "Review note",
  email: "Email",
  phone: "Phone",
  membershipType: "Membership type",
  previousChurch: "Previous church",
  city: "City",
  country: "Country",
  address: "Address",
  profession: "Profession",
  emergencyContactName: "Emergency contact name",
  emergencyContactPhone: "Emergency contact phone",
  notes: "Notes",
};

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

function formatValidationIssues(issues: z.ZodIssue[]) {
  const details = issues
    .slice(0, 5)
    .map((issue) => {
      const key = String(issue.path.at(-1) ?? "");
      const label = approvalFieldLabels[key] ?? "Registration information";
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

function validationFailure(
  issues: z.ZodIssue[],
  registrationId?: string
): ConversionResult {
  const fieldErrors = getFieldErrors(issues);

  console.warn("Registration approval validation failed", {
    registrationId,
    fieldErrors,
  });

  return {
    ok: false,
    code: "VALIDATION_ERROR",
    error: formatValidationIssues(issues),
    fieldErrors,
  };
}

function accountLinkFailure(error: string): ConversionResult {
  return {
    ok: false,
    code: "AUTH_LINK_ERROR",
    error,
  };
}

function conversionFailure(error: string): ConversionResult {
  return {
    ok: false,
    code: "CONVERSION_ERROR",
    error,
  };
}

async function markRegistrationAccountStatus(
  registration: RegistrationAccountRow,
  status: AccountSetupStatus
) {
  const admin = createAdminClient();
  await admin
    .from("church_member_registrations")
    .update({
      account_setup_status: status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", registration.id)
    .eq("church_id", registration.church_id);
}

async function ensureChurchUserActive(params: {
  churchId: string;
  authUserId: string;
}) {
  const admin = createAdminClient();

  const { data: existing, error: lookupError } = await admin
    .from("church_users")
    .select("id")
    .eq("church_id", params.churchId)
    .eq("user_id", params.authUserId)
    .maybeSingle();

  if (lookupError) {
    throw new Error(lookupError.message);
  }

  if (existing) {
    const { error } = await admin
      .from("church_users")
      .update({
        status: "active",
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id);

    if (error) throw new Error(error.message);
    return;
  }

  const { error } = await admin.from("church_users").insert({
    church_id: params.churchId,
    user_id: params.authUserId,
    status: "active",
    is_primary: false,
  });

  if (error) throw new Error(error.message);
}

async function activateVerifiedPortalAccount(params: {
  registration: RegistrationAccountRow;
  churchId: string;
  primaryMemberId: string;
}) {
  const accountRequested = Boolean(
    params.registration.account_setup_requested ||
      params.registration.auth_user_id ||
      params.registration.login_email
  );

  if (!accountRequested) {
    return { ok: true as const, accountLinked: false as const, emailConfirmed: false };
  }

  const authUserId = params.registration.auth_user_id;
  if (!authUserId) {
    await markRegistrationAccountStatus(params.registration, "link_failed");
    return {
      ok: false as const,
      error: "Portal account setup is incomplete. Ask the applicant to finish account setup before approval.",
    };
  }

  const loginEmail = normalizeLoginEmail(
    params.registration.login_email ?? params.registration.email ?? ""
  );

  if (!loginEmail) {
    await markRegistrationAccountStatus(params.registration, "link_failed");
    return {
      ok: false as const,
      error: "Portal account setup is missing a valid login email.",
    };
  }

  const setupStatus = params.registration.account_setup_status ?? "not_requested";
  if (!["pending_email_confirmation", "pending_approval", "active"].includes(setupStatus)) {
    await markRegistrationAccountStatus(params.registration, "link_failed");
    return {
      ok: false as const,
      error: "Portal account setup is not ready for approval.",
    };
  }

  const verified = await verifyRegistrationAuthUser({ authUserId, loginEmail });

  if (!verified.ok) {
    await markRegistrationAccountStatus(params.registration, "link_failed");
    return { ok: false as const, error: verified.error };
  }

  const admin = createAdminClient();
  const { data: existingMember, error: existingMemberError } = await admin
    .from("members")
    .select("id")
    .eq("church_id", params.churchId)
    .eq("profile_id", verified.authUserId)
    .neq("id", params.primaryMemberId)
    .maybeSingle();

  if (existingMemberError) {
    await markRegistrationAccountStatus(params.registration, "link_failed");
    return { ok: false as const, error: existingMemberError.message };
  }

  if (existingMember) {
    await markRegistrationAccountStatus(params.registration, "link_failed");
    return {
      ok: false as const,
      error: "This portal account is already linked to another member.",
    };
  }

  const fullName = [params.registration.first_name, params.registration.last_name]
    .filter(Boolean)
    .join(" ");

  const { error: profileError } = await admin.from("profiles").upsert(
    {
      id: verified.authUserId,
      full_name: fullName || null,
      email: verified.loginEmail,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" }
  );

  if (profileError) {
    await markRegistrationAccountStatus(params.registration, "link_failed");
    return { ok: false as const, error: profileError.message };
  }

  const { error: memberError } = await admin
    .from("members")
    .update({
      profile_id: verified.authUserId,
      email: params.registration.email ?? verified.loginEmail,
      updated_at: new Date().toISOString(),
    })
    .eq("church_id", params.churchId)
    .eq("id", params.primaryMemberId);

  if (memberError) {
    await markRegistrationAccountStatus(params.registration, "link_failed");
    return { ok: false as const, error: memberError.message };
  }

  try {
    await ensureChurchUserActive({
      churchId: params.churchId,
      authUserId: verified.authUserId,
    });
  } catch (error) {
    await markRegistrationAccountStatus(params.registration, "link_failed");
    return {
      ok: false as const,
      error: error instanceof Error ? error.message : "Failed to activate portal access.",
    };
  }

  return {
    ok: true as const,
    accountLinked: true as const,
    emailConfirmed: verified.emailConfirmed,
  };
}

export async function convertRegistrationAction(
  _prevState: ConversionResult | null,
  formData: FormData
): Promise<ConversionResult> {
  try {
    const churchSlug = getString(formData, "churchSlug");
    const ctx = await requireChurchRole(churchSlug, CHURCH_MANAGEMENT_ROLE_CODES);
    const supabase = await createClient();

    const raw: Record<string, unknown> = {};
    const familyResolutions: {
      registrationHouseholdMemberId: string;
      resolution: string;
      memberId?: string | null;
      householdRole?: string | null;
    }[] = [];
    const approvedDepartmentIds: string[] = [];

    for (const [key, value] of formData.entries()) {
      if (key.startsWith("familyMemberResolutions[")) {
        const match = key.match(/^familyMemberResolutions\[(\d+)\]\.(\w+)$/);
        if (match) {
          const index = parseInt(match[1], 10);
          const field = match[2];
          familyResolutions[index] = familyResolutions[index] || { registrationHouseholdMemberId: "", resolution: "skip" };
          familyResolutions[index][field as "registrationHouseholdMemberId" | "resolution" | "memberId" | "householdRole"] = String(value);
        }
      } else if (key.startsWith("approvedDepartmentIds[")) {
        approvedDepartmentIds.push(String(value));
      } else {
        raw[key] = value;
      }
    }

    raw.familyMemberResolutions = familyResolutions.filter(r => r.registrationHouseholdMemberId);
    raw.approvedDepartmentIds = approvedDepartmentIds;

    const decision = registrationReviewDecisionSchema.parse(raw);

    // Load registration with family members
    const { data: registration, error: regError } = await supabase
      .from("church_member_registrations")
      .select("*")
      .eq("id", decision.registrationId)
      .eq("church_id", ctx.churchId)
      .maybeSingle();

    if (regError) {
      return conversionFailure("Registration could not be loaded. Please try again.");
    }

    if (!registration) {
      return conversionFailure("Registration not found.");
    }

    if (registration.status === "converted" || registration.status === "merged") {
      return {
        ok: true,
        memberId: registration.created_member_id ?? "",
        householdId: registration.created_household_id,
        familyMemberIds: [],
      };
    }

    if (registration.status === "rejected") {
      return conversionFailure("This registration has already been rejected.");
    }

    const { data: familyRows, error: famError } = await supabase
      .from("church_member_registration_household_members")
      .select("*")
      .eq("registration_id", decision.registrationId)
      .eq("church_id", ctx.churchId);

    if (famError) {
      return conversionFailure("Registration family members could not be loaded. Please try again.");
    }

    const familyMembers = familyRows ?? [];

    // Resolve primary member
    let primaryMemberId: string;
    if (decision.memberResolution === "merge" && decision.memberId) {
      primaryMemberId = decision.memberId;
    } else {
      const memberResult = await createMemberRecord(supabase, {
        churchId: ctx.churchId,
        churchSlug: ctx.churchSlug,
        actorUserId: ctx.userId,
        firstName: registration.first_name,
        lastName: registration.last_name,
        displayName: registration.display_name,
        email: registration.email,
        phone: registration.phone,
        gender: registration.gender,
        membershipStatus: decision.membershipStatus,
        membershipType: registration.requested_membership_type,
        dateOfBirth: registration.date_of_birth,
        baptismDate: registration.baptism_date,
        transferInDate: registration.transfer_in_date,
        previousChurch: registration.previous_church,
        city: registration.city,
        country: registration.country,
        address: registration.address,
        profession: registration.profession,
        maritalStatus: registration.marital_status,
        emergencyContactName: registration.emergency_contact_name,
        emergencyContactPhone: registration.emergency_contact_phone,
        notes: registration.notes,
      });

      if (!memberResult.ok) {
        if (memberResult.code === "VALIDATION_ERROR") {
          console.warn("Registration approval member validation failed", {
            registrationId: decision.registrationId,
            fieldErrors: memberResult.fieldErrors,
          });

          return {
            ok: false,
            code: "VALIDATION_ERROR",
            error: memberResult.error,
            fieldErrors: memberResult.fieldErrors,
          };
        }

        return conversionFailure("Member could not be created. Please review the registration and try again.");
      }
      primaryMemberId = memberResult.memberId;
    }

    // Resolve household
    let householdId: string | null = null;
    if (decision.householdResolution === "existing" && decision.householdId) {
      householdId = decision.householdId;
    } else if (decision.householdResolution === "new" && decision.newHouseholdName) {
      const householdResult = await createHouseholdRecord(supabase, {
        churchId: ctx.churchId,
        actorUserId: ctx.userId,
        householdName: decision.newHouseholdName,
        address: registration.suggested_household_address,
        city: registration.suggested_household_city,
        country: registration.suggested_household_country,
        phone: registration.suggested_household_phone,
        email: registration.suggested_household_email,
        notes: registration.household_notes,
      });

      if (!householdResult.ok) {
        return conversionFailure("Household could not be created. Please review the household details and try again.");
      }
      householdId = householdResult.householdId;
    }

    // Link primary member to household
    if (householdId) {
      const linkResult = await linkMemberToHousehold(supabase, {
        churchId: ctx.churchId,
        householdId,
        memberId: primaryMemberId,
        householdRole: decision.householdRole,
      });
      if (!linkResult.ok) {
        return conversionFailure("Member could not be linked to the selected household.");
      }
    }

    // Process family members
    const familyMemberIds: string[] = [];
    for (const familyResolution of decision.familyMemberResolutions) {
      const familyRow = familyMembers.find(f => f.id === familyResolution.registrationHouseholdMemberId);
      if (!familyRow) continue;

      if (familyResolution.resolution === "skip") {
        await supabase
          .from("church_member_registration_household_members")
          .update({ status: "skipped", updated_at: new Date().toISOString() })
          .eq("id", familyRow.id);
        continue;
      }

      let familyMemberId: string;
      if (familyResolution.resolution === "link" && familyResolution.memberId) {
        familyMemberId = familyResolution.memberId;
      } else {
        const createResult = await createMemberRecord(supabase, {
          churchId: ctx.churchId,
          churchSlug: ctx.churchSlug,
          actorUserId: ctx.userId,
          firstName: familyRow.first_name,
          lastName: familyRow.last_name,
          email: familyRow.email,
          phone: familyRow.phone,
          gender: familyRow.gender,
          membershipStatus: familyRow.membership_status_suggestion || decision.membershipStatus,
          dateOfBirth: familyRow.date_of_birth,
        });

        if (!createResult.ok) {
          if (createResult.code === "VALIDATION_ERROR") {
            console.warn("Registration approval family member validation failed", {
              registrationId: decision.registrationId,
              familyRegistrationMemberId: familyRow.id,
              fieldErrors: createResult.fieldErrors,
            });

            return {
              ok: false,
              code: "VALIDATION_ERROR",
              error: createResult.error,
              fieldErrors: createResult.fieldErrors,
            };
          }

          return conversionFailure("Family member could not be created. Please review the registration and try again.");
        }
        familyMemberId = createResult.memberId;
      }

      familyMemberIds.push(familyMemberId);

      if (householdId) {
        const familyLinkResult = await linkMemberToHousehold(supabase, {
          churchId: ctx.churchId,
          householdId,
          memberId: familyMemberId,
          householdRole: familyResolution.householdRole,
        });
        if (!familyLinkResult.ok) {
          return conversionFailure("Family member could not be linked to the selected household.");
        }
      }

      await supabase
        .from("church_member_registration_household_members")
        .update({
          status: familyResolution.resolution === "link" ? "matched" : "created",
          resulting_member_id: familyMemberId,
          updated_at: new Date().toISOString(),
        })
        .eq("id", familyRow.id);
    }

    // Set household head
    if (householdId && decision.setAsHead) {
      const headResult = await setHouseholdHead(supabase, {
        churchId: ctx.churchId,
        householdId,
        memberId: primaryMemberId,
      });
      if (!headResult.ok) {
        return conversionFailure("The household head could not be updated.");
      }
    }

    // Create approved member departments for primary member
    if (decision.approvedDepartmentIds.length > 0) {
      const { data: departments } = await supabase
        .from("church_departments")
        .select("id, department_name")
        .eq("church_id", ctx.churchId)
        .in("id", decision.approvedDepartmentIds);

      for (const dept of departments ?? []) {
        const { data: existing } = await supabase
          .from("member_departments")
          .select("id")
          .eq("member_id", primaryMemberId)
          .eq("department_id", dept.id)
          .maybeSingle();

        if (!existing) {
          await supabase.from("member_departments").insert({
            church_id: ctx.churchId,
            member_id: primaryMemberId,
            department_id: dept.id,
            department_name: dept.department_name,
            joined_date: new Date().toISOString().slice(0, 10),
            is_active: true,
          });
        }
      }
    }

    const accountActivation = await activateVerifiedPortalAccount({
      registration: registration as RegistrationAccountRow,
      churchId: ctx.churchId,
      primaryMemberId,
    });

    if (!accountActivation.ok) {
      return accountLinkFailure(accountActivation.error);
    }

    const accountSuccessMessage = accountActivation.accountLinked
      ? accountActivation.emailConfirmed
        ? "Registration approved. The member can sign in using the account created during registration."
        : "Registration approved. Portal access will be available after email confirmation."
      : undefined;

    // Mark registration converted
    const { error: updateError } = await supabase
      .from("church_member_registrations")
      .update({
        status: decision.memberResolution === "merge" ? "merged" : "converted",
        matched_member_id: decision.memberResolution === "merge" ? primaryMemberId : null,
        created_member_id: decision.memberResolution === "create" ? primaryMemberId : null,
        created_household_id: householdId,
        account_setup_status: accountActivation.accountLinked
          ? "active"
          : (registration as RegistrationAccountRow).account_setup_status ?? "not_requested",
        reviewed_by_user_id: ctx.userId,
        reviewed_at: new Date().toISOString(),
        review_note: decision.reviewNote,
        updated_at: new Date().toISOString(),
      })
      .eq("id", decision.registrationId)
      .eq("church_id", ctx.churchId);

    if (updateError) {
      return conversionFailure("Registration was converted, but its review status could not be updated.");
    }

    revalidatePath(`/c/${churchSlug}/members`);
    revalidatePath(`/c/${churchSlug}/members?view=onboarding`);
    revalidatePath(`/c/${churchSlug}/households`);
    revalidatePath(`/c/${churchSlug}/dashboard`);
    revalidatePath(`/c/${churchSlug}/reports`);
    revalidatePath(`/c/${churchSlug}/office`);

    return {
      ok: true,
      memberId: primaryMemberId,
      householdId,
      familyMemberIds,
      message: accountSuccessMessage,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return validationFailure(error.issues, getString(formData, "registrationId") || undefined);
    }
    return {
      ok: false,
      code: "UNKNOWN_ERROR",
      error: "Registration approval could not be completed. Please try again.",
    };
  }
}
