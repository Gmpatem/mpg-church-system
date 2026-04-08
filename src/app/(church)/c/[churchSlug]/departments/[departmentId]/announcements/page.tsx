import Link from "next/link";
import { notFound } from "next/navigation";
import {
  archiveDepartmentAnnouncementAction,
  createDepartmentAnnouncementAction,
  publishDepartmentAnnouncementAction,
} from "@/features/department-announcements/actions";
import { getDepartmentAnnouncements } from "@/features/department-announcements/queries";
import { requireChurchAccess } from "@/features/access/queries";
import { WorkspaceSectionCard } from "@/components/workspace";
import { getLabel } from "@/lib/display-maps";

interface DepartmentAnnouncementsPageProps {
  params: Promise<{ churchSlug: string; departmentId: string }>;
}

const announcementStatusLabels: Record<string, string> = {
  draft: "Draft",
  pending_approval: "Awaiting Approval",
  published: "Published",
  archived: "Archived",
  rejected: "Not Approved",
};

const audienceScopeLabels: Record<string, string> = {
  department_members: "Department Members",
  leaders_only: "Leaders Only",
  selected_members: "Selected Members",
};

function statusClasses(status: string) {
  switch (status) {
    case "published":
      return "bg-emerald-50 text-emerald-700";
    case "draft":
      return "bg-slate-100 text-slate-700";
    case "pending_approval":
      return "bg-amber-50 text-amber-700";
    case "archived":
      return "bg-slate-100 text-slate-600";
    case "rejected":
      return "bg-red-50 text-red-700";
    default:
      return "bg-slate-100 text-slate-700";
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
          <h2 className="text-2xl font-bold text-slate-900">{department.department_name} Announcements</h2>
          <p className="mt-1 text-sm text-slate-600">
            Publish department-specific updates, reminders, and coordination notices.
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
          title="Create Department Announcement"
          description="Draft updates for department members, then publish when ready."
        >
          <form action={createDepartmentAnnouncementAction} className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
              <label htmlFor="audienceScope" className="mb-1 block text-sm font-medium text-slate-700">
                Audience
              </label>
              <select
                id="audienceScope"
                name="audienceScope"
                defaultValue="department_members"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-ring"
              >
                <option value="department_members">Department Members</option>
                <option value="leaders_only">Leaders Only</option>
                <option value="selected_members">Selected Members</option>
              </select>
            </div>

            <div>
              <label htmlFor="expiresAt" className="mb-1 block text-sm font-medium text-slate-700">
                Expires At
              </label>
              <input
                id="expiresAt"
                name="expiresAt"
                type="datetime-local"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-ring"
              />
            </div>

            <label className="mt-7 flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" name="requiresAcknowledgement" className="h-4 w-4" />
              Requires acknowledgement
            </label>

            <div className="md:col-span-2">
              <label htmlFor="body" className="mb-1 block text-sm font-medium text-slate-700">
                Announcement Body
              </label>
              <textarea
                id="body"
                name="body"
                required
                rows={5}
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
        title="Announcements"
        description="Department announcements visible to assigned members."
      >
        {announcements.length === 0 ? (
          <p className="text-sm text-slate-500">No department announcements found yet.</p>
        ) : (
          <div className="divide-y divide-slate-200">
            {announcements.map((announcement) => (
              <div key={announcement.id} className="py-5 first:pt-0 last:pb-0">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-semibold text-slate-900">{announcement.title}</h3>
                      <span className={"rounded-full px-2.5 py-1 text-xs font-medium " + statusClasses(announcement.status)}>
                        {getLabel(announcementStatusLabels, announcement.status)}
                      </span>
                      <span className="rounded-full bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-700">
                        {getLabel(audienceScopeLabels, announcement.audience_scope)}
                      </span>
                    </div>

                    <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{announcement.body}</p>

                    <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-slate-500">
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
                            className="rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700 transition hover:bg-emerald-100"
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
                            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
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
      </WorkspaceSectionCard>
    </div>
  );
}
