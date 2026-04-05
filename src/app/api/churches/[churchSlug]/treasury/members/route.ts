import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireChurchRole } from "@/features/access/queries";

interface RouteContext {
  params: Promise<{ churchSlug: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  const { churchSlug } = await context.params;
  const ctx = await requireChurchRole(churchSlug, ["church_admin", "treasurer", "pastor"]);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("members")
    .select("id, display_name, first_name, last_name, member_code")
    .eq("church_id", ctx.churchId)
    .order("last_name", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ members: data ?? [] });
}
