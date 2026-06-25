const DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

function isLeapYear(year: number) {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}

function daysInMonth(year: number, month: number) {
  if (month === 2) return isLeapYear(year) ? 29 : 28;
  if ([4, 6, 9, 11].includes(month)) return 30;
  return 31;
}

export function normalizeDateOnly(value: unknown, label = "Date") {
  if (value == null) return null;

  if (typeof value !== "string") {
    throw new Error(`${label} must be a valid date.`);
  }

  const trimmed = value.trim();
  if (!trimmed) return null;

  const match = DATE_ONLY_PATTERN.exec(trimmed);
  if (!match) {
    throw new Error(`${label} must use YYYY-MM-DD format.`);
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  if (month < 1 || month > 12 || day < 1 || day > daysInMonth(year, month)) {
    throw new Error(`${label} must be a valid calendar date.`);
  }

  return trimmed;
}
