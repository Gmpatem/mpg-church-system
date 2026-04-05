"use client";

import { useActionState } from "react";
import { setChurchActiveStateAction } from "@/features/platform/actions";

interface ChurchStatusToggleProps {
  churchId: string;
  isActive: boolean;
}

export function ChurchStatusToggle({ churchId, isActive }: ChurchStatusToggleProps) {
  const [state, formAction, isPending] = useActionState(setChurchActiveStateAction, null);

  return (
    <form action={formAction} className="inline-flex items-center gap-2">
      <input type="hidden" name="church_id" value={churchId} />
      <input type="hidden" name="is_active" value={isActive ? "false" : "true"} />

      <button
        type="submit"
        disabled={isPending}
        className="rounded-md bg-gray-900 px-3 py-2 text-xs font-medium text-white hover:bg-black disabled:opacity-50"
      >
        {isPending ? "Saving..." : isActive ? "Deactivate" : "Activate"}
      </button>

      {state && !state.ok && (
        <span className="text-xs text-red-600">{state.error}</span>
      )}
    </form>
  );
}