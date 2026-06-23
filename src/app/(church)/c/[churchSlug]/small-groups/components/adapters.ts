import type {
  GroupMemberViewModel,
  OutreachActivityViewModel,
  PersonSummary,
  SelectOption,
  SmallGroupMeetingViewModel,
  SmallGroupsWorkspaceData,
  SmallGroupViewModel,
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

const fallbackPeople: PersonSummary[] = [
  {
    id: "seed-person-marie-abena",
    name: "Marie Abena",
    initials: "MA",
    email: "marie.abena@example.com",
    phone: "+237 6 70 12 34 56",
    memberCode: "MEM-1001",
    membershipStatus: "active",
    address: "Bastos, Yaounde",
    dateOfBirth: "1986-05-14",
    avatarUrl: null,
  },
  {
    id: "seed-person-paul-manga",
    name: "Paul Manga",
    initials: "PM",
    email: "paul.manga@example.com",
    phone: "+237 6 71 23 45 67",
    memberCode: "MEM-1002",
    membershipStatus: "active",
    address: "Tsinga, Yaounde",
    dateOfBirth: "1981-11-06",
    avatarUrl: null,
  },
  {
    id: "seed-person-esther-fouda",
    name: "Esther Fouda",
    initials: "EF",
    email: "esther.fouda@example.com",
    phone: "+237 6 72 34 56 78",
    memberCode: "MEM-1003",
    membershipStatus: "active",
    address: "Melen, Yaounde",
    dateOfBirth: "1990-03-22",
    avatarUrl: null,
  },
  {
    id: "seed-person-samuel-essomba",
    name: "Samuel Essomba",
    initials: "SE",
    email: "samuel.essomba@example.com",
    phone: "+237 6 73 45 67 89",
    memberCode: "MEM-1004",
    membershipStatus: "active",
    address: "Biyem-Assi, Yaounde",
    dateOfBirth: "1978-08-18",
    avatarUrl: null,
  },
  {
    id: "seed-person-rachel-tchoupo",
    name: "Rachel Tchoupo",
    initials: "RT",
    email: "rachel.tchoupo@example.com",
    phone: "+237 6 74 56 78 90",
    memberCode: "MEM-1005",
    membershipStatus: "active",
    address: "Omnisport, Yaounde",
    dateOfBirth: "1988-01-30",
    avatarUrl: null,
  },
  {
    id: "seed-person-jean-pierre-mbarga",
    name: "Jean-Pierre Mbarga",
    initials: "JM",
    email: "jp.mbarga@example.com",
    phone: "+237 6 75 67 89 01",
    memberCode: "MEM-1006",
    membershipStatus: "active",
    address: "Nlongkak, Yaounde",
    dateOfBirth: "1984-09-10",
    avatarUrl: null,
  },
  {
    id: "seed-person-christelle-ngoa",
    name: "Christelle Ngoa",
    initials: "CN",
    email: "christelle.ngoa@example.com",
    phone: "+237 6 76 78 90 12",
    memberCode: "MEM-1007",
    membershipStatus: "active",
    address: "Bastos, Yaounde",
    dateOfBirth: "1992-07-02",
    avatarUrl: null,
  },
  {
    id: "seed-person-david-biloa",
    name: "David Biloa",
    initials: "DB",
    email: "david.biloa@example.com",
    phone: "+237 6 77 89 01 23",
    memberCode: "MEM-1008",
    membershipStatus: "active",
    address: "Melen, Yaounde",
    dateOfBirth: "1979-12-12",
    avatarUrl: null,
  },
  {
    id: "seed-person-sarah-ntone",
    name: "Sarah Ntone",
    initials: "SN",
    email: "sarah.ntone@example.com",
    phone: "+237 6 78 90 12 34",
    memberCode: "MEM-1009",
    membershipStatus: "active",
    address: "Bastos, Yaounde",
    dateOfBirth: "1991-04-25",
    avatarUrl: null,
  },
  {
    id: "seed-person-john-biloa",
    name: "John Biloa",
    initials: "JB",
    email: "john.biloa@example.com",
    phone: "+237 6 79 01 23 45",
    memberCode: "MEM-1010",
    membershipStatus: "active",
    address: "Nlongkak, Yaounde",
    dateOfBirth: "1983-10-09",
    avatarUrl: null,
  },
];

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
  const realPeople = members.map(toPersonSummary);
  const seen = new Set(realPeople.map((person) => person.id));
  const fillers = fallbackPeople.filter((person) => !seen.has(person.id));

  return [...realPeople, ...fillers].slice(0, Math.max(10, realPeople.length));
}

function option(value: string, label: string): SelectOption {
  return { value, label };
}

