"use client";

import { useActionState, useEffect, useRef } from "react";
import type { ActionState, ChurchEventRecord } from "../types";

interface EventFormProps {
  churchSlug: string;
  action: (prevState: ActionState | null, formData: FormData) => Promise<ActionState>;
  departments: Array<{ id: string; name: string; code: string | null; is_active: boolean }>;
  eventTypes: string[];
  initialValues?: ChurchEventRecord | null;
  submitLabel?: string;
}

const initialState: ActionState = { ok: false };

function toLocalDateTimeInput(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return formatDateToLocalInput(date);
}

function formatDateToLocalInput(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function addDaysToLocalInput(value: string, days: number) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  date.setDate(date.getDate() + days);
  return formatDateToLocalInput(date);
}

export function EventForm({
  churchSlug,
  action,
  departments,
  eventTypes,
  initialValues,
  submitLabel = "Save Event",
}: EventFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const formRef = useRef<HTMLFormElement | null>(null);

  const selectedDepartmentIds = new Set(
    ((initialValues as any)?.departments ?? []).map((item: any) => item.id)
  );

  useEffect(() => {
    if (!state?.ok) return;
    if (initialValues) return;

    const form = formRef.current;
    if (!form) return;

    const createAnother = form.querySelector<HTMLInputElement>('input[name="create_another"]');
    if (!createAnother?.checked) return;

    const rememberedEventType =
      form.querySelector<HTMLSelectElement>('select[name="event_type"]')?.value ?? "";

    const rememberedStatus =
      form.querySelector<HTMLSelectElement>('select[name="status"]')?.value ?? "scheduled";

    const rememberedLocation =
      form.querySelector<HTMLInputElement>('input[name="location"]')?.value ?? "";

    const rememberedAllDay =
      form.querySelector<HTMLInputElement>('input[name="is_all_day"]')?.checked ?? false;

    const rememberedDepartmentIds = Array.from(
      form.querySelectorAll<HTMLInputElement>('input[name="department_ids"]:checked')
    ).map((input) => input.value);

    const previousStart =
      form.querySelector<HTMLInputElement>('input[name="start_datetime"]')?.value ?? "";

    const previousEnd =
      form.querySelector<HTMLInputElement>('input[name="end_datetime"]')?.value ?? "";

    form.reset();

    const titleInput = form.querySelector<HTMLInputElement>('input[name="title"]');
    if (titleInput) titleInput.value = "";

    const descriptionInput = form.querySelector<HTMLTextAreaElement>('textarea[name="description"]');
    if (descriptionInput) descriptionInput.value = "";

    const startInput = form.querySelector<HTMLInputElement>('input[name="start_datetime"]');
    if (startInput) startInput.value = addDaysToLocalInput(previousStart, 1);

    const endInput = form.querySelector<HTMLInputElement>('input[name="end_datetime"]');
    if (endInput) endInput.value = addDaysToLocalInput(previousEnd, 1);

    const eventTypeSelect = form.querySelector<HTMLSelectElement>('select[name="event_type"]');
    if (eventTypeSelect) eventTypeSelect.value = rememberedEventType;

    const statusSelect = form.querySelector<HTMLSelectElement>('select[name="status"]');
    if (statusSelect) statusSelect.value = rememberedStatus;

    const locationInput = form.querySelector<HTMLInputElement>('input[name="location"]');
    if (locationInput) locationInput.value = rememberedLocation;

    const allDayCheckbox = form.querySelector<HTMLInputElement>('input[name="is_all_day"]');
    if (allDayCheckbox) allDayCheckbox.checked = rememberedAllDay;

    const departmentCheckboxes = form.querySelectorAll<HTMLInputElement>('input[name="department_ids"]');
    departmentCheckboxes.forEach((checkbox) => {
      checkbox.checked = rememberedDepartmentIds.includes(checkbox.value);
    });

    createAnother.checked = true;
  }, [state, initialValues]);

  return (
    <form ref={formRef} action={formAction} className="space-y-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <input type="hidden" name="churchSlug" value={churchSlug} />
      {initialValues ? <input type="hidden" name="eventId" value={initialValues.id} /> : null}

      <div className="grid gap-6 md:grid-cols-2">
        <div className="md:col-span-2">
          <label htmlFor="title" className="mb-1 block text-sm font-medium text-gray-700">
            Event Title
          </label>
          <input
            id="title"
            name="title"
            defaultValue={initialValues?.title ?? ""}
            required
            className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="event_type" className="mb-1 block text-sm font-medium text-gray-700">
            Event Type
          </label>
          <select
            id="event_type"
            name="event_type"
            defaultValue={initialValues?.event_type ?? ""}
            required
            className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select type</option>
            {(eventTypes ?? []).map((type) => (
              <option key={type} value={type}>
                {type.replaceAll("_", " ")}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="location" className="mb-1 block text-sm font-medium text-gray-700">
            Location
          </label>
          <input
            id="location"
            name="location"
            defaultValue={initialValues?.location ?? ""}
            className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Departments
          </label>
          <div className="grid gap-2 rounded-md border border-gray-300 p-3 md:grid-cols-2 xl:grid-cols-3">
            {(departments ?? [])
              .filter((item) => item.is_active || (selectedDepartmentIds ?? new Set()).has(item.id))
              .map((department) => (
                <label key={department.id} className="flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    name="department_ids"
                    value={department.id}
                    defaultChecked={(selectedDepartmentIds ?? new Set()).has(department.id)}
                  />
                  <span>
                    {department.name}
                    {department.code ? ` (${department.code})` : ""}
                  </span>
                </label>
              ))}
          </div>
        </div>

        <div>
          <label htmlFor="status" className="mb-1 block text-sm font-medium text-gray-700">
            Status
          </label>
          <select
            id="status"
            name="status"
            defaultValue={initialValues?.status ?? "scheduled"}
            className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="scheduled">Scheduled</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <div className="md:col-span-2 grid gap-6 md:grid-cols-2">
          <div>
            <label htmlFor="start_datetime" className="mb-1 block text-sm font-medium text-gray-700">
              Start
            </label>
            <input
              id="start_datetime"
              name="start_datetime"
              type="datetime-local"
              defaultValue={toLocalDateTimeInput(initialValues?.start_datetime)}
              required
              className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="end_datetime" className="mb-1 block text-sm font-medium text-gray-700">
              End
            </label>
            <input
              id="end_datetime"
              name="end_datetime"
              type="datetime-local"
              defaultValue={toLocalDateTimeInput(initialValues?.end_datetime)}
              required
              className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="md:col-span-2 flex flex-wrap gap-3">
          <label className="inline-flex items-center gap-2 rounded-md border border-gray-300 px-3 py-2">
            <input
              type="checkbox"
              name="is_all_day"
              value="true"
              defaultChecked={initialValues?.is_all_day ?? false}
            />
            <span className="text-sm text-gray-700">All day event</span>
          </label>

          {!initialValues ? (
            <label className="inline-flex items-center gap-2 rounded-md border border-blue-300 bg-blue-50 px-3 py-2">
              <input
                type="checkbox"
                name="create_another"
                value="true"
                defaultChecked
              />
              <span className="text-sm text-blue-800">Create another event after save</span>
            </label>
          ) : null}
        </div>

                {!initialValues ? (
          <div className="md:col-span-2 grid gap-4 rounded-lg border border-amber-200 bg-amber-50 p-4 md:grid-cols-3">
            <label className="inline-flex items-center gap-2 rounded-md border border-amber-300 bg-white px-3 py-2">
              <input
                type="checkbox"
                name="is_recurring"
                value="true"
              />
              <span className="text-sm text-amber-900">Create recurring template</span>
            </label>

            <div>
              <label htmlFor="recurring_frequency" className="mb-1 block text-sm font-medium text-gray-700">
                Frequency
              </label>
              <select
                id="recurring_frequency"
                name="recurring_frequency"
                defaultValue="weekly"
                className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
              </select>
            </div>

            <div>
              <label htmlFor="recurring_count" className="mb-1 block text-sm font-medium text-gray-700">
                Repeat Count
              </label>
              <input
                id="recurring_count"
                name="recurring_count"
                type="number"
                min="1"
                max="52"
                defaultValue="1"
                className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        ) : null}
        <div className="md:col-span-2">
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            rows={4}
            defaultValue={initialValues?.description ?? ""}
            className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {state?.error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </div>
      ) : null}

      {state?.ok && state?.message ? (
        <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
          {state.message}
        </div>
      ) : null}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {pending ? "Saving..." : submitLabel}
        </button>
      </div>
    </form>
  );
}






