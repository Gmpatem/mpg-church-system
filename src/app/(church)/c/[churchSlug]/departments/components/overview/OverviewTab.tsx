"use client";

import { Building2, CalendarDays, Edit3, Users, WalletCards } from "lucide-react";
import {
  ChurchContentGrid,
  ChurchMainPanel,
  ChurchRightRail,
} from "@/components/church-workspace";
import { Button } from "@/components/ui/button";
import {
  DropdownMenuItem,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
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
  DepartmentsWorkspaceData,
} from "../types";
import {
  DepartmentAvatarBadge,
  EmptyState,
  NativeSelect,
  RegistryPagination,
  RowActions,
  SearchField,
  StatusPill,
  formatCurrency,
  formatNumber,
  includesNeedle,
  pageSize,
  paginate,
} from "../shared";

function MetricCard({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  hint: string;
  icon: typeof Building2;
}) {
  return (
    <section className="rounded-xl border border-border bg-background p-5 shadow-sm">
      <div className="flex min-w-0 items-center gap-4">
        <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="size-5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-1 text-2xl font-semibold leading-none text-foreground">{value}</p>
          <p className="mt-2 text-xs leading-5 text-muted-foreground">{hint}</p>
        </div>
      </div>
    </section>
  );
}

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

function DepartmentInspector({
  selectedDepartment,
  onOpenPeople,
  onOpenBudget,
  onDialogChange,
}: {
  selectedDepartment: DepartmentViewModel | null;
  onOpenPeople: (departmentId: string) => void;
  onOpenBudget: (departmentId: string) => void;
  onDialogChange: (dialog: DepartmentDialog) => void;
}) {
  return (
    <ChurchRightRail className="self-start">
      <div className="border-b border-border px-5 py-4">
        <h2 className="text-base font-semibold text-foreground">Selected Department</h2>
        <p className="mt-1 text-sm text-muted-foreground">Profile and operational signals.</p>
      </div>

      {selectedDepartment ? (
        <div className="flex flex-col gap-5 p-5">
          <div className="flex min-w-0 items-start gap-3">
            <DepartmentAvatarBadge name={selectedDepartment.name} className="size-12" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="truncate text-lg font-semibold text-foreground">{selectedDepartment.name}</h3>
                <StatusPill status={selectedDepartment.isActive ? "active" : "inactive"} />
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{selectedDepartment.code || "No code"}</p>
            </div>
          </div>

          <p className="text-sm leading-6 text-muted-foreground">
            {selectedDepartment.description || "No description has been added for this department."}
          </p>

          <dl className="grid gap-3 text-sm">
            {[
              ["Members", formatNumber(selectedDepartment.memberCount)],
              ["Active assignments", formatNumber(selectedDepartment.activeMemberCount)],
              ["Leadership records", formatNumber(selectedDepartment.leaderCount)],
              ["Activities", formatNumber(selectedDepartment.eventCount + selectedDepartment.announcementCount)],
              ["Pending requests", formatNumber(selectedDepartment.pendingRequestCount)],
              ["Fund balance", selectedDepartment.balance === null ? "Not mapped" : formatCurrency(selectedDepartment.balance)],
            ].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between gap-4 rounded-lg border border-border bg-muted/30 px-3 py-2.5">
                <dt className="text-muted-foreground">{label}</dt>
                <dd className="text-right font-semibold text-foreground">{value}</dd>
              </div>
            ))}
          </dl>

          <div className="grid gap-2">
            <Button
              type="button"
              variant="outline"
              className="justify-between rounded-lg bg-background"
              onClick={() => onDialogChange({ type: "edit-department", departmentId: selectedDepartment.id })}
            >
              <span className="inline-flex items-center gap-2">
                <Edit3 data-icon="inline-start" aria-hidden="true" />
                Edit Department
              </span>
            </Button>
            <Button
              type="button"
              variant="outline"
              className="justify-between rounded-lg bg-background"
              onClick={() => onOpenPeople(selectedDepartment.id)}
            >
              <span className="inline-flex items-center gap-2">
                <Users data-icon="inline-start" aria-hidden="true" />
                Manage People
              </span>
            </Button>
            <Button
              type="button"
              variant="outline"
              className="justify-between rounded-lg bg-background"
              onClick={() => onOpenBudget(selectedDepartment.id)}
            >
              <span className="inline-flex items-center gap-2">
                <WalletCards data-icon="inline-start" aria-hidden="true" />
                Open Budget
              </span>
            </Button>
          </div>
        </div>
      ) : (
        <div className="p-5">
          <EmptyState
            title="No department selected"
            message="Choose a department from the registry to inspect its profile and linked work."
          />
        </div>
      )}
    </ChurchRightRail>
  );
}

