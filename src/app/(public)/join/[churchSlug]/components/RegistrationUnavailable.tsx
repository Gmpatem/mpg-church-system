import { Church } from "lucide-react";

export function RegistrationUnavailable({
  church,
  hasKey,
}: {
  church: { name: string };
  hasKey: boolean;
}) {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-2xl items-center px-4 py-10 sm:px-6">
      <div className="w-full rounded-3xl border border-stone-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-stone-100 text-stone-500">
          <Church className="size-6" />
        </div>
        <h1 className="mt-4 text-xl font-semibold text-stone-900">Registration unavailable</h1>
        <p className="mt-2 text-sm text-stone-600">
          {hasKey
            ? `Public registration is currently disabled for ${church.name}. Please contact the church office for assistance.`
            : `This registration link appears to be incomplete. Please use the full link provided by ${church.name}.`}
        </p>
      </div>
    </div>
  );
}
