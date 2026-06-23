"use client";

import { formatDistanceToNow } from "date-fns";
import { ChevronRight } from "lucide-react";
import { ChurchAvatar } from "@/components/church-workspace";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { DepartmentsOverviewData } from "../types";

export function RecentDepartmentUpdatesPanel({
  overview,
  onOpenUpdates,
}: {
  overview: DepartmentsOverviewData;
  onOpenUpdates: () => void;
}) {
  const updates = overview.recentUpdates.slice(0, 5);

  return (
    <section className="flex min-h-[286px] min-w-0 flex-col rounded-xl border border-border bg-background shadow-sm">
      <div className="px-5 pt-5">
        <h2 className="text-base font-semibold text-foreground">Recent Department Updates</h2>
      </div>

      <div className="flex flex-1 flex-col px-5 py-4">
        {updates.length > 0 ? (
          <div className="divide-y divide-border">
            {updates.map((update) => (
              <button
                key={update.id}
                type="button"
                className="flex w-full min-w-0 items-start gap-3 py-3 text-left"
                onClick={onOpenUpdates}
              >
                <ChurchAvatar
                  name={update.actorName ?? update.title}
                  imageUrl={update.actorAvatarUrl}
                  className="size-9"
                />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm leading-5 text-foreground">
                    {update.actorName ? `${update.actorName} created ` : ""}
                    <strong>{update.title}</strong>
                    {update.departmentName ? ` for ${update.departmentName}` : ""}
                  </span>
                  <span className="mt-1 block text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(update.createdAt), { addSuffix: true })}
                  </span>
                </span>
              </button>
            ))}
          </div>
        ) : (
          <div className="flex flex-1 flex-col justify-center text-center">
            <h3 className="text-sm font-semibold text-foreground">No recent Department updates</h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Department announcements and activity changes will appear here.
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
          onClick={onOpenUpdates}
        >
          View all updates
          <ChevronRight className="size-4" aria-hidden="true" />
        </Button>
      </div>
    </section>
  );
}
