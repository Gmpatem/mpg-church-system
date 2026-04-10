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

export async function getPlatformMembersSnapshot(limit: number = 30) {
  await requirePlatformAdmin();

  const supabase = await createClient();

  const [
    { data: members, error: membersError },
    { count: totalMembers, error: totalMembersError },
    { count: activeMembers, error: activeMembersError },
    { count: householdsLinked, error: householdsLinkedError },
  ] = await Promise.all([
    supabase
      .from("members")
      .select(`
        id,
        first_name,
        last_name,
        display_name,
        email,
        phone,
        membership_status,
        household_id,
        created_at,
        church_id,
        churches:church_id (
          name,
          slug
        )
      `)
      .order("created_at", { ascending: false })
      .limit(limit),
    supabase.from("members").select("id", { count: "exact", head: true }),
    supabase.from("members").select("id", { count: "exact", head: true }).eq("membership_status", "active"),
    supabase.from("members").select("id", { count: "exact", head: true }).not("household_id", "is", null),
  ]);

  if (membersError) throw new Error(membersError.message);
  if (totalMembersError) throw new Error(totalMembersError.message);
  if (activeMembersError) throw new Error(activeMembersError.message);
  if (householdsLinkedError) throw new Error(householdsLinkedError.message);

  return {
    rows: members ?? [],
    totals: {
      totalMembers: totalMembers ?? 0,
      activeMembers: activeMembers ?? 0,
      householdLinked: householdsLinked ?? 0,
    },
  };
}

export async function getPlatformMemberById(memberId: string) {
  await requirePlatformAdmin();

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("members")
    .select(`
      id,
      member_code,
      first_name,
      last_name,
      display_name,
      email,
      phone,
      membership_status,
      household_role,
      household_id,
      created_at,
      church_id,
      churches:church_id (
        id,
        name,
        slug
      )
    `)
    .eq("id", memberId)
    .maybeSingle();

  if (error) throw new Error(error.message);

  return data;
}

export async function getPlatformEventsSnapshot(limit: number = 24) {
  await requirePlatformAdmin();

  const supabase = await createClient();
  const nowIso = new Date().toISOString();

  const [
    { data: events, error: eventsError },
    { count: totalEvents, error: totalEventsError },
    { count: upcomingEvents, error: upcomingEventsError },
    { count: pendingApprovals, error: pendingApprovalsError },
  ] = await Promise.all([
    supabase
      .from("church_events")
      .select(`
        id,
        title,
        location,
        start_datetime,
        end_datetime,
        status,
        workflow_state,
        church_id,
        churches:church_id (
          name,
          slug
        )
      `)
      .order("start_datetime", { ascending: true })
      .limit(limit),
    supabase.from("church_events").select("id", { count: "exact", head: true }),
    supabase
      .from("church_events")
      .select("id", { count: "exact", head: true })
      .gte("start_datetime", nowIso)
      .neq("status", "cancelled"),
    supabase
      .from("church_events")
      .select("id", { count: "exact", head: true })
      .eq("workflow_state", "pending_approval"),
  ]);

  if (eventsError) throw new Error(eventsError.message);
  if (totalEventsError) throw new Error(totalEventsError.message);
  if (upcomingEventsError) throw new Error(upcomingEventsError.message);
  if (pendingApprovalsError) throw new Error(pendingApprovalsError.message);

  return {
    rows: events ?? [],
    totals: {
      totalEvents: totalEvents ?? 0,
      upcomingEvents: upcomingEvents ?? 0,
      pendingApprovals: pendingApprovals ?? 0,
    },
  };
}

export async function getPlatformEventById(eventId: string) {
  await requirePlatformAdmin();

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("church_events")
    .select(`
      id,
      title,
      description,
      event_type,
      location,
      start_datetime,
      end_datetime,
      is_all_day,
      status,
      workflow_state,
      approval_note,
      church_id,
      churches:church_id (
        id,
        name,
        slug
      )
    `)
    .eq("id", eventId)
    .maybeSingle();

  if (error) throw new Error(error.message);

  return data;
}

export async function getPlatformTreasurySnapshot(limit: number = 12) {
  await requirePlatformAdmin();

  const supabase = await createClient();

  const [
    { count: fundCount, error: fundCountError },
    { data: inflows, error: inflowsError },
    { data: outflows, error: outflowsError },
    { data: recentInflows, error: recentInflowsError },
  ] = await Promise.all([
    supabase.from("treasury_funds").select("id", { count: "exact", head: true }),
    supabase.from("treasury_inflows").select("amount"),
    supabase.from("treasury_outflows").select("amount"),
    supabase
      .from("treasury_inflows")
      .select(`
        id,
        amount,
        inflow_type,
        inflow_date,
        is_anonymous,
        church_id,
        churches:church_id (
          name,
          slug
        )
      `)
      .order("inflow_date", { ascending: false })
      .limit(limit),
  ]);

  if (fundCountError) throw new Error(fundCountError.message);
  if (inflowsError) throw new Error(inflowsError.message);
  if (outflowsError) throw new Error(outflowsError.message);
  if (recentInflowsError) throw new Error(recentInflowsError.message);

  const totalIn = (inflows ?? []).reduce((sum: number, row: any) => sum + Number(row.amount || 0), 0);
  const totalOut = (outflows ?? []).reduce((sum: number, row: any) => sum + Number(row.amount || 0), 0);

  return {
    recentInflows: recentInflows ?? [],
    totals: {
      fundCount: fundCount ?? 0,
      totalIn,
      totalOut,
      netBalance: totalIn - totalOut,
    },
  };
}

