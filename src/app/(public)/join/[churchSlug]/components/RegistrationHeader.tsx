import { Church } from "lucide-react";

export function RegistrationHeader({ church }: { church: { name: string; logo_url: string | null } }) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:p-6">
      <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800 sm:size-14">
        {church.logo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={church.logo_url} alt="" className="size-8 rounded-lg object-contain sm:size-10" />
        ) : (
          <Church className="size-6 sm:size-7" />
        )}
      </div>
      <div>
        <p className="text-xs font-medium text-stone-500 sm:text-sm">Public registration</p>
        <h1 className="text-lg font-semibold text-stone-900 sm:text-xl">{church.name}</h1>
      </div>
    </div>
  );
}
