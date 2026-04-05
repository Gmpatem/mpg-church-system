import "server-only";

import { createClient } from "@/lib/supabase/server";
import { requireChurchAccess } from "@/features/access/queries";
import {
  SAFE_ONBOARDING_ROLE_FALLBACKS,
  normalizeRoleOptions,
} from "./validation";
import type {
  InviteDepartmentOption,
  InviteLifecycleStatus,
  InviteRoleOption,
  MemberInviteHistoryItem,
  MemberInviteManagementData,
  MemberInviteMemberOption,
  MemberPortalInviteState,
  RichSecureInvitePageData,
  SecureInviteContext,
} from "./types";

type ExistingInviteRow = {
  id: string;
  token: string;
  expires_at: string | null;
};

type MemberInviteMemberRow = {
  id: string;
  email: string | null;
};

type InviteContextRow = {
  invite_id: string;
  church_slug: string;
  church_name: string;
  member_id: string | null;
  member_first_name: string | null;
  member_last_name: string | null;
  member_email: string | null;
  invite_email: string | null;
  status: string;
  expires_at: string | null;
};

type MemberOptionRow = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  display_name: string | null;
  email: string | null;
  member_code: string | null;
  portal_invited_at: string | null;
  portal_joined_at: string | null;
};

type InviteHistoryRow = {
  id: string;
  member_id: string | null;
  email: string | null;
  token: string;
  invite_type: string | null;
  note: string | null;
  status: string;
  expires_at: string | null;
  claimed_at: string | null;
  revoked_at: string | null;
  created_at: string;
  members?: {
    first_name: string | null;
    last_name: string | null;
    display_name: string | null;
    email: string | null;
    member_code: string | null;
  } | null;
};

type DepartmentRow = {
  id: string;
  department_name: string;
  code: string | null;
  is_active: boolean | null;
};

type RoleRow = {
  id: string;
  code: string;
  name: string;
};

function buildSecureInvitePath(token: string) {
  return `/invite/${token}`;
}

function formatPersonName(
  firstName: string | null | undefined,
  lastName: string | null | undefined,
  displayName?: string | null
) {
  const resolvedDisplayName = displayName?.trim();
  if (resolvedDisplayName) return resolvedDisplayName;

  const joined = [firstName?.trim(), lastName?.trim()].filter(Boolean).join(" ").trim();
  return joined || null;
}

function resolvePortalState(row: MemberOptionRow): MemberPortalInviteState {
  if (row.portal_joined_at) return "joined";
  if (row.portal_invited_at) return "invited";
  return "not_invited";
}

export function resolveInviteStatus(input: {
  status: string | null | undefined;
  expiresAt?: string | null | undefined;
}): InviteLifecycleStatus {
  const raw = input.status?.trim().toLowerCase();
  if (raw === "claimed") return "claimed";
  if (raw === "revoked") return "revoked";

  if (input.expiresAt) {
    const expiresAt = new Date(input.expiresAt).getTime();
    if (!Number.isNaN(expiresAt) && expiresAt < Date.now()) {
      return "expired";
    }
  }

  return "pending";
}

export async function canCurrentUserManageMemberInvites(
  churchSlug: string
): Promise<boolean> {
  const ctx = await requireChurchAccess(churchSlug);
  const supabase = await createClient();

  const [roleResult, permissionResult] = await Promise.all([
    supabase
      .from("church_role_assignments")
      .select("role_definitions(code)")
      .eq("church_id", ctx.churchId)
      .eq("user_id", ctx.profile.id)
      .eq("is_active", true),
    supabase
      .from("church_permission_assignments")
      .select("permission_definitions(code)")
      .eq("church_id", ctx.churchId)
      .eq("user_id", ctx.profile.id)
      .eq("is_active", true),
  ]);

  if (roleResult.error) {
    throw new Error(roleResult.error.message);
  }

  if (permissionResult.error) {
    throw new Error(permissionResult.error.message);
  }

  const roleCodes = (roleResult.data ?? [])
    .map((row: any) => row.role_definitions?.code)
    .filter(Boolean);

  const permissionCodes = (permissionResult.data ?? [])
    .map((row: any) => row.permission_definitions?.code)
    .filter(Boolean);

  if (permissionCodes.includes("access_control")) {
    return true;
  }

  return roleCodes.some((code: string) =>
    ["pastor", "church_admin", "tech_team", "clerk", "church_secretary"].includes(code)
  );
}

