import type {
  EventDialogIntent,
  EventsCalendarView,
  EventsCanonicalTab,
  EventsLegacyTab,
  EventsNavigationState,
} from "./types";

const legacyTabs: EventsLegacyTab[] = ["all_events", "create_event", "detail", "edit", "calendar_notes"];
const canonicalTabs: EventsCanonicalTab[] = ["overview", "events", "calendar"];
const calendarViews: EventsCalendarView[] = ["month", "week", "day", "list"];

export type RawEventsNavigationInput = {
  tab?: string;
  eventId?: string;
  dialog?: string;
  calendarView?: string;
  view?: string;
};

function normalizeCalendarView(value?: string): EventsCalendarView {
  const view = (value ?? "").trim().toLowerCase();
  if (view === "daygridmonth") return "month";
  if (view === "timegridweek") return "week";
  if (view === "timegridday") return "day";
  return calendarViews.includes(view as EventsCalendarView) ? (view as EventsCalendarView) : "month";
}

export function normalizeEventsCalendarView(value?: string) {
  return normalizeCalendarView(value);
}

export function normalizeEventsNavigation(input: RawEventsNavigationInput = {}): EventsNavigationState {
  const rawTab = (input.tab ?? "").trim().toLowerCase();
  const eventId = (input.eventId ?? "").trim();
  const dialogValue = (input.dialog ?? "").trim().toLowerCase();
  const legacyTab = legacyTabs.includes(rawTab as EventsLegacyTab) ? (rawTab as EventsLegacyTab) : null;

  let activeTab: EventsCanonicalTab = canonicalTabs.includes(rawTab as EventsCanonicalTab)
    ? (rawTab as EventsCanonicalTab)
    : "events";
  let dialog: EventDialogIntent = null;
  let selectedEventId = eventId;

  if (!rawTab) {
    activeTab = "events";
  }

  if (legacyTab === "all_events") {
    activeTab = "events";
  }

  if (legacyTab === "create_event") {
    activeTab = "events";
    dialog = { type: "create" };
  }

  if (legacyTab === "detail") {
    activeTab = "events";
  }

  if (legacyTab === "edit") {
    activeTab = "events";
    if (eventId) dialog = { type: "edit", eventId };
  }

  if (legacyTab === "calendar_notes") {
    activeTab = "calendar";
  }

  if (dialogValue === "create") {
    activeTab = "events";
    dialog = { type: "create" };
  }

  if (dialogValue === "edit" && eventId) {
    activeTab = "events";
    selectedEventId = eventId;
    dialog = { type: "edit", eventId };
  }

  return {
    activeTab,
    selectedEventId,
    dialog,
    legacyTab,
  };
}

export function eventsCanonicalTabToQuery(tab: EventsCanonicalTab) {
  return tab === "events" ? "" : tab;
}
