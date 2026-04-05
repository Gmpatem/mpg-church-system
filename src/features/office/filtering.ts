import "server-only";

export type OfficeSignalType =
  | "access_request"
  | "leadership_request"
  | "announcement_review"
  | "event_approval"
  | "today_event";

export type OfficeSignalItem = {
  id: string;
  type: OfficeSignalType;
  title: string;
  description: string;
  href: string;
  createdAt?: string | null;
  startsAt?: string | null;
  status?: string | null;
};

function isClerkRole(roles: string[]) {
  return roles.includes("clerk");
}

function isSecretaryRole(roles: string[]) {
  return roles.includes("church_secretary");
}

function isSupervisorRole(roles: string[]) {
  return roles.includes("church_admin") || roles.includes("pastor");
}

export function filterOfficeSignalsByRole(
  roles: string[],
  items: OfficeSignalItem[]
): OfficeSignalItem[] {
  const clerk = isClerkRole(roles);
  const secretary = isSecretaryRole(roles);
  const supervisor = isSupervisorRole(roles);

  if (supervisor) {
    return items;
  }

  return items.filter((item) => {
    if (clerk && ["access_request", "leadership_request"].includes(item.type)) {
      return true;
    }

    if (secretary && ["announcement_review", "event_approval", "today_event"].includes(item.type)) {
      return true;
    }

    if (clerk && secretary) {
      return true;
    }

    return false;
  });
}
