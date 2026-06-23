"use client";

import { useMemo, type KeyboardEvent } from "react";
import {
  Archive,
  CalendarDays,
  ChevronDown,
  Edit3,
  FileBarChart,
  MapPin,
  MessageSquareText,
  MoreHorizontal,
  NotebookPen,
  Users,
  UserRound,
  UserRoundCog,
  X,
} from "lucide-react";
import {
  ChurchContentGrid,
  ChurchMainPanel,
  ChurchRightRail,
} from "@/components/church-workspace/patterns/ChurchPanels";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils/cn";
import type {
  GroupsState,
  SmallGroupsDialog,
  SmallGroupsWorkspaceData,
  SmallGroupViewModel,
} from "../types";
import {
  AvatarStack,
  ClearFiltersButton,
  EmptyRegistryState,
  FilterButton,
  FilterSelect,
  formatShortDate,
  GroupInitialsBadge,
  InfoRow,
  PersonAvatar,
  RegistryPagination,
  RowActions,
  SearchField,
  SelectCheckbox,
  StatusPill,
  SummaryActionRow,
  numberFormat,
} from "../shared";

const statusOptions = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "paused", label: "Paused" },
];

function hasFilters(filters: GroupsState) {
  return Boolean(
    filters.search ||
      filters.status ||
      filters.neighborhood ||
      filters.leaderId ||
      filters.meetingDay
  );
}

function filterGroups(groups: SmallGroupViewModel[], filters: GroupsState) {
  const search = filters.search.trim().toLowerCase();

  return groups.filter((group) => {
    if (search) {
      const haystack = [
        group.name,
        group.neighborhood,
        group.location,
        group.leader?.name,
        group.assistantLeader?.name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(search)) return false;
    }

    if (filters.status && group.status !== filters.status) return false;
    if (filters.neighborhood && group.neighborhood !== filters.neighborhood) return false;
    if (filters.leaderId && group.leader?.id !== filters.leaderId) return false;
    if (filters.meetingDay && group.meetingDayLabel !== filters.meetingDay) return false;
    return true;
  });
}

function GroupsFilterBar({
  data,
  groupsState,
  resultCount,
  onGroupsStateChange,
}: {
  data: SmallGroupsWorkspaceData;
  groupsState: GroupsState;
  resultCount: number;
  onGroupsStateChange: (state: Partial<GroupsState>) => void;
}) {
  const activeFilters = hasFilters(groupsState);

  return (
    <section className="rounded-2xl border border-border bg-background p-4 shadow-sm">
      <form
        className="grid min-w-0 items-center gap-3 md:grid-cols-2 xl:grid-cols-[minmax(220px,1fr)_112px_140px_120px_112px_auto_auto]"
        onSubmit={(event) => event.preventDefault()}
      >
        <SearchField
          id="small-groups-search"
          value={groupsState.search}
          onChange={(search) => onGroupsStateChange({ search })}
          placeholder="Search group name, leader, or location..."
          className="md:col-span-2 xl:col-span-1"
        />
        <FilterSelect
          label="Status"
          value={groupsState.status}
          onValueChange={(status) => onGroupsStateChange({ status })}
          options={statusOptions}
          allLabel="Status: All"
        />
        <FilterSelect
          label="Neighborhood"
          value={groupsState.neighborhood}
          onValueChange={(neighborhood) => onGroupsStateChange({ neighborhood })}
          options={data.options.neighborhoods}
          allLabel="Neighborhood: All"
        />
        <FilterSelect
          label="Leader"
          value={groupsState.leaderId}
          onValueChange={(leaderId) => onGroupsStateChange({ leaderId })}
          options={data.options.leaders}
          allLabel="Leader: All"
        />
        <FilterSelect
          label="Meeting Day"
          value={groupsState.meetingDay}
          onValueChange={(meetingDay) => onGroupsStateChange({ meetingDay })}
          options={data.options.meetingDays}
          allLabel="Meeting Day"
        />
        <FilterButton />
        <ClearFiltersButton
          show={activeFilters}
          onClick={() =>
            onGroupsStateChange({
              search: "",
              status: "",
              neighborhood: "",
              leaderId: "",
              meetingDay: "",
            })
          }
        />
      </form>
      <div className="mt-3 flex justify-end">
        <p className="whitespace-nowrap text-sm text-muted-foreground">
          {numberFormat(resultCount)} results
        </p>
      </div>
    </section>
  );
}

