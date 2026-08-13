import { Leaf } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { MemberPortalNotificationBell } from "./MemberPortalAppPrimitives";

type MemberPortalModuleHeroProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  badges?: string[];
  unreadNotificationCount?: number;
  className?: string;
};

export function MemberPortalModuleHero({
  eyebrow,
  title,
  description,
  badges,
  unreadNotificationCount = 0,
  className,
}: MemberPortalModuleHeroProps) {
  return (
    <section
      className={cn(
        "relative -mx-3 -mt-3 overflow-hidden rounded-b-[28px] bg-emerald-950 px-4 pb-7 pt-5 text-white shadow-sm sm:mx-0 sm:mt-0 sm:rounded-[28px]",
        className
      )}
    >
      <div className="pointer-events-none absolute -right-4 bottom-1 opacity-20">
        <Leaf className="size-28 rotate-[-24deg] text-amber-300" />
      </div>
      <div className="relative flex items-start justify-between gap-4">
        <div className="min-w-0">
          {eyebrow ? <p className="text-xs font-medium text-emerald-100/80">{eyebrow}</p> : null}
          <h1 className="font-serif text-2xl font-semibold leading-tight tracking-normal text-white">
            {title}
          </h1>
          {description ? <p className="mt-1 text-sm leading-5 text-emerald-50">{description}</p> : null}
        </div>
        <MemberPortalNotificationBell light unreadCount={unreadNotificationCount} />
      </div>
      {badges && badges.length > 0 ? (
        <div className="relative mt-4 flex gap-2 overflow-x-auto">
          {badges.map((badge) => (
            <span
              key={badge}
              className="shrink-0 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-emerald-50"
            >
              {badge}
            </span>
          ))}
        </div>
      ) : null}
    </section>
  );
}
