"use server";

import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { normalizeChurchGender } from "@/lib/domain/church-gender";
import { normalizeDateOnly } from "@/lib/domain/date-only";
import {
  canCurrentUserManageMemberInvites,
  getInviteDepartmentOptions,
  getSecureInviteContextByToken,
  getMemberInviteContext,
} from "./queries";
import {
  buildDepartmentLeadershipSelections,
  sanitizeRequestedRoleName,
} from "./validation";
import type {
  InviteCreationMode,
  MemberInviteResult,
  SecureInviteClaimResult,
  SimpleActionResult,
} from "./types";

function generateInviteToken() {
  return randomBytes(24).toString("hex");
}

function buildSecureInvitePath(token: string) {
  return `/invite/${token}`;
}

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function getNullableString(formData: FormData, key: string) {
  const value = getString(formData, key);
  return value.length > 0 ? value : null;
}

function revalidateInviteSurfaces(churchSlug: string) {
  revalidatePath(`/c/${churchSlug}/access-control`);
  revalidatePath(`/c/${churchSlug}/members`);
  revalidatePath(`/my/${churchSlug}`);
}

async function upsertProfileBasics(params: {
  userId: string;
  email: string;
  phone: string | null;
  fullName: string;
}) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("profiles")
    .upsert(
      {
        id: params.userId,
        full_name: params.fullName,
        email: params.email,
        phone: params.phone,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    );

  if (error) {
    throw new Error(error.message);
  }
}



