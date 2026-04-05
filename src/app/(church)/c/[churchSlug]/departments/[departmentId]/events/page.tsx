import Link from "next/link";
import {
  approveDepartmentEventAction,
  createDepartmentEventDraftAction,
  rejectDepartmentEventAction,
  submitDepartmentEventForApprovalAction,
} from "@/features/department-events/actions";
import { getDepartmentEventsWorkflowData } from "@/features/department-events/queries";
import { requireChurchAccess } from "@/features/access/queries";

interface DepartmentEventsPageProps {
  params: Promise<{ churchSlug: string; departmentId: string }>;
}

function workflowClasses(workflowState: string) {
  switch (workflowState) {
    case "draft":
      return "bg-gray-100 text-gray-700";
    case "pending_approval":
      return "bg-yellow-50 text-yellow-700";
    case "approved":
      return "bg-green-50 text-green-700";
    case "published":
      return "bg-blue-50 text-blue-700";
    case "rejected":
      return "bg-red-50 text-red-700";
    default:
      return "bg-gray-100 text-gray-700";
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
          <h2 className="text-2xl font-bold text-gray-900">{department.department_name} Events</h2>
          <p className="mt-1 text-sm text-gray-600">
            Draft, submit, and manage department activities before they reach the church calendar.
          </p>
        </div>

        <Link
          href={`/c/${churchSlug}/departments/${departmentId}`}
          className="text-sm text-blue-600 hover:text-blue-800 underline"
        >
          Back to Department
        </Link>
      </div>

      {canManage ? (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900">Create Department Event Draft</h3>
          <p className="mt-1 text-sm text-gray-600">
            Draft the activity here, then submit it for approval when ready.
          </p>

          <form action={createDepartmentEventDraftAction} className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
            <input type="hidden" name="churchSlug" value={churchSlug} />
            <input type="hidden" name="departmentId" value={departmentId} />

            <div className="md:col-span-2">
              <label htmlFor="title" className="mb-1 block text-sm font-medium text-gray-700">
                Title
              </label>
              <input
                id="title"
                name="title"
                required
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="eventType" className="mb-1 block text-sm font-medium text-gray-700">
                Event Type
              </label>
              <input
                id="eventType"
                name="eventType"
                defaultValue="department_activity"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="location" className="mb-1 block text-sm font-medium text-gray-700">
                Location
              </label>
              <input
                id="location"
                name="location"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="startDateTime" className="mb-1 block text-sm font-medium text-gray-700">
                Start
              </label>
              <input
                id="startDateTime"
                name="startDateTime"
                type="datetime-local"
                required
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="endDateTime" className="mb-1 block text-sm font-medium text-gray-700">
                End
              </label>
              <input
                id="endDateTime"
                name="endDateTime"
                type="datetime-local"
                required
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <label className="mt-7 flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" name="isAllDay" className="h-4 w-4" />
              All day event
            </label>

            <div className="md:col-span-2">
              <label htmlFor="description" className="mb-1 block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                rows={4}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="md:col-span-2">
              <button
                type="submit"
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Save Draft
              </button>
            </div>
          </form>
        </div>
      ) : null}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {events.length === 0 ? (
          <div className="px-6 py-10 text-sm text-gray-600">
            No department events found yet.
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {events.map((event) => (
              <div key={event.id} className="px-6 py-5">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-semibold text-gray-900">{event.title}</h3>
                      <span className={"rounded-full px-2.5 py-1 text-xs font-medium " + workflowClasses(event.workflow_state)}>
                        {event.workflow_state}
                      </span>
                      <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                        {event.event_type}
                      </span>
                    </div>

                    {event.description ? (
                      <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700">{event.description}</p>
                    ) : null}

                    <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-gray-500">
                      <span>Start: {event.start_datetime}</span>
                      <span>End: {event.end_datetime}</span>
                      <span>Status: {event.status}</span>
                      {event.location ? <span>Location: {event.location}</span> : null}
                    </div>

                    {event.approval_note ? (
                      <div className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
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
                            className="rounded-md border border-yellow-300 bg-yellow-50 px-3 py-2 text-xs font-medium text-yellow-700 hover:bg-yellow-100"
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
                              className="rounded-md border border-green-300 bg-green-50 px-3 py-2 text-xs font-medium text-green-700 hover:bg-green-100"
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
                              className="rounded-md border border-gray-300 px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <button
                              type="submit"
                              className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-xs font-medium text-red-700 hover:bg-red-100"
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
      </div>
    </div>
  );
}
