import { CheckCircle2 } from "lucide-react";
import type { PublicRegistrationPageData } from "@/features/member-registration/public-queries";

type RegistrationSuccessProps = {
  church: NonNullable<PublicRegistrationPageData["church"]>;
  settings: PublicRegistrationPageData["settings"];
};

export function RegistrationSuccess({ church, settings }: RegistrationSuccessProps) {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 py-10 text-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-800">
        <CheckCircle2 className="size-8" />
      </div>
      <h1 className="mt-5 text-2xl font-semibold text-stone-900">Thank you!</h1>
      <p className="mt-2 max-w-md text-sm text-stone-600">
        {settings.successMessage ||
          `Your registration has been submitted to ${church.name}. The church office will review it and follow up with you.`}
      </p>
      <p className="mt-6 text-xs text-stone-500">
        This submission does not create a login account. If you need portal access, ask your church admin for a secure invite.
      </p>
    </div>
  );
}
