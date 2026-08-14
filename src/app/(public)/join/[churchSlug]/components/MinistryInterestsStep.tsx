import { Check } from "lucide-react";
import type { PublicRegistrationPageData } from "@/features/member-registration/public-queries";

type MinistryInterestsStepProps = {
  departments: PublicRegistrationPageData["departments"];
  selectedIds: string[];
  onToggle: (id: string) => void;
  settings: PublicRegistrationPageData["settings"];
};

export function MinistryInterestsStep({ departments, selectedIds, onToggle, settings }: MinistryInterestsStepProps) {
  if (!settings.collectDepartmentInterests) {
    return (
      <div className="py-8 text-center text-sm text-stone-500">
        Department interests are not being collected at this time.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-stone-900">Ministry Interests</h2>
        <p className="text-sm text-stone-600">Select the ministries you are interested in. This is for interest only.</p>
      </div>

      {departments.length === 0 && (
        <div className="rounded-xl border border-dashed border-stone-300 bg-stone-50 p-6 text-center text-sm text-stone-500">
          No ministries are available at this time.
        </div>
      )}

      <div className="grid gap-3">
        {departments.map(dept => {
          const selected = selectedIds.includes(dept.id);
          return (
            <button
              key={dept.id}
              type="button"
              onClick={() => onToggle(dept.id)}
              className={`flex min-h-14 items-center justify-between gap-3 rounded-xl border p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2 ${
                selected
                  ? "border-emerald-300 bg-emerald-50/50"
                  : "border-stone-200 bg-white hover:border-emerald-200"
              }`}
            >
              <span className="text-sm font-medium text-stone-800">{dept.department_name}</span>
              {selected && <Check className="size-5 text-emerald-700" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
