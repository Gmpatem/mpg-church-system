"use client";

import { useMemo, useTransition } from "react";
import { revokeMemberInviteAction } from "@/features/member-invite/actions";
import type { MemberInviteHistoryItem } from "@/features/member-invite/types";
import { InviteStatusBadge } from "./InviteStatusBadge";

type InviteHistoryListProps = {
  churchSlug: string;
  invites: MemberInviteHistoryItem[];
};

function formatDate(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString();
}

export function InviteHistoryList({
  churchSlug,
  invites,
}: InviteHistoryListProps) {
  const [isPending, startTransition] = useTransition();

  const rows = useMemo(() => invites, [invites]);

  function handleCopy(path: string) {
    const full =
      typeof window === "undefined" ? path : `${window.location.origin}${path}`;

    navigator.clipboard.writeText(full).catch(() => {
      window.prompt("Copy invite link", full);
    });
  }

  function handleRevoke(inviteId: string) {
    startTransition(async () => {
      const result = await revokeMemberInviteAction(churchSlug, inviteId);
      if (!result.ok) {
        window.alert(result.error);
      }
    });
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed p-6 text-sm text-muted-foreground">
        No secure invites have been generated yet.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {rows.map((invite) => (
        <div key={invite.id} className="rounded-2xl border p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium text-foreground">
                  {invite.memberName ?? invite.inviteEmail ?? "Unnamed invite"}
                </p>
                <InviteStatusBadge status={invite.status} />
              </div>

              <div className="space-y-1 text-sm text-muted-foreground">
                <p>
                  Member email: <span className="text-foreground">{invite.memberEmail ?? "—"}</span>
                </p>
                <p>
                  Invite email: <span className="text-foreground">{invite.inviteEmail ?? "—"}</span>
                </p>
                <p>
                  Member code: <span className="text-foreground">{invite.memberCode ?? "—"}</span>
                </p>
              </div>

              <div className="grid gap-1 text-xs text-muted-foreground sm:grid-cols-2 xl:grid-cols-4">
                <p>Created: {formatDate(invite.createdAt)}</p>
                <p>Expires: {formatDate(invite.expiresAt)}</p>
                <p>Claimed: {formatDate(invite.claimedAt)}</p>
                <p>Revoked: {formatDate(invite.revokedAt)}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleCopy(invite.path)}
                className="inline-flex h-10 items-center justify-center rounded-xl border px-3 text-sm font-medium transition hover:bg-accent"
              >
                Copy link
              </button>

              {invite.status === "pending" ? (
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => handleRevoke(invite.id)}
                  className="inline-flex h-10 items-center justify-center rounded-xl border border-rose-500/30 px-3 text-sm font-medium text-rose-700 transition hover:bg-rose-500/10 disabled:cursor-not-allowed disabled:opacity-60 dark:text-rose-300"
                >
                  Revoke
                </button>
              ) : null}
            </div>
          </div>

          <div className="mt-3 rounded-xl bg-muted/40 p-3 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">Path:</span> {invite.path}
          </div>
        </div>
      ))}
    </div>
  );
}
