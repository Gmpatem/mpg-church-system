import Link from "next/link";
import type { ReactNode } from "react";
import { CheckCircle2, Clock3, LogOut, MailCheck } from "lucide-react";
import { logoutAction } from "@/features/auth/actions";

export default function RegistrationPendingPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-[#faf8f3] px-4 py-6 sm:py-10">
      <div className="w-full max-w-md rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-start gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800">
            <CheckCircle2 className="size-6" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-emerald-800">Registration submitted</p>
            <h1 className="mt-1 text-2xl font-semibold text-stone-900">
              Awaiting church approval
            </h1>
          </div>
        </div>

        <p className="mt-4 text-sm leading-6 text-stone-600">
          Your Member Portal account has been created or requested. Portal access stays locked until the church office approves your registration.
        </p>

        <div className="mt-5 space-y-3">
          <StatusRow
            icon={<MailCheck className="size-4" />}
            title="Email confirmation"
            description="If you receive a confirmation email, open it to verify your address."
          />
          <StatusRow
            icon={<Clock3 className="size-4" />}
            title="Church approval"
            description="The church office reviews your registration before portal access is activated."
          />
        </div>

        <div className="mt-6 grid gap-3">
          <Link
            href="/login?redirect=/registration-pending"
            className="inline-flex h-12 items-center justify-center rounded-xl bg-emerald-800 px-5 text-base font-semibold text-white transition hover:bg-emerald-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2 sm:text-sm"
          >
            Sign in
          </Link>
          <form action={logoutAction}>
            <button
              type="submit"
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-stone-200 bg-white px-5 text-base font-semibold text-stone-700 transition hover:bg-stone-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-400 focus-visible:ring-offset-2 sm:text-sm"
            >
              <LogOut className="size-4" />
              Sign out
            </button>
          </form>
          <Link
            href="/"
            className="inline-flex h-11 items-center justify-center rounded-xl px-5 text-sm font-medium text-stone-600 transition hover:bg-stone-50"
          >
            Return home
          </Link>
        </div>
      </div>
    </main>
  );
}

function StatusRow({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-3 rounded-xl border border-stone-100 bg-stone-50 p-3">
      <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-white text-emerald-800">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-stone-900">{title}</p>
        <p className="mt-1 text-sm leading-5 text-stone-600">{description}</p>
      </div>
    </div>
  );
}
