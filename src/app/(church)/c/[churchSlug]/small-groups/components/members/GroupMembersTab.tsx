"use client";

import { useMemo, type KeyboardEvent } from "react";
import {
  CalendarDays,
  ChevronRight,
  Mail,
  MapPin,
  Phone,
  UserRound,
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
  GroupMemberViewModel,
  MembersState,
  SmallGroupsDialog,
  SmallGroupsWorkspaceData,
  SmallGroupViewModel,
} from "../types";
import {
  AttendanceMiniBars,
  ClearFiltersButton,
  EmptyRegistryState,
  FilterButton,
  FilterSelect,
  formatDate,
  GroupInitialsBadge,
  InfoRow,
  MetricStrip,
  PersonAvatar,
  RegistryPagination,
  RowActions,
  SearchField,
  SelectCheckbox,
  StatusPill,
  numberFormat,
} from "../shared";

const statusOptions = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "invited", label: "Invited" },
];

const joinedOptions = [
  { value: "this-year", label: "This Year" },
  { value: "last-year", label: "Last Year" },
  { value: "older", label: "Older" },
];

function hasFilters(filters: MembersState) {
  return Boolean(filters.search || filters.groupId || filters.role || filters.status || filters.joinedRange);
}

function filterMembers(rows: GroupMemberViewModel[], filters: MembersState) {
  const search = filters.search.trim().toLowerCase();

  return rows.filter((assignment) => {
    if (filters.groupId && assignment.groupId !== filters.groupId) return false;
    if (filters.role && assignment.role !== filters.role) return false;
    if (filters.status && assignment.status !== filters.status) return false;

    if (search) {
      const haystack = [
        assignment.member.name,
        assignment.member.email,
        assignment.member.phone,
        assignment.roleLabel,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(search)) return false;
    }

    return true;
  });
}

function GroupMembersToolbar({
  data,
  membersState,
  onMembersStateChange,
  onSelectGroup,
}: {
  data: SmallGroupsWorkspaceData;
  membersState: MembersState;
  onMembersStateChange: (state: Partial<MembersState>) => void;
  onSelectGroup: (groupId: string | null) => void;
}) {
  const activeFilters = hasFilters(membersState);

  function handleGroupChange(groupId: string) {
    onMembersStateChange({ groupId });
    onSelectGroup(groupId || null);
  }

  return (
    <section className="rounded-2xl border border-border bg-background p-4 shadow-sm">
      <form
        className="grid min-w-0 items-center gap-3 md:grid-cols-2 xl:grid-cols-[170px_minmax(240px,1fr)_130px_130px_130px_auto_auto]"
        onSubmit={(event) => event.preventDefault()}
      >
        <FilterSelect
          label="Group"
          value={membersState.groupId}
          onValueChange={handleGroupChange}
          options={data.options.groups}
          allLabel="All Groups"
        />
        <SearchField
          id="small-groups-member-search"
          value={membersState.search}
          onChange={(search) => onMembersStateChange({ search })}
          placeholder="Search members..."
        />
        <FilterSelect
          label="Role"
          value={membersState.role}
          onValueChange={(role) => onMembersStateChange({ role })}
          options={data.options.groupRoles}
          allLabel="Role: All"
        />
        <FilterSelect
          label="Status"
          value={membersState.status}
          onValueChange={(status) => onMembersStateChange({ status })}
          options={statusOptions}
          allLabel="Status: All"
        />
        <FilterSelect
          label="Joined"
          value={membersState.joinedRange}
          onValueChange={(joinedRange) => onMembersStateChange({ joinedRange })}
          options={joinedOptions}
          allLabel="Joined: All"
        />
        <FilterButton />
        <ClearFiltersButton
          show={activeFilters}
          onClick={() =>
            onMembersStateChange({
              search: "",
              role: "",
              status: "",
              joinedRange: "",
              groupId: data.groups[0]?.id ?? "",
            })
          }
        />
      </form>
    </section>
  );
}

