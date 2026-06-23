export const financePalette = [
  "#16a34a",
  "#166534",
  "#2563eb",
  "#f59e0b",
  "#f97316",
  "#7c3aed",
  "#a3a3a3",
];

export function formatOverviewNumber(value: number | null | undefined) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(Number(value ?? 0));
}

export function formatOverviewCurrency(
  value: number | null | undefined,
  locale: string,
  currencyCode: string
) {
  if (value === null || value === undefined) return "—";

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currencyCode,
    currencyDisplay: "code",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatOverviewPercent(value: number | null | undefined) {
  if (value === null || value === undefined || !Number.isFinite(value)) return "—";
  return `${Math.round(value)}%`;
}

export function safeRelativeWidth(value: number, max: number) {
  if (max <= 0) return 0;
  return Math.max(0, Math.min(100, (value / max) * 100));
}
