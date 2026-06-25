import {
  getAnnouncementDepartments,
  getAnnouncementWorkspaceItems,
} from "@/features/announcements/queries";
import { requireChurchAccess } from "@/features/access/queries";
import { AnnouncementsWorkspace } from "./AnnouncementsWorkspace";
import type { AnnouncementWorkspaceItem } from "@/features/announcements/types";

interface AnnouncementsPageProps {
  params: Promise<{ churchSlug: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

type AnnouncementTab = "overview" | "announcements" | "templates" | "acknowledgements";

function pickSingle(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value ?? "";
}

function normalizeTab(value: string): AnnouncementTab {
  if (value === "announcements" || value === "templates" || value === "acknowledgements") {
    return value;
  }
  return "overview";
}

function normalizeFilter(value: string) {
  return value === "__all" ? "" : value.trim();
}

function filterAnnouncements(
  items: AnnouncementWorkspaceItem[],
  filters: { q: string; status: string; source: string }
) {
  const query = filters.q.trim().toLowerCase();
  return items.filter((item) => {
    if (filters.status && item.status !== filters.status) return false;
    if (filters.source && item.source_type !== filters.source) return false;
    if (!query) return true;

    return (
      item.title.toLowerCase().includes(query) ||
      item.body.toLowerCase().includes(query) ||
      item.source_label.toLowerCase().includes(query) ||
      (item.created_by_name ?? "").toLowerCase().includes(query)
    );
  });
}

export default async function AnnouncementsPage({ params, searchParams }: AnnouncementsPageProps) {
  const { churchSlug } = await params;
  const rawSearchParams = (await searchParams) ?? {};
  const ctx = await requireChurchAccess(churchSlug);

  const [items, departments] = await Promise.all([
    getAnnouncementWorkspaceItems(churchSlug),
    getAnnouncementDepartments(churchSlug),
  ]);

  const canManage =
    ctx.roles.includes("platform_owner") ||
    ctx.roles.includes("platform_admin") ||
    ctx.roles.includes("platform_support") ||
    ctx.roles.includes("church_admin") ||
    ctx.roles.includes("pastor") ||
    ctx.roles.includes("elder") ||
    ctx.roles.includes("clerk") ||
    ctx.roles.includes("church_secretary");

  const activeTab = normalizeTab(pickSingle(rawSearchParams.tab));
  const q = pickSingle(rawSearchParams.q).trim();
  const status = normalizeFilter(pickSingle(rawSearchParams.status));
  const source = normalizeFilter(pickSingle(rawSearchParams.source));
  const dialog = pickSingle(rawSearchParams.dialog);
  const announcementId = pickSingle(rawSearchParams.announcementId);
  const page = Math.max(1, Number.parseInt(pickSingle(rawSearchParams.page) || "1", 10) || 1);
  const filteredItems = filterAnnouncements(items, { q, status, source });
  const selectedItem =
    items.find((item) => item.workspace_id === announcementId) ??
    items[0] ??
    null;

  return (
    <AnnouncementsWorkspace
      churchSlug={churchSlug}
      departments={departments}
      items={items}
      filteredItems={filteredItems}
      selectedItem={selectedItem}
      canManage={canManage}
      activeTab={activeTab}
      filters={{
        q,
        status,
        source,
        page,
        dialog,
        announcementId,
      }}
      counts={{
        total: items.length,
        published: items.filter((item) => item.status === "published").length,
        draft: items.filter((item) => item.status === "draft").length,
        pending: items.filter((item) => item.status === "pending_approval").length,
        archived: items.filter((item) => item.status === "archived").length,
        acknowledgementsRequested: items.filter((item) => item.requires_acknowledgement).length,
      }}
    />
  );
}