function GroupIdentityCell({ group }: { group: SmallGroupViewModel }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <GroupInitialsBadge initials={group.initials} />
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-foreground" title={group.name}>
          {group.name}
        </p>
        <p className="mt-0.5 truncate text-xs text-muted-foreground" title={group.neighborhood ?? undefined}>
          {group.neighborhood ?? "No neighborhood"}
        </p>
      </div>
    </div>
  );
}

function GroupRow({
  group,
  isSelected,
  onSelectGroup,
  onDialogChange,
}: {
  group: SmallGroupViewModel;
  isSelected: boolean;
  onSelectGroup: (groupId: string) => void;
  onDialogChange: (dialog: SmallGroupsDialog) => void;
}) {
  function handleKeyDown(event: KeyboardEvent<HTMLTableRowElement>) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onSelectGroup(group.id);
    }
  }

  return (
    <tr
      tabIndex={0}
      aria-selected={isSelected}
      onClick={() => onSelectGroup(group.id)}
      onKeyDown={handleKeyDown}
      className={cn(
        "h-[78px] cursor-pointer bg-background outline-none transition-colors hover:bg-muted/35 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
        isSelected && "bg-primary/[0.055] shadow-[inset_3px_0_0_hsl(var(--primary))] hover:bg-primary/[0.07]"
      )}
    >
      <td className="border-b border-border/70 px-4 py-3 pr-0 align-middle">
        <SelectCheckbox
          checked={isSelected}
          label={`Select ${group.name}`}
          onCheckedChange={() => onSelectGroup(group.id)}
        />
      </td>
      <td className="border-b border-border/70 px-3 py-3 align-middle">
        <GroupIdentityCell group={group} />
      </td>
      <td className="min-w-0 border-b border-border/70 px-3 py-3 align-middle">
        <div className="flex min-w-0 items-center gap-2">
          <PersonAvatar person={group.leader} />
          <span className="truncate text-sm text-foreground" title={group.leader?.name ?? undefined}>
            {group.leader?.name ?? "Unassigned"}
          </span>
        </div>
      </td>
      <td className="border-b border-border/70 px-3 py-3 align-middle">
        <AvatarStack people={group.memberPreview} count={group.memberCount} />
      </td>
      <td className="border-b border-border/70 px-3 py-3 align-middle">
        <p className="truncate text-sm font-medium text-foreground">{group.meetingDayLabel ?? "-"}</p>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">{group.meetingTimeLabel ?? "-"}</p>
      </td>
      <td className="min-w-0 border-b border-border/70 px-3 py-3 align-middle text-sm">
        <p className="truncate text-foreground" title={group.location ?? undefined}>
          {group.location ?? "-"}
        </p>
      </td>
      <td className="border-b border-border/70 px-3 py-3 align-middle">
        <StatusPill status={group.status} />
      </td>
      <td className="whitespace-nowrap border-b border-border/70 px-3 py-3 align-middle text-sm text-foreground">
        {formatShortDate(group.nextMeetingAt)}
      </td>
      <td className="border-b border-border/70 px-2 py-3 text-right align-middle">
        <RowActions label={`Open actions for ${group.name}`}>
          <DropdownMenuItem
            className="h-10 gap-2"
            onSelect={() => onDialogChange({ type: "edit-group", groupId: group.id })}
          >
            <Edit3 className="size-4" aria-hidden="true" />
            Edit group
          </DropdownMenuItem>
          <DropdownMenuItem
            className="h-10 gap-2"
            onSelect={() => onDialogChange({ type: "schedule-meeting", groupId: group.id })}
          >
            <CalendarDays className="size-4" aria-hidden="true" />
            Schedule meeting
          </DropdownMenuItem>
        </RowActions>
      </td>
    </tr>
  );
}