function personAt(people: PersonSummary[], index: number) {
  return people[index % people.length] ?? fallbackPeople[index % fallbackPeople.length];
}

function groupInitials(name: string) {
  const words = name.replace(/^Groupe\s+/i, "").split(/\s+/).filter(Boolean);
  return words
    .slice(0, 2)
    .map((word) => word.charAt(0))
    .join("")
    .toUpperCase() || initialsFromName(name);
}

type GroupSeed = {
  id: string;
  name: string;
  description: string;
  typeLabel: string;
  status: SmallGroupViewModel["status"];
  neighborhood: string;
  location: string;
  address: string;
  leaderIndex: number;
  assistantIndex: number;
  memberCount: number;
  meetingDayLabel: string;
  meetingTimeLabel: string;
  nextMeetingAt: string | null;
  averageAttendancePercent: number | null;
  meetingsThisMonth: number;
  outreachActivityCount: number;
  createdAt: string;
};

const groupSeeds: GroupSeed[] = [
  {
    id: "group-espoir",
    name: "Groupe Espoir",
    description: "A community growing in the Word and in fellowship.",
    typeLabel: "Bible Study",
    status: "active",
    neighborhood: "Bastos",
    location: "Bastos Community Center",
    address: "Rue 12, Bastos, Yaounde",
    leaderIndex: 0,
    assistantIndex: 1,
    memberCount: 8,
    meetingDayLabel: "Friday",
    meetingTimeLabel: "6:00 PM",
    nextMeetingAt: "2026-06-26T18:00:00+01:00",
    averageAttendancePercent: 76,
    meetingsThisMonth: 4,
    outreachActivityCount: 2,
    createdAt: "2023-02-12T09:00:00+01:00",
  },
  {
    id: "group-lumiere",
    name: "Groupe Lumiere",
    description: "Living out faith at work and in the neighborhood.",
    typeLabel: "Discipleship",
    status: "active",
    neighborhood: "Nlongkak",
    location: "Nlongkak",
    address: "Nlongkak, Yaounde",
    leaderIndex: 5,
    assistantIndex: 7,
    memberCount: 6,
    meetingDayLabel: "Thursday",
    meetingTimeLabel: "5:30 PM",
    nextMeetingAt: "2026-06-25T17:30:00+01:00",
    averageAttendancePercent: 83,
    meetingsThisMonth: 3,
    outreachActivityCount: 1,
    createdAt: "2023-03-08T09:00:00+01:00",
  },
  {
    id: "group-paix",
    name: "Groupe Paix",
    description: "Prayer, parenting, and pastoral care in community.",
    typeLabel: "Care Group",
    status: "active",
    neighborhood: "Melen",
    location: "Melen",
    address: "Melen, Yaounde",
    leaderIndex: 2,
    assistantIndex: 6,
    memberCount: 5,
    meetingDayLabel: "Saturday",
    meetingTimeLabel: "3:00 PM",
    nextMeetingAt: "2026-06-27T15:00:00+01:00",
    averageAttendancePercent: 80,
    meetingsThisMonth: 3,
    outreachActivityCount: 1,
    createdAt: "2023-04-03T09:00:00+01:00",
  },
  {
    id: "group-grace",
    name: "Groupe Grace",
    description: "A relaxed Sunday fellowship group for encouragement.",
    typeLabel: "Fellowship",
    status: "inactive",
    neighborhood: "Biyem-Assi",
    location: "Biyem-Assi",
    address: "Biyem-Assi, Yaounde",
    leaderIndex: 3,
    assistantIndex: 8,
    memberCount: 4,
    meetingDayLabel: "Sunday",
    meetingTimeLabel: "4:00 PM",
    nextMeetingAt: null,
    averageAttendancePercent: null,
    meetingsThisMonth: 0,
    outreachActivityCount: 1,
    createdAt: "2023-06-18T09:00:00+01:00",
  },
  {
    id: "group-foi",
    name: "Groupe Foi",
    description: "Prayer walks, Bible study, and neighborhood support.",
    typeLabel: "Prayer",
    status: "active",
    neighborhood: "Omnisport",
    location: "Omnisport",
    address: "Omnisport, Yaounde",
    leaderIndex: 4,
    assistantIndex: 0,
    memberCount: 7,
    meetingDayLabel: "Wednesday",
    meetingTimeLabel: "7:00 PM",
    nextMeetingAt: "2026-06-24T19:00:00+01:00",
    averageAttendancePercent: 75,
    meetingsThisMonth: 4,
    outreachActivityCount: 1,
    createdAt: "2023-05-01T09:00:00+01:00",
  },
  {
    id: "group-joie",
    name: "Groupe Joie",
    description: "A younger group focused on worship and shared service.",
    typeLabel: "Youth",
    status: "active",
    neighborhood: "Tsinga",
    location: "Tsinga",
    address: "Tsinga, Yaounde",
    leaderIndex: 1,
    assistantIndex: 2,
    memberCount: 3,
    meetingDayLabel: "Tuesday",
    meetingTimeLabel: "6:00 PM",
    nextMeetingAt: "2026-06-23T18:00:00+01:00",
    averageAttendancePercent: 75,
    meetingsThisMonth: 2,
    outreachActivityCount: 1,
    createdAt: "2023-06-08T09:00:00+01:00",
  },
];

