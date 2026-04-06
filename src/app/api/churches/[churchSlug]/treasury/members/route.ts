import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireChurchAccess } from "@/features/access/queries";

interface RouteContext {
  params: Promise<{ churchSlug: string }>;
}

const TREASURY_ROLES = ["church_admin", "treasurer", "pastor"];

export async function GET(_request: Request, context: RouteContext) {
  const { churchSlug } = await context.params;
  const ctx = await requireChurchAccess(churchSlug);

  // Check treasury role access using already-fetched roles
  const hasTreasuryAccess = ctx.roles.some((role) => TREASURY_ROLES.includes(role));
  if (!hasTreasuryAccess) {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
  }

  const supabase = await createClient();

  // Narrow select: only fields needed for treasury member selection dropdown
  const { data, error } = await supabase
    .from("members")
    .select("id, display_name, first_name, last_name, member_code")
    .eq("church_id", ctx.churchId)
    .eq("membership_status", "active")
    .order("last_name", { ascending: true })
    .order("first_name", { ascending: true })
    .limit(500);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ members: data ?? [] });
}
