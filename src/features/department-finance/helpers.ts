import "server-only";

const TREASURY_MANAGER_ROLE_CODES = ["church_admin", "pastor", "treasurer"] as const;

type NotificationRow = {
  church_id: string;
  target_user_id: string;
  event_type: string;
  entity_type: string;
  entity_id: string;
  title: string;
  message: string;
  href: string;
  is_read: boolean;
};

function uniqueStrings(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.filter((value): value is string => Boolean(value))));
}

export function isTreasuryManagerContext(roles: string[], _isPlatformAdmin: boolean) {
  return roles.some((role) =>
    (TREASURY_MANAGER_ROLE_CODES as readonly string[]).includes(role)
  );
}

async function getMemberIdsForUser(
  supabase: any,
  churchId: string,
  userId: string
): Promise<string[]> {
  const { data, error } = await supabase
    .from("members")
    .select("id")
    .eq("church_id", churchId)
    .eq("profile_id", userId);

  if (error) throw new Error(error.message);
  return uniqueStrings((data ?? []).map((row: any) => row.id));
}

export async function isDepartmentLeaderForUser(params: {
  supabase: any;
  churchId: string;
  userId: string;
  departmentId: string;
}) {
  const { supabase, churchId, userId, departmentId } = params;
  const memberIds = await getMemberIdsForUser(supabase, churchId, userId);
  if (memberIds.length === 0) return false;

  const { data: leadershipRows, error: leadershipError } = await supabase
    .from("department_leadership_assignments")
    .select("id")
    .eq("church_id", churchId)
    .eq("department_id", departmentId)
    .eq("is_active", true)
    .in("member_id", memberIds)
    .limit(1);

  if (leadershipError) throw new Error(leadershipError.message);
  if ((leadershipRows ?? []).length > 0) return true;

  const { data: assignmentRows, error: assignmentError } = await supabase
    .from("member_departments")
    .select("role_title")
    .eq("church_id", churchId)
    .eq("department_id", departmentId)
    .eq("is_active", true)
    .in("member_id", memberIds);

  if (assignmentError) throw new Error(assignmentError.message);

  const leadershipKeywords = [
    "leader",
    "head",
    "director",
    "coordinator",
    "pastor",
    "elder",
    "captain",
    "chair",
    "manager",
    "supervisor",
  ];

  return (assignmentRows ?? []).some((row: any) => {
    const roleTitle = String(row.role_title ?? "").toLowerCase();
    if (!roleTitle) return false;
    return leadershipKeywords.some((keyword) => roleTitle.includes(keyword));
  });
}

export async function getTreasuryManagerUserIds(supabase: any, churchId: string) {
  const { data, error } = await supabase
    .from("church_role_assignments")
    .select("user_id, start_date, end_date, role_definitions(code)")
    .eq("church_id", churchId)
    .eq("is_active", true);

  if (error) throw new Error(error.message);

  const today = new Date().toISOString().slice(0, 10);
  const roleUserIds = (data ?? [])
    .map((row: any) => {
      const role = Array.isArray(row.role_definitions)
        ? row.role_definitions[0]
        : row.role_definitions;
      const code = role?.code ?? null;
      if (!code || !(TREASURY_MANAGER_ROLE_CODES as readonly string[]).includes(code)) {
        return null;
      }
      const startsOn = typeof row.start_date === "string" ? row.start_date : null;
      const endsOn = typeof row.end_date === "string" ? row.end_date : null;
      const startsOk = !startsOn || startsOn <= today;
      const endsOk = !endsOn || endsOn >= today;
      if (!startsOk || !endsOk) return null;
      return row.user_id as string | null;
    })
    .filter(Boolean);

  const candidateIds = uniqueStrings(roleUserIds);
  if (candidateIds.length === 0) return [];

  const { data: membershipRows, error: membershipError } = await supabase
    .from("church_users")
    .select("user_id")
    .eq("church_id", churchId)
    .eq("status", "active")
    .in("user_id", candidateIds);

  if (membershipError) throw new Error(membershipError.message);
  return uniqueStrings((membershipRows ?? []).map((row: any) => row.user_id));
}

export async function getMemberProfileId(
  supabase: any,
  churchId: string,
  memberId: string | null
) {
  if (!memberId) return null;

  const { data, error } = await supabase
    .from("members")
    .select("profile_id")
    .eq("church_id", churchId)
    .eq("id", memberId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return (data?.profile_id as string | null) ?? null;
}

export async function getDepartmentMemberProfileIds(
  supabase: any,
  churchId: string,
  departmentId: string
) {
  const { data: assignmentRows, error: assignmentError } = await supabase
    .from("member_departments")
    .select("member_id")
    .eq("church_id", churchId)
    .eq("department_id", departmentId)
    .eq("is_active", true);

  if (assignmentError) throw new Error(assignmentError.message);

  const memberIds = uniqueStrings((assignmentRows ?? []).map((row: any) => row.member_id));
  if (memberIds.length === 0) return [];

  const { data: memberRows, error: memberError } = await supabase
    .from("members")
    .select("profile_id")
    .eq("church_id", churchId)
    .in("id", memberIds)
    .not("profile_id", "is", null);

  if (memberError) throw new Error(memberError.message);
  return uniqueStrings((memberRows ?? []).map((row: any) => row.profile_id));
}

export async function getDepartmentLeaderProfileIds(
  supabase: any,
  churchId: string,
  departmentId: string
) {
  const { data: leaderRows, error: leaderError } = await supabase
    .from("department_leadership_assignments")
    .select("member_id")
    .eq("church_id", churchId)
    .eq("department_id", departmentId)
    .eq("is_active", true);

  if (leaderError) throw new Error(leaderError.message);

  const memberIds = uniqueStrings((leaderRows ?? []).map((row: any) => row.member_id));
  if (memberIds.length === 0) return [];

  const { data: memberRows, error: memberError } = await supabase
    .from("members")
    .select("profile_id")
    .eq("church_id", churchId)
    .in("id", memberIds)
    .not("profile_id", "is", null);

  if (memberError) throw new Error(memberError.message);
  return uniqueStrings((memberRows ?? []).map((row: any) => row.profile_id));
}

export async function insertChurchNotifications(supabase: any, rows: NotificationRow[]) {
  if (rows.length === 0) return;

  const deduped = Array.from(
    new Map(
      rows.map((row) => [
        `${row.church_id}:${row.target_user_id}:${row.entity_type}:${row.entity_id}:${row.event_type}:${row.href}`,
        row,
      ])
    ).values()
  );

  const { error } = await supabase.from("church_notifications").insert(deduped);
  if (error) throw new Error(error.message);
}

export function formatCurrencyLabel(amount: number) {
  return amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
