"use client";

import Link from "next/link";
import { cn } from "@/lib/utils/cn";

interface StatItem {
  label: string;
  value: string | number;
  href?: string;
  tone?: "default" | "attention" | "success" | "danger";
}

interface MobileCompactStatsStripProps {
  items: StatItem[];
  className?: string;
}

export function MobileCompactStatsStrip({ items, className }: MobileCompactStatsStripProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-1 overflow-x-auto py-2 text-sm md:hidden",
        className
      )}
    >
      {items.map((item, i) => {
        const toneClasses =
          item.tone === "attention"
            ? "text-amber-700"
            : item.tone === "success"
              ? "text-emerald-700"
              : item.tone === "danger"
                ? "text-rose-700"
                : "text-slate-700";

        const content = (
          <span className={cn("inline-flex items-center gap-1 whitespace-nowrap", toneClasses)}>
            <span className="font-medium">{item.label}</span>
            <span className="font-semibold">
              {typeof item.value === "number" ? item.value.toLocaleString("en-US") : item.value}
            </span>
          </span>
        );

        const inner = item.href ? (
          <Link href={item.href} className="hover:underline">
            {content}
          </Link>
        ) : (
          content
        );

        return (
          <span key={item.label + i} className="inline-flex items-center">
            {i > 0 && <span className="mx-1.5 text-slate-300">·</span>}
            {inner}
          </span>
        );
      })}
    </div>
  );
}