function GroupContextStrip({
  group,
  members,
}: {
  group: SmallGroupViewModel | null;
  members: GroupMemberViewModel[];
}) {
  const scoped = group ? members.filter((member) => member.groupId === group.id) : members;
  const leaders = scoped.filter((member) => member.role !== "member").length;
  const regular = scoped.length - leaders;
  const invited = scoped.filter((member) => member.status === "invited").length;
  const attendanceValues = scoped
    .map((member) => member.attendancePercent)
    .filter((value): value is number => value !== null);
  const averageAttendance =
    attendanceValues.length > 0
      ? Math.round(attendanceValues.reduce((sum, value) => sum + value, 0) / attendanceValues.length)
      : null;

  return (
    <MetricStrip
      items={[
        {
          label: group?.name ?? "All Groups",
          value: `${numberFormat(scoped.length)} Total Members`,
          icon: group ? <GroupInitialsBadge initials={group.initials} className="size-6 rounded-md text-[10px]" /> : <Users className="size-4" />,
        },
        { label: "Leaders", value: leaders },
        { label: "Regular Members", value: regular },
        { label: "Invited", value: invited, muted: invited === 0 },
        { label: "Avg. Attendance", value: averageAttendance === null ? "-" : `${averageAttendance}%` },
      ]}
    />
  );
}

function MemberRow({
  assignment,
  selected,
  onSelectMember,
  onDialogChange,
}: {
  assignment: GroupMemberViewModel;
  selected: boolean;
  onSelectMember: (assignmentId: string) => void;
  onDialogChange: (dialog: SmallGroupsDialog) => void;
}) {
  function handleKeyDown(event: KeyboardEvent<HTMLTableRowElement>) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onSelectMember(assignment.assignmentId);
    }
  }

  return (
    <tr
      tabIndex={0}
      aria-selected={selected}
      onClick={() => onSelectMember(assignment.assignmentId)}
      onKeyDown={handleKeyDown}
      className={cn(
        "h-[72px] cursor-pointer bg-background outline-none transition-colors hover:bg-muted/35 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
        selected && "bg-primary/[0.055] shadow-[inset_3px_0_0_hsl(var(--primary))] hover:bg-primary/[0.07]"
      )}
    >
      <td className="border-b border-border/70 px-4 py-3 pr-0 align-middle">
        <SelectCheckbox
          checked={selected}
          label={`Select ${assignment.member.name}`}
          onCheckedChange={() => onSelectMember(assignment.assignmentId)}
        />
      </td>
      <td className="border-b border-border/70 px-3 py-3 align-middle">
        <div className="flex min-w-0 items-center gap-3">
          <PersonAvatar person={assignment.member} />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">{assignment.member.name}</p>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">{assignment.roleSubtitle}</p>
          </div>
        </div>
      </td>
      <td className="border-b border-border/70 px-3 py-3 align-middle">
        <span className="inline-flex rounded-full border border-border bg-muted/40 px-2.5 py-0.5 text-xs font-medium text-foreground">
          {assignment.roleLabel}
        </span>
      </td>
      <td className="whitespace-nowrap border-b border-border/70 px-3 py-3 align-middle text-sm text-foreground">
        {formatDate(assignment.joinedAt)}
      </td>
      <td className="border-b border-border/70 px-3 py-3 align-middle">
        <AttendanceMiniBars values={assignment.lastFourAttendance} percent={assignment.attendancePercent} />
      </td>
      <td className="border-b border-border/70 px-3 py-3 align-middle">
        <StatusPill status={assignment.status} />
      </td>
      <td className="border-b border-border/70 px-2 py-3 text-right align-middle">
        <RowActions label={`Open actions for ${assignment.member.name}`}>
          <DropdownMenuItem disabled className="h-10 gap-2">
            Edit role
          </DropdownMenuItem>
          <DropdownMenuItem disabled className="h-10 gap-2">
            Send message
          </DropdownMenuItem>
          <DropdownMenuItem
            className="h-10 gap-2"
            onSelect={() => onDialogChange({ type: "generate-report", reportKind: "members", groupId: assignment.groupId })}
          >
            Member report
          </DropdownMenuItem>
        </RowActions>
      </td>
    </tr>
  );
}

