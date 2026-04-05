import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { ChurchAccessContext, RoleCode } from "./types";

type ProfileRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  preferred_language: "en" | "fr" | null;
  must_change_password: boolean | null;
};

type ChurchRow = {
  id: string;
  slug: string;
  name: string | null;
};

type ChurchMembershipRow = {
  church_id: string;
  churches:
    | {
        id: string;
        slug: string;
        name: string | null;
      }
    | Array<{
        id: string;
        slug: string;
        name: string | null;
      }>
    | null;
};

type UserRoleRow = {
  church_id: string;
  role_definitions:
    | {
        code: string;
      }
    | Array<{
        code: string;
      }>
    | null;
};

type LinkedMemberRow = {
  church_id: string;
};

type UserChurchAccessEntry = {
  churchId: string;
  churchSlug: string;
  churchName: string | null;
  hasMembership: boolean;
  hasMemberLink: boolean;
  roleCodes: string[];
  hasOperationalAccess: boolean;
};

type UserAccessState = {
  userId: string;
  profile: {
    id: string;
    full_name: string | null;
    email: string | null;
    preferred_language: "en" | "fr" | null;
    must_change_password: boolean;
  };
  platformRoles: string[];
  churches: UserChurchAccessEntry[];
};

const PLATFORM_ROLE_CODES = ["platform_owner", "platform_admin", "platform_support"] as const;
const OPERATIONAL_ROLE_CODES = [
  "church_admin",
  "pastor",
  "elder",
  "clerk",
  "church_secretary",
  "treasurer",
] as const;

function unauthorized(path: string = "/login"): never {
  redirect(path);
}

function isPlatformRole(code: string) {
  return PLATFORM_ROLE_CODES.includes(code as (typeof PLATFORM_ROLE_CODES)[number]);
}

function isOperationalRole(code: string) {
  return OPERATIONAL_ROLE_CODES.includes(code as (typeof OPERATIONAL_ROLE_CODES)[number]);
}

function normalizeJoinedRow<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

function pickPrimaryChurch(entries: UserChurchAccessEntry[]): UserChurchAccessEntry | null {
  if (entries.length === 0) return null;

  const operational = entries.find((entry) => entry.hasOperationalAccess);
  if (operational) return operational;

  const memberLinked = entries.find((entry) => entry.hasMemberLink);
  if (memberLinked) return memberLinked;

  return entries[0] ?? null;
}

function normalizeProfile(
  user: { id: string; email?: string | null; user_metadata?: Record<string, unknown> },
  profile: ProfileRow | null
): UserAccessState["profile"] {
  return {
    id: user.id,
    full_name:
      profile?.full_name ??
      (typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : null),
    email: profile?.email ?? user.email ?? null,
    preferred_language: profile?.preferred_language ?? null,
    must_change_password: profile?.must_change_password ?? false,
  };
}

export async function requireUser() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    unauthorized("/login");
  }

  return data.user;
}

export async function getCurrentProfile(userId?: string) {
  const fallbackUser = userId ? null : await requireUser();
  const resolvedUserId = userId ?? fallbackUser?.id;

  if (!resolvedUserId) {
    throw new Error("Unable to resolve current user.");
  }
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, email, preferred_language, must_change_password")
    .eq("id", resolvedUserId)
    .maybeSingle<ProfileRow>();

  if (error) {
    throw new Error(error.message);
  }

  return (
    data ?? {
      id: resolvedUserId,
      full_name:
        fallbackUser && typeof fallbackUser.user_metadata?.full_name === "string"
          ? fallbackUser.user_metadata.full_name
          : null,
      email: fallbackUser?.email ?? null,
      preferred_language: null,
      must_change_password: false,
    }
  );
}

export async function getPlatformRoles(userId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("platform_role_assignments")
    .select("role_code")
    .eq("user_id", userId);

  if (error) {
    if (error.message?.toLowerCase().includes("relation")) {
      return [];
    }
    throw new Error(error.message);
  }

  return (data ?? []).map((row: any) => row.role_code).filter(Boolean);
}

