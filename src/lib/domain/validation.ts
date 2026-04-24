export function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export function getBoolean(formData: FormData, key: string) {
  const value = formData.get(key);
  return value === "true" || value === "on";
}

export function getNumber(formData: FormData, key: string) {
  const raw = getString(formData, key);
  const num = Number(raw);
  return Number.isFinite(num) ? num : Number.NaN;
}
