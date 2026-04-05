import Link from "next/link";
import {
  getApprovalReviewLabel,
  getApprovalStageLabel,
  getApprovalStatusLabel,
} from "@/features/approvals/presentation";

interface ApprovalsInboxProps {
  churchSlug: string;
  data: {
    church: {
      id: string;
      slug: string;
      name: string;
    };
    items: Array<{
      id: string;
      moduleKey: string;
      moduleLabel: string;
      entityType: string;
      entityId: string;
      requestType: string;
      displayTitle: string;
      currentStage: string;
      status: string;
      priority: string;
      currentAssigneeRoleCode: string | null;
      payload: Record<string, unknown>;
      submittedAt: string;
      decidedAt: string | null;
      decidedByUserId: string | null;
      decisionNote: string | null;
      submittedByUserId: string | null;
      submittedByName: string | null;
      href: string;
    }>;
    summary: Record<string, number>;
    filters: {
      module: string;
      status: string;
      stage: string;
    };
  };
}

function formatDate(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString();
}

function badgeClass(status: string) {
  if (status === "approved") return "bg-emerald-100 text-emerald-800";
  if (status === "rejected") return "bg-rose-100 text-rose-800";
  if (status === "changes_requested") return "bg-amber-100 text-amber-800";
  if (status === "cancelled") return "bg-zinc-100 text-zinc-800";
  return "bg-blue-100 text-blue-800";
}




function getStageBadgeClass(stage: string) {
  if (stage === "office_review") return "bg-cyan-100 text-cyan-800";
  if (stage === "leadership_review") return "bg-violet-100 text-violet-800";
  if (stage === "treasury_review") return "bg-amber-100 text-amber-800";
  if (stage === "approved") return "bg-emerald-100 text-emerald-800";
  if (stage === "rejected") return "bg-rose-100 text-rose-800";
  if (stage === "changes_requested") return "bg-orange-100 text-orange-800";
  return "bg-slate-100 text-slate-700";
}
function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function buildFilterHref(
  churchSlug: string,
  filters: { module: string; status: string; stage: string },
  patch: Partial<{ module: string; status: string; stage: string }>
) {
  const next = {
    module: patch.module ?? filters.module ?? "",
    status: patch.status ?? filters.status ?? "",
    stage: patch.stage ?? filters.stage ?? "",
  };

  const params = new URLSearchParams();
  if (next.module) params.set("module", next.module);
  if (next.status) params.set("status", next.status);
  if (next.stage) params.set("stage", next.stage);

  const query = params.toString();
  return query ? `/c/${churchSlug}/approvals?${query}` : `/c/${churchSlug}/approvals`;
}

export function ApprovalsInbox({ churchSlug, data }: ApprovalsInboxProps) {
  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-gradient-to-br from-slate-950 via-blue-950 to-cyan-950 p-6 text-white shadow-sm">
        <div className="max-w-3xl">
          <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-blue-100">
            Approvals Inbox
          </span>
          <h1 className="mt-4 text-3xl font-bold tracking-tight md:text-4xl">
            Unified Governance Queue
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-blue-100">
            Review pending and completed approval requests across events, announcements, access, leadership, and future approval lanes.
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <SummaryCard label="Total" value={data.summary.total ?? 0} />
        <SummaryCard label="Pending" value={data.summary.pending ?? 0} />
        <SummaryCard label="Approved" value={data.summary.approved ?? 0} />
        <SummaryCard label="Rejected" value={data.summary.rejected ?? 0} />
        <SummaryCard label="Changes Requested" value={data.summary.changes_requested ?? 0} />
        <SummaryCard label="Cancelled" value={data.summary.cancelled ?? 0} />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap gap-2">
          <Link
            href={buildFilterHref(churchSlug, data.filters, { module: "", status: "", stage: "" })}
            className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            All
          </Link>
          <Link
            href={buildFilterHref(churchSlug, data.filters, { status: "pending" })}
            className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Pending Only
          </Link>
          <Link
            href={buildFilterHref(churchSlug, data.filters, { module: "events" })}
            className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Events
          </Link>
          <Link
            href={buildFilterHref(churchSlug, data.filters, { module: "announcements" })}
            className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Announcements
          </Link>
          <Link
            href={buildFilterHref(churchSlug, data.filters, { module: "access" })}
            className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Access
          </Link>
          <Link
            href={buildFilterHref(churchSlug, data.filters, { module: "leadership" })}
            className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Leadership
          </Link>
        </div>
      </div>

      {data.items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">
          No approval requests found yet.
        </div>
      ) : (
        <div className="space-y-4">
          {data.items.map((item) => (
            <div key={item.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-slate-950">{item.displayTitle}</p>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${badgeClass(item.status)}`}>
                      {getApprovalStatusLabel(item.status)}
                    </span>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${getStageBadgeClass(item.currentStage)}`}>
                      {getApprovalStageLabel(item.currentStage)}
                    </span>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                      {item.moduleLabel}
                    </span>
                  </div>

                  <div className="grid gap-1 text-sm text-slate-600 sm:grid-cols-2">
                    <p>
                      Request type: <span className="font-medium text-slate-950">{getApprovalStageLabel(item.requestType)}</span>
                    </p>
                    <p>
                      Stage: <span className="font-medium text-slate-950">{getApprovalStageLabel(item.currentStage)}</span>
                    </p>
                    <p>
                      Priority: <span className="font-medium text-slate-950">{item.priority}</span>
                    </p>
                    <p>
                      Assignee role: <span className="font-medium text-slate-950">{item.currentAssigneeRoleCode ?? "—"}</span>
                    </p>
                    <p>
                      Submitted by: <span className="font-medium text-slate-950">{item.submittedByName ?? "—"}</span>
                    </p>
                    <p>
                      Submitted at: <span className="font-medium text-slate-950">{formatDate(item.submittedAt)}</span>
                    </p>
                  </div>

                  {item.decisionNote ? (
                    <div className="rounded-xl bg-slate-50 p-3 text-sm text-slate-600">
                      Decision note: <span className="font-medium text-slate-950">{item.decisionNote}</span>
                    </div>
                  ) : null}
                </div>

                <div className="flex flex-wrap gap-2">
                  <Link
                    href={item.href}
                    className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800"
                  >
                    {getApprovalReviewLabel(item.moduleKey)}
                  </Link>
                  <Link
                    href={item.href}
                    className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Open Source
                  </Link>
                  <Link
                    href={`/c/${churchSlug}/office`}
                    className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Office
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}




