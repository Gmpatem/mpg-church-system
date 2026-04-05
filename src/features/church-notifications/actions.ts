"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireChurchAccess } from "@/features/access/queries";

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function revalidateChurchNotificationSurfaces(churchSlug: string) {
  revalidatePath(`/c/${churchSlug}`);
  revalidatePath(`/c/${churchSlug}/dashboard`);
  revalidatePath(`/c/${churchSlug}/office`);
  revalidatePath(`/c/${churchSlug}/events`);
  revalidatePath(`/c/${churchSlug}/announcements`);
  revalidatePath(`/c/${churchSlug}/access-control`);
  revalidatePath(`/c/${churchSlug}/leadership`);
  revalidatePath(`/c/${churchSlug}/approvals`);
}

export async function markChurchNotificationReadAction(formData: FormData) {
  const churchSlug = getString(formData, "churchSlug");
  const notificationId = getString(formData, "notificationId");

  if (!churchSlug || !notificationId) {
    return;
  }

  if (!isUuid(notificationId)) {
    return;
  }

  const ctx = await requireChurchAccess(churchSlug);
  const supabase = await createClient();

  const { error } = await supabase
    .from("church_notifications")
    .update({
      is_read: true,
      read_at: new Date().toISOString(),
    })
    .eq("church_id", ctx.churchId)
    .eq("target_user_id", ctx.userId)
    .eq("id", notificationId);

  if (error) {
    throw new Error(error.message);
  }

  revalidateChurchNotificationSurfaces(churchSlug);
}

export async function markAllChurchNotificationsReadAction(formData: FormData) {
  const churchSlug = getString(formData, "churchSlug");

  if (!churchSlug) {
    return;
  }

  const ctx = await requireChurchAccess(churchSlug);
  const supabase = await createClient();

  const { error } = await supabase
    .from("church_notifications")
    .update({
      is_read: true,
      read_at: new Date().toISOString(),
    })
    .eq("church_id", ctx.churchId)
    .eq("target_user_id", ctx.userId)
    .eq("is_read", false);

  if (error) {
    throw new Error(error.message);
  }

  revalidateChurchNotificationSurfaces(churchSlug);
}
