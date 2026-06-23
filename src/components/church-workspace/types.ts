import type { LucideIcon } from "lucide-react";

export type ChurchFeedbackVariant =
  | "success"
  | "error"
  | "warning"
  | "info"
  | "offline"
  | "progress";

export type ChurchAsyncStatus =
  | "idle"
  | "loading"
  | "success"
  | "error"
  | "empty"
  | "partial"
  | "offline";

export type ChurchSaveState = "idle" | "dirty" | "saving" | "saved" | "error";

export type ChurchOfflineActionStatus =
  | "online"
  | "offline"
  | "queued"
  | "syncing"
  | "synced"
  | "failed";

export interface ChurchProgressState {
  value?: number;
  label: string;
  description?: string;
  indeterminate?: boolean;
}

export interface ChurchDataState {
  status: ChurchAsyncStatus;
  itemCount?: number;
  filteredCount?: number;
  updatedAt?: string | Date | null;
  isPartial?: boolean;
  isStale?: boolean;
}

export interface ChurchFieldErrorItem {
  fieldId?: string;
  label: string;
  message: string;
}

export interface ChurchWorkspaceChurch {
  id: string;
  name: string;
  slug: string;
}

export interface ChurchWorkspaceUser {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_url?: string | null;
}

export interface ChurchWorkspaceNotification {
  id: string;
  title: string;
  message: string;
  href: string;
  event_type?: string | null;
  entity_type?: string | null;
  entity_id?: string | null;
  is_read: boolean;
  read_at?: string | null;
  created_at?: string | null;
  kind?: "db" | "office_signal";
}

export interface ChurchNavigationItem {
  key: string;
  label: string;
  href: string;
  icon: LucideIcon;
  exact?: boolean;
  badge?: number;
  hidden?: boolean;
}

export interface ChurchNavigationGroup {
  key: string;
  label: string;
  items: ChurchNavigationItem[];
}
