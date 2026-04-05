"use client";

import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ChurchHeader } from "@/components/navigation/ChurchHeader";
import { ChurchSidebar } from "@/components/navigation/ChurchSidebar";

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
  notifications?: ChurchNotificationItem[];
}

export function ChurchShell({
  church,
  user,
  roleLabel,
  children,
  showAccessControl = false,
  notifications = [],
}: ChurchShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-100 lg:grid lg:grid-cols-[272px_minmax(0,1fr)]">
      <aside className="hidden border-r border-slate-200 bg-slate-950 lg:block lg:h-screen lg:sticky lg:top-0">
        <ChurchSidebar
          church={church}
          user={user}
          roleLabel={roleLabel}
          showAccessControl={showAccessControl}
        />
      </aside>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-[272px] p-0 sm:max-w-[272px]">
          <SheetHeader className="sr-only">
            <SheetTitle>Church navigation menu</SheetTitle>
          </SheetHeader>

          <ChurchSidebar
            church={church}
            user={user}
            roleLabel={roleLabel}
            onNavigate={() => setMobileOpen(false)}
            showAccessControl={showAccessControl}
          />
        </SheetContent>
      </Sheet>

      <div className="min-w-0">
        <ChurchHeader
          church={church}
          user={user}
          roleLabel={roleLabel}
          notifications={notifications}
          onOpenSidebar={() => setMobileOpen(true)}
        />

        <main className="px-4 py-5 md:px-6 xl:px-8">
          <div className="mx-auto w-full max-w-[1500px]">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
