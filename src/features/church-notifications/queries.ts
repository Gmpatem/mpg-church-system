import "server-only";

import { createClient } from "@/lib/supabase/server";
import { getOfficeWorkspaceData } from "@/features/office/queries";

export async function getChurchNotifications(churchId: string, churchSlug?: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated.");
  }

  let dbNotifications: any[] = [];

  const { data, error } = await supabase
    .from("church_notifications")
    .select("id, title, message, href, event_type, entity_type, entity_id, is_read, read_at, created_at")
    .eq("church_id", churchId)
    .eq("target_user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(12);

  if (!error) {
    dbNotifications = (data ?? []).map((item: any) => ({
      ...item,
      kind: "db",
    }));
  }

  let officeNotifications: any[] = [];

  if (churchSlug) {
    try {
      const officeData = await getOfficeWorkspaceData(churchSlug);
      officeNotifications = (officeData.notifications ?? []).map((item: any) => ({
        ...item,
        kind: "office_signal",
        entity_type: item.entity_type ?? "office_signal",
        is_read: false,
        read_at: null,
      }));
    } catch {
      officeNotifications = [];
    }
  }

  const merged = [...dbNotifications, ...officeNotifications]
    .sort((a, b) => String(b.created_at ?? "").localeCompare(String(a.created_at ?? "")))
    .slice(0, 12);

  return merged;
}
