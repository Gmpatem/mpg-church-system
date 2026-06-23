"use client";

import { useMemo, type KeyboardEvent } from "react";
import {
  CalendarClock,
  ChevronRight,
  Clock,
  FileBarChart,
  History,
  MapPin,
  NotebookText,
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
  MeetingsState,
  SmallGroupMeetingViewModel,
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
  monthDayBlock,
  PersonAvatar,
  RegistryPagination,
  RowActions,
  SearchField,
  StatusPill,
  numberFormat,
} from "../shared";

const dateRangeOptions = [
  { value: "next-30", label: "Next 30 Days" },
  { value: "this-month", label: "This Month" },
  { value: "last-30", label: "Last 30 Days" },
];

const statusOptions = [
  { value: "upcoming", label: "Upcoming" },
  { value: "scheduled", label: "Scheduled" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

function hasFilters(filters: MeetingsState) {
  return Boolean(
    filters.search ||
      filters.groupId ||
      filters.dateRange ||
      filters.meetingType ||
      filters.status
  );
}

function filterMeetings(meetings: SmallGroupMeetingViewModel[], filters: MeetingsState) {
  const search = filters.search.trim().toLowerCase();

  return meetings.filter((meeting) => {
    if (filters.subTab === "upcoming" && !["upcoming", "scheduled"].includes(meeting.status)) return false;
    if (filters.subTab === "past" && meeting.status !== "completed") return false;
    if (filters.subTab === "cancelled" && meeting.status !== "cancelled") return false;

    if (search) {
      const haystack = [
        meeting.groupName,
        meeting.topic,
        meeting.description,
        meeting.location,
        meeting.conductor?.name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(search)) return false;
    }

    if (filters.groupId && meeting.groupId !== filters.groupId) return false;
    if (filters.meetingType && meeting.meetingType !== filters.meetingType) return false;
    if (filters.status && meeting.status !== filters.status) return false;
    return true;
  });
}

function MeetingsToolbar({
  data,
  meetingsState,
  onMeetingsStateChange,
}: {
  data: SmallGroupsWorkspaceData;
  meetingsState: MeetingsState;
  onMeetingsStateChange: (state: Partial<MeetingsState>) => void;
}) {
  const activeFilters = hasFilters(meetingsState);

  return (
    <section className="rounded-t-2xl border border-border bg-background p-4 shadow-sm">
      <form
        className="grid min-w-0 items-center gap-3 md:grid-cols-2 xl:grid-cols-[minmax(270px,1fr)_150px_140px_150px_130px_auto_auto]"
        onSubmit={(event) => event.preventDefault()}
      >
        <SearchField
          id="small-groups-meeting-search"
          value={meetingsState.search}
          onChange={(search) => onMeetingsStateChange({ search })}
          placeholder="Search meetings, topic, or group..."
          className="md:col-span-2 xl:col-span-1"
        />
        <FilterSelect
          label="All Groups"
          value={meetingsState.groupId}
          onValueChange={(groupId) => onMeetingsStateChange({ groupId })}
          options={data.options.groups}
          allLabel="All Groups"
        />
        <FilterSelect
          label="Date Range"
          value={meetingsState.dateRange}
          onValueChange={(dateRange) => onMeetingsStateChange({ dateRange })}
          options={dateRangeOptions}
          allLabel="Date Range"
        />
        <FilterSelect
          label="Meeting Type"
          value={meetingsState.meetingType}
          onValueChange={(meetingType) => onMeetingsStateChange({ meetingType })}
          options={data.options.meetingTypes}
          allLabel="Meeting Type: All"
        />
        <FilterSelect
          label="Status"
          value={meetingsState.status}
          onValueChange={(status) => onMeetingsStateChange({ status })}
          options={statusOptions}
          allLabel="Status: All"
        />
        <FilterButton />
        <ClearFiltersButton
          show={activeFilters}
          onClick={() =>
            onMeetingsStateChange({
              search: "",
              groupId: "",
              dateRange: "",
              meetingType: "",
              status: "",
            })
          }
        />
      </form>
    </section>
  );
}

function MeetingStateTabs({
  data,
  meetingsState,
  onMeetingsStateChange,
}: {
  data: SmallGroupsWorkspaceData;
  meetingsState: MeetingsState;
  onMeetingsStateChange: (state: Partial<MeetingsState>) => void;
}) {
  const counts = {
    upcoming: data.meetings.filter((meeting) => ["upcoming", "scheduled"].includes(meeting.status)).length,
    past: data.meetings.filter((meeting) => meeting.status === "completed").length,
    cancelled: data.meetings.filter((meeting) => meeting.status === "cancelled").length,
  };
  const items = [
    { key: "upcoming" as const, label: "Upcoming", count: counts.upcoming },
    { key: "past" as const, label: "Past Meetings", count: counts.past },
    { key: "cancelled" as const, label: "Cancelled", count: counts.cancelled },
  ];

  return (
    <div className="border-x border-b border-border bg-background px-4 shadow-sm">
      <div role="tablist" aria-label="Meeting state filters" className="flex min-w-0 overflow-x-auto">
        {items.map((item) => {
          const active = meetingsState.subTab === item.key;
          return (
            <button
              key={item.key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onMeetingsStateChange({ subTab: item.key })}
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

function AttendanceCell({ meeting }: { meeting: SmallGroupMeetingViewModel }) {
  if (meeting.recordedAttendance === null || meeting.expectedAttendance === null) {
    return (
      <div>
        <p className="text-sm font-medium text-muted-foreground">-</p>
        <p className="mt-0.5 text-xs text-muted-foreground">Not recorded</p>
      </div>
    );
  }

  return (
    <div className="min-w-0">
      <p className="text-sm font-semibold text-foreground">
        {meeting.recordedAttendance} / {meeting.expectedAttendance}
      </p>
      <p className="mt-0.5 text-xs text-muted-foreground">{meeting.attendancePercent}%</p>
      <div className="mt-1 h-1.5 rounded-full bg-muted" aria-hidden="true">
        <div
          className="h-full rounded-full bg-primary"
          style={{ width: `${meeting.attendancePercent ?? 0}%` }}
        />
      </div>
    </div>
  );
}

function MeetingRow({
  meeting,
  isSelected,
  onSelectMeeting,
  onDialogChange,
}: {
  meeting: SmallGroupMeetingViewModel;
  isSelected: boolean;
  onSelectMeeting: (meetingId: string) => void;
  onDialogChange: (dialog: SmallGroupsDialog) => void;
}) {
  const dateBlock = monthDayBlock(meeting.startsAt);

  function handleKeyDown(event: KeyboardEvent<HTMLTableRowElement>) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onSelectMeeting(meeting.id);
    }
  }

  return (
    <tr
      tabIndex={0}
      aria-selected={isSelected}
      onClick={() => onSelectMeeting(meeting.id)}
      onKeyDown={handleKeyDown}
      className={cn(
        "h-[86px] cursor-pointer bg-background outline-none transition-colors hover:bg-muted/35 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
        isSelected && "bg-primary/[0.055] shadow-[inset_3px_0_0_hsl(var(--primary))] hover:bg-primary/[0.07]"
      )}
    >
      <td className="border-b border-border/70 px-4 py-3 align-middle">
        <div className="w-14 text-center">
          <p className="text-[10px] font-semibold uppercase text-muted-foreground">{dateBlock.month}</p>
          <p className="text-2xl font-semibold leading-none text-foreground">{dateBlock.day}</p>
          <p className="mt-1 text-xs text-muted-foreground">{dateBlock.line}</p>
        </div>
      </td>
      <td className="border-b border-border/70 px-3 py-3 align-middle">
        <div className="flex min-w-0 items-center gap-3">
          <GroupInitialsBadge initials={meeting.groupInitials} tone="green" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">{meeting.groupName}</p>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">{meeting.location ?? "-"}</p>
          </div>
        </div>
      </td>
      <td className="min-w-0 border-b border-border/70 px-3 py-3 align-middle">
        <p className="truncate text-sm font-semibold text-foreground" title={meeting.topic}>
          {meeting.topic}
        </p>
        <p className="mt-0.5 truncate text-xs text-muted-foreground" title={meeting.description ?? undefined}>
          {meeting.description ?? "-"}
        </p>
      </td>
      <td className="min-w-0 border-b border-border/70 px-3 py-3 align-middle">
        <div className="flex min-w-0 items-center gap-2">
          <PersonAvatar person={meeting.conductor} />
          <div className="min-w-0">
            <p className="truncate text-sm text-foreground">{meeting.conductor?.name ?? "Unassigned"}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">Leader</p>
          </div>
        </div>
      </td>
      <td className="border-b border-border/70 px-3 py-3 align-middle">
        <AttendanceCell meeting={meeting} />
      </td>
      <td className="border-b border-border/70 px-3 py-3 align-middle">
        <StatusPill status={meeting.status} />
      </td>
      <td className="border-b border-border/70 px-2 py-3 text-right align-middle">
        <RowActions label={`Open actions for ${meeting.topic}`}>
          <DropdownMenuItem
            className="h-10 gap-2"
            onSelect={() => onDialogChange({ type: "record-attendance", meetingId: meeting.id })}
          >
            <CalendarClock className="size-4" aria-hidden="true" />
            Record attendance
          </DropdownMenuItem>
          <DropdownMenuItem
            className="h-10 gap-2"
            onSelect={() => onDialogChange({ type: "generate-report", reportKind: "attendance", groupId: meeting.groupId })}
          >
            <FileBarChart className="size-4" aria-hidden="true" />
            Attendance report
          </DropdownMenuItem>
        </RowActions>
      </td>
    </tr>
  );
}

function MeetingsRegistry({
  rows,
  selectedMeeting,
  onSelectMeeting,
  onDialogChange,
  hasActiveFilters,
}: {
  rows: SmallGroupMeetingViewModel[];
  selectedMeeting: SmallGroupMeetingViewModel | null;
  onSelectMeeting: (meetingId: string) => void;
  onDialogChange: (dialog: SmallGroupsDialog) => void;
  hasActiveFilters: boolean;
}) {
  return (
    <ChurchMainPanel className="min-w-0 overflow-hidden rounded-b-2xl rounded-t-none">
      {rows.length === 0 ? (
        <div className="p-4">
          <EmptyRegistryState
            title="No meetings match this view"
            message={hasActiveFilters ? "Clear filters or broaden the search." : "Schedule a meeting or adjust your filters."}
            actionLabel={hasActiveFilters ? undefined : "Schedule Meeting"}
            onAction={hasActiveFilters ? undefined : () => onDialogChange({ type: "schedule-meeting" })}
          />
        </div>
      ) : (
        <>
          <div className="min-w-0">
            <table className="w-full table-fixed border-separate border-spacing-0 text-left text-sm">
              <colgroup>
                <col style={{ width: "13%" }} />
                <col style={{ width: "17%" }} />
                <col style={{ width: "24%" }} />
                <col style={{ width: "18%" }} />
                <col style={{ width: "14%" }} />
                <col style={{ width: "10%" }} />
                <col style={{ width: "4%" }} />
              </colgroup>
              <thead>
                <tr className="h-14 bg-muted/30 text-xs">
                  <th className="border-b border-border px-4 text-left align-middle font-medium text-muted-foreground">Date & Time</th>
                  <th className="border-b border-border px-3 text-left align-middle font-medium text-muted-foreground">Group</th>
                  <th className="border-b border-border px-3 text-left align-middle font-medium text-muted-foreground">Topic / Focus</th>
                  <th className="border-b border-border px-3 text-left align-middle font-medium text-muted-foreground">Conducted By</th>
                  <th className="border-b border-border px-3 text-left align-middle font-medium text-muted-foreground">Attendance</th>
                  <th className="border-b border-border px-3 text-left align-middle font-medium text-muted-foreground">Status</th>
                  <th className="border-b border-border px-2 text-right align-middle font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((meeting) => (
                  <MeetingRow
                    key={meeting.id}
                    meeting={meeting}
                    isSelected={meeting.id === selectedMeeting?.id}
                    onSelectMeeting={onSelectMeeting}
                    onDialogChange={onDialogChange}
                  />
                ))}
              </tbody>
            </table>
          </div>
          <RegistryPagination label={`Showing 1 to ${numberFormat(rows.length)} of ${numberFormat(rows.length)} meetings`} />
        </>
      )}
    </ChurchMainPanel>
  );
}

function MeetingDetailsPanel({
  meeting,
  onClear,
  onOpenGroup,
  onViewHistory,
  onDialogChange,
}: {
  meeting: SmallGroupMeetingViewModel | null;
  onClear: () => void;
  onOpenGroup: (groupId: string) => void;
  onViewHistory: (groupId: string) => void;
  onDialogChange: (dialog: SmallGroupsDialog) => void;
}) {
  return (
    <ChurchRightRail className="hidden min-w-0 self-start overflow-hidden rounded-2xl xl:block">
      <div className="flex min-h-[58px] items-center justify-between px-5 py-4">
        <h2 className="text-sm font-semibold text-foreground">Meeting Details</h2>
        <Button type="button" variant="ghost" size="icon" onClick={onClear} className="size-8 rounded-md text-muted-foreground" aria-label="Close meeting details">
          <X className="size-4" aria-hidden="true" />
        </Button>
      </div>
      <Separator />

      {meeting ? (
        <>
          <div className="flex items-start gap-4 px-5 py-5">
            <GroupInitialsBadge initials={meeting.groupInitials} className="size-14 rounded-xl text-lg" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <h3 className="truncate text-base font-semibold text-foreground">{meeting.groupName}</h3>
                <StatusPill status={meeting.status} />
              </div>
              <p className="mt-2 text-sm font-semibold text-foreground">{meeting.topic}</p>
              <p className="mt-1 text-sm text-muted-foreground">{meeting.description}</p>
            </div>
          </div>

          <Separator />
          <dl className="space-y-4 px-5 py-5">
            <InfoRow icon={<CalendarClock className="size-4" />} label="Date & Time" value={formatDate(meeting.startsAt)} />
            <InfoRow icon={<Clock className="size-4" />} label="Time" value={`${formatTime(meeting.startsAt)} - ${meeting.endsAt ? formatTime(meeting.endsAt) : "8:00 PM"}`} />
            <InfoRow icon={<MapPin className="size-4" />} label="Location" value={meeting.location ?? "-"} />
            <InfoRow icon={<UserRound className="size-4" />} label="Conducted By" value={meeting.conductor?.name ?? "Unassigned"} />
            <InfoRow icon={<Users className="size-4" />} label="Expected Attendance" value={meeting.expectedAttendance ?? "-"} />
            <InfoRow icon={<Users className="size-4" />} label="Current Attendance" value={meeting.recordedAttendance === null ? "Not recorded" : `${meeting.recordedAttendance} recorded`} />
            <InfoRow icon={<NotebookText className="size-4" />} label="Meeting Type" value={meeting.meetingType ?? "-"} />
            <InfoRow icon={<NotebookText className="size-4" />} label="Notes" value={<span className="font-normal">{meeting.notes ?? "-"}</span>} />
          </dl>

          <Separator />
          <div className="space-y-2 px-5 py-5">
            <Button type="button" className="h-10 w-full justify-between rounded-lg" onClick={() => onDialogChange({ type: "record-attendance", meetingId: meeting.id })}>
              <span className="inline-flex items-center gap-2">
                <Users className="size-4" aria-hidden="true" />
                Record Attendance
              </span>
              <ChevronRight className="size-4" aria-hidden="true" />
            </Button>
            <Button type="button" variant="outline" className="h-10 w-full justify-between rounded-lg bg-background" onClick={() => onViewHistory(meeting.groupId)}>
              <span className="inline-flex items-center gap-2">
                <History className="size-4" aria-hidden="true" />
                View Meeting History
              </span>
              <ChevronRight className="size-4" aria-hidden="true" />
            </Button>
            <Button type="button" variant="outline" className="h-10 w-full justify-between rounded-lg bg-background" onClick={() => onOpenGroup(meeting.groupId)}>
              <span className="inline-flex items-center gap-2">
                <Users className="size-4" aria-hidden="true" />
                View Group
              </span>
              <ChevronRight className="size-4" aria-hidden="true" />
            </Button>
            <Button type="button" variant="outline" className="h-10 w-full justify-between rounded-lg bg-background" onClick={() => onDialogChange({ type: "generate-report", reportKind: "attendance", groupId: meeting.groupId })}>
              <span className="inline-flex items-center gap-2">
                <FileBarChart className="size-4" aria-hidden="true" />
                Generate Attendance Report
              </span>
              <ChevronRight className="size-4" aria-hidden="true" />
            </Button>
          </div>
        </>
      ) : (
        <div className="flex min-h-[320px] flex-col items-center justify-center px-8 text-center">
          <CalendarClock className="size-10 text-muted-foreground" aria-hidden="true" />
          <h3 className="mt-4 text-sm font-semibold text-foreground">Select a meeting to review it.</h3>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Meeting details, attendance, and quick actions appear here.
          </p>
        </div>
      )}
    </ChurchRightRail>
  );
}

export function MeetingsTab({
  data,
  meetingsState,
  selectedMeeting,
  onMeetingsStateChange,
  onSelectMeeting,
  onOpenGroup,
  onDialogChange,
}: {
  data: SmallGroupsWorkspaceData;
  meetingsState: MeetingsState;
  selectedMeeting: SmallGroupMeetingViewModel | null;
  onMeetingsStateChange: (state: Partial<MeetingsState>) => void;
  onSelectMeeting: (meetingId: string) => void;
  onOpenGroup: (groupId: string) => void;
  onDialogChange: (dialog: SmallGroupsDialog) => void;
}) {
  const rows = useMemo(
    () => filterMeetings(data.meetings, meetingsState),
    [data.meetings, meetingsState]
  );
  const activeFilters = hasFilters(meetingsState);

  return (
    <div className="min-w-0">
      <ChurchContentGrid className="items-start gap-3 xl:grid-cols-[minmax(0,1fr)_340px]">
        <section className="min-w-0">
          <MeetingsToolbar
            data={data}
            meetingsState={meetingsState}
            onMeetingsStateChange={onMeetingsStateChange}
          />
          <MeetingStateTabs
            data={data}
            meetingsState={meetingsState}
            onMeetingsStateChange={onMeetingsStateChange}
          />
          <MeetingsRegistry
            rows={rows}
            selectedMeeting={selectedMeeting}
            onSelectMeeting={onSelectMeeting}
            onDialogChange={onDialogChange}
            hasActiveFilters={activeFilters}
          />
        </section>
        <MeetingDetailsPanel
          meeting={selectedMeeting}
          onClear={() => onSelectMeeting("")}
          onOpenGroup={onOpenGroup}
          onViewHistory={(groupId) => onMeetingsStateChange({ groupId, subTab: "past" })}
          onDialogChange={onDialogChange}
        />
      </ChurchContentGrid>
    </div>
  );
}
