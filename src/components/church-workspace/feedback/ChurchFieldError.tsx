import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface ChurchFieldErrorProps {
  id?: string;
  message?: string | null;
  className?: string;
}

export function ChurchFieldError({
  id,
  message,
  className,
}: ChurchFieldErrorProps) {
  if (!message) return null;

  return (
    <p
      id={id}
      className={cn(
        "flex items-start gap-1.5 text-sm leading-5 text-destructive",
        className
      )}
    >
      <AlertCircle className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
      <span>{message}</span>
    </p>
  );
}
