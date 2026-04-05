import type { CreateChurchInput } from "./types";

export function validateCreateChurchInput(input: CreateChurchInput) {
  if (!input.name?.trim()) {
    throw new Error("Church name is required.");
  }

  if (!input.slug?.trim()) {
    throw new Error("Church slug is required.");
  }

  if (!/^[a-z0-9-]+$/.test(input.slug)) {
    throw new Error("Slug must contain only lowercase letters, numbers, and hyphens.");
  }
}
