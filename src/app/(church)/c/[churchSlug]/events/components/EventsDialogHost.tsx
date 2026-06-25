"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ChurchActionFeedback } from "@/components/church-workspace/feedback";
import { EventWorkspaceForm } from "@/features/events/components/EventWorkspaceForm";
import type { EventDialogIntent, EventsWorkspaceData } from "@/features/events/types";

export function EventsDialogHost({
  churchSlug,
  data,
  dialog,
  onDialogChange,
}: {
  churchSlug: string;
  data: EventsWorkspaceData;
  dialog: EventDialogIntent;
  onDialogChange: (dialog: EventDialogIntent) => void;
}) {
  const isMobile = useMobileDialog();
  const open = dialog !== null;
  const mode = dialog?.type === "edit" ? "edit" : "create";
  const selectedEvent =
    dialog?.type === "edit" && data.selectedEvent?.id === dialog.eventId
      ? data.selectedEvent
      : null;
  const title = mode === "edit" ? "Edit Event" : "Create Event";
  const description =
    mode === "edit"
      ? "Update event details, schedule, status, and department links."
      : "Create an event and submit it to the approval workflow.";
  const body =
    mode === "edit" && !selectedEvent ? (
      <ChurchActionFeedback
        variant="warning"
        title="Select the event before editing"
        description="Open the event from the registry so the complete department links are loaded."
      />
    ) : (
      <EventWorkspaceForm
        churchSlug={churchSlug}
        mode={mode}
        initialValues={selectedEvent}
        departments={data.formOptions.departments}
        eventTypes={data.formOptions.eventTypes}
      />
    );

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={(nextOpen) => !nextOpen && onDialogChange(null)}>
        <SheetContent side="bottom" className="max-h-[92vh] rounded-t-xl">
          <SheetHeader className="pr-8 text-left">
            <SheetTitle>{title}</SheetTitle>
            <SheetDescription>{description}</SheetDescription>
          </SheetHeader>
          <div className="mt-5">{body}</div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onDialogChange(null)}>
      <DialogContent className="max-h-[92vh] max-w-3xl overflow-hidden">
        <DialogHeader className="pr-8">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {body}
      </DialogContent>
    </Dialog>
  );
}

function useMobileDialog() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(max-width: 767px)");
    const update = () => setIsMobile(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  return isMobile;
}
