"use client";

import { useState } from "react";
import { OfflineProvider } from "@/components/offline/OfflineProvider";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ChurchPageFrame } from "../patterns/ChurchPageFrame";
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

  return (
    <OfflineProvider churchSlug={church.slug}>
      <div className="church-workspace min-h-screen bg-[hsl(var(--church-bg))] text-foreground lg:grid lg:grid-cols-[232px_minmax(0,1fr)] xl:grid-cols-[264px_minmax(0,1fr)]">
        <aside className="sticky top-0 hidden h-screen min-h-0 border-r border-white/10 lg:block">
          <ChurchSidebar
            church={church}
            user={user}
            roleLabel={roleLabel}
            showAccessControl={showAccessControl}
            pendingApprovalCount={pendingApprovalCount}
          />
        </aside>

        <div className="flex min-w-0 flex-col">
          <ChurchTopbar
            church={church}
            user={user}
            roleLabel={roleLabel}
            notifications={notifications}
            onOpenNavigation={() => setMobileNavOpen(true)}
          />

          <main className="min-w-0 flex-1 px-4 py-5 sm:px-5 lg:px-6 lg:py-6 xl:px-8">
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
            />
          </SheetContent>
        </Sheet>
      </div>
    </OfflineProvider>
  );
}
