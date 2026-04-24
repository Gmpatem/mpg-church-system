import { offlineDb } from "./db";
import { isOnline } from "./status";

export type OfflineFormResult =
  | { ok: true; message: string }
  | { ok: false; error: string };

export function checkOffline(): boolean {
  return !isOnline();
}

export async function saveDepartmentFundRequestDraft(params: {
  churchId: string;
  churchSlug: string;
  departmentId: string;
  formData: FormData;
}): Promise<OfflineFormResult> {
  try {
    const { churchId, churchSlug, departmentId, formData } = params;
    const id = crypto.randomUUID();
    const payload: Record<string, unknown> = {};
    formData.forEach((value, key) => {
      payload[key] = value;
    });

    const now = new Date();

    await offlineDb.draftDepartmentRequests.add({
      id,
      churchId,
      churchSlug,
      departmentId,
      payload,
      status: "draft",
      createdAt: now,
      updatedAt: now,
    });

    await offlineDb.offlineMutationQueue.add({
      id,
      churchId,
      churchSlug,
      entityType: "department_fund_request",
      actionType: "create",
      payload: { ...payload, departmentId },
      status: "pending",
      retryCount: 0,
      createdAt: now,
      updatedAt: now,
    });

    return { ok: true, message: "Saved on this device. It will be sent when internet returns." };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save draft.";
    return { ok: false, error: message };
  }
}

export async function saveMemberDraft(params: {
  churchId: string;
  churchSlug: string;
  formData: FormData;
}): Promise<OfflineFormResult> {
  try {
    const { churchId, churchSlug, formData } = params;
    const id = crypto.randomUUID();
    const payload: Record<string, unknown> = {};
    formData.forEach((value, key) => {
      payload[key] = value;
    });

    const now = new Date();

    await offlineDb.draftMemberChanges.add({
      id,
      churchId,
      churchSlug,
      payload,
      status: "draft",
      createdAt: now,
      updatedAt: now,
    });

    await offlineDb.offlineMutationQueue.add({
      id,
      churchId,
      churchSlug,
      entityType: "member",
      actionType: "create",
      payload,
      status: "pending",
      retryCount: 0,
      createdAt: now,
      updatedAt: now,
    });

    return { ok: true, message: "Saved on this device. It will be sent when internet returns." };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save draft.";
    return { ok: false, error: message };
  }
}
