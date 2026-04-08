import Link from "next/link";
import {
  approveDepartmentEventAction,
  createDepartmentEventDraftAction,
  rejectDepartmentEventAction,
  submitDepartmentEventForApprovalAction,
} from "@/features/department-events/actions";
import { getDepartmentEventsWorkflowData } from "@/features/department-events/queries";
import { requireChurchAccess } from "@/features/access/queries";
import { WorkspaceSectionCard } from "@/components/workspace";
import { getLabel, eventStatusLabels, workflowStateLabels } from "@/lib/display-maps";

interface DepartmentEventsPageProps {
  params: Promise<{ churchSlug: string; departmentId: string }>;
}

const eventTypeLabels: Record<string, string> = {
  worship_service: "Worship Service",
  prayer_meeting: "Prayer Meeting",
  board_meeting: "Board Meeting",
  department_meeting: "Department Meeting",
  department_activity: "Department Activity",
  youth_meeting: "Youth Meeting",
  evangelism: "Evangelism",
  youth_program: "Youth Program",
  sabbath_school: "Sabbath School",
  community_outreach: "Community Outreach",
  special_program: "Special Program",
  outreach: "Outreach",
  seminar: "Seminar",
  social: "Social Event",
  fundraiser: "Fundraiser",
  other: "Other",
};

