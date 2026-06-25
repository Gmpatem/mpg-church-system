"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { ChurchPageFrame } from "@/components/church-workspace/patterns/ChurchPageFrame";
import type { EventDialogIntent, EventsCanonicalTab, EventsWorkspaceData } from "@/features/events/types";
import { EventsCalendarTab } from "./EventsCalendarTab";
import { EventsDialogHost } from "./EventsDialogHost";
import { EventsOverviewTab } from "./EventsOverviewTab";
import { EventsRegistryTab } from "./EventsRegistryTab";
import { EventsTabBar } from "./EventsTabBar";
import { EventsWorkspaceHeader } from "./EventsWorkspaceHeader";

export function EventsWorkspace({
  churchSlug,
  data,
}: {
  churchSlug: string;
  data: EventsWorkspaceData;
}) {
  const pathname = usePathname();
  const [activeTab, setActiveTabState] = useState<EventsCanonicalTab>(data.navigation.activeTab);
  const [dialog, setDialog] = useState<EventDialogIntent>(data.navigation.dialog);

  function replaceTabQuery(tab: EventsCanonicalTab) {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (tab === "events") {
      params.delete("tab");
    } else {
      params.set("tab", tab);
    }
    params.delete("dialog");
    const query = params.toString();
    window.history.replaceState(null, "", query ? `${pathname}?${query}` : pathname);
  }

  function setActiveTab(tab: EventsCanonicalTab) {
    setActiveTabState(tab);
    replaceTabQuery(tab);
  }

  function setActiveDialog(nextDialog: EventDialogIntent) {
    setDialog(nextDialog);
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (!nextDialog) {
      params.delete("dialog");
    } else {
      params.set("dialog", nextDialog.type);
      if (nextDialog.type === "edit") {
        params.set("eventId", nextDialog.eventId);
      }
    }
    const query = params.toString();
    window.history.replaceState(null, "", query ? `${pathname}?${query}` : pathname);
  }

  return (
    <ChurchPageFrame className="church-workspace min-w-0 space-y-4">
      <EventsWorkspaceHeader
        churchSlug={churchSlug}
        activeTab={activeTab}
        summary={data.summary}
        canCreate={data.permissions.canCreateEvents}
        canOpenApprovalQueue={data.permissions.canOpenApprovalQueue}
        onDialogChange={setActiveDialog}
      />
      <EventsTabBar activeTab={activeTab} onChange={setActiveTab} />

      <section
        id="events-panel-overview"
        role="tabpanel"
        aria-labelledby="events-tab-overview"
        hidden={activeTab !== "overview"}
        className="min-w-0"
      >
        {activeTab === "overview" ? (
          <EventsOverviewTab
            churchSlug={churchSlug}
            data={data}
            onOpenEvents={() => setActiveTab("events")}
            onOpenCalendar={() => setActiveTab("calendar")}
          />
        ) : null}
      </section>

      <section
        id="events-panel-events"
        role="tabpanel"
        aria-labelledby="events-tab-events"
        hidden={activeTab !== "events"}
        className="min-w-0"
      >
        {activeTab === "events" ? (
          <EventsRegistryTab churchSlug={churchSlug} data={data} onDialogChange={setActiveDialog} />
        ) : null}
      </section>

      <section
        id="events-panel-calendar"
        role="tabpanel"
        aria-labelledby="events-tab-calendar"
        hidden={activeTab !== "calendar"}
        className="min-w-0"
      >
        {activeTab === "calendar" ? <EventsCalendarTab churchSlug={churchSlug} data={data} /> : null}
      </section>

      <EventsDialogHost
        churchSlug={churchSlug}
        data={data}
        dialog={dialog}
        onDialogChange={setActiveDialog}
      />
    </ChurchPageFrame>
  );
}
