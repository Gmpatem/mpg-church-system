import {
  AlertCircle,
  CheckCircle2,
  Clock,
  MessageCircle,
} from "lucide-react";
import {
  createPlatformSupportTicketAction,
  updatePlatformSupportTicketStatusAction,
} from "@/features/platform/actions";
import { getPlatformChurches, getPlatformSupportTickets } from "@/features/platform/queries";

function StatCard({
  title,
  value,
  description,
  icon: Icon,
}: {
  title: string;
  value: number | string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-4">
        <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          <p className="text-xs text-gray-500">{description}</p>
        </div>
      </div>
    </div>
  );
}

function statusClass(status: string) {
  switch (status) {
    case "open":
      return "bg-blue-50 text-blue-700";
    case "in_progress":
      return "bg-yellow-50 text-yellow-700";
    case "resolved":
      return "bg-green-50 text-green-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
}

function priorityClass(priority: string) {
  switch (priority) {
    case "low":
      return "bg-gray-100 text-gray-700";
    case "medium":
      return "bg-blue-100 text-blue-700";
    case "high":
      return "bg-orange-100 text-orange-700";
    default:
      return "bg-red-100 text-red-700";
  }
}

export default async function PlatformSupportPage() {
  const tickets = await getPlatformSupportTickets();
  const churches = await getPlatformChurches();

  const openCount = tickets.filter((t: any) => t.status === "open").length;
  const inProgressCount = tickets.filter((t: any) => t.status === "in_progress").length;
  const resolvedCount = tickets.filter((t: any) => t.status === "resolved" || t.status === "closed").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Support Tickets</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage and respond to church support requests across the platform.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <StatCard title="Total Tickets" value={tickets.length} description="All visible support requests" icon={MessageCircle} />
        <StatCard title="Open" value={openCount} description="Waiting for response or triage" icon={Clock} />
        <StatCard title="In Progress" value={inProgressCount} description="Actively being worked on" icon={AlertCircle} />
        <StatCard title="Resolved" value={resolvedCount} description="Completed or closed tickets" icon={CheckCircle2} />
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Create Ticket</h2>

        <form action={createPlatformSupportTicketAction} className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium text-gray-700">Subject</label>
            <input
              name="subject"
              required
              className="h-10 w-full rounded-md border border-gray-300 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Church</label>
            <select
              name="church_id"
              className="h-10 w-full rounded-md border border-gray-300 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">No specific church</option>
              {churches.map((church: any) => (
                <option key={church.id} value={church.id}>
                  {church.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Priority</label>
            <select
              name="priority"
              defaultValue="medium"
              className="h-10 w-full rounded-md border border-gray-300 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium text-gray-700">Description</label>
            <textarea
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
              Create Ticket
            </button>
          </div>
        </form>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Ticket</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Church</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Status</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Priority</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Created</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Requested By</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Update</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {tickets.map((ticket: any) => (
                <tr key={ticket.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{ticket.subject}</p>
                      <p className="mt-1 text-xs text-gray-500">{ticket.description ?? "No description"}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{ticket.churches?.name ?? "Platform"}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className={"rounded-full px-2.5 py-1 text-xs font-medium " + statusClass(ticket.status)}>
                      {ticket.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className={"rounded-full px-2.5 py-1 text-xs font-medium " + priorityClass(ticket.priority)}>
                      {ticket.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {ticket.created_at ? new Date(ticket.created_at).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {ticket.requester?.full_name ?? ticket.requester?.email ?? "Unknown"}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <form action={updatePlatformSupportTicketStatusAction} className="flex items-center gap-2">
                      <input type="hidden" name="ticket_id" value={ticket.id} />
                      <select
                        name="status"
                        defaultValue={ticket.status}
                        className="h-9 rounded-md border border-gray-300 px-2 text-xs outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="open">Open</option>
                        <option value="in_progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                        <option value="closed">Closed</option>
                      </select>
                      <button
                        type="submit"
                        className="rounded-md border border-gray-300 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50"
                      >
                        Save
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
              {tickets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-sm text-gray-500">
                    No support tickets found yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
