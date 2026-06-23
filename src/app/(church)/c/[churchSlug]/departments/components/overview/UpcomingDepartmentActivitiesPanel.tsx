"use client";

import { format } from "date-fns";
import { CalendarDays, ChevronRight, UsersRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { DepartmentsOverviewData } from "../types";

const activityTones = [
  "bg-primary/10 text-primary",
  "bg-amber-100 text-amber-700",
  "bg-red-100 text-red-700",
  "bg-blue-100 text-blue-700",
  "bg-violet-100 text-violet-700",
];

export function UpcomingDepartmentActivitiesPanel({
  overview,
  onOpenActivities,
}: {
  overview: DepartmentsOverviewData;
  onOpenActivities: () => void;
}) {
  const activities = overview.upcomingActivities.slice(0, 5);

  return (
    <section className="flex min-h-[286px] min-w-0 flex-col rounded-xl border border-border bg-background shadow-sm">
      <div className="px-5 pt-5">
        <h2 className="text-base font-semibold text-foreground">Upcoming Activities</h2>
      </div>

      <div className="flex flex-1 flex-col px-5 py-4">
        {activities.length > 0 ? (
          <div className="divide-y divide-border">
            {activities.map((activity, index) => (
              <button
                key={activity.id}
                type="button"
                className="grid w-full min-w-0 grid-cols-[40px_minmax(0,1fr)_118px] items-center gap-3 py-3 text-left"
                onClick={onOpenActivities}
              >
                <span
                  className={`inline-flex size-9 items-center justify-center rounded-lg ${
                    activityTones[index % activityTones.length]
                  }`}
                >
                  <UsersRound className="size-4" aria-hidden="true" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-foreground">
                    {activity.title}
                  </span>
                  <span className="mt-1 block truncate text-xs text-muted-foreground">
                    {activity.departmentName}
                  </span>
                </span>
                <span className="flex items-center justify-end gap-2 text-sm text-muted-foreground">
                  {format(new Date(activity.startDatetime), "MMM d, yyyy")}
                  <CalendarDays className="size-3.5" aria-hidden="true" />
                </span>
              </button>
            ))}
          </div>
        ) : (
          <div className="flex flex-1 flex-col justify-center text-center">
            <h3 className="text-sm font-semibold text-foreground">
              No upcoming Department activities
            </h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Newly scheduled Department activities will appear here.
            </p>
          </div>
        )}
      </div>

      <Separator />
      <div className="px-4 py-3">
        <Button
          type="button"
          variant="ghost"
          className="h-9 w-full justify-between rounded-lg px-2 text-primary"
          onClick={onOpenActivities}
        >
          View all activities
          <ChevronRight className="size-4" aria-hidden="true" />
        </Button>
      </div>
    </section>
  );
}