const roleSequence: GroupMemberViewModel["role"][] = [
  "leader",
  "assistant_leader",
  "member",
  "member",
  "member",
  "member",
  "member",
  "member",
];

function roleLabel(role: GroupMemberViewModel["role"]) {
  if (role === "leader") return "Leader";
  if (role === "assistant_leader") return "Assistant Leader";
  return "Member";
}

function roleSubtitle(role: GroupMemberViewModel["role"]) {
  if (role === "leader") return "Head of Group";
  if (role === "assistant_leader") return "Assistant Leader";
  return "Member";
}

function buildGroups(people: PersonSummary[]): SmallGroupViewModel[] {
  return groupSeeds.map((seed, groupIndex) => {
    const members = Array.from({ length: seed.memberCount }, (_, offset) =>
      personAt(people, groupIndex * 2 + offset)
    );

    return {
      id: seed.id,
      name: seed.name,
      initials: groupInitials(seed.name),
      description: seed.description,
      typeLabel: seed.typeLabel,
      status: seed.status,
      neighborhood: seed.neighborhood,
      location: seed.location,
      address: seed.address,
      leader: personAt(people, seed.leaderIndex),
      assistantLeader: personAt(people, seed.assistantIndex),
      memberCount: seed.memberCount,
      memberPreview: members.slice(0, 4),
      meetingDayLabel: seed.meetingDayLabel,
      meetingTimeLabel: seed.meetingTimeLabel,
      nextMeetingAt: seed.nextMeetingAt,
      averageAttendancePercent: seed.averageAttendancePercent,
      meetingsThisMonth: seed.meetingsThisMonth,
      outreachActivityCount: seed.outreachActivityCount,
      createdAt: seed.createdAt,
    };
  });
}

function buildGroupMembers(people: PersonSummary[], groups: SmallGroupViewModel[]) {
  return groups.flatMap((group, groupIndex) =>
    Array.from({ length: group.memberCount }, (_, offset) => {
      const member = personAt(people, groupIndex * 2 + offset);
      const role = roleSequence[offset] ?? "member";
      const pattern = offset % 4;
      const lastFourAttendance: GroupMemberViewModel["lastFourAttendance"] =
        pattern === 0
          ? ["present", "present", "present", "unknown"]
          : pattern === 1
            ? ["present", "present", "present", "present"]
            : pattern === 2
              ? ["present", "present", "absent", "unknown"]
              : ["present", "absent", "present", "unknown"];
      const presentCount = lastFourAttendance.filter((entry) => entry === "present").length;

      return {
        assignmentId: `${group.id}-${member.id}`,
        groupId: group.id,
        memberId: member.id,
        member,
        role,
        roleLabel: roleLabel(role),
        roleSubtitle: roleSubtitle(role),
        joinedAt: offset < 2 ? "2023-02-12" : `2023-0${Math.min(6, 3 + offset)}-${String(3 + offset).padStart(2, "0")}`,
        status: "active" as const,
        lastFourAttendance,
        attendancePercent: Math.round((presentCount / 4) * 100),
        meetingsAttended: Math.max(4, presentCount + 3),
        meetingsExpected: 8,
      };
    })
  );
}

function buildMeetings(people: PersonSummary[], groups: SmallGroupViewModel[]): SmallGroupMeetingViewModel[] {
  const topics = [
    ["Romans 8", "The power of the Spirit", "Bible Study"],
    ["Faith in the Workplace", "Living out our faith daily", "Discussion"],
    ["Parenting God's Way", "Biblical principles", "Care"],
    ["Encouragement Night", "Building one another up", "Fellowship"],
    ["Prayer Walk Prep", "Preparing our hearts", "Prayer"],
    ["The Psalms", "Psalms of assurance", "Bible Study"],
  ] as const;

  return groups.map((group, index) => ({
    id: `meeting-${group.id}`,
    groupId: group.id,
    groupName: group.name,
    groupInitials: group.initials,
    topic: topics[index]?.[0] ?? "Small Group Meeting",
    description: topics[index]?.[1] ?? "Weekly gathering",
    meetingType: topics[index]?.[2] ?? "Bible Study",
    startsAt: group.nextMeetingAt ?? `2026-06-${20 + index}T18:00:00+01:00`,
    endsAt: group.nextMeetingAt ? group.nextMeetingAt.replace(":00+01:00", ":00+01:00") : null,
    location: group.location,
    conductor: group.leader ?? personAt(people, index),
    expectedAttendance: group.memberCount,
    recordedAttendance: index < 3 ? Math.max(1, group.memberCount - 1) : null,
    attendancePercent: index < 3 ? Math.round(((group.memberCount - 1) / group.memberCount) * 100) : null,
    status: index < 3 ? "upcoming" : "scheduled",
    notes: index === 0 ? "Bring your Bibles and a friend." : null,
  }));
}

