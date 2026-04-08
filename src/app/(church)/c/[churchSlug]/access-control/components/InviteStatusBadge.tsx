import { StatusBadge } from "@/components/ui/StatusBadge";

type InviteStatusBadgeProps = {
  status: string;
};

export function InviteStatusBadge({ status }: InviteStatusBadgeProps) {
  return <StatusBadge status={status} context="invite" />;
}