function GroupsRegistry({
  rows,
  selectedGroup,
  onSelectGroup,
  onDialogChange,
  hasActiveFilters,
}: {
  rows: SmallGroupViewModel[];
  selectedGroup: SmallGroupViewModel | null;
  onSelectGroup: (groupId: string) => void;
  onDialogChange: (dialog: SmallGroupsDialog) => void;
  hasActiveFilters: boolean;
}) {
  const start = rows.length > 0 ? 1 : 0;

  return (
    <ChurchMainPanel className="min-w-0 overflow-hidden rounded-2xl">
      {rows.length === 0 ? (
        <div className="p-4">
          <EmptyRegistryState
            title={hasActiveFilters ? "No groups match this view" : "No small groups yet"}
            message={
              hasActiveFilters
                ? "Clear filters or broaden the search to return to the group registry."
                : "Create the first small group to begin organizing members, meetings, attendance, and outreach."
            }
            actionLabel={hasActiveFilters ? undefined : "Create First Group"}
            onAction={hasActiveFilters ? undefined : () => onDialogChange({ type: "create-group" })}
          />
        </div>
      ) : (
        <>
          <div className="min-w-0">
            <table className="w-full table-fixed border-separate border-spacing-0 text-left text-sm">
              <colgroup>
                <col style={{ width: "4%" }} />
                <col style={{ width: "20%" }} />
                <col style={{ width: "16%" }} />
                <col style={{ width: "13%" }} />
                <col style={{ width: "15%" }} />
                <col style={{ width: "10%" }} />
                <col style={{ width: "9%" }} />
                <col style={{ width: "10%" }} />
                <col style={{ width: "3%" }} />
              </colgroup>
              <thead>
                <tr className="h-14 bg-muted/30 text-xs">
                  <th className="border-b border-border px-4 pr-0 text-left align-middle font-medium text-muted-foreground">
                    <span className="sr-only">Selected group</span>
                  </th>
                  <th className="border-b border-border px-3 text-left align-middle font-medium text-muted-foreground">Group</th>
                  <th className="border-b border-border px-3 text-left align-middle font-medium text-muted-foreground">Leader</th>
                  <th className="border-b border-border px-3 text-left align-middle font-medium text-muted-foreground">Members</th>
                  <th className="border-b border-border px-3 text-left align-middle font-medium text-muted-foreground">Meeting Schedule</th>
                  <th className="border-b border-border px-3 text-left align-middle font-medium text-muted-foreground">Location</th>
                  <th className="border-b border-border px-3 text-left align-middle font-medium text-muted-foreground">Status</th>
                  <th className="border-b border-border px-3 text-left align-middle font-medium text-muted-foreground">Next Meeting</th>
                  <th className="border-b border-border px-2 text-right align-middle font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((group) => (
                  <GroupRow
                    key={group.id}
                    group={group}
                    isSelected={group.id === selectedGroup?.id}
                    onSelectGroup={onSelectGroup}
                    onDialogChange={onDialogChange}
                  />
                ))}
              </tbody>
            </table>
          </div>
          <RegistryPagination
            label={`Showing ${numberFormat(start)} to ${numberFormat(rows.length)} of ${numberFormat(rows.length)} groups`}
          />
        </>
      )}
    </ChurchMainPanel>
  );
}

