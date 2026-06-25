"use client";

import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { OfflineProvider } from "@/components/offline/OfflineProvider";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ChurchPageFrame } from "../patterns/ChurchPageFrame";
import { ChurchLiveRegion } from "../feedback/ChurchLiveRegion";
import { ChurchSidebar } from "./ChurchSidebar";
import { ChurchTopbar } from "./ChurchTopbar";
import type {
  ChurchWorkspaceChurch,
  ChurchWorkspaceNotification,
  ChurchWorkspaceUser,
} from "../types";

interface ChurchAppShellProps {
  church: ChurchWorkspaceChurch;
  user: ChurchWorkspaceUser | null;
  roleLabel?: string;
  children: React.ReactNode;
  showAccessControl?: boolean;
  pendingApprovalCount?: number;
  notifications?: ChurchWorkspaceNotification[];
}

type ChurchShellStyle = CSSProperties & {
  "--church-sidebar-width": string;
};

const SIDEBAR_STORAGE_KEY = "church-workspace-sidebar-collapsed";

export function ChurchAppShell({
  church,
  user,
  roleLabel,
  children,
  showAccessControl = false,
  pendingApprovalCount = 0,
  notifications = [],
}: ChurchAppShellProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    try {
      setSidebarCollapsed(window.localStorage.getItem(SIDEBAR_STORAGE_KEY) === "true");
    } catch {
      setSidebarCollapsed(false);
    }
  }, []);

  function updateSidebarCollapsed(nextValue: boolean) {
    setSidebarCollapsed(nextValue);

    try {
      window.localStorage.setItem(SIDEBAR_STORAGE_KEY, String(nextValue));
    } catch {
      // The layout state remains usable even when storage is unavailable.
    }
  }

  const shellStyle: ChurchShellStyle = {
    "--church-sidebar-width": sidebarCollapsed ? "4.5rem" : "15rem",
  };

  return (
    <OfflineProvider churchSlug={church.slug}>
      <div
        className="church-workspace min-h-screen overflow-x-clip bg-[hsl(var(--church-bg))] text-foreground lg:grid lg:grid-cols-[var(--church-sidebar-width)_minmax(0,1fr)]"
        style={shellStyle}
      >
        <ChurchLiveRegion />
        <aside className="sticky top-0 hidden h-screen min-h-0 w-[var(--church-sidebar-width)] border-r border-white/10 transition-[width] duration-200 motion-reduce:transition-none lg:block">
          <ChurchSidebar
            church={church}
            user={user}
            roleLabel={roleLabel}
            showAccessControl={showAccessControl}
            pendingApprovalCount={pendingApprovalCount}
            collapsed={sidebarCollapsed}
            onCollapsedChange={updateSidebarCollapsed}
          />
        </aside>

        <div className="flex min-w-0 flex-col overflow-x-clip">
          <ChurchTopbar
            church={church}
            user={user}
            roleLabel={roleLabel}
            notifications={notifications}
            onOpenNavigation={() => setMobileNavOpen(true)}
          />

          <main className="min-w-0 flex-1 overflow-x-clip px-[clamp(1rem,2vw,2rem)] py-[clamp(1rem,2vw,1.75rem)]">
            <ChurchPageFrame>{children}</ChurchPageFrame>
          </main>
        </div>

        <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
          <SheetContent side="left" className="w-[min(22rem,88vw)] border-0 bg-[hsl(var(--church-sidebar))] p-0 text-white">
            <SheetHeader className="sr-only">
              <SheetTitle>Church navigation</SheetTitle>
            </SheetHeader>
            <ChurchSidebar
              church={church}
              user={user}
              roleLabel={roleLabel}
              showAccessControl={showAccessControl}
              pendingApprovalCount={pendingApprovalCount}
              onNavigate={() => setMobileNavOpen(false)}
              mobile
            />
          </SheetContent>
        </Sheet>
      </div>
    </OfflineProvider>
  );
}
