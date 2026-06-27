import { Church } from "lucide-react";
import type { PublicRegistrationUnavailableReason } from "@/features/member-registration/public-queries";

export function RegistrationUnavailable({
  church,
  reason,
}: {
  church: { name: string } | null;
  reason: PublicRegistrationUnavailableReason;
}) {
  const officeName = church ? `${church.name} church office` : "the church office";
  const churchName = church?.name ?? "this church";
  const copy = getUnavailableCopy(reason, churchName, officeName);

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-2xl items-center px-4 py-10 sm:px-6">
      <div className="w-full rounded-3xl border border-stone-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-stone-100 text-stone-500">
          <Church className="size-6" />
        </div>
        <h1 className="mt-4 text-xl font-semibold text-stone-900">{copy.title}</h1>
        <p className="mt-2 text-sm leading-6 text-stone-600">{copy.message}</p>
      </div>
    </div>
  );
}

function getUnavailableCopy(
  reason: PublicRegistrationUnavailableReason,
  churchName: string,
  officeName: string
) {
  switch (reason) {
    case "missing_key":
      return {
        title: "Registration link incomplete",
        message: `This registration link is missing its secure key. Please use the full link provided by ${officeName}.`,
      };
    case "malformed_key":
    case "invalid_key":
      return {
        title: "Registration link invalid",
        message: `This registration link is invalid. Please request a new link from ${officeName}.`,
      };
    case "expired_key":
      return {
        title: "Registration link expired",
        message: `This registration link has expired or was replaced. Please request the latest registration link from ${officeName}.`,
      };
    case "registration_disabled":
      return {
        title: "Registration closed",
        message: `Public registration is currently closed for ${churchName}. Please contact ${officeName} for assistance.`,
      };
    case "church_inactive":
      return {
        title: "Church unavailable",
        message: `This church workspace is currently unavailable. Please contact ${officeName} for assistance.`,
      };
    case "configuration_error":
    default:
      return {
        title: "Registration temporarily unavailable",
        message: `We could not load the registration form. Please try again shortly or contact ${officeName}.`,
      };
  }
}
