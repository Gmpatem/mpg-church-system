import type {
  PersonSummary,
  SelectOption,
  SmallGroupsWorkspaceData,
} from "./types";

export type SmallGroupsMemberSource = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  display_name?: string | null;
  member_code?: string | null;
  email?: string | null;
  phone?: string | null;
  membership_status?: string | null;
  address?: string | null;
  date_of_birth?: string | null;
};

function initialsFromName(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0))
      .join("")
      .toUpperCase() || "SG"
  );
}

function memberName(member: SmallGroupsMemberSource) {
  return (
    member.display_name ||
    [member.first_name, member.last_name].filter(Boolean).join(" ") ||
    member.member_code ||
    "Member"
  );
}

function toPersonSummary(member: SmallGroupsMemberSource): PersonSummary {
  const name = memberName(member);

  return {
    id: member.id,
    name,
    initials: initialsFromName(name),
    email: member.email ?? null,
    phone: member.phone ?? null,
    memberCode: member.member_code ?? null,
    membershipStatus: member.membership_status ?? null,
    address: member.address ?? null,
    dateOfBirth: member.date_of_birth ?? null,
    avatarUrl: null,
  };
}

function buildPersonPool(members: SmallGroupsMemberSource[]) {
  return members.map(toPersonSummary);
}

function option(value: string, label: string): SelectOption {
  return { value, label };
}

function uniqueOptions(values: Array<string | null>) {
  return Array.from(new Set(values.filter(Boolean) as string[]))
    .sort((a, b) => a.localeCompare(b))
    .map((value) => option(value, value));
}

export function buildSmallGroupsWorkspaceData({
  churchId,
  churchSlug,
  members,
}: {
  churchId: string;
  churchSlug: string;
  members: SmallGroupsMemberSource[];
}): SmallGroupsWorkspaceData {
  const people = buildPersonPool(members);
  const groups: SmallGroupsWorkspaceData["groups"] = [];
  const groupMembers: SmallGroupsWorkspaceData["groupMembers"] = [];
  const meetings: SmallGroupsWorkspaceData["meetings"] = [];
  const outreachActivities: SmallGroupsWorkspaceData["outreachActivities"] = [];

  // Integration boundary: the repository currently has no Small Groups tables,
  // queries, validators, or server actions. Keep this workspace empty instead of
  // fabricating operational data until the backend is implemented.
  return {
    churchId,
    churchSlug,
    stats: {
      totalGroups: 0,
      activeGroups: 0,
      totalMembers: 0,
      averageAttendanceDisplay: "-",
      averageAttendancePercent: null,
      outreachActivities: 0,
      peopleReached: 0,
      newConnections: null,
      decisions: null,
      followUpRate: null,
    },
    groups,
    meetings,
    groupMembers,
    outreachActivities,
    people,
    attendanceTrend: [],
    options: {
      groups: groups.map((group) => option(group.id, group.name)),
      neighborhoods: uniqueOptions(groups.map((group) => group.neighborhood)),
      leaders: groups
        .map((group) => group.leader)
        .filter((leader): leader is PersonSummary => Boolean(leader))
        .map((leader) => option(leader.id, leader.name)),
      meetingDays: uniqueOptions(groups.map((group) => group.meetingDayLabel)),
      meetingTypes: uniqueOptions(meetings.map((meeting) => meeting.meetingType)),
      groupRoles: [
        option("leader", "Leader"),
        option("assistant_leader", "Assistant Leader"),
        option("member", "Member"),
      ],
      outreachTypes: uniqueOptions(outreachActivities.map((activity) => activity.type)),
    },
    backend: {
      hasSmallGroupsTables: false,
      connectedActions: [],
      missingOperations: [
        "createSmallGroup",
        "updateSmallGroup",
        "archiveSmallGroup",
        "assignMemberToGroup",
        "scheduleGroupMeeting",
        "recordAttendance",
        "createOutreach",
        "generateSmallGroupsReport",
        "saveSmallGroupNotes",
        "changeSmallGroupLeader",
      ],
    },
  };
}
