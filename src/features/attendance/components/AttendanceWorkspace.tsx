"use client";

import { useActionState, useMemo, useState, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import {
  CalendarCheck,
  CheckCircle2,
  ClipboardList,
  Copy,
  MonitorCheck,
  QrCode,
  RefreshCw,
  Search,
  Settings,
  ShieldCheck,
  UserCheck,
  UserPlus,
  Users,
} from "lucide-react";
import { WorkspaceTabs } from "@/components/workspace";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils/cn";
import { AttendanceQrExportActions } from "./AttendanceQrExportActions";
import { AttendanceQrPoster, type AttendanceQrPosterProps } from "./AttendanceQrPoster";
import {
  createUniversalSabbathQrAction,
  markKioskAttendanceAction,
  regenerateUniversalSabbathQrAction,
  resolveAttendanceReviewItemAction,
} from "../actions";
import {
  ATTENDANCE_METHOD_LABELS,
  ATTENDANCE_REVIEW_TYPE_LABELS,
  ATTENDANCE_STATUS_LABELS,
} from "../constants";
import type {
  AttendanceActionState,
  AttendanceMemberOption,
  AttendanceRecordRow,
  AttendanceWorkspaceData,
  VisitorContactRow,
} from "../types";

const tabs = [
  { key: "overview", label: "Overview" },
  { key: "sabbath", label: "Sabbath" },
  { key: "kiosk", label: "Kiosk" },
  { key: "visitors", label: "Visitors" },
  { key: "review", label: "Review" },
  { key: "reports", label: "Reports" },
  { key: "settings", label: "Settings" },
];

const initialActionState: AttendanceActionState = { ok: false };

function formatTime(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value ?? "—";

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function ActionMessage({ state }: { state: AttendanceActionState }) {
  if (!state.message && !state.error) return null;

  return (
    <p
      className={cn(
        "rounded-lg border px-3 py-2 text-sm",
        state.ok ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-red-200 bg-red-50 text-red-800"
      )}
    >
      {state.message || state.error}
    </p>
  );
}

function SubmitButton({
  children,
  icon,
  variant = "default",
  size = "default",
  disabled = false,
}: {
  children: ReactNode;
  icon?: ReactNode;
  variant?: "default" | "outline" | "secondary" | "ghost" | "destructive";
  size?: "default" | "sm";
  disabled?: boolean;
}) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" variant={variant} size={size} disabled={pending || disabled} className="gap-2">
      {pending ? <RefreshCw className="size-4 animate-spin" aria-hidden="true" /> : icon}
      {children}
    </Button>
  );
}

function StatTile({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | number;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
        <div className="rounded-lg bg-slate-100 p-2 text-slate-700">{icon}</div>
      </div>
      <p className="mt-3 text-2xl font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function CopyableLink({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <div className="flex min-w-0 flex-col gap-2 sm:flex-row">
      <Input value={value} readOnly className="font-mono text-xs" aria-label="Public attendance link" />
      <Button
        type="button"
        variant="outline"
        className="gap-2"
        onClick={async () => {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1800);
        }}
      >
        {copied ? <CheckCircle2 className="size-4 text-emerald-600" aria-hidden="true" /> : <Copy className="size-4" aria-hidden="true" />}
        {copied ? "Copied" : "Copy"}
      </Button>
    </div>
  );
}

function PosterThumbnail({ posterProps }: { posterProps: AttendanceQrPosterProps }) {
  return (
    <div className="relative h-[430px] overflow-hidden rounded-xl border border-slate-200 bg-[#f7f0df] p-3">
      <div className="origin-top-left scale-[0.36]">
        <AttendanceQrPoster {...posterProps} className="w-[794px] max-w-none rounded-xl shadow-md" />
      </div>
    </div>
  );
}

