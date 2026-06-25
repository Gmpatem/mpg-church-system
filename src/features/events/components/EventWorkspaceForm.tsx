"use client";

import { useActionState } from "react";
import { CalendarPlus, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  ChurchActionFeedback,
  ChurchErrorSummary,
  ChurchFieldError,
  ChurchLoadingButton,
} from "@/components/church-workspace/feedback";
import { createEventAction, updateEventAction } from "../actions";
import { toDateTimeLocalValue } from "../presentation";
import type {
  ActionState,
  EventDetailsViewModel,
  EventFormDepartmentOption,
  EventTypeOption,
} from "../types";

interface EventWorkspaceFormProps {
  churchSlug: string;
  initialValues?: EventDetailsViewModel | null;
  departments: EventFormDepartmentOption[];
  eventTypes: EventTypeOption[];
  mode?: "create" | "edit";
}

function getDefaultStart() {
  const date = new Date();
  date.setMinutes(0, 0, 0);
  date.setHours(date.getHours() + 1);
  const offsetMs = date.getTimezoneOffset() * 60 * 1000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

function getDefaultEnd(startValue: string) {
  const date = new Date(startValue);
  if (Number.isNaN(date.getTime())) return "";
  date.setHours(date.getHours() + 1);
  return date.toISOString().slice(0, 16);
}

function fieldError(state: ActionState | null, field: string) {
  return state?.fieldErrors?.[field]?.[0] ?? null;
}

function errorSummaryItems(state: ActionState | null) {
  if (!state?.fieldErrors) return [];
  const labelByField: Record<string, string> = {
    title: "Title",
    event_type: "Event type",
    location: "Location",
    start_datetime: "Start",
    end_datetime: "End",
    status: "Status",
    department_ids: "Departments",
  };

  return Object.entries(state.fieldErrors).flatMap(([field, messages]) =>
    (messages ?? []).map((message) => ({
      label: labelByField[field] ?? field,
      message,
      fieldId: `event-${field}`,
    }))
  );
}

export function EventWorkspaceForm({
  churchSlug,
  initialValues,
  departments,
  eventTypes,
  mode = "create",
}: EventWorkspaceFormProps) {
  const action = mode === "edit" ? updateEventAction : createEventAction;
  const [state, formAction] = useActionState(action, null);
  const defaultStart = toDateTimeLocalValue(initialValues?.startDateTime) || getDefaultStart();
  const defaultEnd = toDateTimeLocalValue(initialValues?.endDateTime) || getDefaultEnd(defaultStart);
  const selectedDepartmentIds = new Set(initialValues?.departments.map((department) => department.id) ?? []);

  return (
    <form action={formAction} className="flex max-h-[78vh] min-w-0 flex-col gap-5 overflow-y-auto pr-1">
      <input type="hidden" name="churchSlug" value={churchSlug} />
      <input type="hidden" name="department_ids_provided" value="true" />
      {mode === "edit" && initialValues?.id ? <input type="hidden" name="eventId" value={initialValues.id} /> : null}

      {state?.error ? <ChurchActionFeedback variant="error" title={state.error} /> : null}
      {state?.ok && state.message ? <ChurchActionFeedback variant="success" title={state.message} /> : null}
      <ChurchErrorSummary errors={errorSummaryItems(state)} focusOnMount={false} />

      <div className="grid min-w-0 gap-4 md:grid-cols-2">
        <div className="min-w-0 md:col-span-2">
          <Label htmlFor="event-title">Title</Label>
          <Input
            id="event-title"
            name="title"
            defaultValue={initialValues?.title ?? ""}
            required
            className="mt-1"
            placeholder="Sunday worship, youth retreat, leadership meeting"
            aria-describedby={fieldError(state, "title") ? "event-title-error" : undefined}
          />
          <ChurchFieldError id="event-title-error" message={fieldError(state, "title")} className="mt-1" />
        </div>

        <div className="min-w-0">
          <Label htmlFor="event-event_type">Event type</Label>
          <Select name="event_type" defaultValue={initialValues?.eventType ?? "worship_service"}>
            <SelectTrigger id="event-event_type" className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {eventTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <ChurchFieldError id="event-event_type-error" message={fieldError(state, "event_type")} className="mt-1" />
        </div>

        <div className="min-w-0">
          <Label htmlFor="event-location">Location</Label>
          <Input
            id="event-location"
            name="location"
            defaultValue={initialValues?.location ?? ""}
            className="mt-1"
            placeholder="Main sanctuary"
          />
          <ChurchFieldError id="event-location-error" message={fieldError(state, "location")} className="mt-1" />
        </div>

        <div className="min-w-0">
          <Label htmlFor="event-start_datetime">Start</Label>
          <Input
            id="event-start_datetime"
            type="datetime-local"
            name="start_datetime"
            defaultValue={defaultStart}
            required
            className="mt-1"
          />
          <ChurchFieldError id="event-start_datetime-error" message={fieldError(state, "start_datetime")} className="mt-1" />
        </div>

        <div className="min-w-0">
          <Label htmlFor="event-end_datetime">End</Label>
          <Input
            id="event-end_datetime"
            type="datetime-local"
            name="end_datetime"
            defaultValue={defaultEnd}
            required
            className="mt-1"
          />
          <ChurchFieldError id="event-end_datetime-error" message={fieldError(state, "end_datetime")} className="mt-1" />
        </div>

        <div className="min-w-0">
          <Label htmlFor="event-status">Status</Label>
          <Select name="status" defaultValue={initialValues?.status ?? "scheduled"}>
            <SelectTrigger id="event-status" className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <ChurchFieldError id="event-status-error" message={fieldError(state, "status")} className="mt-1" />
        </div>

        <label className="flex items-center gap-2 pt-6 text-sm font-medium text-foreground">
          <Checkbox name="is_all_day" defaultChecked={initialValues?.isAllDay ?? false} />
          All day
        </label>
      </div>

      <div className="min-w-0">
        <Label htmlFor="event-description">Description</Label>
        <Textarea
          id="event-description"
          name="description"
          defaultValue={initialValues?.description ?? ""}
          rows={4}
          className="mt-1"
          placeholder="Purpose, notes, setup instructions"
        />
        <ChurchFieldError id="event-description-error" message={fieldError(state, "description")} className="mt-1" />
      </div>

      <fieldset className="min-w-0">
        <legend className="text-sm font-medium text-foreground">Departments</legend>
        <p className="mt-1 text-xs text-muted-foreground">
          Select every department connected to this event. The primary department remains first for compatibility.
        </p>
        <div className="mt-3 grid min-w-0 gap-2 sm:grid-cols-2">
          {departments.map((department) => (
            <label
              key={department.id}
              className="flex min-w-0 items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-foreground"
            >
              <Checkbox
                name="department_ids"
                value={department.id}
                defaultChecked={selectedDepartmentIds.has(department.id) || initialValues?.primaryDepartmentId === department.id}
              />
              <span className="min-w-0 truncate">
                {department.name}
                {!department.isActive ? " (inactive)" : ""}
                {department.isPrimary ? " (primary)" : ""}
              </span>
            </label>
          ))}
          {departments.length === 0 ? <p className="text-sm text-muted-foreground">No departments are available.</p> : null}
        </div>
        <ChurchFieldError id="event-department_ids-error" message={fieldError(state, "department_ids")} className="mt-2" />
      </fieldset>

      {mode === "create" ? (
        <div className="rounded-lg border border-border bg-muted/30 p-4">
          <label className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Checkbox name="is_recurring" />
            Create recurring events
          </label>
          <div className="mt-3 grid min-w-0 gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="event-recurring_frequency" className="text-xs text-muted-foreground">
                Frequency
              </Label>
              <Select name="recurring_frequency" defaultValue="weekly">
                <SelectTrigger id="event-recurring_frequency" className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="event-recurring_count" className="text-xs text-muted-foreground">
                Occurrences
              </Label>
              <Input id="event-recurring_count" type="number" name="recurring_count" min={1} max={52} defaultValue={1} className="mt-1" />
            </div>
          </div>
        </div>
      ) : null}

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button type="reset" variant="outline">
          Reset
        </Button>
        <ChurchLoadingButton type="submit" className="gap-2" loadingLabel={mode === "edit" ? "Updating" : "Creating"}>
          {mode === "edit" ? <Save className="size-4" aria-hidden="true" /> : <CalendarPlus className="size-4" aria-hidden="true" />}
          {mode === "edit" ? "Update Event" : "Create Event"}
        </ChurchLoadingButton>
      </div>
    </form>
  );
}