export async function getMemberInviteContext(
  churchSlug: string,
  memberId: string
) {
  const ctx = await requireChurchAccess(churchSlug);
  const supabase = await createClient();

  const { data: member, error: memberError } = await supabase
    .from("members")
    .select("id, email")
    .eq("church_id", ctx.churchId)
    .eq("id", memberId)
    .maybeSingle<MemberInviteMemberRow>();

  if (memberError) {
    throw new Error(memberError.message);
  }

  if (!member) {
    throw new Error("Member not found.");
  }

  const nowIso = new Date().toISOString();

  const { data: existingInvite, error: inviteError } = await supabase
    .from("member_onboarding_invites")
    .select("id, token, expires_at")
    .eq("church_id", ctx.churchId)
    .eq("member_id", member.id)
    .eq("status", "pending")
    .is("revoked_at", null)
    .or(`expires_at.is.null,expires_at.gt.${nowIso}`)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<ExistingInviteRow>();

  if (inviteError) {
    throw new Error(inviteError.message);
  }

  return {
    churchId: ctx.churchId,
    churchSlug: ctx.churchSlug,
    profileId: ctx.profile.id,
    member,
    existingInvite,
  };
}

export async function getSecureInviteContextByToken(
  token: string
): Promise<SecureInviteContext | null> {
  const supabase = await createClient();

  const rpcResult = await supabase.rpc("get_member_invite_context", {
    p_token: token,
  });

  if (!rpcResult.error && Array.isArray(rpcResult.data) && rpcResult.data.length > 0) {
    const row = rpcResult.data[0] as InviteContextRow;
    return {
      inviteId: row.invite_id,
      churchSlug: row.church_slug,
      churchName: row.church_name,
      churchId: null,
      memberId: row.member_id,
      memberFirstName: row.member_first_name,
      memberLastName: row.member_last_name,
      memberEmail: row.member_email,
      inviteEmail: row.invite_email,
      inviteType: "member",
      note: null,
      status: row.status,
      expiresAt: row.expires_at,
    };
  }

  const { data: fallbackInvite, error: fallbackError } = await supabase
    .from("member_onboarding_invites")
    .select(`
      id,
      church_id,
      member_id,
      email,
      invite_type,
      note,
      status,
      expires_at,
      churches (
        slug,
        name
      ),
      members (
        first_name,
        last_name,
        display_name,
        email
      )
    `)
    .eq("token", token)
    .maybeSingle();

  if (fallbackError) {
    throw new Error(fallbackError.message);
  }

  if (!fallbackInvite) {
    return null;
  }

  const church = Array.isArray((fallbackInvite as any).churches)
    ? (fallbackInvite as any).churches[0]
    : (fallbackInvite as any).churches;

  const member = Array.isArray((fallbackInvite as any).members)
    ? (fallbackInvite as any).members[0]
    : (fallbackInvite as any).members;

  return {
    inviteId: (fallbackInvite as any).id,
    churchSlug: church?.slug ?? "",
    churchName: church?.name ?? "Church",
    churchId: (fallbackInvite as any).church_id ?? null,
    memberId: (fallbackInvite as any).member_id ?? null,
    memberFirstName: member?.first_name ?? null,
    memberLastName: member?.last_name ?? null,
    memberEmail: member?.email ?? null,
    inviteEmail: (fallbackInvite as any).email ?? null,
    inviteType: (fallbackInvite as any).invite_type ?? null,
    note: (fallbackInvite as any).note ?? null,
    status: (fallbackInvite as any).status ?? "pending",
    expiresAt: (fallbackInvite as any).expires_at ?? null,
  };
}