function QrControlPanel({ data, churchSlug }: { data: AttendanceWorkspaceData; churchSlug: string }) {
  const [createState, createAction] = useActionState(createUniversalSabbathQrAction, initialActionState);
  const [replaceState, replaceAction] = useActionState(regenerateUniversalSabbathQrAction, initialActionState);
  const posterProps: AttendanceQrPosterProps | null = data.scanUrl
    ? {
        churchName: data.church.name,
        churchLogoUrl: data.church.logoUrl,
        title: "Sabbath Attendance",
        subtitle: "Happy Sabbath!",
        qrType: "sabbath",
        qrValue: data.scanUrl,
        qrImageUrl: data.qrImageDataUrl,
      }
    : null;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <QrCode className="size-5 text-slate-700" aria-hidden="true" />
            <h2 className="text-lg font-semibold text-slate-950">Universal Sabbath QR</h2>
          </div>
          <p className="mt-1 text-sm text-slate-600">
            One stable public link for Sabbath attendance. Members confirm once, visitors stay in visitor contacts.
          </p>
        </div>
        <Badge variant={data.qrCode ? "secondary" : "outline"} className="w-fit">
          {data.qrCode ? "Active" : "Not created"}
        </Badge>
      </div>

      <div className="mt-5 space-y-4">
        {data.qrCode && data.scanUrl ? (
          <>
            <div className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
              {posterProps ? <PosterThumbnail posterProps={posterProps} /> : null}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Public link</p>
                <div className="mt-3">
                  <CopyableLink value={data.scanUrl} />
                </div>
                <p className="mt-3 text-xs text-slate-500">
                  Public code: <span className="font-mono text-slate-700">{data.qrCode.publicCode}</span>
                </p>
                <p className="mt-3 text-sm text-slate-600">
                  Print the A4 Sabbath attendance poster for the lobby, welcome desk, and deacon/usher station.
                </p>
                {posterProps ? (
                  <AttendanceQrExportActions
                    posterProps={posterProps}
                    attendanceLink={data.scanUrl}
                    fileBaseName={`sabbath-attendance-qr-${churchSlug}`}
                    className="mt-4"
                  />
                ) : null}
              </div>
            </div>
            <form action={replaceAction} className="flex flex-wrap items-center gap-3">
              <input type="hidden" name="churchSlug" value={churchSlug} />
              <SubmitButton variant="outline" icon={<RefreshCw className="size-4" aria-hidden="true" />}>
                Replace QR link
              </SubmitButton>
              <p className="text-xs text-slate-500">Use only if the public code was shared outside the church.</p>
            </form>
            <ActionMessage state={replaceState} />
          </>
        ) : (
          <form action={createAction} className="space-y-3">
            <input type="hidden" name="churchSlug" value={churchSlug} />
            <SubmitButton icon={<QrCode className="size-4" aria-hidden="true" />}>
              Create Sabbath QR
            </SubmitButton>
            <ActionMessage state={createState} />
          </form>
        )}
      </div>
    </section>
  );
}

function AttendanceModuleHeader({ data }: { data: AttendanceWorkspaceData }) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-xl font-semibold text-slate-950">Attendance</h1>
        <p className="mt-1 text-sm text-slate-600">
          Sabbath check-in, visitor welcome, household attendance, and review.
        </p>
      </div>
      <Badge variant={data.qrCode ? "secondary" : "outline"} className="w-fit">
        {data.qrCode ? "QR ready" : "Create QR"}
      </Badge>
    </div>
  );
}

