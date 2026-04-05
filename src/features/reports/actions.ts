"use server";

import { createClient } from "@/lib/supabase/server";
import { requireChurchAccess } from "@/features/access/queries";

export async function createReportExport({
  churchSlug,
  reportScope,
  format,
  filters,
}: {
  churchSlug: string;
  reportScope: string;
  format: "pdf" | "excel" | "print";
  filters: any;
}) {
  const ctx = await requireChurchAccess(churchSlug);
  const supabase = await createClient();

  const { error } = await supabase.from("report_exports").insert({
    church_id: ctx.churchId,
    report_scope: reportScope,
    export_format: format,
    filters_json: filters,
    generated_by_user_id: ctx.userId,
    status: "pending",
  });

  if (error) {
    throw new Error(error.message);
  }

  return { ok: true };
}

export async function getReportPresets(churchSlug: string) {
  const ctx = await requireChurchAccess(churchSlug);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("report_presets")
    .select("*")
    .eq("church_id", ctx.churchId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}
