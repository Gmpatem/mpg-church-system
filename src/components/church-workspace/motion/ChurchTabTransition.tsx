import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import { churchMotionClasses } from "./motion-classes";

interface ChurchTabTransitionProps {
  children: ReactNode;
  className?: string;
}

export function ChurchTabTransition({
  children,
  className,
}: ChurchTabTransitionProps) {
  return (
    <div className={cn(churchMotionClasses.tab, "min-w-0", className)}>
      {children}
    </div>
  );
}
