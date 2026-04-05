"use client";

import { useActionState } from "react";
import { removeMemberDepartmentAction } from "@/features/members/actions";

interface RemoveMemberDepartmentFormProps {
  churchSlug: string;
  memberId: string;
  assignmentId: string;
}

export function RemoveMemberDepartmentForm({
  churchSlug,
  memberId,
  assignmentId,
}: RemoveMemberDepartmentFormProps) {
  const [state, formAction, isPending] = useActionState(removeMemberDepartmentAction, null);

  return (
    <form action={formAction} className="inline-flex items-center gap-2">
      <input type="hidden" name="churchSlug" value={churchSlug} />
      <input type="hidden" name="memberId" value={memberId} />
      <input type="hidden" name="assignmentId" value={assignmentId} />

      <button
        type="submit"
        disabled={isPending}
        className="rounded-md border border-red-300 bg-white px-3 py-2 text-xs text-red-700 hover:bg-red-50 disabled:opacity-50"
      >
        {isPending ? "Removing..." : "Remove"}
      </button>

      {state && !state.ok ? (
        <span className="text-xs text-red-600">{state.error}</span>
      ) : null}
    </form>
  );
}