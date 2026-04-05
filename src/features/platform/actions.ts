"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requirePlatformAdmin } from "@/features/access/queries";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function getBoolean(formData: FormData, key: string) {
  return formData.get(key) === "on";
}

async function createPlatformNotification(
  supabase: Awaited<ReturnType<typeof createClient>>,
  input: {
    targetUserId: string;
    eventType: "church_created" | "support_ticket" | "system";
    entityType?: string | null;
    entityId?: string | null;
    title: string;
    message: string;
    href: string;
  }
) {
  const { error } = await supabase.from("platform_notifications").insert({
    target_user_id: input.targetUserId,
    event_type: input.eventType,
    entity_type: input.entityType ?? null,
    entity_id: input.entityId ?? null,
    title: input.title,
    message: input.message,
    href: input.href,
    is_read: false,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function setChurchActiveStateAction(
  _prevState: { ok: boolean; error?: string } | null,
  formData: FormData
) {
  try {
    await requirePlatformAdmin();

    const supabase = await createClient();

    const churchId = getString(formData, "church_id");
    const nextActiveRaw = getString(formData, "next_active");

    if (!churchId) {
      return { ok: false, error: "Church ID is required." };
    }

    const nextActive = nextActiveRaw === "true";

    const { data: church, error: churchLookupError } = await supabase
      .from("churches")
      .select("id, name, slug")
      .eq("id", churchId)
      .maybeSingle();

    if (churchLookupError) {
      return { ok: false, error: churchLookupError.message };
    }

    const { error } = await supabase
      .from("churches")
      .update({ is_active: nextActive })
      .eq("id", churchId);

    if (error) {
      return { ok: false, error: error.message };
    }

    await createPlatformNotification(supabase, {
      targetUserId: "7678429e-07f3-4686-9811-07a5bfa7cd73",
      eventType: "system",
      entityType: "church",
      entityId: churchId,
      title: nextActive ? "Church activated" : "Church deactivated",
      message: (church?.name ?? "Church") + (nextActive ? " was activated." : " was deactivated."),
      href: "/platform/churches/" + churchId,
    });

    revalidatePath("/platform");
    revalidatePath("/platform/churches");
    revalidatePath("/platform/churches/" + churchId);

    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to update church status.",
    };
  }
}

export async function savePlatformSettingsAction(formData: FormData) {
  await requirePlatformAdmin();

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated.");
  }

  const payload = {
    platform_name: getString(formData, "platform_name") || "MPG Church System",
    support_email: getString(formData, "support_email") || null,
    default_timezone: getString(formData, "default_timezone") || "UTC",
    default_language: getString(formData, "default_language") || "en",
    require_strong_passwords: getBoolean(formData, "require_strong_passwords"),
    allow_platform_admin_override: getBoolean(formData, "allow_platform_admin_override"),
    enable_login_alerts: getBoolean(formData, "enable_login_alerts"),
    notify_new_church_registration: getBoolean(formData, "notify_new_church_registration"),
    notify_support_ticket_alerts: getBoolean(formData, "notify_support_ticket_alerts"),
    notify_billing_reminders: getBoolean(formData, "notify_billing_reminders"),
    default_plan_code: getString(formData, "default_plan_code") || "starter",
    trial_duration_days: Number(getString(formData, "trial_duration_days") || "14"),
    grace_period_days: Number(getString(formData, "grace_period_days") || "7"),
    updated_by_user_id: user.id,
  };

  const { data: existing, error: existingError } = await supabase
    .from("platform_settings")
    .select("id")
    .limit(1)
    .maybeSingle();

  if (existingError) throw new Error(existingError.message);

  if (existing?.id) {
    const { error } = await supabase
      .from("platform_settings")
      .update(payload)
      .eq("id", existing.id);

    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase
      .from("platform_settings")
      .insert(payload);

    if (error) throw new Error(error.message);
  }

  revalidatePath("/platform/settings");
}

export async function createPlatformSupportTicketAction(formData: FormData) {
  await requirePlatformAdmin();

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated.");
  }

  const subject = getString(formData, "subject");
  const description = getString(formData, "description");
  const priority = getString(formData, "priority") || "medium";
  const churchId = getString(formData, "church_id") || null;

  if (!subject) {
    throw new Error("Subject is required.");
  }

  const { data: insertedTicket, error } = await supabase
    .from("platform_support_tickets")
    .insert({
      church_id: churchId,
      requested_by_user_id: user.id,
      subject,
      description: description || null,
      priority,
      source: "platform_admin",
      status: "open",
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  await createPlatformNotification(supabase, {
    targetUserId: user.id,
    eventType: "support_ticket",
    entityType: "platform_support_ticket",
    entityId: insertedTicket.id,
    title: priority === "urgent" ? "Urgent support ticket" : "New support ticket",
    message: subject,
    href: "/platform/support",
  });

  revalidatePath("/platform/support");
  revalidatePath("/platform");
}

export async function updatePlatformSupportTicketStatusAction(formData: FormData) {
  await requirePlatformAdmin();

  const supabase = await createClient();

  const ticketId = getString(formData, "ticket_id");
  const status = getString(formData, "status");

  if (!ticketId || !status) {
    throw new Error("Ticket and status are required.");
  }

  const { data: ticket, error: ticketLookupError } = await supabase
    .from("platform_support_tickets")
    .select("id, subject")
    .eq("id", ticketId)
    .maybeSingle();

  if (ticketLookupError) throw new Error(ticketLookupError.message);

  const { error } = await supabase
    .from("platform_support_tickets")
    .update({ status })
    .eq("id", ticketId);

  if (error) throw new Error(error.message);

  await createPlatformNotification(supabase, {
    targetUserId: "7678429e-07f3-4686-9811-07a5bfa7cd73",
    eventType: "support_ticket",
    entityType: "platform_support_ticket",
    entityId: ticketId,
    title: "Support ticket updated",
    message: (ticket?.subject ?? "Support ticket") + " is now " + status.replace("_", " ") + ".",
    href: "/platform/support",
  });

  revalidatePath("/platform/support");
  revalidatePath("/platform");
}

export async function addPlatformSupportMessageAction(formData: FormData) {
  await requirePlatformAdmin();

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated.");
  }

  const ticketId = getString(formData, "ticket_id");
  const body = getString(formData, "body");
  const isInternal = getBoolean(formData, "is_internal");

  if (!ticketId || !body) {
    throw new Error("Ticket and message are required.");
  }

  const { error } = await supabase
    .from("platform_support_ticket_messages")
    .insert({
      ticket_id: ticketId,
      author_user_id: user.id,
      body,
      is_internal: isInternal,
    });

  if (error) throw new Error(error.message);

  revalidatePath("/platform/support");
}

export async function markPlatformNotificationReadAction(formData: FormData) {
  await requirePlatformAdmin();

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated.");
  }

  const notificationId = getString(formData, "notification_id");

  if (!notificationId) {
    throw new Error("Notification ID is required.");
  }

  const { error } = await supabase
    .from("platform_notifications")
    .update({
      is_read: true,
      read_at: new Date().toISOString(),
    })
    .eq("id", notificationId)
    .eq("target_user_id", user.id);

  if (error) throw new Error(error.message);

  revalidatePath("/platform");
  revalidatePath("/platform/churches");
  revalidatePath("/platform/support");
  revalidatePath("/platform/settings");
}

export async function markAllPlatformNotificationsReadAction() {
  await requirePlatformAdmin();

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated.");
  }

  const { error } = await supabase
    .from("platform_notifications")
    .update({
      is_read: true,
      read_at: new Date().toISOString(),
    })
    .eq("target_user_id", user.id)
    .eq("is_read", false);

  if (error) throw new Error(error.message);

  revalidatePath("/platform");
  revalidatePath("/platform/churches");
  revalidatePath("/platform/support");
  revalidatePath("/platform/settings");
}
