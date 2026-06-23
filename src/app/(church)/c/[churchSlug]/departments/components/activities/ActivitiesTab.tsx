"use client";

import Link from "next/link";
import { CalendarDays, Megaphone, MapPin, Plus } from "lucide-react";
import {
  ChurchContentGrid,
  ChurchMainPanel,
  ChurchRightRail,
} from "@/components/church-workspace";
import { Button } from "@/components/ui/button";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils/cn";
import type {
  ActivitiesState,
  ActivityViewModel,
  DepartmentDialog,
  DepartmentWorkspaceBundle,
} from "../types";
import {
  EmptyState,
  NativeSelect,
  QuietBadge,
  RegistryPagination,
  RowActions,
  SearchField,
  StatusPill,
  formatDate,
  formatDateTime,
  formatNumber,
  includesNeedle,
  pageSize,
  paginate,
} from "../shared";

function filterActivities(rows: ActivityViewModel[], state: ActivitiesState) {
  return rows.filter((activity) => {
    if (state.status && activity.status !== state.status) return false;
    if (state.source && activity.source !== state.source) return false;

    return includesNeedle(
      [
        activity.title,
        activity.description,
        activity.category,
        activity.status,
        activity.workflowState,
        activity.location,
        activity.createdByName,
      ],
      state.search
    );
  });
}

function uniqueStatusOptions(rows: ActivityViewModel[]) {
  return Array.from(new Set(rows.map((activity) => activity.status).filter(Boolean)))
    .sort()
    .map((value) => ({ value, label: value.replace(/_/g, " ") }));
}

function ActivityIcon({ source }: { source: ActivityViewModel["source"] }) {
  const Icon = source === "announcement" ? Megaphone : CalendarDays;

  return (
    <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
      <Icon className="size-4" aria-hidden="true" />
    </span>
  );
}

function ActivityInspector({
  churchSlug,
  bundle,
  selectedActivity,
  onDialogChange,
}: {
  churchSlug: string;
  bundle: DepartmentWorkspaceBundle;
  selectedActivity: ActivityViewModel | null;
  onDialogChange: (dialog: DepartmentDialog) => void;
}) {
  const workflowHref =
    selectedActivity?.source === "announcement"
      ? `/c/${churchSlug}/departments/${bundle.department.id}/announcements`
      : `/c/${churchSlug}/departments/${bundle.department.id}/events`;

  return (
    <ChurchRightRail className="self-start">
      <div className="border-b border-border px-5 py-4">
        <h2 className="text-base font-semibold text-foreground">Activity Detail</h2>
        <p className="mt-1 text-sm text-muted-foreground">Event and announcement context.</p>
      </div>

      {selectedActivity ? (
        <div className="flex flex-col gap-5 p-5">
          <div className="flex min-w-0 items-start gap-3">
            <ActivityIcon source={selectedActivity.source} />
            <div className="min-w-0 flex-1">
              <h3 className="text-base font-semibold text-foreground">{selectedActivity.title}</h3>
              <div className="mt-2 flex flex-wrap gap-2">
                <StatusPill status={selectedActivity.status} />
                <QuietBadge>{selectedActivity.source}</QuietBadge>
              </div>
            </div>
          </div>

          <p className="text-sm leading-6 text-muted-foreground">
            {selectedActivity.description || "No description has been recorded for this activity."}
          </p>

          <dl className="grid gap-3 text-sm">
            {[
              ["Category", selectedActivity.category || "-"],
              ["Workflow", selectedActivity.workflowState || "-"],
              ["Date", formatDateTime(selectedActivity.date)],
              ["Ends", formatDateTime(selectedActivity.endDate)],
              ["Location", selectedActivity.location || "-"],
              ["Created by", selectedActivity.createdByName || "-"],
            ].map(([label, value]) => (
              <div
                key={label}
                className="flex items-center justify-between gap-4 rounded-lg border border-border bg-muted/30 px-3 py-2.5"
              >
                <dt className="text-muted-foreground">{label}</dt>
                <dd className="text-right font-semibold text-foreground">{value}</dd>
              </div>
            ))}
          </dl>

          <div className="grid gap-2">
            <Button asChild variant="outline" className="justify-between rounded-lg bg-background">
              <Link href={workflowHref}>Open dedicated workflow</Link>
            </Button>
            <Button
              type="button"
              variant="outline"
              className="justify-between rounded-lg bg-background"
              onClick={() => onDialogChange({ type: "create-activity", departmentId: bundle.department.id })}
            >
              <span className="inline-flex items-center gap-2">
                <Plus data-icon="inline-start" aria-hidden="true" />
                Add Activity
              </span>
            </Button>
          </div>
        </div>
      ) : (
        <div className="p-5">
          <EmptyState
            title="No activity selected"
            message="Choose an event or announcement from the activity register."
          />
        </div>
      )}
    </ChurchRightRail>
  );
}

