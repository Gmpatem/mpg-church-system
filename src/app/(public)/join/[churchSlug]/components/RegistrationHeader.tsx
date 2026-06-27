import { Church } from "lucide-react";

type RegistrationHeaderProps = {
  church: { name: string; logo_url: string | null };
  currentStep: string;
};

export function RegistrationHeader({ church, currentStep }: RegistrationHeaderProps) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:gap-4 sm:p-5">
      <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800 sm:size-12">
        {church.logo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={church.logo_url} alt="" className="size-8 rounded-lg object-contain" />
        ) : (
          <Church className="size-5 sm:size-6" />
        )}
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-stone-900">{church.name}</p>
        <h1 className="text-lg font-semibold text-stone-900 sm:text-xl">Member registration</h1>
        <p className="mt-1 text-sm leading-5 text-stone-600">
          {currentStep}
        </p>
      </div>
    </div>
  );
}
