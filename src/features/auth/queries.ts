import "server-only";
import { createClient } from "@/lib/supabase/server";

export async function getCurrentUser() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error) throw new Error(error.message);

  return data.user ?? null;
}

/**
 * Resolves where an authenticated user should land after login.
 *
 * Priority:
 *  1. Platform owner / admin / support → /platform
 *  2. Church operational staff          → /c/[churchSlug]/dashboard
 *  3. Linked church member              → /my/[churchSlug]?tab=overview
 *  4. No church at all                  → /create-church
 *  5. Fallback with church access       → /c/[churchSlug]/dashboard
 */
export async function getPostLoginDestination(userId: string): Promise<string> {
  const supabase = await createClient();

  const { data: platformRoles, error: platformError } = await supabase
    .from("platform_role_assignments")
    .select("role_code")
    .eq("user_id", userId);

  if (platformError) {
    throw new Error(platformError.message);
  }

  const isPlatformAdmin = (platformRoles ?? []).some((row: { role_code: string }) =>
    ["platform_owner", "platform_admin", "platform_support"].includes(row.role_code)
  );

  if (isPlatformAdmin) {
    return "/platform";
  }

  const { data: memberships, error: membershipError } = await supabase
    .from("church_users")
    .select("church_id, churches!inner(slug)")
    .eq("user_id", userId)
    .eq("status", "active")
    .order("is_primary", { ascending: false })
    .limit(1);

  if (membershipError) {
    throw new Error(membershipError.message);
  }

  const firstChurchRow = memberships?.[0] ?? null;
  const firstChurch = firstChurchRow
    ? {
        church_id: (firstChurchRow as any).church_id as string,
        churches: Array.isArray((firstChurchRow as any).churches)
          ? (firstChurchRow as any).churches[0]
          : (firstChurchRow as any).churches,
      }
    : null;

  if (!firstChurch?.churches?.slug) {
    return "/create-church";
  }

  const churchId = firstChurch.church_id;
  const churchSlug = firstChurch.churches.slug;

  const { data: roleRows, error: roleError } = await supabase
    .from("church_role_assignments")
    .select("role_definitions(code)")
    .eq("church_id", churchId)
    .eq("user_id", userId)
    .eq("is_active", true);

  if (roleError) {
    throw new Error(roleError.message);
  }

  const operationalRoles =
    (roleRows ?? [])
      .map((row: any) => row.role_definitions?.code as string | undefined)
      .filter(Boolean) as string[];

  const isOperationalUser = operationalRoles.some((code) =>
    ["church_admin", "pastor", "elder", "clerk", "treasurer"].includes(code)
  );

  if (isOperationalUser) {
    return "/c/" + churchSlug + "/dashboard";
  }

  const { data: linkedMember, error: memberError } = await supabase
    .from("members")
    .select("id")
    .eq("church_id", churchId)
    .eq("profile_id", userId)
    .maybeSingle();

  if (memberError) {
    throw new Error(memberError.message);
  }

  if (linkedMember) {
    return "/my/" + churchSlug + "?tab=overview";
  }

  return "/c/" + churchSlug + "/dashboard";
}

