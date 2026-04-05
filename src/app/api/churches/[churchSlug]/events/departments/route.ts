import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireChurchAccess } from "@/features/access/queries";

interface Ctx {
  params: Promise<{ churchSlug: string }>;
}

export async function GET(_req: Request, ctx: Ctx) {
  const { churchSlug } = await ctx.params;

  const access = await requireChurchAccess(churchSlug);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("church_departments")
    .select("id, department_name, is_active")
    .eq("church_id", access.churchId)
    .order("department_name", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ departments: data ?? [] });
}
