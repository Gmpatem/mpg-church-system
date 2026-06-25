export const CHURCH_GENDER_OPTIONS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
] as const;

export const CHURCH_GENDER_VALUES = ["male", "female"] as const;

export type ChurchGender = (typeof CHURCH_GENDER_VALUES)[number];

export const CHURCH_GENDER_LABELS: Record<ChurchGender, string> = {
  male: "Male",
  female: "Female",
};

export function normalizeChurchGender(value: unknown, label = "Gender") {
  if (value == null) return null;

  if (typeof value !== "string") {
    throw new Error(`${label} must be male or female.`);
  }

  const trimmed = value.trim();
  if (!trimmed) return null;

  if (trimmed !== "male" && trimmed !== "female") {
    throw new Error(`${label} must be male or female.`);
  }

  return trimmed;
}
