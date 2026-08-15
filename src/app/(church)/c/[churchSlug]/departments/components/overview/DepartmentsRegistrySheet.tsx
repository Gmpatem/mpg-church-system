"use client";

import { Edit3, Users, WalletCards } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
  DepartmentDialog,
  DepartmentFilterState,
  DepartmentViewModel,
} from "../types";
import {
  DepartmentAvatarBadge,
  EmptyState,
  NativeSelect,
  SearchField,
  StatusPill,
  formatCurrency,
  formatNumber,
  includesNeedle,
} from "../shared";

function filterDepartments(rows: DepartmentViewModel[], state: DepartmentFilterState) {
  return rows.filter((department) => {
    if (state.status === "active" && !department.isActive) return false;
    if (state.status === "inactive" && department.isActive) return false;

    return includesNeedle(
      [
        department.name,
        department.code,
        department.description,
        department.memberCount,
        department.eventCount,
      ],
      state.search
    );
  });
}

export function DepartmentsRegistrySheet({
  open,
  data,
  state,
  selectedDepartment,
  onOpenChange,
  onStateChange,
  onSelectDepartment,
  onOpenPeople,
  onOpenBudget,
  onDialogChange,
}: {
  open: boolean;
  data: DepartmentViewModel[];
  state: DepartmentFilterState;
  selectedDepartment: DepartmentViewModel | null;
  onOpenChange: (open: boolean) => void;
  onStateChange: (next: Partial<DepartmentFilterState>) => void;
  onSelectDepartment: (departmentId: string) => void;
  onOpenPeople: (departmentId: string) => void;
  onOpenBudget: (departmentId: string) => void;
  onDialogChange: (dialog: DepartmentDialog) => void;
}) {
  const rows = filterDepartments(data, state);

  function selectDepartment(departmentId: string) {
    onSelectDepartment(departmentId);
    onOpenChange(false);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-[min(100vw,820px)] max-w-none flex-col gap-0 p-0 sm:max-w-[820px]"
      >
        <SheetHeader className="border-b border-border px-5 py-4 text-left">
          <SheetTitle>Department Registry</SheetTitle>
          <SheetDescription>
            Search, select, and open Department workspaces without changing the Overview layout.
          </SheetDescription>
        </SheetHeader>

        <div className="grid gap-3 border-b border-border px-5 py-4 sm:grid-cols-[minmax(0,1fr)_180px]">
          <SearchField
            id="department-registry-sheet-search"
            value={state.search}
            onChange={(search) => onStateChange({ search })}
            placeholder="Search departments..."
          />
          <NativeSelect
            label="Department status"
            value={state.status}
            onChange={(status) => onStateChange({ status })}
            allLabel="All statuses"
            options={[
              { value: "active", label: "Active" },
              { value: "inactive", label: "Inactive" },
            ]}
          />
        </div>

        <div className="min-h-0 flex-1 overflow-auto">
          {rows.length === 0 ? (
            <div className="p-5">
              <EmptyState
                title="No departments found"
                message="No department records match the current filters."
              />
            </div>
          ) : (
            <Table className="min-w-[720px]">
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead className="min-w-[260px]">Department</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Members</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((department) => {
                  const selected = selectedDepartment?.id === department.id;

                  return (
                    <TableRow
                      key={department.id}
                      data-state={selected ? "selected" : undefined}
                      className={cn(
                        "cursor-pointer",
                        selected && "bg-primary/5 hover:bg-primary/10"
                      )}
                      onClick={() => selectDepartment(department.id)}
                    >
                      <TableCell className="min-w-[260px] py-3">
                        <span className="flex min-w-0 items-center gap-3">
                          <DepartmentAvatarBadge name={department.name} />
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-semibold text-foreground">
                              {department.name}
                            </span>
                            <span className="block truncate text-xs text-muted-foreground">
                              {department.code || department.description || "No code"}
                            </span>
                          </span>
                        </span>
                      </TableCell>
                      <TableCell>
                        <StatusPill status={department.isActive ? "active" : "inactive"} />
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-semibold text-foreground">
                          {formatNumber(department.activeMemberCount)}
                        </span>
                        <span className="ml-1 text-xs text-muted-foreground">
                          / {formatNumber(department.memberCount)}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm font-medium text-foreground">
                        {department.balance === null ? "-" : formatCurrency(department.balance)}
                      </TableCell>
                      <TableCell
                        className="text-right"
                        onClick={(event) => event.stopPropagation()}
                      >
                        <div className="flex justify-end gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-8 rounded-lg"
                            aria-label={`Edit ${department.name}`}
                            onClick={() =>
                              onDialogChange({
                                type: "manage-department",
                                departmentId: department.id,
                                section: "details",
                              })
                            }
                          >
                            <Edit3 className="size-4" aria-hidden="true" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-8 rounded-lg"
                            aria-label={`Manage people for ${department.name}`}
                            onClick={() => onOpenPeople(department.id)}
                          >
                            <Users className="size-4" aria-hidden="true" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-8 rounded-lg"
                            aria-label={`Open budget for ${department.name}`}
                            onClick={() => onOpenBudget(department.id)}
                          >
                            <WalletCards className="size-4" aria-hidden="true" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
