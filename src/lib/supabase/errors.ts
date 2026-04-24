function buildSupabaseErrorText(error: any) {
  return [error?.message, error?.details, error?.hint]
    .map((value) => (typeof value === "string" ? value.toLowerCase() : ""))
    .join(" ");
}

export function normalizeSupabaseErrorMessage(error: any, fallback: string) {
  const parts = [error?.message, error?.details, error?.hint]
    .map((value) => (typeof value === "string" ? value.trim() : ""))
    .filter(Boolean);
  return parts.length > 0 ? parts.join(" ") : fallback;
}

export function isMissingRelationError(error: any, relation: string) {
  const code = String(error?.code || "").toLowerCase();
  const combined = buildSupabaseErrorText(error);

  return (
    code === "42p01" ||
    (combined.includes("relation") &&
      combined.includes("does not exist") &&
      combined.includes(relation.toLowerCase()))
  );
}

export function isMissingColumnError(error: any, column: string) {
  const code = String(error?.code || "").toLowerCase();
  const combined = buildSupabaseErrorText(error);

  return (
    code === "42703" ||
    (combined.includes("column") &&
      combined.includes("does not exist") &&
      combined.includes(column.toLowerCase()))
  );
}
