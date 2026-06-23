"use client";

import { useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { GroupsTab } from "./groups/GroupsTab";
import { GroupMembersTab } from "./members/GroupMembersTab";
import { MeetingsTab } from "./meetings/MeetingsTab";
import { OverviewTab } from "./overview/OverviewTab";
import { OutreachTab } from "./outreach/OutreachTab";
import { SmallGroupsDialogHost } from "./dialogs/SmallGroupsDialogHost";
import { SmallGroupsTabBar } from "./SmallGroupsTabBar";
import { SmallGroupsWorkspaceHeader } from "./SmallGroupsWorkspaceHeader";
import type {
  GroupsState,
  MeetingsState,
  MembersState,
  OutreachState,
  SmallGroupsDialog,
  SmallGroupsTabKey,
  SmallGroupsWorkspaceData,
  SmallGroupsWorkspaceState,
} from "./types";

interface SmallGroupsWorkspaceProps {
  churchSlug: string;
  data: SmallGroupsWorkspaceData;
  initialTab: SmallGroupsTabKey;
}

function buildInitialState(data: SmallGroupsWorkspaceData, initialTab: SmallGroupsTabKey): SmallGroupsWorkspaceState {
  const selectedGroupId = data.groups[0]?.id ?? null;
  const selectedMeetingId = data.meetings[0]?.id ?? null;
  const selectedGroupMemberId = data.groupMembers.find((member) => member.groupId === selectedGroupId)?.assignmentId ?? null;
  const selectedOutreachId = data.outreachActivities[0]?.id ?? null;

  return {
    activeTab: initialTab,
    selectedGroupId,
    selectedMeetingId,
    selectedGroupMemberId,
    selectedOutreachId,
    groupsState: {
      search: "",
      status: "",
      neighborhood: "",
      leaderId: "",
      meetingDay: "",
      page: 1,
    },
    meetingsState: {
      search: "",
      groupId: "",
      dateRange: "",
      meetingType: "",
      status: "",
      subTab: "upcoming",
      page: 1,
    },
    membersState: {
      groupId: selectedGroupId ?? "",
      search: "",
      role: "",
      status: "",
      joinedRange: "",
      page: 1,
    },
    outreachState: {
      search: "",
      groupId: "",
      activityType: "",
      dateRange: "",
      status: "",
      subTab: "all",
      page: 1,
    },
  };
}

export function SmallGroupsWorkspace({
  churchSlug,
  data,
  initialTab,
}: SmallGroupsWorkspaceProps) {
  const pathname = usePathname();
  const [state, setState] = useState<SmallGroupsWorkspaceState>(() =>
    buildInitialState(data, initialTab)
  );
  const [activeDialog, setActiveDialog] = useState<SmallGroupsDialog>(null);

  const selectedGroup = useMemo(
    () => data.groups.find((group) => group.id === state.selectedGroupId) ?? null,
    [data.groups, state.selectedGroupId]
  );
  const selectedMeeting = useMemo(
    () => data.meetings.find((meeting) => meeting.id === state.selectedMeetingId) ?? null,
    [data.meetings, state.selectedMeetingId]
  );
  const selectedGroupMember = useMemo(
    () => data.groupMembers.find((member) => member.assignmentId === state.selectedGroupMemberId) ?? null,
    [data.groupMembers, state.selectedGroupMemberId]
  );
  const selectedOutreach = useMemo(
    () => data.outreachActivities.find((activity) => activity.id === state.selectedOutreachId) ?? null,
    [data.outreachActivities, state.selectedOutreachId]
  );

  function replaceTabQuery(tab: SmallGroupsTabKey) {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (tab === "overview") {
      params.delete("tab");
    } else {
      params.set("tab", tab);
    }
    const nextQuery = params.toString();
    window.history.replaceState(null, "", nextQuery ? `${pathname}?${nextQuery}` : pathname);
  }

  function setActiveTab(activeTab: SmallGroupsTabKey) {
    setState((current) => ({ ...current, activeTab }));
    replaceTabQuery(activeTab);
  }

  function updateGroupsState(next: Partial<GroupsState>) {
    setState((current) => ({
      ...current,
      groupsState: { ...current.groupsState, ...next, page: next.page ?? 1 },
    }));
  }

  function updateMeetingsState(next: Partial<MeetingsState>) {
    setState((current) => ({
      ...current,
      meetingsState: { ...current.meetingsState, ...next, page: next.page ?? 1 },
    }));
  }

  function updateMembersState(next: Partial<MembersState>) {
    setState((current) => ({
      ...current,
      membersState: { ...current.membersState, ...next, page: next.page ?? 1 },
    }));
  }

  function updateOutreachState(next: Partial<OutreachState>) {
    setState((current) => ({
      ...current,
      outreachState: { ...current.outreachState, ...next, page: next.page ?? 1 },
    }));
  }

  function selectGroup(groupId: string | null) {
    setState((current) => ({
      ...current,
      selectedGroupId: groupId,
      selectedGroupMemberId:
        groupId === null
          ? null
          : data.groupMembers.find((member) => member.groupId === groupId)?.assignmentId ?? current.selectedGroupMemberId,
    }));
  }

  function selectMeeting(meetingId: string) {
    const meeting = data.meetings.find((item) => item.id === meetingId);
    setState((current) => ({
      ...current,
      selectedMeetingId: meetingId,
      selectedGroupId: meeting?.groupId ?? current.selectedGroupId,
    }));
  }

  function openMeetingFromOverview(meetingId: string) {
    const meeting = data.meetings.find((item) => item.id === meetingId);
    setState((current) => ({
      ...current,
      activeTab: "meetings",
      selectedMeetingId: meetingId,
      selectedGroupId: meeting?.groupId ?? current.selectedGroupId,
      meetingsState: {
        ...current.meetingsState,
        groupId: meeting?.groupId ?? current.meetingsState.groupId,
        subTab: "upcoming",
        page: 1,
      },
    }));
    replaceTabQuery("meetings");
  }

  function openGroupMembers(groupId: string) {
    setState((current) => ({
      ...current,
      activeTab: "members",
      selectedGroupId: groupId,
      membersState: { ...current.membersState, groupId, page: 1 },
      selectedGroupMemberId:
        data.groupMembers.find((member) => member.groupId === groupId)?.assignmentId ??
        current.selectedGroupMemberId,
    }));
    replaceTabQuery("members");
  }

  function openGroupMeetings(groupId: string) {
    setState((current) => ({
      ...current,
      activeTab: "meetings",
      selectedGroupId: groupId,
      meetingsState: { ...current.meetingsState, groupId, page: 1 },
      selectedMeetingId:
        data.meetings.find((meeting) => meeting.groupId === groupId)?.id ?? current.selectedMeetingId,
    }));
    replaceTabQuery("meetings");
  }

  function openGroupOutreach(groupId: string) {
    setState((current) => ({
      ...current,
      activeTab: "outreach",
      selectedGroupId: groupId,
      outreachState: { ...current.outreachState, groupId, page: 1 },
      selectedOutreachId:
        data.outreachActivities.find((activity) => activity.groupId === groupId)?.id ??
        current.selectedOutreachId,
    }));
    replaceTabQuery("outreach");
  }

  return (
    <div className="min-w-0 space-y-4">
      <SmallGroupsWorkspaceHeader activeTab={state.activeTab} onDialogChange={setActiveDialog} />
      <SmallGroupsTabBar activeTab={state.activeTab} onChange={setActiveTab} />

      <section
        id="small-groups-panel-overview"
        role="tabpanel"
        aria-labelledby="small-groups-tab-overview"
        hidden={state.activeTab !== "overview"}
        className="min-w-0"
      >
        {state.activeTab === "overview" ? (
          <OverviewTab
            data={data}
            onSelectMeeting={openMeetingFromOverview}
          />
        ) : null}
      </section>

      <section
        id="small-groups-panel-groups"
        role="tabpanel"
        aria-labelledby="small-groups-tab-groups"
        hidden={state.activeTab !== "groups"}
        className="min-w-0"
      >
        {state.activeTab === "groups" ? (
          <GroupsTab
            data={data}
            groupsState={state.groupsState}
            selectedGroup={selectedGroup}
            onGroupsStateChange={updateGroupsState}
            onSelectGroup={selectGroup}
            onOpenMembers={openGroupMembers}
            onOpenMeetings={openGroupMeetings}
            onOpenOutreach={openGroupOutreach}
            onDialogChange={setActiveDialog}
          />
        ) : null}
      </section>

      <section
        id="small-groups-panel-meetings"
        role="tabpanel"
        aria-labelledby="small-groups-tab-meetings"
        hidden={state.activeTab !== "meetings"}
        className="min-w-0"
      >
        {state.activeTab === "meetings" ? (
          <MeetingsTab
            data={data}
            meetingsState={state.meetingsState}
            selectedMeeting={selectedMeeting}
            onMeetingsStateChange={updateMeetingsState}
            onSelectMeeting={selectMeeting}
            onOpenGroup={(groupId) => {
              selectGroup(groupId);
              setActiveTab("groups");
            }}
            onDialogChange={setActiveDialog}
          />
        ) : null}
      </section>

      <section
        id="small-groups-panel-members"
        role="tabpanel"
        aria-labelledby="small-groups-tab-members"
        hidden={state.activeTab !== "members"}
        className="min-w-0"
      >
        {state.activeTab === "members" ? (
          <GroupMembersTab
            data={data}
            membersState={state.membersState}
            selectedGroup={selectedGroup}
            selectedMember={selectedGroupMember}
            onMembersStateChange={updateMembersState}
            onSelectGroup={selectGroup}
            onSelectMember={(assignmentId) =>
              setState((current) => ({ ...current, selectedGroupMemberId: assignmentId }))
            }
            onOpenGroup={(groupId) => {
              selectGroup(groupId);
              setActiveTab("groups");
            }}
            onOpenAttendance={openGroupMeetings}
            onDialogChange={setActiveDialog}
          />
        ) : null}
      </section>

      <section
        id="small-groups-panel-outreach"
        role="tabpanel"
        aria-labelledby="small-groups-tab-outreach"
        hidden={state.activeTab !== "outreach"}
        className="min-w-0"
      >
        {state.activeTab === "outreach" ? (
          <OutreachTab
            data={data}
            outreachState={state.outreachState}
            selectedOutreach={selectedOutreach}
            onOutreachStateChange={updateOutreachState}
            onSelectOutreach={(outreachId) =>
              setState((current) => ({ ...current, selectedOutreachId: outreachId }))
            }
            onDialogChange={setActiveDialog}
          />
        ) : null}
      </section>

      <SmallGroupsDialogHost
        activeDialog={activeDialog}
        onDialogChange={setActiveDialog}
        data={data}
        selectedGroupId={state.selectedGroupId}
        selectedMeetingId={state.selectedMeetingId}
        selectedMemberId={state.selectedGroupMemberId}
        selectedOutreachId={state.selectedOutreachId}
      />
    </div>
  );
}
