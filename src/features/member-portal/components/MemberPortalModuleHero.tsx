import { WorkspaceHero } from "@/components/workspace";

type MemberPortalModuleHeroProps = {
  eyebrow: string;
  title: string;
  description?: string;
  badges?: string[];
};

export function MemberPortalModuleHero({
  eyebrow,
  title,
  description,
  badges,
}: MemberPortalModuleHeroProps) {
  return (
    <WorkspaceHero
      size="compact"
      eyebrow={eyebrow}
      title={title}
      description={description}
      badges={badges}
      className="rounded-2xl"
    />
  );
}

