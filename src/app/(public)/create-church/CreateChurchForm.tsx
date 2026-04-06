"use client";

import { useActionState } from "react";
import { createChurchAction } from "@/features/churches/actions";
import { CountrySelect } from "./components/CountrySelect";
import { TimezoneSelect } from "./components/TimezoneSelect";

export function CreateChurchForm() {
  const [state, formAction, isPending] = useActionState(createChurchAction, null);

  return (
    <form action={formAction} className="space-y-5">
      {state && !state.ok && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Church name <span className="text-red-500">*</span>
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            placeholder="e.g., Grace Community Church"
            className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="md:col-span-2">
          <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-1">
            Church slug <span className="text-red-500">*</span>
          </label>
          <input
            id="slug"
            name="slug"
            type="text"
            required
            placeholder="grace-community-church"
            className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="mt-1 text-xs text-gray-500">
            Lowercase letters, numbers, and hyphens only. Used in URLs like{" "}
            <code className="bg-gray-100 px-1 rounded">/c/your-church-slug</code>
          </p>
        </div>

        <div>
          <label htmlFor="default_language" className="block text-sm font-medium text-gray-700 mb-1">
            Default language
          </label>
          <select
            id="default_language"
            name="default_language"
            defaultValue="en"
            className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="en">English</option>
            <option value="fr">French</option>
          </select>
        </div>

        <div>
          <label htmlFor="timezone" className="block text-sm font-medium text-gray-700 mb-1">
            Timezone
          </label>
          <TimezoneSelect
            id="timezone"
            name="timezone"
            className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="mt-1 text-xs text-gray-500">
            Automatically detected based on your location
          </p>
        </div>

        <div>
          <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">
            Country
          </label>
          <CountrySelect
            id="country"
            name="country"
            className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
            City
          </label>
          <input
            id="city"
            name="city"
            type="text"
            placeholder="e.g., New York"
            className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-md bg-blue-600 px-4 py-2 text-white font-medium hover:bg-blue-700 disabled:opacity-50"
      >
        {isPending ? "Creating church..." : "Create Church"}
      </button>
    </form>
  );
}