function workflowClasses(workflowState: string) {
  switch (workflowState) {
    case "draft":
      return "bg-slate-100 text-slate-700";
    case "pending_approval":
      return "bg-amber-50 text-amber-700";
    case "approved":
      return "bg-emerald-50 text-emerald-700";
    case "published":
      return "bg-blue-50 text-blue-700";
    case "rejected":
      return "bg-red-50 text-red-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

export default async function DepartmentEventsPage({ params }: DepartmentEventsPageProps) {
  const { churchSlug, departmentId } = await params;
  const ctx = await requireChurchAccess(churchSlug);
  const { department, events } = await getDepartmentEventsWorkflowData(churchSlug, departmentId);

  if (!department) {
    return (
      <div className="rounded-xl border border-dashed border-red-300 bg-red-50 px-6 py-10 text-sm text-red-700">
        Department not found.
      </div>
    );
  }

  const canManage =
    ctx.roles.includes("platform_owner") ||
    ctx.roles.includes("platform_admin") ||
    ctx.roles.includes("platform_support") ||
    ctx.roles.includes("church_admin") ||
    ctx.roles.includes("pastor") ||
    ctx.roles.includes("elder") ||
    ctx.roles.includes("clerk");

  const canApprove =
    ctx.roles.includes("church_admin") ||
    ctx.roles.includes("pastor");

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">{department.department_name} Events</h2>
          <p className="mt-1 text-sm text-slate-600">
            Draft, submit, and manage department activities before they reach the church calendar.
          </p>
        </div>

        <Link
          href={`/c/${churchSlug}/departments/${departmentId}`}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          Back to Department
        </Link>
      </div>

      {canManage ? (
        <WorkspaceSectionCard
          title="Create Department Event Draft"
          description="Draft the activity here, then submit it for approval when ready."
        >
          <form action={createDepartmentEventDraftAction} className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <input type="hidden" name="churchSlug" value={churchSlug} />
            <input type="hidden" name="departmentId" value={departmentId} />

            <div className="md:col-span-2">
              <label htmlFor="title" className="mb-1 block text-sm font-medium text-slate-700">
                Title
              </label>
              <input
                id="title"
                name="title"
                required
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-ring"
              />
            </div>

            <div>
              <label htmlFor="eventType" className="mb-1 block text-sm font-medium text-slate-700">
                Event Type
              </label>
              <input
                id="eventType"
                name="eventType"
                defaultValue="department_activity"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-ring"
              />
            </div>

            <div>
              <label htmlFor="location" className="mb-1 block text-sm font-medium text-slate-700">
                Location
              </label>
              <input
                id="location"
                name="location"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-ring"
              />
            </div>

            <div>
              <label htmlFor="startDateTime" className="mb-1 block text-sm font-medium text-slate-700">
                Start
              </label>
              <input
                id="startDateTime"
                name="startDateTime"
                type="datetime-local"
                required
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-ring"
              />
            </div>

            <div>
              <label htmlFor="endDateTime" className="mb-1 block text-sm font-medium text-slate-700">
                End
              </label>
              <input
                id="endDateTime"
                name="endDateTime"
                type="datetime-local"
                required
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-ring"
              />
            </div>

            <label className="mt-7 flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" name="isAllDay" className="h-4 w-4" />
              All day event
            </label>

            <div className="md:col-span-2">
              <label htmlFor="description" className="mb-1 block text-sm font-medium text-slate-700">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                rows={4}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-ring"
              />
            </div>

            <div className="md:col-span-2">
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-xl bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
              >
                Save Draft
              </button>
            </div>
          </form>
        </WorkspaceSectionCard>
      ) : null}

      <WorkspaceSectionCard
        title="Department Events"
        description="Events submitted or approved for this department."
      >
        {events.length === 0 ? (
          <p className="text-sm text-slate-500">No department events found yet.</p>
        ) : (
          <div className="divide-y divide-slate-200">
            {events.map((event) => (
              <div key={event.id} className="py-5 first:pt-0 last:pb-0">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-semibold text-slate-900">{event.title}</h3>
                      <span className={"rounded-full px-2.5 py-1 text-xs font-medium " + workflowClasses(event.workflow_state)}>
                        {getLabel(workflowStateLabels, event.workflow_state)}
                      </span>
                      <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                        {getLabel(eventTypeLabels, event.event_type)}
                      </span>
                    </div>

                    {event.description ? (
                      <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{event.description}</p>
                    ) : null}

                    <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-slate-500">
                      <span>Start: {event.start_datetime}</span>
                      <span>End: {event.end_datetime}</span>
                      <span>Status: {getLabel(eventStatusLabels, event.status)}</span>
                      {event.location ? <span>Location: {event.location}</span> : null}
                    </div>

                    {event.approval_note ? (
                      <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                        Approval note: {event.approval_note}
                      </div>
                    ) : null}
                  </div>

                  {canManage ? (
                    <div className="flex flex-wrap items-center gap-2">
                      {event.workflow_state === "draft" ? (
                        <form action={submitDepartmentEventForApprovalAction}>
                          <input type="hidden" name="churchSlug" value={churchSlug} />
                          <input type="hidden" name="departmentId" value={departmentId} />
                          <input type="hidden" name="eventId" value={event.id} />
                          <button
                            type="submit"
                            className="rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700 transition hover:bg-amber-100"
                          >
                            Submit for Approval
                          </button>
                        </form>
                      ) : null}

                      {canApprove && event.workflow_state === "pending_approval" ? (
                        <>
                          <form action={approveDepartmentEventAction}>
                            <input type="hidden" name="churchSlug" value={churchSlug} />
                            <input type="hidden" name="departmentId" value={departmentId} />
                            <input type="hidden" name="eventId" value={event.id} />
                            <button
                              type="submit"
                              className="rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700 transition hover:bg-emerald-100"
                            >
                              Approve
                            </button>
                          </form>

                          <form action={rejectDepartmentEventAction} className="flex items-center gap-2">
                            <input type="hidden" name="churchSlug" value={churchSlug} />
                            <input type="hidden" name="departmentId" value={departmentId} />
                            <input type="hidden" name="eventId" value={event.id} />
                            <input
                              name="approvalNote"
                              placeholder="Reason for rejection"
                              className="rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none transition focus:ring-2 focus:ring-ring"
                            />
                            <button
                              type="submit"
                              className="rounded-xl border border-red-300 bg-red-50 px-3 py-2 text-xs font-medium text-red-700 transition hover:bg-red-100"
                            >
                              Reject
                            </button>
                          </form>
                        </>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </WorkspaceSectionCard>
    </div>
  );
}
