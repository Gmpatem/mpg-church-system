import "server-only";
import { createClient } from "@/lib/supabase/server";

export async function getChurchBySlug(churchSlug: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("churches")
    .select("*")
    .eq("slug", churchSlug)
    .maybeSingle();

  if (error) throw new Error(error.message);

  return data;
}
