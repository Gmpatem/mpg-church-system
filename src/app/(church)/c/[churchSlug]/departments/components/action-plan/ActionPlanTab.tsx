"use client";

import { CalendarClock, ListChecks, Target } from "lucide-react";
import {
  ChurchContentGrid,
  ChurchMainPanel,
  ChurchRightRail,
} from "@/components/church-workspace";
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
  ActionPlanItemViewModel,
  ActionPlanState,
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
  formatNumber,
  includesNeedle,
  pageSize,
  paginate,
} from "../shared";

function filterItems(rows: ActionPlanItemViewModel[], state: ActionPlanState) {
  return rows.filter((item) => {
    if (state.status && item.status !== state.status) return false;
    if (state.priority && item.priority !== state.priority) return false;

    return includesNeedle(
      [
        item.title,
        item.description,
        item.area,
        item.status,
        item.priority,
        item.assignedToName,
      ],
      state.search
    );
  });
}

function uniqueOptions(rows: ActionPlanItemViewModel[], key: "status" | "priority") {
  return Array.from(new Set(rows.map((item) => item[key]).filter(Boolean) as string[]))
    .sort()
    .map((value) => ({ value, label: value.replace(/_/g, " ") }));
}

function ProgressMeter({ value }: { value: number | null }) {
  const safeValue = Math.max(0, Math.min(100, Number(value ?? 0)));

  return (
    <div className="flex min-w-[120px] items-center gap-3">
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-primary" style={{ width: `${safeValue}%` }} />
      </div>
      <span className="w-10 text-right text-xs font-medium text-muted-foreground">
        {value === null ? "-" : `${safeValue}%`}
      </span>
    </div>
  );
}

