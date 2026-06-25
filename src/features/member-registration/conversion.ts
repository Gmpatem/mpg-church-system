"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireChurchRole } from "@/features/access/queries";
import { CHURCH_MANAGEMENT_ROLE_CODES } from "@/lib/domain/church-access";
import { createMemberRecord } from "@/features/members/services/create-member-record";
import { createHouseholdRecord } from "@/features/households/services/create-household-record";
import { linkMemberToHousehold } from "@/features/households/services/link-member-household";
import { setHouseholdHead } from "@/features/households/services/set-household-head";
import { registrationReviewDecisionSchema } from "./schemas";
import { getString } from "@/lib/domain/validation";
import type { ConversionResult } from "./types";

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
      return { ok: false, error: regError.message };
    }

    if (!registration) {
      return { ok: false, error: "Registration not found." };
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
      return { ok: false, error: "This registration has already been rejected." };
    }

    const { data: familyRows, error: famError } = await supabase
      .from("church_member_registration_household_members")
      .select("*")
      .eq("registration_id", decision.registrationId)
      .eq("church_id", ctx.churchId);

    if (famError) {
      return { ok: false, error: famError.message };
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
        return { ok: false, error: memberResult.error };
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
        return { ok: false, error: householdResult.error };
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
        return { ok: false, error: linkResult.error };
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
          return { ok: false, error: createResult.error };
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
          return { ok: false, error: familyLinkResult.error };
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
        return { ok: false, error: headResult.error };
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

    // Mark registration converted
    const { error: updateError } = await supabase
      .from("church_member_registrations")
      .update({
        status: decision.memberResolution === "merge" ? "merged" : "converted",
        matched_member_id: decision.memberResolution === "merge" ? primaryMemberId : null,
        created_member_id: decision.memberResolution === "create" ? primaryMemberId : null,
        created_household_id: householdId,
        reviewed_by_user_id: ctx.userId,
        reviewed_at: new Date().toISOString(),
        review_note: decision.reviewNote,
        updated_at: new Date().toISOString(),
      })
      .eq("id", decision.registrationId)
      .eq("church_id", ctx.churchId);

    if (updateError) {
      return { ok: false, error: updateError.message };
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
    };
  } catch (error) {
    if (error && typeof error === "object" && "errors" in error) {
      const zodError = error as { errors?: { message: string }[] };
      return { ok: false, error: zodError.errors?.[0]?.message || "Validation failed." };
    }
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to convert registration.",
    };
  }
}
