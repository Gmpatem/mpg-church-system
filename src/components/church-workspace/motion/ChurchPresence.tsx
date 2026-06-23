import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import { churchMotionClasses } from "./motion-classes";

interface ChurchPresenceProps {
  present: boolean;
  children: ReactNode;
  className?: string;
}

export function ChurchPresence({
  present,
  children,
  className,
}: ChurchPresenceProps) {
  if (!present) return null;

  return (
    <div className={cn(churchMotionClasses.presence, className)}>
      {children}
    </div>
  );
}
