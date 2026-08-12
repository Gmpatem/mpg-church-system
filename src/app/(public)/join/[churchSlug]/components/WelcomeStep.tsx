import { ArrowRight, Church, ShieldCheck, UsersRound } from "lucide-react";
import { useI18n } from "@/features/i18n";
import type { PublicRegistrationPageData } from "@/features/member-registration/public-queries";

type WelcomeStepProps = {
  church: NonNullable<PublicRegistrationPageData["church"]>;
  settings: PublicRegistrationPageData["settings"];
  onNext: () => void;
};

export function WelcomeStep({ church, settings, onNext }: WelcomeStepProps) {
  const { t } = useI18n();

  return (
    <div className="flex min-h-[560px] flex-col justify-between gap-8 py-4 text-center">
      <div className="flex flex-col items-center gap-5">
        <div className="flex flex-col items-center gap-3">
          <div className="flex size-20 items-center justify-center rounded-[24px] bg-emerald-900 text-amber-300 shadow-lg shadow-emerald-950/15">
            <Church className="size-10" aria-hidden="true" />
          </div>
          <div>
            <p className="text-2xl font-semibold tracking-[0.18em] text-emerald-950">GRACE</p>
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-stone-500">
              Community Church
            </p>
          </div>
        </div>

        <div>
          <h2 className="text-3xl font-semibold text-emerald-950">Welcome</h2>
          <p className="mt-2 text-base font-semibold text-amber-700">We&apos;re glad you&apos;re here!</p>
          <p className="mx-auto mt-5 max-w-sm text-sm leading-7 text-stone-700">
            {settings.welcomeMessage ||
              "Register yourself or your household so the church office can review and add you properly."}
          </p>
        </div>
      </div>

      <div className="relative mx-auto w-full max-w-sm overflow-hidden rounded-[28px] bg-emerald-50 p-5 text-left">
        <div className="absolute -right-8 -top-8 size-24 rounded-full bg-amber-200/50" aria-hidden="true" />
        <div className="absolute -bottom-10 left-8 size-28 rounded-full bg-emerald-200/60" aria-hidden="true" />
        <div className="relative grid gap-3">
          <div className="flex items-center gap-3 rounded-2xl bg-white/80 p-3 shadow-sm">
            <UsersRound className="size-5 text-emerald-900" aria-hidden="true" />
            <span className="text-sm font-medium text-stone-800">Register your household together</span>
          </div>
          <div className="flex items-center gap-3 rounded-2xl bg-white/80 p-3 shadow-sm">
            <ShieldCheck className="size-5 text-emerald-900" aria-hidden="true" />
            <span className="text-sm font-medium text-stone-800">Reviewed by the church office</span>
          </div>
        </div>
      </div>

      <div className="grid gap-3">
        <button
          type="button"
          onClick={onNext}
          className="inline-flex h-12 min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-800 px-6 text-base font-semibold text-white shadow-lg shadow-emerald-950/15 transition hover:bg-emerald-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2"
        >
          {t.common?.start || "Start Registration"}
          <ArrowRight className="size-5" aria-hidden="true" />
        </button>
        <p className="text-sm text-stone-600">
          Already registered? <a href="/login" className="font-semibold text-amber-700">Login</a>
        </p>
      </div>
    </div>
  );
}
