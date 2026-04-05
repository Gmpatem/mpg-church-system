import Link from "next/link";
import { notFound } from "next/navigation";
import { Building2, Church, FolderTree, Home, ShieldCheck, Users } from "lucide-react";
import { getPlatformChurchById } from "@/features/platform/queries";

function StatCard({
  title,
  value,
  icon: Icon,
  description,
}: {
  title: string;
  value: number | string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className="flex items-start justify-between">
        <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
          <Icon className="h-5 w-5" />
        </div>
      </div>

      <div className="mt-4">
        <p className="text-3xl font-bold text-gray-900">{value}</p>
        <p className="mt-1 text-sm font-medium text-gray-700">{title}</p>
        <p className="mt-1 text-xs text-gray-500">{description}</p>
      </div>
    </div>
  );
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex flex-col gap-1 border-b border-gray-100 py-3 last:border-b-0 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm font-medium text-gray-600">{label}</p>
      <p className="text-sm text-gray-900">{value || "—"}</p>
    </div>
  );
}

interface PageProps {
  params: Promise<{ churchId: string }>;
}

export default async function PlatformChurchDetailPage({ params }: PageProps) {
  const { churchId } = await params;
  const church = await getPlatformChurchById(churchId);

  if (!church) {
    notFound();
  }

  const memberCount = 0;
  const householdCount = 0;
  const departmentCount = 0;
  const userCount = 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="mb-3 flex items-center gap-3">
            <span
              className={
                church.is_active
                  ? "rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700"
                  : "rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600"
              }
            >
              {church.is_active ? "Active" : "Inactive"}
            </span>
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
              {church.default_language?.toUpperCase() ?? "EN"}
            </span>
          </div>

          <h1 className="text-2xl font-bold text-gray-900">{church.name}</h1>
          <p className="mt-1 text-sm text-gray-500">
            Platform-level visibility and control for this church workspace.
          </p>
          <p className="mt-2 text-sm text-gray-600">
            Slug: <span className="font-medium text-gray-900">{church.slug}</span>
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href="/platform/churches"
            className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            Back to churches
          </Link>
          <Link
            href={"/c/" + church.slug + "/dashboard"}
            className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Open workspace
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Members"
          value={memberCount}
          icon={Users}
          description="Registered members linked to this church"
        />
        <StatCard
          title="Households"
          value={householdCount}
          icon={Home}
          description="Household records currently assigned"
        />
        <StatCard
          title="Departments"
          value={departmentCount}
          icon={FolderTree}
          description="Church departments configured in the system"
        />
        <StatCard
          title="Users"
          value={userCount}
          icon={ShieldCheck}
          description="Authenticated users associated with this church"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-5">
              <h2 className="text-lg font-semibold text-gray-900">Church Profile</h2>
              <p className="mt-1 text-sm text-gray-500">
                Identity, language, timezone, and contact details for this tenant.
              </p>
            </div>

            <div>
              <DetailRow label="Church name" value={church.name ?? ""} />
              <DetailRow label="Slug" value={church.slug ?? ""} />
              <DetailRow label="Default language" value={church.default_language ?? ""} />
              <DetailRow label="Timezone" value={church.timezone ?? ""} />
              <DetailRow label="Email" value={church.email ?? ""} />
              <DetailRow label="Phone" value={church.phone ?? ""} />
              <DetailRow
                label="Location"
                value={[church.city, church.country].filter(Boolean).join(", ")}
              />
              <DetailRow label="Address" value={church.address ?? ""} />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
                <Church className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Workspace Status</h2>
                <p className="text-sm text-gray-500">Current platform-level church state</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Status</p>
                <p className="mt-2 text-sm font-medium text-gray-900">
                  {church.is_active ? "Active and available" : "Inactive or disabled"}
                </p>
              </div>

              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Created</p>
                <p className="mt-2 text-sm font-medium text-gray-900">
                  {church.created_at
                    ? new Date(church.created_at).toLocaleString()
                    : "—"}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Operational Summary</h2>
                <p className="text-sm text-gray-500">Quick health snapshot for this tenant</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="rounded-lg border border-gray-200 p-4">
                <p className="text-sm font-medium text-gray-900">Workspace readiness</p>
                <p className="mt-1 text-sm text-gray-500">
                  {departmentCount > 0 && memberCount > 0
                    ? "This church has core setup data and appears operational."
                    : "This church may still need setup work before full operational use."}
                </p>
              </div>

              <div className="rounded-lg border border-gray-200 p-4">
                <p className="text-sm font-medium text-gray-900">Admin visibility</p>
                <p className="mt-1 text-sm text-gray-500">
                  Platform owner can inspect church profile, open the workspace, and monitor tenant status from here.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

