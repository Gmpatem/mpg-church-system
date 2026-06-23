"use client";

import { useMemo, type KeyboardEvent } from "react";
import {
  CalendarDays,
  ChevronRight,
  FileBarChart,
  HandHeart,
  Heart,
  Home,
  MapPin,
  Megaphone,
  MoreVertical,
  Users,
  X,
} from "lucide-react";
import {
  ChurchContentGrid,
  ChurchMainPanel,
  ChurchRightRail,
} from "@/components/church-workspace/patterns/ChurchPanels";
import { Button } from "@/components/ui/button";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils/cn";
import type {
  OutreachActivityViewModel,
  OutreachState,
  SmallGroupsDialog,
  SmallGroupsWorkspaceData,
} from "../types";
import {
  ClearFiltersButton,
  EmptyRegistryState,
  FilterButton,
  FilterSelect,
  formatDate,
  formatTime,
  GroupInitialsBadge,
  InfoRow,
  MetricStrip,
  RegistryPagination,
  RowActions,
  SearchField,
  StatusPill,
  numberFormat,
} from "../shared";

const dateRangeOptions = [
  { value: "last-30", label: "Last 30 Days" },
  { value: "this-month", label: "This Month" },
  { value: "this-quarter", label: "This Quarter" },
];

const statusOptions = [
  { value: "planned", label: "Planned" },
  { value: "in-progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "follow-up", label: "Follow-up" },
];

function hasFilters(filters: OutreachState) {
  return Boolean(
    filters.search ||
      filters.groupId ||
      filters.activityType ||
      filters.dateRange ||
      filters.status
  );
}

function filterActivities(rows: OutreachActivityViewModel[], filters: OutreachState) {
  const search = filters.search.trim().toLowerCase();

  return rows.filter((activity) => {
    if (filters.subTab !== "all" && activity.status !== filters.subTab) return false;
    if (filters.groupId && activity.groupId !== filters.groupId) return false;
    if (filters.activityType && activity.type !== filters.activityType) return false;
    if (filters.status && activity.status !== filters.status) return false;

    if (search) {
      const haystack = [
        activity.title,
        activity.location,
        activity.notes,
        activity.groupName,
        activity.responsiblePerson?.name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(search)) return false;
    }

    return true;
  });
}

function activityIcon(type: OutreachActivityViewModel["type"]) {
  if (type === "Evangelism") return <Megaphone className="size-4" aria-hidden="true" />;
  if (type === "Service") return <HandHeart className="size-4" aria-hidden="true" />;
  if (type === "Care Visit") return <Heart className="size-4" aria-hidden="true" />;
  if (type === "Home Visit") return <Home className="size-4" aria-hidden="true" />;
  return <Users className="size-4" aria-hidden="true" />;
}

function OutreachImpactStrip({ data }: { data: SmallGroupsWorkspaceData }) {
  return (
    <MetricStrip
      items={[
        {
          label: "Outreach Activities",
          value: numberFormat(data.stats.outreachActivities),
          icon: <Megaphone className="size-4 text-primary" />,
        },
        {
          label: "People Reached",
          value: numberFormat(data.stats.peopleReached),
          icon: <Users className="size-4 text-primary" />,
        },
        {
          label: "New Connections",
          value: data.stats.newConnections === null ? "-" : numberFormat(data.stats.newConnections),
          icon: <HandHeart className="size-4 text-primary" />,
          muted: data.stats.newConnections === null,
        },
        {
          label: "Decisions for Christ",
          value: data.stats.decisions === null ? "-" : numberFormat(data.stats.decisions),
          icon: <Heart className="size-4 text-primary" />,
          muted: data.stats.decisions === null,
        },
        {
          label: "Follow-up Rate",
          value: data.stats.followUpRate === null ? "-" : `${data.stats.followUpRate}%`,
          icon: <FileBarChart className="size-4 text-orange-600" />,
          muted: data.stats.followUpRate === null,
        },
      ]}
    />
  );
}

function OutreachToolbar({
  data,
  outreachState,
  onOutreachStateChange,
}: {
  data: SmallGroupsWorkspaceData;
  outreachState: OutreachState;
  onOutreachStateChange: (state: Partial<OutreachState>) => void;
}) {
  const activeFilters = hasFilters(outreachState);

  return (
    <section className="rounded-t-2xl border border-border bg-background p-4 shadow-sm">
      <form
        className="grid min-w-0 items-center gap-3 md:grid-cols-2 xl:grid-cols-[minmax(280px,1fr)_145px_150px_140px_130px_auto_auto]"
        onSubmit={(event) => event.preventDefault()}
      >
        <SearchField
          id="small-groups-outreach-search"
          value={outreachState.search}
          onChange={(search) => onOutreachStateChange({ search })}
          placeholder="Search activities, locations, or notes..."
          className="md:col-span-2 xl:col-span-1"
        />
        <FilterSelect
          label="All Groups"
          value={outreachState.groupId}
          onValueChange={(groupId) => onOutreachStateChange({ groupId })}
          options={data.options.groups}
          allLabel="All Groups"
        />
        <FilterSelect
          label="Activity Type"
          value={outreachState.activityType}
          onValueChange={(activityType) => onOutreachStateChange({ activityType })}
          options={data.options.outreachTypes}
          allLabel="Activity Type: All"
        />
        <FilterSelect
          label="Date Range"
          value={outreachState.dateRange}
          onValueChange={(dateRange) => onOutreachStateChange({ dateRange })}
          options={dateRangeOptions}
          allLabel="Date Range"
        />
        <FilterSelect
          label="Status"
          value={outreachState.status}
          onValueChange={(status) => onOutreachStateChange({ status })}
          options={statusOptions}
          allLabel="Status: All"
        />
        <FilterButton />
        <ClearFiltersButton
          show={activeFilters}
          onClick={() =>
            onOutreachStateChange({
              search: "",
              groupId: "",
              activityType: "",
              dateRange: "",
              status: "",
            })
          }
        />
      </form>
    </section>
  );
}

function OutreachStateTabs({
  data,
  outreachState,
  onOutreachStateChange,
}: {
  data: SmallGroupsWorkspaceData;
  outreachState: OutreachState;
  onOutreachStateChange: (state: Partial<OutreachState>) => void;
}) {
  const items = [
    { key: "all" as const, label: "All Outreach", count: data.outreachActivities.length },
    { key: "planned" as const, label: "Planned", count: data.outreachActivities.filter((item) => item.status === "planned").length },
    { key: "in-progress" as const, label: "In Progress", count: data.outreachActivities.filter((item) => item.status === "in-progress").length },
    { key: "completed" as const, label: "Completed", count: data.outreachActivities.filter((item) => item.status === "completed").length },
    { key: "follow-up" as const, label: "Follow-up", count: data.outreachActivities.filter((item) => item.status === "follow-up").length },
  ];

  return (
    <div className="border-x border-b border-border bg-background px-4 shadow-sm">
      <div role="tablist" aria-label="Outreach state filters" className="flex min-w-0 overflow-x-auto">
        {items.map((item) => {
          const active = outreachState.subTab === item.key;
          return (
            <button
              key={item.key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onOutreachStateChange({ subTab: item.key })}
              className={cn(
                "relative h-12 shrink-0 px-4 text-sm font-medium text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
                active && "text-primary"
              )}
            >
              {item.label} {item.count}
              {active ? <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-primary" aria-hidden="true" /> : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function OutreachRow({
  activity,
  selected,
  onSelectOutreach,
  onDialogChange,
}: {
  activity: OutreachActivityViewModel;
  selected: boolean;
  onSelectOutreach: (outreachId: string) => void;
  onDialogChange: (dialog: SmallGroupsDialog) => void;
}) {
  function handleKeyDown(event: KeyboardEvent<HTMLTableRowElement>) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onSelectOutreach(activity.id);
    }
  }

  return (
    <tr
      tabIndex={0}
      aria-selected={selected}
      onClick={() => onSelectOutreach(activity.id)}
      onKeyDown={handleKeyDown}
      className={cn(
        "h-[78px] cursor-pointer bg-background outline-none transition-colors hover:bg-muted/35 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
        selected && "bg-primary/[0.055] shadow-[inset_3px_0_0_hsl(var(--primary))] hover:bg-primary/[0.07]"
      )}
    >
      <td className="border-b border-border/70 px-4 py-3 align-middle">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            {activityIcon(activity.type)}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">{activity.title}</p>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">{activity.location ?? "-"}</p>
          </div>
        </div>
      </td>
      <td className="border-b border-border/70 px-3 py-3 align-middle">
        <div className="flex min-w-0 items-center gap-2">
          <GroupInitialsBadge initials={activity.groupInitials ?? "SG"} className="size-8" />
          <span className="truncate text-sm text-foreground">{activity.groupName ?? "Unassigned"}</span>
        </div>
      </td>
      <td className="border-b border-border/70 px-3 py-3 align-middle text-sm text-foreground">{activity.type}</td>
      <td className="border-b border-border/70 px-3 py-3 align-middle">
        <p className="whitespace-nowrap text-sm text-foreground">{formatDate(activity.activityAt)}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{formatTime(activity.activityAt)}</p>
      </td>
      <td className="border-b border-border/70 px-3 py-3 align-middle text-sm font-semibold text-foreground">
        {activity.peopleReached ?? "-"}
      </td>
      <td className="border-b border-border/70 px-3 py-3 align-middle">
        <StatusPill status={activity.status} />
      </td>
      <td className="border-b border-border/70 px-3 py-3 align-middle">
        {activity.followUpRate === null ? (
          <span className="text-sm text-muted-foreground">-</span>
        ) : (
          <span className="inline-flex items-center gap-2 text-sm text-foreground">
            {activity.followUpRate}%
            <span className="size-2 rounded-full bg-primary" aria-hidden="true" />
          </span>
        )}
      </td>
      <td className="border-b border-border/70 px-2 py-3 text-right align-middle">
        <RowActions label={`Open actions for ${activity.title}`}>
          <DropdownMenuItem
            className="h-10 gap-2"
            onSelect={() => onDialogChange({ type: "generate-report", reportKind: "outreach", groupId: activity.groupId ?? undefined })}
          >
            Outreach report
          </DropdownMenuItem>
        </RowActions>
      </td>
    </tr>
  );
}

function OutreachRegistry({
  rows,
  selectedOutreach,
  onSelectOutreach,
  onDialogChange,
  hasActiveFilters,
}: {
  rows: OutreachActivityViewModel[];
  selectedOutreach: OutreachActivityViewModel | null;
  onSelectOutreach: (outreachId: string) => void;
  onDialogChange: (dialog: SmallGroupsDialog) => void;
  hasActiveFilters: boolean;
}) {
  return (
    <ChurchMainPanel className="min-w-0 overflow-hidden rounded-b-2xl rounded-t-none">
      {rows.length === 0 ? (
        <div className="p-4">
          <EmptyRegistryState
            title={hasActiveFilters ? "No outreach activities match this view" : "No outreach activities yet"}
            message={hasActiveFilters ? "Clear filters or broaden the search." : "Record an outreach activity for this group."}
            actionLabel={hasActiveFilters ? undefined : "New Outreach Activity"}
            onAction={hasActiveFilters ? undefined : () => onDialogChange({ type: "create-outreach" })}
          />
        </div>
      ) : (
        <>
          <div className="min-w-0">
            <table className="w-full table-fixed border-separate border-spacing-0 text-left text-sm">
              <colgroup>
                <col style={{ width: "26%" }} />
                <col style={{ width: "15%" }} />
                <col style={{ width: "12%" }} />
                <col style={{ width: "17%" }} />
                <col style={{ width: "11%" }} />
                <col style={{ width: "10%" }} />
                <col style={{ width: "6%" }} />
                <col style={{ width: "3%" }} />
              </colgroup>
              <thead>
                <tr className="h-14 bg-muted/30 text-xs">
                  <th className="border-b border-border px-4 text-left align-middle font-medium text-muted-foreground">Activity</th>
                  <th className="border-b border-border px-3 text-left align-middle font-medium text-muted-foreground">Group</th>
                  <th className="border-b border-border px-3 text-left align-middle font-medium text-muted-foreground">Type</th>
                  <th className="border-b border-border px-3 text-left align-middle font-medium text-muted-foreground">Date & Time</th>
                  <th className="border-b border-border px-3 text-left align-middle font-medium text-muted-foreground">People Reached</th>
                  <th className="border-b border-border px-3 text-left align-middle font-medium text-muted-foreground">Status</th>
                  <th className="border-b border-border px-3 text-left align-middle font-medium text-muted-foreground">Follow-up</th>
                  <th className="border-b border-border px-2 text-right align-middle font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((activity) => (
                  <OutreachRow
                    key={activity.id}
                    activity={activity}
                    selected={activity.id === selectedOutreach?.id}
                    onSelectOutreach={onSelectOutreach}
                    onDialogChange={onDialogChange}
                  />
                ))}
              </tbody>
            </table>
          </div>
          <RegistryPagination label={`Showing 1 to ${numberFormat(rows.length)} of ${numberFormat(rows.length)} activities`} />
        </>
      )}
    </ChurchMainPanel>
  );
}

function OutreachSummaryPanel({
  data,
  selectedOutreach,
  onClear,
  onDialogChange,
}: {
  data: SmallGroupsWorkspaceData;
  selectedOutreach: OutreachActivityViewModel | null;
  onClear: () => void;
  onDialogChange: (dialog: SmallGroupsDialog) => void;
}) {
  const typeCounts = data.outreachActivities.reduce<Record<string, number>>((acc, item) => {
    acc[item.type] = (acc[item.type] ?? 0) + (item.peopleReached ?? 0);
    return acc;
  }, {});
  const recentFollowUps = data.outreachActivities.slice(0, 3);

  return (
    <ChurchRightRail className="hidden min-w-0 self-start overflow-hidden rounded-2xl xl:block">
      <div className="flex min-h-[58px] items-center justify-between px-5 py-4">
        <h2 className="text-sm font-semibold text-foreground">
          {selectedOutreach ? "Outreach Details" : "Outreach Summary"}
        </h2>
        <Button type="button" variant="ghost" size="icon" onClick={onClear} className="size-8 rounded-md text-muted-foreground" aria-label="Close outreach panel">
          <X className="size-4" aria-hidden="true" />
        </Button>
      </div>
      <Separator />

      {selectedOutreach ? (
        <>
          <div className="px-5 py-5">
            <div className="flex items-start gap-4">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                {activityIcon(selectedOutreach.type)}
              </span>
              <div className="min-w-0">
                <h3 className="truncate text-lg font-semibold text-foreground">{selectedOutreach.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{selectedOutreach.location}</p>
                <div className="mt-2">
                  <StatusPill status={selectedOutreach.status} />
                </div>
              </div>
            </div>
          </div>
          <Separator />
          <dl className="space-y-4 px-5 py-5">
            <InfoRow icon={<Users className="size-4" />} label="Group" value={selectedOutreach.groupName ?? "Unassigned"} />
            <InfoRow icon={<CalendarDays className="size-4" />} label="Date" value={formatDate(selectedOutreach.activityAt)} />
            <InfoRow icon={<MapPin className="size-4" />} label="Location" value={selectedOutreach.location ?? "-"} />
            <InfoRow icon={<Users className="size-4" />} label="People Reached" value={selectedOutreach.peopleReached ?? "-"} />
            <InfoRow icon={<HandHeart className="size-4" />} label="New Connections" value={selectedOutreach.newConnections ?? "-"} />
            <InfoRow icon={<Heart className="size-4" />} label="Decisions" value={selectedOutreach.decisions ?? "-"} />
            <InfoRow icon={<FileBarChart className="size-4" />} label="Follow-up" value={selectedOutreach.followUpRate === null ? "-" : `${selectedOutreach.followUpRate}%`} />
            <InfoRow icon={<MoreVertical className="size-4" />} label="Notes" value={<span className="font-normal">{selectedOutreach.notes ?? "-"}</span>} />
          </dl>
        </>
      ) : (
        <>
          <div className="px-5 py-5">
            <Button type="button" variant="outline" className="h-10 rounded-lg bg-background">
              Last 30 Days
            </Button>
            <div className="mt-6 flex justify-center">
              <div className="flex size-32 items-center justify-center rounded-full border-[14px] border-primary/20 text-center">
                <div>
                  <p className="text-2xl font-semibold text-foreground">{numberFormat(data.stats.peopleReached)}</p>
                  <p className="text-xs text-muted-foreground">People Reached</p>
                </div>
              </div>
            </div>
            <div className="mt-5 space-y-2 text-sm">
              {Object.entries(typeCounts).map(([type, count]) => (
                <div key={type} className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">{type}</span>
                  <span className="font-medium text-foreground">{count}</span>
                </div>
              ))}
            </div>
          </div>
          <Separator />
          <div className="px-5 py-5">
            <h3 className="text-sm font-semibold text-foreground">Recent Follow-ups</h3>
            <div className="mt-4 space-y-3">
              {recentFollowUps.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{item.responsiblePerson?.name ?? "Unassigned"}</p>
                    <p className="truncate text-xs text-muted-foreground">{item.title}</p>
                  </div>
                  <StatusPill status={item.status === "completed" ? "contacted" : item.status} />
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      <Separator />
      <div className="px-5 py-5">
        <Button
          type="button"
          variant="outline"
          className="h-11 w-full justify-between rounded-lg bg-background"
          onClick={() =>
            onDialogChange({
              type: "generate-report",
              reportKind: "outreach",
              groupId: selectedOutreach?.groupId ?? undefined,
            })
          }
        >
          <span className="inline-flex items-center gap-2">
            <FileBarChart className="size-4" aria-hidden="true" />
            View Outreach Report
          </span>
          <ChevronRight className="size-4" aria-hidden="true" />
        </Button>
      </div>
    </ChurchRightRail>
  );
}

export function OutreachTab({
  data,
  outreachState,
  selectedOutreach,
  onOutreachStateChange,
  onSelectOutreach,
  onDialogChange,
}: {
  data: SmallGroupsWorkspaceData;
  outreachState: OutreachState;
  selectedOutreach: OutreachActivityViewModel | null;
  onOutreachStateChange: (state: Partial<OutreachState>) => void;
  onSelectOutreach: (outreachId: string) => void;
  onDialogChange: (dialog: SmallGroupsDialog) => void;
}) {
  const rows = useMemo(
    () => filterActivities(data.outreachActivities, outreachState),
    [data.outreachActivities, outreachState]
  );
  const activeFilters = hasFilters(outreachState);

  return (
    <div className="min-w-0 space-y-4">
      <OutreachImpactStrip data={data} />
      <ChurchContentGrid className="items-start gap-3 xl:grid-cols-[minmax(0,1fr)_340px]">
        <section className="min-w-0">
          <OutreachToolbar
            data={data}
            outreachState={outreachState}
            onOutreachStateChange={onOutreachStateChange}
          />
          <OutreachStateTabs
            data={data}
            outreachState={outreachState}
            onOutreachStateChange={onOutreachStateChange}
          />
          <OutreachRegistry
            rows={rows}
            selectedOutreach={selectedOutreach}
            onSelectOutreach={onSelectOutreach}
            onDialogChange={onDialogChange}
            hasActiveFilters={activeFilters}
          />
        </section>
        <OutreachSummaryPanel
          data={data}
          selectedOutreach={selectedOutreach}
          onClear={() => onSelectOutreach("")}
          onDialogChange={onDialogChange}
        />
      </ChurchContentGrid>
    </div>
  );
}
