import { cn } from "@/lib/utils/cn";

interface ChurchPageFrameProps {
  children: React.ReactNode;
  className?: string;
}

export function ChurchPageFrame({ children, className }: ChurchPageFrameProps) {
  return (
    <div className={cn("church-page-container w-full min-w-0 max-w-none", className)}>
      {children}
    </div>
  );
}
