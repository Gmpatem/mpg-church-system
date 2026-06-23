import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import { churchMotionClasses } from "./motion-classes";

interface ChurchRailTransitionProps {
  children: ReactNode;
  className?: string;
}

export function ChurchRailTransition({
  children,
  className,
}: ChurchRailTransitionProps) {
  return (
    <div className={cn(churchMotionClasses.rail, "min-w-0", className)}>
      {children}
    </div>
  );
}