export async function getUserAccessState(userId?: string): Promise<UserAccessState> {
  const user = userId ? { id: userId, email: null, user_metadata: {} } : await requireUser();
  const resolvedUserId = userId ?? user.id;
  const supabase = await createClient();

  const [profile, platformRoles, membershipsResult, rolesResult, linkedMembersResult] =
    await Promise.all([
      getCurrentProfile(resolvedUserId),
      getPlatformRoles(resolvedUserId),
      supabase
        .from("church_users")
        .select("church_id, churches!inner(id, slug, name)")
        .eq("user_id", resolvedUserId)
        .eq("status", "active"),
      supabase
        .from("church_role_assignments")
        .select("church_id, role_definitions(code)")
        .eq("user_id", resolvedUserId)
        .eq("is_active", true),
      supabase
        .from("members")
        .select("church_id")
        .eq("profile_id", resolvedUserId),
    ]);

  if (membershipsResult.error) {
    throw new Error(membershipsResult.error.message);
  }

  if (rolesResult.error) {
    throw new Error(rolesResult.error.message);
  }

  if (linkedMembersResult.error) {
    throw new Error(linkedMembersResult.error.message);
  }

  const accessMap = new Map<string, UserChurchAccessEntry>();

  for (const row of (membershipsResult.data ?? []) as ChurchMembershipRow[]) {
    const church = normalizeJoinedRow(row.churches);
    if (!church?.id || !church.slug) continue;

    accessMap.set(church.id, {
      churchId: church.id,
      churchSlug: church.slug,
      churchName: church.name ?? null,
      hasMembership: true,
      hasMemberLink: false,
      roleCodes: [],
      hasOperationalAccess: false,
    });
  }

  for (const row of (rolesResult.data ?? []) as UserRoleRow[]) {
    const role = normalizeJoinedRow(row.role_definitions);
    if (!row.church_id || !role?.code) continue;

    const existing = accessMap.get(row.church_id);
    if (!existing) continue;

    if (!existing.roleCodes.includes(role.code)) {
      existing.roleCodes.push(role.code);
    }

    if (isOperationalRole(role.code)) {
      existing.hasOperationalAccess = true;
    }
  }

  for (const row of (linkedMembersResult.data ?? []) as LinkedMemberRow[]) {
    const existing = accessMap.get(row.church_id);
    if (!existing) continue;
    existing.hasMemberLink = true;
  }

  const churches = Array.from(accessMap.values());

  return {
    userId: resolvedUserId,
    profile: normalizeProfile(user, profile),
    platformRoles,
    churches,
  };
}

export async function resolvePostAuthDestination(userId?: string): Promise<string> {
  const state = await getUserAccessState(userId);

  if (state.platformRoles.some(isPlatformRole)) {
    return "/platform";
  }

  const primaryChurch = pickPrimaryChurch(state.churches);

  if (!primaryChurch) {
    return "/create-church";
  }

  if (primaryChurch.hasOperationalAccess) {
    return `/c/${primaryChurch.churchSlug}/dashboard`;
  }

  if (primaryChurch.hasMemberLink) {
    return `/my/${primaryChurch.churchSlug}?tab=overview`;
  }

  return `/join/${primaryChurch.churchSlug}`;
}

async function getChurchRouteAccessContext(
  churchSlug: string
): Promise<ChurchAccessContext> {
  const supabase = await createClient();
  const user = await requireUser();

  const { data: church, error: churchError } = await supabase
    .from("churches")
    .select("id, slug, name")
    .eq("slug", churchSlug)
    .eq("is_active", true)
    .maybeSingle<ChurchRow>();

  if (churchError) {
    throw new Error(churchError.message);
  }

  if (!church) {
    unauthorized("/create-church");
  }

  const state = await getUserAccessState(user.id);
  const churchEntry =
    state.churches.find((entry) => entry.churchId === church.id) ??
    state.churches.find((entry) => entry.churchSlug === churchSlug) ??
    null;

  const isPlatformAdmin = state.platformRoles.some(isPlatformRole);

  if (!isPlatformAdmin && !churchEntry?.hasMembership) {
    unauthorized("/create-church");
  }

  const roles = [...new Set([...(state.platformRoles ?? []), ...(churchEntry?.roleCodes ?? [])])];

  return {
    userId: user.id,
    churchId: church.id,
    churchSlug: church.slug,
    churchName: church.name ?? church.slug,
    profile: state.profile,
    roles,
    isPlatformAdmin,
    hasOperationalAccess: Boolean(isPlatformAdmin || churchEntry?.hasOperationalAccess),
    hasMemberLink: Boolean(churchEntry?.hasMemberLink),
  };
}

export async function requireChurchAccess(churchSlug: string): Promise<ChurchAccessContext> {
  return getChurchRouteAccessContext(churchSlug);
}

export async function requireChurchWorkspaceAccess(
  churchSlug: string
): Promise<ChurchAccessContext> {
  const ctx = await getChurchRouteAccessContext(churchSlug);

  if (ctx.isPlatformAdmin || ctx.hasOperationalAccess) {
    return ctx;
  }

  if (ctx.hasMemberLink) {
    unauthorized(`/my/${churchSlug}?tab=overview`);
  }

  unauthorized(`/join/${churchSlug}`);
}

export async function requireMemberPortalAccess(
  churchSlug: string
): Promise<ChurchAccessContext> {
  const ctx = await getChurchRouteAccessContext(churchSlug);

  if (ctx.hasMemberLink) {
    return ctx;
  }

  if (ctx.isPlatformAdmin || ctx.hasOperationalAccess) {
    unauthorized(`/c/${churchSlug}/dashboard`);
  }

  unauthorized(`/join/${churchSlug}`);
}

export async function requireChurchRole(churchSlug: string, allowedRoles: RoleCode[]) {
  const ctx = await requireChurchWorkspaceAccess(churchSlug);

  if (ctx.isPlatformAdmin) {
    return ctx;
  }

  const hasRole = ctx.roles.some((role) => allowedRoles.includes(role as RoleCode));
  if (!hasRole) unauthorized(`/c/${churchSlug}/dashboard`);

  return ctx;
}

export async function requirePlatformAdmin() {
  const user = await requireUser();
  const roles = await getPlatformRoles(user.id);

  if (!roles.some(isPlatformRole)) {
    unauthorized("/");
  }

  return {
    userId: user.id,
    roles,
  };
}






