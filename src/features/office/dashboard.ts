import "server-only";

import { getOfficeWorkspaceData } from "./queries";

export async function getOfficeAttentionStripData(churchSlug: string) {
  const office = await getOfficeWorkspaceData(churchSlug);

  return {
    church: office.church,
    stats: {
      pendingAccessRequests: office.stats.pendingAccessRequests,
      pendingLeadershipRequests: office.stats.pendingLeadershipRequests,
      announcementsNeedingPublish: office.stats.announcementsNeedingPublish,
      departmentEventsAwaitingApproval: office.stats.departmentEventsAwaitingApproval,
      todaysEvents: office.stats.todaysEvents,
    },
    queue: office.queue.slice(0, 5),
  };
}
