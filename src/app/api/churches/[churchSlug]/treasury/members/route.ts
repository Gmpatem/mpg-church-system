import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireChurchAccess } from "@/features/access/queries";

interface RouteContext {
  params: Promise<{ churchSlug: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { churchSlug } = await context.params;
    const ctx = await requireChurchAccess(churchSlug);
    const hasTreasuryAccess = ctx.roles.some((role) =>
      ["church_admin", "treasurer", "pastor", "platform_owner", "platform_admin", "platform_support"].includes(role)
    );

    if (!hasTreasuryAccess) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("members")
      .select("id, display_name, first_name, last_name, member_code")
      .eq("church_id", ctx.churchId)
      .order("last_name", { ascending: true })
      .order("first_name", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ members: data ?? [] });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load treasury members";
    const status = message.toLowerCase().includes("insufficient permissions") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
