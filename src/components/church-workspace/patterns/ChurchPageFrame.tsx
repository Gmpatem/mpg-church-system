import { cn } from "@/lib/utils/cn";

interface ChurchPageFrameProps {
  children: React.ReactNode;
  className?: string;
}

export function ChurchPageFrame({ children, className }: ChurchPageFrameProps) {
  return (
    <div className={cn("mx-auto w-full max-w-[1600px] min-w-0", className)}>
      {children}
    </div>
  );
}
