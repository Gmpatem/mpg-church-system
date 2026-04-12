import Link from "next/link";
import {
  archiveChurchAnnouncementAction,
  createChurchAnnouncementAction,
  publishChurchAnnouncementAction,
} from "@/features/announcements/actions";
import {
  getAnnouncementDepartments,
  getChurchAnnouncements,
} from "@/features/announcements/queries";
import { requireChurchAccess } from "@/features/access/queries";
import { WorkspaceHero, WorkspaceSectionCard } from "@/components/workspace";
import { getLabel } from "@/lib/display-maps";

interface AnnouncementsPageProps {
  params: Promise<{ churchSlug: string }>;
}

const announcementStatusLabels: Record<string, string> = {
  draft: "Draft",
  pending_approval: "Awaiting Approval",
  published: "Published",
  archived: "Archived",
  rejected: "Not Approved",
};

const audienceScopeLabels: Record<string, string> = {
  church_wide: "Church Wide",
  leaders_only: "Leaders Only",
  members_only: "Members Only",
  department_members: "Department Members",
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

export default async function AnnouncementsPage({ params }: AnnouncementsPageProps) {
  const { churchSlug } = await params;
  const ctx = await requireChurchAccess(churchSlug);

  const [announcements, departments] = await Promise.all([
    getChurchAnnouncements(churchSlug),
    getAnnouncementDepartments(churchSlug),
  ]);

  const canManage =
    ctx.roles.includes("platform_owner") ||
    ctx.roles.includes("platform_admin") ||
    ctx.roles.includes("platform_support") ||
    ctx.roles.includes("church_admin") ||
    ctx.roles.includes("pastor") ||
    ctx.roles.includes("elder") ||
    ctx.roles.includes("clerk") ||
    ctx.roles.includes("church_secretary");

  return (
    <div className="space-y-6">
      <WorkspaceHero
        size="compact"
        eyebrow="Announcements"
        title="Announcements"
        description="Publish church-wide notices and keep members informed."
      />

      {canManage ? (
        <WorkspaceSectionCard
          title="Create Announcement"
          description="Save as draft first, then submit for approval when ready."
        >
          <form action={createChurchAnnouncementAction} className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <input type="hidden" name="churchSlug" value={churchSlug} />

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
                defaultValue="church_wide"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-ring"
              >
                <option value="church_wide">Church-wide</option>
                <option value="leaders_only">Leaders only</option>
                <option value="members_only">Members only</option>
                <option value="department_members">Department members</option>
              </select>
            </div>

            <div>
              <label htmlFor="departmentId" className="mb-1 block text-sm font-medium text-slate-700">
                Related Department
              </label>
              <select
                id="departmentId"
                name="departmentId"
                defaultValue=""
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-ring"
              >
                <option value="">No specific department</option>
                {departments.map((department) => (
                  <option key={department.id} value={department.id}>
                    {department.department_name}
                  </option>
                ))}
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

      <WorkspaceSectionCard title="Announcements" description="Recent church and department notices.">
        {announcements.length === 0 ? (
          <p className="text-sm text-slate-500">No announcements found yet.</p>
        ) : (
          <div className="space-y-3">
            {announcements.map((announcement) => (
              <div key={announcement.id} className="rounded-2xl border border-slate-200 p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-semibold text-slate-900">{announcement.title}</h3>
                      <span className={"rounded-full px-2.5 py-1 text-xs font-medium " + statusClasses(announcement.status)}>
                        {getLabel(announcementStatusLabels, announcement.status)}
                      </span>
                      <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                        {getLabel(audienceScopeLabels, announcement.audience_scope)}
                      </span>
                      {announcement.department_name ? (
                        <span className="rounded-full bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-700">
                          {announcement.department_name}
                        </span>
                      ) : null}
                    </div>

                    <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{announcement.body}</p>

                    <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                      <span>Created by: {announcement.created_by_name ?? "Unknown"}</span>
                      <span>Created: {announcement.created_at ?? "—"}</span>
                      <span>Published: {announcement.published_at ?? "—"}</span>
                      {announcement.expires_at ? <span>Expires: {announcement.expires_at}</span> : null}
                    </div>
                  </div>

                  {canManage ? (
                    <div className="flex items-center gap-2">
                      {announcement.status === "pending_approval" ? (
                        <span className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700">
                          Awaiting Approval
                        </span>
                      ) : null}

                      {announcement.status !== "published" && announcement.status !== "pending_approval" ? (
                        <form action={publishChurchAnnouncementAction}>
                          <input type="hidden" name="churchSlug" value={churchSlug} />
                          <input type="hidden" name="announcementId" value={announcement.id} />
                          <button
                            type="submit"
                            className="rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700 transition hover:bg-emerald-100"
                          >
                            Submit for Approval
                          </button>
                        </form>
                      ) : null}

                      {announcement.status !== "archived" ? (
                        <form action={archiveChurchAnnouncementAction}>
                          <input type="hidden" name="churchSlug" value={churchSlug} />
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
