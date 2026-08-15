"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Archive,
  ChevronRight,
  FileText,
  Megaphone,
  MoreVertical,
  Plus,
  Send,
} from "lucide-react";
import {
  archiveChurchAnnouncementAction,
  createChurchAnnouncementAction,
  publishChurchAnnouncementAction,
} from "@/features/announcements/actions";
import {
  archiveDepartmentAnnouncementAction,
  publishDepartmentAnnouncementAction,
} from "@/features/department-announcements/actions";
import type { AnnouncementWorkspaceItem } from "@/features/announcements/types";
import {
  ChurchContentGrid,
  ChurchEmptyState,
  ChurchMainPanel,
  ChurchPageFrame,
  ChurchRightRail,
  ChurchStatusPill,
  ChurchSummaryStrip,
  ChurchUnavailableState,
  ChurchWorkspaceHeader,
  ChurchWorkspacePanel,
  ChurchWorkspaceTabBar,
  type ChurchWorkspaceTabItem,
} from "@/components/church-workspace";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type AnnouncementTab = "overview" | "announcements" | "templates" | "acknowledgements";

type AnnouncementWorkspaceProps = {
  churchSlug: string;
  departments: Array<{ id: string; department_name: string }>;
  items: AnnouncementWorkspaceItem[];
  filteredItems: AnnouncementWorkspaceItem[];
  selectedItem: AnnouncementWorkspaceItem | null;
  canManage: boolean;
  activeTab: AnnouncementTab;
  filters: {
    q: string;
    status: string;
    source: string;
    page: number;
    dialog: string;
    announcementId: string;
  };
  counts: {
    total: number;
    published: number;
    draft: number;
    pending: number;
    archived: number;
    acknowledgementsRequested: number;
  };
};

const PAGE_SIZE = 12;

const statusLabels: Record<string, string> = {
  draft: "Draft",
  pending_approval: "Awaiting Approval",
  published: "Published",
  archived: "Archived",
  rejected: "Not Approved",
};

const audienceLabels: Record<string, string> = {
  church_wide: "Church-wide",
  leaders_only: "Leaders only",
  members_only: "Members only",
  department_members: "Department members",
  selected_members: "Selected members",
};

