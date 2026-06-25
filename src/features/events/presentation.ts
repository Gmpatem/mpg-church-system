import type {
  EventOperationalStatus,
  EventTypeOption,
  EventWorkflowState,
  EventsCalendarView,
  EventsLocale,
} from "./types";

type LabelMap = Record<string, { en: string; fr: string }>;

const statusLabels: LabelMap = {
  scheduled: { en: "Scheduled", fr: "Planifie" },
  completed: { en: "Completed", fr: "Termine" },
  cancelled: { en: "Cancelled", fr: "Annule" },
};

const workflowLabels: LabelMap = {
  draft: { en: "Draft", fr: "Brouillon" },
  pending_approval: { en: "Awaiting approval", fr: "En attente d'approbation" },
  approved: { en: "Approved", fr: "Approuve" },
  published: { en: "Published", fr: "Publie" },
  rejected: { en: "Rejected", fr: "Rejete" },
};

const eventTypeLabels: LabelMap = {
  worship: { en: "Worship", fr: "Culte" },
  worship_service: { en: "Worship service", fr: "Service de culte" },
  prayer: { en: "Prayer", fr: "Priere" },
  prayer_meeting: { en: "Prayer meeting", fr: "Reunion de priere" },
  youth: { en: "Youth", fr: "Jeunesse" },
  children: { en: "Children", fr: "Enfants" },
  bible_study: { en: "Bible study", fr: "Etude biblique" },
  outreach: { en: "Outreach", fr: "Evangelisation" },
  fellowship: { en: "Fellowship", fr: "Communion fraternelle" },
  conference: { en: "Conference", fr: "Conference" },
  seminar: { en: "Seminar", fr: "Seminaire" },
  department: { en: "Department activity", fr: "Activite de departement" },
  department_activity: { en: "Department activity", fr: "Activite de departement" },
  training: { en: "Training", fr: "Formation" },
  meeting: { en: "Meeting", fr: "Reunion" },
  pastoral: { en: "Pastoral care", fr: "Soin pastoral" },
  community: { en: "Community", fr: "Communaute" },
  other: { en: "Other", fr: "Autre" },
};

export const EVENT_TYPE_OPTIONS: EventTypeOption[] = [
  "worship_service",
  "prayer_meeting",
  "bible_study",
  "department_activity",
  "outreach",
  "fellowship",
  "training",
  "meeting",
  "community",
  "other",
].map((value) => ({
  value,
  label: getEventTypeLabel(value, "en"),
}));

function humanize(value: string) {
  return value
    .replace(/[_-]+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getLocalizedLabel(map: LabelMap, value: string, locale: EventsLocale) {
  return map[value]?.[locale] ?? humanize(value);
}

export function getEventStatusLabel(status: EventOperationalStatus | string, locale: EventsLocale = "en") {
  return getLocalizedLabel(statusLabels, status, locale);
}

export function getEventWorkflowLabel(workflowState: EventWorkflowState | string, locale: EventsLocale = "en") {
  return getLocalizedLabel(workflowLabels, workflowState, locale);
}

export function getEventTypeLabel(eventType: string, locale: EventsLocale = "en") {
  return getLocalizedLabel(eventTypeLabels, eventType, locale);
}

export function getCalendarViewLabel(view: EventsCalendarView, locale: EventsLocale = "en") {
  const labels: Record<EventsCalendarView, { en: string; fr: string }> = {
    month: { en: "Month", fr: "Mois" },
    week: { en: "Week", fr: "Semaine" },
    day: { en: "Day", fr: "Jour" },
    list: { en: "List", fr: "Liste" },
  };
  return labels[view][locale];
}

export function getEventStatusTone(status: EventOperationalStatus | string) {
  switch (status) {
    case "scheduled":
      return "border-primary/20 bg-primary/10 text-primary";
    case "completed":
      return "border-border bg-muted text-muted-foreground";
    case "cancelled":
      return "border-destructive/20 bg-destructive/10 text-destructive";
    default:
      return "border-border bg-background text-muted-foreground";
  }
}

export function getEventWorkflowTone(workflowState: EventWorkflowState | string) {
  switch (workflowState) {
    case "pending_approval":
      return "border-primary/20 bg-primary/10 text-primary";
    case "approved":
    case "published":
      return "border-border bg-secondary text-secondary-foreground";
    case "rejected":
      return "border-destructive/20 bg-destructive/10 text-destructive";
    case "draft":
    default:
      return "border-border bg-muted text-muted-foreground";
  }
}

export function getStatusDotClass(status: EventOperationalStatus | string) {
  switch (status) {
    case "scheduled":
      return "bg-primary";
    case "cancelled":
      return "bg-destructive";
    case "completed":
    default:
      return "bg-muted-foreground";
  }
}

export function formatEventDateRange(
  start: string,
  end: string,
  options: { allDay?: boolean; timezone?: string; locale?: EventsLocale } = {}
) {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const locale = options.locale === "fr" ? "fr-FR" : "en-US";
  const timeZone = options.timezone || undefined;

  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return "Date unavailable";
  }

  const dateFormatter = new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone,
  });
  const timeFormatter = new Intl.DateTimeFormat(locale, {
    hour: "numeric",
    minute: "2-digit",
    timeZone,
  });

  const startDateText = dateFormatter.format(startDate);
  const endDateText = dateFormatter.format(endDate);

  if (options.allDay) {
    return startDateText === endDateText ? `${startDateText} - All day` : `${startDateText} - ${endDateText}`;
  }

  if (startDateText === endDateText) {
    return `${startDateText} - ${timeFormatter.format(startDate)} - ${timeFormatter.format(endDate)}`;
  }

  return `${startDateText} ${timeFormatter.format(startDate)} - ${endDateText} ${timeFormatter.format(endDate)}`;
}

export function toDateInputValue(value: string | null | undefined) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

export function toDateTimeLocalValue(value: string | null | undefined) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offsetMs = date.getTimezoneOffset() * 60 * 1000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}
