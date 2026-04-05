import "server-only";

type OfficeSignalNotification = {
  id: string;
  title: string;
  message: string;
  href: string;
  event_type: string;
  entity_type: string;
  entity_id: string;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
};

function toIso(value?: string | null) {
  return value && value.trim() ? value : new Date().toISOString();
}

export function buildOfficeSignalNotifications(
  churchSlug: string,
  queue: Array<{
    id: string;
    type: "access_request" | "leadership_request" | "announcement_review" | "event_approval" | "today_event";
    title: string;
    description: string;
    href: string;
    createdAt?: string | null;
    startsAt?: string | null;
    status?: string | null;
  }>
): OfficeSignalNotification[] {
  return queue.slice(0, 8).map((item) => ({
    id: `office-${item.id}`,
    title: item.title,
    message: item.description,
    href: item.href || `/c/${churchSlug}/office`,
    event_type: item.type,
    entity_type: "office_signal",
    entity_id: item.id,
    is_read: false,
    read_at: null,
    created_at: toIso(item.startsAt ?? item.createdAt),
  }));
}