function MembersRegistry({
  rows,
  selectedMember,
  onSelectMember,
  onDialogChange,
  hasActiveFilters,
}: {
  rows: GroupMemberViewModel[];
  selectedMember: GroupMemberViewModel | null;
  onSelectMember: (assignmentId: string) => void;
  onDialogChange: (dialog: SmallGroupsDialog) => void;
  hasActiveFilters: boolean;
}) {
  return (
    <ChurchMainPanel className="min-w-0 overflow-hidden rounded-2xl">
      {rows.length === 0 ? (
        <div className="p-4">
          <EmptyRegistryState
            title={hasActiveFilters ? "No members match this view" : "No members are assigned to this group"}
            message={hasActiveFilters ? "Clear filters or broaden the search." : "Add an existing church member to begin."}
          />
        </div>
      ) : (
        <>
          <div className="min-w-0">
            <table className="w-full table-fixed border-separate border-spacing-0 text-left text-sm">
              <colgroup>
                <col style={{ width: "5%" }} />
                <col style={{ width: "25%" }} />
                <col style={{ width: "17%" }} />
                <col style={{ width: "17%" }} />
                <col style={{ width: "23%" }} />
                <col style={{ width: "10%" }} />
                <col style={{ width: "3%" }} />
              </colgroup>
              <thead>
                <tr className="h-14 bg-muted/30 text-xs">
                  <th className="border-b border-border px-4 pr-0 text-left align-middle font-medium text-muted-foreground">
                    <span className="sr-only">Selected member</span>
                  </th>
                  <th className="border-b border-border px-3 text-left align-middle font-medium text-muted-foreground">Member</th>
                  <th className="border-b border-border px-3 text-left align-middle font-medium text-muted-foreground">Role</th>
                  <th className="border-b border-border px-3 text-left align-middle font-medium text-muted-foreground">Joined On</th>
                  <th className="border-b border-border px-3 text-left align-middle font-medium text-muted-foreground">Attendance - Last 4</th>
                  <th className="border-b border-border px-3 text-left align-middle font-medium text-muted-foreground">Status</th>
                  <th className="border-b border-border px-2 text-right align-middle font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((assignment) => (
                  <MemberRow
                    key={assignment.assignmentId}
                    assignment={assignment}
                    selected={assignment.assignmentId === selectedMember?.assignmentId}
                    onSelectMember={onSelectMember}
                    onDialogChange={onDialogChange}
                  />
                ))}
              </tbody>
            </table>
          </div>
          <RegistryPagination label={`Showing 1 to ${numberFormat(rows.length)} of ${numberFormat(rows.length)} members`} />
        </>
      )}
    </ChurchMainPanel>
  );
}