export async function getPlatformHouseholdsSnapshot(limit: number = 24) {
  await requirePlatformAdmin();

  const supabase = await createClient();

  const [
    { data: households, error: householdsError },
    { count: totalHouseholds, error: totalHouseholdsError },
    { count: totalMembers, error: totalMembersError },
  ] = await Promise.all([
    supabase
      .from("households")
      .select(`
        id,
        household_name,
        city,
        country,
        created_at,
        church_id,
        churches:church_id (
          name,
          slug
        )
      `)
      .order("created_at", { ascending: false })
      .limit(limit),
    supabase.from("households").select("id", { count: "exact", head: true }),
    supabase.from("members").select("id", { count: "exact", head: true }).not("household_id", "is", null),
  ]);

  if (householdsError) throw new Error(householdsError.message);
  if (totalHouseholdsError) throw new Error(totalHouseholdsError.message);
  if (totalMembersError) throw new Error(totalMembersError.message);

  return {
    rows: households ?? [],
    totals: {
      totalHouseholds: totalHouseholds ?? 0,
      membersLinkedToHouseholds: totalMembers ?? 0,
    },
  };
}

export async function getPlatformApprovalsSnapshot(limit: number = 20) {
  await requirePlatformAdmin();

  const supabase = await createClient();

  const [
    { data: pendingEvents, error: pendingEventsError },
    { data: openTickets, error: openTicketsError },
  ] = await Promise.all([
    supabase
      .from("church_events")
      .select(`
        id,
        title,
        start_datetime,
        workflow_state,
        church_id,
        churches:church_id (
          name,
          slug
        )
      `)
      .eq("workflow_state", "pending_approval")
      .order("start_datetime", { ascending: true })
      .limit(limit),
    supabase
      .from("platform_support_tickets")
      .select(`
        id,
        subject,
        status,
        priority,
        created_at,
        church_id,
        churches:church_id (
          name,
          slug
        )
      `)
      .in("status", ["open", "in_progress"])
      .order("created_at", { ascending: false })
      .limit(limit),
  ]);

  if (pendingEventsError) throw new Error(pendingEventsError.message);
  if (openTicketsError) throw new Error(openTicketsError.message);

  return {
    pendingEvents: pendingEvents ?? [],
    openTickets: openTickets ?? [],
    totals: {
      pendingEvents: (pendingEvents ?? []).length,
      openTickets: (openTickets ?? []).length,
    },
  };
}

export async function getPlatformCalendarSnapshot(limit: number = 30) {
  await requirePlatformAdmin();

  const supabase = await createClient();
  const nowIso = new Date().toISOString();

  const { data, error } = await supabase
    .from("church_events")
    .select(`
      id,
      title,
      start_datetime,
      end_datetime,
      status,
      location,
      church_id,
      churches:church_id (
        name,
        slug
      )
    `)
    .gte("start_datetime", nowIso)
    .order("start_datetime", { ascending: true })
    .limit(limit);

  if (error) throw new Error(error.message);

  return data ?? [];
}

export async function getPlatformAccessControlSnapshot() {
  await requirePlatformAdmin();

  const supabase = await createClient();

  const [
    { count: platformRoleCount, error: platformRoleCountError },
    { count: churchRoleCount, error: churchRoleCountError },
    { count: activeChurchUsers, error: activeChurchUsersError },
    { count: totalChurchUsers, error: totalChurchUsersError },
  ] = await Promise.all([
    supabase.from("platform_role_assignments").select("id", { count: "exact", head: true }),
    supabase.from("church_role_assignments").select("id", { count: "exact", head: true }),
    supabase.from("church_users").select("id", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("church_users").select("id", { count: "exact", head: true }),
  ]);

  if (platformRoleCountError) throw new Error(platformRoleCountError.message);
  if (churchRoleCountError) throw new Error(churchRoleCountError.message);
  if (activeChurchUsersError) throw new Error(activeChurchUsersError.message);
  if (totalChurchUsersError) throw new Error(totalChurchUsersError.message);

  return {
    platformRoleCount: platformRoleCount ?? 0,
    churchRoleCount: churchRoleCount ?? 0,
    activeChurchUsers: activeChurchUsers ?? 0,
    pendingOrInactiveChurchUsers: (totalChurchUsers ?? 0) - (activeChurchUsers ?? 0),
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

