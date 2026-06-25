import "server-only";

import { createClient } from "@/lib/supabase/server";
import { requireChurchAccess } from "@/features/access/queries";
import { getPendingApprovalQueue } from "@/features/approvals/queries";
import type { AnnouncementWorkspaceItem } from "./types";

export async function getChurchAnnouncements(churchSlug: string) {
  const ctx = await requireChurchAccess(churchSlug);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("church_announcements")
    .select(`
      id,
      church_id,
      department_id,
      title,
      body,
      audience_scope,
      status,
      requires_acknowledgement,
      published_at,
      expires_at,
      created_by_user_id,
      approved_by_user_id,
      approval_note,
      metadata,
      created_at,
      updated_at
    `)
    .eq("church_id", ctx.churchId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  const announcements = data ?? [];
  const departmentIds = announcements.map((a) => a.department_id).filter(Boolean);
  const creatorIds = announcements.map((a) => a.created_by_user_id).filter(Boolean);

  let departmentMap = new Map<string, string>();
  if (departmentIds.length > 0) {
    const { data: departments, error: deptError } = await supabase
      .from("church_departments")
      .select("id, department_name")
      .eq("church_id", ctx.churchId)
      .in("id", departmentIds);

    if (deptError) throw new Error(deptError.message);

    departmentMap = new Map((departments ?? []).map((d) => [d.id, d.department_name]));
  }

  let profileMap = new Map<string, string>();
  if (creatorIds.length > 0) {
    const { data: profiles, error: profileError } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .in("id", creatorIds);

    if (profileError) throw new Error(profileError.message);

    profileMap = new Map(
      (profiles ?? []).map((p) => [p.id, p.full_name || p.email || "Unknown user"])
    );
  }

  const approvalQueue = await getPendingApprovalQueue(churchSlug, "announcements");

  return announcements.map((item) => {
    const approval = approvalQueue.find(
      (entry) => entry.entity_type === "church_announcement" && entry.entity_id === item.id
    );

    return {
      ...item,
      department_name: item.department_id ? departmentMap.get(item.department_id) ?? null : null,
      created_by_name: item.created_by_user_id ? profileMap.get(item.created_by_user_id) ?? null : null,
      approval_status: approval?.status ?? null,
      approval_stage: approval?.current_stage ?? null,
      approval_request_id: approval?.id ?? null,
    };
  });
}

export async function getAnnouncementDepartments(churchSlug: string) {
  const ctx = await requireChurchAccess(churchSlug);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("church_departments")
    .select("id, department_name")
    .eq("church_id", ctx.churchId)
    .eq("is_active", true)
    .order("department_name", { ascending: true });

  if (error) throw new Error(error.message);

  return data ?? [];
}

export async function getAnnouncementWorkspaceItems(
  churchSlug: string
): Promise<AnnouncementWorkspaceItem[]> {
  const ctx = await requireChurchAccess(churchSlug);
  const supabase = await createClient();

  const [churchResult, departmentResult, approvalQueue] = await Promise.all([
    supabase
      .from("church_announcements")
      .select(`
        id,
        church_id,
        department_id,
        title,
        body,
        audience_scope,
        status,
        requires_acknowledgement,
        published_at,
        expires_at,
        created_by_user_id,
        approved_by_user_id,
        approval_note,
        metadata,
        created_at,
        updated_at
      `)
      .eq("church_id", ctx.churchId)
      .order("created_at", { ascending: false }),
    supabase
      .from("department_announcements")
      .select(`
        id,
        church_id,
        department_id,
        title,
        body,
        audience_scope,
        status,
        requires_acknowledgement,
        published_at,
        expires_at,
        created_by_user_id,
        approved_by_user_id,
        approval_note,
        metadata,
        created_at,
        updated_at
      `)
      .eq("church_id", ctx.churchId)
      .order("created_at", { ascending: false }),
    getPendingApprovalQueue(churchSlug, "announcements"),
  ]);

  if (churchResult.error) throw new Error(churchResult.error.message);
  if (departmentResult.error) throw new Error(departmentResult.error.message);

  const churchRows = churchResult.data ?? [];
  const departmentRows = departmentResult.data ?? [];
  const departmentIds = Array.from(
    new Set(
      [...churchRows, ...departmentRows]
        .map((item) => item.department_id)
        .filter((value): value is string => Boolean(value))
    )
  );
  const creatorIds = Array.from(
    new Set(
      [...churchRows, ...departmentRows]
        .map((item) => item.created_by_user_id)
        .filter((value): value is string => Boolean(value))
    )
  );

  let departmentMap = new Map<string, string>();
  if (departmentIds.length > 0) {
    const { data: departments, error: departmentError } = await supabase
      .from("church_departments")
      .select("id, department_name")
      .eq("church_id", ctx.churchId)
      .in("id", departmentIds);

    if (departmentError) throw new Error(departmentError.message);
    departmentMap = new Map((departments ?? []).map((item) => [item.id, item.department_name]));
  }

  let profileMap = new Map<string, string>();
  if (creatorIds.length > 0) {
    const { data: profiles, error: profileError } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .in("id", creatorIds);

    if (profileError) throw new Error(profileError.message);
    profileMap = new Map(
      (profiles ?? []).map((profile) => [
        profile.id,
        profile.full_name || profile.email || "Unknown user",
      ])
    );
  }

  const churchItems: AnnouncementWorkspaceItem[] = churchRows.map((item) => {
    const approval = approvalQueue.find(
      (entry) => entry.entity_type === "church_announcement" && entry.entity_id === item.id
    );

    return {
      ...item,
      workspace_id: `church:${item.id}`,
      source_type: "church",
      source_label: "Church",
      department_name: item.department_id ? departmentMap.get(item.department_id) ?? null : null,
      created_by_name: item.created_by_user_id
        ? profileMap.get(item.created_by_user_id) ?? null
        : null,
      approval_status: approval?.status ?? null,
      approval_stage: approval?.current_stage ?? null,
      approval_request_id: approval?.id ?? null,
    };
  });

  const departmentItems: AnnouncementWorkspaceItem[] = departmentRows.map((item) => {
    const approval = approvalQueue.find(
      (entry) => entry.entity_type === "department_announcement" && entry.entity_id === item.id
    );
    const departmentName = departmentMap.get(item.department_id) ?? "Department";

    return {
      ...item,
      workspace_id: `department:${item.id}`,
      source_type: "department",
      source_label: departmentName,
      department_name: departmentName,
      created_by_name: item.created_by_user_id
        ? profileMap.get(item.created_by_user_id) ?? null
        : null,
      approval_status: approval?.status ?? null,
      approval_stage: approval?.current_stage ?? null,
      approval_request_id: approval?.id ?? null,
    };
  });

  return [...churchItems, ...departmentItems].sort((a, b) =>
    String(b.created_at ?? "").localeCompare(String(a.created_at ?? ""))
  );
}

