"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils/cn";

interface ChurchAvatarProps {
  name?: string | null;
  email?: string | null;
  imageUrl?: string | null;
  className?: string;
}

export function getChurchUserInitials(name?: string | null, email?: string | null) {
  return (
    name
      ?.split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0))
      .join("")
      .toUpperCase() ||
    email?.charAt(0)?.toUpperCase() ||
    "U"
  );
}

export function ChurchAvatar({ name, email, imageUrl, className }: ChurchAvatarProps) {
  return (
    <Avatar className={cn("size-9 border border-border", className)}>
      {imageUrl ? <AvatarImage src={imageUrl} alt={name ?? email ?? "User"} /> : null}
      <AvatarFallback className="bg-muted text-xs font-semibold text-foreground">
        {getChurchUserInitials(name, email)}
      </AvatarFallback>
    </Avatar>
  );
}
