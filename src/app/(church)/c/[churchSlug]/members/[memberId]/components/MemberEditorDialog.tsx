"use client";

import Link from "next/link";
import { useActionState, useEffect, useMemo, useState, useTransition, type ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  HeartHandshake,
  Home,
  IdCard,
  Pencil,
  Plus,
  ShieldCheck,
  Trash2,
  UserRoundCheck,
  UsersRound,
} from "lucide-react";
import { assignChurchUserRoleAction, revokeChurchUserRoleAction } from "@/features/access-control/actions";
import {
  processMemberTransferAction,
  reassignMemberHouseholdAction,
  updateMemberAction,
  updateMemberStatusAction,
} from "@/features/members/actions";
import {
  assignMemberToDepartmentAction,
  removeAssignmentAction,
} from "@/features/departments/actions";
import type { DepartmentAssignmentRecord } from "@/features/departments/types";
import type { MemberLeadershipEditorData } from "@/features/members/queries";
import { Button } from "@/components/ui/button";
import { ButtonSpinner } from "@/components/ui/ButtonSpinner";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils/cn";

type EditorTab = "profile" | "household" | "departments" | "leadership" | "status";

type HouseholdOption = {
  id: string;
  household_name: string;
};

type DepartmentOption = {
  id: string;
  name: string;
  code: string | null;
  is_active: boolean;
};

type MemberForEditor = {
  id: string;
  profile_id: string | null;
  first_name: string | null;
  last_name: string | null;
  display_name: string | null;
  member_code: string | null;
  email: string | null;
  phone: string | null;
  gender: string | null;
  date_of_birth: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  profession: string | null;
  marital_status: string | null;
  membership_status: string | null;
  membership_type: string | null;
  date_joined: string | null;
  baptism_date: string | null;
  transfer_in_date: string | null;
  transfer_out_date: string | null;
  previous_church: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  household_id: string | null;
  household_role: string | null;
  notes: string | null;
};

type ActionFlash =
  | { ok: boolean; message?: string; error?: string }
  | null;

interface MemberEditorDialogProps {
  churchSlug: string;
  member: MemberForEditor;
  households: HouseholdOption[];
  departmentAssignments: DepartmentAssignmentRecord[];
  departments: DepartmentOption[];
  leadership: MemberLeadershipEditorData;
  initialOpen?: boolean;
}

const tabs: Array<{
  key: EditorTab;
  label: string;
  icon: typeof IdCard;
}> = [
  { key: "profile", label: "Profile", icon: IdCard },
  { key: "household", label: "Household", icon: Home },
  { key: "departments", label: "Departments", icon: UsersRound },
  { key: "leadership", label: "Leadership", icon: ShieldCheck },
  { key: "status", label: "Status", icon: UserRoundCheck },
];

const membershipStatuses = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "visitor", label: "Visitor" },
  { value: "transferred", label: "Transferred" },
];

const membershipTypes = [
  { value: "regular", label: "Regular" },
  { value: "adherent", label: "Adherent" },
  { value: "child", label: "Child" },
  { value: "youth", label: "Youth" },
  { value: "senior", label: "Senior" },
];

const householdRoles = [
  { value: "head", label: "Head" },
  { value: "spouse", label: "Spouse" },
  { value: "child", label: "Child" },
  { value: "relative", label: "Relative" },
  { value: "guardian", label: "Guardian" },
  { value: "other", label: "Other" },
];

const maritalStatuses = [
  { value: "single", label: "Single" },
  { value: "married", label: "Married" },
  { value: "widowed", label: "Widowed" },
  { value: "divorced", label: "Divorced" },
  { value: "separated", label: "Separated" },
];

const controlClass =
  "h-11 rounded-xl border-emerald-950/10 bg-white shadow-none focus-visible:ring-emerald-700";

