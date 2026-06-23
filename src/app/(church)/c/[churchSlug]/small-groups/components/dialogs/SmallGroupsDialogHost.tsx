"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, CalendarDays, FileBarChart, NotebookPen, UserRoundCog } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { StepIndicator } from "@/components/ui/StepIndicator";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils/cn";
import type {
  PersonSummary,
  SmallGroupsDialog,
  SmallGroupsWorkspaceData,
} from "../types";
import { PersonAvatar, formatDate } from "../shared";

type DialogSize = "compact" | "standard" | "large";

function BackendNotice({ operations }: { operations?: string[] }) {
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
      <p className="font-medium">Backend not connected yet.</p>
      <p className="mt-1 leading-5">
        The Small Groups tables and server actions are not present in this repository, so this form is
        intentionally read-only for persistence.
      </p>
      {operations?.length ? (
        <p className="mt-1 text-xs">Missing: {operations.join(", ")}</p>
      ) : null}
    </div>
  );
}

function GuardedDialog({
  open,
  onClose,
  dirty,
  onDiscard,
  title,
  description,
  size = "standard",
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  dirty: boolean;
  onDiscard: () => void;
  title: string;
  description: string;
  size?: DialogSize;
  children: React.ReactNode;
  footer: (requestClose: () => void) => React.ReactNode;
}) {
  const [confirmDiscardOpen, setConfirmDiscardOpen] = useState(false);
  const sizeClass = {
    compact: "max-w-[600px]",
    standard: "max-w-[760px]",
    large: "max-w-[920px]",
  }[size];

  function requestClose() {
    if (dirty) {
      setConfirmDiscardOpen(true);
      return;
    }
    onClose();
  }

  function discard() {
    onDiscard();
    setConfirmDiscardOpen(false);
    onClose();
  }

  return (
    <>
      <Dialog open={open} onOpenChange={(nextOpen) => (!nextOpen ? requestClose() : undefined)}>
        <DialogContent
          className={cn(
            "flex max-h-[88vh] w-[calc(100%-2rem)] flex-col gap-0 overflow-hidden p-0 sm:rounded-2xl",
            sizeClass
          )}
        >
          <div className="shrink-0 px-6 py-5">
            <DialogHeader className="gap-2">
              <DialogTitle>{title}</DialogTitle>
              <DialogDescription>{description}</DialogDescription>
            </DialogHeader>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">{children}</div>
          <div className="flex shrink-0 justify-end gap-2 border-t border-border px-6 py-4">
            {footer(requestClose)}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmDiscardOpen} onOpenChange={setConfirmDiscardOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard changes?</AlertDialogTitle>
            <AlertDialogDescription>
              This form has unsaved local changes. Because no Small Groups backend exists yet,
              discarding will reset the fields in this dialog.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continue Editing</AlertDialogCancel>
            <AlertDialogAction onClick={discard} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Discard Changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function Field({
  id,
  label,
  children,
}: {
  id: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  );
}

function PersonSelect({
  value,
  onValueChange,
  people,
  placeholder,
}: {
  value: string;
  onValueChange: (value: string) => void;
  people: PersonSummary[];
  placeholder: string;
}) {
  return (
    <Select value={value || "__none"} onValueChange={(next) => onValueChange(next === "__none" ? "" : next)}>
      <SelectTrigger className="h-10 rounded-lg">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="__none">{placeholder}</SelectItem>
        {people.map((person) => (
          <SelectItem key={person.id} value={person.id}>
            {person.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function GroupSelect({
  value,
  onValueChange,
  data,
}: {
  value: string;
  onValueChange: (value: string) => void;
  data: SmallGroupsWorkspaceData;
}) {
  return (
    <Select value={value || "__none"} onValueChange={(next) => onValueChange(next === "__none" ? "" : next)}>
      <SelectTrigger className="h-10 rounded-lg">
        <SelectValue placeholder="Select group" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="__none">Select group</SelectItem>
        {data.groups.map((group) => (
          <SelectItem key={group.id} value={group.id}>
            {group.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function CreateGroupWizardDialog({
  open,
  onClose,
  data,
}: {
  open: boolean;
  onClose: () => void;
  data: SmallGroupsWorkspaceData;
}) {
  const [step, setStep] = useState(1);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [values, setValues] = useState({
    name: "",
    type: "Bible Study",
    status: "active",
    neighborhood: "",
    description: "",
    leaderId: "",
    assistantLeaderId: "",
    meetingDay: "Friday",
    startTime: "18:00",
    endTime: "20:00",
    frequency: "Weekly",
    location: "",
    address: "",
    memberSearch: "",
    selectedMembers: [] as string[],
  });

  function updateValue<Key extends keyof typeof values>(key: Key, value: (typeof values)[Key]) {
    setValues((current) => ({ ...current, [key]: value }));
    setDirty(true);
    setError(null);
  }

  function reset() {
    setStep(1);
    setDirty(false);
    setError(null);
    setValues({
      name: "",
      type: "Bible Study",
      status: "active",
      neighborhood: "",
      description: "",
      leaderId: "",
      assistantLeaderId: "",
      meetingDay: "Friday",
      startTime: "18:00",
      endTime: "20:00",
      frequency: "Weekly",
      location: "",
      address: "",
      memberSearch: "",
      selectedMembers: [],
    });
  }

  function nextStep() {
    if (step === 1 && !values.name.trim()) {
      setError("Group name is required before continuing.");
      document.getElementById("create-group-name")?.focus();
      return;
    }
    if (step === 2 && !values.leaderId) {
      setError("Primary leader is required before continuing.");
      return;
    }
    setStep((current) => Math.min(5, current + 1));
    setError(null);
  }

  const selectedMemberSet = new Set(values.selectedMembers);
  const memberOptions = data.people.filter((person) =>
    values.memberSearch
      ? person.name.toLowerCase().includes(values.memberSearch.toLowerCase())
      : true
  );

  return (
    <GuardedDialog
      open={open}
      onClose={onClose}
      dirty={dirty}
      onDiscard={reset}
      title="Create small group"
      description="Set up details, leadership, meeting rhythm, and initial members."
      size="large"
      footer={(requestClose) => (
        <>
          <Button type="button" variant="outline" className="h-10 rounded-lg" onClick={requestClose}>
            Cancel
          </Button>
          {step > 1 ? (
            <Button type="button" variant="outline" className="h-10 rounded-lg" onClick={() => setStep((current) => current - 1)}>
              Back
            </Button>
          ) : null}
          {step < 5 ? (
            <Button type="button" className="h-10 rounded-lg" onClick={nextStep}>
              Next
            </Button>
          ) : (
            <Button type="button" className="h-10 rounded-lg" disabled>
              Create Group
            </Button>
          )}
        </>
      )}
    >
      <div className="space-y-5">
        <StepIndicator
          steps={["Group Details", "Leadership", "Meeting Setup", "Initial Members", "Review"]}
          currentStep={step}
        />
        <BackendNotice operations={["createSmallGroup", "assignMemberToGroup"]} />
        {error ? (
          <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        {step === 1 ? (
          <div className="grid gap-4 md:grid-cols-2">
            <Field id="create-group-name" label="Group Name">
              <Input id="create-group-name" value={values.name} onChange={(event) => updateValue("name", event.target.value)} className="h-10 rounded-lg" />
            </Field>
            <Field id="create-group-type" label="Group Type">
              <Input id="create-group-type" value={values.type} onChange={(event) => updateValue("type", event.target.value)} className="h-10 rounded-lg" />
            </Field>
            <Field id="create-group-status" label="Status">
              <Input id="create-group-status" value={values.status} onChange={(event) => updateValue("status", event.target.value)} className="h-10 rounded-lg" />
            </Field>
            <Field id="create-group-neighborhood" label="Neighborhood">
              <Input id="create-group-neighborhood" value={values.neighborhood} onChange={(event) => updateValue("neighborhood", event.target.value)} className="h-10 rounded-lg" />
            </Field>
            <Field id="create-group-description" label="Description">
              <Textarea id="create-group-description" value={values.description} onChange={(event) => updateValue("description", event.target.value)} className="rounded-lg md:col-span-2" />
            </Field>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="grid gap-4 md:grid-cols-2">
            <Field id="create-group-leader" label="Primary Leader">
              <PersonSelect value={values.leaderId} onValueChange={(leaderId) => updateValue("leaderId", leaderId)} people={data.people} placeholder="Select primary leader" />
            </Field>
            <Field id="create-group-assistant" label="Assistant Leader">
              <PersonSelect value={values.assistantLeaderId} onValueChange={(assistantLeaderId) => updateValue("assistantLeaderId", assistantLeaderId)} people={data.people} placeholder="Select assistant leader" />
            </Field>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="grid gap-4 md:grid-cols-2">
            <Field id="create-group-day" label="Meeting Day">
              <Input id="create-group-day" value={values.meetingDay} onChange={(event) => updateValue("meetingDay", event.target.value)} className="h-10 rounded-lg" />
            </Field>
            <Field id="create-group-frequency" label="Frequency">
              <Input id="create-group-frequency" value={values.frequency} onChange={(event) => updateValue("frequency", event.target.value)} className="h-10 rounded-lg" />
            </Field>
            <Field id="create-group-start" label="Start Time">
              <Input id="create-group-start" type="time" value={values.startTime} onChange={(event) => updateValue("startTime", event.target.value)} className="h-10 rounded-lg" />
            </Field>
            <Field id="create-group-end" label="End Time">
              <Input id="create-group-end" type="time" value={values.endTime} onChange={(event) => updateValue("endTime", event.target.value)} className="h-10 rounded-lg" />
            </Field>
            <Field id="create-group-location" label="Meeting Location">
              <Input id="create-group-location" value={values.location} onChange={(event) => updateValue("location", event.target.value)} className="h-10 rounded-lg" />
            </Field>
            <Field id="create-group-address" label="Full Address">
              <Input id="create-group-address" value={values.address} onChange={(event) => updateValue("address", event.target.value)} className="h-10 rounded-lg" />
            </Field>
          </div>
        ) : null}

        {step === 4 ? (
          <div className="space-y-4">
            <Input
              value={values.memberSearch}
              onChange={(event) => updateValue("memberSearch", event.target.value)}
              placeholder="Search members..."
              className="h-10 rounded-lg"
            />
            <div className="rounded-lg border border-border">
              <div className="flex items-center justify-between border-b border-border px-4 py-3 text-sm">
                <span className="font-medium text-foreground">{values.selectedMembers.length} selected</span>
                <Button type="button" variant="link" className="h-auto p-0 text-xs" onClick={() => updateValue("selectedMembers", [])}>
                  Clear selected members
                </Button>
              </div>
              <div className="max-h-64 overflow-y-auto p-2">
                {memberOptions.map((person) => (
                  <label key={person.id} className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 hover:bg-muted/50">
                    <input
                      type="checkbox"
                      checked={selectedMemberSet.has(person.id)}
                      onChange={(event) => {
                        const next = event.target.checked
                          ? [...values.selectedMembers, person.id]
                          : values.selectedMembers.filter((id) => id !== person.id);
                        updateValue("selectedMembers", next);
                      }}
                      className="size-4 rounded border-border accent-primary"
                    />
                    <PersonAvatar person={person} />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-foreground">{person.name}</span>
                      <span className="block truncate text-xs text-muted-foreground">{person.email ?? person.memberCode ?? "No contact"}</span>
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        ) : null}

        {step === 5 ? (
          <div className="grid gap-4 md:grid-cols-2">
            <ReviewBlock title="Group Details" lines={[values.name || "Unnamed group", values.type, values.status, values.neighborhood || "No neighborhood"]} />
            <ReviewBlock title="Leadership" lines={[data.people.find((person) => person.id === values.leaderId)?.name ?? "No leader", data.people.find((person) => person.id === values.assistantLeaderId)?.name ?? "No assistant"]} />
            <ReviewBlock title="Schedule" lines={[`${values.meetingDay} ${values.startTime}-${values.endTime}`, values.frequency, values.location || "No location"]} />
            <ReviewBlock title="Initial Members" lines={[`${values.selectedMembers.length} selected members`]} />
          </div>
        ) : null}
      </div>
    </GuardedDialog>
  );
}

function ReviewBlock({ title, lines }: { title: string; lines: string[] }) {
  return (
    <div className="rounded-lg border border-border p-4">
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <div className="mt-3 space-y-1 text-sm text-muted-foreground">
        {lines.map((line) => (
          <p key={line}>{line}</p>
        ))}
      </div>
    </div>
  );
}

function SimpleFormDialog({
  open,
  onClose,
  title,
  description,
  size,
  operations,
  icon,
  children,
  submitLabel,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description: string;
  size?: DialogSize;
  operations: string[];
  icon?: React.ReactNode;
  children: (markDirty: () => void) => React.ReactNode;
  submitLabel: string;
}) {
  const [dirty, setDirty] = useState(false);

  return (
    <GuardedDialog
      open={open}
      onClose={onClose}
      dirty={dirty}
      onDiscard={() => setDirty(false)}
      title={title}
      description={description}
      size={size}
      footer={(requestClose) => (
        <>
          <Button type="button" variant="outline" className="h-10 rounded-lg" onClick={requestClose}>
            Cancel
          </Button>
          <Button type="button" className="h-10 gap-2 rounded-lg" disabled>
            {icon}
            {submitLabel}
          </Button>
        </>
      )}
    >
      <div className="space-y-5">
        <BackendNotice operations={operations} />
        {children(() => setDirty(true))}
      </div>
    </GuardedDialog>
  );
}

export function SmallGroupsDialogHost({
  activeDialog,
  onDialogChange,
  data,
  selectedGroupId,
  selectedMeetingId,
  selectedMemberId,
}: {
  activeDialog: SmallGroupsDialog;
  onDialogChange: (dialog: SmallGroupsDialog) => void;
  data: SmallGroupsWorkspaceData;
  selectedGroupId: string | null;
  selectedMeetingId: string | null;
  selectedMemberId: string | null;
  selectedOutreachId: string | null;
}) {
  const activeGroupId =
    activeDialog && "groupId" in activeDialog ? activeDialog.groupId ?? selectedGroupId : selectedGroupId;
  const activeGroup = data.groups.find((group) => group.id === activeGroupId) ?? data.groups[0] ?? null;
  const activeMeetingId =
    activeDialog?.type === "record-attendance" ? activeDialog.meetingId : selectedMeetingId;
  const activeMeeting = data.meetings.find((meeting) => meeting.id === activeMeetingId) ?? data.meetings[0] ?? null;
  const activeAssignment = data.groupMembers.find((member) => member.assignmentId === selectedMemberId) ?? null;
  const groupMembers = useMemo(
    () => data.groupMembers.filter((member) => member.groupId === (activeMeeting?.groupId ?? activeGroup?.id)),
    [activeGroup?.id, activeMeeting?.groupId, data.groupMembers]
  );

  function close() {
    onDialogChange(null);
  }

  return (
    <>
      <CreateGroupWizardDialog
        open={activeDialog?.type === "create-group"}
        onClose={close}
        data={data}
      />

      <SimpleFormDialog
        open={activeDialog?.type === "edit-group"}
        onClose={close}
        title={`Edit ${activeGroup?.name ?? "group"}`}
        description="Update group details, leadership, meeting setup, and description."
        operations={["updateSmallGroup"]}
        submitLabel="Save changes"
      >
        {(markDirty) => (
          <div className="grid gap-4 md:grid-cols-2">
            <Field id="edit-group-name" label="Group Name">
              <Input id="edit-group-name" defaultValue={activeGroup?.name ?? ""} onChange={markDirty} className="h-10 rounded-lg" />
            </Field>
            <Field id="edit-group-status" label="Status">
              <Input id="edit-group-status" defaultValue={activeGroup?.status ?? ""} onChange={markDirty} className="h-10 rounded-lg" />
            </Field>
            <Field id="edit-group-leader" label="Primary Leader">
              <PersonSelect value={activeGroup?.leader?.id ?? ""} onValueChange={markDirty} people={data.people} placeholder="Select leader" />
            </Field>
            <Field id="edit-group-assistant" label="Assistant Leader">
              <PersonSelect value={activeGroup?.assistantLeader?.id ?? ""} onValueChange={markDirty} people={data.people} placeholder="Select assistant" />
            </Field>
            <Field id="edit-group-location" label="Location">
              <Input id="edit-group-location" defaultValue={activeGroup?.location ?? ""} onChange={markDirty} className="h-10 rounded-lg" />
            </Field>
            <Field id="edit-group-schedule" label="Meeting Schedule">
              <Input id="edit-group-schedule" defaultValue={`${activeGroup?.meetingDayLabel ?? ""} ${activeGroup?.meetingTimeLabel ?? ""}`} onChange={markDirty} className="h-10 rounded-lg" />
            </Field>
            <div className="md:col-span-2">
              <Field id="edit-group-description" label="Description">
                <Textarea id="edit-group-description" defaultValue={activeGroup?.description ?? ""} onChange={markDirty} className="rounded-lg" />
              </Field>
            </div>
          </div>
        )}
      </SimpleFormDialog>

      <SimpleFormDialog
        open={activeDialog?.type === "add-member"}
        onClose={close}
        title="Add member to group"
        description="Assign an existing church member into a small group."
        operations={["assignMemberToGroup"]}
        submitLabel="Add Member"
      >
        {(markDirty) => (
          <div className="grid gap-4 md:grid-cols-2">
            <Field id="add-member-group" label="Group">
              <GroupSelect value={activeGroup?.id ?? ""} onValueChange={markDirty} data={data} />
            </Field>
            <Field id="add-member-person" label="Member">
              <PersonSelect value="" onValueChange={markDirty} people={data.people} placeholder="Select member" />
            </Field>
            <Field id="add-member-role" label="Role">
              <Input id="add-member-role" defaultValue="Member" onChange={markDirty} className="h-10 rounded-lg" />
            </Field>
            <Field id="add-member-joined" label="Joined Date">
              <Input id="add-member-joined" type="date" onChange={markDirty} className="h-10 rounded-lg" />
            </Field>
            <div className="md:col-span-2">
              <Field id="add-member-notes" label="Notes">
                <Textarea id="add-member-notes" onChange={markDirty} className="rounded-lg" />
              </Field>
            </div>
          </div>
        )}
      </SimpleFormDialog>

      <SimpleFormDialog
        open={activeDialog?.type === "schedule-meeting"}
        onClose={close}
        title="Schedule meeting"
        description="Plan a small group meeting without leaving the workspace."
        operations={["scheduleGroupMeeting"]}
        submitLabel="Schedule Meeting"
        icon={<CalendarDays className="size-4" aria-hidden="true" />}
      >
        {(markDirty) => (
          <div className="grid gap-4 md:grid-cols-2">
            <Field id="schedule-group" label="Group">
              <GroupSelect value={activeGroup?.id ?? ""} onValueChange={markDirty} data={data} />
            </Field>
            <Field id="schedule-date" label="Date">
              <Input id="schedule-date" type="date" onChange={markDirty} className="h-10 rounded-lg" />
            </Field>
            <Field id="schedule-start" label="Start Time">
              <Input id="schedule-start" type="time" onChange={markDirty} className="h-10 rounded-lg" />
            </Field>
            <Field id="schedule-end" label="End Time">
              <Input id="schedule-end" type="time" onChange={markDirty} className="h-10 rounded-lg" />
            </Field>
            <Field id="schedule-topic" label="Topic / Focus">
              <Input id="schedule-topic" onChange={markDirty} className="h-10 rounded-lg" />
            </Field>
            <Field id="schedule-type" label="Meeting Type">
              <Input id="schedule-type" defaultValue="Bible Study" onChange={markDirty} className="h-10 rounded-lg" />
            </Field>
            <Field id="schedule-location" label="Location">
              <Input id="schedule-location" defaultValue={activeGroup?.location ?? ""} onChange={markDirty} className="h-10 rounded-lg" />
            </Field>
            <Field id="schedule-conductor" label="Conductor">
              <PersonSelect value={activeGroup?.leader?.id ?? ""} onValueChange={markDirty} people={data.people} placeholder="Select conductor" />
            </Field>
            <div className="md:col-span-2">
              <Field id="schedule-notes" label="Notes">
                <Textarea id="schedule-notes" onChange={markDirty} className="rounded-lg" />
              </Field>
            </div>
          </div>
        )}
      </SimpleFormDialog>

      <SimpleFormDialog
        open={activeDialog?.type === "record-attendance"}
        onClose={close}
        title="Record Attendance"
        description={`${activeMeeting?.groupName ?? "Group"} - ${activeMeeting ? formatDate(activeMeeting.startsAt) : "Meeting"} - ${activeMeeting?.topic ?? ""}`}
        size="large"
        operations={["recordAttendance"]}
        submitLabel="Save Attendance"
      >
        {(markDirty) => (
          <div className="space-y-4">
            <div className="grid gap-3 rounded-lg border border-border p-4 sm:grid-cols-2">
              <div>
                <p className="text-2xl font-semibold text-foreground">{activeMeeting?.expectedAttendance ?? 0}</p>
                <p className="text-sm text-muted-foreground">expected</p>
              </div>
              <div>
                <p className="text-2xl font-semibold text-foreground">{activeMeeting?.recordedAttendance ?? 0}</p>
                <p className="text-sm text-muted-foreground">recorded</p>
              </div>
            </div>
            <div className="rounded-lg border border-border">
              <div className="grid grid-cols-[minmax(0,1fr)_170px_minmax(180px,1fr)] gap-3 border-b border-border px-4 py-3 text-xs font-medium text-muted-foreground">
                <span>Member</span>
                <span>Status</span>
                <span>Note</span>
              </div>
              {groupMembers.map((assignment) => (
                <div key={assignment.assignmentId} className="grid grid-cols-[minmax(0,1fr)_170px_minmax(180px,1fr)] items-center gap-3 border-b border-border/70 px-4 py-3 last:border-b-0">
                  <div className="flex min-w-0 items-center gap-3">
                    <PersonAvatar person={assignment.member} />
                    <span className="truncate text-sm font-medium text-foreground">{assignment.member.name}</span>
                  </div>
                  <Select defaultValue="present" onValueChange={markDirty}>
                    <SelectTrigger className="h-9 rounded-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="present">Present</SelectItem>
                      <SelectItem value="absent">Absent</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input placeholder="Optional note" onChange={markDirty} className="h-9 rounded-lg" />
                </div>
              ))}
            </div>
          </div>
        )}
      </SimpleFormDialog>

      <SimpleFormDialog
        open={activeDialog?.type === "create-outreach"}
        onClose={close}
        title="New outreach activity"
        description="Record an outreach activity for a selected group."
        operations={["createOutreach"]}
        submitLabel="Create Outreach Activity"
      >
        {(markDirty) => (
          <div className="grid gap-4 md:grid-cols-2">
            <Field id="outreach-title" label="Activity Name">
              <Input id="outreach-title" onChange={markDirty} className="h-10 rounded-lg" />
            </Field>
            <Field id="outreach-group" label="Group">
              <GroupSelect value={activeGroup?.id ?? ""} onValueChange={markDirty} data={data} />
            </Field>
            <Field id="outreach-type" label="Activity Type">
              <Input id="outreach-type" defaultValue="Service" onChange={markDirty} className="h-10 rounded-lg" />
            </Field>
            <Field id="outreach-date" label="Activity Date">
              <Input id="outreach-date" type="date" onChange={markDirty} className="h-10 rounded-lg" />
            </Field>
            <Field id="outreach-location" label="Location">
              <Input id="outreach-location" onChange={markDirty} className="h-10 rounded-lg" />
            </Field>
            <Field id="outreach-responsible" label="Responsible Person">
              <PersonSelect value="" onValueChange={markDirty} people={data.people} placeholder="Select person" />
            </Field>
            <Field id="outreach-reached" label="People Reached">
              <Input id="outreach-reached" type="number" min={0} onChange={markDirty} className="h-10 rounded-lg" />
            </Field>
            <Field id="outreach-status" label="Status">
              <Input id="outreach-status" defaultValue="planned" onChange={markDirty} className="h-10 rounded-lg" />
            </Field>
            <div className="md:col-span-2">
              <Field id="outreach-notes" label="Notes">
                <Textarea id="outreach-notes" onChange={markDirty} className="rounded-lg" />
              </Field>
            </div>
          </div>
        )}
      </SimpleFormDialog>

      <SimpleFormDialog
        open={activeDialog?.type === "generate-report"}
        onClose={close}
        title="Generate report"
        description="Choose the report scope and format."
        size="compact"
        operations={["generateSmallGroupsReport"]}
        submitLabel="Generate Report"
        icon={<FileBarChart className="size-4" aria-hidden="true" />}
      >
        {(markDirty) => (
          <div className="grid gap-4">
            <Field id="report-type" label="Report Type">
              <Input id="report-type" defaultValue={activeDialog?.type === "generate-report" ? activeDialog.reportKind ?? "attendance" : "attendance"} onChange={markDirty} className="h-10 rounded-lg" />
            </Field>
            <Field id="report-group" label="Group Scope">
              <GroupSelect value={activeGroup?.id ?? ""} onValueChange={markDirty} data={data} />
            </Field>
            <Field id="report-range" label="Date Range">
              <Input id="report-range" defaultValue="Last 30 Days" onChange={markDirty} className="h-10 rounded-lg" />
            </Field>
            <Field id="report-format" label="Format">
              <Input id="report-format" defaultValue="PDF" onChange={markDirty} className="h-10 rounded-lg" />
            </Field>
          </div>
        )}
      </SimpleFormDialog>

      <SimpleFormDialog
        open={activeDialog?.type === "notes"}
        onClose={close}
        title="Group Notes"
        description={`Last updated information for ${activeGroup?.name ?? "this group"}.`}
        size="compact"
        operations={["saveSmallGroupNotes"]}
        submitLabel="Save Notes"
        icon={<NotebookPen className="size-4" aria-hidden="true" />}
      >
        {(markDirty) => (
          <Field id="group-notes" label="Notes">
            <Textarea id="group-notes" defaultValue={activeGroup?.description ?? ""} onChange={markDirty} rows={7} className="rounded-lg" />
          </Field>
        )}
      </SimpleFormDialog>

      <SimpleFormDialog
        open={activeDialog?.type === "change-leader"}
        onClose={close}
        title="Change group leader"
        description={`Select a new leader for ${activeGroup?.name ?? "this group"}.`}
        size="compact"
        operations={["changeSmallGroupLeader"]}
        submitLabel="Change Leader"
        icon={<UserRoundCog className="size-4" aria-hidden="true" />}
      >
        {(markDirty) => (
          <div className="grid gap-4">
            <Field id="change-leader-current" label="Current Leader">
              <Input id="change-leader-current" value={activeGroup?.leader?.name ?? "Unassigned"} readOnly className="h-10 rounded-lg" />
            </Field>
            <Field id="change-leader-next" label="New Leader">
              <PersonSelect value="" onValueChange={markDirty} people={data.people} placeholder="Select new leader" />
            </Field>
          </div>
        )}
      </SimpleFormDialog>

      <AlertDialog open={activeDialog?.type === "archive-group"} onOpenChange={(open) => (!open ? close() : undefined)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive {activeGroup?.name ?? "this group"}?</AlertDialogTitle>
            <AlertDialogDescription>
              The group will be removed from active views. Historical meetings and attendance should
              remain available. The archive action is disabled until a real server action exists.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            <div className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <span>Missing backend operation: archiveSmallGroup</span>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction disabled className="bg-destructive text-destructive-foreground">
              Archive Group
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="sr-only" aria-live="polite">
        {activeAssignment ? `${activeAssignment.member.name} selected` : null}
      </div>
    </>
  );
}