function AttendanceRecordTable({ records }: { records: AttendanceRecordRow[] }) {
  if (records.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 px-5 py-8 text-sm text-slate-600">
        No one has checked in for this occurrence yet.
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Method</TableHead>
          <TableHead>Household</TableHead>
          <TableHead>Time</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {records.map((record) => (
          <TableRow key={record.id}>
            <TableCell className="font-medium text-slate-900">{record.subjectName}</TableCell>
            <TableCell className="capitalize text-slate-600">{record.subjectKind}</TableCell>
            <TableCell className="text-slate-600">{ATTENDANCE_METHOD_LABELS[record.checkInMethod]}</TableCell>
            <TableCell className="text-slate-600">{record.householdName ?? "—"}</TableCell>
            <TableCell className="text-slate-600">{formatTime(record.checkedInAt)}</TableCell>
            <TableCell>
              <Badge variant="outline">{ATTENDANCE_STATUS_LABELS[record.status]}</Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function OverviewTab({ data, churchSlug }: { data: AttendanceWorkspaceData; churchSlug: string }) {
  return (
    <div className="grid min-w-0 grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="min-w-0 space-y-5">
        <QrControlPanel data={data} churchSlug={churchSlug} />
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">Today’s attendance</h2>
              <p className="mt-1 text-sm text-slate-600">
                {data.occurrence ? `${data.occurrence.title} • ${formatDate(data.occurrence.occurrenceDate)}` : "Create or scan the Sabbath QR to begin today’s occurrence."}
              </p>
            </div>
            <Badge variant="secondary">{data.stats.totalToday} total</Badge>
          </div>
          <div className="mt-5 min-w-0 overflow-hidden rounded-xl border border-slate-200">
            <AttendanceRecordTable records={data.records.slice(0, 12)} />
          </div>
        </section>
      </div>

      <aside className="space-y-5">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-950">Today at a glance</h2>
          <div className="mt-4 space-y-3">
            <MiniMetric label="Members present" value={data.stats.presentMembers} />
            <MiniMetric label="Visitors welcomed" value={data.stats.visitors} />
            <MiniMetric label="Household check-ins" value={data.stats.householdCheckIns} />
            <MiniMetric label="Needs review" value={data.stats.pendingReview} />
          </div>
        </section>
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-5 text-emerald-700" aria-hidden="true" />
            <h2 className="text-lg font-semibold text-slate-950">Privacy</h2>
          </div>
          <p className="mt-3 text-sm text-slate-600">
            Public guests never receive direct database access. Device recognition stores only a hashed token.
          </p>
        </section>
      </aside>
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-3 py-2">
      <span className="text-sm text-slate-600">{label}</span>
      <span className="text-sm font-semibold text-slate-950">{value}</span>
    </div>
  );
}

function KioskTab({ data, churchSlug }: { data: AttendanceWorkspaceData; churchSlug: string }) {
  const [query, setQuery] = useState("");
  const [state, action] = useActionState(markKioskAttendanceAction, initialActionState);
  const filteredMembers = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return data.members;

    return data.members.filter((member) =>
      [member.displayName, member.memberCode, member.phone, member.email, member.householdName]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalized))
    );
  }, [data.members, query]);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <MonitorCheck className="size-5 text-slate-700" aria-hidden="true" />
            <h2 className="text-lg font-semibold text-slate-950">Kiosk mode</h2>
          </div>
          <p className="mt-1 text-sm text-slate-600">
            For deacons and ushers helping members check in from a shared device.
          </p>
        </div>
        <div className="relative w-full lg:w-80">
          <Search className="pointer-events-none absolute left-3 top-2.5 size-4 text-slate-400" aria-hidden="true" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search member, code, phone"
            className="pl-9"
          />
        </div>
      </div>
      <div className="mt-4">
        <ActionMessage state={state} />
      </div>
      <div className="mt-5 min-w-0 overflow-hidden rounded-xl border border-slate-200">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Member</TableHead>
              <TableHead>Household</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredMembers.slice(0, 80).map((member) => (
              <TableRow key={member.id}>
                <TableCell>
                  <div>
                    <p className="font-medium text-slate-900">{member.displayName}</p>
                    <p className="text-xs text-slate-500">{member.memberCode ?? member.phone ?? member.email ?? "No code"}</p>
                  </div>
                </TableCell>
                <TableCell className="text-slate-600">{member.householdName ?? "—"}</TableCell>
                <TableCell>
                  {member.presentToday ? (
                    <Badge variant="secondary">Present</Badge>
                  ) : (
                    <Badge variant="outline">{member.membershipStatus}</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <form action={action} className="inline-flex">
                    <input type="hidden" name="churchSlug" value={churchSlug} />
                    <input type="hidden" name="memberId" value={member.id} />
                    <SubmitButton
                      size="sm"
                      variant={member.presentToday ? "outline" : "default"}
                      disabled={member.presentToday}
                      icon={<UserCheck className="size-4" aria-hidden="true" />}
                    >
                      {member.presentToday ? "Checked in" : "Mark present"}
                    </SubmitButton>
                  </form>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}

function VisitorsTab({ visitors }: { visitors: VisitorContactRow[] }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2">
        <UserPlus className="size-5 text-slate-700" aria-hidden="true" />
        <h2 className="text-lg font-semibold text-slate-950">Visitors</h2>
      </div>
      <p className="mt-1 text-sm text-slate-600">
        Visitor records are kept separate from active members until the church reviews them.
      </p>
      <div className="mt-5 min-w-0 overflow-hidden rounded-xl border border-slate-200">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Visits</TableHead>
              <TableHead>Interest</TableHead>
              <TableHead>Last seen</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visitors.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-slate-600">
                  No visitors have checked in yet.
                </TableCell>
              </TableRow>
            ) : (
              visitors.map((visitor) => (
                <TableRow key={visitor.id}>
                  <TableCell className="font-medium text-slate-900">{visitor.fullName}</TableCell>
                  <TableCell className="text-slate-600">{visitor.phone ?? visitor.email ?? "—"}</TableCell>
                  <TableCell className="text-slate-600">{visitor.visitCount}</TableCell>
                  <TableCell>
                    {visitor.interestedInMembership ? (
                      <Badge>Membership</Badge>
                    ) : visitor.wantsFollowUp ? (
                      <Badge variant="secondary">Follow-up</Badge>
                    ) : (
                      <Badge variant="outline">Welcome</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-slate-600">{formatTime(visitor.lastSeenAt)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}

function ReviewTab({ data, churchSlug }: { data: AttendanceWorkspaceData; churchSlug: string }) {
  const [state, action] = useActionState(resolveAttendanceReviewItemAction, initialActionState);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2">
        <ClipboardList className="size-5 text-slate-700" aria-hidden="true" />
        <h2 className="text-lg font-semibold text-slate-950">Review queue</h2>
      </div>
      <p className="mt-1 text-sm text-slate-600">
        Follow up gently with visitors, membership interest, or scans that need a human look.
      </p>
      <div className="mt-4">
        <ActionMessage state={state} />
      </div>
      <div className="mt-5 space-y-3">
        {data.reviewItems.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 px-5 py-8 text-sm text-slate-600">
            Nothing needs review right now.
          </div>
        ) : (
          data.reviewItems.map((item) => (
            <div key={item.id} className="flex flex-col gap-4 rounded-xl border border-slate-200 p-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">{ATTENDANCE_REVIEW_TYPE_LABELS[item.itemType]}</Badge>
                  <p className="text-xs text-slate-500">{formatTime(item.createdAt)}</p>
                </div>
                <h3 className="mt-2 font-semibold text-slate-950">{item.title}</h3>
                <p className="mt-1 text-sm text-slate-600">{item.description ?? item.visitorName ?? item.memberName ?? "Review this attendance item."}</p>
              </div>
              <form action={action} className="flex shrink-0 gap-2">
                <input type="hidden" name="churchSlug" value={churchSlug} />
                <input type="hidden" name="reviewItemId" value={item.id} />
                <input type="hidden" name="status" value="resolved" />
                <SubmitButton size="sm" variant="outline" icon={<CheckCircle2 className="size-4" aria-hidden="true" />}>
                  Resolved
                </SubmitButton>
              </form>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

function ReportsTab({ data }: { data: AttendanceWorkspaceData }) {
  const percentPresent = data.stats.expectedMembers > 0
    ? Math.round((data.stats.presentMembers / data.stats.expectedMembers) * 100)
    : 0;

  return (
    <div className="grid min-w-0 grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <CalendarCheck className="size-5 text-slate-700" aria-hidden="true" />
          <h2 className="text-lg font-semibold text-slate-950">Recent occurrences</h2>
        </div>
        <div className="mt-5 divide-y divide-slate-100 rounded-xl border border-slate-200">
          {data.recentOccurrences.length === 0 ? (
            <p className="px-4 py-6 text-sm text-slate-600">Attendance occurrences will appear here after the first scan.</p>
          ) : (
            data.recentOccurrences.map((occurrence) => (
              <div key={occurrence.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-900">{occurrence.title}</p>
                  <p className="text-xs text-slate-500">{occurrence.sourceType.replace("_", " ")}</p>
                </div>
                <p className="shrink-0 text-sm text-slate-600">{formatDate(occurrence.occurrenceDate)}</p>
              </div>
            ))
          )}
        </div>
      </section>
      <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-950">Sabbath report</h2>
        <div className="mt-5 space-y-3">
          <MiniMetric label="Present vs active" value={`${percentPresent}%`} />
          <MiniMetric label="Members present" value={data.stats.presentMembers} />
          <MiniMetric label="Visitors" value={data.stats.visitors} />
          <MiniMetric label="Total today" value={data.stats.totalToday} />
        </div>
      </aside>
    </div>
  );
}

function SettingsTab() {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2">
        <Settings className="size-5 text-slate-700" aria-hidden="true" />
        <h2 className="text-lg font-semibold text-slate-950">Attendance settings</h2>
      </div>
      <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 p-4">
          <h3 className="font-semibold text-slate-950">Member recognition</h3>
          <p className="mt-2 text-sm text-slate-600">
            Members are only remembered after they confirm their name and choose to remember the device. The database stores a hash, not the raw token.
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 p-4">
          <h3 className="font-semibold text-slate-950">Visitor handling</h3>
          <p className="mt-2 text-sm text-slate-600">
            Visitors are saved as visitor contacts for follow-up and are not added to active members automatically.
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 p-4 lg:col-span-2">
          <h3 className="font-semibold text-slate-950">Duplicate protection</h3>
          <p className="mt-2 text-sm text-slate-600">
            The attendance tables keep one active record per person per occurrence, so repeat scans update the experience without adding duplicate attendance.
          </p>
        </div>
      </div>
    </section>
  );
}

export function AttendanceWorkspace({ data, churchSlug }: { data: AttendanceWorkspaceData; churchSlug: string }) {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="min-w-0 space-y-5">
      <AttendanceModuleHeader data={data} />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
        <StatTile label="Present" value={data.stats.presentMembers} icon={<UserCheck className="size-4" aria-hidden="true" />} />
        <StatTile label="Visitors" value={data.stats.visitors} icon={<UserPlus className="size-4" aria-hidden="true" />} />
        <StatTile label="Expected" value={data.stats.expectedMembers} icon={<Users className="size-4" aria-hidden="true" />} />
        <StatTile label="Household" value={data.stats.householdCheckIns} icon={<Users className="size-4" aria-hidden="true" />} />
        <StatTile label="Review" value={data.stats.pendingReview} icon={<ClipboardList className="size-4" aria-hidden="true" />} />
        <StatTile label="Total" value={data.stats.totalToday} icon={<CalendarCheck className="size-4" aria-hidden="true" />} />
      </div>

      <WorkspaceTabs items={tabs} activeKey={activeTab} onChange={setActiveTab} />

      {activeTab === "overview" ? <OverviewTab data={data} churchSlug={churchSlug} /> : null}
      {activeTab === "sabbath" ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-950">Sabbath registry</h2>
          <p className="mt-1 text-sm text-slate-600">
            {data.occurrence ? `${data.occurrence.title} for ${formatDate(data.occurrence.occurrenceDate)}` : "No Sabbath occurrence is open yet."}
          </p>
          <div className="mt-5 min-w-0 overflow-hidden rounded-xl border border-slate-200">
            <AttendanceRecordTable records={data.records} />
          </div>
        </section>
      ) : null}
      {activeTab === "kiosk" ? <KioskTab data={data} churchSlug={churchSlug} /> : null}
      {activeTab === "visitors" ? <VisitorsTab visitors={data.visitors} /> : null}
      {activeTab === "review" ? <ReviewTab data={data} churchSlug={churchSlug} /> : null}
      {activeTab === "reports" ? <ReportsTab data={data} /> : null}
      {activeTab === "settings" ? <SettingsTab /> : null}
    </div>
  );
}
