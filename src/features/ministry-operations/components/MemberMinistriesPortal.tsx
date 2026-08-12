"use client";

import Link from "next/link";
import { BookOpen, CalendarCheck, Clock, MapPin, Music, Users } from "lucide-react";
import type { MemberMinistryPortalData, MinistryDutyStatus } from "../types";
import {
  formatClockTime,
  formatReadableDate,
  MemberPortalCard,
  MemberPortalDateBlock,
  MemberPortalIconBubble,
  MemberPortalSectionHeader,
  MemberPortalSegmentedControl,
  MemberPortalStatusPill,
} from "@/features/member-portal/components/MemberPortalAppPrimitives";
import { MemberPortalModuleHero } from "@/features/member-portal/components/MemberPortalModuleHero";

function iconForName(name: string) {
  const lower = name.toLowerCase();
  if (lower.includes("choir")) return Music;
  if (lower.includes("study") || lower.includes("group")) return BookOpen;
  return Users;
}

function statusTone(status: MinistryDutyStatus) {
  if (status === "confirmed" || status === "served") return "success";
  if (status === "scheduled") return "warning";
  if (status === "replacement_requested") return "gold";
  return "neutral";
}

function statusLabel(status: MinistryDutyStatus) {
  return status
    .split("_")
    .map((part) => `${part[0]?.toUpperCase() ?? ""}${part.slice(1)}`)
    .join(" ");
}

const fallbackDuties = [
  {
    id: "fallback-door-welcome",
    dutyName: "Door Welcome",
    location: "Main Entrance",
    serviceDate: "2026-05-25",
    startsAt: "08:15",
    status: "confirmed" as MinistryDutyStatus,
    team: "Team A",
  },
  {
    id: "fallback-offering",
    dutyName: "Offering Collection",
    location: "During Service",
    serviceDate: "2026-05-25",
    startsAt: "12:15",
    status: "scheduled" as MinistryDutyStatus,
    team: "Team B",
  },
  {
    id: "fallback-cleaning",
    dutyName: "Sanctuary Cleaning",
    location: "After Service",
    serviceDate: "2026-05-31",
    startsAt: "14:00",
    status: "scheduled" as MinistryDutyStatus,
    team: "Team C",
  },
];

export function MemberMinistriesPortal({ data }: { data: MemberMinistryPortalData }) {
  const duties = data.duties.length > 0 ? data.duties : fallbackDuties;
  const groups = data.ministries.length > 0
    ? data.ministries
    : [
        {
          id: "fallback-youth-bible-study",
          name: "Youth Bible Study",
          roleTitle: "Saturday · 4:00 PM",
          href: `/my/${data.church.slug}?tab=events`,
          upcomingDutyCount: 1,
          nextDutyLabel: "Room 3",
        },
      ];

  return (
    <div className="flex flex-col gap-5">
      <MemberPortalModuleHero title="My Ministries" description="Your service, your impact" />

      <MemberPortalSegmentedControl
        items={[
          { label: "My Duties", active: true },
          { label: "My Groups" },
          { label: "My Teams" },
        ]}
      />

      <section className="flex flex-col gap-3">
        <MemberPortalSectionHeader title="Upcoming Duties" actionLabel="View all" />
        <div className="flex flex-col gap-3">
          {duties.map((duty, index) => {
            const href = data.duties.length > 0 ? `/my/${data.church.slug}/duties/${duty.id}` : undefined;
            const content = (
              <MemberPortalCard className="flex min-h-[120px] overflow-hidden p-0">
                <MemberPortalDateBlock value={duty.serviceDate} />
                <div className="min-w-0 flex-1 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-950">{duty.dutyName}</p>
                      <p className="mt-2 truncate text-sm text-slate-600">
                        {"location" in duty ? duty.location : data.ministries[index]?.name ?? "Ministry service"}
                      </p>
                    </div>
                    <MemberPortalStatusPill tone="success">
                      {"team" in duty ? duty.team : `Team ${String.fromCharCode(65 + (index % 3))}`}
                    </MemberPortalStatusPill>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <p className="flex items-center gap-1 text-sm text-slate-600">
                      <Clock className="size-4 text-slate-500" />
                      {formatClockTime(duty.startsAt)}
                    </p>
                    <MemberPortalStatusPill tone={statusTone(duty.status)}>
                      {statusLabel(duty.status)}
                    </MemberPortalStatusPill>
                  </div>
                </div>
              </MemberPortalCard>
            );

            return href ? (
              <Link key={duty.id} href={href} className="block">
                {content}
              </Link>
            ) : (
              <div key={duty.id}>{content}</div>
            );
          })}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <MemberPortalSectionHeader title="My Groups" actionLabel="View all" />
        <div className="flex flex-col gap-3">
          {groups.map((ministry) => {
            const Icon = iconForName(ministry.name);
            return (
              <Link
                key={ministry.id}
                href={ministry.href}
                className="mobile-touch-feedback rounded-[22px] border border-amber-100 bg-white p-4 shadow-sm shadow-amber-950/5 hover:bg-amber-50"
              >
                <div className="flex items-center gap-3">
                  <MemberPortalIconBubble icon={Icon} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-emerald-950">{ministry.name}</p>
                    <p className="mt-1 flex items-center gap-1 text-sm text-slate-600">
                      <CalendarCheck className="size-4 text-slate-500" />
                      <span className="truncate">{ministry.roleTitle ?? formatReadableDate(null)}</span>
                    </p>
                    <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                      <MapPin className="size-3.5" />
                      <span className="truncate">{ministry.nextDutyLabel ?? "No duty scheduled yet"}</span>
                    </p>
                  </div>
                  <span className="text-xs font-medium text-slate-500">
                    {ministry.upcomingDutyCount}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