function buildOutreach(groups: SmallGroupViewModel[], people: PersonSummary[]): OutreachActivityViewModel[] {
  const items = [
    ["Community Food Drive", "Bastos Community Center", "Service", "completed", 42, 80, 10, 5],
    ["Open Air Gospel", "Central Market", "Evangelism", "completed", 35, 71, 9, 7],
    ["Hospital Visit", "Bastos General Hospital", "Care Visit", "in-progress", 18, 60, 5, 1],
    ["Youth Outreach", "High School Campus", "Evangelism", "completed", 28, 75, 7, 4],
    ["Home Visit", "Nlongkak Neighborhood", "Home Visit", "in-progress", 12, 50, 3, 1],
    ["Clean Up Campaign", "Yaounde City Park", "Service", "completed", 13, 85, 2, 0],
  ] as const;

  return items.map((item, index) => {
    const group = groups[index % groups.length];
    return {
      id: `outreach-${index + 1}`,
      groupId: group.id,
      groupName: group.name,
      groupInitials: group.initials,
      title: item[0],
      location: item[1],
      type: item[2],
      status: item[3],
      activityAt: `2026-05-${String(20 - index * 2).padStart(2, "0")}T${index % 2 === 0 ? "09:00" : "16:00"}:00+01:00`,
      peopleReached: item[4],
      followUpRate: item[5],
      notes: "Follow-up owners are tracked manually until outreach tables exist.",
      responsiblePerson: personAt(people, index),
      newConnections: item[6],
      decisions: item[7],
    };
  });
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
  const groups = buildGroups(people);
  const groupMembers = buildGroupMembers(people, groups);
  const meetings = buildMeetings(people, groups);
  const outreachActivities = buildOutreach(groups, people);
  const recordedMeetings = meetings.filter((meeting) => meeting.recordedAttendance !== null);
  const totalRecorded = recordedMeetings.reduce((sum, meeting) => sum + (meeting.recordedAttendance ?? 0), 0);
  const averageAttendance = recordedMeetings.length > 0 ? Math.round(totalRecorded / recordedMeetings.length) : null;
  const peopleReached = outreachActivities.reduce((sum, activity) => sum + (activity.peopleReached ?? 0), 0);
  const newConnections = outreachActivities.reduce((sum, activity) => sum + (activity.newConnections ?? 0), 0);
  const decisions = outreachActivities.reduce((sum, activity) => sum + (activity.decisions ?? 0), 0);
  const followUpRates = outreachActivities
    .map((activity) => activity.followUpRate)
    .filter((value): value is number => value !== null);

  // Integration boundary: the repository currently has no Small Groups tables,
  // queries, validators, or server actions. These view models are read-only seed
  // data shaped for the approved desktop workspace until backend work is authorized.
  return {
    churchId,
    churchSlug,
    stats: {
      totalGroups: groups.length,
      activeGroups: groups.filter((group) => group.status === "active").length,
      totalMembers: groups.reduce((sum, group) => sum + group.memberCount, 0),
      averageAttendanceDisplay: averageAttendance === null ? "-" : `~${averageAttendance}`,
      averageAttendancePercent:
        recordedMeetings.length > 0
          ? Math.round(
              recordedMeetings.reduce((sum, meeting) => sum + (meeting.attendancePercent ?? 0), 0) /
                recordedMeetings.length
            )
          : null,
      outreachActivities: outreachActivities.length * 2,
      peopleReached,
      newConnections,
      decisions,
      followUpRate:
        followUpRates.length > 0
          ? Math.round(followUpRates.reduce((sum, value) => sum + value, 0) / followUpRates.length)
          : null,
    },
    groups,
    meetings,
    groupMembers,
    outreachActivities,
    people,
    attendanceTrend: [
      { label: "Week 1", value: 45 },
      { label: "Week 2", value: 52 },
      { label: "Week 3", value: 48 },
      { label: "Week 4", value: 61 },
    ],
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