export function ActivitiesTab({
  churchSlug,
  bundle,
  state,
  selectedActivity,
  onStateChange,
  onSelectActivity,
  onDialogChange,
}: {
  churchSlug: string;
  bundle: DepartmentWorkspaceBundle | null;
  state: ActivitiesState;
  selectedActivity: ActivityViewModel | null;
  onStateChange: (next: Partial<ActivitiesState>) => void;
  onSelectActivity: (activityId: string | null) => void;
  onDialogChange: (dialog: DepartmentDialog) => void;
}) {
  if (!bundle) {
    return (
      <EmptyState
        title="No department selected"
        message="Select a department from the overview registry to review its activities."
      />
    );
  }

  const filteredRows = filterActivities(bundle.activities, state);
  const pageCount = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const rows = paginate(filteredRows, state.page);
  const eventCount = bundle.activities.filter((activity) => activity.source === "event").length;
  const announcementCount = bundle.activities.filter((activity) => activity.source === "announcement").length;

  return (
    <div className="flex min-w-0 flex-col gap-5">
      <div className="grid gap-3 md:grid-cols-3">
        {[
          ["Total Activities", bundle.activities.length],
          ["Events", eventCount],
          ["Announcements", announcementCount],
        ].map(([label, value]) => (
          <section key={label} className="rounded-xl border border-border bg-background p-5 shadow-sm">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="mt-2 text-2xl font-semibold leading-none text-foreground">
              {formatNumber(value as number)}
            </p>
          </section>
        ))}
      </div>

      <ChurchContentGrid className="lg:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[minmax(0,1fr)_340px]">
        <ChurchMainPanel className="min-w-0">
          <div className="flex flex-col gap-3 border-b border-border px-5 py-4 2xl:flex-row 2xl:items-center 2xl:justify-between">
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-foreground">Activity Register</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Real events and announcements for {bundle.department.name}.
              </p>
            </div>
            <div className="grid min-w-0 gap-2 sm:grid-cols-[minmax(220px,320px)_150px_150px]">
              <SearchField
                id="department-activity-search"
                value={state.search}
                onChange={(search) => onStateChange({ search })}
                placeholder="Search activities..."
              />
              <NativeSelect
                label="Activity source"
                value={state.source}
                onChange={(source) => onStateChange({ source })}
                allLabel="All sources"
                options={[
                  { value: "event", label: "Events" },
                  { value: "announcement", label: "Announcements" },
                ]}
              />
              <NativeSelect
                label="Activity status"
                value={state.status}
                onChange={(status) => onStateChange({ status })}
                allLabel="All statuses"
                options={uniqueStatusOptions(bundle.activities)}
              />
            </div>
          </div>

          {filteredRows.length === 0 ? (
            <div className="p-5">
              <EmptyState
                title="No activities found"
                message="No real event or announcement records match the current filters."
                action={
                  <Button
                    type="button"
                    onClick={() => onDialogChange({ type: "create-activity", departmentId: bundle.department.id })}
                    className="rounded-lg"
                  >
                    <Plus data-icon="inline-start" aria-hidden="true" />
                    Add Activity
                  </Button>
                }
              />
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table className="min-w-[900px]">
                  <TableHeader>
                    <TableRow className="bg-muted/40">
                      <TableHead>Activity</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Created By</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((activity) => {
                      const selected = selectedActivity?.id === activity.id;

                      return (
                        <TableRow
                          key={`${activity.source}-${activity.id}`}
                          data-state={selected ? "selected" : undefined}
                          className={cn("cursor-pointer", selected && "bg-primary/5 hover:bg-primary/10")}
                          onClick={() => onSelectActivity(activity.id)}
                        >
                          <TableCell className="min-w-[300px] py-3">
                            <div className="flex min-w-0 items-center gap-3">
                              <ActivityIcon source={activity.source} />
                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-foreground">{activity.title}</p>
                                <p className="truncate text-xs text-muted-foreground">
                                  {activity.description || activity.category}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <QuietBadge>{activity.source}</QuietBadge>
                          </TableCell>
                          <TableCell>
                            <StatusPill status={activity.status} />
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatDate(activity.date)}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            <span className="inline-flex items-center gap-2">
                              <MapPin className="size-4" aria-hidden="true" />
                              {activity.location || "-"}
                            </span>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {activity.createdByName || "-"}
                          </TableCell>
                          <TableCell className="text-right" onClick={(event) => event.stopPropagation()}>
                            <RowActions label={`Open actions for ${activity.title}`}>
                              <DropdownMenuItem onSelect={() => onSelectActivity(activity.id)}>
                                Inspect activity
                              </DropdownMenuItem>
                            </RowActions>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              <RegistryPagination
                label={`Showing ${rows.length} of ${filteredRows.length} activities`}
                page={state.page}
                pageCount={pageCount}
                onPageChange={(page) => onStateChange({ page })}
              />
            </>
          )}
        </ChurchMainPanel>

        <ActivityInspector
          churchSlug={churchSlug}
          bundle={bundle}
          selectedActivity={selectedActivity}
          onDialogChange={onDialogChange}
        />
      </ChurchContentGrid>
    </div>
  );
}
