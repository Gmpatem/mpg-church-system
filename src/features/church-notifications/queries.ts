import "server-only";

import { createClient } from "@/lib/supabase/server";

export async function getChurchNotifications(churchId: string) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return [];
    }

    const { data, error } = await supabase
      .from("church_notifications")
      .select("id, title, message, href, event_type, entity_type, entity_id, is_read, read_at, created_at")
      .eq("church_id", churchId)
      .eq("target_user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(12);

    if (error) {
      console.error("Failed to fetch church notifications:", error.message);
      return [];
    }

    return (data ?? []).map((item: any) => ({
      ...item,
      kind: "db",
    }));
  } catch (err) {
    // Handle network/fetch errors gracefully
    console.error("Notification fetch error:", err instanceof Error ? err.message : "Unknown error");
    return [];
  }
}
