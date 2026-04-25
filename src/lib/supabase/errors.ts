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
  const relationName = relation.toLowerCase();
  const fqRelationName = `public.${relationName}`;

  return (
    code === "42p01" ||
    code === "pgrst205" ||
    (combined.includes("relation") &&
      combined.includes("does not exist") &&
      combined.includes(relationName)) ||
    (combined.includes("could not find the table") &&
      (combined.includes(relationName) || combined.includes(fqRelationName))) ||
    (combined.includes("schema cache") &&
      (combined.includes(relationName) || combined.includes(fqRelationName)))
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
