"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireEventManager } from "./queries";
import type { ActionState } from "./types";

const eventSchema = z.object({
  title: z.string().trim().min(1, "Event title is required.").max(200),
  description: z.string().trim().max(1000).optional().default(""),
  event_type: z.string().trim().min(1, "Event type is required.").max(100),
  location: z.string().trim().max(200).optional().default(""),
  start_datetime: z.string().trim().min(1, "Start date/time is required."),
  end_datetime: z.string().trim().min(1, "End date/time is required."),
  is_all_day: z.boolean(),
  status: z.enum(["scheduled", "completed", "cancelled"]),
  department_ids: z.array(z.string().uuid()).default([]),
  is_recurring: z.boolean(),
  recurring_frequency: z.enum(["daily", "weekly"]).optional().default("weekly"),
  recurring_count: z.number().int().min(1).max(52).default(1),
});

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function getBoolean(formData: FormData, key: string) {
  const value = formData.get(key);
  return value === "true" || value === "on";
}

function getNumber(formData: FormData, key: string, fallback: number) {
  const raw = getString(formData, key);
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function getStringArray(formData: FormData, key: string) {
  return formData
    .getAll(key)
    .filter((value): value is string => typeof value === "string")
    .map((value) => value.trim())
    .filter(Boolean);
}

function revalidateEventPaths(churchSlug: string) {
  revalidatePath(`/c/${churchSlug}/events`);
}

async function ensureDepartmentsBelongToChurch(
  supabase: any,
  churchId: string,
  departmentIds: string[]
) {
  if (departmentIds.length === 0) return true;

  const uniqueDepartmentIds = Array.from(new Set(departmentIds));

  const { data, error } = await supabase
    .from("church_departments")
    .select("id")
    .eq("church_id", churchId)
    .in("id", uniqueDepartmentIds);

  if (error) throw new Error(error.message);

  return (data ?? []).length === uniqueDepartmentIds.length;
}

async function syncEventDepartments(
  supabase: any,
  churchId: string,
  eventId: string,
  departmentIds: string[]
) {
  const uniqueDepartmentIds = Array.from(new Set(departmentIds));

  const { error: deleteError } = await supabase
    .from("church_event_departments")
    .delete()
    .eq("church_id", churchId)
    .eq("event_id", eventId);

  if (deleteError) throw new Error(deleteError.message);

  if (uniqueDepartmentIds.length === 0) return;

  const links = uniqueDepartmentIds.map((departmentId) => ({
    church_id: churchId,
    event_id: eventId,
    department_id: departmentId,
  }));

  const { error: insertError } = await supabase
    .from("church_event_departments")
    .insert(links);

  if (insertError) throw new Error(insertError.message);
}

function addInterval(date: Date, frequency: "daily" | "weekly", step: number) {
  const next = new Date(date);
  if (frequency === "daily") {
    next.setDate(next.getDate() + step);
  } else {
    next.setDate(next.getDate() + step * 7);
  }
  return next;
}

export async function createEventAction(
  _prevState: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  const churchSlug = getString(formData, "churchSlug");
  const ctx = await requireEventManager(churchSlug);
  const supabase = await createClient();

  const departmentIds = getStringArray(formData, "department_ids");

  const parsed = eventSchema.safeParse({
    title: getString(formData, "title"),
    description: getString(formData, "description"),
    event_type: getString(formData, "event_type"),
    location: getString(formData, "location"),
    start_datetime: getString(formData, "start_datetime"),
    end_datetime: getString(formData, "end_datetime"),
    is_all_day: getBoolean(formData, "is_all_day"),
    status: getString(formData, "status") || "scheduled",
    department_ids: departmentIds,
    is_recurring: getBoolean(formData, "is_recurring"),
    recurring_frequency: (getString(formData, "recurring_frequency") || "weekly") as "daily" | "weekly",
    recurring_count: getNumber(formData, "recurring_count", 1),
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid event data." };
  }

  const data = parsed.data;

  const baseStart = new Date(data.start_datetime);
  const baseEnd = new Date(data.end_datetime);

  if (Number.isNaN(baseStart.getTime()) || Number.isNaN(baseEnd.getTime())) {
    return { ok: false, error: "Invalid date/time values." };
  }

  if (baseEnd.getTime() < baseStart.getTime()) {
    return { ok: false, error: "End date/time cannot be before start date/time." };
  }

  const validDepartments = await ensureDepartmentsBelongToChurch(
    supabase,
    ctx.churchId,
    data.department_ids
  );

  if (!validDepartments) {
    return { ok: false, error: "One or more selected departments do not belong to this church." };
  }

  const compatibilityDepartmentId = data.department_ids[0] ?? null;
  const totalToCreate = data.is_recurring ? data.recurring_count : 1;

  for (let i = 0; i < totalToCreate; i += 1) {
    const eventStart = addInterval(baseStart, data.recurring_frequency, i);
    const eventEnd = addInterval(baseEnd, data.recurring_frequency, i);

    const { data: insertedEvent, error } = await supabase
      .from("church_events")
      .insert({
        church_id: ctx.churchId,
        title: data.title,
        description: data.description || null,
        event_type: data.event_type,
        department_id: compatibilityDepartmentId,
        location: data.location || null,
        start_datetime: eventStart.toISOString(),
        end_datetime: eventEnd.toISOString(),
        is_all_day: data.is_all_day,
        status: data.status,
        created_by_user_id: ctx.userId,
      })
      .select("id")
      .single();

    if (error) return { ok: false, error: error.message };

    try {
      await syncEventDepartments(supabase, ctx.churchId, insertedEvent.id, data.department_ids);
    } catch (syncError: any) {
      return { ok: false, error: syncError.message ?? "Event created but department sync failed." };
    }
  }

  revalidateEventPaths(churchSlug);

  if (data.is_recurring && totalToCreate > 1) {
    return { ok: true, message: `${totalToCreate} recurring events created successfully.` };
  }

  return { ok: true, message: "Event created successfully." };
}

export async function updateEventAction(
  _prevState: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  const churchSlug = getString(formData, "churchSlug");
  const eventId = getString(formData, "eventId");
  const ctx = await requireEventManager(churchSlug);
  const supabase = await createClient();

  if (!eventId) return { ok: false, error: "Event ID is required." };

  const departmentIds = getStringArray(formData, "department_ids");

  const parsed = eventSchema.safeParse({
    title: getString(formData, "title"),
    description: getString(formData, "description"),
    event_type: getString(formData, "event_type"),
    location: getString(formData, "location"),
    start_datetime: getString(formData, "start_datetime"),
    end_datetime: getString(formData, "end_datetime"),
    is_all_day: getBoolean(formData, "is_all_day"),
    status: getString(formData, "status") || "scheduled",
    department_ids: departmentIds,
    is_recurring: false,
    recurring_frequency: "weekly",
    recurring_count: 1,
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid event data." };
  }

  const data = parsed.data;

  if (new Date(data.end_datetime).getTime() < new Date(data.start_datetime).getTime()) {
    return { ok: false, error: "End date/time cannot be before start date/time." };
  }

  const validDepartments = await ensureDepartmentsBelongToChurch(
    supabase,
    ctx.churchId,
    data.department_ids
  );

  if (!validDepartments) {
    return { ok: false, error: "One or more selected departments do not belong to this church." };
  }

  const compatibilityDepartmentId = data.department_ids[0] ?? null;

  const { error } = await supabase
    .from("church_events")
    .update({
      title: data.title,
      description: data.description || null,
      event_type: data.event_type,
      department_id: compatibilityDepartmentId,
      location: data.location || null,
      start_datetime: data.start_datetime,
      end_datetime: data.end_datetime,
      is_all_day: data.is_all_day,
      status: data.status,
    })
    .eq("church_id", ctx.churchId)
    .eq("id", eventId);

  if (error) return { ok: false, error: error.message };

  try {
    await syncEventDepartments(supabase, ctx.churchId, eventId, data.department_ids);
  } catch (syncError: any) {
    return { ok: false, error: syncError.message ?? "Event updated but department sync failed." };
  }

  revalidateEventPaths(churchSlug);
  return { ok: true, message: "Event updated successfully." };
}

export async function deleteEventAction(
  _prevState: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  const churchSlug = getString(formData, "churchSlug");
  const eventId = getString(formData, "eventId");
  const ctx = await requireEventManager(churchSlug);
  const supabase = await createClient();

  if (!eventId) return { ok: false, error: "Event ID is required." };

  const { error } = await supabase
    .from("church_events")
    .delete()
    .eq("church_id", ctx.churchId)
    .eq("id", eventId);

  if (error) return { ok: false, error: error.message };

  revalidateEventPaths(churchSlug);
  return { ok: true, message: "Event deleted successfully." };
}

export async function updateEventStatusAction(
  _prevState: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  const churchSlug = getString(formData, "churchSlug");
  const eventId = getString(formData, "eventId");
  const status = getString(formData, "status");
  const ctx = await requireEventManager(churchSlug);
  const supabase = await createClient();

  if (!eventId) return { ok: false, error: "Event ID is required." };
  if (!["scheduled", "completed", "cancelled"].includes(status)) {
    return { ok: false, error: "Invalid status." };
  }

  const { error } = await supabase
    .from("church_events")
    .update({ status })
    .eq("church_id", ctx.churchId)
    .eq("id", eventId);

  if (error) return { ok: false, error: error.message };

  revalidateEventPaths(churchSlug);
  return { ok: true, message: "Event status updated successfully." };
}
