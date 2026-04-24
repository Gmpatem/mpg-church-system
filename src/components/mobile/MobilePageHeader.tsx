"use client";

import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import { Plus } from "lucide-react";

interface MobilePageHeaderProps {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  actionHref?: string;
  onActionClick?: () => void;
  className?: string;
}

export function MobilePageHeader({
  title,
  subtitle,
  actionLabel,
  actionHref,
  onActionClick,
  className,
}: MobilePageHeaderProps) {
  return (
    <div className={cn("flex items-center justify-between gap-3 py-2 md:hidden", className)}>
      <div className="min-w-0">
        <h1 className="text-lg font-bold text-slate-950">{title}</h1>
        {subtitle ? <p className="text-xs text-slate-500">{subtitle}</p> : null}
      </div>

      {(actionLabel && (actionHref || onActionClick)) ? (
        actionHref ? (
          <Link
            href={actionHref}
            className="mobile-touch-feedback inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-blue-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            <span>{actionLabel}</span>
          </Link>
        ) : (
          <button
            type="button"
            onClick={onActionClick}
            className="mobile-touch-feedback inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-blue-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            <span>{actionLabel}</span>
          </button>
        )
      ) : null}
    </div>
  );
}