function SelectedMemberPanel({
  selectedMember,
  onClear,
  onOpenGroup,
  onOpenAttendance,
}: {
  selectedMember: GroupMemberViewModel | null;
  onClear: () => void;
  onOpenGroup: (groupId: string) => void;
  onOpenAttendance: (groupId: string) => void;
}) {
  return (
    <ChurchRightRail className="hidden min-w-0 self-start overflow-hidden rounded-2xl xl:block">
      <div className="flex min-h-[58px] items-center justify-between px-5 py-4">
        <h2 className="text-sm font-semibold text-foreground">Selected Member</h2>
        <Button type="button" variant="ghost" size="icon" onClick={onClear} className="size-8 rounded-md text-muted-foreground" aria-label="Close selected member panel">
          <X className="size-4" aria-hidden="true" />
        </Button>
      </div>
      <Separator />

      {selectedMember ? (
        <>
          <div className="flex items-center gap-4 px-5 py-5">
            <PersonAvatar person={selectedMember.member} className="size-16" />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="truncate text-lg font-semibold text-foreground">{selectedMember.member.name}</h3>
                <StatusPill status={selectedMember.role} label={selectedMember.roleLabel} />
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{selectedMember.roleSubtitle}</p>
              <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                <Phone className="size-4" aria-hidden="true" />
                {selectedMember.member.phone ?? "No phone"}
              </p>
            </div>
          </div>

          <Separator />
          <dl className="space-y-4 px-5 py-5">
            <InfoRow icon={<Mail className="size-4" />} label="Email" value={selectedMember.member.email ?? "No email"} />
            <InfoRow icon={<CalendarDays className="size-4" />} label="Joined Group" value={formatDate(selectedMember.joinedAt)} />
            <InfoRow icon={<UserRound className="size-4" />} label="Member Status" value={selectedMember.member.membershipStatus ?? "-"} />
            <InfoRow icon={<Phone className="size-4" />} label="Phone" value={selectedMember.member.phone ?? "No phone"} />
            <InfoRow icon={<MapPin className="size-4" />} label="Address" value={selectedMember.member.address ?? "-"} />
            <InfoRow icon={<CalendarDays className="size-4" />} label="Date of Birth" value={formatDate(selectedMember.member.dateOfBirth)} />
          </dl>

          <Separator />
          <div className="px-5 py-5">
            <h4 className="text-sm font-semibold text-foreground">Attendance Summary</h4>
            <div className="mt-3 grid grid-cols-2 gap-2 rounded-lg border border-border">
              <div className="p-3">
                <p className="text-2xl font-semibold text-foreground">{selectedMember.attendancePercent ?? "-"}%</p>
                <p className="text-xs text-muted-foreground">Average - Last 4</p>
              </div>
              <div className="border-l border-border p-3">
                <p className="text-2xl font-semibold text-foreground">
                  {selectedMember.meetingsAttended ?? "-"} / {selectedMember.meetingsExpected ?? "-"}
                </p>
                <p className="text-xs text-muted-foreground">Meetings Attended</p>
              </div>
            </div>
          </div>

          <Separator />
          <div className="space-y-2 px-5 py-5">
            <Button type="button" variant="outline" disabled className="h-10 w-full justify-between rounded-lg bg-background">
              <span className="inline-flex items-center gap-2">
                <UserRound className="size-4" aria-hidden="true" />
                View Profile
              </span>
              <ChevronRight className="size-4" aria-hidden="true" />
            </Button>
            <Button type="button" variant="outline" className="h-10 w-full justify-between rounded-lg bg-background" onClick={() => onOpenAttendance(selectedMember.groupId)}>
              <span className="inline-flex items-center gap-2">
                <CalendarDays className="size-4" aria-hidden="true" />
                View Attendance
              </span>
              <ChevronRight className="size-4" aria-hidden="true" />
            </Button>
            <Button type="button" variant="outline" className="h-10 w-full justify-between rounded-lg bg-background" onClick={() => onOpenGroup(selectedMember.groupId)}>
              <span className="inline-flex items-center gap-2">
                <Users className="size-4" aria-hidden="true" />
                View Group
              </span>
              <ChevronRight className="size-4" aria-hidden="true" />
            </Button>
          </div>
        </>
      ) : (
        <div className="flex min-h-[320px] flex-col items-center justify-center px-8 text-center">
          <UserRound className="size-10 text-muted-foreground" aria-hidden="true" />
          <h3 className="mt-4 text-sm font-semibold text-foreground">Select a group member.</h3>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Member role, attendance, contact, and group context appears here.
          </p>
        </div>
      )}
    </ChurchRightRail>
  );
}

export function GroupMembersTab({
  data,
  membersState,
  selectedGroup,
  selectedMember,
  onMembersStateChange,
  onSelectGroup,
  onSelectMember,
  onOpenGroup,
  onOpenAttendance,
  onDialogChange,
}: {
  data: SmallGroupsWorkspaceData;
  membersState: MembersState;
  selectedGroup: SmallGroupViewModel | null;
  selectedMember: GroupMemberViewModel | null;
  onMembersStateChange: (state: Partial<MembersState>) => void;
  onSelectGroup: (groupId: string | null) => void;
  onSelectMember: (assignmentId: string) => void;
  onOpenGroup: (groupId: string) => void;
  onOpenAttendance: (groupId: string) => void;
  onDialogChange: (dialog: SmallGroupsDialog) => void;
}) {
  const rows = useMemo(
    () => filterMembers(data.groupMembers, membersState),
    [data.groupMembers, membersState]
  );
  const activeFilters = hasFilters(membersState);
  const contextGroup = data.groups.find((group) => group.id === membersState.groupId) ?? selectedGroup;

  return (
    <div className="min-w-0 space-y-4">
      <GroupMembersToolbar
        data={data}
        membersState={membersState}
        onMembersStateChange={onMembersStateChange}
        onSelectGroup={onSelectGroup}
      />
      <GroupContextStrip group={contextGroup} members={data.groupMembers} />
      <ChurchContentGrid className="items-start gap-3 xl:grid-cols-[minmax(0,1fr)_340px]">
        <section className="min-w-0">
          <MembersRegistry
            rows={rows}
            selectedMember={selectedMember}
            onSelectMember={onSelectMember}
            onDialogChange={onDialogChange}
            hasActiveFilters={activeFilters}
          />
        </section>
        <SelectedMemberPanel
          selectedMember={selectedMember}
          onClear={() => onSelectMember("")}
          onOpenGroup={onOpenGroup}
          onOpenAttendance={onOpenAttendance}
        />
      </ChurchContentGrid>
    </div>
  );
}
