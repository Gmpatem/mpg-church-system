import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils/cn";

interface ChurchDividerProps {
  orientation?: "horizontal" | "vertical";
  className?: string;
}

export function ChurchDivider({ orientation = "horizontal", className }: ChurchDividerProps) {
  return (
    <Separator
      orientation={orientation}
      className={cn("bg-border", className)}
    />
  );
}
