import { NextResponse } from "next/server";
import { getDepartmentWorkspaceBundle } from "@/app/(church)/c/[churchSlug]/departments/components/adapters";

interface Ctx {
  params: Promise<{
    churchSlug: string;
    departmentId: string;
  }>;
}

export async function GET(_request: Request, ctx: Ctx) {
  try {
    const { churchSlug, departmentId } = await ctx.params;
    const bundle = await getDepartmentWorkspaceBundle(churchSlug, departmentId);

    if (!bundle) {
      return NextResponse.json({ error: "Department not found." }, { status: 404 });
    }

    return NextResponse.json({ bundle });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to load department workspace data.",
      },
      { status: 500 }
    );
  }
}
