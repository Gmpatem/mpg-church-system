"use client";

import Link from "next/link";
import { useActionState } from "react";
import { ArrowLeft, ArrowRight, CalendarPlus, Edit3, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ChurchActionFeedback,
  ChurchLoadingButton,
} from "@/components/church-workspace/feedback";
import { deleteEventAction, updateEventStatusAction } from "@/features/events/actions";
import { getEventTypeLabel } from "@/features/events/presentation";
import type {
  EventDetailsViewModel,
  EventDialogIntent,
  EventRegistryRow,
  EventsWorkspaceData,
} from "@/features/events/types";
import {
  EmptyWorkspacePanel,
  EventDateLine,
  EventDepartmentBadges,
  EventLocationLine,
  EventStatusBadge,
  EventWorkflowBadge,
} from "./shared";

export function EventsRegistryTab({
  churchSlug,
  data,
  onDialogChange,
}: {
  churchSlug: string;
  data: EventsWorkspaceData;
  onDialogChange: (dialog: EventDialogIntent) => void;
}) {
  return (
    <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="min-w-0 rounded-lg border border-border bg-background shadow-sm">
        <RegistryToolbar churchSlug={churchSlug} data={data} />
        <Separator />
        <EventsTable churchSlug={churchSlug} data={data} />
        <Separator />
        <RegistryPagination churchSlug={churchSlug} data={data} />
      </div>

      <EventDetailsRail
        churchSlug={churchSlug}
        event={data.selectedEvent}
        data={data}
        onDialogChange={onDialogChange}
      />
    </div>
  );
}

