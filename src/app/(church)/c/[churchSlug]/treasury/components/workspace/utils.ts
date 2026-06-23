"use client";

import type { TreasuryPeriodKey } from "./types";

export function formatTreasuryAmount(value: number | string | null | undefined) {
  const amount = Number(value || 0);
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
    currency: "XAF",
    currencyDisplay: "code",
    style: "currency",
  }).format(Number.isFinite(amount) ? amount : 0);
}

export function formatSignedAmount(value: number | string | null | undefined) {
  const amount = Number(value || 0);
  const prefix = amount > 0 ? "+" : amount < 0 ? "-" : "";
  return `${prefix}${formatTreasuryAmount(Math.abs(amount))}`;
}

export function formatDate(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatDateTime(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function humanize(value?: string | null) {
  if (!value) return "-";
  return value
    .replace(/_/g, " ")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function getPeriodRange(period: TreasuryPeriodKey, customFrom?: string, customTo?: string) {
  const now = new Date();
  const start = new Date(now);
  const end = new Date(now);
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);

  if (period === "this-week") {
    const day = now.getDay();
    start.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
  } else if (period === "this-month") {
    start.setDate(1);
  } else if (period === "this-quarter") {
    const quarterStartMonth = Math.floor(now.getMonth() / 3) * 3;
    start.setMonth(quarterStartMonth, 1);
  } else if (period === "this-year") {
    start.setMonth(0, 1);
  } else if (period === "custom") {
    const customStart = customFrom ? new Date(`${customFrom}T00:00:00`) : null;
    const customEnd = customTo ? new Date(`${customTo}T23:59:59`) : null;
    return {
      from: customStart && !Number.isNaN(customStart.getTime()) ? customStart : null,
      to: customEnd && !Number.isNaN(customEnd.getTime()) ? customEnd : null,
    };
  }

  return { from: start, to: end };
}

export function isWithinPeriod(rowDate: string | null | undefined, period: TreasuryPeriodKey, from?: string, to?: string) {
  if (!rowDate) return false;
  const date = new Date(`${rowDate}T12:00:00`);
  if (Number.isNaN(date.getTime())) return false;
  const range = getPeriodRange(period, from, to);
  if (range.from && date < range.from) return false;
  if (range.to && date > range.to) return false;
  return true;
}

export function percent(part: number, whole: number) {
  if (!whole) return 0;
  return Math.max(0, Math.min(100, Math.round((part / whole) * 100)));
}

export function initials(label?: string | null) {
  const parts = String(label || "Treasury")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  return (parts[0]?.[0] || "T").toUpperCase() + (parts[1]?.[0] || "").toUpperCase();
}

