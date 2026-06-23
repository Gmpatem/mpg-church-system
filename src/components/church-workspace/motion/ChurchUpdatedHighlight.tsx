import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import { churchMotionClasses } from "./motion-classes";

interface ChurchUpdatedHighlightProps {
  active?: boolean;
  children: ReactNode;
  className?: string;
}

export function ChurchUpdatedHighlight({
  active = true,
  children,
  className,
}: ChurchUpdatedHighlightProps) {
  return (
    <div
      data-updated={active ? "true" : "false"}
      className={cn(active && churchMotionClasses.updated, className)}
    >
      {children}
    </div>
  );
}