function SelectedGroupPanel({
  group,
  onClear,
  onOpenMembers,
  onOpenMeetings,
  onOpenOutreach,
  onDialogChange,
}: {
  group: SmallGroupViewModel | null;
  onClear: () => void;
  onOpenMembers: (groupId: string) => void;
  onOpenMeetings: (groupId: string) => void;
  onOpenOutreach: (groupId: string) => void;
  onDialogChange: (dialog: SmallGroupsDialog) => void;
}) {
  return (
    <ChurchRightRail className="hidden min-w-0 self-start overflow-hidden rounded-2xl xl:block">
      <div className="flex min-h-[58px] items-center justify-between px-5 py-4">
        <h2 className="text-sm font-semibold text-foreground">Selected Group</h2>
        <div className="flex items-center gap-1">
          {group ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button type="button" variant="ghost" size="icon" className="size-8 rounded-md" aria-label="Open selected group actions">
                  <MoreHorizontal className="size-4" aria-hidden="true" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60 rounded-lg">
                <DropdownMenuGroup>
                  <DropdownMenuItem className="h-10 gap-2" onSelect={() => onDialogChange({ type: "add-member", groupId: group.id })}>
                    <Users className="size-4" aria-hidden="true" />
                    Add member
                  </DropdownMenuItem>
                  <DropdownMenuItem className="h-10 gap-2" onSelect={() => onDialogChange({ type: "schedule-meeting", groupId: group.id })}>
                    <CalendarDays className="size-4" aria-hidden="true" />
                    Schedule meeting
                  </DropdownMenuItem>
                  <DropdownMenuItem className="h-10 gap-2" onSelect={() => onDialogChange({ type: "create-outreach", groupId: group.id })}>
                    <MessageSquareText className="size-4" aria-hidden="true" />
                    Record outreach
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem className="h-10 gap-2" onSelect={() => onDialogChange({ type: "generate-report", groupId: group.id })}>
                    <FileBarChart className="size-4" aria-hidden="true" />
                    Generate report
                  </DropdownMenuItem>
                  <DropdownMenuItem className="h-10 gap-2" onSelect={() => onDialogChange({ type: "notes", groupId: group.id })}>
                    <NotebookPen className="size-4" aria-hidden="true" />
                    View or edit notes
                  </DropdownMenuItem>
                  <DropdownMenuItem className="h-10 gap-2" onSelect={() => onDialogChange({ type: "change-leader", groupId: group.id })}>
                    <UserRoundCog className="size-4" aria-hidden="true" />
                    Change leader
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="h-10 gap-2 text-destructive" onSelect={() => onDialogChange({ type: "archive-group", groupId: group.id })}>
                  <Archive className="size-4" aria-hidden="true" />
                  Archive group
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
          <Button type="button" variant="ghost" size="icon" onClick={onClear} className="size-8 rounded-md text-muted-foreground" aria-label="Close selected group inspector">
            <X className="size-4" aria-hidden="true" />
          </Button>
        </div>
      </div>

      <Separator />

      {group ? (
        <>
          <div className="px-5 py-5">
            <div className="flex items-start gap-4">
              <GroupInitialsBadge initials={group.initials} className="size-14 rounded-xl text-lg" />
              <div className="min-w-0 flex-1">
                <div className="flex min-w-0 items-center gap-2">
                  <h3 className="truncate text-lg font-semibold text-foreground">{group.name}</h3>
                  <StatusPill status={group.status} />
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{group.memberCount} members</p>
                <p className="mt-1 truncate text-sm text-muted-foreground">{group.neighborhood}</p>
              </div>
            </div>
          </div>

          <Separator />
          <dl className="space-y-4 px-5 py-5">
            <InfoRow icon={<UserRound className="size-4" />} label="Leader" value={group.leader?.name ?? "Unassigned"} />
            <InfoRow icon={<Users className="size-4" />} label="Assistant Leader" value={group.assistantLeader?.name ?? "Unassigned"} />
            <InfoRow icon={<CalendarDays className="size-4" />} label="Meeting Schedule" value={`${group.meetingDayLabel ?? "-"} · ${group.meetingTimeLabel ?? "-"}`} />
            <InfoRow icon={<MapPin className="size-4" />} label="Location" value={group.location ?? "-"} title={group.address ?? undefined} />
            <InfoRow icon={<CalendarDays className="size-4" />} label="Next Meeting" value={formatShortDate(group.nextMeetingAt)} />
            <InfoRow icon={<CalendarDays className="size-4" />} label="Avg. Attendance" value={group.averageAttendancePercent === null ? "-" : `${group.averageAttendancePercent}%`} />
            <InfoRow icon={<CalendarDays className="size-4" />} label="Group Since" value={formatShortDate(group.createdAt)} />
            <InfoRow icon={<NotebookPen className="size-4" />} label="Group Type" value={group.typeLabel ?? "-"} />
            <InfoRow
              icon={<NotebookPen className="size-4" />}
              label="Description"
              value={<span className="line-clamp-3 text-right font-normal">{group.description ?? "-"}</span>}
              title={group.description ?? undefined}
            />
          </dl>

          <Separator />
          <div className="space-y-2 px-5 py-5">
            <SummaryActionRow icon={<Users className="size-4" />} label="Members" value={group.memberCount} onClick={() => onOpenMembers(group.id)} />
            <SummaryActionRow icon={<CalendarDays className="size-4" />} label="Meetings this month" value={group.meetingsThisMonth ?? "-"} onClick={() => onOpenMeetings(group.id)} />
            <SummaryActionRow icon={<CalendarDays className="size-4" />} label="Attendance" value={group.averageAttendancePercent === null ? "-" : `${group.averageAttendancePercent}%`} onClick={() => onOpenMeetings(group.id)} />
            <SummaryActionRow icon={<MessageSquareText className="size-4" />} label="Outreach activities" value={group.outreachActivityCount ?? "-"} onClick={() => onOpenOutreach(group.id)} />
          </div>

          <Separator />
          <div className="space-y-2 px-5 py-5">
            <Button type="button" className="h-11 w-full gap-2 rounded-lg font-semibold" onClick={() => onDialogChange({ type: "edit-group", groupId: group.id })}>
              <Edit3 className="size-4" aria-hidden="true" />
              Edit Group
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button type="button" variant="outline" className="h-10 w-full justify-between rounded-lg bg-background px-3">
                  <span className="inline-flex items-center gap-2">
                    <MoreHorizontal className="size-4" aria-hidden="true" />
                    More actions
                  </span>
                  <ChevronDown className="size-4" aria-hidden="true" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60 rounded-lg">
                <DropdownMenuItem className="h-10 gap-2" onSelect={() => onDialogChange({ type: "add-member", groupId: group.id })}>Add member</DropdownMenuItem>
                <DropdownMenuItem className="h-10 gap-2" onSelect={() => onDialogChange({ type: "schedule-meeting", groupId: group.id })}>Schedule meeting</DropdownMenuItem>
                <DropdownMenuItem className="h-10 gap-2" onSelect={() => onDialogChange({ type: "create-outreach", groupId: group.id })}>Record outreach</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="h-10 gap-2" onSelect={() => onDialogChange({ type: "generate-report", groupId: group.id })}>Generate report</DropdownMenuItem>
                <DropdownMenuItem className="h-10 gap-2" onSelect={() => onDialogChange({ type: "notes", groupId: group.id })}>View or edit notes</DropdownMenuItem>
                <DropdownMenuItem className="h-10 gap-2" onSelect={() => onDialogChange({ type: "change-leader", groupId: group.id })}>Change leader</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="h-10 gap-2 text-destructive" onSelect={() => onDialogChange({ type: "archive-group", groupId: group.id })}>Archive group</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </>
      ) : (
        <div className="flex min-h-[320px] flex-col items-center justify-center px-8 text-center">
          <GroupInitialsBadge initials="SG" className="size-12" />
          <h3 className="mt-4 text-sm font-semibold text-foreground">Select a group to inspect it.</h3>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            The right rail shows leadership, schedule, members, meetings, and outreach context.
          </p>
        </div>
      )}
    </ChurchRightRail>
  );
}

export function GroupsTab({
  data,
  groupsState,
  selectedGroup,
  onGroupsStateChange,
  onSelectGroup,
  onOpenMembers,
  onOpenMeetings,
  onOpenOutreach,
  onDialogChange,
}: {
  data: SmallGroupsWorkspaceData;
  groupsState: GroupsState;
  selectedGroup: SmallGroupViewModel | null;
  onGroupsStateChange: (state: Partial<GroupsState>) => void;
  onSelectGroup: (groupId: string | null) => void;
  onOpenMembers: (groupId: string) => void;
  onOpenMeetings: (groupId: string) => void;
  onOpenOutreach: (groupId: string) => void;
  onDialogChange: (dialog: SmallGroupsDialog) => void;
}) {
  const filteredGroups = useMemo(
    () => filterGroups(data.groups, groupsState),
    [data.groups, groupsState]
  );
  const activeFilters = hasFilters(groupsState);

  return (
    <div className="min-w-0 space-y-4">
      <GroupsFilterBar
        data={data}
        groupsState={groupsState}
        resultCount={filteredGroups.length}
        onGroupsStateChange={onGroupsStateChange}
      />
      <ChurchContentGrid className="items-start gap-3 xl:grid-cols-[minmax(0,1fr)_340px]">
        <section className="min-w-0">
          <GroupsRegistry
            rows={filteredGroups}
            selectedGroup={selectedGroup}
            onSelectGroup={(groupId) => onSelectGroup(groupId)}
            onDialogChange={onDialogChange}
            hasActiveFilters={activeFilters}
          />
        </section>
        <SelectedGroupPanel
          group={selectedGroup}
          onClear={() => onSelectGroup(null)}
          onOpenMembers={onOpenMembers}
          onOpenMeetings={onOpenMeetings}
          onOpenOutreach={onOpenOutreach}
          onDialogChange={onDialogChange}
        />
      </ChurchContentGrid>
    </div>
  );
}