function ActionPlanInspector({
  selectedItem,
}: {
  selectedItem: ActionPlanItemViewModel | null;
}) {
  return (
    <ChurchRightRail className="self-start">
      <div className="border-b border-border px-5 py-4">
        <h2 className="text-base font-semibold text-foreground">Selected Item</h2>
        <p className="mt-1 text-sm text-muted-foreground">Read-only action-plan details.</p>
      </div>

      {selectedItem ? (
        <div className="flex flex-col gap-5 p-5">
          <div className="flex items-start gap-3">
            <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Target className="size-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <h3 className="text-base font-semibold text-foreground">{selectedItem.title}</h3>
              <div className="mt-2 flex flex-wrap gap-2">
                <StatusPill status={selectedItem.status} />
                {selectedItem.priority ? <QuietBadge>{selectedItem.priority}</QuietBadge> : null}
              </div>
            </div>
          </div>

          <p className="text-sm leading-6 text-muted-foreground">
            {selectedItem.description || "No description has been recorded for this item."}
          </p>

          <dl className="grid gap-3 text-sm">
            {[
              ["Area", selectedItem.area || "-"],
              ["Due date", formatDate(selectedItem.dueDate)],
              ["Assigned to", selectedItem.assignedToName || "-"],
              ["Related event", selectedItem.relatedEventId || "-"],
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

          <div>
            <p className="mb-2 text-sm font-medium text-foreground">Progress</p>
            <ProgressMeter value={selectedItem.progress} />
          </div>
        </div>
      ) : (
        <div className="p-5">
          <EmptyState
            title="No action item selected"
            message="Choose an item from the action-plan register to review its details."
          />
        </div>
      )}
    </ChurchRightRail>
  );
}

export function ActionPlanTab({
  bundle,
  state,
  selectedItem,
  onStateChange,
  onSelectItem,
  canMutate,
  onEditItem,
}: {
  bundle: DepartmentWorkspaceBundle | null;
  state: ActionPlanState;
  selectedItem: ActionPlanItemViewModel | null;
  onStateChange: (next: Partial<ActionPlanState>) => void;
  onSelectItem: (itemId: string | null) => void;
  canMutate: boolean;
  onEditItem: (itemId: string) => void;
}) {
  if (!bundle) {
    return (
      <EmptyState
        title="No department selected"
        message="Select a department from the overview registry to review its action plan."
      />
    );
  }

  if (!bundle.actionPlan.isConfigured) {
    return (
      <EmptyState
        title="Action plan unavailable"
        message={bundle.actionPlan.unavailableReason ?? "Action-plan storage is not configured for this workspace."}
      />
    );
  }

  const filteredRows = filterItems(bundle.actionPlan.items, state);
  const pageCount = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const rows = paginate(filteredRows, state.page);
  const statusOptions = uniqueOptions(bundle.actionPlan.items, "status");
  const priorityOptions = uniqueOptions(bundle.actionPlan.items, "priority");

  return (
    <ChurchContentGrid className="lg:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[minmax(0,1fr)_340px]">
      <ChurchMainPanel className="min-w-0">
        <div className="flex flex-col gap-3 border-b border-border px-5 py-4 2xl:flex-row 2xl:items-center 2xl:justify-between">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-foreground">Action Items</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {formatNumber(bundle.actionPlan.items.length)} real items linked to {bundle.department.name}.
            </p>
          </div>
          <div className="grid min-w-0 gap-2 sm:grid-cols-[minmax(220px,320px)_150px_150px]">
            <SearchField
              id="department-action-search"
              value={state.search}
              onChange={(search) => onStateChange({ search })}
              placeholder="Search action items..."
            />
            <NativeSelect
              label="Action item status"
              value={state.status}
              onChange={(status) => onStateChange({ status })}
              allLabel="All statuses"
              options={statusOptions}
            />
            <NativeSelect
              label="Action item priority"
              value={state.priority}
              onChange={(priority) => onStateChange({ priority })}
              allLabel="All priorities"
              options={priorityOptions}
            />
          </div>
        </div>

        {filteredRows.length === 0 ? (
          <div className="p-5">
            <EmptyState
              title="No action items found"
              message="No department-linked action items match the current filters."
            />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table className="min-w-[900px]">
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead>Action Item</TableHead>
                    <TableHead>Area</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Due</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((item) => {
                    const selected = selectedItem?.id === item.id;

                    return (
                      <TableRow
                        key={item.id}
                        data-state={selected ? "selected" : undefined}
                        className={cn("cursor-pointer", selected && "bg-primary/5 hover:bg-primary/10")}
                        onClick={() => onSelectItem(item.id)}
                      >
                        <TableCell className="min-w-[280px] py-3">
                          <div className="flex min-w-0 items-center gap-3">
                            <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                              <ListChecks className="size-4" aria-hidden="true" />
                            </span>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-foreground">{item.title}</p>
                              <p className="truncate text-xs text-muted-foreground">
                                {item.description || "No description"}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{item.area ? <QuietBadge>{item.area}</QuietBadge> : "-"}</TableCell>
                        <TableCell>
                          <StatusPill status={item.status} />
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          <span className="inline-flex items-center gap-2">
                            <CalendarClock className="size-4" aria-hidden="true" />
                            {formatDate(item.dueDate)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <ProgressMeter value={item.progress} />
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {item.assignedToName || "-"}
                        </TableCell>
                        <TableCell className="text-right" onClick={(event) => event.stopPropagation()}>
                          <RowActions label={`Open actions for ${item.title}`}>
                            <DropdownMenuItem onSelect={() => onSelectItem(item.id)}>
                              Inspect item
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              disabled={!canMutate}
                              onSelect={() => onEditItem(item.id)}
                            >
                              Edit item
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
              label={`Showing ${rows.length} of ${filteredRows.length} action items`}
              page={state.page}
              pageCount={pageCount}
              onPageChange={(page) => onStateChange({ page })}
            />
          </>
        )}
      </ChurchMainPanel>

      <ActionPlanInspector selectedItem={selectedItem} />
    </ChurchContentGrid>
  );
}
