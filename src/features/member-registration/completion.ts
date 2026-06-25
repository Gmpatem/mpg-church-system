"use server";

import { createClient } from "@/lib/supabase/server";

type ServerSupabaseClient = Awaited<ReturnType<typeof createClient>>;

export type ProfileCompletionResult = {
  percent: number;
  status: "complete" | "partial" | "minimal";
  missingFields: string[];
};

export function calculateMemberProfileCompletion(
  member: Partial<{ first_name: string | null; last_name: string | null; email: string | null; phone: string | null; date_of_birth: string | null; gender: string | null; address: string | null; city: string | null; country: string | null; marital_status: string | null; profession: string | null; emergency_contact_name: string | null; emergency_contact_phone: string | null; household_id: string | null }>
): ProfileCompletionResult {
  const fields: { key: keyof typeof member; label: string; weight: number }[] = [
    { key: "first_name", label: "first name", weight: 10 },
    { key: "last_name", label: "last name", weight: 10 },
    { key: "email", label: "email", weight: 10 },
    { key: "phone", label: "phone", weight: 10 },
    { key: "date_of_birth", label: "date of birth", weight: 10 },
    { key: "gender", label: "gender", weight: 5 },
    { key: "address", label: "address", weight: 10 },
    { key: "city", label: "city", weight: 5 },
    { key: "country", label: "country", weight: 5 },
    { key: "marital_status", label: "marital status", weight: 5 },
    { key: "profession", label: "profession", weight: 5 },
    { key: "emergency_contact_name", label: "emergency contact name", weight: 5 },
    { key: "emergency_contact_phone", label: "emergency contact phone", weight: 5 },
    { key: "household_id", label: "household", weight: 5 },
  ];

  const missingFields: string[] = [];
  let earned = 0;
  let total = 0;

  for (const field of fields) {
    total += field.weight;
    const value = member[field.key];
    if (value !== null && value !== undefined && value !== "") {
      earned += field.weight;
    } else {
      missingFields.push(field.label);
    }
  }

  const percent = total > 0 ? Math.round((earned / total) * 100) : 0;
  const status: ProfileCompletionResult["status"] =
    percent >= 90 ? "complete" : percent >= 50 ? "partial" : "minimal";

  return { percent, status, missingFields };
}

export async function maybePersistProfileCompletion(
  _supabase: ServerSupabaseClient,
  _memberId: string
): Promise<void> {
  // The live schema currently does not include profile_completion_* columns.
  // When those columns are added, this helper can update members row with
  // calculated percent/status/missing fields.
}
