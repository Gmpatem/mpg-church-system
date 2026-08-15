"use client";

import { Crown, Mail, Phone, ShieldCheck, UserPlus } from "lucide-react";
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
  DepartmentDialog,
  DepartmentWorkspaceBundle,
  PeopleState,
  PersonViewModel,
} from "../types";
import {
  EmptyState,
  NativeSelect,
  PersonIdentity,
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

function filterPeople(rows: PersonViewModel[], state: PeopleState) {
  return rows.filter((person) => {
    if (state.status === "active" && !person.isActive) return false;
    if (state.status === "inactive" && person.isActive) return false;
    if (state.role && person.roleTitle !== state.role) return false;

    return includesNeedle(
      [
        person.name,
        person.email,
        person.phone,
        person.memberCode,
        person.membershipStatus,
        person.roleTitle,
      ],
      state.search
    );
  });
}

function roleOptions(rows: PersonViewModel[]) {
  return Array.from(new Set(rows.map((person) => person.roleTitle).filter(Boolean) as string[]))
    .sort()
    .map((role) => ({ value: role, label: role }));
}

function LeadershipStrip({ bundle }: { bundle: DepartmentWorkspaceBundle }) {
  const activeLeaders = bundle.leadershipAssignments;

  return (
    <section className="rounded-xl border border-border bg-background shadow-sm">
      <div className="flex flex-col gap-2 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-foreground">Leadership Team</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Verified department leadership assignments.
          </p>
        </div>
        <QuietBadge>{formatNumber(activeLeaders.length)} records</QuietBadge>
      </div>

      {activeLeaders.length === 0 ? (
        <div className="p-5">
          <EmptyState
            title="No verified leadership records"
            message="Leadership assignments will appear here when the department leadership table has active records."
          />
        </div>
      ) : (
        <div className="grid gap-0 divide-y divide-border lg:grid-cols-3 lg:divide-x lg:divide-y-0">
          {activeLeaders.slice(0, 3).map((leader) => (
            <div key={leader.id} className="flex min-w-0 items-start gap-3 p-5">
              <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                {leader.isPrimary ? (
                  <Crown className="size-4" aria-hidden="true" />
                ) : (
                  <ShieldCheck className="size-4" aria-hidden="true" />
                )}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">
                  {leader.memberName || "Unlinked member"}
                </p>
                <p className="mt-1 truncate text-xs text-muted-foreground">{leader.roleName}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Since {formatDate(leader.startDate)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function PersonInspector({
  selectedPerson,
  canManageAssignments,
  onDialogChange,
}: {
  selectedPerson: PersonViewModel | null;
  canManageAssignments: boolean;
  onDialogChange: (dialog: DepartmentDialog) => void;
}) {
  return (
    <ChurchRightRail className="self-start">
      <div className="border-b border-border px-5 py-4">
        <h2 className="text-base font-semibold text-foreground">Selected Person</h2>
        <p className="mt-1 text-sm text-muted-foreground">Department assignment details.</p>
      </div>

      {selectedPerson ? (
        <div className="flex flex-col gap-5 p-5">
          <PersonIdentity
            name={selectedPerson.name}
            email={selectedPerson.email}
            subtitle={selectedPerson.roleTitle || selectedPerson.memberCode}
          />

          <div className="flex flex-wrap gap-2">
            <StatusPill status={selectedPerson.isActive ? "active" : "inactive"} />
            {selectedPerson.membershipStatus ? (
              <QuietBadge>{selectedPerson.membershipStatus}</QuietBadge>
            ) : null}
          </div>

          <dl className="grid gap-3 text-sm">
            {[
              ["Role title", selectedPerson.roleTitle || "-"],
              ["Member code", selectedPerson.memberCode || "-"],
              ["Start date", formatDate(selectedPerson.startDate)],
              ["Assignment ID", selectedPerson.assignmentId],
            ].map(([label, value]) => (
              <div
                key={label}
                className="flex items-center justify-between gap-4 rounded-lg border border-border bg-muted/30 px-3 py-2.5"
              >
                <dt className="text-muted-foreground">{label}</dt>
                <dd className="max-w-[170px] truncate text-right font-semibold text-foreground">{value}</dd>
              </div>
            ))}
          </dl>

          <div className="grid gap-2 text-sm text-muted-foreground">
            <p className="inline-flex items-center gap-2">
              <Mail className="size-4" aria-hidden="true" />
              <span className="truncate">{selectedPerson.email || "No email"}</span>
            </p>
            <p className="inline-flex items-center gap-2">
              <Phone className="size-4" aria-hidden="true" />
              <span className="truncate">{selectedPerson.phone || "No phone"}</span>
            </p>
          </div>

          <div className="grid gap-2">
            <Button
              type="button"
              variant="outline"
              className="justify-between rounded-lg bg-background"
              disabled={!canManageAssignments}
              onClick={() =>
                onDialogChange({
                  type: "manage-department",
                  departmentId: selectedPerson.departmentId,
                  section: "members",
                  assignmentId: selectedPerson.assignmentId,
                })
              }
            >
              Edit Assignment
            </Button>
            <Button
              type="button"
              variant="outline"
              className="justify-between rounded-lg bg-background text-destructive hover:text-destructive"
              disabled={!canManageAssignments || !selectedPerson.isActive}
              onClick={() =>
                onDialogChange({
                  type: "manage-department",
                  departmentId: selectedPerson.departmentId,
                  section: "members",
                  assignmentId: selectedPerson.assignmentId,
                })
              }
            >
              Remove Assignment
            </Button>
          </div>
        </div>
      ) : (
        <div className="p-5">
          <EmptyState
            title="No person selected"
            message="Choose a department assignment to inspect contact and role details."
          />
        </div>
      )}
    </ChurchRightRail>
  );
}

export function PeopleTab({
  bundle,
  state,
  selectedPerson,
  canManageAssignments,
  onStateChange,
  onSelectPerson,
  onDialogChange,
}: {
  bundle: DepartmentWorkspaceBundle | null;
  state: PeopleState;
  selectedPerson: PersonViewModel | null;
  canManageAssignments: boolean;
  onStateChange: (next: Partial<PeopleState>) => void;
  onSelectPerson: (assignmentId: string | null) => void;
  onDialogChange: (dialog: DepartmentDialog) => void;
}) {
  if (!bundle) {
    return (
      <EmptyState
        title="No department selected"
        message="Select a department from the overview registry to review people assignments."
      />
    );
  }

  const filteredRows = filterPeople(bundle.people, state);
  const pageCount = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const rows = paginate(filteredRows, state.page);
  const activeCount = bundle.people.filter((person) => person.isActive).length;

  return (
    <div className="flex min-w-0 flex-col gap-5">
      <LeadershipStrip bundle={bundle} />

      <ChurchContentGrid className="lg:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[minmax(0,1fr)_340px]">
        <ChurchMainPanel className="min-w-0">
          <div className="flex flex-col gap-3 border-b border-border px-5 py-4 2xl:flex-row 2xl:items-center 2xl:justify-between">
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-foreground">People Registry</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {formatNumber(activeCount)} active of {formatNumber(bundle.people.length)} assignments.
              </p>
            </div>
            <div className="grid min-w-0 gap-2 sm:grid-cols-[minmax(220px,320px)_150px_170px]">
              <SearchField
                id="department-people-search"
                value={state.search}
                onChange={(search) => onStateChange({ search })}
                placeholder="Search people..."
              />
              <NativeSelect
                label="Assignment status"
                value={state.status}
                onChange={(status) => onStateChange({ status })}
                allLabel="All statuses"
                options={[
                  { value: "active", label: "Active" },
                  { value: "inactive", label: "Inactive" },
                ]}
              />
              <NativeSelect
                label="Role title"
                value={state.role}
                onChange={(role) => onStateChange({ role })}
                allLabel="All roles"
                options={roleOptions(bundle.people)}
              />
            </div>
          </div>

          {filteredRows.length === 0 ? (
            <div className="p-5">
              <EmptyState
                title="No people found"
                message="No member assignments match the current filters."
                action={
                  canManageAssignments ? (
                    <Button
                      type="button"
                      className="rounded-lg"
                      onClick={() =>
                        onDialogChange({
                          type: "manage-department",
                          departmentId: bundle.department.id,
                          section: "members",
                        })
                      }
                    >
                      <UserPlus data-icon="inline-start" aria-hidden="true" />
                      Add Person
                    </Button>
                  ) : null
                }
              />
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table className="min-w-[950px]">
                  <TableHeader>
                    <TableRow className="bg-muted/40">
                      <TableHead>Person</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Member Status</TableHead>
                      <TableHead>Start Date</TableHead>
                      <TableHead>Assignment</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((person) => {
                      const selected = selectedPerson?.assignmentId === person.assignmentId;

                      return (
                        <TableRow
                          key={person.assignmentId}
                          data-state={selected ? "selected" : undefined}
                          className={cn("cursor-pointer", selected && "bg-primary/5 hover:bg-primary/10")}
                          onClick={() => onSelectPerson(person.assignmentId)}
                        >
                          <TableCell className="min-w-[260px] py-3">
                            <PersonIdentity
                              name={person.name}
                              email={person.email}
                              subtitle={person.memberCode}
                            />
                          </TableCell>
                          <TableCell>
                            {person.roleTitle ? <QuietBadge>{person.roleTitle}</QuietBadge> : "-"}
                          </TableCell>
                          <TableCell className="max-w-[220px] text-sm text-muted-foreground">
                            <p className="truncate">{person.email || "-"}</p>
                            <p className="truncate">{person.phone || "-"}</p>
                          </TableCell>
                          <TableCell>
                            {person.membershipStatus ? (
                              <QuietBadge>{person.membershipStatus}</QuietBadge>
                            ) : (
                              "-"
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatDate(person.startDate)}
                          </TableCell>
                          <TableCell>
                            <StatusPill status={person.isActive ? "active" : "inactive"} />
                          </TableCell>
                          <TableCell className="text-right" onClick={(event) => event.stopPropagation()}>
                            <RowActions label={`Open actions for ${person.name}`}>
                              <DropdownMenuItem onSelect={() => onSelectPerson(person.assignmentId)}>
                                Inspect assignment
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                disabled={!canManageAssignments}
                                onSelect={() =>
                                  onDialogChange({
                                    type: "manage-department",
                                    departmentId: person.departmentId,
                                    section: "members",
                                    assignmentId: person.assignmentId,
                                  })
                                }
                              >
                                Edit assignment
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                disabled={!canManageAssignments || !person.isActive}
                                onSelect={() =>
                                  onDialogChange({
                                    type: "manage-department",
                                    departmentId: person.departmentId,
                                    section: "members",
                                    assignmentId: person.assignmentId,
                                  })
                                }
                              >
                                Remove assignment
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
                label={`Showing ${rows.length} of ${filteredRows.length} people`}
                page={state.page}
                pageCount={pageCount}
                onPageChange={(page) => onStateChange({ page })}
              />
            </>
          )}
        </ChurchMainPanel>

        <PersonInspector
          selectedPerson={selectedPerson}
          canManageAssignments={canManageAssignments}
          onDialogChange={onDialogChange}
        />
      </ChurchContentGrid>
    </div>
  );
}
