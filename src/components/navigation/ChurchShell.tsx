"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import { ChurchHeader } from "@/components/navigation/ChurchHeader";
import { ChurchSidebar } from "@/components/navigation/ChurchSidebar";
import { ChurchMobileBottomNav } from "@/components/navigation/ChurchMobileBottomNav";
import { ChurchMobileFab } from "@/components/navigation/ChurchMobileFab";

interface ChurchNotificationItem {
  id: string;
  title: string;
  message: string;
  href: string;
  event_type?: string | null;
  entity_type?: string | null;
  entity_id?: string | null;
  is_read: boolean;
  read_at?: string | null;
  created_at?: string | null;
}

interface ChurchShellProps {
  church: {
    id: string;
    name: string;
    slug: string;
  };
  user: {
    id: string;
    full_name: string | null;
    email: string | null;
    avatar_url?: string | null;
  } | null;
  roleLabel?: string;
  children: React.ReactNode;
  showAccessControl?: boolean;
  pendingApprovalCount?: number;
  notifications?: ChurchNotificationItem[];
}

export function ChurchShell({
  church,
  user,
  roleLabel,
  children,
  showAccessControl = false,
  pendingApprovalCount = 0,
  notifications = [],
}: ChurchShellProps) {
  const pathname = usePathname();
  const previousPathRef = useRef(pathname);
  const [routeMotionClass, setRouteMotionClass] = useState<"mobile-route-forward" | "mobile-route-back">(
    "mobile-route-forward"
  );

  useEffect(() => {
    const previousPath = previousPathRef.current;
    if (previousPath === pathname) return;

    const previousSegments = previousPath.split("/").filter(Boolean);
    const nextSegments = pathname.split("/").filter(Boolean);

    const previousModule = previousSegments[2] ?? "dashboard";
    const nextModule = nextSegments[2] ?? "dashboard";

    const rank = (moduleName: string) => {
      if (moduleName === "dashboard") return 0;
      if (moduleName === "members" || moduleName === "households" || moduleName === "departments") return 1;
      if (moduleName === "events" || moduleName === "calendar") return 2;
      if (moduleName === "treasury") return 3;
      return 4;
    };

    if (rank(nextModule) > rank(previousModule)) {
      setRouteMotionClass("mobile-route-forward");
    } else if (rank(nextModule) < rank(previousModule)) {
      setRouteMotionClass("mobile-route-back");
    } else if (nextSegments.length > previousSegments.length) {
      setRouteMotionClass("mobile-route-forward");
    } else {
      setRouteMotionClass("mobile-route-back");
    }

    previousPathRef.current = pathname;
  }, [pathname]);

  const isFocusedTreasuryEntry =
    pathname.includes("/treasury/in/new") ||
    pathname.includes("/treasury/out/new") ||
    /\/treasury\/in\/[^/]+\/edit$/.test(pathname) ||
    /\/treasury\/out\/[^/]+\/edit$/.test(pathname);

  return (
    <div className="min-h-screen bg-white md:grid md:grid-cols-[272px_minmax(0,1fr)]">
      <aside className="hidden border-r border-slate-200 bg-slate-950 md:sticky md:top-0 md:block md:h-screen">
        <ChurchSidebar
          church={church}
          user={user}
          roleLabel={roleLabel}
          showAccessControl={showAccessControl}
          pendingApprovalCount={pendingApprovalCount}
        />
      </aside>

      <div className="min-w-0">
        <ChurchHeader
          church={church}
          user={user}
          roleLabel={roleLabel}
          showAccessControl={showAccessControl}
          notifications={notifications}
          hideMobileModuleRail={isFocusedTreasuryEntry}
        />

        <main className="px-4 py-4 pb-24 sm:px-5 md:px-6 md:py-5 md:pb-6 xl:px-8">
          <div
            key={pathname}
            className={cn("mx-auto w-full max-w-[1500px] mobile-route-frame", routeMotionClass)}
          >
            {children}
          </div>
        </main>
      </div>

      {!isFocusedTreasuryEntry ? (
        <>
          <ChurchMobileBottomNav
            churchSlug={church.slug}
            roleLabel={roleLabel}
            showAccessControl={showAccessControl}
            pendingApprovalCount={pendingApprovalCount}
          />
          <ChurchMobileFab churchSlug={church.slug} />
        </>
      ) : null}
    </div>
  );
}
