import "server-only";

import { createClient } from "@/lib/supabase/server";
import { requireChurchAccess } from "@/features/access/queries";
import { getPendingApprovalQueue } from "@/features/approvals/queries";

async function ensureDepartmentBelongsToChurch(supabase: any, churchId: string, departmentId: string) {
  const { data, error } = await supabase
    .from("church_departments")
    .select("id, department_name, description")
    .eq("church_id", churchId)
    .eq("id", departmentId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

export async function getDepartmentAnnouncementDepartment(churchSlug: string, departmentId: string) {
  const ctx = await requireChurchAccess(churchSlug);
  const supabase = await createClient();

  return ensureDepartmentBelongsToChurch(supabase, ctx.churchId, departmentId);
}

export async function getDepartmentAnnouncements(churchSlug: string, departmentId: string) {
  const ctx = await requireChurchAccess(churchSlug);
  const supabase = await createClient();

  const department = await ensureDepartmentBelongsToChurch(supabase, ctx.churchId, departmentId);
  if (!department) {
    return { department: null, announcements: [] };
  }

  const { data, error } = await supabase
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
    .eq("department_id", departmentId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  const announcements = data ?? [];
  const creatorIds = announcements.map((a) => a.created_by_user_id).filter(Boolean);

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

  return {
    department,
    announcements: announcements.map((item) => {
      const approval = approvalQueue.find(
        (entry) => entry.entity_type === "department_announcement" && entry.entity_id === item.id
      );

      return {
        ...item,
        department_name: department.department_name,
        created_by_name: item.created_by_user_id ? profileMap.get(item.created_by_user_id) ?? null : null,
        approval_status: approval?.status ?? null,
        approval_stage: approval?.current_stage ?? null,
        approval_request_id: approval?.id ?? null,
      };
    }),
  };
}