function RegistryToolbar({ churchSlug, data }: { churchSlug: string; data: EventsWorkspaceData }) {
  return (
    <form action={`/c/${churchSlug}/events`} className="min-w-0 p-4">
      <input type="hidden" name="tab" value="events" />
      <div className="grid min-w-0 gap-3 md:grid-cols-2 xl:grid-cols-[minmax(14rem,1fr)_repeat(3,minmax(10rem,12rem))]">
        <div className="min-w-0">
          <Label htmlFor="event-search" className="text-xs font-medium text-muted-foreground">
            Search
          </Label>
          <Input
            id="event-search"
            name="q"
            defaultValue={data.filters.q}
            placeholder="Title, type, location"
            className="mt-1 h-10"
          />
        </div>

        <FilterSelect label="Status" name="status" value={data.filters.status}>
          <SelectItem value="all">All statuses</SelectItem>
          <SelectItem value="scheduled">Scheduled</SelectItem>
          <SelectItem value="completed">Completed</SelectItem>
          <SelectItem value="cancelled">Cancelled</SelectItem>
        </FilterSelect>

        <FilterSelect label="Workflow" name="workflow" value={data.filters.workflow}>
          <SelectItem value="all">All workflows</SelectItem>
          <SelectItem value="draft">Draft</SelectItem>
          <SelectItem value="pending_approval">Awaiting approval</SelectItem>
          <SelectItem value="approved">Approved</SelectItem>
          <SelectItem value="published">Published</SelectItem>
          <SelectItem value="rejected">Rejected</SelectItem>
        </FilterSelect>

        <FilterSelect label="Event type" name="eventType" value={data.filters.eventType || "all"}>
          <SelectItem value="all">All types</SelectItem>
          {data.formOptions.eventTypes.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </FilterSelect>
      </div>

      <div className="mt-3 grid min-w-0 gap-3 md:grid-cols-2 md:items-end xl:grid-cols-[minmax(12rem,1fr)_repeat(3,minmax(9rem,11rem))_auto_auto]">
        <FilterSelect label="Department" name="departmentId" value={data.filters.departmentId || "all"}>
          <SelectItem value="all">All departments</SelectItem>
          {data.formOptions.departments.map((department) => (
            <SelectItem key={department.id} value={department.id}>
              {department.name}
            </SelectItem>
          ))}
        </FilterSelect>

        <div>
          <Label htmlFor="event-date-from" className="text-xs font-medium text-muted-foreground">
            From
          </Label>
          <Input id="event-date-from" name="dateFrom" type="date" defaultValue={data.filters.dateFrom} className="mt-1 h-10" />
        </div>

        <div>
          <Label htmlFor="event-date-to" className="text-xs font-medium text-muted-foreground">
            To
          </Label>
          <Input id="event-date-to" name="dateTo" type="date" defaultValue={data.filters.dateTo} className="mt-1 h-10" />
        </div>

        <FilterSelect label="Rows" name="pageSize" value={String(data.filters.pageSize)}>
          <SelectItem value="25">25</SelectItem>
          <SelectItem value="50">50</SelectItem>
          <SelectItem value="100">100</SelectItem>
        </FilterSelect>

        <Button type="submit" className="h-10">Apply</Button>
        <Button asChild type="button" variant="outline" className="h-10">
          <Link href={`/c/${churchSlug}/events?tab=events`}>Reset</Link>
        </Button>
      </div>
    </form>
  );
}

function FilterSelect({
  label,
  name,
  value,
  children,
}: {
  label: string;
  name: string;
  value: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0">
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      <Select name={name} defaultValue={value}>
        <SelectTrigger className="mt-1 h-10">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>{children}</SelectContent>
      </Select>
    </div>
  );
}

function EventsTable({ churchSlug, data }: { churchSlug: string; data: EventsWorkspaceData }) {
  if (data.registry.rows.length === 0) {
    return (
      <div className="p-4">
        <EmptyWorkspacePanel
          title="No events found"
          description="No event records match the current filters."
        >
          {data.permissions.canCreateEvents ? (
            <Button asChild className="gap-2">
              <Link href={`/c/${churchSlug}/events?tab=events&dialog=create`}>
                <CalendarPlus className="size-4" aria-hidden="true" />
                Create Event
              </Link>
            </Button>
          ) : null}
        </EmptyWorkspacePanel>
      </div>
    );
  }

  return (
    <div className="min-w-0">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="min-w-[16rem]">Event</TableHead>
            <TableHead className="min-w-[11rem]">Date</TableHead>
            <TableHead className="min-w-[10rem]">Departments</TableHead>
            <TableHead className="min-w-[8rem]">Status</TableHead>
            <TableHead className="min-w-[8rem]">Workflow</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.registry.rows.map((event) => {
            const isSelected = data.selectedEvent?.id === event.id;
            return (
              <TableRow key={event.id} data-state={isSelected ? "selected" : undefined}>
                <TableCell>
                  <Link
                    href={buildRegistryHref(churchSlug, data, { eventId: event.id, page: data.registry.page })}
                    className="block min-w-0"
                  >
                    <span className="block truncate font-medium text-foreground">{event.title}</span>
                    <span className="mt-1 block truncate text-xs text-muted-foreground">
                      {getEventTypeLabel(event.eventType, data.locale)}
                      {event.location ? ` - ${event.location}` : ""}
                    </span>
                  </Link>
                </TableCell>
                <TableCell>
                  <EventDateLine
                    start={event.startDateTime}
                    end={event.endDateTime}
                    isAllDay={event.isAllDay}
                    timezone={data.church.timezone}
                    locale={data.locale}
                  />
                </TableCell>
                <TableCell>
                  <EventDepartmentBadges departments={event.departments} limit={2} />
                </TableCell>
                <TableCell>
                  <EventStatusBadge status={event.status} locale={data.locale} />
                </TableCell>
                <TableCell>
                  <EventWorkflowBadge workflowState={event.workflowState} locale={data.locale} />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

function RegistryPagination({ churchSlug, data }: { churchSlug: string; data: EventsWorkspaceData }) {
  const { page, pageCount, total } = data.registry;
  const from = total === 0 ? 0 : (page - 1) * data.registry.pageSize + 1;
  const to = Math.min(total, page * data.registry.pageSize);

  return (
    <div className="flex min-w-0 flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
      <p className="text-sm text-muted-foreground">
        Showing {from}-{to} of {total}
      </p>
      <div className="flex items-center gap-2">
        <Button asChild variant="outline" size="sm" className="gap-2" aria-disabled={page <= 1}>
          <Link href={buildRegistryHref(churchSlug, data, { page: Math.max(1, page - 1) })}>
            <ArrowLeft className="size-4" aria-hidden="true" />
            Previous
          </Link>
        </Button>
        <span className="min-w-16 text-center text-sm text-muted-foreground">
          {pageCount === 0 ? 0 : page} / {pageCount}
        </span>
        <Button asChild variant="outline" size="sm" className="gap-2" aria-disabled={page >= pageCount || pageCount === 0}>
          <Link href={buildRegistryHref(churchSlug, data, { page: page >= pageCount ? page : page + 1 })}>
            Next
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </Button>
      </div>
    </div>
  );
}

function EventDetailsRail({
  churchSlug,
  event,
  data,
  onDialogChange,
}: {
  churchSlug: string;
  event: EventDetailsViewModel | null;
  data: EventsWorkspaceData;
  onDialogChange: (dialog: EventDialogIntent) => void;
}) {
  return (
    <aside className="min-w-0 rounded-lg border border-border bg-background p-4 shadow-sm xl:sticky xl:top-4 xl:self-start">
      {event ? (
        <div className="min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="truncate text-lg font-semibold text-foreground">{event.title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{getEventTypeLabel(event.eventType, data.locale)}</p>
            </div>
            {data.permissions.canEditEvents ? (
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="size-9 shrink-0"
                aria-label="Edit selected event"
                onClick={() => onDialogChange({ type: "edit", eventId: event.id })}
              >
                <Edit3 className="size-4" aria-hidden="true" />
              </Button>
            ) : null}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <EventStatusBadge status={event.status} locale={data.locale} />
            <EventWorkflowBadge workflowState={event.workflowState} locale={data.locale} />
          </div>

          <div className="mt-4 flex flex-col gap-3">
            <EventDateLine
              start={event.startDateTime}
              end={event.endDateTime}
              isAllDay={event.isAllDay}
              timezone={data.church.timezone}
              locale={data.locale}
            />
            <EventLocationLine location={event.location} />
            <EventDepartmentBadges departments={event.departments} limit={8} />
          </div>

          {event.description ? (
            <>
              <Separator className="my-4" />
              <p className="whitespace-pre-line text-sm leading-6 text-foreground">{event.description}</p>
            </>
          ) : null}

          {event.approval || event.approvalLoadError ? (
            <>
              <Separator className="my-4" />
              <div className="rounded-lg border border-border bg-muted/30 p-3">
                <h3 className="text-sm font-semibold text-foreground">Approval</h3>
                {event.approval ? (
                  <dl className="mt-3 grid gap-2 text-sm">
                    <DetailRow label="Status" value={event.approval.status} />
                    <DetailRow label="Stage" value={event.approval.currentStage} />
                    <DetailRow label="Priority" value={event.approval.priority} />
                  </dl>
                ) : (
                  <p className="mt-2 text-sm text-muted-foreground">{event.approvalLoadError}</p>
                )}
              </div>
            </>
          ) : null}

          {data.permissions.canChangeStatus ? (
            <>
              <Separator className="my-4" />
              <StatusUpdateForm churchSlug={churchSlug} event={event} />
            </>
          ) : null}

          {data.permissions.canDeleteEvents ? (
            <>
              <Separator className="my-4" />
              <DeleteEventForm churchSlug={churchSlug} event={event} />
            </>
          ) : null}
        </div>
      ) : (
        <EmptyWorkspacePanel
          title="Select an event"
          description="Choose a registry row to inspect details, workflow state, departments, and actions."
        />
      )}
    </aside>
  );
}

function DetailRow({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="min-w-0 truncate font-medium text-foreground">{value || "-"}</dd>
    </div>
  );
}

function StatusUpdateForm({ churchSlug, event }: { churchSlug: string; event: EventRegistryRow }) {
  const [state, formAction] = useActionState(updateEventStatusAction, null);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="churchSlug" value={churchSlug} />
      <input type="hidden" name="eventId" value={event.id} />
      <Label className="text-xs font-medium text-muted-foreground">Operational status</Label>
      <Select name="status" defaultValue={event.status}>
        <SelectTrigger className="h-10">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="scheduled">Scheduled</SelectItem>
          <SelectItem value="completed">Completed</SelectItem>
          <SelectItem value="cancelled">Cancelled</SelectItem>
        </SelectContent>
      </Select>
      {state?.error ? <ChurchActionFeedback variant="error" title={state.error} /> : null}
      {state?.ok && state.message ? <ChurchActionFeedback variant="success" title={state.message} /> : null}
      <ChurchLoadingButton type="submit" variant="outline" loadingLabel="Updating">
        Update status
      </ChurchLoadingButton>
    </form>
  );
}

function DeleteEventForm({ churchSlug, event }: { churchSlug: string; event: EventRegistryRow }) {
  const [state, formAction] = useActionState(deleteEventAction, null);

  return (
    <form
      action={formAction}
      className="flex flex-col gap-3"
      onSubmit={(submitEvent) => {
        if (!window.confirm(`Delete ${event.title}? This cannot be undone.`)) {
          submitEvent.preventDefault();
        }
      }}
    >
      <input type="hidden" name="churchSlug" value={churchSlug} />
      <input type="hidden" name="eventId" value={event.id} />
      {state?.error ? <ChurchActionFeedback variant="error" title={state.error} /> : null}
      <ChurchLoadingButton type="submit" variant="destructive" className="gap-2" loadingLabel="Deleting">
        <Trash2 className="size-4" aria-hidden="true" />
        Delete event
      </ChurchLoadingButton>
    </form>
  );
}

function buildRegistryHref(
  churchSlug: string,
  data: EventsWorkspaceData,
  overrides: { page?: number; eventId?: string | null }
) {
  const params = new URLSearchParams();
  params.set("tab", "events");
  if (data.filters.q) params.set("q", data.filters.q);
  if (data.filters.status !== "all") params.set("status", data.filters.status);
  if (data.filters.workflow !== "all") params.set("workflow", data.filters.workflow);
  if (data.filters.eventType) params.set("eventType", data.filters.eventType);
  if (data.filters.departmentId) params.set("departmentId", data.filters.departmentId);
  if (data.filters.dateFrom) params.set("dateFrom", data.filters.dateFrom);
  if (data.filters.dateTo) params.set("dateTo", data.filters.dateTo);
  if (data.filters.pageSize !== 25) params.set("pageSize", String(data.filters.pageSize));
  const page = overrides.page ?? data.filters.page;
  if (page > 1) params.set("page", String(page));
  const eventId = overrides.eventId === undefined ? data.selectedEvent?.id : overrides.eventId;
  if (eventId) params.set("eventId", eventId);
  return `/c/${churchSlug}/events?${params.toString()}`;
}
