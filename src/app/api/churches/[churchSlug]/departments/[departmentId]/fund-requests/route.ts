import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireChurchAccess } from "@/features/access/queries";
import { isDepartmentLeaderForUser } from "@/features/department-finance/helpers";

const ALLOWED_OUTFLOW_TYPES = [
  "project",
  "evangelism",
  "mission_remittance",
  "department_expense",
  "operations",
  "welfare",
  "equipment",
  "other",
] as const;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ churchSlug: string; departmentId: string }> }
) {
  try {
    const { churchSlug, departmentId } = await params;
    const ctx = await requireChurchAccess(churchSlug);
    const supabase = await createClient();

    // Validate department belongs to church
    const { data: department, error: deptError } = await supabase
      .from("church_departments")
      .select("id, department_name")
      .eq("church_id", ctx.churchId)
      .eq("id", departmentId)
      .maybeSingle();

    if (deptError || !department) {
      return NextResponse.json({ error: "Department not found." }, { status: 404 });
    }

    // Validate submitter is department leader
    const canSubmit = await isDepartmentLeaderForUser({
      supabase,
      churchId: ctx.churchId,
      userId: ctx.userId,
      departmentId,
    });

    if (!canSubmit) {
      return NextResponse.json(
        { error: "Only active department leaders can submit fund requests." },
        { status: 403 }
      );
    }

    const body = await request.json();

    const {
      title,
      purpose,
      fundId,
      amount,
      outflowType,
      outflowDate,
      preferredFundId,
      referenceNumber,
      eventId,
      payee,
      projectName,
      note,
    } = body;

    if (!title || !purpose || !fundId || !outflowDate || !Number.isFinite(Number(amount)) || Number(amount) <= 0) {
      return NextResponse.json(
        { error: "Please complete all required fields for this request." },
        { status: 400 }
      );
    }

    if (!ALLOWED_OUTFLOW_TYPES.includes(outflowType)) {
      return NextResponse.json(
        { error: "Invalid outflow category for department request." },
        { status: 400 }
      );
    }

    // Validate fund belongs to church
    const { data: fundRow } = await supabase
      .from("treasury_funds")
      .select("id, department_id")
      .eq("church_id", ctx.churchId)
      .eq("id", fundId)
      .maybeSingle();

    if (!fundRow) {
      return NextResponse.json({ error: "Selected fund does not belong to this church." }, { status: 400 });
    }

    if (fundRow.department_id !== undefined && fundRow.department_id !== null && fundRow.department_id !== departmentId) {
      return NextResponse.json(
        { error: "Selected fund must be the department's mapped fund." },
        { status: 400 }
      );
    }

    // Validate event belongs to department
    if (eventId) {
      const { data: eventRow } = await supabase
        .from("church_events")
        .select("id")
        .eq("church_id", ctx.churchId)
        .eq("id", eventId)
        .eq("department_id", departmentId)
        .maybeSingle();

      if (!eventRow) {
        return NextResponse.json(
          { error: "Selected event does not belong to this department." },
          { status: 400 }
        );
      }
    }

    const { data: inserted, error: insertError } = await supabase
      .from("department_fund_requests")
      .insert({
        church_id: ctx.churchId,
        department_id: departmentId,
        requested_by_user_id: ctx.userId,
        title,
        purpose,
        amount: Number(amount),
        outflow_type: outflowType,
        fund_id: fundId,
        outflow_date: outflowDate,
        reference_number: referenceNumber || null,
        event_id: eventId || null,
        preferred_fund_id: preferredFundId ?? fundId,
        payee: payee || null,
        project_name: projectName || null,
        note: note || null,
        requested_date: outflowDate,
        status: "pending",
      })
      .select("id")
      .single();

    if (insertError || !inserted) {
      return NextResponse.json(
        { error: insertError?.message || "Failed to create fund request." },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, id: inserted.id, message: "Fund request submitted." });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to process request.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
