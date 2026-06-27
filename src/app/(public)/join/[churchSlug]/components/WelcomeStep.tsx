import { ArrowRight } from "lucide-react";
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
    <div className="space-y-5 py-3 text-center sm:space-y-6 sm:py-6">
      <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-800 sm:size-16">
        <span className="text-xl font-bold sm:text-2xl">{church.name.charAt(0)}</span>
      </div>

      <div>
        <h2 className="text-xl font-semibold text-stone-900 sm:text-2xl">Welcome to {church.name}</h2>
        <p className="mt-2 text-sm leading-6 text-stone-600">
          {settings.welcomeMessage ||
            "We're glad you're here. Please take a few minutes to tell us about yourself and your family."}
        </p>
      </div>

      <div className="rounded-xl bg-stone-50 p-4 text-left text-sm text-stone-600">
        <p className="font-medium text-stone-800">What to expect</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>A few questions about you and your household</li>
          <li>Your ministry interests</li>
          <li>Create your Member Portal login for use after approval</li>
          <li>Your submission will be reviewed by the church office</li>
        </ul>
      </div>

      <button
        type="button"
        onClick={onNext}
        className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-800 px-6 text-base font-semibold text-white transition hover:bg-emerald-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2 sm:text-sm"
      >
        {t.common?.start || "Start"}
        <ArrowRight className="size-4" />
      </button>
    </div>
  );
}
