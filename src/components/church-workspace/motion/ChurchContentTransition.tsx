import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import { churchMotionClasses } from "./motion-classes";

interface ChurchContentTransitionProps {
  children: ReactNode;
  className?: string;
}

export function ChurchContentTransition({
  children,
  className,
}: ChurchContentTransitionProps) {
  return (
    <div className={cn(churchMotionClasses.content, "min-w-0", className)}>
      {children}
    </div>
  );
}
