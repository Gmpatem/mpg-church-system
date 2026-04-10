"use client";

import type { ReactNode } from "react";

type MemberPortalMobileHeaderProps = {
  churchName: string;
  memberName: string;
  onOpenProfileMenu: () => void;
  actions?: ReactNode;
};

function getInitials(value: string) {
  const clean = value.trim();
  if (!clean) return "M";

  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

export function MemberPortalMobileHeader({
  churchName,
  memberName,
  onOpenProfileMenu,
  actions,
}: MemberPortalMobileHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-2.5 sm:px-6 lg:px-8">
      <div className="flex min-w-0 items-center gap-2.5">
        <div className="h-7 w-7 shrink-0 rounded-lg bg-gradient-to-br from-blue-700 to-teal-500" />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-900">{churchName}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {actions}
        <button
          type="button"
          onClick={onOpenProfileMenu}
          className="mobile-touch-feedback inline-flex h-8 w-8 items-center justify-center rounded-full border border-blue-200 bg-slate-100 text-xs font-semibold text-slate-700 transition hover:bg-slate-200"
          aria-label="Open profile menu"
        >
          {getInitials(memberName)}
        </button>
      </div>
    </div>
  );
}