async function enrichMemberRecord(params: {
  memberId: string;
  churchId: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  dateOfBirth: string | null;
  gender: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  maritalStatus: string | null;
  baptismDate: string | null;
  membershipType: string | null;
}) {
  const supabase = await createClient();

  const payload = {
    first_name: params.firstName,
    last_name: params.lastName,
    display_name: [params.firstName, params.lastName].filter(Boolean).join(" "),
    email: params.email,
    phone: params.phone,
    date_of_birth: params.dateOfBirth,
    gender: params.gender,
    address: params.address,
    city: params.city,
    country: params.country,
    marital_status: params.maritalStatus,
    baptism_date: params.baptismDate,
    membership_type: params.membershipType ?? "regular",
    profile_id: params.userId,
    // Note: portal_joined_at is NOT set here.
    // It must only be set after password change is complete (see completeFirstLoginPasswordChangeAction)
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from("members")
    .update(payload)
    .eq("church_id", params.churchId)
    .eq("id", params.memberId);

  if (error) {
    throw new Error(error.message);
  }
}

async function ensureChurchUserLinked(params: {
  churchId: string;
  userId: string;
}) {
  const supabase = await createClient();

  const { data: existing, error: lookupError } = await supabase
    .from("church_users")
    .select("id, status")
    .eq("church_id", params.churchId)
    .eq("user_id", params.userId)
    .maybeSingle();

  if (lookupError) {
    throw new Error(lookupError.message);
  }

  if (existing) {
    const { error: updateError } = await supabase
      .from("church_users")
      .update({
        status: "active",
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id);

    if (updateError) {
      throw new Error(updateError.message);
    }

    return;
  }

  const { error: insertError } = await supabase
    .from("church_users")
    .insert({
      church_id: params.churchId,
      user_id: params.userId,
      status: "active",
      is_primary: false,
    });

  if (insertError) {
    throw new Error(insertError.message);
  }
}

async function syncMemberDepartments(params: {
  churchId: string;
  memberId: string;
  departmentIds: string[];
}) {
  const supabase = await createClient();

  const { data: existingRows, error: existingError } = await supabase
    .from("member_departments")
    .select("id, department_id")
    .eq("church_id", params.churchId)
    .eq("member_id", params.memberId);

  if (existingError) {
    throw new Error(existingError.message);
  }

  const existingDepartmentIds = new Set(
    (existingRows ?? [])
      .map((row: any) => row.department_id)
      .filter(Boolean)
  );

  const missingIds = params.departmentIds.filter((id) => !existingDepartmentIds.has(id));

  if (missingIds.length === 0) return;

  // Resolve department names server-side before inserting
  const { data: departments, error: deptError } = await supabase
    .from("church_departments")
    .select("id, department_name")
    .eq("church_id", params.churchId)
    .in("id", missingIds);

  if (deptError) {
    throw new Error(deptError.message);
  }

  const deptMap = new Map((departments ?? []).map((d: any) => [d.id, d.department_name]));

  const inserts = missingIds
    .map((departmentId) => {
      const deptName = deptMap.get(departmentId);
      // Skip if department not found or has no name - don't insert invalid data
      if (!deptName) return null;
      return {
        church_id: params.churchId,
        member_id: params.memberId,
        department_id: departmentId,
        department_name: deptName,
        is_active: true,
        start_date: new Date().toISOString().slice(0, 10),
      };
    })
    .filter(Boolean) as Array<{
      church_id: string;
      member_id: string;
      department_id: string;
      department_name: string;
      is_active: boolean;
      start_date: string;
    }>;

  if (inserts.length === 0) return;

  const { error: insertError } = await supabase
    .from("member_departments")
    .insert(inserts);

  if (insertError) {
    throw new Error(insertError.message);
  }
}

async function fillDepartmentNames(params: {
  churchId: string;
  memberId: string;
  departmentIds: string[];
}) {
  if (params.departmentIds.length === 0) return;

  const supabase = await createClient();

  const { data: departments, error: deptError } = await supabase
    .from("church_departments")
    .select("id, department_name")
    .eq("church_id", params.churchId)
    .in("id", params.departmentIds);

  if (deptError) {
    throw new Error(deptError.message);
  }

  for (const department of departments ?? []) {
    const { error: updateError } = await supabase
      .from("member_departments")
      .update({
        department_name: (department as any).department_name,
        updated_at: new Date().toISOString(),
      })
      .eq("church_id", params.churchId)
      .eq("member_id", params.memberId)
      .eq("department_id", (department as any).id);

    if (updateError) {
      throw new Error(updateError.message);
    }
  }
}

async function maybeCreateChurchAccessRequest(params: {
  churchId: string;
  inviteId: string;
  userId: string;
  memberId: string;
  selectedRoleCode: string;
  selectedRoleName: string | null;
  otherRoleName: string | null;
}) {
  const supabase = await createClient();

  const requestedRoleName = sanitizeRequestedRoleName(
    params.selectedRoleCode,
    params.selectedRoleName,
    params.otherRoleName
  );

  if (!requestedRoleName) return;

  const normalizedCode = params.selectedRoleCode.trim().toLowerCase();
  const requestCode =
    normalizedCode === "other" || normalizedCode === "regular_member"
      ? null
      : normalizedCode;

  const { data: existing, error: lookupError } = await supabase
    .from("church_access_requests")
    .select("id")
    .eq("church_id", params.churchId)
    .eq("member_id", params.memberId)
    .eq("requested_role_name", requestedRoleName)
    .eq("status", "pending")
    .maybeSingle();

  if (lookupError) {
    throw new Error(lookupError.message);
  }

  if (existing) return;

  const { error: insertError } = await supabase
    .from("church_access_requests")
    .insert({
      church_id: params.churchId,
      invite_id: params.inviteId,
      user_id: params.userId,
      member_id: params.memberId,
      requested_role_code: requestCode,
      requested_role_name: requestedRoleName,
      status: "pending",
      source: "invite_onboarding",
    });

  if (insertError) {
    throw new Error(insertError.message);
  }
}

async function maybeCreateDepartmentLeadershipRequests(params: {
  churchId: string;
  inviteId: string;
  userId: string;
  memberId: string;
  selections: Array<{
    departmentId: string;
    isLeader: boolean;
    title: string;
  }>;
}) {
  const supabase = await createClient();

  for (const selection of params.selections) {
    if (!selection.isLeader) continue;

    const requestedRoleName = selection.title.trim() || "Department Leader";

    const { data: existing, error: lookupError } = await supabase
      .from("department_leadership_requests")
      .select("id")
      .eq("church_id", params.churchId)
      .eq("member_id", params.memberId)
      .eq("department_id", selection.departmentId)
      .eq("requested_role_name", requestedRoleName)
      .eq("status", "pending")
      .maybeSingle();

    if (lookupError) {
      throw new Error(lookupError.message);
    }

    if (existing) continue;

    const { error: insertError } = await supabase
      .from("department_leadership_requests")
      .insert({
        church_id: params.churchId,
        invite_id: params.inviteId,
        user_id: params.userId,
        member_id: params.memberId,
        department_id: selection.departmentId,
        requested_role_name: requestedRoleName,
        requested_role_code: "department_leader",
        status: "pending",
        source: "invite_onboarding",
      });

    if (insertError) {
      throw new Error(insertError.message);
    }
  }
}

export async function createMemberInviteAction(
  churchSlug: string,
  memberId: string
): Promise<MemberInviteResult> {
  try {
    const canManage = await canCurrentUserManageMemberInvites(churchSlug);

    if (!canManage) {
      return {
        ok: false,
        error: "You do not have permission to generate member invites.",
      };
    }

    const ctx = await getMemberInviteContext(churchSlug, memberId);

    if (ctx.existingInvite) {
      revalidateInviteSurfaces(churchSlug);

      return {
        ok: true,
        inviteId: ctx.existingInvite.id,
        token: ctx.existingInvite.token,
        path: buildSecureInvitePath(ctx.existingInvite.token),
        expiresAt: ctx.existingInvite.expires_at,
        reused: true,
        mode: "existing_member",
      };
    }

    const supabase = await createClient();
    const token = generateInviteToken();
    const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();

    const { data: createdInvite, error: createError } = await supabase
      .from("member_onboarding_invites")
      .insert({
        church_id: ctx.churchId,
        member_id: ctx.member.id,
        email: ctx.member.email,
        token,
        invite_type: "member",
        status: "pending",
        expires_at: expiresAt,
        created_by_user_id: ctx.profileId,
      })
      .select("id, token, expires_at")
      .single();

    if (createError) {
      return {
        ok: false,
        error: createError.message,
      };
    }

    const { error: memberUpdateError } = await supabase
      .from("members")
      .update({
        portal_invited_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("church_id", ctx.churchId)
      .eq("id", ctx.member.id);

    if (memberUpdateError) {
      return {
        ok: false,
        error: memberUpdateError.message,
      };
    }

    revalidateInviteSurfaces(churchSlug);

    return {
      ok: true,
      inviteId: createdInvite.id,
      token: createdInvite.token,
      path: buildSecureInvitePath(createdInvite.token),
      expiresAt: createdInvite.expires_at,
      reused: false,
      mode: "existing_member",
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to create secure invite.",
    };
  }
}

export async function createOpenOnboardingInviteAction(
  churchSlug: string,
  email?: string | null,
  note?: string | null
): Promise<MemberInviteResult> {
  try {
    const canManage = await canCurrentUserManageMemberInvites(churchSlug);

    if (!canManage) {
      return {
        ok: false,
        error: "You do not have permission to generate onboarding invites.",
      };
    }

    const ctx = await getMemberInviteContext(churchSlug, "__open__").catch(async () => {
      const accessCtx = await import("@/features/access/queries").then((m) => m.requireChurchAccess(churchSlug));
      return {
        churchId: accessCtx.churchId,
        churchSlug: accessCtx.churchSlug,
        profileId: accessCtx.profile.id,
      } as any;
    });

    const supabase = await createClient();
    const cleanedEmail = email?.trim().toLowerCase() || null;
    const cleanedNote = note?.trim() || null;
    const token = generateInviteToken();
    const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();

    const { data: existing, error: existingError } = await supabase
      .from("member_onboarding_invites")
      .select("id, token, expires_at")
      .eq("church_id", ctx.churchId)
      .is("member_id", null)
      .eq("status", "pending")
      .is("revoked_at", null)
      .eq("invite_type", "church_open")
      .eq("email", cleanedEmail)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingError && cleanedEmail) {
      return { ok: false, error: existingError.message };
    }

    if (existing) {
      revalidateInviteSurfaces(churchSlug);
      return {
        ok: true,
        inviteId: existing.id,
        token: existing.token,
        path: buildSecureInvitePath(existing.token),
        expiresAt: existing.expires_at,
        reused: true,
        mode: "open_onboarding",
      };
    }

    const { data: createdInvite, error: createError } = await supabase
      .from("member_onboarding_invites")
      .insert({
        church_id: ctx.churchId,
        member_id: null,
        email: cleanedEmail,
        token,
        invite_type: "church_open",
        status: "pending",
        expires_at: expiresAt,
        created_by_user_id: ctx.profileId,
        note: cleanedNote,
        metadata: {
          mode: "open_onboarding",
          created_from: "access_control_invites",
        },
      })
      .select("id, token, expires_at")
      .single();

    if (createError) {
      return {
        ok: false,
        error: createError.message,
      };
    }

    revalidateInviteSurfaces(churchSlug);

    return {
      ok: true,
      inviteId: createdInvite.id,
      token: createdInvite.token,
      path: buildSecureInvitePath(createdInvite.token),
      expiresAt: createdInvite.expires_at,
      reused: false,
      mode: "open_onboarding",
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to create onboarding invite.",
    };
  }
}

export async function revokeMemberInviteAction(
  churchSlug: string,
  inviteId: string
): Promise<SimpleActionResult> {
  try {
    const canManage = await canCurrentUserManageMemberInvites(churchSlug);

    if (!canManage) {
      return {
        ok: false,
        error: "You do not have permission to revoke member invites.",
      };
    }

    const supabase = await createClient();

    const { data: existingInvite, error: lookupError } = await supabase
      .from("member_onboarding_invites")
      .select("id, status")
      .eq("id", inviteId)
      .single();

    if (lookupError) {
      return { ok: false, error: lookupError.message };
    }

    if (!existingInvite) {
      return { ok: false, error: "Invite not found." };
    }

    if (existingInvite.status !== "pending") {
      return { ok: false, error: "Only pending invites can be revoked." };
    }

    const { error: revokeError } = await supabase
      .from("member_onboarding_invites")
      .update({
        status: "revoked",
        revoked_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", inviteId)
      .eq("status", "pending");

    if (revokeError) {
      return { ok: false, error: revokeError.message };
    }

    revalidateInviteSurfaces(churchSlug);

    return {
      ok: true,
      message: "Invite revoked.",
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to revoke invite.",
    };
  }
}

export async function completeRichInviteOnboardingAction(
  _prevState: SecureInviteClaimResult | null,
  formData: FormData
): Promise<SecureInviteClaimResult | null> {
  const token = getString(formData, "token");
  const firstName = getString(formData, "firstName");
  const lastName = getString(formData, "lastName");
  const email = getString(formData, "email").toLowerCase();
  const phone = getNullableString(formData, "phone");
  const password = getString(formData, "password");
  const confirmPassword = getString(formData, "confirmPassword");

  let dateOfBirth: string | null = null;
  let gender: string | null = null;
  const address = getNullableString(formData, "address");
  const city = getNullableString(formData, "city");
  const country = getNullableString(formData, "country");
  const maritalStatus = getNullableString(formData, "maritalStatus");
  let baptismDate: string | null = null;
  const membershipType = getNullableString(formData, "membershipType");

  const selectedRoleCode = getString(formData, "selectedRoleCode").toLowerCase();
  const selectedRoleName = getNullableString(formData, "selectedRoleName");
  const otherRoleName = getNullableString(formData, "otherRoleName");
  const accessAcknowledged = formData.get("accessAcknowledged") === "on";

  if (!token) {
    return { ok: false, error: "Invite token is required." };
  }

  if (!firstName || !lastName || !email || !password) {
    return { ok: false, error: "First name, last name, email, and password are required." };
  }

  if (password.length < 6) {
    return { ok: false, error: "Password must be at least 6 characters long." };
  }

  if (password !== confirmPassword) {
    return { ok: false, error: "Passwords do not match." };
  }

  try {
    dateOfBirth = normalizeDateOnly(getNullableString(formData, "dateOfBirth"), "Date of birth");
    baptismDate = normalizeDateOnly(getNullableString(formData, "baptismDate"), "Baptism date");
    gender = normalizeChurchGender(getNullableString(formData, "gender"));
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Please check the profile fields.",
    };
  }

  if (!accessAcknowledged) {
    return {
      ok: false,
      error: "You must confirm that elevated access requires church approval.",
    };
  }

  const inviteContext = await getSecureInviteContextByToken(token);
  if (!inviteContext) {
    return { ok: false, error: "Invite not found or no longer available." };
  }

  const inviteStatus = inviteContext.status?.trim().toLowerCase();
  if (inviteStatus === "claimed") {
    return { ok: false, error: "This invite has already been claimed." };
  }
  if (inviteStatus === "revoked") {
    return { ok: false, error: "This invite has been revoked." };
  }
  if (inviteContext.expiresAt) {
    const expiresAt = new Date(inviteContext.expiresAt).getTime();
    if (!Number.isNaN(expiresAt) && expiresAt < Date.now()) {
      return { ok: false, error: "This invite has expired." };
    }
  }

  const departments = inviteContext.churchId
    ? await getInviteDepartmentOptions(inviteContext.churchSlug).catch(() => [])
    : [];
  const departmentSelections = buildDepartmentLeadershipSelections(departments, formData);
  const selectedDepartmentIds = departmentSelections.map((item) => item.departmentId);

  const supabase = await createClient();

  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: [firstName, lastName].filter(Boolean).join(" "),
      },
    },
  });

  if (signUpError) {
    return { ok: false, error: signUpError.message };
  }

  const user = signUpData.user;
  if (!user) {
    return { ok: false, error: "Account creation succeeded but no user was returned." };
  }


  let finalChurchSlug = inviteContext.churchSlug;
  let churchId = inviteContext.churchId ?? null;
  let memberId = inviteContext.memberId ?? null;

  if (inviteContext.memberId) {
    // Existing member invite claim - uses DB RPC for RLS-safe privileged writes
    // NOTE: The RPC complete_member_onboarding_from_invite should NOT set portal_joined_at
    // portal_joined_at will be set later by completeFirstLoginPasswordChangeAction
    const { data: claimedChurchSlug, error: claimError } = await supabase.rpc(
      "complete_member_onboarding_from_invite",
      {
        p_user_id: user.id,
        p_token: token,
        p_first_name: firstName,
        p_last_name: lastName,
        p_email: email || null,
        p_phone: phone || null,
      }
    );

    if (claimError) {
      return { ok: false, error: claimError.message };
    }

    finalChurchSlug =
      typeof claimedChurchSlug === "string" && claimedChurchSlug.trim()
        ? claimedChurchSlug.trim()
        : inviteContext.churchSlug;

    const { data: inviteRow, error: inviteRowError } = await supabase
      .from("member_onboarding_invites")
      .select("id, church_id, member_id")
      .eq("token", token)
      .single();

    if (inviteRowError) {
      return { ok: false, error: inviteRowError.message };
    }

    churchId = inviteRow.church_id as string;
    memberId = inviteRow.member_id as string;

    await enrichMemberRecord({
      memberId,
      churchId,
      userId: user.id,
      firstName,
      lastName,
      email,
      phone,
      dateOfBirth,
      gender,
      address,
      city,
      country,
      maritalStatus,
      baptismDate,
      membershipType,
    });
  } else {
    if (!churchId) {
      const { data: inviteRow, error: inviteLookupError } = await supabase
        .from("member_onboarding_invites")
        .select("id, church_id")
        .eq("token", token)
        .single();

      if (inviteLookupError) {
        return { ok: false, error: inviteLookupError.message };
      }

      churchId = inviteRow.church_id as string;
    }

    // Open invite claim - uses DB RPC for RLS-safe privileged writes
    // NOTE: The RPC complete_open_member_onboarding_from_invite should NOT set portal_joined_at
    // portal_joined_at will be set later by completeFirstLoginPasswordChangeAction
    if (!churchId) {
      const { data: inviteRow, error: inviteLookupError } = await supabase
        .from("member_onboarding_invites")
        .select("id, church_id")
        .eq("token", token)
        .single();

      if (inviteLookupError) {
        return { ok: false, error: inviteLookupError.message };
      }

      churchId = inviteRow.church_id as string;
    }

    const { data: openInviteClaimData, error: openInviteClaimError } = await supabase.rpc(
      "complete_open_member_onboarding_from_invite",
      {
        p_user_id: user.id,
        p_token: token,
        p_first_name: firstName,
        p_last_name: lastName,
        p_email: email || null,
        p_phone: phone || null,
        p_date_of_birth: dateOfBirth || null,
        p_gender: gender || null,
        p_address: address || null,
        p_city: city || null,
        p_country: country || null,
        p_marital_status: maritalStatus || null,
        p_baptism_date: baptismDate || null,
        p_membership_type: membershipType || "regular",
      }
    );

    if (openInviteClaimError) {
      return { ok: false, error: openInviteClaimError.message };
    }

    const openInviteClaimRow = Array.isArray(openInviteClaimData)
      ? openInviteClaimData[0]
      : null;

    if (!openInviteClaimRow?.church_id || !openInviteClaimRow?.member_id) {
      return { ok: false, error: "Open invite onboarding did not return church/member details." };
    }

    churchId = openInviteClaimRow.church_id as string;
    memberId = openInviteClaimRow.member_id as string;
    finalChurchSlug =
      typeof openInviteClaimRow.church_slug === "string" && openInviteClaimRow.church_slug.trim()
        ? openInviteClaimRow.church_slug.trim()
        : finalChurchSlug;
  }

  if (!churchId || !memberId) {
    return { ok: false, error: "Could not resolve church or member during onboarding." };
  }

  const { data: inviteRowFinal, error: inviteRowFinalError } = await supabase
    .from("member_onboarding_invites")
    .select("id")
    .eq("token", token)
    .single();

  if (inviteRowFinalError) {
    return { ok: false, error: inviteRowFinalError.message };
  }

  await ensureChurchUserLinked({
    churchId,
    userId: user.id,
  });

  if (selectedDepartmentIds.length > 0) {
    await syncMemberDepartments({
      churchId,
      memberId,
      departmentIds: selectedDepartmentIds,
    });

    await fillDepartmentNames({
      churchId,
      memberId,
      departmentIds: selectedDepartmentIds,
    });
  }

  await maybeCreateChurchAccessRequest({
    churchId,
    inviteId: inviteRowFinal.id as string,
    userId: user.id,
    memberId,
    selectedRoleCode,
    selectedRoleName,
    otherRoleName,
  });

  await maybeCreateDepartmentLeadershipRequests({
    churchId,
    inviteId: inviteRowFinal.id as string,
    userId: user.id,
    memberId,
    selections: departmentSelections
      .filter((item) => item.isLeader)
      .map((item) => ({
        departmentId: item.departmentId,
        isLeader: item.isLeader,
        title: item.title,
      })),
  });

  // Verify the invite was properly claimed (RPC should set claimed_at and claimed_by_user_id)
  const { data: claimedInvite, error: verifyError } = await supabase
    .from("member_onboarding_invites")
    .select("status, claimed_at, claimed_by_user_id")
    .eq("token", token)
    .single();

  if (verifyError || !claimedInvite) {
    return { ok: false, error: "Failed to verify invite claim. Please contact support." };
  }

  if (claimedInvite.status !== "claimed" || !claimedInvite.claimed_at || !claimedInvite.claimed_by_user_id) {
    // The RPC didn't properly lock the invite - this is a server configuration issue
    console.error("Invite claim verification failed:", {
      token,
      status: claimedInvite.status,
      hasClaimedAt: !!claimedInvite.claimed_at,
      hasClaimedByUserId: !!claimedInvite.claimed_by_user_id,
    });
    return { ok: false, error: "Invite claim incomplete. Please contact support." };
  }

  revalidateInviteSurfaces(finalChurchSlug);

  if (signUpData.session) {
    redirect(`/my/${finalChurchSlug}?tab=overview&onboarding=1`);
  }

  redirect(`/login?registered=1&church=${finalChurchSlug}`);
}

export async function completeMemberInviteOnboardingAction(
  prevState: SecureInviteClaimResult | null,
  formData: FormData
): Promise<SecureInviteClaimResult | null> {
  return completeRichInviteOnboardingAction(prevState, formData);
}

