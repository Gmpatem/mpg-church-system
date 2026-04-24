import { offlineDb, type OfflineMutationQueueItem } from "./db";
import { isOnline } from "./status";

const MAX_RETRIES = 3;

// Actions that are never allowed to sync offline
const BLOCKED_ENTITY_TYPES: OfflineMutationQueueItem["entityType"][] = [
  // We intentionally do not block any entityType at the engine level;
  // instead, the UI layer decides what can be queued.
  // Treasury approvals, access-control changes, and deletes are never queued by UI.
];

export type SyncResult = {
  processed: number;
  succeeded: number;
  failed: number;
  errors: string[];
};

export async function syncPendingMutations(churchSlug: string): Promise<SyncResult> {
  if (!isOnline()) {
    return { processed: 0, succeeded: 0, failed: 0, errors: ["Device is offline."] };
  }

  const pending = await offlineDb.offlineMutationQueue
    .where("churchSlug")
    .equals(churchSlug)
    .and((item) => item.status === "pending")
    .toArray();

  const result: SyncResult = { processed: 0, succeeded: 0, failed: 0, errors: [] };

  for (const item of pending) {
    if (BLOCKED_ENTITY_TYPES.includes(item.entityType)) {
      await markFailed(item.id, "This action type is blocked from offline sync.");
      result.failed++;
      result.errors.push(`Blocked: ${item.entityType}`);
      continue;
    }

    if (item.retryCount >= MAX_RETRIES) {
      await markFailed(item.id, "Max retry attempts exceeded.");
      result.failed++;
      result.errors.push(`Max retries: ${item.entityType}`);
      continue;
    }

    await markSyncing(item.id);
    result.processed++;

    try {
      const ok = await sendItem(item, churchSlug);
      if (ok) {
        await markSynced(item.id);
        result.succeeded++;
        await offlineDb.syncLogs.add({
          churchId: item.churchId,
          entityType: item.entityType,
          actionType: item.actionType,
          status: "success",
          message: "Synced successfully",
          createdAt: new Date(),
        });
      } else {
        throw new Error("Server rejected the request.");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await markFailed(item.id, message);
      result.failed++;
      result.errors.push(message);
      await offlineDb.syncLogs.add({
        churchId: item.churchId,
        entityType: item.entityType,
        actionType: item.actionType,
        status: "failure",
        message,
        createdAt: new Date(),
      });
    }
  }

  return result;
}

async function sendItem(item: OfflineMutationQueueItem, churchSlug: string): Promise<boolean> {
  let url: string;
  let method = "POST";

  switch (item.entityType) {
    case "department_fund_request": {
      const deptId = String(item.payload.departmentId ?? "");
      if (!deptId) throw new Error("departmentId is required for fund request sync.");
      url = `/api/churches/${churchSlug}/departments/${deptId}/fund-requests`;
      break;
    }
    case "member": {
      url = `/api/churches/${churchSlug}/members/draft`;
      break;
    }
    // TODO: contribution sync route not yet implemented — add when contribution draft form gets offline support
    // case "contribution": {
    //   url = `/api/churches/${churchSlug}/treasury/in/draft`;
    //   break;
    // }
    default:
      throw new Error(`Unsupported entity type for sync: ${item.entityType}`);
  }

  const response = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...item.payload,
      _offlineSyncId: item.id,
    }),
  });

  return response.ok;
}

async function markSyncing(id: string) {
  await offlineDb.offlineMutationQueue.update(id, {
    status: "syncing",
    updatedAt: new Date(),
  });
}

async function markSynced(id: string) {
  await offlineDb.offlineMutationQueue.update(id, {
    status: "synced",
    updatedAt: new Date(),
  });
}

async function markFailed(id: string, errorMessage: string) {
  const existing = await offlineDb.offlineMutationQueue.get(id);
  await offlineDb.offlineMutationQueue.update(id, {
    status: "failed",
    errorMessage,
    retryCount: (existing?.retryCount ?? 0) + 1,
    updatedAt: new Date(),
  });
}

export async function countPendingSync(churchSlug: string): Promise<number> {
  return offlineDb.offlineMutationQueue
    .where("churchSlug")
    .equals(churchSlug)
    .and((item) => item.status === "pending")
    .count();
}

export async function countFailedSync(churchSlug: string): Promise<number> {
  return offlineDb.offlineMutationQueue
    .where("churchSlug")
    .equals(churchSlug)
    .and((item) => item.status === "failed")
    .count();
}

export function startSyncListener(churchSlug: string, onSync?: (result: SyncResult) => void) {
  function handleOnline() {
    // Small delay to ensure network is actually stable
    setTimeout(() => {
      if (!isOnline()) return;
      syncPendingMutations(churchSlug).then((result) => {
        onSync?.(result);
      });
    }, 1500);
  }

  window.addEventListener("online", handleOnline);
  return () => window.removeEventListener("online", handleOnline);
}
