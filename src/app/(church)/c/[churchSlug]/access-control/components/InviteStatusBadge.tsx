import type { InviteLifecycleStatus } from "@/features/member-invite/types";

type InviteStatusBadgeProps = {
  status: InviteLifecycleStatus;
};

const styles: Record<InviteLifecycleStatus, string> = {
  pending: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  claimed: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  expired: "border-zinc-500/30 bg-zinc-500/10 text-zinc-700 dark:text-zinc-300",
  revoked: "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300",
};

const labels: Record<InviteLifecycleStatus, string> = {
  pending: "Pending",
  claimed: "Claimed",
  expired: "Expired",
  revoked: "Revoked",
};

export function InviteStatusBadge({ status }: InviteStatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}
