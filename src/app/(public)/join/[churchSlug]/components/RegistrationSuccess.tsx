import { CheckCircle2 } from "lucide-react";
import type { PublicRegistrationPageData } from "@/features/member-registration/public-queries";

type RegistrationSuccessProps = {
  church: NonNullable<PublicRegistrationPageData["church"]>;
  settings: PublicRegistrationPageData["settings"];
  accountSetupRequested?: boolean;
  accountSetupStatus?: string;
  loginIdentifierType?: string | null;
  loginEmail?: string | null;
  loginPhone?: string | null;
};

export function RegistrationSuccess({
  church,
  settings,
  accountSetupRequested,
  accountSetupStatus,
  loginIdentifierType,
  loginEmail,
  loginPhone,
}: RegistrationSuccessProps) {
  const needsEmailConfirmation = accountSetupStatus === "pending_email_confirmation";
  const needsPhoneVerification = accountSetupStatus === "pending_phone_verification";
  const loginIdentifier = loginIdentifierType === "phone" ? loginPhone : loginEmail;

  return (
    <div className="flex min-h-[70dvh] flex-col items-center justify-center px-2 py-8 text-center sm:px-4 sm:py-10">
      <div className="flex size-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 sm:size-16">
        <CheckCircle2 className="size-7 sm:size-8" />
      </div>
      <h1 className="mt-5 text-2xl font-semibold text-stone-900">
        Your registration was submitted.
      </h1>
      {accountSetupRequested ? (
        <>
          <p className="mt-2 max-w-md text-sm leading-6 text-stone-600">
            {needsEmailConfirmation
              ? "Please confirm your email address. Your Member Portal will become available after the church approves your registration."
              : needsPhoneVerification
                ? "Please verify your mobile number. Your Member Portal will become available after the church approves your registration."
                : `${church.name} is reviewing your submission. You can use the credentials you created, but Member Portal access will become available only after approval.`}
          </p>
          {loginIdentifier && (
            <p className="mt-4 break-all rounded-xl bg-stone-50 px-3 py-2 text-xs text-stone-600">
              Portal account requested for {loginIdentifier}.
            </p>
          )}
        </>
      ) : (
        <>
          <p className="mt-2 max-w-md text-sm leading-6 text-stone-600">
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
