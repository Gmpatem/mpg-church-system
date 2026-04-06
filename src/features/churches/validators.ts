import type { CreateChurchInput } from "./types";

export function validateCreateChurchInput(input: CreateChurchInput): string | null {
  if (!input.name?.trim()) {
    return "Church name is required.";
  }

  if (!input.slug?.trim()) {
    return "Church slug is required.";
  }

  if (!/^[a-z0-9-]+$/.test(input.slug)) {
    return "Slug must contain only lowercase letters, numbers, and hyphens.";
  }

  return null;
}