export function OverviewTab({
  data,
  state,
  selectedDepartment,
  onStateChange,
  onSelectDepartment,
  onOpenPeople,
  onOpenBudget,
  onDialogChange,
}: {
  data: DepartmentsWorkspaceData;
  state: DepartmentFilterState;
  selectedDepartment: DepartmentViewModel | null;
  onStateChange: (next: Partial<DepartmentFilterState>) => void;
  onSelectDepartment: (departmentId: string) => void;
  onOpenPeople: (departmentId: string) => void;
  onOpenBudget: (departmentId: string) => void;
  onDialogChange: (dialog: DepartmentDialog) => void;
}) {
  const filteredRows = filterDepartments(data.departments, state);
  const pageCount = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const rows = paginate(filteredRows, state.page);

  return (
    <div className="flex min-w-0 flex-col gap-5">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Total Departments"
          value={formatNumber(data.stats.totalDepartments)}
          hint="All visible department records"
          icon={Building2}
        />
        <MetricCard
          label="Active Departments"
          value={formatNumber(data.stats.activeDepartments)}
          hint={`${data.stats.inactiveDepartments} inactive`}
          icon={CalendarDays}
        />
        <MetricCard
          label="Assigned Members"
          value={formatNumber(data.stats.assignedMembers)}
          hint={`${data.stats.unassignedDepartments} departments unassigned`}
          icon={Users}
        />
        <MetricCard
          label="Pending Requests"
          value={formatNumber(data.stats.pendingFundRequests)}
          hint="Treasury fund requests"
          icon={WalletCards}
        />
      </div>

      <ChurchContentGrid className="lg:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[minmax(0,1fr)_340px]">
        <ChurchMainPanel className="min-w-0">
          <div className="flex flex-col gap-3 border-b border-border px-5 py-4 2xl:flex-row 2xl:items-center 2xl:justify-between">
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-foreground">Department Registry</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Search, select, and inspect real department records.
              </p>
            </div>
            <div className="grid min-w-0 gap-2 sm:grid-cols-[minmax(220px,320px)_160px]">
              <SearchField
                id="department-registry-search"
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
          </div>

          {filteredRows.length === 0 ? (
            <div className="p-5">
              <EmptyState
                title="No departments found"
                message="No department records match the current filters."
              />
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table className="min-w-[760px]">
                  <TableHeader>
                    <TableRow className="bg-muted/40">
                      <TableHead className="min-w-[260px]">Department</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Members</TableHead>
                      <TableHead>Activities</TableHead>
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
                          onClick={() => onSelectDepartment(department.id)}
                        >
                          <TableCell className="min-w-[260px] py-3">
                            <button type="button" className="flex min-w-0 items-center gap-3 text-left">
                              <DepartmentAvatarBadge name={department.name} />
                              <span className="min-w-0">
                                <span className="block truncate text-sm font-semibold text-foreground">
                                  {department.name}
                                </span>
                                <span className="block truncate text-xs text-muted-foreground">
                                  {department.code || department.description || "No code"}
                                </span>
                              </span>
                            </button>
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
                          <TableCell className="text-sm text-muted-foreground">
                            {formatNumber(department.eventCount + department.announcementCount)}
                          </TableCell>
                          <TableCell className="text-sm font-medium text-foreground">
                            {department.balance === null ? "-" : formatCurrency(department.balance)}
                          </TableCell>
                          <TableCell className="text-right" onClick={(event) => event.stopPropagation()}>
                            <RowActions label={`Open actions for ${department.name}`}>
                              <DropdownMenuGroup>
                                <DropdownMenuItem onSelect={() => onSelectDepartment(department.id)}>
                                  Select department
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onSelect={() => onDialogChange({ type: "edit-department", departmentId: department.id })}
                                >
                                  Edit department
                                </DropdownMenuItem>
                                <DropdownMenuItem onSelect={() => onOpenPeople(department.id)}>
                                  Manage people
                                </DropdownMenuItem>
                                <DropdownMenuItem onSelect={() => onOpenBudget(department.id)}>
                                  Open budget
                                </DropdownMenuItem>
                              </DropdownMenuGroup>
                            </RowActions>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              <RegistryPagination
                label={`Showing ${rows.length} of ${filteredRows.length} departments`}
                page={state.page}
                pageCount={pageCount}
                onPageChange={(page) => onStateChange({ page })}
              />
            </>
          )}
        </ChurchMainPanel>

        <DepartmentInspector
          selectedDepartment={selectedDepartment}
          onOpenPeople={onOpenPeople}
          onOpenBudget={onOpenBudget}
          onDialogChange={onDialogChange}
        />
      </ChurchContentGrid>
    </div>
  );
}
