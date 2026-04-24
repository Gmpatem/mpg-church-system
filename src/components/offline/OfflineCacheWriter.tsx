"use client";

import { useEffect } from "react";
import { cacheDepartment, cacheDepartmentMembers } from "@/lib/offline/cache";

interface OfflineDepartmentCacheProps {
  churchId: string;
  department: {
    id: string;
    department_name: string;
    code?: string | null;
    description?: string | null;
    is_active?: boolean | null;
  };
  members: Array<{
    id: string;
    member_id: string;
    role_title?: string | null;
    is_active?: boolean | null;
    start_date?: string | null;
    member?: {
      id: string;
      first_name?: string | null;
      last_name?: string | null;
      display_name?: string | null;
      member_code?: string | null;
      email?: string | null;
      phone?: string | null;
      membership_status?: string | null;
    } | null;
  }>;
  activeMemberCount: number;
}

export function OfflineDepartmentCache({
  churchId,
  department,
  members,
  activeMemberCount,
}: OfflineDepartmentCacheProps) {
  useEffect(() => {
    if (!churchId || !department?.id) return;
    let cancelled = false;

    async function run() {
      try {
        await cacheDepartment(churchId, department, activeMemberCount);
        if (!cancelled) {
          await cacheDepartmentMembers(churchId, department.id, members);
        }
      } catch {
        // Silently fail caching — online behavior must not break
      }
    }

    run();

    return () => {
      cancelled = true;
    };
  }, [churchId, department, members, activeMemberCount]);

  return null;
}
