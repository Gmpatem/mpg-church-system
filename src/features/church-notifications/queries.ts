import "server-only";

import { createClient } from "@/lib/supabase/server";

export async function getChurchNotifications(churchId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated.");
  }

  const { data, error } = await supabase
    .from("church_notifications")
    .select("id, title, message, href, event_type, entity_type, entity_id, is_read, read_at, created_at")
    .eq("church_id", churchId)
    .eq("target_user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(12);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((item: any) => ({
    ...item,
    kind: "db",
  }));
}
