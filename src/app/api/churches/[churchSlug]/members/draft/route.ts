import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireChurchRole } from "@/features/access/queries";

function getString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function buildMemberCode(churchSlug: string) {
  const prefix = churchSlug.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 6) || "CHURCH";
  const suffix = Date.now().toString().slice(-6);
  return prefix + "-" + suffix;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ churchSlug: string }> }
) {
  try {
    const { churchSlug } = await params;
    const ctx = await requireChurchRole(churchSlug, ["church_admin", "pastor", "elder", "clerk"]);
    const supabase = await createClient();

    const body = await request.json();

    const firstName = getString(body.firstName);
    const lastName = getString(body.lastName);
    const displayName = getString(body.displayName);
    const email = getString(body.email);
    const phone = getString(body.phone);
    const gender = getString(body.gender);
    const membershipStatus = getString(body.membershipStatus) || "active";
    const membershipType = getString(body.membershipType);
    const memberCode = getString(body.memberCode) || buildMemberCode(churchSlug);
    const householdId = getString(body.householdId) || null;
    const householdRole = getString(body.householdRole);
    const dateJoined = getString(body.dateJoined);
    const dateOfBirth = getString(body.dateOfBirth);
    const baptismDate = getString(body.baptismDate);
    const city = getString(body.city);
    const country = getString(body.country);
    const address = getString(body.address);
    const profession = getString(body.profession);
    const maritalStatus = getString(body.maritalStatus);
    const emergencyContactName = getString(body.emergencyContactName);
    const emergencyContactPhone = getString(body.emergencyContactPhone);
    const notes = getString(body.notes);

    if (!firstName || !lastName) {
      return NextResponse.json(
        { error: "First name and last name are required." },
        { status: 400 }
      );
    }

    const resolvedDisplayName = displayName || `${firstName} ${lastName}`.trim();

    const { data: createdMember, error } = await supabase
      .from("members")
      .insert({
        church_id: ctx.churchId,
        first_name: firstName,
        last_name: lastName,
        display_name: resolvedDisplayName,
        email: email || null,
        phone: phone || null,
        gender: gender || null,
        membership_status: membershipStatus,
        membership_type: membershipType || null,
        member_code: memberCode,
        household_id: householdId,
        household_role: householdRole || null,
        date_joined: dateJoined || null,
        date_of_birth: dateOfBirth || null,
        baptism_date: baptismDate || null,
        city: city || null,
        country: country || null,
        address: address || null,
        profession: profession || null,
        marital_status: maritalStatus || null,
        emergency_contact_name: emergencyContactName || null,
        emergency_contact_phone: emergencyContactPhone || null,
        notes: notes || null,
        created_by_user_id: ctx.userId,
      })
      .select("id")
      .single();

    if (error || !createdMember) {
      return NextResponse.json(
        { error: error?.message || "Failed to create member." },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, memberId: createdMember.id, message: "Member created successfully." });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create member.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