const selectClass = cn(
  "flex h-11 w-full rounded-xl border border-emerald-950/10 bg-white px-3 py-2 text-sm text-foreground shadow-none outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
);

function valueOrEmpty(value: string | null | undefined) {
  return value ?? "";
}

function getMemberLabel(member: MemberForEditor) {
  return (
    member.display_name ||
    [member.first_name, member.last_name].filter(Boolean).join(" ") ||
    member.member_code ||
    "Member"
  );
}

function Field({
  id,
  label,
  children,
  className,
}: {
  id: string;
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-2", className)}>
      <Label htmlFor={id} className="text-xs font-semibold uppercase tracking-wide text-emerald-950/70">
        {label}
      </Label>
      {children}
    </div>
  );
}

function TextInput({
  id,
  name,
  label,
  defaultValue,
  type = "text",
  required,
  className,
}: {
  id: string;
  name: string;
  label: string;
  defaultValue?: string | null;
  type?: string;
  required?: boolean;
  className?: string;
}) {
  return (
    <Field id={id} label={label} className={className}>
      <Input
        id={id}
        name={name}
        type={type}
        defaultValue={valueOrEmpty(defaultValue)}
        required={required}
        className={controlClass}
      />
    </Field>
  );
}

function NativeSelect({
  id,
  name,
  label,
  defaultValue,
  children,
  className,
}: {
  id: string;
  name: string;
  label: string;
  defaultValue?: string | null;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Field id={id} label={label} className={className}>
      <select id={id} name={name} defaultValue={valueOrEmpty(defaultValue)} className={selectClass}>
        {children}
      </select>
    </Field>
  );
}

function ActionNotice({ state }: { state: ActionFlash }) {
  if (!state) return null;

  return (
    <div
      className={cn(
        "rounded-2xl border px-4 py-3 text-sm",
        state.ok
          ? "border-emerald-200 bg-emerald-50 text-emerald-900"
          : "border-red-200 bg-red-50 text-red-700"
      )}
    >
      {state.ok ? state.message ?? "Saved." : state.error ?? "Action failed."}
    </div>
  );
}

