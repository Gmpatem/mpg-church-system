"use client";

import { useCallback, useState } from "react";
import type { ReactNode } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ChurchUnsavedChangesGuardProps {
  isDirty: boolean;
  isSubmitting?: boolean;
  title?: string;
  description?: string;
  discardLabel?: string;
  keepEditingLabel?: string;
  onDiscard?: () => void;
  children: (requestContinue: (next: () => void) => void) => ReactNode;
}

export function ChurchUnsavedChangesGuard({
  isDirty,
  isSubmitting = false,
  title = "Discard unsaved changes?",
  description = "The current changes have not been saved yet.",
  discardLabel = "Discard changes",
  keepEditingLabel = "Keep editing",
  onDiscard,
  children,
}: ChurchUnsavedChangesGuardProps) {
  const [open, setOpen] = useState(false);
  const [nextAction, setNextAction] = useState<(() => void) | null>(null);

  const requestContinue = useCallback(
    (next: () => void) => {
      if (!isDirty || isSubmitting) {
        next();
        return;
      }

      setNextAction(() => next);
      setOpen(true);
    },
    [isDirty, isSubmitting]
  );

  const discard = () => {
    onDiscard?.();
    nextAction?.();
    setNextAction(null);
    setOpen(false);
  };

  return (
    <>
      {children(requestContinue)}
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{title}</AlertDialogTitle>
            <AlertDialogDescription>{description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{keepEditingLabel}</AlertDialogCancel>
            <AlertDialogAction onClick={discard}>
              {discardLabel}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
