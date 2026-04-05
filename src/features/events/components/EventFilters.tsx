import Link from "next/link";

interface EventFiltersProps {
  churchSlug: string;
  departments: Array<{ id: string; name: string; code: string | null; is_active: boolean }>;
  eventTypes: string[];
  filters: {
    q: string;
    status: string;
    eventType: string;
    departmentId: string;
    dateFrom: string;
    dateTo: string;
  };
}

export function EventFilters({ churchSlug, departments, eventTypes, filters }: EventFiltersProps) {
  return (
    <form method="get" className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <label htmlFor="q" className="mb-1 block text-sm font-medium text-gray-700">
            Search
          </label>
          <input
            id="q"
            name="q"
            defaultValue={filters.q}
            placeholder="Title, description, location, event type"
            className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="status" className="mb-1 block text-sm font-medium text-gray-700">
            Status
          </label>
          <select
            id="status"
            name="status"
            defaultValue={filters.status}
            className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All</option>
            <option value="scheduled">Scheduled</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <div>
          <label htmlFor="eventType" className="mb-1 block text-sm font-medium text-gray-700">
            Event Type
          </label>
          <select
            id="eventType"
            name="eventType"
            defaultValue={filters.eventType}
            className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All types</option>
            {eventTypes.map((type) => (
              <option key={type} value={type}>
                {type.replaceAll("_", " ")}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="departmentId" className="mb-1 block text-sm font-medium text-gray-700">
            Department
          </label>
          <select
            id="departmentId"
            name="departmentId"
            defaultValue={filters.departmentId}
            className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All departments</option>
            {departments.map((department) => (
              <option key={department.id} value={department.id}>
                {department.name}
                {department.code ? ` (${department.code})` : ""}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="dateFrom" className="mb-1 block text-sm font-medium text-gray-700">
            From
          </label>
          <input
            id="dateFrom"
            name="dateFrom"
            type="date"
            defaultValue={filters.dateFrom}
            className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="dateTo" className="mb-1 block text-sm font-medium text-gray-700">
            To
          </label>
          <input
            id="dateTo"
            name="dateTo"
            type="date"
            defaultValue={filters.dateTo}
            className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="submit"
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          Apply Filters
        </button>
        <Link
          href={`/c/${churchSlug}/events`}
          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
        >
          Reset
        </Link>
      </div>
    </form>
  );
}