function Panel({
  title,
  description,
  children,
  icon: Icon,
  className,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  icon?: typeof IdCard;
  className?: string;
}) {
  return (
    <section className={cn("rounded-[22px] border border-emerald-950/10 bg-white p-4 shadow-sm", className)}>
      <div className="flex items-start gap-3">
        {Icon ? (
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-800">
            <Icon className="size-5" aria-hidden="true" />
          </div>
        ) : null}
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-emerald-950">{title}</h3>
          {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
        </div>
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function HiddenMemberFields({ member }: { member: MemberForEditor }) {
  return (
    <>
      <input type="hidden" name="householdId" value={valueOrEmpty(member.household_id)} />
      <input type="hidden" name="householdRole" value={valueOrEmpty(member.household_role)} />
      <input type="hidden" name="departmentId" value="" />
    </>
  );
}

export function MemberEditorDialog({
  churchSlug,
  member,
  households,
  departmentAssignments,
  departments,
  leadership,
  initialOpen = false,
}: MemberEditorDialogProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(initialOpen);
  const [activeTab, setActiveTab] = useState<EditorTab>("profile");
  const [profileState, profileAction, profilePending] = useActionState(updateMemberAction, null);
  const [householdState, householdAction, householdPending] = useActionState(reassignMemberHouseholdAction, null);
  const [departmentState, departmentAction, departmentPending] = useActionState(assignMemberToDepartmentAction, null);
  const [removeDepartmentState, removeDepartmentAction, removeDepartmentPending] = useActionState(removeAssignmentAction, null);
  const [statusState, statusAction, statusPending] = useActionState(updateMemberStatusAction, null);
  const [transferState, transferAction, transferPending] = useActionState(processMemberTransferAction, null);
  const [selectedRoleId, setSelectedRoleId] = useState("");
  const [leadershipState, setLeadershipState] = useState<ActionFlash>(null);
  const [leadershipPending, startLeadershipTransition] = useTransition();

  const memberLabel = getMemberLabel(member);
  const activeDepartmentCount = departmentAssignments.filter((assignment) => assignment.is_active).length;
  const activeLeadershipCount = leadership.assignments.filter((assignment) => assignment.isActive).length;
  const availableRoles = leadership.roleDefinitions.filter(
    (role) => !leadership.assignments.some((assignment) => assignment.roleId === role.id && assignment.isActive)
  );
  const profileCompletion = useMemo(() => {
    const fields = [
      member.first_name,
      member.last_name,
      member.member_code,
      member.email,
      member.phone,
      member.date_joined,
      member.household_id,
      member.emergency_contact_name,
      member.emergency_contact_phone,
      activeDepartmentCount > 0 ? "department" : "",
    ];
    const filled = fields.filter(Boolean).length;
    return Math.round((filled / fields.length) * 100);
  }, [activeDepartmentCount, member]);

  useEffect(() => {
    setOpen(initialOpen);
  }, [initialOpen]);

  useEffect(() => {
    if (
      profileState?.ok ||
      householdState?.ok ||
      departmentState?.ok ||
      removeDepartmentState?.ok ||
      statusState?.ok ||
      transferState?.ok
    ) {
      router.refresh();
    }
  }, [
    departmentState,
    householdState,
    profileState,
    removeDepartmentState,
    router,
    statusState,
    transferState,
  ]);

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen && searchParams.get("editor")) {
      const nextParams = new URLSearchParams(searchParams.toString());
      nextParams.delete("editor");
      const queryString = nextParams.toString();
      router.replace(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false });
    }
  }

  function assignLeadershipRole() {
    if (!leadership.profileId || !selectedRoleId) return;

    startLeadershipTransition(async () => {
      const result = await assignChurchUserRoleAction(churchSlug, leadership.profileId!, selectedRoleId);
      setLeadershipState(result.ok ? { ok: true, message: result.message } : { ok: false, error: result.error });
      if (result.ok) {
        setSelectedRoleId("");
        router.refresh();
      }
    });
  }

  function revokeLeadershipRole(roleAssignmentId: string) {
    if (!leadership.profileId) return;

    startLeadershipTransition(async () => {
      const result = await revokeChurchUserRoleAction(churchSlug, leadership.profileId!, roleAssignmentId);
      setLeadershipState(result.ok ? { ok: true, message: result.message } : { ok: false, error: result.error });
      if (result.ok) {
        router.refresh();
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button type="button" className="h-11 gap-2 rounded-xl bg-emerald-900 px-4 text-white hover:bg-emerald-800">
          <Pencil className="size-4" aria-hidden="true" />
          Edit member
        </Button>
      </DialogTrigger>
      <DialogContent
        aria-describedby="member-editor-description"
        className="max-h-[92vh] w-[calc(100vw-1rem)] max-w-6xl overflow-hidden border-emerald-950/10 bg-[#fbf7ef] p-0 shadow-2xl sm:rounded-[28px] [&>button]:text-white"
      >
        <div className="flex max-h-[92vh] min-h-0 flex-col overflow-hidden">
          <div className="bg-emerald-950 px-5 py-5 text-white sm:px-6">
            <DialogHeader className="gap-2 pr-10 text-left">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="border-white/15 bg-white/10 text-white hover:bg-white/10">
                  Member editor
                </Badge>
                <Badge className="border-emerald-300/20 bg-emerald-300/10 text-emerald-50 hover:bg-emerald-300/10">
                  {member.membership_status ?? "unmarked"}
                </Badge>
              </div>
              <DialogTitle className="text-2xl font-semibold tracking-normal text-white">
                {memberLabel}
              </DialogTitle>
              <DialogDescription id="member-editor-description" className="text-emerald-50/85">
                Profile, household, departments, leadership, and membership status.
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="border-b border-emerald-950/10 bg-[#fbf7ef] px-3 py-3 sm:px-5">
            <div className="grid grid-cols-2 gap-2 sm:flex sm:overflow-x-auto">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.key;

                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveTab(tab.key)}
                    aria-pressed={isActive}
                    className={cn(
                      "inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-3 py-2 text-sm font-semibold transition",
                      isActive
                        ? "bg-emerald-900 text-white shadow-sm"
                        : "border border-emerald-950/10 bg-white text-emerald-950 hover:bg-emerald-50"
                    )}
                  >
                    <Icon className="size-4" aria-hidden="true" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="min-h-0 overflow-y-auto px-4 py-4 sm:px-6">
            {activeTab === "profile" ? (
              <form action={profileAction} className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
                <input type="hidden" name="churchSlug" value={churchSlug} />
                <input type="hidden" name="memberId" value={member.id} />
                <HiddenMemberFields member={member} />

                <div className="min-w-0">
                  <ActionNotice state={profileState} />
                  <div className="mt-4 flex flex-col gap-4">
                    <Panel title="Identity" icon={IdCard}>
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <TextInput id="member-first-name" name="firstName" label="First name" defaultValue={member.first_name} required />
                        <TextInput id="member-last-name" name="lastName" label="Last name" defaultValue={member.last_name} required />
                        <TextInput id="member-display-name" name="displayName" label="Display name" defaultValue={member.display_name} />
                        <TextInput id="member-code" name="memberCode" label="Member code" defaultValue={member.member_code} />
                        <TextInput id="member-email" name="email" label="Email" defaultValue={member.email} type="email" />
                        <TextInput id="member-phone" name="phone" label="Phone" defaultValue={member.phone} />
                        <NativeSelect id="member-gender" name="gender" label="Gender" defaultValue={member.gender}>
                          <option value="">Select</option>
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                        </NativeSelect>
                        <TextInput id="member-date-of-birth" name="dateOfBirth" label="Date of birth" defaultValue={member.date_of_birth} type="date" />
                        <NativeSelect id="member-marital-status" name="maritalStatus" label="Marital status" defaultValue={member.marital_status}>
                          <option value="">Select</option>
                          {maritalStatuses.map((status) => (
                            <option key={status.value} value={status.value}>{status.label}</option>
                          ))}
                        </NativeSelect>
                        <TextInput id="member-profession" name="profession" label="Profession" defaultValue={member.profession} />
                      </div>
                    </Panel>

                    <Panel title="Membership" icon={CalendarDays}>
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <NativeSelect id="member-status" name="membershipStatus" label="Status" defaultValue={member.membership_status ?? "active"}>
                          {membershipStatuses.map((status) => (
                            <option key={status.value} value={status.value}>{status.label}</option>
                          ))}
                        </NativeSelect>
                        <NativeSelect id="member-type" name="membershipType" label="Type" defaultValue={member.membership_type}>
                          <option value="">Select</option>
                          {membershipTypes.map((type) => (
                            <option key={type.value} value={type.value}>{type.label}</option>
                          ))}
                        </NativeSelect>
                        <TextInput id="member-date-joined" name="dateJoined" label="Date joined" defaultValue={member.date_joined} type="date" />
                        <TextInput id="member-baptism-date" name="baptismDate" label="Baptism date" defaultValue={member.baptism_date} type="date" />
                        <TextInput id="member-transfer-in" name="transferInDate" label="Transfer in" defaultValue={member.transfer_in_date} type="date" />
                        <TextInput id="member-transfer-out" name="transferOutDate" label="Transfer out" defaultValue={member.transfer_out_date} type="date" />
                        <TextInput id="member-previous-church" name="previousChurch" label="Previous church" defaultValue={member.previous_church} className="md:col-span-2" />
                      </div>
                    </Panel>

                    <Panel title="Contact and notes" icon={HeartHandshake}>
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <TextInput id="member-city" name="city" label="City" defaultValue={member.city} />
                        <TextInput id="member-country" name="country" label="Country" defaultValue={member.country} />
                        <Field id="member-address" label="Address" className="md:col-span-2">
                          <Textarea id="member-address" name="address" defaultValue={valueOrEmpty(member.address)} rows={3} className="rounded-xl border-emerald-950/10 bg-white focus-visible:ring-emerald-700" />
                        </Field>
                        <TextInput id="member-emergency-name" name="emergencyContactName" label="Emergency contact" defaultValue={member.emergency_contact_name} />
                        <TextInput id="member-emergency-phone" name="emergencyContactPhone" label="Emergency phone" defaultValue={member.emergency_contact_phone} />
                        <Field id="member-notes" label="Notes" className="md:col-span-2">
                          <Textarea id="member-notes" name="notes" defaultValue={valueOrEmpty(member.notes)} rows={4} className="rounded-xl border-emerald-950/10 bg-white focus-visible:ring-emerald-700" />
                        </Field>
                      </div>
                    </Panel>

                    <div className="sticky bottom-0 -mx-4 border-t border-emerald-950/10 bg-[#fbf7ef]/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
                      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                        <Button type="button" variant="outline" className="h-11 rounded-xl bg-white" onClick={() => handleOpenChange(false)}>
                          Close
                        </Button>
                        <Button type="submit" disabled={profilePending} className="h-11 rounded-xl bg-emerald-900 px-5 text-white hover:bg-emerald-800">
                          {profilePending ? (
                            <span className="inline-flex items-center gap-2">
                              <ButtonSpinner />
                              Saving
                            </span>
                          ) : "Save profile"}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                <aside className="min-w-0">
                  <div className="sticky top-4 flex flex-col gap-4">
                    <Panel title="Record health" icon={CheckCircle2}>
                      <div className="flex flex-col gap-4">
                        <div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium text-emerald-950">Completion</span>
                            <span className="font-semibold text-emerald-900">{profileCompletion}%</span>
                          </div>
                          <Progress value={profileCompletion} className="mt-2 bg-emerald-100 [&>div]:bg-emerald-800" />
                        </div>
                        <Separator />
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div className="rounded-2xl bg-[#fbf7ef] px-2 py-3">
                            <div className="text-lg font-semibold text-emerald-950">{member.household_id ? 1 : 0}</div>
                            <div className="text-xs text-muted-foreground">Household</div>
                          </div>
                          <div className="rounded-2xl bg-[#fbf7ef] px-2 py-3">
                            <div className="text-lg font-semibold text-emerald-950">{activeDepartmentCount}</div>
                            <div className="text-xs text-muted-foreground">Departments</div>
                          </div>
                          <div className="rounded-2xl bg-[#fbf7ef] px-2 py-3">
                            <div className="text-lg font-semibold text-emerald-950">{activeLeadershipCount}</div>
                            <div className="text-xs text-muted-foreground">Roles</div>
                          </div>
                        </div>
                      </div>
                    </Panel>

                    <Panel title="Linked profile" icon={BriefcaseBusiness}>
                      <div className="flex flex-col gap-3 text-sm text-muted-foreground">
                        <div className="flex items-center justify-between gap-3">
                          <span>Portal profile</span>
                          <Badge variant={leadership.profileId ? "default" : "secondary"} className={leadership.profileId ? "bg-emerald-900" : ""}>
                            {leadership.profileId ? "Linked" : "Not linked"}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <span>Active departments</span>
                          <span className="font-semibold text-emerald-950">{activeDepartmentCount}</span>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <span>Active leadership</span>
                          <span className="font-semibold text-emerald-950">{activeLeadershipCount}</span>
                        </div>
                      </div>
                    </Panel>
                  </div>
                </aside>
              </form>
            ) : null}

            {activeTab === "household" ? (
              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
                <Panel title="Household placement" icon={Home}>
                  <form action={householdAction} className="flex flex-col gap-4">
                    <input type="hidden" name="churchSlug" value={churchSlug} />
                    <input type="hidden" name="memberId" value={member.id} />
                    <ActionNotice state={householdState} />
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <NativeSelect id="editor-household-id" name="householdId" label="Household" defaultValue={member.household_id}>
                        <option value="">No household</option>
                        {households.map((household) => (
                          <option key={household.id} value={household.id}>{household.household_name}</option>
                        ))}
                      </NativeSelect>
                      <NativeSelect id="editor-household-role" name="householdRole" label="Household role" defaultValue={member.household_role}>
                        <option value="">No role</option>
                        {householdRoles.map((role) => (
                          <option key={role.value} value={role.value}>{role.label}</option>
                        ))}
                      </NativeSelect>
                    </div>
                    <div className="flex justify-end">
                      <Button type="submit" disabled={householdPending} className="h-11 rounded-xl bg-emerald-900 px-5 text-white hover:bg-emerald-800">
                        {householdPending ? (
                          <span className="inline-flex items-center gap-2"><ButtonSpinner /> Saving</span>
                        ) : "Update household"}
                      </Button>
                    </div>
                  </form>
                </Panel>

                <Panel title="Current link" icon={CheckCircle2}>
                  <div className="flex flex-col gap-3 text-sm">
                    <div className="flex items-center justify-between gap-3 rounded-2xl bg-[#fbf7ef] px-3 py-3">
                      <span className="text-muted-foreground">Household</span>
                      <span className="text-right font-semibold text-emerald-950">
                        {households.find((household) => household.id === member.household_id)?.household_name ?? "None"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3 rounded-2xl bg-[#fbf7ef] px-3 py-3">
                      <span className="text-muted-foreground">Role</span>
                      <span className="text-right font-semibold capitalize text-emerald-950">
                        {member.household_role ?? "None"}
                      </span>
                    </div>
                  </div>
                </Panel>
              </div>
            ) : null}

            {activeTab === "departments" ? (
              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
                <Panel title="Department assignments" icon={UsersRound}>
                  <ActionNotice state={removeDepartmentState} />
                  <div className="mt-4 flex flex-col gap-3">
                    {departmentAssignments.length ? (
                      departmentAssignments.map((assignment) => (
                        <div
                          key={assignment.id}
                          className="flex flex-col gap-3 rounded-2xl border border-emerald-950/10 bg-[#fbf7ef] p-3 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-semibold text-emerald-950">{assignment.department_name ?? "Department"}</p>
                              <Badge className={assignment.is_active ? "bg-emerald-900" : ""} variant={assignment.is_active ? "default" : "secondary"}>
                                {assignment.is_active ? "Active" : "Inactive"}
                              </Badge>
                            </div>
                            <p className="mt-1 text-sm text-muted-foreground">
                              {assignment.role_title || "No role title"}{assignment.start_date ? ` · Since ${assignment.start_date}` : ""}
                            </p>
                          </div>
                          {assignment.is_active ? (
                            <form action={removeDepartmentAction}>
                              <input type="hidden" name="churchSlug" value={churchSlug} />
                              <input type="hidden" name="assignmentId" value={assignment.id} />
                              <Button type="submit" variant="outline" disabled={removeDepartmentPending} className="h-10 gap-2 rounded-xl bg-white text-red-700 hover:text-red-800">
                                <Trash2 className="size-4" aria-hidden="true" />
                                Remove
                              </Button>
                            </form>
                          ) : null}
                        </div>
                      ))
                    ) : (
                      <div className="rounded-2xl border border-dashed border-emerald-950/15 bg-[#fbf7ef] px-4 py-8 text-center text-sm text-muted-foreground">
                        No department assignments yet.
                      </div>
                    )}
                  </div>
                </Panel>

                <Panel title="Add assignment" icon={Plus}>
                  <form action={departmentAction} className="flex flex-col gap-4">
                    <input type="hidden" name="churchSlug" value={churchSlug} />
                    <input type="hidden" name="member_id" value={member.id} />
                    <input type="hidden" name="is_active" value="true" />
                    <ActionNotice state={departmentState} />
                    <NativeSelect id="editor-department-id" name="department_id" label="Department">
                      <option value="">Select department</option>
                      {departments.map((department) => (
                        <option key={department.id} value={department.id} disabled={!department.is_active}>
                          {department.name}{department.code ? ` (${department.code})` : ""}{department.is_active ? "" : " - inactive"}
                        </option>
                      ))}
                    </NativeSelect>
                    <TextInput id="editor-department-role" name="role_title" label="Role title" />
                    <TextInput id="editor-department-start" name="start_date" label="Start date" type="date" />
                    <Button type="submit" disabled={departmentPending} className="h-11 rounded-xl bg-emerald-900 text-white hover:bg-emerald-800">
                      {departmentPending ? (
                        <span className="inline-flex items-center gap-2"><ButtonSpinner /> Adding</span>
                      ) : "Add department"}
                    </Button>
                  </form>
                </Panel>
              </div>
            ) : null}

            {activeTab === "leadership" ? (
              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
                <Panel title="Leadership roles" icon={ShieldCheck}>
                  <ActionNotice state={leadershipState} />
                  <div className="mt-4 flex flex-col gap-3">
                    {leadership.profileId ? (
                      leadership.assignments.length ? (
                        leadership.assignments.map((assignment) => (
                          <div
                            key={assignment.id}
                            className="flex flex-col gap-3 rounded-2xl border border-emerald-950/10 bg-[#fbf7ef] p-3 sm:flex-row sm:items-center sm:justify-between"
                          >
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="font-semibold text-emerald-950">{assignment.roleName}</p>
                                <Badge className={assignment.isActive ? "bg-emerald-900" : ""} variant={assignment.isActive ? "default" : "secondary"}>
                                  {assignment.isActive ? "Active" : "Inactive"}
                                </Badge>
                              </div>
                              <p className="mt-1 text-sm text-muted-foreground">
                                {assignment.roleDescription ?? assignment.roleCode}
                                {assignment.endDate ? ` · Ended ${assignment.endDate}` : ""}
                              </p>
                              {assignment.notes ? <p className="mt-2 text-sm text-emerald-950/75">{assignment.notes}</p> : null}
                            </div>
                            {assignment.isActive ? (
                              <Button
                                type="button"
                                variant="outline"
                                disabled={leadershipPending}
                                onClick={() => revokeLeadershipRole(assignment.id)}
                                className="h-10 gap-2 rounded-xl bg-white text-red-700 hover:text-red-800"
                              >
                                <Trash2 className="size-4" aria-hidden="true" />
                                Revoke
                              </Button>
                            ) : null}
                          </div>
                        ))
                      ) : (
                        <div className="rounded-2xl border border-dashed border-emerald-950/15 bg-[#fbf7ef] px-4 py-8 text-center text-sm text-muted-foreground">
                          No leadership roles are linked to this member.
                        </div>
                      )
                    ) : (
                      <div className="rounded-2xl border border-dashed border-emerald-950/15 bg-[#fbf7ef] px-4 py-8 text-center text-sm text-muted-foreground">
                        This member does not have a linked portal profile yet.
                      </div>
                    )}
                  </div>
                </Panel>

                <Panel title="Assign role" icon={Plus}>
                  {leadership.profileId ? (
                    <div className="flex flex-col gap-4">
                      <Field id="editor-leadership-role" label="Role">
                        <select
                          id="editor-leadership-role"
                          value={selectedRoleId}
                          onChange={(event) => setSelectedRoleId(event.target.value)}
                          className={selectClass}
                        >
                          <option value="">Select role</option>
                          {availableRoles.map((role) => (
                            <option key={role.id} value={role.id}>
                              {role.name}
                            </option>
                          ))}
                        </select>
                      </Field>
                      <Button
                        type="button"
                        disabled={!selectedRoleId || leadershipPending}
                        onClick={assignLeadershipRole}
                        className="h-11 rounded-xl bg-emerald-900 text-white hover:bg-emerald-800"
                      >
                        {leadershipPending ? (
                          <span className="inline-flex items-center gap-2"><ButtonSpinner /> Updating</span>
                        ) : "Assign role"}
                      </Button>
                      <Button asChild variant="outline" className="h-11 rounded-xl bg-white">
                        <Link href={`/c/${churchSlug}/access-control`}>Open access control</Link>
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      <p className="text-sm text-muted-foreground">
                        Leadership roles attach to the member portal profile. Once the member is linked, role assignment becomes available here.
                      </p>
                      <Button asChild variant="outline" className="h-11 rounded-xl bg-white">
                        <Link href={`/c/${churchSlug}/access-control`}>Open access control</Link>
                      </Button>
                    </div>
                  )}
                </Panel>
              </div>
            ) : null}

            {activeTab === "status" ? (
              <div className="grid gap-4 lg:grid-cols-2">
                <Panel title="Status change" icon={UserRoundCheck}>
                  <form action={statusAction} className="flex flex-col gap-4">
                    <input type="hidden" name="churchSlug" value={churchSlug} />
                    <input type="hidden" name="memberId" value={member.id} />
                    <ActionNotice state={statusState} />
                    <NativeSelect id="editor-new-status" name="newStatus" label="New status" defaultValue={member.membership_status ?? "active"}>
                      {membershipStatuses.map((status) => (
                        <option key={status.value} value={status.value}>{status.label}</option>
                      ))}
                    </NativeSelect>
                    <Field id="editor-status-reason" label="Reason">
                      <Textarea id="editor-status-reason" name="reason" rows={4} className="rounded-xl border-emerald-950/10 bg-white focus-visible:ring-emerald-700" />
                    </Field>
                    <Button type="submit" disabled={statusPending} className="h-11 rounded-xl bg-emerald-900 text-white hover:bg-emerald-800">
                      {statusPending ? (
                        <span className="inline-flex items-center gap-2"><ButtonSpinner /> Updating</span>
                      ) : "Update status"}
                    </Button>
                  </form>
                </Panel>

                <Panel title="Transfer" icon={CalendarDays}>
                  <form action={transferAction} className="flex flex-col gap-4">
                    <input type="hidden" name="churchSlug" value={churchSlug} />
                    <input type="hidden" name="memberId" value={member.id} />
                    <ActionNotice state={transferState} />
                    <NativeSelect id="editor-transfer-type" name="transferType" label="Transfer type">
                      <option value="in">Transfer in</option>
                      <option value="out">Transfer out</option>
                    </NativeSelect>
                    <TextInput id="editor-transfer-date" name="transferDate" label="Transfer date" type="date" />
                    <TextInput id="editor-transfer-church" name="previousChurch" label="Related church" defaultValue={member.previous_church} />
                    <Field id="editor-transfer-reason" label="Reason">
                      <Textarea id="editor-transfer-reason" name="reason" rows={4} className="rounded-xl border-emerald-950/10 bg-white focus-visible:ring-emerald-700" />
                    </Field>
                    <Button type="submit" disabled={transferPending} className="h-11 rounded-xl bg-emerald-900 text-white hover:bg-emerald-800">
                      {transferPending ? (
                        <span className="inline-flex items-center gap-2"><ButtonSpinner /> Processing</span>
                      ) : "Process transfer"}
                    </Button>
                  </form>
                </Panel>
              </div>
            ) : null}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
