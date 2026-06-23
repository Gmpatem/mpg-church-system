import { Badge, type BadgeProps } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";

export function ChurchBadge({ className, variant = "secondary", ...props }: BadgeProps) {
  return (
    <Badge
      variant={variant}
      className={cn("rounded-md px-2 py-0.5 text-[11px] font-medium", className)}
      {...props}
    />
  );
}
