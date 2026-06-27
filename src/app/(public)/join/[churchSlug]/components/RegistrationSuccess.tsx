import { CheckCircle2 } from "lucide-react";
import type { PublicRegistrationPageData } from "@/features/member-registration/public-queries";

type RegistrationSuccessProps = {
  church: NonNullable<PublicRegistrationPageData["church"]>;
  settings: PublicRegistrationPageData["settings"];
  accountSetupRequested?: boolean;
  accountSetupStatus?: string;
  loginEmail?: string | null;
};

export function RegistrationSuccess({
  church,
  settings,
  accountSetupRequested,
  accountSetupStatus,
  loginEmail,
}: RegistrationSuccessProps) {
  const needsEmailConfirmation = accountSetupStatus === "pending_email_confirmation";

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 py-10 text-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-800">
        <CheckCircle2 className="size-8" />
      </div>
      <h1 className="mt-5 text-2xl font-semibold text-stone-900">
        Your registration was submitted.
      </h1>
      {accountSetupRequested ? (
        <>
          <p className="mt-2 max-w-md text-sm text-stone-600">
            {needsEmailConfirmation
              ? "Please confirm your email address. Your Member Portal will become available after the church approves your registration."
              : `${church.name} is reviewing your submission. You can use the email and password you created, but Member Portal access will become available only after approval.`}
          </p>
          {loginEmail && (
            <p className="mt-4 text-xs text-stone-500">
              Portal account requested for {loginEmail}.
            </p>
          )}
        </>
      ) : (
        <>
          <p className="mt-2 max-w-md text-sm text-stone-600">
            {settings.successMessage ||
              `Your registration has been submitted to ${church.name}. The church office will review it and follow up with you.`}
          </p>
          <p className="mt-6 text-xs text-stone-500">
            This submission did not create a login account. If you need portal access, ask your church admin for a secure invite.
          </p>
        </>
      )}
    </div>
  );
}
