import Link from "next/link";
import { notFound } from "next/navigation";
import {
  archiveDepartmentAnnouncementAction,
  createDepartmentAnnouncementAction,
  publishDepartmentAnnouncementAction,
} from "@/features/department-announcements/actions";
import { getDepartmentAnnouncements } from "@/features/department-announcements/queries";
import { requireChurchAccess } from "@/features/access/queries";

interface DepartmentAnnouncementsPageProps {
  params: Promise<{ churchSlug: string; departmentId: string }>;
}

function statusClasses(status: string) {
  switch (status) {
    case "published":
      return "bg-green-50 text-green-700";
    case "draft":
      return "bg-gray-100 text-gray-700";
    case "pending_approval":
      return "bg-yellow-50 text-yellow-700";
    case "archived":
      return "bg-slate-100 text-slate-700";
    case "rejected":
      return "bg-red-50 text-red-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
}

export default async function DepartmentAnnouncementsPage({ params }: DepartmentAnnouncementsPageProps) {
  const { churchSlug, departmentId } = await params;
  const ctx = await requireChurchAccess(churchSlug);

  const { department, announcements } = await getDepartmentAnnouncements(churchSlug, departmentId);

  if (!department) {
    notFound();
  }

  const canManage =
    ctx.roles.includes("platform_owner") ||
    ctx.roles.includes("platform_admin") ||
    ctx.roles.includes("platform_support") ||
    ctx.roles.includes("church_admin") ||
    ctx.roles.includes("pastor") ||
    ctx.roles.includes("elder") ||
    ctx.roles.includes("clerk");

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{department.department_name} Announcements</h2>
          <p className="mt-1 text-sm text-gray-600">
            Publish department-specific updates, reminders, and coordination notices.
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
          <h3 className="text-lg font-semibold text-gray-900">Create Department Announcement</h3>
          <p className="mt-1 text-sm text-gray-600">
            Draft updates for department members, then publish when ready.
          </p>

          <form action={createDepartmentAnnouncementAction} className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
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
              <label htmlFor="audienceScope" className="mb-1 block text-sm font-medium text-gray-700">
                Audience
              </label>
              <select
                id="audienceScope"
                name="audienceScope"
                defaultValue="department_members"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="department_members">Department members</option>
                <option value="leaders_only">Leaders only</option>
                <option value="selected_members">Selected members</option>
              </select>
            </div>

            <div>
              <label htmlFor="expiresAt" className="mb-1 block text-sm font-medium text-gray-700">
                Expires At
              </label>
              <input
                id="expiresAt"
                name="expiresAt"
                type="datetime-local"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <label className="mt-7 flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" name="requiresAcknowledgement" className="h-4 w-4" />
              Requires acknowledgement
            </label>

            <div className="md:col-span-2">
              <label htmlFor="body" className="mb-1 block text-sm font-medium text-gray-700">
                Announcement Body
              </label>
              <textarea
                id="body"
                name="body"
                required
                rows={5}
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
        {announcements.length === 0 ? (
          <div className="px-6 py-10 text-sm text-gray-600">
            No department announcements found yet.
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {announcements.map((announcement) => (
              <div key={announcement.id} className="px-6 py-5">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-semibold text-gray-900">{announcement.title}</h3>
                      <span className={"rounded-full px-2.5 py-1 text-xs font-medium " + statusClasses(announcement.status)}>
                        {announcement.status}
                      </span>
                      <span className="rounded-full bg-purple-50 px-2.5 py-1 text-xs font-medium text-purple-700">
                        {announcement.audience_scope}
                      </span>
                    </div>

                    <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700">{announcement.body}</p>

                    <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-gray-500">
                      <span>Created by: {announcement.created_by_name ?? "Unknown"}</span>
                      <span>Created: {announcement.created_at ?? "—"}</span>
                      <span>Published: {announcement.published_at ?? "—"}</span>
                      {announcement.expires_at ? <span>Expires: {announcement.expires_at}</span> : null}
                    </div>
                  </div>

                  {canManage ? (
                    <div className="flex items-center gap-2">
                      {announcement.status !== "published" ? (
                        <form action={publishDepartmentAnnouncementAction}>
                          <input type="hidden" name="churchSlug" value={churchSlug} />
                          <input type="hidden" name="departmentId" value={departmentId} />
                          <input type="hidden" name="announcementId" value={announcement.id} />
                          <button
                            type="submit"
                            className="rounded-md border border-green-300 bg-green-50 px-3 py-2 text-xs font-medium text-green-700 hover:bg-green-100"
                          >
                            Publish
                          </button>
                        </form>
                      ) : null}

                      {announcement.status !== "archived" ? (
                        <form action={archiveDepartmentAnnouncementAction}>
                          <input type="hidden" name="churchSlug" value={churchSlug} />
                          <input type="hidden" name="departmentId" value={departmentId} />
                          <input type="hidden" name="announcementId" value={announcement.id} />
                          <button
                            type="submit"
                            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
                          >
                            Archive
                          </button>
                        </form>
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
