import * as React from "react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

export const ChurchButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, ...props }, ref) => (
    <Button
      ref={ref}
      className={cn("min-h-10 rounded-lg px-3.5 text-sm", className)}
      {...props}
    />
  )
);
ChurchButton.displayName = "ChurchButton";

export const ChurchIconButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, size = "icon", ...props }, ref) => (
    <Button
      ref={ref}
      size={size}
      className={cn("size-10 rounded-lg", className)}
      {...props}
    />
  )
);
ChurchIconButton.displayName = "ChurchIconButton";
