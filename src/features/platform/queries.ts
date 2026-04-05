import "server-only";

import { createClient } from "@/lib/supabase/server";
import { requirePlatformAdmin } from "@/features/access/queries";

export async function getPlatformChurches() {
  await requirePlatformAdmin();

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("churches")
    .select("id, name, slug, is_active, created_at, default_language, country, city, timezone, email, phone")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  return data ?? [];
}

export async function getPlatformChurchById(churchId: string) {
  await requirePlatformAdmin();

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("churches")
    .select("id, name, slug, is_active, created_at, updated_at, default_language, country, city, timezone, address, email, phone, logo_url")
    .eq("id", churchId)
    .maybeSingle();

  if (error) throw new Error(error.message);

  return data;
}

export async function getPlatformChurchStats(churchId: string) {
  await requirePlatformAdmin();

  const supabase = await createClient();

  const [
    { count: memberCount, error: memberError },
    { count: householdCount, error: householdError },
    { count: departmentCount, error: departmentError },
    { count: userCount, error: userError }
  ] = await Promise.all([
    supabase.from("members").select("*", { count: "exact", head: true }).eq("church_id", churchId),
    supabase.from("households").select("*", { count: "exact", head: true }).eq("church_id", churchId),
    supabase.from("church_departments").select("*", { count: "exact", head: true }).eq("church_id", churchId),
    supabase.from("church_users").select("*", { count: "exact", head: true }).eq("church_id", churchId),
  ]);

  if (memberError) throw new Error(memberError.message);
  if (householdError) throw new Error(householdError.message);
  if (departmentError) throw new Error(departmentError.message);
  if (userError) throw new Error(userError.message);

  return {
    members: memberCount ?? 0,
    households: householdCount ?? 0,
    departments: departmentCount ?? 0,
    churchUsers: userCount ?? 0,
  };
}
export async function getPlatformSettings() {
  await requirePlatformAdmin();

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("platform_settings")
    .select("*")
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);

  return data;
}

export async function getPlatformSupportTickets() {
  await requirePlatformAdmin();

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("platform_support_tickets")
    .select(`
      id,
      church_id,
      requested_by_user_id,
      subject,
      description,
      status,
      priority,
      source,
      assigned_to_user_id,
      created_at,
      updated_at,
      churches:church_id (
        id,
        name,
        slug
      ),
      requester:requested_by_user_id (
        id,
        full_name,
        email
      )
    `)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  return data ?? [];
}

export async function getPlatformSupportTicketById(ticketId: string) {
  await requirePlatformAdmin();

  const supabase = await createClient();

  const { data: ticket, error: ticketError } = await supabase
    .from("platform_support_tickets")
    .select(`
      id,
      church_id,
      requested_by_user_id,
      subject,
      description,
      status,
      priority,
      source,
      assigned_to_user_id,
      created_at,
      updated_at,
      churches:church_id (
        id,
        name,
        slug
      ),
      requester:requested_by_user_id (
        id,
        full_name,
        email
      )
    `)
    .eq("id", ticketId)
    .maybeSingle();

  if (ticketError) throw new Error(ticketError.message);

  const { data: messages, error: messagesError } = await supabase
    .from("platform_support_ticket_messages")
    .select(`
      id,
      ticket_id,
      author_user_id,
      body,
      is_internal,
      created_at,
      author:author_user_id (
        id,
        full_name,
        email
      )
    `)
    .eq("ticket_id", ticketId)
    .order("created_at", { ascending: true });

  if (messagesError) throw new Error(messagesError.message);

  return {
    ticket,
    messages: messages ?? [],
  };
}

export async function getPlatformDashboardMetrics() {
  await requirePlatformAdmin();

  const supabase = await createClient();

  const [
    { data: churches, error: churchesError },
    { count: membersCount, error: membersError },
    { count: householdsCount, error: householdsError },
    { count: departmentsCount, error: departmentsError },
    { count: churchUsersCount, error: churchUsersError }
  ] = await Promise.all([
    supabase
      .from("churches")
      .select("id, name, slug, is_active, created_at, default_language, city, country", { count: "exact" })
      .order("created_at", { ascending: false }),
    supabase.from("members").select("*", { count: "exact", head: true }),
    supabase.from("households").select("*", { count: "exact", head: true }),
    supabase.from("church_departments").select("*", { count: "exact", head: true }),
    supabase.from("church_users").select("*", { count: "exact", head: true }),
  ]);

  if (churchesError) throw new Error(churchesError.message);
  if (membersError) throw new Error(membersError.message);
  if (householdsError) throw new Error(householdsError.message);
  if (departmentsError) throw new Error(departmentsError.message);
  if (churchUsersError) throw new Error(churchUsersError.message);

  const churchRows = churches ?? [];
  const totalChurches = churchRows.length;
  const activeChurches = churchRows.filter((church) => church.is_active).length;
  const inactiveChurches = totalChurches - activeChurches;

  const languageCounts = churchRows.reduce((acc, church) => {
    const key = (church.default_language ?? "unknown").toUpperCase();
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const createdByMonthMap = churchRows.reduce((acc, church) => {
    const date = church.created_at ? new Date(church.created_at) : null;
    if (!date || Number.isNaN(date.getTime())) return acc;

    const key = date.toLocaleString("en-US", { month: "short", year: "2-digit", timeZone: "UTC" });
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const monthlyChurchCreation = Object.entries(createdByMonthMap).map(([month, churches]) => ({
    month,
    churches,
  }));

  const activeInactiveBreakdown = [
    { name: "Active", value: activeChurches, color: "#10b981" },
    { name: "Inactive", value: inactiveChurches, color: "#9ca3af" },
  ];

  const languageDistribution = Object.entries(languageCounts).map(([name, value], index) => {
    const palette = ["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444"];
    return {
      name,
      value,
      color: palette[index % palette.length],
    };
  });

  return {
    totals: {
      churches: totalChurches,
      activeChurches,
      inactiveChurches,
      members: membersCount ?? 0,
      households: householdsCount ?? 0,
      departments: departmentsCount ?? 0,
      churchUsers: churchUsersCount ?? 0,
    },
    churches: churchRows,
    monthlyChurchCreation,
    activeInactiveBreakdown,
    languageDistribution,
  };
}

export async function getPlatformNotifications() {
  await requirePlatformAdmin();

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated.");
  }

  const { data, error } = await supabase
    .from("platform_notifications")
    .select("id, event_type, entity_type, entity_id, title, message, href, is_read, read_at, created_at")
    .eq("target_user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(12);

  if (error) throw new Error(error.message);

  return (data ?? []).map((item) => ({
    id: item.id,
    type: item.event_type,
    title: item.title,
    message: item.message,
    created_at: item.created_at,
    href: item.href,
    is_unread: !item.is_read,
  }));
}

