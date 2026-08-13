"use client";

import Link from "next/link";
import { BookOpen, CalendarCheck, Clock, MapPin, Music, Users } from "lucide-react";
import { WorkspaceEmptyState } from "@/components/workspace";
import type { MemberMinistryPortalData, MinistryDutyStatus } from "../types";
import {
  formatClockTime,
  MemberPortalCard,
  MemberPortalDateBlock,
  MemberPortalIconBubble,
  MemberPortalSectionHeader,
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

export function MemberMinistriesPortal({
  data,
  unreadNotificationCount = 0,
}: {
  data: MemberMinistryPortalData;
  unreadNotificationCount?: number;
}) {
  const ministryNameByScopeId = new Map(
    data.ministries.map((ministry) => [ministry.scopeId, ministry.name])
  );

  return (
    <div className="flex flex-col gap-5">
      <MemberPortalModuleHero
        title="My Ministries"
        description="Your department assignments and duties"
        unreadNotificationCount={unreadNotificationCount}
      />

      <section className="flex flex-col gap-3">
        <MemberPortalSectionHeader title="Upcoming Duties" actionLabel="View all" />
        {data.duties.length > 0 ? (
          <div className="flex flex-col gap-3">
            {data.duties.map((duty) => {
            const href = `/my/${data.church.slug}/duties/${duty.id}`;
            const ministryName = duty.scopeId
              ? ministryNameByScopeId.get(duty.scopeId) ?? "Ministry service"
              : "Ministry service";
            const content = (
              <MemberPortalCard className="flex min-h-[120px] overflow-hidden p-0">
                <MemberPortalDateBlock value={duty.serviceDate} />
                <div className="min-w-0 flex-1 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-950">{duty.dutyName}</p>
                      <p className="mt-2 truncate text-sm text-slate-600">
                        {ministryName}
                      </p>
                    </div>
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

            return (
              <Link key={duty.id} href={href} className="block">
                {content}
              </Link>
            );
          })}
          </div>
        ) : (
          <WorkspaceEmptyState
            title="No upcoming duties"
            message="Your upcoming ministry duties will appear here after a ministry leader assigns them."
            className="min-h-[180px] border-amber-100 bg-white"
          />
        )}
      </section>

      <section className="flex flex-col gap-3">
        <MemberPortalSectionHeader title="My Departments" actionLabel="View all" />
        {data.ministries.length > 0 ? (
          <div className="flex flex-col gap-3">
            {data.ministries.map((ministry) => {
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
                      <span className="truncate">{ministry.roleTitle ?? "Member"}</span>
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
        ) : (
          <WorkspaceEmptyState
            title="No ministry assignments"
            message="You are not linked to an active department yet. Assignments made by church leaders will appear here."
            className="min-h-[180px] border-amber-100 bg-white"
          />
        )}
      </section>
    </div>
  );
}
