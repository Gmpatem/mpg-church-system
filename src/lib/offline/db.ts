import Dexie, { type Table } from "dexie";

export interface CachedMember {
  id: string;
  churchId: string;
  firstName?: string | null;
  lastName?: string | null;
  displayName?: string | null;
  email?: string | null;
  phone?: string | null;
  memberCode?: string | null;
  membershipStatus?: string | null;
  departmentIds?: string[];
  cachedAt: Date;
}

export interface CachedDepartment {
  id: string;
  churchId: string;
  name: string;
  code?: string | null;
  description?: string | null;
  isActive: boolean;
  activeMemberCount: number;
  cachedAt: Date;
}

export interface CachedEvent {
  id: string;
  churchId: string;
  title: string;
  start: string;
  end?: string | null;
  eventType?: string | null;
  location?: string | null;
  departmentId?: string | null;
  cachedAt: Date;
}

export interface DraftMemberChange {
  id: string;
  churchId: string;
  churchSlug: string;
  payload: Record<string, unknown>;
  status: "draft" | "syncing" | "synced" | "failed";
  errorMessage?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface DraftDepartmentRequest {
  id: string;
  churchId: string;
  churchSlug: string;
  departmentId: string;
  payload: Record<string, unknown>;
  status: "draft" | "syncing" | "synced" | "failed";
  errorMessage?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface DraftContribution {
  id: string;
  churchId: string;
  churchSlug: string;
  payload: Record<string, unknown>;
  status: "draft" | "syncing" | "synced" | "failed";
  errorMessage?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface OfflineMutationQueueItem {
  id: string;
  churchId: string;
  churchSlug: string;
  entityType:
    | "member"
    | "department_assignment"
    | "department_fund_request"
    | "contribution";
  actionType: "create" | "update" | "delete";
  payload: Record<string, unknown>;
  status: "pending" | "syncing" | "synced" | "failed";
  errorMessage?: string | null;
  retryCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface SyncLog {
  id?: number;
  churchId: string;
  entityType: string;
  actionType: string;
  status: "success" | "failure" | "skipped";
  message?: string | null;
  createdAt: Date;
}

class OfflineDatabase extends Dexie {
  cachedMembers!: Table<CachedMember>;
  cachedDepartments!: Table<CachedDepartment>;
  cachedEvents!: Table<CachedEvent>;
  draftMemberChanges!: Table<DraftMemberChange>;
  draftDepartmentRequests!: Table<DraftDepartmentRequest>;
  draftContributions!: Table<DraftContribution>;
  offlineMutationQueue!: Table<OfflineMutationQueueItem>;
  syncLogs!: Table<SyncLog>;

  constructor() {
    super("MPGChurchOffline");
    this.version(1).stores({
      cachedMembers: "id, churchId, [churchId+membershipStatus], cachedAt",
      cachedDepartments: "id, churchId, [churchId+isActive], cachedAt",
      cachedEvents: "id, churchId, [churchId+departmentId], cachedAt",
      draftMemberChanges: "id, churchSlug, status, updatedAt",
      draftDepartmentRequests: "id, churchSlug, departmentId, status, updatedAt",
      draftContributions: "id, churchSlug, status, updatedAt",
      offlineMutationQueue:
        "id, churchSlug, status, retryCount, updatedAt",
      syncLogs: "++id, churchId, entityType, createdAt",
    });
  }
}

export const offlineDb = new OfflineDatabase();