function formatDate(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function labelFor(map: Record<string, string>, value?: string | null) {
  if (!value) return "-";
  return map[value] ?? value.replace(/_/g, " ");
}

function buildHref(
  churchSlug: string,
  patch: Partial<{
    tab: AnnouncementTab;
    q: string;
    status: string;
    source: string;
    page: number;
    dialog: string;
    announcementId: string;
  }>,
  current: AnnouncementWorkspaceProps["filters"],
  activeTab: AnnouncementTab
) {
  const params = new URLSearchParams();
  const tab = patch.tab ?? activeTab;
  const q = patch.q ?? current.q;
  const status = patch.status ?? current.status;
  const source = patch.source ?? current.source;
  const page = patch.page ?? current.page;
  const dialog = patch.dialog ?? current.dialog;
  const announcementId = patch.announcementId ?? current.announcementId;

  if (tab !== "overview") params.set("tab", tab);
  if (q) params.set("q", q);
  if (status) params.set("status", status);
  if (source) params.set("source", source);
  if (page > 1) params.set("page", String(page));
  if (dialog) params.set("dialog", dialog);
  if (announcementId) params.set("announcementId", announcementId);

  const query = params.toString();
  return query ? `/c/${churchSlug}/announcements?${query}` : `/c/${churchSlug}/announcements`;
}

function AnnouncementCreateDialog({
  churchSlug,
  departments,
  open,
  onOpenChange,
}: {
  churchSlug: string;
  departments: Array<{ id: string; department_name: string }>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create announcement</DialogTitle>
          <DialogDescription>
            Save a church announcement as draft before submitting it for approval.
          </DialogDescription>
        </DialogHeader>
        <form action={createChurchAnnouncementAction} className="grid gap-4">
          <input type="hidden" name="churchSlug" value={churchSlug} />

          <div className="grid gap-2">
            <Label htmlFor="announcement-title">Title</Label>
            <Input id="announcement-title" name="title" required />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="announcement-audience">Audience</Label>
              <select
                id="announcement-audience"
                name="audienceScope"
                defaultValue="church_wide"
                className="h-10 rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                <option value="church_wide">Church-wide</option>
                <option value="leaders_only">Leaders only</option>
                <option value="members_only">Members only</option>
                <option value="department_members">Department members</option>
              </select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="announcement-department">Related department</Label>
              <select
                id="announcement-department"
                name="departmentId"
                defaultValue=""
                className="h-10 rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                <option value="">No specific department</option>
                {departments.map((department) => (
                  <option key={department.id} value={department.id}>
                    {department.department_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="announcement-expires">Expires at</Label>
              <Input id="announcement-expires" name="expiresAt" type="datetime-local" />
            </div>
            <label className="flex items-center gap-2 pt-8 text-sm text-muted-foreground">
              <input type="checkbox" name="requiresAcknowledgement" className="size-4 rounded border-border" />
              Requires acknowledgement
            </label>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="announcement-body">Body</Label>
            <Textarea id="announcement-body" name="body" required rows={7} />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="submit" className="gap-2">
              <FileText className="size-4" aria-hidden="true" />
              Save Draft
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ArchiveAnnouncementAction({
  churchSlug,
  item,
}: {
  churchSlug: string;
  item: AnnouncementWorkspaceItem;
}) {
  const action =
    item.source_type === "church"
      ? archiveChurchAnnouncementAction
      : archiveDepartmentAnnouncementAction;

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <DropdownMenuItem
          className="gap-2 text-red-700 focus:text-red-700"
          onSelect={(event) => event.preventDefault()}
        >
          <Archive className="size-4" aria-hidden="true" />
          Archive
        </DropdownMenuItem>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Archive announcement?</AlertDialogTitle>
          <AlertDialogDescription>
            This will remove the announcement from active circulation without deleting the record.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <form action={action}>
            <input type="hidden" name="churchSlug" value={churchSlug} />
            <input type="hidden" name="announcementId" value={item.id} />
            {item.department_id ? <input type="hidden" name="departmentId" value={item.department_id} /> : null}
            <AlertDialogAction type="submit" className="bg-red-600 text-white hover:bg-red-700">
              Archive
            </AlertDialogAction>
          </form>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function AnnouncementRowActions({
  churchSlug,
  item,
  canManage,
}: {
  churchSlug: string;
  item: AnnouncementWorkspaceItem;
  canManage: boolean;
}) {
  if (!canManage) {
    return (
      <Button type="button" variant="ghost" size="icon" disabled className="size-8 rounded-lg" aria-label="No actions available">
        <MoreVertical className="size-4" aria-hidden="true" />
      </Button>
    );
  }

  const publishAction =
    item.source_type === "church"
      ? publishChurchAnnouncementAction
      : publishDepartmentAnnouncementAction;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="ghost" size="icon" className="size-8 rounded-lg" aria-label="Announcement actions">
          <MoreVertical className="size-4" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 rounded-lg">
        {item.status !== "published" && item.status !== "pending_approval" && item.status !== "archived" ? (
          <DropdownMenuItem asChild className="gap-2">
            <form action={publishAction} className="w-full">
              <input type="hidden" name="churchSlug" value={churchSlug} />
              <input type="hidden" name="announcementId" value={item.id} />
              {item.department_id ? <input type="hidden" name="departmentId" value={item.department_id} /> : null}
              <button type="submit" className="flex w-full items-center gap-2">
                <Send className="size-4" aria-hidden="true" />
                Submit for approval
              </button>
            </form>
          </DropdownMenuItem>
        ) : null}
        {item.status !== "archived" ? (
          <ArchiveAnnouncementAction churchSlug={churchSlug} item={item} />
        ) : (
          <DropdownMenuItem disabled>No row actions available</DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function Registry({
  churchSlug,
  items,
  selectedItem,
  canManage,
  filters,
  activeTab,
}: {
  churchSlug: string;
  items: AnnouncementWorkspaceItem[];
  selectedItem: AnnouncementWorkspaceItem | null;
  canManage: boolean;
  filters: AnnouncementWorkspaceProps["filters"];
  activeTab: AnnouncementTab;
}) {
  if (items.length === 0) {
    return (
      <div className="p-5">
        <ChurchEmptyState
          title="No announcements found"
          message="No real church or department announcements match the current view."
        />
      </div>
    );
  }

  return (
    <div className="min-w-0 overflow-x-auto">
      <table className="min-w-[860px] w-full text-sm">
        <thead className="border-b border-border bg-muted/40 text-left text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          <tr>
            <th className="px-4 py-3">Announcement</th>
            <th className="px-4 py-3">Source</th>
            <th className="px-4 py-3">Audience</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3 text-right">Updated</th>
            <th className="w-12 px-2 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {items.map((item) => {
            const href = buildHref(churchSlug, { announcementId: item.workspace_id }, filters, activeTab);
            const isSelected = selectedItem?.workspace_id === item.workspace_id;
            return (
              <tr key={item.workspace_id} className={isSelected ? "bg-primary/5" : "bg-background"}>
                <td className="min-w-[280px] px-4 py-3">
                  <Link href={href} className="group block min-w-0">
                    <span className="font-medium text-foreground group-hover:text-primary">{item.title}</span>
                    <span className="mt-1 line-clamp-1 block text-xs text-muted-foreground">{item.body}</span>
                  </Link>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{item.source_label}</td>
                <td className="px-4 py-3 text-muted-foreground">{labelFor(audienceLabels, item.audience_scope)}</td>
                <td className="px-4 py-3">
                  <ChurchStatusPill status={item.status} label={labelFor(statusLabels, item.status)} />
                </td>
                <td className="px-4 py-3 text-right text-muted-foreground">{formatDate(item.updated_at ?? item.created_at)}</td>
                <td className="px-2 py-3">
                  <AnnouncementRowActions churchSlug={churchSlug} item={item} canManage={canManage} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function DetailRail({
  selectedItem,
}: {
  selectedItem: AnnouncementWorkspaceItem | null;
}) {
  return (
    <ChurchRightRail>
      {!selectedItem ? (
        <ChurchEmptyState
          title="No announcement selected"
          message="Select a row from the registry to inspect publication and approval details."
        />
      ) : (
        <div className="space-y-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
              {selectedItem.source_label}
            </p>
            <h2 className="mt-2 text-lg font-semibold text-foreground">{selectedItem.title}</h2>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{selectedItem.body}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <ChurchStatusPill status={selectedItem.status} label={labelFor(statusLabels, selectedItem.status)} />
            <ChurchStatusPill status={selectedItem.audience_scope} label={labelFor(audienceLabels, selectedItem.audience_scope)} />
          </div>

          <dl className="space-y-3 rounded-xl border border-border bg-muted/30 p-4 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Created by</dt>
              <dd className="text-right font-medium text-foreground">{selectedItem.created_by_name ?? "Unknown"}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Created</dt>
              <dd className="text-right font-medium text-foreground">{formatDate(selectedItem.created_at)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Published</dt>
              <dd className="text-right font-medium text-foreground">{formatDate(selectedItem.published_at)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Expires</dt>
              <dd className="text-right font-medium text-foreground">{formatDate(selectedItem.expires_at)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Acknowledgement</dt>
              <dd className="text-right font-medium text-foreground">
                {selectedItem.requires_acknowledgement
                  ? `${selectedItem.acknowledgement_count} of ${selectedItem.acknowledgement_recipient_count} received`
                  : "Not requested"}
              </dd>
            </div>
          </dl>

          {selectedItem.approval_status || selectedItem.approval_stage ? (
            <ChurchUnavailableState
              title="Approval link"
              message={`Status: ${selectedItem.approval_status ?? "not queued"}; stage: ${selectedItem.approval_stage ?? "none"}. Decisions stay in the Approvals module.`}
            />
          ) : null}
        </div>
      )}
    </ChurchRightRail>
  );
}

export function AnnouncementsWorkspace({
  churchSlug,
  departments,
  items,
  filteredItems,
  selectedItem,
  canManage,
  activeTab,
  filters,
  counts,
}: AnnouncementWorkspaceProps) {
  const router = useRouter();
  const pathname = usePathname();
  const totalPages = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE));
  const page = Math.min(Math.max(filters.page, 1), totalPages);
  const pagedItems = filteredItems.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const tabs: ChurchWorkspaceTabItem[] = [
    { key: "overview", label: "Overview", href: buildHref(churchSlug, { tab: "overview", page: 1 }, filters, activeTab) },
    {
      key: "announcements",
      label: "Announcements",
      count: counts.total,
      href: buildHref(churchSlug, { tab: "announcements", page: 1 }, filters, activeTab),
    },
    {
      key: "templates",
      label: "Templates",
      href: buildHref(churchSlug, { tab: "templates", page: 1 }, filters, activeTab),
    },
    {
      key: "acknowledgements",
      label: "Acknowledgements",
      count: counts.acknowledgementsRequested,
      href: buildHref(churchSlug, { tab: "acknowledgements", page: 1 }, filters, activeTab),
    },
  ];

  function closeDialog(open: boolean) {
    if (open) return;
    const params = new URLSearchParams(window.location.search);
    params.delete("dialog");
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  return (
    <ChurchPageFrame className="church-workspace min-w-0 space-y-4">
      <ChurchWorkspaceHeader
        eyebrow="Announcements"
        title="Announcements"
        description="Publish church-wide notices and review department announcements without mixing in placeholder data."
        meta={
          <>
            <ChurchStatusPill status="published" label={`${counts.published} published`} />
            <ChurchStatusPill status="pending_approval" label={`${counts.pending} awaiting approval`} />
          </>
        }
        actions={
          canManage ? (
            <Button asChild className="h-10 gap-2 rounded-lg">
              <Link href={buildHref(churchSlug, { dialog: "create" }, filters, activeTab)}>
                <Plus className="size-4" aria-hidden="true" />
                New Announcement
              </Link>
            </Button>
          ) : null
        }
      />

      <ChurchWorkspaceTabBar tabs={tabs} activeKey={activeTab} ariaLabel="Announcements workspace tabs" />

      <ChurchSummaryStrip
        items={[
          { label: "Total", value: counts.total, icon: <Megaphone className="size-4" aria-hidden="true" /> },
          { label: "Published", value: counts.published },
          { label: "Drafts", value: counts.draft },
          { label: "Awaiting Approval", value: counts.pending },
          { label: "Archived", value: counts.archived, muted: counts.archived === 0 },
        ]}
      />

      {activeTab === "templates" ? (
        <ChurchWorkspacePanel title="Templates" description="Announcement templates are not configured in this workspace yet.">
          <div className="p-5">
            <ChurchUnavailableState
              title="Template backend unavailable"
              message="No announcement template storage or save action exists yet, so this tab shows setup status instead of mock templates."
            />
          </div>
        </ChurchWorkspacePanel>
      ) : activeTab === "acknowledgements" ? (
        <ChurchWorkspacePanel title="Acknowledgements" description="Only real acknowledgement requirements are shown here.">
          <div className="p-5">
            {counts.acknowledgementsRequested === 0 ? (
              <ChurchUnavailableState
                title="No acknowledgement tracker configured"
                message="Announcements can request acknowledgement, but no acknowledgement response table is available in this module yet."
              />
            ) : (
              <Registry
                churchSlug={churchSlug}
                items={items.filter((item) => item.requires_acknowledgement)}
                selectedItem={selectedItem}
                canManage={canManage}
                filters={filters}
                activeTab={activeTab}
              />
            )}
          </div>
        </ChurchWorkspacePanel>
      ) : activeTab === "overview" ? (
        <ChurchContentGrid>
          <ChurchMainPanel>
            <ChurchWorkspacePanel
              title="Recent announcements"
              description="Latest real church and department notices."
              contentClassName="p-0"
            >
              <Registry
                churchSlug={churchSlug}
                items={items.slice(0, 8)}
                selectedItem={selectedItem}
                canManage={canManage}
                filters={filters}
                activeTab={activeTab}
              />
            </ChurchWorkspacePanel>
          </ChurchMainPanel>
          <DetailRail selectedItem={selectedItem} />
        </ChurchContentGrid>
      ) : (
        <ChurchContentGrid>
          <ChurchMainPanel>
            <ChurchWorkspacePanel
              title="Announcement registry"
              description="Use URL-backed filters, pagination, and selection."
              contentClassName="p-0"
              action={
                <span className="text-xs text-muted-foreground">
                  {filteredItems.length} matching
                </span>
              }
            >
              <form method="get" action={`/c/${churchSlug}/announcements`} className="grid gap-3 border-b border-border p-4 md:grid-cols-[minmax(0,1fr)_160px_160px_auto]">
                <input type="hidden" name="tab" value="announcements" />
                {filters.announcementId ? <input type="hidden" name="announcementId" value={filters.announcementId} /> : null}
                <Input name="q" defaultValue={filters.q} placeholder="Search announcements" className="h-10 rounded-lg" />
                <Select name="status" defaultValue={filters.status || "__all"}>
                  <SelectTrigger className="h-10 rounded-lg bg-background">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all">All statuses</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="pending_approval">Awaiting approval</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                    <SelectItem value="rejected">Not approved</SelectItem>
                  </SelectContent>
                </Select>
                <Select name="source" defaultValue={filters.source || "__all"}>
                  <SelectTrigger className="h-10 rounded-lg bg-background">
                    <SelectValue placeholder="Source" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all">All sources</SelectItem>
                    <SelectItem value="church">Church</SelectItem>
                    <SelectItem value="department">Departments</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex items-center gap-2">
                  <Button type="submit" className="h-10 rounded-lg">Apply</Button>
                  <Button asChild type="button" variant="outline" className="h-10 rounded-lg">
                    <Link href={`/c/${churchSlug}/announcements?tab=announcements`}>Reset</Link>
                  </Button>
                </div>
              </form>

              <Registry
                churchSlug={churchSlug}
                items={pagedItems}
                selectedItem={selectedItem}
                canManage={canManage}
                filters={{ ...filters, page }}
                activeTab={activeTab}
              />

              <div className="flex min-h-16 items-center justify-between gap-3 border-t border-border px-5 py-3 text-sm text-muted-foreground">
                <p>
                  Page {page} of {totalPages}
                </p>
                <div className="flex items-center gap-2">
                  <Button asChild variant="outline" size="sm" className="rounded-lg" disabled={page <= 1}>
                    <Link href={buildHref(churchSlug, { page: Math.max(1, page - 1) }, filters, activeTab)}>Previous</Link>
                  </Button>
                  <Button asChild variant="outline" size="sm" className="rounded-lg" disabled={page >= totalPages}>
                    <Link href={buildHref(churchSlug, { page: Math.min(totalPages, page + 1) }, filters, activeTab)}>
                      Next
                      <ChevronRight className="ml-1 size-4" aria-hidden="true" />
                    </Link>
                  </Button>
                </div>
              </div>
            </ChurchWorkspacePanel>
          </ChurchMainPanel>
          <DetailRail selectedItem={selectedItem} />
        </ChurchContentGrid>
      )}

      <AnnouncementCreateDialog
        churchSlug={churchSlug}
        departments={departments}
        open={filters.dialog === "create"}
        onOpenChange={closeDialog}
      />
    </ChurchPageFrame>
  );
}