export async function getChurchInviteManagementData(
  churchSlug: string
): Promise<MemberInviteManagementData> {
  const ctx = await requireChurchAccess(churchSlug);
  const supabase = await createClient();

  const [membersResult, invitesResult] = await Promise.all([
    supabase
      .from("members")
      .select(
        "id, first_name, last_name, display_name, email, member_code, portal_invited_at, portal_joined_at"
      )
      .eq("church_id", ctx.churchId)
      .order("display_name", { ascending: true })
      .order("last_name", { ascending: true }),
    supabase
      .from("member_onboarding_invites")
      .select(
        `
        id,
        member_id,
        email,
        token,
        invite_type,
        note,
        status,
        expires_at,
        claimed_at,
        revoked_at,
        created_at,
        members (
          first_name,
          last_name,
          display_name,
          email,
          member_code
        )
      `
      )
      .eq("church_id", ctx.churchId)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  if (membersResult.error) {
    throw new Error(membersResult.error.message);
  }

  if (invitesResult.error) {
    throw new Error(invitesResult.error.message);
  }

  const memberOptions = ((membersResult.data ?? []) as MemberOptionRow[])
    .map<MemberInviteMemberOption>((row) => {
      const portalState = resolvePortalState(row);
      return {
        id: row.id,
        label:
          formatPersonName(row.first_name, row.last_name, row.display_name) ??
          row.email?.trim() ??
          row.member_code?.trim() ??
          "Unnamed member",
        email: row.email,
        memberCode: row.member_code,
        portalState,
      };
    })
    .sort((a, b) => a.label.localeCompare(b.label));

  const invites = ((invitesResult.data ?? []) as any[]).map<MemberInviteHistoryItem>((row) => {
    const member = Array.isArray(row.members) ? row.members[0] : row.members;
    return {
      id: row.id,
      memberId: row.member_id,
      memberName: formatPersonName(member?.first_name, member?.last_name, member?.display_name),
      memberEmail: member?.email ?? null,
      memberCode: member?.member_code ?? null,
      inviteEmail: row.email ?? null,
      token: row.token,
      path: buildSecureInvitePath(row.token),
      status: resolveInviteStatus({ status: row.status, expiresAt: row.expires_at }),
      inviteType: row.invite_type ?? null,
      note: row.note ?? null,
      createdAt: row.created_at,
      expiresAt: row.expires_at ?? null,
      claimedAt: row.claimed_at ?? null,
      revokedAt: row.revoked_at ?? null,
    };
  });

  const summary = invites.reduce(
    (acc, invite) => {
      acc.total += 1;
      acc[invite.status] += 1;
      return acc;
    },
    {
      total: 0,
      pending: 0,
      claimed: 0,
      expired: 0,
      revoked: 0,
    }
  );

  return {
    churchId: ctx.churchId,
    churchSlug: ctx.churchSlug,
    memberOptions,
    invites,
    summary,
  };
}

export async function getInviteDepartmentOptionsByChurchId(
  churchId: string
): Promise<InviteDepartmentOption[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("church_departments")
    .select("id, department_name, code, is_active")
    .eq("church_id", churchId)
    .eq("is_active", true)
    .order("department_name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as DepartmentRow[]).map((row) => ({
    id: row.id,
    name: row.department_name,
    code: row.code,
  }));
}

export async function getInviteDepartmentOptions(
  churchSlug: string
): Promise<InviteDepartmentOption[]> {
  const ctx = await requireChurchAccess(churchSlug);
  return getInviteDepartmentOptionsByChurchId(ctx.churchId);
}

export async function getInviteRoleOptions(): Promise<InviteRoleOption[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("role_definitions")
    .select("id, code, name")
    .order("name", { ascending: true });

  if (error) {
    return normalizeRoleOptions([]);
  }

  const dbRoles = ((data ?? []) as RoleRow[])
    .filter((row) => Boolean(row.code?.trim()) && Boolean(row.name?.trim()))
    .map<InviteRoleOption>((row) => ({
      id: row.id,
      code: row.code,
      name: row.name,
    }));

  return normalizeRoleOptions(dbRoles.length > 0 ? dbRoles : SAFE_ONBOARDING_ROLE_FALLBACKS);
}

export async function getRichSecureInvitePageData(
  token: string
): Promise<RichSecureInvitePageData | null> {
  const context = await getSecureInviteContextByToken(token);

  if (!context) {
    return null;
  }

  const inviteStatus = resolveInviteStatus({
    status: context.status,
    expiresAt: context.expiresAt,
  });

  const canClaim = inviteStatus === "pending";
  const claimMode = context.memberId ? "existing_member" : "open_onboarding";
  const memberDisplayName =
    formatPersonName(
      context.memberFirstName,
      context.memberLastName
    ) ??
    context.memberEmail ??
    context.inviteEmail ??
    "New member";

  let departments: InviteDepartmentOption[] = [];
  try {
    if (context.churchId) {
      departments = await getInviteDepartmentOptionsByChurchId(context.churchId);
    }
  } catch {
    departments = [];
  }

  const roleOptions = await getInviteRoleOptions();

  return {
    context,
    inviteStatus,
    canClaim,
    memberDisplayName,
    claimMode,
    departments,
    roleOptions,
  };
}
